import { describe, it, expect } from "bun:test";
import { Context } from "../src/context";

function makeCtx(
	url = "http://localhost/",
	headers?: Record<string, string>,
): Context {
	const req = new Request(url, { headers });
	return new Context(req, {}, {});
}

describe("Context missing methods", () => {
	describe("getCookie", () => {
		it("should parse single cookie", () => {
			const ctx = makeCtx("http://localhost/", {
				Cookie: "session=abc123",
			});
			expect(ctx.getCookie("session")).toBe("abc123");
		});

		it("should parse multiple cookies", () => {
			const ctx = makeCtx("http://localhost/", {
				Cookie: "session=abc123; theme=dark; lang=en",
			});
			expect(ctx.getCookie("session")).toBe("abc123");
			expect(ctx.getCookie("theme")).toBe("dark");
			expect(ctx.getCookie("lang")).toBe("en");
		});

		it("should return undefined for missing cookie", () => {
			const ctx = makeCtx("http://localhost/", {
				Cookie: "session=abc123",
			});
			expect(ctx.getCookie("missing")).toBeUndefined();
		});

		it("should decode URI-encoded values", () => {
			const ctx = makeCtx("http://localhost/", {
				Cookie: "name=hello%20world",
			});
			expect(ctx.getCookie("name")).toBe("hello world");
		});

		it("should handle cookies with leading spaces in value", () => {
			const ctx = makeCtx("http://localhost/", {
				Cookie: "name=value",
			});
			expect(ctx.getCookie("name")).toBe("value");
		});

		it("should return undefined when no Cookie header", () => {
			const ctx = makeCtx();
			expect(ctx.getCookie("anything")).toBeUndefined();
		});
	});

	describe("getCookies", () => {
		it("should return all cookies as object", () => {
			const ctx = makeCtx("http://localhost/", {
				Cookie: "a=1; b=2; c=3",
			});
			const cookies = ctx.getCookies();
			expect(cookies).toEqual({ a: "1", b: "2", c: "3" });
		});

		it("should return empty object when no cookies", () => {
			const ctx = makeCtx();
			expect(ctx.getCookies()).toEqual({});
		});

		it("should cache parsed cookies", () => {
			const ctx = makeCtx("http://localhost/", {
				Cookie: "x=1",
			});
			const first = ctx.getCookies();
			const second = ctx.getCookies();
			expect(first).toBe(second);
		});
	});

	describe("text()", () => {
		it("should return text response with status 200", () => {
			const ctx = makeCtx();
			const res = ctx.text("hello");
			expect(res.status).toBe(200);
		});

		it("should return text response with custom status", () => {
			const ctx = makeCtx();
			const res = ctx.text("error", 404);
			expect(res.status).toBe(404);
		});

		it("should set Content-Type to text/plain", () => {
			const ctx = makeCtx();
			const res = ctx.text("data", 400);
			expect(res.headers.get("Content-Type")).toBe(
				"text/plain; charset=utf-8",
			);
		});
	});

	describe("html()", () => {
		it("should return HTML response", () => {
			const ctx = makeCtx();
			const res = ctx.html("<h1>Hello</h1>");
			expect(res.status).toBe(200);
			expect(res.headers.get("Content-Type")).toBe(
				"text/html; charset=utf-8",
			);
		});

		it("should return HTML response with custom status", () => {
			const ctx = makeCtx();
			const res = ctx.html("<h1>Not Found</h1>", 404);
			expect(res.status).toBe(404);
		});
	});

	describe("redirect()", () => {
		it("should redirect with 302 by default", () => {
			const ctx = makeCtx();
			const res = ctx.redirect("https://example.com");
			expect(res.status).toBe(302);
			expect(res.headers.get("Location")).toBe("https://example.com");
		});

		it("should redirect with custom status", () => {
			const ctx = makeCtx();
			const res = ctx.redirect("https://example.com", 301);
			expect(res.status).toBe(301);
		});
	});

	describe("status()", () => {
		it("should return empty response with status code", () => {
			const ctx = makeCtx();
			const res = ctx.status(204);
			expect(res.status).toBe(204);
		});
	});

	describe("error()", () => {
		it("should return error response with default 400", () => {
			const ctx = makeCtx();
			const res = ctx.error("Bad Request");
			expect(res.status).toBe(400);
		});

		it("should return error response with custom status", () => {
			const ctx = makeCtx();
			const res = ctx.error("Not Found", 404);
			expect(res.status).toBe(404);
		});

		it("should include details in error response", async () => {
			const ctx = makeCtx();
			const res = ctx.error("Validation failed", 422, {
				field: "email",
			});
			const body = await res.json();
			expect(body.success).toBe(false);
			expect(body.message).toBe("Validation failed");
			expect(body.details).toEqual({ field: "email" });
		});
	});

	describe("success()", () => {
		it("should return success response with default 200", async () => {
			const ctx = makeCtx();
			const res = ctx.success({ id: 1 });
			expect(res.status).toBe(200);
			const body = await res.json();
			expect(body.success).toBe(true);
			expect(body.data).toEqual({ id: 1 });
		});

		it("should return success response with custom status", async () => {
			const ctx = makeCtx();
			const res = ctx.success({ id: 1 }, "Created", 201);
			expect(res.status).toBe(201);
		});
	});

	describe("paginate()", () => {
		it("should return paginated response", async () => {
			const ctx = makeCtx();
			const res = ctx.paginate([1, 2, 3], 10, 1, 3);
			expect(res.status).toBe(200);
			const body = await res.json();
			expect(body.meta.currentPage).toBe(1);
			expect(body.meta.perPage).toBe(3);
			expect(body.meta.total).toBe(10);
			expect(body.meta.lastPage).toBe(4);
			expect(body.meta.hasMore).toBe(true);
		});
	});

	describe("cursorPaginate()", () => {
		it("should return cursor-paginated response", async () => {
			const ctx = makeCtx();
			const res = ctx.cursorPaginate([1, 2], "cursor-abc");
			const body = await res.json();
			expect(body.meta.nextCursor).toBe("cursor-abc");
			expect(body.meta.hasMore).toBe(true);
		});

		it("should indicate no more results when cursor is null", async () => {
			const ctx = makeCtx();
			const res = ctx.cursorPaginate([1], null);
			const body = await res.json();
			expect(body.meta.hasMore).toBe(false);
		});
	});

	describe("htmlStream()", () => {
		it("should return streaming HTML response", async () => {
			const ctx = makeCtx();
			const res = ctx.htmlStream(
				(async function* () {
					yield "<h1>";
					yield "Hello";
					yield "</h1>";
				})(),
			);
			expect(res.status).toBe(200);
			expect(res.headers.get("Content-Type")).toBe(
				"text/html; charset=utf-8",
			);
		});
	});

	describe("query parsing", () => {
		it("should parse + as space", () => {
			const ctx = makeCtx("http://localhost/?q=hello+world");
			expect(ctx.query.q).toBe("hello world");
		});

		it("should handle key-only params (no =)", () => {
			const ctx = makeCtx("http://localhost/?flag");
			expect(ctx.query.flag).toBe("");
		});

		it("should handle empty query string", () => {
			const ctx = makeCtx("http://localhost/?");
			expect(ctx.query).toEqual({});
		});

		it("should decode URI-encoded values", () => {
			const ctx = makeCtx("http://localhost/?name=%E4%B8%AD%E6%96%87");
			expect(ctx.query.name).toBe("中文");
		});
	});

	describe("store", () => {
		it("should initialize empty store lazily", () => {
			const ctx = makeCtx();
			expect(ctx.store).toEqual({});
		});

		it("should allow setting and getting store values", () => {
			const ctx = makeCtx();
			ctx.store.user = { id: 1 };
			expect(ctx.store.user).toEqual({ id: 1 });
		});
	});

	describe("setValidated and valid", () => {
		it("should throw when valid() called without prior validation", () => {
			const ctx = makeCtx();
			expect(() => ctx.valid("body")).toThrow(
				'ctx.valid("body") called but no zValidator',
			);
		});

		it("should return validated data after setValidated", () => {
			const ctx = makeCtx();
			ctx.setValidated("body", { name: "test" });
			expect(ctx.valid("body")).toEqual({ name: "test" });
		});
	});

	describe("onAfterResponse", () => {
		it("should register after-response hooks", () => {
			const ctx = makeCtx();
			let hookCalled = false;
			ctx.onAfterResponse((res) => {
				hookCalled = true;
				return res;
			});
			expect(ctx._afterHooks).toHaveLength(1);
		});
	});
});
