import { describe, it, expect, beforeEach } from "bun:test";
import { Buntok } from "../src/buntok";
import { Context } from "../src/context";
import {
	resolveOrigin,
	applyCorsHeaders,
	cors,
	type CorsOptions,
} from "../src/middlewares/cors";
import { BadRequestError, UnprocessableEntityError } from "../src/helpers/async-handler";

function createRequest(
	path = "/test",
	options?: RequestInit,
): Request {
	return new Request(`http://localhost${path}`, options);
}

describe("resolveOrigin", () => {
	it("should return * when no origin option is set", () => {
		const result = resolveOrigin("http://example.com", {});
		expect(result).toBe("*");
	});

	it("should return the configured string origin", () => {
		const result = resolveOrigin("http://example.com", {
			origin: "http://allowed.com",
		});
		expect(result).toBe("http://allowed.com");
	});

	it("should return request origin when it matches the array", () => {
		const result = resolveOrigin("http://example.com", {
			origin: ["http://example.com", "http://other.com"],
		});
		expect(result).toBe("http://example.com");
	});

	it("should return empty string when origin not in array", () => {
		const result = resolveOrigin("http://evil.com", {
			origin: ["http://example.com", "http://other.com"],
		});
		expect(result).toBe("");
	});

	it("should return request origin when function returns true", () => {
		const result = resolveOrigin("http://example.com", {
			origin: (origin) => origin.includes("example"),
		});
		expect(result).toBe("http://example.com");
	});

	it("should return empty string when function returns false", () => {
		const result = resolveOrigin("http://evil.com", {
			origin: (origin) => origin.includes("example"),
		});
		expect(result).toBe("");
	});
});

describe("applyCorsHeaders", () => {
	it("should set Access-Control-Allow-Origin header", () => {
		const response = new Response("ok");
		applyCorsHeaders(response, "http://example.com", { origin: "*" });
		expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
	});

	it("should set credentials header when enabled", () => {
		const response = new Response("ok");
		applyCorsHeaders(response, "http://example.com", {
			origin: "*",
			credentials: true,
		});
		expect(response.headers.get("Access-Control-Allow-Credentials")).toBe(
			"true",
		);
	});

	it("should not set credentials header when disabled", () => {
		const response = new Response("ok");
		applyCorsHeaders(response, "http://example.com", { origin: "*" });
		expect(response.headers.get("Access-Control-Allow-Credentials")).toBe(
			null,
		);
	});

	it("should restrict origin based on array config", () => {
		const response = new Response("ok");
		applyCorsHeaders(response, "http://evil.com", {
			origin: ["http://allowed.com"],
		});
		expect(response.headers.get("Access-Control-Allow-Origin")).toBe("");
	});
});

describe("cors middleware", () => {
	it("should add CORS headers to normal response", async () => {
		const middleware = cors({ origin: "http://example.com" });
		const req = new Request("http://localhost/test", {
			headers: { Origin: "http://example.com" },
		});
		const ctx = new Context(req, {});
		const next = async () => new Response("ok");

		const res = await middleware(ctx, next);

		expect(res.headers.get("Access-Control-Allow-Origin")).toBe(
			"http://example.com",
		);
	});

	it("should handle OPTIONS preflight request", async () => {
		const middleware = cors({
			origin: "http://example.com",
			methods: ["GET", "POST"],
			headers: ["Content-Type"],
			credentials: true,
		});
		const req = new Request("http://localhost/test", { method: "OPTIONS" });
		const ctx = new Context(req, {});
		const next = async () => new Response("ok");

		const res = await middleware(ctx, next);

		expect(res.status).toBe(204);
		expect(res.headers.get("Access-Control-Allow-Origin")).toBe(
			"http://example.com",
		);
		expect(res.headers.get("Access-Control-Allow-Methods")).toBe("GET,POST");
		expect(res.headers.get("Access-Control-Allow-Headers")).toBe(
			"Content-Type",
		);
		expect(res.headers.get("Access-Control-Allow-Credentials")).toBe("true");
	});
});

describe("app.cors()", () => {
	it("should be callable and return app instance", () => {
		const app = new Buntok();
		const result = app.cors({ origin: "http://example.com" });
		expect(result).toBe(app);
	});

	it("should add CORS middleware to the pipeline", async () => {
		const app = new Buntok();
		app.cors({ origin: "http://example.com" });
		app.get("/test", (ctx) => ctx.json({ ok: true }));

		const res = await app.request("/test", {
			headers: { Origin: "http://example.com" },
		});

		expect(res.headers.get("Access-Control-Allow-Origin")).toBe(
			"http://example.com",
		);
	});

	it("should handle OPTIONS preflight via app.cors()", async () => {
		const app = new Buntok();
		app.cors({
			origin: "http://example.com",
			methods: ["GET", "POST"],
			credentials: true,
		});
		app.get("/test", (ctx) => ctx.json({ ok: true }));

		const res = await app.request("/test", { method: "OPTIONS" });

		expect(res.status).toBe(204);
		expect(res.headers.get("Access-Control-Allow-Origin")).toBe(
			"http://example.com",
		);
		expect(res.headers.get("Access-Control-Allow-Methods")).toBe("GET,POST");
		expect(res.headers.get("Access-Control-Allow-Credentials")).toBe("true");
	});
});

describe("CORS on error responses", () => {
	it("should include CORS headers when handler throws BadRequestError (400)", async () => {
		const app = new Buntok();
		app.cors({
			origin: "http://example.com",
			credentials: true,
		});
		app.get("/bad", () => {
			throw new BadRequestError("invalid input");
		});

		const res = await app.request("/bad", {
			headers: { Origin: "http://example.com" },
		});

		expect(res.status).toBe(400);
		expect(res.headers.get("Access-Control-Allow-Origin")).toBe(
			"http://example.com",
		);
		expect(res.headers.get("Access-Control-Allow-Credentials")).toBe("true");
	});

	it("should include CORS headers when handler throws UnprocessableEntityError (422)", async () => {
		const app = new Buntok();
		app.cors({ origin: "http://example.com" });
		app.get("/unprocessable", () => {
			throw new UnprocessableEntityError("validation failed");
		});

		const res = await app.request("/unprocessable", {
			headers: { Origin: "http://example.com" },
		});

		expect(res.status).toBe(422);
		expect(res.headers.get("Access-Control-Allow-Origin")).toBe(
			"http://example.com",
		);
	});

	it("should include CORS headers when handler throws generic Error (500)", async () => {
		const app = new Buntok();
		app.cors({ origin: "http://example.com" });
		app.get("/crash", () => {
			throw new Error("unexpected");
		});

		const res = await app.request("/crash", {
			headers: { Origin: "http://example.com" },
		});

		expect(res.status).toBe(500);
		expect(res.headers.get("Access-Control-Allow-Origin")).toBe(
			"http://example.com",
		);
	});

	it("should include CORS headers on 404 not found response", async () => {
		const app = new Buntok();
		app.cors({ origin: "http://example.com" });

		const res = await app.request("/nonexistent", {
			headers: { Origin: "http://example.com" },
		});

		expect(res.status).toBe(404);
		expect(res.headers.get("Access-Control-Allow-Origin")).toBe(
			"http://example.com",
		);
	});

	it("should restrict origin on error responses based on config", async () => {
		const app = new Buntok();
		app.cors({ origin: ["http://allowed.com"] });
		app.get("/bad", () => {
			throw new BadRequestError("bad");
		});

		const res = await app.request("/bad", {
			headers: { Origin: "http://evil.com" },
		});

		expect(res.status).toBe(400);
		expect(res.headers.get("Access-Control-Allow-Origin")).toBe("");
	});

	it("should not add CORS headers when app.cors() is not used", async () => {
		const app = new Buntok();
		app.get("/bad", () => {
			throw new BadRequestError("bad");
		});

		const res = await app.request("/bad", {
			headers: { Origin: "http://example.com" },
		});

		expect(res.status).toBe(400);
		expect(res.headers.get("Access-Control-Allow-Origin")).toBeNull();
	});

	it("should work with custom error handler that throws", async () => {
		const app = new Buntok();
		app.cors({ origin: "http://example.com" });
		app.onError((err, ctx) => {
			return ctx.json(
				{ success: false, message: err.message },
				422,
			);
		});
		app.get("/custom-error", () => {
			throw new Error("custom error");
		});

		const res = await app.request("/custom-error", {
			headers: { Origin: "http://example.com" },
		});

		expect(res.status).toBe(422);
		expect(res.headers.get("Access-Control-Allow-Origin")).toBe(
			"http://example.com",
		);
	});

	it("should set credentials header on error responses", async () => {
		const app = new Buntok();
		app.cors({
			origin: "http://example.com",
			credentials: true,
		});
		app.get("/error", () => {
			throw new BadRequestError("bad");
		});

		const res = await app.request("/error", {
			headers: { Origin: "http://example.com" },
		});

		expect(res.status).toBe(400);
		expect(res.headers.get("Access-Control-Allow-Credentials")).toBe("true");
	});

	it("should work with function-based origin on error responses", async () => {
		const app = new Buntok();
		app.cors({
			origin: (origin) => origin.includes("trusted"),
		});
		app.get("/error", () => {
			throw new BadRequestError("bad");
		});

		const res = await app.request("/error", {
			headers: { Origin: "http://trusted.example.com" },
		});

		expect(res.status).toBe(400);
		expect(res.headers.get("Access-Control-Allow-Origin")).toBe(
			"http://trusted.example.com",
		);
	});

	it("should include CORS headers when handler returns a plain string", async () => {
		const app = new Buntok();
		app.cors({ origin: "http://example.com" });
		app.get("/text", () => "hello world");

		const res = await app.request("/text", {
			headers: { Origin: "http://example.com" },
		});

		expect(res.status).toBe(200);
		expect(res.headers.get("Access-Control-Allow-Origin")).toBe(
			"http://example.com",
		);
		expect(await res.text()).toBe("hello world");
	});

	it("should include CORS headers when handler returns a number", async () => {
		const app = new Buntok();
		app.cors({ origin: "http://example.com" });
		app.get("/number", () => 42);

		const res = await app.request("/number", {
			headers: { Origin: "http://example.com" },
		});

		expect(res.status).toBe(200);
		expect(res.headers.get("Access-Control-Allow-Origin")).toBe(
			"http://example.com",
		);
		expect(await res.text()).toBe("42");
	});

	it("should include CORS headers when handler returns null", async () => {
		const app = new Buntok();
		app.cors({ origin: "http://example.com" });
		app.get("/null", () => null);

		const res = await app.request("/null", {
			headers: { Origin: "http://example.com" },
		});

		expect(res.status).toBe(204);
		expect(res.headers.get("Access-Control-Allow-Origin")).toBe(
			"http://example.com",
		);
	});
});
