import { describe, it, expect } from "bun:test";
import {
	requestId,
	uuid,
	shortId,
} from "../../src/middlewares/request-id";
import { Buntok } from "../../src/buntok";
import { logger } from "../../src/logger";

function createMockContext(existingId?: string): any {
	const headers: Record<string, string> = {};
	if (existingId) {
		headers["x-request-id"] = existingId;
	}
	return {
		request: new Request("http://localhost/test", { headers }),
		store: {},
	};
}

describe("requestId", () => {
	it("should generate and add request ID to response", async () => {
		const middleware = requestId();
		const ctx = createMockContext();

		const result = await middleware(ctx, async () => new Response("ok"));
		expect(result).toBeInstanceOf(Response);
		expect((result as Response).headers.get("x-request-id")).toBeDefined();
	});

	it("should use existing request ID from header", async () => {
		const middleware = requestId();
		const ctx = createMockContext("existing-id-123");

		const result = await middleware(ctx, async () => new Response("ok"));
		expect((result as Response).headers.get("x-request-id")).toBe(
			"existing-id-123",
		);
	});

	it("should replace malformed or oversized request IDs", async () => {
		const middleware = requestId();
		const ctx = createMockContext("bad id with spaces");

		const result = await middleware(ctx, async () => new Response("ok"));
		const id = (result as Response).headers.get("x-request-id");
		expect(id).toBeDefined();
		expect(id).not.toBe("bad id with spaces");
		expect(id).toMatch(/^[A-Za-z0-9._:-]{1,128}$/);
	});

	it("makes generated IDs available on the request for logging", async () => {
		const middleware = requestId({ generator: () => "generated-id" });
		const ctx = createMockContext();

		await middleware(ctx, async () => {
			expect(ctx.request.headers.get("x-request-id")).toBe("generated-id");
			return new Response("ok");
		});
	});

	it("should store request ID in ctx.store", async () => {
		const middleware = requestId();
		const ctx = createMockContext();

		await middleware(ctx, async () => new Response("ok"));
		expect(ctx.store.requestId).toBeDefined();
	});

	it("should use custom header name", async () => {
		const middleware = requestId({ header: "x-correlation-id" });
		const ctx = createMockContext();

		const result = await middleware(ctx, async () => new Response("ok"));
		expect(
			(result as Response).headers.get("x-correlation-id"),
		).toBeDefined();
	});

	it("should not store in ctx.store when disabled", async () => {
		const middleware = requestId({ store: false });
		const ctx = createMockContext();

		await middleware(ctx, async () => new Response("ok"));
		expect(ctx.store.requestId).toBeUndefined();
	});
});

describe("requestId integration (full app)", () => {
	// Regression: pipelines normalize the handler result before the
	// middleware chain sees it - `result instanceof Response` mutations used
	// to be skipped for raw string/object returns when request logging was
	// off (the response-header echo only exists on the logging path).
	const withLoggingOff = async (run: () => Promise<void>) => {
		const prev = (logger as unknown as { _logRequests?: boolean })
			._logRequests;
		(logger as unknown as { _logRequests?: boolean })._logRequests = false;
		try {
			await run();
		} finally {
			(
				logger as unknown as { _logRequests?: boolean }
			)._logRequests = prev;
		}
	};

	it("sets the response header for raw string/object handlers when logging is off", async () => {
		await withLoggingOff(async () => {
			const app = new Buntok({ handleSignals: false });
			app.use(requestId());
			app.get("/text", () => "ok");
			app.get("/json", (ctx) => ctx.json({ a: 1 }));
			app.listen(0);
			const port = app.server?.port;

			const text = await fetch(`http://localhost:${port}/text`);
			expect(text.status).toBe(200);
			expect(text.headers.get("x-request-id")).toBeTruthy();
			expect(await text.text()).toBe("ok");

			const json = await fetch(`http://localhost:${port}/json`);
			expect(json.status).toBe(200);
			expect(json.headers.get("x-request-id")).toBeTruthy();

			await app.close();
		});
	});

	it("sets the response header when used as route middleware", async () => {
		await withLoggingOff(async () => {
			const app = new Buntok({ handleSignals: false });
			app.get("/x", requestId(), () => "ok");
			app.listen(0);

			const res = await fetch(`http://localhost:${app.server?.port}/x`);
			expect(res.status).toBe(200);
			expect(res.headers.get("x-request-id")).toBeTruthy();
			expect(await res.text()).toBe("ok");

			await app.close();
		});
	});

	it("honors an inbound x-request-id end to end when logging is off", async () => {
		await withLoggingOff(async () => {
			const app = new Buntok({ handleSignals: false });
			app.use(requestId());
			app.get("/text", () => "ok");
			app.listen(0);

			const res = await fetch(`http://localhost:${app.server?.port}/text`, {
				headers: { "x-request-id": "inbound-123" },
			});
			expect(res.headers.get("x-request-id")).toBe("inbound-123");

			await app.close();
		});
	});
});

describe("uuid", () => {
	it("should generate valid UUID format", () => {
		const id = uuid();
		expect(id).toMatch(
			/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
		);
	});

	it("should generate unique IDs", () => {
		const ids = new Set(Array.from({ length: 100 }, () => uuid()));
		expect(ids.size).toBe(100);
	});
});

describe("shortId", () => {
	it("should generate 8-character ID", () => {
		expect(shortId()).toHaveLength(8);
	});

	it("should only contain alphanumeric chars", () => {
		expect(shortId()).toMatch(/^[a-f0-9]+$/);
	});
});
