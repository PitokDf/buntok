import { describe, it, expect } from "bun:test";
import { Buntok } from "../src/buntok";
import { BadRequestError } from "../src/helpers/async-handler";
import { logger } from "../src/logger";

describe("ctx.set.headers (mutable response headers)", () => {
	it("merges user header into success response and overrides X-Powered-By", async () => {
		const app = new Buntok();
		app.enable("x-powered-by");
		app.get("/", (ctx) => {
			ctx.set.headers["x-powered-by"] = "benchmark";
			return "Hi";
		});

		const res = await app.request("/");
		expect(res.status).toBe(200);
		expect(res.headers.get("x-powered-by")).toBe("benchmark");
		expect(res.headers.get("x-powered-by")).not.toBe("buntok");
		expect(await res.text()).toBe("Hi");
	});

	it("keeps built-in X-Powered-By when handler does not touch ctx.set", async () => {
		const app = new Buntok();
		app.enable("x-powered-by");
		app.get("/", () => "Hi");

		const res = await app.request("/");
		expect(res.headers.get("x-powered-by")).toBe("buntok");
	});

	it("supports multiple headers and repeated ctx.set accesses", async () => {
		const app = new Buntok();
		app.get("/multi", (ctx) => {
			ctx.set.headers["x-a"] = "1";
			ctx.set.headers["x-b"] = "2";
			return { ok: true };
		});

		const res = await app.request("/multi");
		expect(res.headers.get("x-a")).toBe("1");
		expect(res.headers.get("x-b")).toBe("2");
		expect(await res.json()).toEqual({ ok: true });
	});

	it("applies headers on async handlers", async () => {
		const app = new Buntok();
		app.get("/async", async (ctx) => {
			ctx.set.headers["x-async"] = "yes";
			await Promise.resolve();
			return "done";
		});

		const res = await app.request("/async");
		expect(res.headers.get("x-async")).toBe("yes");
		expect(await res.text()).toBe("done");
	});

	it("applies headers when handler returns a Response instance", async () => {
		const app = new Buntok();
		app.get("/resp", (ctx) => {
			ctx.set.headers["x-resp"] = "1";
			return new Response("body", { status: 201 });
		});

		const res = await app.request("/resp");
		expect(res.status).toBe(201);
		expect(res.headers.get("x-resp")).toBe("1");
		expect(await res.text()).toBe("body");
	});

	it("keeps headers on error responses", async () => {
		const app = new Buntok();
		app.get("/err", (ctx) => {
			ctx.set.headers["x-trace"] = "t1";
			throw new BadRequestError("Data tidak valid");
		});

		const res = await app.request("/err");
		expect(res.status).toBe(400);
		expect(res.headers.get("x-trace")).toBe("t1");
	});

	it("keeps headers when handler rejects asynchronously", async () => {
		const app = new Buntok();
		app.get("/reject", async (ctx) => {
			ctx.set.headers["x-trace"] = "async";
			throw new BadRequestError("gagal");
		});

		const res = await app.request("/reject");
		expect(res.status).toBe(400);
		expect(res.headers.get("x-trace")).toBe("async");
	});

	it("applies headers set by per-route middleware", async () => {
		const app = new Buntok();
		app.get(
			"/mw",
			(ctx, next) => {
				ctx.set.headers["x-mw"] = "1";
				return next();
			},
			() => "ok",
		);

		const res = await app.request("/mw");
		expect(res.headers.get("x-mw")).toBe("1");
		expect(await res.text()).toBe("ok");
	});

	it("applies headers on 404 (custom notFound handler)", async () => {
		const app = new Buntok();
		app.notFound((ctx) => {
			ctx.set.headers["x-nf"] = "1";
			return ctx.json({ message: "tidak ada" }, 404);
		});

		const res = await app.request("/missing");
		expect(res.status).toBe(404);
		expect(res.headers.get("x-nf")).toBe("1");
	});

	it("applies headers on dynamic routes (fallback path)", async () => {
		const app = new Buntok();
		app.get("/id/:id", (ctx) => {
			ctx.set.headers["x-dyn"] = ctx.params.id;
			return "ok";
		});

		const res = await app.request("/id/42");
		expect(res.headers.get("x-dyn")).toBe("42");
		expect(await res.text()).toBe("ok");
	});

	it("works with destructured ({ set }) params", async () => {
		const app = new Buntok();
		app.get("/destr", ({ set }) => {
			set.headers["x-destr"] = "1";
			return "ok";
		});

		const res = await app.request("/destr");
		expect(res.headers.get("x-destr")).toBe("1");
		expect(await res.text()).toBe("ok");
	});

	it("works with aliased param name (c.set.headers)", async () => {
		const app = new Buntok();
		app.get("/alias", (c) => {
			c.set.headers["x-alias"] = "1";
			return "ok";
		});

		const res = await app.request("/alias");
		expect(res.headers.get("x-alias")).toBe("1");
	});

	it("coerces numeric header values to strings", async () => {
		const app = new Buntok();
		app.get("/num", (ctx) => {
			ctx.set.headers["x-num"] = 42;
			ctx.set.headers["retry-after"] = 120;
			return "ok";
		});

		const res = await app.request("/num");
		expect(res.headers.get("x-num")).toBe("42");
		expect(res.headers.get("retry-after")).toBe("120");
	});

	it("appends set-cookie array values", async () => {
		const app = new Buntok();
		app.get("/cookies", (ctx) => {
			ctx.set.headers["set-cookie"] = ["a=1; Path=/", "b=2; Path=/"];
			return "ok";
		});

		const res = await app.request("/cookies");
		expect(res.headers.getSetCookie()).toEqual(["a=1; Path=/", "b=2; Path=/"]);
	});

	it("accepts Elysia-style well-known header keys and numbers (compile-level)", () => {
		const app = new Buntok();
		app.get("/types", (ctx) => {
			ctx.set.headers["content-length"] = 500;
			ctx.set.headers["content-type"] = "application/json";
			ctx.set.headers["x-custom"] = "v";
			return "ok";
		});
		expect(typeof app.request).toBe("function");
	});

	it("user header still wins when powered-by is disabled", async () => {
		const app = new Buntok();
		app.disable("x-powered-by");
		app.get("/", (ctx) => {
			ctx.set.headers["x-powered-by"] = "benchmark";
			return "Hi";
		});
		app.get("/plain", () => "Hi");

		const withSet = await app.request("/");
		expect(withSet.headers.get("x-powered-by")).toBe("benchmark");

		const withoutSet = await app.request("/plain");
		expect(withoutSet.headers.get("x-powered-by")).toBeNull();
	});
});

describe("ctx.set.headers on listen() codegen variants", () => {
	it("applies headers on AOT fast path (logging off, powered-by off)", async () => {
		const prevLogRequests = (logger as { _logRequests?: boolean })._logRequests;
		(logger as { _logRequests?: boolean })._logRequests = false;
		try {
			const app = new Buntok({ handleSignals: false });
			app.disable("x-powered-by");
			app.get("/", (ctx) => {
				ctx.set.headers["x-powered-by"] = "benchmark";
				return "Hi";
			});
			app.listen(0);
			expect(app.server?.port).toBeGreaterThan(0);

			const res = await fetch(`http://localhost:${app.server?.port}/`);
			expect(res.headers.get("x-powered-by")).toBe("benchmark");
			expect(await res.text()).toBe("Hi");
			await app.close();
		} finally {
			(logger as { _logRequests?: boolean })._logRequests = prevLogRequests;
		}
	});

	it("applies headers on AOT powered-by path (logging off, powered-by on)", async () => {
		const prevLogRequests = (logger as { _logRequests?: boolean })._logRequests;
		(logger as { _logRequests?: boolean })._logRequests = false;
		try {
			const app = new Buntok({ handleSignals: false });
			app.enable("x-powered-by");
			app.get("/override", (ctx) => {
				ctx.set.headers["x-powered-by"] = "benchmark";
				return "Hi";
			});
			app.get("/plain", () => "Hi");
			app.listen(0);
			const port = app.server?.port;
			expect(port).toBeGreaterThan(0);

			const overridden = await fetch(`http://localhost:${port}/override`);
			expect(overridden.headers.get("x-powered-by")).toBe("benchmark");

			const plain = await fetch(`http://localhost:${port}/plain`);
			expect(plain.headers.get("x-powered-by")).toBe("buntok");
			await app.close();
		} finally {
			(logger as { _logRequests?: boolean })._logRequests = prevLogRequests;
		}
	});
});
