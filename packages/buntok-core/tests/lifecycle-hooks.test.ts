import { describe, expect, it } from "bun:test";
import { z } from "zod";
import { Buntok } from "../src/buntok";
import { zValidator } from "../src/middlewares/validator";

describe("app lifecycle hooks", () => {
	it("runs hooks in Elysia order: onRequest, middleware, derive, onBeforeHandle, handler, onAfterHandle, middleware tail", async () => {
		const order: string[] = [];
		const app = new Buntok();
		app.onRequest(() => {
			order.push("request");
		});
		app.use(async (_ctx, next) => {
			order.push("mw:pre");
			const res = await next();
			order.push("mw:post");
			return res;
		});
		app.derive(() => {
			order.push("derive");
			return { derived: true };
		});
		app.onBeforeHandle(() => {
			order.push("before");
		});
		app.onAfterHandle((_ctx, res) => {
			order.push("after");
			res.headers.set("x-after", "1");
		});
		app.get("/", (ctx) => {
			order.push(`handler:${String(ctx.store.derived)}`);
			return "ok";
		});

		const res = await app.request("/");
		expect(res.status).toBe(200);
		expect(res.headers.get("x-after")).toBe("1");
		expect(order).toEqual([
			"request",
			"mw:pre",
			"derive",
			"before",
			"handler:true",
			"after",
			"mw:post",
		]);
	});

	it("onRequest can short-circuit before middleware and handler", async () => {
		const app = new Buntok();
		let handlerRan = false;
		let mwRan = false;
		app.onRequest(() => new Response("blocked", { status: 418 }));
		app.use((_ctx, next) => {
			mwRan = true;
			return next();
		});
		app.get("/", () => {
			handlerRan = true;
			return "ok";
		});

		const res = await app.request("/");
		expect(res.status).toBe(418);
		expect(await res.text()).toBe("blocked");
		expect(handlerRan).toBe(false);
		expect(mwRan).toBe(false);
	});

	it("onBeforeHandle can short-circuit before the handler", async () => {
		const app = new Buntok();
		let handlerRan = false;
		let requestRan = false;
		app.onRequest(() => {
			requestRan = true;
		});
		app.onBeforeHandle(() => new Response("nope", { status: 403 }));
		app.get("/", () => {
			handlerRan = true;
			return "ok";
		});

		const res = await app.request("/");
		expect(res.status).toBe(403);
		expect(requestRan).toBe(true);
		expect(handlerRan).toBe(false);
	});

	it("derive supports async hooks and merges into ctx.store", async () => {
		const app = new Buntok();
		app.derive(async () => {
			await Promise.resolve();
			return { tenant: "acme" };
		});
		app.get("/", (ctx) => ({ tenant: ctx.store.tenant }));

		const res = await app.request("/");
		expect(await res.json()).toEqual({ tenant: "acme" });
	});

	it("onAfterHandle can replace the response", async () => {
		const app = new Buntok();
		app.onAfterHandle(async () => {
			await Promise.resolve();
			return new Response("replaced", { status: 201 });
		});
		app.get("/", () => "original");

		const res = await app.request("/");
		expect(res.status).toBe(201);
		expect(await res.text()).toBe("replaced");
	});

	it("ctx.onAfterResponse hooks run on the final response", async () => {
		const app = new Buntok();
		app.get("/", (ctx) => {
			ctx.onAfterResponse((res) => {
				res.headers.set("x-final", "yes");
				return res;
			});
			return "ok";
		});

		const res = await app.request("/");
		expect(res.headers.get("x-final")).toBe("yes");
		expect(await res.text()).toBe("ok");
	});
});

describe("app.model registry", () => {
	it("resolves model names in zValidator and exposes getModel", () => {
		const app = new Buntok();
		const schema = zValidatorSchema();
		app.model("LifecycleUserBody", schema);
		expect(app.getModel("LifecycleUserBody")).toBe(schema);
	});

	it("validates routes registered with a model name string", async () => {
		const app = new Buntok();
		app.model("LifecycleUserBody", zValidatorSchema());
		app.post("/users", zValidator("body", "LifecycleUserBody"), (ctx) =>
			ctx.valid("body"),
		);

		const ok = await app.request("/users", {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({ name: "Budi" }),
		});
		expect(ok.status).toBe(200);
		expect(await ok.json()).toEqual({ name: "Budi" });

		const bad = await app.request("/users", {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({ name: 123 }),
		});
		expect(bad.status).toBe(422);
	});

	it("supports the object overload", () => {
		const app = new Buntok();
		const a = zValidatorSchema();
		app.model({ LifecycleA: a, LifecycleB: a });
		expect(app.getModel("LifecycleA")).toBe(a);
		expect(app.getModel("LifecycleB")).toBe(a);
	});
});

describe("app.decorate", () => {
	it("single key lands on ctx.di", async () => {
		const base = new Buntok();
		const app = base.decorate("lifecycleVersion", "9.9.9");
		app.get("/", (ctx) => ctx.di.lifecycleVersion);

		const res = await app.request("/");
		expect(await res.text()).toBe("9.9.9");
	});

	it("record overload narrows the DI type", async () => {
		const base = new Buntok();
		const app = base.decorate({ lifecycleAnswer: 42 });
		app.get("/", (ctx) => ctx.di.lifecycleAnswer);

		const res = await app.request("/");
		expect(await res.json()).toBe(42);
	});
});

describe("app.onStart / app.onStop", () => {
	it("fires start on listen and stop on close", async () => {
		let started = false;
		let stopped = false;
		const app = new Buntok({ handleSignals: false });
		app.onStart(() => {
			started = true;
		});
		app.onStop(() => {
			stopped = true;
		});
		app.get("/ping", () => "pong");
		app.listen(0);
		expect(started).toBe(true);
		expect(app.server?.port).toBeGreaterThan(0);

		const res = await fetch(`http://localhost:${app.server?.port}/ping`);
		expect(await res.text()).toBe("pong");
		await app.close();
		expect(stopped).toBe(true);
	});

	it("hooks apply on the AOT listen path (static route + native gate)", async () => {
		const app = new Buntok({ handleSignals: false });
		app.onRequest(() => {});
		app.onBeforeHandle(() => {});
		app.onAfterHandle((_ctx, res) => {
			res.headers.set("x-lifecycle", "1");
		});
		app.get("/hi", "static-ok");
		app.listen(0);
		const res = await fetch(`http://localhost:${app.server?.port}/hi`);
		expect(res.headers.get("x-lifecycle")).toBe("1");
		expect(await res.text()).toBe("static-ok");
		await app.close();
	});
});

function zValidatorSchema() {
	return z.object({ name: z.string() });
}
