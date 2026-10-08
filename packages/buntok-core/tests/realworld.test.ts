import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Buntok } from "../src/buntok";
import { logger } from "../src/logger";
import { Controller, Get, Post, HttpCode, SetHeader, Redirect } from "../src/decorators";
import { requestId, helmet, responseTime, rateLimiter } from "../src/middlewares";
import { handleUploads, MemoryStorage, type UploadedFile } from "../src/upload";
import { file } from "../src/helpers/file";
import { Container } from "../src/container";

type LoggerInternals = { _logRequests?: boolean };
type ServedRoutes = Record<string, Record<string, unknown>>;

const setLogRequests = (value: boolean) => {
	(logger as LoggerInternals)._logRequests = value;
};

const routesOf = (app: Buntok): ServedRoutes =>
	(
		app as unknown as { _serveOptions?: { routes?: ServedRoutes } }
	)._serveOptions?.routes ?? {};

interface Task {
	id: number;
	title: string;
	done: boolean;
}

/** Delegation helper: handler forwards ctx - exercises needsFullContext + needsSetHeaders. */
const respond = (
	ctx: {
		set: { headers: Record<string, string> };
		json: (data: unknown, status?: number) => Response;
	},
	data: unknown,
) => {
	ctx.set.headers["x-api-version"] = "1";
	return ctx.json(data);
};

@Controller("/v1/users")
class UserController {
	@Get("/")
	list() {
		return { users: [{ id: 1, name: "Pitok" }] };
	}

	@Post("/")
	create() {
		return { created: true };
	}
}

/**
 * Build a realistic mini Task API the way a developer writes it: static
 * landing, health probe, JSON list with query filter, `:param` detail,
 * async body validation, route middleware (auth), a throwing route, and a
 * decorator controller. Each app instance owns its own in-memory store.
 */
function buildTaskApi(logRequests: boolean): Buntok {
	const prev = (logger as LoggerInternals)._logRequests;
	setLogRequests(logRequests);
	try {
		const app = new Buntok({ handleSignals: false });
		app.disable("x-powered-by");

		const tasks: Task[] = [
			{ id: 1, title: "write tests", done: false },
			{ id: 2, title: "ship", done: true },
		];
		let nextId = 3;

		app.get("/", "Welcome to Tasks API");
		app.get("/health", () => "ok");

		app.get("/api/tasks", (ctx) => {
			const { done } = ctx.query;
			const items =
				done === undefined
					? tasks
					: tasks.filter((task) => String(task.done) === done);
			return ctx.json({ items, count: items.length });
		});

		app.get("/api/tasks/:id", (ctx) => {
			const task = tasks.find((t) => t.id === Number(ctx.params.id));
			if (!task) return ctx.json({ error: "task not found" }, 404);
			return ctx.json(task);
		});

		app.post("/api/tasks", async (ctx) => {
			const body = await ctx.body<{ title?: unknown }>();
			if (typeof body?.title !== "string" || !body.title.trim())
				return ctx.json({ error: "title is required" }, 400);
			const task: Task = { id: nextId++, title: body.title.trim(), done: false };
			tasks.push(task);
			ctx.set.headers["x-task-id"] = String(task.id);
			return ctx.json(task, 201);
		});

		app.put("/api/tasks/:id", async (ctx) => {
			const task = tasks.find((t) => t.id === Number(ctx.params.id));
			if (!task) return ctx.json({ error: "task not found" }, 404);
			const body = await ctx.body<{ title?: unknown }>();
			if (typeof body?.title !== "string" || !body.title.trim())
				return ctx.json({ error: "title is required" }, 400);
			task.title = body.title.trim();
			return ctx.json(task);
		});

		app.patch("/api/tasks/:id", async (ctx) => {
			const task = tasks.find((t) => t.id === Number(ctx.params.id));
			if (!task) return ctx.json({ error: "task not found" }, 404);
			const body = await ctx.body<{ done?: unknown }>();
			if (typeof body?.done !== "boolean")
				return ctx.json({ error: "done must be boolean" }, 400);
			task.done = body.done;
			return ctx.json(task);
		});

		app.delete("/api/tasks/:id", (ctx) => {
			const index = tasks.findIndex((t) => t.id === Number(ctx.params.id));
			if (index === -1) return ctx.json({ error: "task not found" }, 404);
			tasks.splice(index, 1);
			return ctx.json({ deleted: true });
		});

		app.get(
			"/api/profile",
			(ctx, next) => {
				if (ctx.request.headers.get("authorization") !== "Bearer dev")
					return ctx.json({ error: "unauthorized" }, 401);
				return next();
			},
			(ctx) => respond(ctx, { name: "Pitok", role: "admin" }),
		);

		app.get("/api/boom", () => {
			throw new Error("database exploded");
		});

		app.registerController(UserController);
		app.listen(0);
		return app;
	} finally {
		setLogRequests(prev ?? true);
	}
}

interface Scenario {
	name: string;
	path: string;
	init?: RequestInit;
	status: number;
	ct?: string;
	equals?: string;
	contains?: string[];
	header?: [string, string];
}

const post = (body: string): RequestInit => ({
	method: "POST",
	headers: { "content-type": "application/json" },
	body,
});

const withMethod = (method: string, body: string): RequestInit => ({
	method,
	headers: { "content-type": "application/json" },
	body,
});

const scenarios: Scenario[] = [
	{ name: "landing", path: "/", status: 200, ct: "text/plain", contains: ["Welcome to Tasks API"] },
	{ name: "health probe", path: "/health", status: 200, equals: "ok" },
	{
		name: "task list",
		path: "/api/tasks",
		status: 200,
		ct: "application/json",
		contains: ['"count":2', "write tests"],
	},
	{
		name: "task list filtered by query",
		path: "/api/tasks?done=true",
		status: 200,
		contains: ['"count":1', '"ship"'],
	},
	{
		name: "task detail by param",
		path: "/api/tasks/1",
		status: 200,
		contains: ['"id":1', "write tests"],
	},
	{
		name: "task missing",
		path: "/api/tasks/99",
		status: 404,
		contains: ["task not found"],
	},
	{
		name: "task malformed param",
		path: "/api/tasks/abc",
		status: 404,
		contains: ["task not found"],
	},
	{
		name: "create valid task",
		path: "/api/tasks",
		init: post('{"title":"review PR"}'),
		status: 201,
		contains: ["review PR"],
		header: ["x-task-id", "3"],
	},
	{
		name: "create rejects blank title",
		path: "/api/tasks",
		init: post('{"title":"   "}'),
		status: 400,
		contains: ["title is required"],
	},
	{
		name: "create rejects missing title",
		path: "/api/tasks",
		init: post("{}"),
		status: 400,
		contains: ["title is required"],
	},
	{
		name: "auth middleware rejects without token",
		path: "/api/profile",
		status: 401,
		contains: ["unauthorized"],
	},
	{
		name: "auth middleware allows with token",
		path: "/api/profile",
		init: { headers: { authorization: "Bearer dev" } },
		status: 200,
		contains: ['"role":"admin"'],
		header: ["x-api-version", "1"],
	},
	{ name: "thrown error → 500", path: "/api/boom", status: 500 },
	{
		name: "controller list",
		path: "/v1/users",
		status: 200,
		ct: "application/json",
		contains: ["Pitok"],
	},
	{
		name: "controller create",
		path: "/v1/users",
		init: post("{}"),
		status: 200,
		contains: ['"created":true'],
	},
	{ name: "unknown route → 404", path: "/nope", status: 404 },
	{
		name: "PUT updates a task",
		path: "/api/tasks/3",
		init: withMethod("PUT", '{"title":"review PR and merge"}'),
		status: 200,
		contains: ["review PR and merge"],
	},
	{
		name: "PUT rejects a missing task",
		path: "/api/tasks/99",
		init: withMethod("PUT", '{"title":"x"}'),
		status: 404,
		contains: ["task not found"],
	},
	{
		name: "PATCH toggles done",
		path: "/api/tasks/3",
		init: withMethod("PATCH", '{"done":true}'),
		status: 200,
		contains: ['"done":true'],
	},
	{
		name: "PATCH rejects non-boolean done",
		path: "/api/tasks/3",
		init: withMethod("PATCH", '{"done":"yes"}'),
		status: 400,
		contains: ["done must be boolean"],
	},
	{
		name: "DELETE removes a task",
		path: "/api/tasks/1",
		init: { method: "DELETE" },
		status: 200,
		contains: ['"deleted":true'],
	},
	{
		name: "GET on the deleted task",
		path: "/api/tasks/1",
		status: 404,
		contains: ["task not found"],
	},
	{
		name: "DELETE rejects a missing task",
		path: "/api/tasks/99",
		init: { method: "DELETE" },
		status: 404,
	},
	{
		name: "HEAD on the list route",
		path: "/api/tasks",
		init: { method: "HEAD" },
		status: 200,
		equals: "",
	},
];

const call = async (app: Buntok, scenario: Scenario) => {
	const res = await fetch(
		`http://localhost:${app.server?.port}${scenario.path}`,
		scenario.init,
	);
	return {
		status: res.status,
		type: res.headers.get("content-type"),
		body: await res.text(),
		headers: res.headers,
	};
};

describe("real-world task API (native path vs JS path)", () => {
	let native: Buntok;
	let js: Buntok;

	beforeAll(() => {
		native = buildTaskApi(false);
		js = buildTaskApi(true);
	});

	afterAll(async () => {
		await native.close();
		await js.close();
	});

	it("engages native promotion for every static and dynamic route", () => {
		const routes = routesOf(native);
		// static value handlers (`"…"` and const-literal `() => "…"`)
		expect(routes["/"]).toBeDefined();
		expect(routes["/health"]).toBeDefined();
		expect(typeof routes["/health"]?.GET).not.toBe("function");
		// static function handlers
		expect(typeof routes["/api/tasks"]?.GET).toBe("function");
		expect(typeof routes["/api/tasks"]?.POST).toBe("function");
		// dynamic :param handler
		expect(typeof routes["/api/tasks/:id"]?.GET).toBe("function");
		expect(typeof routes["/api/tasks/:id"]?.PUT).toBe("function");
		expect(typeof routes["/api/tasks/:id"]?.PATCH).toBe("function");
		expect(typeof routes["/api/tasks/:id"]?.DELETE).toBe("function");
		// route-middleware pipeline
		expect(typeof routes["/api/profile"]?.GET).toBe("function");
		// throwing route
		expect(typeof routes["/api/boom"]?.GET).toBe("function");
		// logging on (default dev) → nothing promoted, everything through JS
		expect(Object.keys(routesOf(js))).toHaveLength(0);
	});

	it("serves every scenario identically on both paths (wire parity + expectations)", async () => {
		for (const scenario of scenarios) {
			const nativeRes = await call(native, scenario);
			const jsRes = await call(js, scenario);

			// byte-identical status / content-type / body across paths
			expect(nativeRes.status).toBe(jsRes.status);
			expect(nativeRes.type).toBe(jsRes.type);
			expect(nativeRes.body).toBe(jsRes.body);

			// realistic developer expectations on the response
			expect(nativeRes.status).toBe(scenario.status);
			if (scenario.equals !== undefined)
				expect(nativeRes.body).toBe(scenario.equals);
			if (scenario.ct) expect(nativeRes.type ?? "").toContain(scenario.ct);
			for (const fragment of scenario.contains ?? [])
				expect(nativeRes.body).toContain(fragment);
			if (scenario.header)
				expect(nativeRes.headers.get(scenario.header[0])).toBe(
					scenario.header[1],
				);
		}
	});
});

describe("real-world app with global middleware", () => {
	it("serves correctly while native promotion stays gated off by the middleware", async () => {
		const prev = (logger as LoggerInternals)._logRequests;
		// logging is OFF - global middleware is the only promotion gate left
		setLogRequests(false);
		try {
			const app = new Buntok({ handleSignals: false });
			app.disable("x-powered-by");
			app.use(requestId());
			app.get("/health", () => "ok");
			app.get("/api/tasks/:id", (ctx) => ctx.json({ id: ctx.params.id }));
			app.listen(0);

			expect(routesOf(app)["/health"]).toBeUndefined();
			expect(routesOf(app)["/api/tasks/:id"]).toBeUndefined();

			const health = await fetch(
				`http://localhost:${app.server?.port}/health`,
			);
			expect(health.status).toBe(200);
			expect(health.headers.get("x-request-id")).toBeTruthy();
			expect(await health.text()).toBe("ok");

			const detail = await fetch(
				`http://localhost:${app.server?.port}/api/tasks/42`,
			);
			expect(detail.status).toBe(200);
			expect(await detail.json()).toEqual({ id: "42" });

			await app.close();
		} finally {
			setLogRequests(prev ?? true);
		}
	});
});

describe("real-world app with default configuration", () => {
	it("works out of the box before listen() (plain app.request)", async () => {
		const app = new Buntok({ handleSignals: false });
		app.get("/", "Welcome to Tasks API");
		app.get("/health", () => "ok");
		app.post("/echo", async (ctx) => ctx.json(await ctx.body()));

		const home = await app.request("/");
		expect(home.status).toBe(200);
		expect(await home.text()).toBe("Welcome to Tasks API");

		const health = await app.request("/health");
		expect(await health.text()).toBe("ok");

		const echo = await app.request("/echo", post('{"a":1}'));
		expect(echo.status).toBe(200);
		expect(await echo.json()).toEqual({ a: 1 });

		await app.close();
	});
});

describe("real-world cross-cutting middleware (CORS, helmet, response-time)", () => {
	it("applies CORS, security, and response-time headers on raw string handlers with logging off", async () => {
		const prev = (logger as LoggerInternals)._logRequests;
		setLogRequests(false);
		try {
			const app = new Buntok({ handleSignals: false });
			app.cors({ origin: "http://example.com" });
			app.use(helmet());
			app.use(responseTime());
			app.get("/health", () => "ok");
			app.listen(0);

			// global middleware gates native promotion - everything runs in JS
			expect(routesOf(app)["/health"]).toBeUndefined();

			const origin = "http://example.com";
			const res = await fetch(
				`http://localhost:${app.server?.port}/health`,
				{ headers: { Origin: origin } },
			);
			expect(res.status).toBe(200);
			expect(await res.text()).toBe("ok");
			expect(res.headers.get("Access-Control-Allow-Origin")).toBe(origin);
			// raw string handler - these two used to be skipped when logging was off
			expect(res.headers.get("x-response-time")).toBeTruthy();
			expect(
				["x-content-type-options", "x-frame-options", "x-xss-protection"].some(
					(header) => res.headers.has(header),
				),
			).toBe(true);

			const preflight = await fetch(
				`http://localhost:${app.server?.port}/health`,
				{
					method: "OPTIONS",
					headers: {
						Origin: origin,
						"Access-Control-Request-Method": "GET",
					},
				},
			);
			expect(preflight.status).toBe(204);
			expect(preflight.headers.get("Access-Control-Allow-Origin")).toBe(
				origin,
			);

			await app.close();
		} finally {
			setLogRequests(prev ?? true);
		}
	});
});

describe("real-world rate limiting", () => {
	it("returns 429 after the budget is exhausted and headers on success", async () => {
		const prev = (logger as LoggerInternals)._logRequests;
		setLogRequests(false);
		try {
			const app = new Buntok({ handleSignals: false });
			app.disable("x-powered-by");
			app.get(
				"/limited",
				rateLimiter({ max: 2, windowMs: 60_000 }),
				() => "ok",
			);
			app.listen(0);
			const url = `http://localhost:${app.server?.port}/limited`;

			const first = await fetch(url);
			expect(first.status).toBe(200);
			expect(first.headers.get("x-ratelimit-limit")).toBe("2");
			expect(await first.text()).toBe("ok");

			const second = await fetch(url);
			expect(second.status).toBe(200);

			const third = await fetch(url);
			expect(third.status).toBe(429);
			expect(third.headers.get("retry-after")).toBeTruthy();

			await app.close();
		} finally {
			setLogRequests(prev ?? true);
		}
	});
});

describe("real-world file serving (static directory, file() download, Range)", () => {
	it("serves directory files, file() downloads, and byte ranges", async () => {
		const dir = await mkdtemp(join(tmpdir(), "buntok-realworld-"));
		await writeFile(join(dir, "hello.txt"), "hello file");
		await writeFile(join(dir, "clip.bin"), "0123456789");
		const prev = (logger as LoggerInternals)._logRequests;
		setLogRequests(false);
		try {
			const app = new Buntok({ handleSignals: false });
			app.disable("x-powered-by");
			app.static("/assets", dir);
			app.get("/dl", () => file(join(dir, "hello.txt")));
			app.get("/clip", () => file(join(dir, "clip.bin")));
			app.listen(0);
			const base = `http://localhost:${app.server?.port}`;

			const asset = await fetch(`${base}/assets/hello.txt`);
			expect(asset.status).toBe(200);
			expect(await asset.text()).toBe("hello file");

			const missing = await fetch(`${base}/assets/nope.txt`);
			expect(missing.status).toBe(404);

			const download = await fetch(`${base}/dl`);
			expect(download.status).toBe(200);
			expect(await download.text()).toBe("hello file");

			const range = await fetch(`${base}/clip`, {
				headers: { Range: "bytes=2-5" },
			});
			expect(range.status).toBe(206);
			expect(range.headers.get("content-range")).toBe("bytes 2-5/10");
			expect(await range.text()).toBe("2345");

			const suffix = await fetch(`${base}/clip`, {
				headers: { Range: "bytes=-3" },
			});
			expect(suffix.status).toBe(206);
			expect(suffix.headers.get("content-range")).toBe("bytes 7-9/10");
			expect(await suffix.text()).toBe("789");

			await app.close();
		} finally {
			setLogRequests(prev ?? true);
			await rm(dir, { recursive: true, force: true });
		}
	});
});

describe("real-world multipart upload", () => {
	it("accepts a file upload and rejects a missing required field", async () => {
		const prev = (logger as LoggerInternals)._logRequests;
		setLogRequests(false);
		try {
			const app = new Buntok({ handleSignals: false });
			app.disable("x-powered-by");
			app.post("/upload", async (ctx) => {
				const result = await handleUploads(ctx, {
					storage: new MemoryStorage(),
					fields: { doc: { required: true } },
				});
				const doc = result.fields.doc as UploadedFile;
				return ctx.json({
					name: doc.originalName,
					size: doc.size,
					type: doc.type,
				});
			});
			app.listen(0);
			const url = `http://localhost:${app.server?.port}/upload`;

			const form = new FormData();
			form.append(
				"doc",
				new File(["hello upload"], "notes.txt", { type: "text/plain" }),
			);
			const ok = await fetch(url, { method: "POST", body: form });
			expect(ok.status).toBe(200);
			expect(await ok.json()).toEqual({
				name: "notes.txt",
				size: 12,
				type: "text/plain;charset=utf-8",
			});

			const empty = await fetch(url, {
				method: "POST",
				body: new FormData(),
			});
			expect(empty.status).toBe(400);

			await app.close();
		} finally {
			setLogRequests(prev ?? true);
		}
	});
});

describe("real-world custom error and 404 handlers (native vs JS path)", () => {
	const buildErrorApp = (logRequests: boolean): Buntok => {
		const prev = (logger as LoggerInternals)._logRequests;
		setLogRequests(logRequests);
		try {
			const app = new Buntok({ handleSignals: false });
			app.disable("x-powered-by");
			app.onError(() => new Response("custom error", { status: 418 }));
			app.notFound((ctx) => ctx.json({ error: "custom not found" }, 404));
			app.get("/ok", () => "ok");
			app.get("/boom", () => {
				throw new Error("boom");
			});
			app.listen(0);
			return app;
		} finally {
			setLogRequests(prev ?? true);
		}
	};

	it("routes thrown errors and unknown paths through the custom handlers identically", async () => {
		const native = buildErrorApp(false);
		const js = buildErrorApp(true);
		try {
			expect(routesOf(native)["/ok"]).toBeDefined();
			expect(Object.keys(routesOf(js))).toHaveLength(0);

			for (const path of ["/ok", "/boom", "/missing"]) {
				const a = await fetch(`http://localhost:${native.server?.port}${path}`);
				const b = await fetch(`http://localhost:${js.server?.port}${path}`);
				const at = await a.text();
				const bt = await b.text();
				expect(a.status).toBe(b.status);
				expect(at).toBe(bt);

				if (path === "/boom") {
					expect(a.status).toBe(418);
					expect(at).toBe("custom error");
				} else if (path === "/missing") {
					expect(a.status).toBe(404);
					expect(at).toContain("custom not found");
				} else {
					expect(a.status).toBe(200);
					expect(at).toBe("ok");
				}
			}
		} finally {
			await native.close();
			await js.close();
		}
	});
});

@Controller("/deco")
class DecoratedController {
	@Get("/created")
	@HttpCode(201)
	created() {
		return { ok: true };
	}

	@Get("/flag")
	@SetHeader("x-decorated", "yes")
	flag() {
		return "flagged";
	}

	@Get("/away")
	@Redirect("/health", 302)
	away() {
		return "redirecting";
	}
}

describe("real-world decorated controller", () => {
	it("applies @HttpCode, @SetHeader, and @Redirect with production flags", async () => {
		const prev = (logger as LoggerInternals)._logRequests;
		setLogRequests(false);
		try {
			const app = new Buntok({ handleSignals: false });
			app.disable("x-powered-by");
			app.get("/health", () => "ok");
			app.registerController(DecoratedController);
			app.listen(0);
			const base = `http://localhost:${app.server?.port}`;

			const created = await fetch(`${base}/deco/created`);
			expect(created.status).toBe(201);
			expect(await created.json()).toEqual({ ok: true });

			const flag = await fetch(`${base}/deco/flag`);
			expect(flag.status).toBe(200);
			expect(flag.headers.get("x-decorated")).toBe("yes");
			expect(await flag.text()).toBe("flagged");

			const away = await fetch(`${base}/deco/away`, {
				redirect: "manual",
			});
			expect(away.status).toBe(302);
			expect(away.headers.get("location")).toBe("/health");

			await app.close();
		} finally {
			setLogRequests(prev ?? true);
		}
	});
});

describe("real-world store and DI wiring", () => {
	it("carries route-middleware store values and container config on the native path", async () => {
		const prev = (logger as LoggerInternals)._logRequests;
		setLogRequests(false);
		try {
			const container = new Container();
			container.register("config", { useValue: { apiKey: "abc123" } });

			const app = new Buntok({ handleSignals: false });
			app.disable("x-powered-by");
			app.setContainer(container);
			const attachUser = (ctx: any, next: any) => {
				ctx.store.user = { id: 7, name: "Pitok" };
				return next();
			};
			app.get("/me", attachUser, (ctx) => ctx.json({ user: ctx.store.user }));
			app.get("/cfg", attachUser, (ctx) =>
				ctx.json({ apiKey: container.resolve<{ apiKey: string }>("config").apiKey }),
			);
			app.listen(0);

			expect(typeof routesOf(app)["/me"]?.GET).toBe("function");
			expect(typeof routesOf(app)["/cfg"]?.GET).toBe("function");

			const me = await fetch(`http://localhost:${app.server?.port}/me`);
			expect(await me.json()).toEqual({ user: { id: 7, name: "Pitok" } });

			const cfg = await fetch(`http://localhost:${app.server?.port}/cfg`);
			expect(await cfg.json()).toEqual({ apiKey: "abc123" });

			await app.close();
		} finally {
			setLogRequests(prev ?? true);
		}
	});
});

describe("real-world default flags (X-Powered-By stays on)", () => {
	const buildDefaultApp = (logRequests: boolean): Buntok => {
		const prev = (logger as LoggerInternals)._logRequests;
		setLogRequests(logRequests);
		try {
			// No app.disable("x-powered-by") - the out-of-the-box production shape.
			const app = new Buntok({ handleSignals: false });
			app.get("/", "Welcome to Tasks API");
			app.post("/echo", async (ctx) => ctx.json(await ctx.body()));
			app.listen(0);
			return app;
		} finally {
			setLogRequests(prev ?? true);
		}
	};

	it("keeps value handlers on the JS path but serves identical wire output", async () => {
		const native = buildDefaultApp(false);
		const js = buildDefaultApp(true);
		try {
			// value handlers still promote - X-Powered-By is baked into the
			// materialized Response; only dir/Blob values fall back to JS
			expect(routesOf(native)["/"]?.GET).toBeInstanceOf(Response);
			expect(typeof routesOf(native)["/echo"]?.POST).toBe("function");
			expect(Object.keys(routesOf(js))).toHaveLength(0);

			const a = await fetch(`http://localhost:${native.server?.port}/`);
			const b = await fetch(`http://localhost:${js.server?.port}/`);
			expect(a.status).toBe(b.status);
			expect(await a.text()).toBe(await b.text());
			expect(a.headers.get("x-powered-by")).toBe(
				b.headers.get("x-powered-by"),
			);
			expect(a.headers.get("x-powered-by")).toContain("buntok");

			const echoInit: RequestInit = {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: '{"ping":1}',
			};
			const ea = await fetch(`http://localhost:${native.server?.port}/echo`, echoInit);
			const eb = await fetch(`http://localhost:${js.server?.port}/echo`, echoInit);
			expect(ea.status).toBe(eb.status);
			expect(await ea.json()).toEqual(await eb.json());
			expect(ea.headers.get("x-powered-by")).toBe(
				eb.headers.get("x-powered-by"),
			);
		} finally {
			await native.close();
			await js.close();
		}
	});
});

describe("real-world post-listen configuration", () => {
	it("applies middleware registered after listen() to subsequent requests", async () => {
		const app = new Buntok({ handleSignals: false });
		app.disable("x-powered-by");
		app.get("/health", () => "ok");
		app.listen(0);

		const before = await fetch(`http://localhost:${app.server?.port}/health`);
		expect(before.headers.get("x-app-touched")).toBeNull();

		app.use(async (_ctx, next) => {
			const result = await next();
			if (result instanceof Response)
				result.headers.set("x-app-touched", "yes");
			return result;
		});

		const after = await fetch(`http://localhost:${app.server?.port}/health`);
		expect(after.status).toBe(200);
		expect(after.headers.get("x-app-touched")).toBe("yes");
		expect(await after.text()).toBe("ok");

		await app.close();
	});
});
