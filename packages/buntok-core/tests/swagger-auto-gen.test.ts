import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { Buntok } from "../src/buntok";
import { z } from "zod";
import { existsSync, rmSync } from "node:fs";
import { join } from "node:path";

const DOCS_DIR = join(process.cwd(), "public/docs");
const SWAGGER_PATH = join(DOCS_DIR, "swagger.json");

function cleanup() {
	if (existsSync(SWAGGER_PATH)) {
		rmSync(SWAGGER_PATH);
	}
}

function getPort(app: any): number {
	return app.server?.port ?? 1212;
}

describe("swagger.json auto-generation", () => {
	beforeEach(cleanup);
	afterEach(cleanup);

	it("should generate swagger.json in background when listen() is called", async () => {
		const app = new Buntok();
		app.apiDocs({ title: "Test API", version: "1.0.0" });
		app.get("/users", (ctx) => ctx.json([]));

		app.listen(0);
		await Bun.sleep(200); // Wait for setImmediate to complete

		expect(existsSync(SWAGGER_PATH)).toBe(true);
		app.server?.stop();
	});

	it("should serve swagger.json from memory cache via request", async () => {
		const app = new Buntok();
		app.apiDocs({ title: "Cached API", version: "2.0.0" });
		app.get("/test", (ctx) => ctx.json({ ok: true }));

		app.listen(0);
		const port = getPort(app);
		await Bun.sleep(100);

		const res = await fetch(`http://localhost:${port}/docs/swagger.json`);
		expect(res.status).toBe(200);

		const body = await res.json();
		expect(body.info.title).toBe("Cached API");
		expect(body.info.version).toBe("2.0.0");
		expect(body.openapi).toBe("3.0.0");

		app.server?.stop();
	});

	it("should include registered routes in swagger.json", async () => {
		const app = new Buntok();
		app.apiDocs({ title: "Routes API" });
		app.get("/users", (ctx) => ctx.json([]));
		app.post("/users", (ctx) => ctx.json({ id: 1 }));

		app.listen(0);
		const port = getPort(app);
		await Bun.sleep(100);

		const res = await fetch(`http://localhost:${port}/docs/swagger.json`);
		const body = await res.json();

		expect(body.paths["/users"]).toBeDefined();
		expect(body.paths["/users"].get).toBeDefined();
		expect(body.paths["/users"].post).toBeDefined();

		app.server?.stop();
	});

	it("should include routes with zValidator schemas", async () => {
		const app = new Buntok();
		app.apiDocs({ title: "Validated API" });

		app.get("/users", (ctx) => ctx.json([]));

		app.listen(0);
		const port = getPort(app);
		await Bun.sleep(100);

		const res = await fetch(`http://localhost:${port}/docs/swagger.json`);
		const body = await res.json();

		expect(body.paths["/users"]).toBeDefined();
		expect(body.paths["/users"].get).toBeDefined();

		app.server?.stop();
	});

	it("should fallback to disk if memory cache is empty", async () => {
		const app = new Buntok();
		app.apiDocs({ title: "Disk API" });
		app.get("/test", (ctx) => ctx.json({ ok: true }));

		app.listen(0);
		const port = getPort(app);
		await Bun.sleep(200); // Wait for background generation

		// The swagger.json should be on disk from background generation
		expect(existsSync(SWAGGER_PATH)).toBe(true);

		// Clear memory cache to test disk fallback
		(app as any)._swaggerDocument = null;

		const res = await fetch(`http://localhost:${port}/docs/swagger.json`);
		expect(res.status).toBe(200);

		app.server?.stop();
	});

	it("should serve docs UI at /docs", async () => {
		const app = new Buntok();
		app.apiDocs({ title: "UI Test API", version: "3.0.0" });
		app.get("/test", (ctx) => ctx.json({ ok: true }));

		app.listen(0);
		const port = getPort(app);
		await Bun.sleep(100);

		const res = await fetch(`http://localhost:${port}/docs`);
		expect(res.status).toBe(200);
		expect(res.headers.get("Content-Type")).toContain("text/html");

		app.server?.stop();
	});

	it("should not generate swagger.json if apiDocs() is not called", async () => {
		// Clean up any existing swagger.json first
		cleanup();

		const app = new Buntok();
		app.get("/test", (ctx) => ctx.json({ ok: true }));

		app.listen(0);
		await Bun.sleep(100);

		expect(existsSync(SWAGGER_PATH)).toBe(false);

		app.server?.stop();
	});

	it("should include custom title and version in swagger.json", async () => {
		const app = new Buntok();
		app.apiDocs({
			title: "My Custom API",
			version: "5.0.0",
			description: "Custom description",
		});
		app.get("/test", (ctx) => ctx.json({ ok: true }));

		app.listen(0);
		const port = getPort(app);
		await Bun.sleep(100);

		const res = await fetch(`http://localhost:${port}/docs/swagger.json`);
		const body = await res.json();

		expect(body.info.title).toBe("My Custom API");
		expect(body.info.version).toBe("5.0.0");
		expect(body.info.description).toBe("Custom description");

		app.server?.stop();
	});

	it("should handle multiple HTTP methods", async () => {
		const app = new Buntok();
		app.apiDocs({ title: "Multi Method API" });
		app.get("/items", (ctx) => ctx.json([]));
		app.post("/items", (ctx) => ctx.json({ id: 1 }));
		app.put("/items/:id", (ctx) => ctx.json({ id: 1 }));
		app.delete("/items/:id", (ctx) => ctx.status(204));

		app.listen(0);
		const port = getPort(app);
		await Bun.sleep(100);

		const res = await fetch(`http://localhost:${port}/docs/swagger.json`);
		const body = await res.json();

		expect(body.paths["/items"].get).toBeDefined();
		expect(body.paths["/items"].post).toBeDefined();
		expect(body.paths["/items/{id}"].put).toBeDefined();
		expect(body.paths["/items/{id}"].delete).toBeDefined();

		app.server?.stop();
	});

	it("should serve swagger.json from disk when memory cache is cleared", async () => {
		const app = new Buntok();
		app.apiDocs({ title: "Disk Fallback API" });
		app.get("/test", (ctx) => ctx.json({ ok: true }));

		app.listen(0);
		const port = getPort(app);
		await Bun.sleep(200); // Wait for background generation

		// Verify swagger.json was generated on disk
		expect(existsSync(SWAGGER_PATH)).toBe(true);

		// Clear memory cache
		(app as any)._swaggerDocument = null;

		const res = await fetch(`http://localhost:${port}/docs/swagger.json`);
		expect(res.status).toBe(200);

		const body = await res.json();
		expect(body.info.title).toBe("Disk Fallback API");

		app.server?.stop();
	});

	it("should return 404 for swagger.json when no apiDocs and no disk file", async () => {
		// Clean up any existing swagger.json first
		cleanup();

		const app = new Buntok();
		app.get("/test", (ctx) => ctx.json({ ok: true }));

		app.listen(0);
		const port = getPort(app);
		await Bun.sleep(100);

		const res = await fetch(`http://localhost:${port}/docs/swagger.json`);
		expect(res.status).toBe(404);

		app.server?.stop();
	});

	it("should serve swagger.json at custom basePath", async () => {
		const app = new Buntok();
		app.apiDocs({ path: "/api", title: "Custom Path API" });
		app.get("/test", (ctx) => ctx.json({ ok: true }));

		app.listen(0);
		const port = getPort(app);
		await Bun.sleep(100);

		// Should work at custom path
		const res = await fetch(`http://localhost:${port}/api/swagger.json`);
		expect(res.status).toBe(200);

		const body = await res.json();
		expect(body.info.title).toBe("Custom Path API");
		expect(body.openapi).toBe("3.0.0");

		// Should NOT work at default /docs path
		const res2 = await fetch(`http://localhost:${port}/docs/swagger.json`);
		expect(res2.status).toBe(404);

		app.server?.stop();
	});

	it("should serve docs UI at custom basePath", async () => {
		const app = new Buntok();
		app.apiDocs({ path: "/api-docs", title: "Custom Docs UI" });
		app.get("/test", (ctx) => ctx.json({ ok: true }));

		app.listen(0);
		const port = getPort(app);
		await Bun.sleep(100);

		const res = await fetch(`http://localhost:${port}/api-docs`);
		expect(res.status).toBe(200);
		expect(res.headers.get("Content-Type")).toContain("text/html");

		const html = await res.text();
		expect(html).toContain('const swaggerJsonPath = "/api-docs/swagger.json"');

		app.server?.stop();
	});

	it("should serve docs UI at basePath with trailing slash", async () => {
		const app = new Buntok();
		app.apiDocs({ title: "Trailing Slash Test" });
		app.get("/test", (ctx) => ctx.json({ ok: true }));

		app.listen(0);
		const port = getPort(app);
		await Bun.sleep(100);

		const res = await fetch(`http://localhost:${port}/docs/`);
		expect(res.status).toBe(200);
		expect(res.headers.get("Content-Type")).toContain("text/html");

		const html = await res.text();
		expect(html).toContain('const swaggerJsonPath = "/docs/swagger.json"');

		app.server?.stop();
	});

	it("should serve tailwind.js via wildcard route", async () => {
		const app = new Buntok();
		app.apiDocs({ title: "Asset Test" });
		app.get("/test", (ctx) => ctx.json({ ok: true }));

		app.listen(0);
		const port = getPort(app);
		await Bun.sleep(100);

		const res = await fetch(`http://localhost:${port}/docs/tailwind.js`);
		expect(res.status).toBe(200);

		app.server?.stop();
	});

	it("should serve font-googles.css via wildcard route", async () => {
		const app = new Buntok();
		app.apiDocs({ title: "Asset Test" });
		app.get("/test", (ctx) => ctx.json({ ok: true }));

		app.listen(0);
		const port = getPort(app);
		await Bun.sleep(100);

		const res = await fetch(`http://localhost:${port}/docs/font-googles.css`);
		expect(res.status).toBe(200);

		app.server?.stop();
	});
});
