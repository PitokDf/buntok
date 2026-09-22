import { describe, expect, it } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dir, "..");
const DIST = join(ROOT, "dist");
const PKG = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf-8"));

describe("Package exports", () => {
	it("has correct package.json exports map", () => {
		expect(PKG.exports).toBeDefined();
		expect(PKG.exports["."]).toBeDefined();
		expect(PKG.exports["."].import).toBeDefined();
		expect(PKG.exports["."].require).toBeDefined();
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

	it("exports middleware functions from subpath", async () => {
		const mod = await import(join(DIST, "middlewares.js"));
		expect(typeof mod.helmet).toBe("function");
		expect(typeof mod.compress).toBe("function");
		expect(typeof mod.requestId).toBe("function");
		expect(typeof mod.timeout).toBe("function");
	});

	it("exports Queue and drivers from subpath", async () => {
		const mod = await import(join(DIST, "queue.js"));
		expect(mod.Queue).toBeDefined();
		expect(mod.MemoryQueueDriver).toBeDefined();
	});

	it("exports helpers from subpath", async () => {
		const mod = await import(join(DIST, "helpers.js"));
		expect(typeof mod.delay).toBe("function");
		expect(typeof mod.retry).toBe("function");
		expect(typeof mod.nanoid).toBe("function");
		expect(typeof mod.ulid).toBe("function");
	});

	it("client subpath export resolves", async () => {
		if (!PKG.exports["./client"]) return;
		const clientMod = await import(join(DIST, "client.js"));
		expect(clientMod.createClient).toBeDefined();
		expect(typeof clientMod.createClient).toBe("function");
	});

	it("all exports are defined (no undefined values)", async () => {
		const mod = await import(join(DIST, "core-exports.js"));
		const exported = Object.keys(mod);
		for (const key of exported) {
			expect(mod[key]).not.toBe(undefined);
		}
	});
});
