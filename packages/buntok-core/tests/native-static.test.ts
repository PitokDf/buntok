import { describe, it, expect } from "bun:test";
import { mkdtemp, rm, writeFile, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Buntok } from "../src/buntok";
import { logger } from "../src/logger";
import { Controller, Get, HttpCode } from "../src/decorators";

type LoggerInternals = { _logRequests?: boolean };

const setLogRequests = (value: boolean) => {
	(logger as LoggerInternals)._logRequests = value;
};

describe("static value handler (fetch path)", () => {
	it("serves a string handler as text/plain", async () => {
		const app = new Buntok({ handleSignals: false });
		app.get("/", "Hi");
		const res = await app.request("/");
		expect(res.status).toBe(200);
		expect(await res.text()).toBe("Hi");
	});

	it("runs route middleware before a static value", async () => {
		const app = new Buntok({ handleSignals: false });
		let ran = false;
		app.get(
			"/x",
			(_ctx, next) => {
				ran = true;
				return next();
			},
			"Hi",
		);
		const res = await app.request("/x");
		expect(res.status).toBe(200);
		expect(ran).toBe(true);
		expect(await res.text()).toBe("Hi");
	});

	it("runs global middleware before a static value", async () => {
		const app = new Buntok({ handleSignals: false });
		let ran = false;
		app.use(async (_ctx, next) => {
			ran = true;
			return await next();
		});
		app.get("/", "Hi");
		const res = await app.request("/");
		expect(ran).toBe(true);
		expect(await res.text()).toBe("Hi");
	});

	it("passes through a Response value", async () => {
		const app = new Buntok({ handleSignals: false });
		app.get("/r", new Response("X", { status: 201 }));
		const res = await app.request("/r");
		expect(res.status).toBe(201);
		expect(await res.text()).toBe("X");
	});

	it("serves a static value on a dynamic path via JS dispatch", async () => {
		const app = new Buntok({ handleSignals: false });
		app.get("/p/:id", "D");
		const res = await app.request("/p/7");
		expect(res.status).toBe(200);
		expect(await res.text()).toBe("D");
	});

	it("re-registration replaces the static value", async () => {
		const app = new Buntok({ handleSignals: false });
		app.get("/dup", "v1");
		app.get("/dup", "v2");
		expect(await (await app.request("/dup")).text()).toBe("v2");
	});
});

describe("native Bun.serve routes promotion (listen)", () => {
	it("promotes static handlers to native routes (etag signature)", async () => {
		const prev = (logger as LoggerInternals)._logRequests;
		setLogRequests(false);
		try {
			const app = new Buntok({ handleSignals: false });
			app.disable("x-powered-by");
			app.get("/", "Hi");
			app.get("/fn", (ctx) => ctx.text(ctx.query.x ?? "fn-ok"));
			app.listen(0);
			const port = app.server?.port;
			expect(port).toBeGreaterThan(0);

			const native = await fetch(`http://localhost:${port}/`);
			expect(native.status).toBe(200);
			expect(native.headers.get("etag")).not.toBeNull();
			expect(native.headers.get("content-type")).toBe("text/plain;charset=utf-8");
			expect(await native.text()).toBe("Hi");

			const js = await fetch(`http://localhost:${port}/fn`);
			expect(js.status).toBe(200);
			expect(js.headers.get("etag")).toBeNull();
			expect(await js.text()).toBe("fn-ok");

			const head = await fetch(`http://localhost:${port}/`, { method: "HEAD" });
			expect(head.status).toBe(200);
			expect(head.headers.get("etag")).not.toBeNull();
			expect(await head.text()).toBe("");

			const missing = await fetch(`http://localhost:${port}/missing`);
			expect(missing.status).toBe(404);
			await app.close();
		} finally {
			setLogRequests(prev ?? true);
		}
	});

	it("bakes X-Powered-By into the native response when enabled", async () => {
		const prev = (logger as LoggerInternals)._logRequests;
		setLogRequests(false);
		try {
			const app = new Buntok({ handleSignals: false });
			app.enable("x-powered-by");
			app.get("/", "Hi");
			app.listen(0);

			const res = await fetch(`http://localhost:${app.server?.port}/`);
			expect(res.headers.get("etag")).not.toBeNull();
			expect(res.headers.get("x-powered-by")).toBe("buntok");
			expect(await res.text()).toBe("Hi");
			await app.close();
		} finally {
			setLogRequests(prev ?? true);
		}
	});

	it("skips promotion when request logging is on", async () => {
		const prev = (logger as LoggerInternals)._logRequests;
		setLogRequests(true);
		try {
			const app = new Buntok({ handleSignals: false });
			app.disable("x-powered-by");
			app.get("/", "Hi");
			app.listen(0);

			const res = await fetch(`http://localhost:${app.server?.port}/`);
			expect(res.headers.get("etag")).toBeNull();
			expect(await res.text()).toBe("Hi");
			await app.close();
		} finally {
			setLogRequests(prev ?? true);
		}
	});

	it("skips promotion with global middleware (middleware still runs)", async () => {
		const prev = (logger as LoggerInternals)._logRequests;
		setLogRequests(false);
		try {
			const app = new Buntok({ handleSignals: false });
			app.disable("x-powered-by");
			let ran = false;
			app.use(async (_ctx, next) => {
				ran = true;
				return await next();
			});
			app.get("/", "Hi");
			app.listen(0);

			const res = await fetch(`http://localhost:${app.server?.port}/`);
			expect(res.headers.get("etag")).toBeNull();
			expect(ran).toBe(true);
			expect(await res.text()).toBe("Hi");
			await app.close();
		} finally {
			setLogRequests(prev ?? true);
		}
	});

	it("promotes route-middleware routes as a native function pipeline (middleware runs, no static etag)", async () => {
		const prev = (logger as LoggerInternals)._logRequests;
		setLogRequests(false);
		try {
			const app = new Buntok({ handleSignals: false });
			app.disable("x-powered-by");
			let ran = false;
			app.get("/x", (_ctx, next) => {
				ran = true;
				return next();
			}, "Hi");
			app.listen(0);

			const routes = (
				app as unknown as { _serveOptions?: { routes?: Record<string, Record<string, unknown>> } }
			)._serveOptions?.routes ?? {};
			expect(typeof routes["/x"]?.GET).toBe("function");
			const res = await fetch(`http://localhost:${app.server?.port}/x`);
			expect(res.headers.get("etag")).toBeNull();
			expect(ran).toBe(true);
			expect(await res.text()).toBe("Hi");
			await app.close();
		} finally {
			setLogRequests(prev ?? true);
		}
	});

	it("enable('logger') post-listen eagerly reloads (native → JS)", async () => {
		const prevEnabled = logger.enabled;
		const prevLog = (logger as LoggerInternals)._logRequests;
		setLogRequests(false);
		try {
			const app = new Buntok({ handleSignals: false });
			app.disable("x-powered-by");
			app.get("/", "Hi");
			app.listen(0);
			const port = app.server?.port;

			const before = await fetch(`http://localhost:${port}/`);
			expect(before.headers.get("etag")).not.toBeNull();

			app.enable("logger");
			// First request after the toggle: eager reload has already happened,
			// even though this static path never touches fetch().
			const after = await fetch(`http://localhost:${port}/`);
			expect(after.headers.get("etag")).toBeNull();
			expect(await after.text()).toBe("Hi");
			await app.close();
		} finally {
			logger.enabled = prevEnabled;
			setLogRequests(prevLog ?? true);
		}
	});

	it("disable('logger') post-listen installs native routes immediately", async () => {
		const prevEnabled = logger.enabled;
		const prevLog = (logger as LoggerInternals)._logRequests;
		setLogRequests(true);
		try {
			const app = new Buntok({ handleSignals: false });
			app.disable("x-powered-by");
			app.get("/", "Hi");
			app.listen(0);
			const port = app.server?.port;

			const before = await fetch(`http://localhost:${port}/`);
			expect(before.headers.get("etag")).toBeNull();

			app.disable("logger");
			const after = await fetch(`http://localhost:${port}/`);
			expect(after.headers.get("etag")).not.toBeNull();
			expect(await after.text()).toBe("Hi");
			await app.close();
		} finally {
			logger.enabled = prevEnabled;
			setLogRequests(prevLog ?? true);
		}
	});

	it("use() post-listen disables native & applies middleware immediately", async () => {
		const prev = (logger as LoggerInternals)._logRequests;
		setLogRequests(false);
		try {
			const app = new Buntok({ handleSignals: false });
			app.disable("x-powered-by");
			app.get("/", "Hi");
			app.listen(0);
			const port = app.server?.port;

			const before = await fetch(`http://localhost:${port}/`);
			expect(before.headers.get("etag")).not.toBeNull();

			let ran = false;
			app.use(async (_ctx, next) => {
				ran = true;
				return await next();
			});
			const after = await fetch(`http://localhost:${port}/`);
			expect(after.headers.get("etag")).toBeNull();
			expect(ran).toBe(true);
			expect(await after.text()).toBe("Hi");
			await app.close();
		} finally {
			setLogRequests(prev ?? true);
		}
	});
});

describe("auto const-literal detection (function → native)", () => {
	it("promotes arrow const handler () => \"Hi\" to native", async () => {
		const prev = (logger as LoggerInternals)._logRequests;
		setLogRequests(false);
		try {
			const app = new Buntok({ handleSignals: false });
			app.disable("x-powered-by");
			app.get("/", () => "Hi");
			app.listen(0);
			const res = await fetch(`http://localhost:${app.server?.port}/`);
			expect(res.headers.get("etag")).not.toBeNull();
			expect(res.headers.get("content-type")).toBe("text/plain;charset=utf-8");
			expect(await res.text()).toBe("Hi");
			await app.close();
		} finally {
			setLogRequests(prev ?? true);
		}
	});

	it("promotes method-shorthand & function declaration styles", async () => {
		const prev = (logger as LoggerInternals)._logRequests;
		setLogRequests(false);
		try {
			const app = new Buntok({ handleSignals: false });
			app.disable("x-powered-by");
			app.get("/m", function () {
				return "m-ok";
			});
			app.listen(0);
			const res = await fetch(`http://localhost:${app.server?.port}/m`);
			expect(res.headers.get("etag")).not.toBeNull();
			expect(await res.text()).toBe("m-ok");
			await app.close();
		} finally {
			setLogRequests(prev ?? true);
		}
	});

	it("promotes single-quoted & escaped literals with correct body", async () => {
		const prev = (logger as LoggerInternals)._logRequests;
		setLogRequests(false);
		try {
			const app = new Buntok({ handleSignals: false });
			app.disable("x-powered-by");
			app.get("/q", () => 'a\'b');
			app.get("/t", () => `Hi`);
			app.listen(0);
			const port = app.server?.port;

			const q = await fetch(`http://localhost:${port}/q`);
			expect(q.headers.get("etag")).not.toBeNull();
			expect(await q.text()).toBe("a'b");

			const t = await fetch(`http://localhost:${port}/t`);
			expect(t.headers.get("etag")).not.toBeNull();
			expect(await t.text()).toBe("Hi");
			await app.close();
		} finally {
			setLogRequests(prev ?? true);
		}
	});

	it("does NOT promote async / non-foldable multi-statement / closure returns", async () => {
		const prev = (logger as LoggerInternals)._logRequests;
		setLogRequests(false);
		try {
			const app = new Buntok({ handleSignals: false });
			app.disable("x-powered-by");
			const s = "Hi";
			app.get("/async", async () => "Hi");
			// Bun cannot constant-fold Math.random → multi-statement stays
			app.get("/multi", () => {
				const x = Math.random();
				return x >= 0 ? "Hi" : "no";
			});
			app.get("/closure", () => s);
			app.listen(0);
			const port = app.server?.port;

			for (const p of ["/async", "/multi", "/closure"]) {
				const res = await fetch(`http://localhost:${port}${p}`);
				expect(res.headers.get("etag")).toBeNull();
				expect(await res.text()).toBe("Hi");
			}
			await app.close();
		} finally {
			setLogRequests(prev ?? true);
		}
	});

	it("does NOT promote template literal with interpolation", async () => {
		const prev = (logger as LoggerInternals)._logRequests;
		setLogRequests(false);
		try {
			const app = new Buntok({ handleSignals: false });
			app.disable("x-powered-by");
			const x = "H";
			app.get("/interp", () => `${x}i`);
			app.listen(0);
			const res = await fetch(`http://localhost:${app.server?.port}/interp`);
			expect(res.headers.get("etag")).toBeNull();
			expect(await res.text()).toBe("Hi");
			await app.close();
		} finally {
			setLogRequests(prev ?? true);
		}
	});

	it("keeps JS fallback with const handler when logging on (function still runs)", async () => {
		const prev = (logger as LoggerInternals)._logRequests;
		setLogRequests(true);
		try {
			const app = new Buntok({ handleSignals: false });
			app.disable("x-powered-by");
			app.get("/", () => "Hi");
			app.listen(0);
			const res = await fetch(`http://localhost:${app.server?.port}/`);
			expect(res.headers.get("etag")).toBeNull();
			expect(await res.text()).toBe("Hi");
			await app.close();
		} finally {
			setLogRequests(prev ?? true);
		}
	});

	it("promotes const handler with route middleware as a function pipeline (middleware runs, no static etag)", async () => {
		const prev = (logger as LoggerInternals)._logRequests;
		setLogRequests(false);
		try {
			const app = new Buntok({ handleSignals: false });
			app.disable("x-powered-by");
			let ran = false;
			app.get(
				"/mw",
				(_ctx, next) => {
					ran = true;
					return next();
				},
				() => "Hi",
			);
			app.listen(0);
			const routes = (
				app as unknown as { _serveOptions?: { routes?: Record<string, Record<string, unknown>> } }
			)._serveOptions?.routes ?? {};
			expect(typeof routes["/mw"]?.GET).toBe("function");
			const res = await fetch(`http://localhost:${app.server?.port}/mw`);
			expect(res.headers.get("etag")).toBeNull();
			expect(ran).toBe(true);
			expect(await res.text()).toBe("Hi");
			await app.close();
		} finally {
			setLogRequests(prev ?? true);
		}
	});
});

describe("const ctx.text/html/json helpers → native", () => {
	it("native ctx.text/html/json byte-parity with the JS path (wire vs wire)", async () => {
		const prev = (logger as LoggerInternals)._logRequests;
		try {
			const routes = (app: Buntok) => {
				app.disable("x-powered-by");
				app.get("/t200", (ctx) => ctx.text("Hi"));
				app.get("/t201", (ctx) => ctx.text("Created", 201));
				app.get("/html", (ctx) => ctx.html("<p>x</p>"));
				// Object literal: transpiler strip quote ({a:1}) → JSON.parse
				// gagal → konservatif JS; array/scalar tetap ter-promote.
				app.get("/json", (ctx) => ctx.json(["x", 1]));
				app.get("/json201", (ctx) => ctx.json(["y"], 201));
			};

			// App native: logging off → promote
			setLogRequests(false);
			const na = new Buntok({ handleSignals: false });
			routes(na);
			na.listen(0);
			const nativePort = na.server?.port;

			// JS app: logging on → native gate off, response goes through JS
			setLogRequests(true);
			const ja = new Buntok({ handleSignals: false });
			routes(ja);
			ja.listen(0);
			const jsPort = ja.server?.port;

			for (const path of ["/t200", "/t201", "/html", "/json", "/json201"]) {
				const n = await fetch(`http://localhost:${nativePort}${path}`);
				const j = await fetch(`http://localhost:${jsPort}${path}`);
				expect(n.headers.get("etag")).not.toBeNull();
				expect(j.headers.get("etag")).toBeNull();
				expect(n.status).toBe(j.status);
				expect(n.headers.get("content-type")).toBe(
					j.headers.get("content-type"),
				);
				expect(await n.text()).toBe(await j.text());
				expect(n.headers.get("x-powered-by")).toBe(
					j.headers.get("x-powered-by"),
				);
			}
			await na.close();
			await ja.close();
		} finally {
			setLogRequests(prev ?? true);
		}
	});

	it("promotes alias-param helper; rejects dynamic/template/non-const-status", async () => {
		const prev = (logger as LoggerInternals)._logRequests;
		setLogRequests(false);
		try {
			const app = new Buntok({ handleSignals: false });
			app.disable("x-powered-by");
			app.get("/alias", (c) => c.text("alias-ok"));
			app.get("/dyn", (ctx) => ctx.text(ctx.query.x ?? "d"));
			app.get("/tpl", (ctx) => ctx.text(`H${ctx.query.x ?? "i"}`));
			// Status closure → not a literal (transpiler folds `200 + 1` into 201)
			const st = 201;
			app.get("/st", (ctx) => ctx.text("x", st));
			app.listen(0);
			const port = app.server?.port;

			const alias = await fetch(`http://localhost:${port}/alias`);
			expect(alias.headers.get("etag")).not.toBeNull();
			expect(await alias.text()).toBe("alias-ok");

			for (const path of ["/dyn", "/tpl", "/st"]) {
				const res = await fetch(`http://localhost:${port}${path}`);
				expect(res.headers.get("etag")).toBeNull();
			}
			expect(await (await fetch(`http://localhost:${port}/dyn`)).text()).toBe("d");
			expect(await (await fetch(`http://localhost:${port}/tpl`)).text()).toBe("Hi");
			expect((await fetch(`http://localhost:${port}/st`)).status).toBe(201);
			await app.close();
		} finally {
			setLogRequests(prev ?? true);
		}
	});

	it("promotes ctx.json with unquoted key (normalizer, body parity)", async () => {
		const prev = (logger as LoggerInternals)._logRequests;
		setLogRequests(false);
		try {
			const app = new Buntok({ handleSignals: false });
			app.disable("x-powered-by");
			app.get("/uq", (ctx) => ctx.json({ ok: true }));
			app.listen(0);
			const res = await fetch(`http://localhost:${app.server?.port}/uq`);
			expect(res.headers.get("etag")).not.toBeNull();
			expect(res.headers.get("content-type")).toContain("application/json");
			expect(await res.text()).toBe('{"ok":true}');
			await app.close();
		} finally {
			setLogRequests(prev ?? true);
		}
	});

	it("bakes X-Powered-By on native ctx.text when the flag is active", async () => {
		const prev = (logger as LoggerInternals)._logRequests;
		setLogRequests(false);
		try {
			const app = new Buntok({ handleSignals: false });
			app.enable("x-powered-by");
			app.get("/t", (ctx) => ctx.text("Hi"));
			app.listen(0);
			const res = await fetch(`http://localhost:${app.server?.port}/t`);
			expect(res.headers.get("etag")).not.toBeNull();
			expect(res.headers.get("x-powered-by")).toBe("buntok");
			expect(await res.text()).toBe("Hi");
			await app.close();
		} finally {
			setLogRequests(prev ?? true);
		}
	});
});

describe("controller decorator const return → native", () => {
	it("promotes controller method returning a literal; dynamic/@HttpCode stay in JS", async () => {
		const prev = (logger as LoggerInternals)._logRequests;
		setLogRequests(false);
		try {
			@Controller("/cc")
			class ConstController {
				@Get("/lit")
				lit() {
					return "Hi";
				}
				@Get("/dyn")
				dyn(ctx: any) {
					return ctx.text(ctx.query.x ?? "d");
				}
				@Get("/ctx")
				cctx(ctx: any) {
					return ctx.text("ctx-ok");
				}
				@Get("/code")
				@HttpCode(201)
				code() {
					return "created";
				}
			}
			const app = new Buntok({ handleSignals: false });
			app.disable("x-powered-by");
			app.registerController(ConstController);
			app.listen(0);
			const port = app.server?.port;

			const lit = await fetch(`http://localhost:${port}/cc/lit`);
			expect(lit.headers.get("etag")).not.toBeNull();
			expect(await lit.text()).toBe("Hi");

			const dyn = await fetch(`http://localhost:${port}/cc/dyn`);
			expect(dyn.headers.get("etag")).toBeNull();
			expect(await dyn.text()).toBe("d");

			const cctx = await fetch(`http://localhost:${port}/cc/ctx`);
			expect(cctx.headers.get("etag")).not.toBeNull();
			expect(await cctx.text()).toBe("ctx-ok");

			const code = await fetch(`http://localhost:${port}/cc/code`);
			expect(code.status).toBe(201);
			expect(code.headers.get("etag")).toBeNull();
			expect(await code.text()).toBe("created");
			await app.close();
		} finally {
			setLogRequests(prev ?? true);
		}
	});

	it("throws guidance error when a decorator is called in legacy mode (experimentalDecorators)", () => {
		const dec = Get("/legacy") as unknown as (t: unknown, c: unknown) => void;
		expect(() => dec({}, "handler")).toThrow(/experimentalDecorators/);
	});
});

describe("bare object/array/scalar literal → native", () => {
	it("promotes bare literals with JS-path byte parity (wire vs wire)", async () => {
		const prev = (logger as LoggerInternals)._logRequests;
		try {
			const routes = (app: Buntok) => {
				app.disable("x-powered-by");
				app.get("/obj", () => ({ hello: "buntok" }));
				app.get("/arr", () => [1, "x", true, null]);
				app.get("/nest", () => ({ a: { b: [1, 2], c: { d: "e" } } }));
				app.get("/num", () => 42);
				app.get("/bool", () => true);
				app.get("/nul", () => null);
			};

			// Native app: logging off → promotion
			setLogRequests(false);
			const na = new Buntok({ handleSignals: false });
			routes(na);
			na.listen(0);

			// JS app: logging on → native gate off
			setLogRequests(true);
			const ja = new Buntok({ handleSignals: false });
			routes(ja);
			ja.listen(0);

			for (const path of ["/obj", "/arr", "/nest", "/num", "/bool"]) {
				const n = await fetch(`http://localhost:${na.server?.port}${path}`);
				const j = await fetch(`http://localhost:${ja.server?.port}${path}`);
				expect(n.headers.get("etag")).not.toBeNull();
				expect(j.headers.get("etag")).toBeNull();
				expect(n.status).toBe(j.status);
				expect(n.headers.get("content-type")).toBe(
					j.headers.get("content-type"),
				);
				expect(await n.text()).toBe(await j.text());
			}

			// Scalar stays text/plain - never misclassified as JSON
			const num = await fetch(`http://localhost:${na.server?.port}/num`);
			expect(num.headers.get("content-type")).toBe(
				"text/plain; charset=utf-8",
			);
			// null → 204 with identical wire on both paths
			const nulN = await fetch(`http://localhost:${na.server?.port}/nul`);
			const nulJ = await fetch(`http://localhost:${ja.server?.port}/nul`);
			expect(nulN.status).toBe(204);
			expect(nulJ.status).toBe(204);
			expect(nulN.headers.get("content-type")).toBe(
				nulJ.headers.get("content-type"),
			);
			expect(await nulN.text()).toBe(await nulJ.text());

			await na.close();
			await ja.close();
		} finally {
			setLogRequests(prev ?? true);
		}
	});

	it("keeps dynamic/closure/shorthand returns on the JS path", async () => {
		const prev = (logger as LoggerInternals)._logRequests;
		setLogRequests(false);
		try {
			let q = "a";
			const s = 5;
			const val = () => 1;
			const app = new Buntok({ handleSignals: false });
			app.disable("x-powered-by");
			app.get("/dyn", () => ({ a: Math.random() }));
			app.get("/tpl", () => ({ a: `x${q}` }));
			app.get("/shrt", () => ({ s }));
			app.get("/call", () => ({ a: val() }));
			app.listen(0);
			const port = app.server?.port;
			q = "b"; // keep `q` mutable so the transpiler cannot fold the template

			for (const path of ["/dyn", "/tpl", "/shrt", "/call"]) {
				const res = await fetch(`http://localhost:${port}${path}`);
				expect(res.headers.get("etag")).toBeNull();
				expect(res.status).toBe(200);
			}
			expect(
				await (await fetch(`http://localhost:${port}/tpl`)).text(),
			).toBe('{"a":"xb"}');
			expect(
				await (await fetch(`http://localhost:${port}/shrt`)).text(),
			).toBe('{"s":5}');
			await app.close();
		} finally {
			setLogRequests(prev ?? true);
		}
	});

	it("promotes controller method returning an object literal (bench /json shape)", async () => {
		const prev = (logger as LoggerInternals)._logRequests;
		setLogRequests(false);
		try {
			@Controller("/")
			class BenchShape {
				@Get("/json")
				json() {
					return { message: "Hello, World!" };
				}
			}
			const app = new Buntok({ handleSignals: false });
			app.disable("x-powered-by");
			app.registerController(BenchShape);
			app.listen(0);
			const res = await fetch(`http://localhost:${app.server?.port}/json`);
			expect(res.headers.get("etag")).not.toBeNull();
			expect(res.headers.get("content-type")).toContain("application/json");
			expect(await res.text()).toBe('{"message":"Hello, World!"}');
			await app.close();
		} finally {
			setLogRequests(prev ?? true);
		}
	});
});

describe("app.static native opt-in", () => {
	const makeDir = async () => {
		const dir = await mkdtemp(join(tmpdir(), "buntok-static-"));
		await writeFile(join(dir, "a.txt"), "hello native");
		return dir;
	};

	it("serves via native { dir } route when native: true and gates pass", async () => {
		const prev = (logger as LoggerInternals)._logRequests;
		setLogRequests(false);
		const dir = await makeDir();
		try {
			const app = new Buntok({ handleSignals: false });
			app.disable("x-powered-by");
			app.static("/assets", dir, { native: true });
			app.listen(0);
			const port = app.server?.port;

			const ok = await fetch(`http://localhost:${port}/assets/a.txt`);
			expect(ok.status).toBe(200);
			expect(ok.headers.get("etag")).not.toBeNull();
			// Documented delta: Bun owns the response - no Cache-Control
			expect(ok.headers.get("cache-control")).toBeNull();
			expect(await ok.text()).toBe("hello native");

			// Documented delta: empty-body 404 (JS path returns JSON)
			const miss = await fetch(`http://localhost:${port}/assets/missing.txt`);
			expect(miss.status).toBe(404);
			expect(await miss.text()).toBe("");

			await app.close();
		} finally {
			setLogRequests(prev ?? true);
			await rm(dir, { recursive: true, force: true });
		}
	});

	it("keeps the JS handler while request logging is on (full options)", async () => {
		const prev = (logger as LoggerInternals)._logRequests;
		setLogRequests(true);
		const dir = await makeDir();
		try {
			const app = new Buntok({ handleSignals: false });
			app.disable("x-powered-by");
			app.static("/assets", dir, { native: true });
			app.listen(0);
			const port = app.server?.port;

			const ok = await fetch(`http://localhost:${port}/assets/a.txt`);
			expect(ok.headers.get("cache-control")).toBe("public, max-age=3600");

			const miss = await fetch(`http://localhost:${port}/assets/missing.txt`);
			expect(miss.status).toBe(404);
			expect(await miss.text()).toBe('{"error":"File Not Found"}');
			await app.close();
		} finally {
			setLogRequests(prev ?? true);
			await rm(dir, { recursive: true, force: true });
		}
	});

	it("keeps the JS handler while X-Powered-By is enabled (opaque values)", async () => {
		const prev = (logger as LoggerInternals)._logRequests;
		setLogRequests(false);
		const dir = await makeDir();
		try {
			const app = new Buntok({ handleSignals: false });
			// X-Powered-By stays ON (test default) → BunFile/dir not promoted
			app.static("/assets", dir, { native: true });
			app.listen(0);
			const ok = await fetch(
				`http://localhost:${app.server?.port}/assets/a.txt`,
			);
			expect(ok.headers.get("cache-control")).toBe("public, max-age=3600");
			expect(ok.headers.get("x-powered-by")).toBe("buntok");
			await app.close();
		} finally {
			setLogRequests(prev ?? true);
			await rm(dir, { recursive: true, force: true });
		}
	});
});

describe("favicon native promotion", () => {
	const makeIcon = async () => {
		const dir = await mkdtemp(join(tmpdir(), "buntok-icon-"));
		const iconPath = join(dir, "icon.ico");
		await writeFile(iconPath, new Uint8Array([0, 0, 1, 0, 1, 1, 0, 0]));
		return { dir, iconPath };
	};

	it("promotes a boot-resolvable icon to a native route value", async () => {
		const prev = (logger as LoggerInternals)._logRequests;
		setLogRequests(false);
		const { dir, iconPath } = await makeIcon();
		try {
			const app = new Buntok({ handleSignals: false });
			app.disable("x-powered-by");
			app.icon(iconPath);
			app.listen(0);
			const res = await fetch(
				`http://localhost:${app.server?.port}/favicon.ico`,
			);
			expect(res.status).toBe(200);
			// Bun serves route-value BunFiles with Last-Modified; the JS
			// Response(BunFile) path sends neither - the native wire signature.
			expect(res.headers.get("last-modified")).not.toBeNull();
			expect(res.headers.get("etag")).toBeNull();
			expect(res.headers.get("x-powered-by")).toBeNull();
			const src = await readFile(iconPath);
			expect(Buffer.from(await res.arrayBuffer())).toEqual(src);
			await app.close();
		} finally {
			setLogRequests(prev ?? true);
			await rm(dir, { recursive: true, force: true });
		}
	});

	it("falls back to the JS handler while X-Powered-By is enabled", async () => {
		const prev = (logger as LoggerInternals)._logRequests;
		setLogRequests(false);
		const { dir, iconPath } = await makeIcon();
		try {
			const app = new Buntok({ handleSignals: false });
			// X-Powered-By stays ON (test default) → opaque BunFile not promoted
			app.icon(iconPath);
			app.listen(0);
			const res = await fetch(
				`http://localhost:${app.server?.port}/favicon.ico`,
			);
			expect(res.status).toBe(200);
			expect(res.headers.get("x-powered-by")).toBe("buntok");
			expect(res.headers.get("last-modified")).toBeNull();
			await app.close();
		} finally {
			setLogRequests(prev ?? true);
			await rm(dir, { recursive: true, force: true });
		}
	});
});

describe("static function handler promotion (native)", () => {
	type ServedRoutes = Record<string, Record<string, unknown>>;
	const promotedRoutes = (app: Buntok): ServedRoutes =>
		(
			app as unknown as { _serveOptions?: { routes?: ServedRoutes } }
		)._serveOptions?.routes ?? {};

	/**
	 * Build the same app twice: native (logging off → promotion on) and JS
	 * (logging on → promotion gated off) for wire-parity comparison.
	 */
	const buildPair = (register: (app: Buntok) => void) => {
		const prev = (logger as LoggerInternals)._logRequests;
		setLogRequests(false);
		const native = new Buntok({ handleSignals: false });
		native.disable("x-powered-by");
		register(native);
		native.listen(0);
		setLogRequests(true);
		const js = new Buntok({ handleSignals: false });
		js.disable("x-powered-by");
		register(js);
		js.listen(0);
		setLogRequests(prev ?? true);
		return { native, js };
	};

	const parity = async (
		native: Buntok,
		js: Buntok,
		path: string,
		init?: RequestInit,
	) => {
		const a = await fetch(
			`http://localhost:${native.server?.port}${path}`,
			init,
		);
		const b = await fetch(`http://localhost:${js.server?.port}${path}`, init);
		expect(a.status).toBe(b.status);
		expect(a.headers.get("content-type")).toBe(b.headers.get("content-type"));
		expect(a.headers.get("x-powered-by")).toBe(b.headers.get("x-powered-by"));
		expect(await a.text()).toBe(await b.text());
		return a;
	};

	it("registers static function handlers as native route functions (function-only app)", async () => {
		const prev = (logger as LoggerInternals)._logRequests;
		setLogRequests(false);
		try {
			const app = new Buntok({ handleSignals: false });
			app.disable("x-powered-by");
			// No constant values, no :param routes - the collect gate must
			// still engage on static function routes alone.
			app.post("/echo", async (ctx) => ctx.json(await ctx.body()));
			app.listen(0);

			const routes = promotedRoutes(app);
			expect(typeof routes["/echo"]?.POST).toBe("function");
			await app.close();
		} finally {
			setLogRequests(prev ?? true);
		}
	});

	it("keeps static function handlers on the JS path while request logging is on", async () => {
		const prev = (logger as LoggerInternals)._logRequests;
		setLogRequests(true);
		try {
			const app = new Buntok({ handleSignals: false });
			app.disable("x-powered-by");
			app.post("/echo", async (ctx) => ctx.json(await ctx.body()));
			app.listen(0);

			expect(promotedRoutes(app)["/echo"]).toBeUndefined();
			const res = await fetch(`http://localhost:${app.server?.port}/echo`, {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: '{"hello":"world"}',
			});
			expect(res.status).toBe(200);
			expect(await res.text()).toBe('{"hello":"world"}');
			await app.close();
		} finally {
			setLogRequests(prev ?? true);
		}
	});

	it("matches the JS path byte-for-byte for the POST /json body-echo shape", async () => {
		const { native, js } = buildPair((app) => {
			app.post("/json", async (ctx) => ctx.json(await ctx.body()));
		});
		try {
			expect(typeof promotedRoutes(native)["/json"]?.POST).toBe("function");
			expect(promotedRoutes(js)["/json"]).toBeUndefined();

			const init: RequestInit = {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: '{"hello":"world"}',
			};
			const res = await parity(native, js, "/json", init);
			expect(res.headers.get("content-type")).toContain("application/json");
		} finally {
			await native.close();
			await js.close();
		}
	});

	it("falls through to fetch() for unmatched methods and paths (404 parity)", async () => {
		const { native, js } = buildPair((app) => {
			app.post("/only", async (ctx) => ctx.json(await ctx.body()));
		});
		try {
			for (const [method, path] of [
				["GET", "/only"],
				["POST", "/missing"],
				["GET", "/missing"],
			] as const) {
				const a = await fetch(`http://localhost:${native.server?.port}${path}`, { method });
				const b = await fetch(`http://localhost:${js.server?.port}${path}`, { method });
				expect(a.status).toBe(404);
				expect(a.status).toBe(b.status);
			}
		} finally {
			await native.close();
			await js.close();
		}
	});

	it("answers HEAD from the GET function route (200, body stripped, parity)", async () => {
		const { native, js } = buildPair((app) => {
			app.get("/h", (ctx) => ctx.text(`Hi ${ctx.query.x ?? "-"}`));
		});
		try {
			expect(typeof promotedRoutes(native)["/h"]?.GET).toBe("function");
			const a = await fetch(`http://localhost:${native.server?.port}/h?x=1`, {
				method: "HEAD",
			});
			const b = await fetch(`http://localhost:${js.server?.port}/h?x=1`, {
				method: "HEAD",
			});
			expect(a.status).toBe(200);
			expect(a.status).toBe(b.status);
			expect(await a.text()).toBe("");
			expect(await b.text()).toBe("");
		} finally {
			await native.close();
			await js.close();
		}
	});

	it("keeps thrown-error responses identical (500 parity)", async () => {
		const { native, js } = buildPair((app) => {
			app.get("/boom", () => {
				throw new Error("boom");
			});
		});
		try {
			const a = await fetch(`http://localhost:${native.server?.port}/boom`);
			const b = await fetch(`http://localhost:${js.server?.port}/boom`);
			expect(a.status).toBe(500);
			expect(a.status).toBe(b.status);
			expect(await a.text()).toBe(await b.text());
		} finally {
			await native.close();
			await js.close();
		}
	});

	it("applies ctx.set.headers on native static functions", async () => {
		const { native, js } = buildPair((app) => {
			app.get("/set", (ctx) => {
				ctx.set.headers["x-native-set"] = "yes";
				return "ok";
			});
		});
		try {
			const a = await parity(native, js, "/set");
			expect(a.headers.get("x-native-set")).toBe("yes");
		} finally {
			await native.close();
			await js.close();
		}
	});

	it("keeps ctx.set headers through bare-ctx delegation (conservative sucrose)", async () => {
		const delegate = (c: { set: { headers: Record<string, string> } }) => {
			c.set.headers["x-deleg"] = "yes";
			return "d";
		};
		const { native, js } = buildPair((app) => {
			app.get("/deleg", (ctx) => delegate(ctx));
		});
		try {
			const a = await parity(native, js, "/deleg");
			expect(a.headers.get("x-deleg")).toBe("yes");
		} finally {
			await native.close();
			await js.close();
		}
	});

	it("promotes route-middleware pipelines as functions (middleware still runs)", async () => {
		const prev = (logger as LoggerInternals)._logRequests;
		setLogRequests(false);
		try {
			const app = new Buntok({ handleSignals: false });
			app.disable("x-powered-by");
			let ran = false;
			app.get(
				"/mwp",
				(_ctx, next) => {
					ran = true;
					return next();
				},
				(ctx) => ctx.text("mw-ok"),
			);
			app.listen(0);

			expect(typeof promotedRoutes(app)["/mwp"]?.GET).toBe("function");
			const res = await fetch(`http://localhost:${app.server?.port}/mwp`);
			expect(res.status).toBe(200);
			expect(ran).toBe(true);
			expect(await res.text()).toBe("mw-ok");
			await app.close();
		} finally {
			setLogRequests(prev ?? true);
		}
	});
});

describe("sucrose needsSetHeaders detection", () => {
	it("flags set usage and delegation, but not plain ctx params", async () => {
		const { analyzeHandler } = await import("../src/aot/sucrose");
		const bench = analyzeHandler(async (ctx: any) => ctx.json(await ctx.body()));
		expect(bench.needsSetHeaders).toBe(false);
		expect(bench.needsFullContext).toBe(true);

		const withSet = analyzeHandler((ctx: any) => {
			ctx.set.headers["x"] = "1";
			return "ok";
		});
		expect(withSet.needsSetHeaders).toBe(true);

		const aliasSet = analyzeHandler((c: any) => {
			c.set.headers["x"] = "1";
			return "ok";
		});
		expect(aliasSet.needsSetHeaders).toBe(true);

		const delegate = analyzeHandler((ctx: any) => helperFn(ctx));
		expect(delegate.needsSetHeaders).toBe(true);

		const plain = analyzeHandler(() => "ok");
		expect(plain.needsSetHeaders).toBe(false);
	});
});

function helperFn(_ctx: unknown) {
	return "h";
}
