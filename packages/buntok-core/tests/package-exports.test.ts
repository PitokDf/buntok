import { describe, expect, it } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dir, "..");
const DIST = join(ROOT, "dist");
const PKG = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf-8"));

describe("Package exports", () => {
	it("has correct package.json exports map", () => {
		expect(PKG.exports).toBeDefined();
		expect(PKG.exports["./package.json"]).toBe("./package.json");
		expect(PKG.exports["."]).toBeDefined();
		expect(PKG.exports["."].import).toBeDefined();
		expect(PKG.exports["."].require).toBeDefined();
		expect(PKG.exports["."].default).toBeDefined();
		expect(PKG.exports["./all"]).toBeDefined();
		expect(PKG.exports["./app"]).toBeDefined();
		expect(PKG.exports["./helpers"]).toBeDefined();
		expect(PKG.exports["./middlewares"]).toBeDefined();
		expect(PKG.exports["./queue"]).toBeDefined();
		expect(PKG.exports["./schedule"]).toBeDefined();
	});

	it("has ESM entry file", () => {
		const esmPath = join(DIST, "core-exports.js");
		expect(existsSync(esmPath)).toBe(true);
	});

	it("has CJS entry file", () => {
		const cjsPath = join(DIST, "core-exports.cjs");
		expect(existsSync(cjsPath)).toBe(true);
	});

	it("has TypeScript declarations", () => {
		const dtsPath = join(DIST, "core-exports.d.ts");
		expect(existsSync(dtsPath)).toBe(true);
	});

	it("has CJS TypeScript declarations", () => {
		const dctsPath = join(DIST, "core-exports.d.cts");
		expect(existsSync(dctsPath)).toBe(true);
	});

	it("ESM import resolves App class", async () => {
		const mod = await import(join(DIST, "core-exports.js"));
		expect(mod.App).toBeDefined();
		expect(typeof mod.App).toBe("function");
	});

	it("CJS require resolves App class", () => {
		const mod = require(join(DIST, "core-exports.cjs"));
		expect(mod.App).toBeDefined();
		expect(typeof mod.App).toBe("function");
	});

	it("exports VERSION string", async () => {
		const mod = await import(join(DIST, "core-exports.js"));
		expect(typeof mod.VERSION).toBe("string");
		expect(mod.VERSION).toMatch(/^\d+\.\d+\.\d+/);
	});

	it("exports z from validator subpath", async () => {
		const mod = await import(join(DIST, "middlewares", "validator.js"));
		expect(mod.z).toBeDefined();
		expect(typeof mod.z.object).toBe("function");
	});

	it("exports Logger class", async () => {
		const mod = await import(join(DIST, "core-exports.js"));
		expect(mod.Logger).toBeDefined();
		expect(typeof mod.Logger).toBe("function");
	});

	it("exports cors from core", async () => {
		const mod = await import(join(DIST, "core-exports.js"));
		expect(typeof mod.cors).toBe("function");
	});

	it("exports middleware functions from core", async () => {
		const mod = await import(join(DIST, "core-exports.js"));
		expect(typeof mod.helmet).toBe("function");
		expect(typeof mod.compress).toBe("function");
		expect(typeof mod.requestId).toBe("function");
		expect(typeof mod.timeout).toBe("function");
	});

	it("slim root does NOT export heavy/subpath-only modules", async () => {
		const mod = await import(join(DIST, "core-exports.js"));
		expect(mod.Queue).toBeUndefined();
		expect(mod.Scheduler).toBeUndefined();
		expect(mod.SSE).toBeUndefined();
		expect(mod.Mailer).toBeUndefined();
		expect(mod.TemplateEngine).toBeUndefined();
		expect(mod.Metrics).toBeUndefined();
	});

	it("all subpath exports Queue and drivers (backward compat)", async () => {
		const mod = await import(join(DIST, "all.js"));
		expect(mod.Queue).toBeDefined();
		expect(mod.MemoryQueueDriver).toBeDefined();
		expect(mod.Scheduler).toBeDefined();
		expect(mod.SSE).toBeDefined();
		expect(mod.Mailer).toBeDefined();
		expect(mod.App).toBeDefined();
	});

	it("exports helpers from core", async () => {
		const mod = await import(join(DIST, "core-exports.js"));
		expect(typeof mod.delay).toBe("function");
		expect(typeof mod.retry).toBe("function");
		expect(typeof mod.nanoid).toBe("function");
		expect(typeof mod.ulid).toBe("function");
	});

	it("helpers subpath export resolves", async () => {
		const mod = await import(join(DIST, "helpers", "index.js"));
		expect(typeof mod.setCookie).toBe("function");
		expect(typeof mod.nanoid).toBe("function");
		expect(typeof mod.delay).toBe("function");
		expect(typeof mod.HttpError).toBe("function");
	});

	it("middlewares subpath export resolves", async () => {
		const mod = await import(join(DIST, "middlewares", "index.js"));
		expect(typeof mod.cors).toBe("function");
		expect(typeof mod.rateLimiter).toBe("function");
		expect(typeof mod.timeout).toBe("function");
	});

	it("app subpath export resolves", async () => {
		const mod = await import(join(DIST, "app.js"));
		expect(typeof mod.App).toBe("function");
	});

	it("client subpath export resolves", async () => {
		if (!PKG.exports["./client"]) return;
		const clientMod = await import(join(DIST, "client.js"));
		expect(clientMod.createClient).toBeDefined();
		expect(typeof clientMod.createClient).toBe("function");
	});

	it("feature subpaths resolve", async () => {
		const queueMod = await import(join(DIST, "queue.js"));
		expect(queueMod.Queue).toBeDefined();
		const scheduleMod = await import(join(DIST, "schedule.js"));
		expect(scheduleMod.CronJob).toBeDefined();
		const sseMod = await import(join(DIST, "sse.js"));
		expect(sseMod.SSE).toBeDefined();
		const uploadMod = await import(join(DIST, "upload.js"));
		expect(uploadMod.uploader).toBeDefined();
		const templateMod = await import(join(DIST, "template.js"));
		expect(templateMod.TemplateEngine).toBeDefined();
		const metricsMod = await import(join(DIST, "metrics.js"));
		expect(metricsMod.Metrics).toBeDefined();
	});

	it("all exports are defined (no undefined values)", async () => {
		const mod = await import(join(DIST, "core-exports.js"));
		const exported = Object.keys(mod);
		for (const key of exported) {
			expect(mod[key]).not.toBe(undefined);
		}
	});
});