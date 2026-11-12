import { describe, it, expect } from "bun:test";
import { compress } from "../../src/middlewares/compress";

function createMockContext(acceptEncoding = "gzip"): any {
	return {
		request: new Request("http://localhost/test", {
			headers: { "accept-encoding": acceptEncoding },
		}),
		store: {},
	};
}

describe("compress", () => {
	it("should compress responses with Accept-Encoding: gzip", async () => {
		const middleware = compress({ threshold: 10 });
		const ctx = createMockContext("gzip");

		// Create a large enough response body to exceed threshold
		const body = "x".repeat(100);
		const response = new Response(body, {
			headers: { "Content-Type": "text/plain", "Content-Length": "100" },
		});

		const result = await middleware(ctx, async () => response);
		expect(result).toBeInstanceOf(Response);
		expect(result.headers.get("Content-Encoding")).toBe("gzip");
		expect(result.headers.get("Vary")).toBe("Accept-Encoding");
	});

	it("should compress with brotli when preferred", async () => {
		const middleware = compress({ threshold: 10 });
		const ctx = createMockContext("br");

		const body = "x".repeat(100);
		const response = new Response(body, {
			headers: { "Content-Type": "text/plain", "Content-Length": "100" },
		});

		const result = await middleware(ctx, async () => response);
		expect(result.headers.get("Content-Encoding")).toBe("br");
	});

	it("should not compress if below threshold", async () => {
		const middleware = compress({ threshold: 1024 });
		const ctx = createMockContext("gzip");

		const body = "small";
		const response = new Response(body, {
			headers: { "Content-Type": "text/plain", "Content-Length": "5" },
		});

		const result = await middleware(ctx, async () => response);
		expect(result.headers.get("Content-Encoding")).toBeNull();
	});

	it("should compress large responses without a Content-Length header", async () => {
		const middleware = compress({ threshold: 10 });
		const ctx = createMockContext("gzip");

		const encoded = new TextEncoder().encode("x".repeat(100));
		const response = new Response(
			new ReadableStream({
				start(controller) {
					controller.enqueue(encoded);
					controller.close();
				},
			}),
			{ headers: { "Content-Type": "text/plain" } },
		);
		expect(response.headers.get("Content-Length")).toBeNull();

		const result = await middleware(ctx, async () => response);
		expect(result.headers.get("Content-Encoding")).toBe("gzip");
	});

	it("should not compress non-eligible content types", async () => {
		const middleware = compress({ threshold: 10 });
		const ctx = createMockContext("gzip");

		const body = "x".repeat(100);
		const response = new Response(body, {
			headers: {
				"Content-Type": "application/octet-stream",
				"Content-Length": "100",
			},
		});

		const result = await middleware(ctx, async () => response);
		expect(result.headers.get("Content-Encoding")).toBeNull();
	});

	it("should skip SSE responses", async () => {
		const middleware = compress({ threshold: 10 });
		const ctx = createMockContext("gzip");

		const response = new Response("data: test", {
			headers: { "Content-Type": "text/event-stream" },
		});

		const result = await middleware(ctx, async () => response);
		expect(result.headers.get("Content-Encoding")).toBeNull();
	});

	it("should skip if Content-Encoding already set", async () => {
		const middleware = compress({ threshold: 10 });
		const ctx = createMockContext("gzip");

		const body = "x".repeat(100);
		const response = new Response(body, {
			headers: {
				"Content-Type": "text/plain",
				"Content-Length": "100",
				"Content-Encoding": "identity",
			},
		});

		const result = await middleware(ctx, async () => response);
		expect(result.headers.get("Content-Encoding")).toBe("identity");
	});

	it("should skip if no Accept-Encoding", async () => {
		const middleware = compress({ threshold: 10 });
		const ctx = createMockContext("");

		const body = "x".repeat(100);
		const response = new Response(body, {
			headers: { "Content-Type": "text/plain", "Content-Length": "100" },
		});

		const result = await middleware(ctx, async () => response);
		expect(result.headers.get("Content-Encoding")).toBeNull();
	});
});
