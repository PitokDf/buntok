import { describe, it, expect } from "bun:test";
import { createPlugin } from "../src/plugin";
import { Buntok } from "../src/buntok";

describe("createPlugin", () => {
	it("should create a plugin with name and install function", () => {
		const plugin = createPlugin({
			name: "test-plugin",
			install: (app) => {
				app.get("/plugin-route", (ctx) => ctx.json({ from: "plugin" }));
			},
		});

		expect(plugin.name).toBe("test-plugin");
		expect(typeof plugin.install).toBe("function");
	});

	it("should install plugin into app", async () => {
		const plugin = createPlugin({
			name: "test-plugin",
			install: (app) => {
				app.get("/plugin-route", (ctx) => ctx.json({ from: "plugin" }));
			},
		});

		const app = new Buntok();
		app.plugin(plugin);

		const res = await app.request("/plugin-route");
		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body.from).toBe("plugin");
	});

	it("should support async install", async () => {
		const plugin = createPlugin({
			name: "async-plugin",
			install: async (app) => {
				app.get("/async-route", (ctx) => ctx.json({ async: true }));
			},
		});

		const app = new Buntok();
		await app.plugin(plugin);

		const res = await app.request("/async-route");
		expect(res.status).toBe(200);
	});

	it("should support dispose function", () => {
		let disposed = false;

		const plugin = createPlugin({
			name: "disposable",
			install: (app) => {},
			dispose: () => {
				disposed = true;
			},
		});

		expect(plugin.dispose).toBeDefined();
		plugin.dispose!({} as any);
		expect(disposed).toBe(true);
	});

	it("should allow plugin to add middleware", async () => {
		let middlewareRan = false;

		const plugin = createPlugin({
			name: "mw-plugin",
			install: (app) => {
				app.use(async (ctx, next) => {
					middlewareRan = true;
					return next();
				});
				app.get("/mw-route", (ctx) => ctx.json({ ok: true }));
			},
		});

		const app = new Buntok();
		app.plugin(plugin);

		const res = await app.request("/mw-route");
		expect(res.status).toBe(200);
		expect(middlewareRan).toBe(true);
	});

	it("should allow multiple plugins", async () => {
		const plugin1 = createPlugin({
			name: "p1",
			install: (app) => {
				app.get("/p1", (ctx) => ctx.json({ from: "p1" }));
			},
		});

		const plugin2 = createPlugin({
			name: "p2",
			install: (app) => {
				app.get("/p2", (ctx) => ctx.json({ from: "p2" }));
			},
		});

		const app = new Buntok();
		app.plugin(plugin1);
		app.plugin(plugin2);

		const res1 = await app.request("/p1");
		expect(res1.status).toBe(200);
		const body1 = await res1.json();
		expect(body1.from).toBe("p1");

		const res2 = await app.request("/p2");
		expect(res2.status).toBe(200);
		const body2 = await res2.json();
		expect(body2.from).toBe("p2");
	});
});
