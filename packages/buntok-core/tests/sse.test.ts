import { describe, expect, it, beforeEach, afterEach } from "bun:test";
import { SSE, SSEBroadcaster, createSSE } from "../src/sse";

describe("SSE", () => {
	let sse: SSE;
	let request: Request;

	beforeEach(() => {
		request = new Request("http://localhost:3000/events");
		sse = new SSE(request);
	});

	afterEach(() => {
		if (sse.isConnected) {
			sse.close();
		}
	});

	it("should create SSE response with correct headers", () => {
		const response = sse.connect();

		expect(response.status).toBe(200);
		expect(response.headers.get("Content-Type")).toBe("text/event-stream; charset=utf-8");
		expect(response.headers.get("Cache-Control")).toBe("no-cache, no-transform");
		expect(response.headers.get("Connection")).toBe("keep-alive");
		expect(response.headers.get("X-Accel-Buffering")).toBe("no");
	});

	it("should read Last-Event-ID header", () => {
		const requestWithId = new Request("http://localhost:3000/events", {
			headers: { "Last-Event-ID": "123" },
		});
		const sseWithId = new SSE(requestWithId);

		expect(sseWithId.getLastEventId()).toBe("123");
	});

	it("should return null for missing Last-Event-ID", () => {
		expect(sse.getLastEventId()).toBeNull();
	});

	it("should track active connections", () => {
		const initialCount = SSE.activeConnections;
		const response = sse.connect();

		expect(SSE.activeConnections).toBe(initialCount + 1);

		sse.close();
		expect(SSE.activeConnections).toBe(initialCount);
	});

	it("should return 503 when maxConnections exceeded", () => {
		// Close any existing connections first
		for (const conn of SSE.getActiveConnections()) {
			conn.close();
		}

		const sse1 = new SSE(request, { maxConnections: 1 });
		const sse2 = new SSE(request, { maxConnections: 1 });

		sse1.connect(); // First connection

		const response = sse2.connect(); // Should be rejected
		expect(response.status).toBe(503);

		sse1.close();
	});

	it("should send heartbeat at the configured interval", async () => {
		const sseHb = new SSE(new Request("http://localhost:3000/events"), {
			sendInitial: false,
			retry: 3000,
			heartbeatInterval: 15,
		});
		const response = sseHb.connect();
		const reader = response.body!.getReader();
		const decoder = new TextDecoder();
		let text = "";
		const deadline = Date.now() + 500;
		while (Date.now() < deadline) {
			const { value, done } = await reader.read();
			if (done) break;
			text += decoder.decode(value);
			if (text.includes(": heartbeat")) break;
		}

		expect(text).toContain(": heartbeat");

		await reader.cancel().catch(() => {});
		sseHb.close();
	});

	it("should not start a heartbeat when heartbeatInterval is 0", async () => {
		const sseNoHb = new SSE(new Request("http://localhost:3000/events"), {
			sendInitial: false,
			heartbeatInterval: 0,
		});
		const response = sseNoHb.connect();
		const reader = response.body!.getReader();

		// Drain the initial retry frame, then wait past any potential heartbeat
		await reader.read().catch(() => {});
		const raced = await Promise.race([
			reader.read().then(() => "data"),
			new Promise((resolve) => setTimeout(() => resolve("timeout"), 60)),
		]);
		expect(raced).toBe("timeout");

		await reader.cancel().catch(() => {});
		sseNoHb.close();
	});

	it("should call onReconnect on reconnection", async () => {
		let called = false;
		let lastId = "";

		const requestWithId = new Request("http://localhost:3000/events", {
			headers: { "Last-Event-ID": "456" },
		});

		const sseWithReconnect = new SSE(requestWithId, {
			onReconnect: async (id) => {
				called = true;
				lastId = id;
				return [{ id: "457", data: "replayed" }];
			},
		});

		const response = sseWithReconnect.connect();
		await new Promise((r) => setTimeout(r, 10));

		expect(called).toBe(true);
		expect(lastId).toBe("456");

		sseWithReconnect.close();
	});
});

describe("SSEBroadcaster", () => {
	let broadcaster: SSEBroadcaster;

	beforeEach(() => {
		broadcaster = new SSEBroadcaster();
	});

	it("should add and track connections", () => {
		const request = new Request("http://localhost:3000/events");
		const sse = new SSE(request);
		sse.connect();

		broadcaster.add(sse);
		expect(broadcaster.size).toBe(1);

		broadcaster.remove(sse);
		expect(broadcaster.size).toBe(0);

		sse.close();
	});

	it("should broadcast to all clients", () => {
		const request = new Request("http://localhost:3000/events");
		const sse = new SSE(request);
		sse.connect();

		broadcaster.add(sse);

		// Should not throw
		broadcaster.broadcast("test", "data");

		broadcaster.remove(sse);
		sse.close();
	});

	it("should broadcast where predicate matches", () => {
		const request = new Request("http://localhost:3000/events");
		const sse = new SSE(request);
		sse.connect();

		broadcaster.add(sse);

		// Should not throw
		broadcaster.broadcastWhere(() => true, "test", "data");
		broadcaster.broadcastWhere(() => false, "test", "data");

		broadcaster.remove(sse);
		sse.close();
	});

	it("should check isEmpty", () => {
		expect(broadcaster.isEmpty).toBe(true);

		const request = new Request("http://localhost:3000/events");
		const sse = new SSE(request);
		sse.connect();

		broadcaster.add(sse);
		expect(broadcaster.isEmpty).toBe(false);

		broadcaster.remove(sse);
		sse.close();
		expect(broadcaster.isEmpty).toBe(true);
	});

	it("should close all connections", () => {
		const request = new Request("http://localhost:3000/events");
		const sse = new SSE(request);
		sse.connect();

		broadcaster.add(sse);
		broadcaster.closeAll();

		expect(broadcaster.size).toBe(0);
		expect(sse.isConnected).toBe(false);
	});
});

describe("createSSE", () => {
	it("should create SSE instance", () => {
		const request = new Request("http://localhost:3000/events");
		const sse = createSSE(request);

		expect(sse).toBeInstanceOf(SSE);
	});

	it("should create SSE with options", () => {
		const request = new Request("http://localhost:3000/events");
		const sse = createSSE(request, { retry: 5000 });

		const response = sse.connect();
		expect(response).toBeInstanceOf(Response);

		sse.close();
	});
});
