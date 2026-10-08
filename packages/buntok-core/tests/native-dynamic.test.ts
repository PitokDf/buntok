import { describe, it, expect } from "bun:test";
import { Buntok } from "../src/buntok";
import { logger } from "../src/logger";

type LoggerInternals = { _logRequests?: boolean };

const setLogRequests = (value: boolean) => {
	(logger as LoggerInternals)._logRequests = value;
};

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
	method: string,
	path: string,
) => {
	const a = await fetch(`http://localhost:${native.server?.port}${path}`, {
		method: method as Parameters<typeof fetch>[1]["method"],
	});
	const b = await fetch(`http://localhost:${js.server?.port}${path}`, {
		method: method as Parameters<typeof fetch>[1]["method"],
	});
	const at = await a.text();
	const bt = await b.text();
	expect(a.status).toBe(b.status);
	expect(a.headers.get("content-type")).toBe(b.headers.get("content-type"));
	expect(at).toBe(bt);
	return a;
};

describe("dynamic :param native promotion", () => {
	it("registers :param GET handlers as native route functions when gates pass", () => {
		const prev = (logger as LoggerInternals)._logRequests;
		setLogRequests(false);
		try {
			const app = new Buntok({ handleSignals: false });
			app.disable("x-powered-by");
			app.get("/id/:id", ({ params }) => ({ id: params.id }));
			app.listen(0);
			const routes = promotedRoutes(app);
			expect(routes["/id/:id"]).toBeDefined();
			expect(typeof routes["/id/:id"]?.["GET"]).toBe("function");
			// Dynamic handlers never carry a static value
			expect(routes["/id/:id"]?.["GET"]).not.toBeInstanceOf(Response);
			void app.close();
		} finally {
			setLogRequests(prev ?? true);
		}
	});

	it("keeps :param handlers on the JS path while request logging is on", () => {
		const prev = (logger as LoggerInternals)._logRequests;
		setLogRequests(true);
		try {
			const app = new Buntok({ handleSignals: false });
			app.get("/id/:id", ({ params }) => ({ id: params.id }));
			app.listen(0);
			expect(promotedRoutes(app)["/id/:id"]).toBeUndefined();
			void app.close();
		} finally {
			setLogRequests(prev ?? true);
		}
	});

	it("keeps :param handlers on the JS path while global middleware is present", () => {
		const prev = (logger as LoggerInternals)._logRequests;
		setLogRequests(false);
		try {
			const app = new Buntok({ handleSignals: false });
			app.use(async (_ctx, next) => next());
			app.get("/id/:id", ({ params }) => ({ id: params.id }));
			app.listen(0);
			expect(promotedRoutes(app)["/id/:id"]).toBeUndefined();
			void app.close();
		} finally {
			setLogRequests(prev ?? true);
		}
	});

	it("matches the JS path byte-for-byte (plain, encoded, nested, query)", async () => {
		const { native, js } = buildPair((app) => {
			app.get("/id/:id", ({ params }) => ({ id: params.id }));
			app.get("/u/:uid/p/:pid", ({ params }) => ({
				uid: params.uid,
				pid: params.pid,
			}));
		});
		try {
			expect(promotedRoutes(native)["/id/:id"]).toBeDefined();
			expect(promotedRoutes(js)["/id/:id"]).toBeUndefined();

			await parity(native, js, "GET", "/id/42");
			// Raw (still percent-encoded) capture - FFI trie parity, not Bun's
			// decoded req.params.
			await parity(native, js, "GET", "/id/a%20b%2Fc");
			await parity(native, js, "GET", "/id/%zz");
			await parity(native, js, "GET", "/u/x1/p/y2");
			await parity(native, js, "GET", "/id/42?x=1&y=2");
			// Method miss / pattern miss fall through to fetch() → _dispatch()
			await parity(native, js, "PUT", "/id/42");
			await parity(native, js, "HEAD", "/id/42");
			await parity(native, js, "GET", "/id");
			await parity(native, js, "GET", "/id/42/extra");
			await parity(native, js, "GET", "/missing");
		} finally {
			await native.close();
			await js.close();
		}
	});

	it("matches the JS path for string returns (benchmark /id shape) and async handlers", async () => {
		const { native, js } = buildPair((app) => {
			app.get("/s/:id", ({ params }) => params.id);
			app.get("/a/:id", async ({ params }) => ({
				id: params.id,
				n: 1,
			}));
		});
		try {
			const s = await parity(native, js, "GET", "/s/hello-world");
			expect(s.headers.get("content-type")).toContain("text/plain");
			await parity(native, js, "GET", "/s/a%2Fb");
			await parity(native, js, "HEAD", "/s/9");
			await parity(native, js, "GET", "/a/7");
		} finally {
			await native.close();
			await js.close();
		}
	});

	it("keeps error responses identical (thrown handler)", async () => {
		const { native, js } = buildPair((app) => {
			app.get("/boom/:id", () => {
				throw new Error("kaboom");
			});
		});
		try {
			const a = await parity(native, js, "GET", "/boom/1");
			expect(a.status).toBe(500);
		} finally {
			await native.close();
			await js.close();
		}
	});

	it("runs route middleware on :param routes identically on both paths", async () => {
		const { native, js } = buildPair((app) => {
			app.get(
				"/mw/:id",
				(ctx, next) => {
					ctx.set.headers["x-route-mw"] = "yes";
					return next();
				},
				({ params }) => ({ id: params.id }),
			);
		});
		try {
			const a = await parity(native, js, "GET", "/mw/3");
			expect(a.headers.get("x-route-mw")).toBe("yes");
		} finally {
			await native.close();
			await js.close();
		}
	});

	it("promotes a constant handler on a :param path as a static Response (zero JS)", async () => {
		const { native, js } = buildPair((app) => {
			app.get("/c/:id", () => ({ constant: true }));
		});
		try {
			const value = promotedRoutes(native)["/c/:id"]?.["GET"];
			expect(value).toBeInstanceOf(Response);
			const a = await parity(native, js, "GET", "/c/1");
			expect(a.status).toBe(200);
			expect(a.headers.get("etag")).not.toBeNull();
			await parity(native, js, "HEAD", "/c/1");
			await parity(native, js, "GET", "/c/1?x=1");
		} finally {
			await native.close();
			await js.close();
		}
	});
});

describe("HEAD falls back to the GET route", () => {
	it("answers HEAD with the GET handler (200, body stripped) on the JS path", async () => {
		const app = new Buntok({ handleSignals: false });
		app.disable("x-powered-by");
		app.get("/plain", () => "hello");
		app.listen(0);
		try {
			const res = await fetch(
				`http://localhost:${app.server?.port}/plain`,
				{ method: "HEAD" },
			);
			expect(res.status).toBe(200);
			expect(await res.text()).toBe("");
		} finally {
			await app.close();
		}
	});

	it("still 404s when no GET route exists for the path", async () => {
		const app = new Buntok({ handleSignals: false });
		app.post("/only-post", () => "x");
		app.listen(0);
		try {
			const res = await fetch(
				`http://localhost:${app.server?.port}/only-post`,
				{ method: "HEAD" },
			);
			expect(res.status).toBe(404);
		} finally {
			await app.close();
		}
	});
});
