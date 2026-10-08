import { afterEach, describe, expect, it, spyOn } from "bun:test";
import { Buntok } from "../src/buntok";
import { logger, redactLogMeta } from "../src/logger";

describe("redactLogMeta", () => {
	it("redacts sensitive keys recursively", () => {
		const result = redactLogMeta({
			authorization: "Bearer secret-token",
			user: {
				password: "hunter2",
				name: "Ada",
			},
			items: [{ apiKey: "key-value", id: 1 }],
		});

		expect(result).toEqual({
			authorization: "[REDACTED]",
			user: { password: "[REDACTED]", name: "Ada" },
			items: [{ apiKey: "[REDACTED]", id: 1 }],
		});
		expect(JSON.stringify(result)).not.toContain("secret-token");
		expect(JSON.stringify(result)).not.toContain("hunter2");
	});

	it("handles circular metadata", () => {
		const value: Record<string, unknown> = { name: "request" };
		value.self = value;

		expect(redactLogMeta(value)).toEqual({ name: "request", self: "[Circular]" });
	});
});

describe("app.disable/enable('logger')", () => {
	afterEach(() => {
		// Restore the global (singleton) flags so they don't leak into other tests.
		logger.enabled = true;
		logger.logRequests = true;
	});

	it("toggles the logger flags", () => {
		const app = new Buntok();

		app.disable("logger");
		expect(logger.enabled).toBe(false);
		expect(logger.logRequests).toBe(false);

		app.enable("logger");
		expect(logger.enabled).toBe(true);
		expect(logger.logRequests).toBe(true);
	});

	it("applies disable/enable to live traffic after listen (AOT recompile)", async () => {
		const app = new Buntok();
		app.get("/", () => "ok");
		app.disable("logger");
		app.listen(0);
		const port = app.server?.port ?? 0;

		try {
			const before = await fetch(`http://127.0.0.1:${port}/`);
			expect(before.status).toBe(200);
			expect(before.headers.get("x-powered-by")).toBe("buntok");

			app.disable("x-powered-by");
			const after = await fetch(`http://127.0.0.1:${port}/`);
			expect(after.status).toBe(200);
			expect(after.headers.get("x-powered-by")).toBeNull();

			app.enable("x-powered-by");
			const restored = await fetch(`http://127.0.0.1:${port}/`);
			expect(restored.headers.get("x-powered-by")).toBe("buntok");
		} finally {
			app.server?.stop();
		}
	});

	it("silences request logs while disabled and restores them when enabled", async () => {
		const app = new Buntok();
		app.get("/", () => "ok");

		logger.flushSync();
		const writes: string[] = [];
		const writeSpy = spyOn(process.stdout, "write").mockImplementation(((chunk: unknown) => {
			writes.push(String(chunk));
			return true;
		}) as never);

		try {
			app.disable("logger");
			const res = await app.request("/");
			expect(res.status).toBe(200);
			await new Promise((resolve) => setTimeout(resolve, 20));
			const stripAnsi = (s: string) => s.replace(/\x1b\[[0-9;]*m/g, "");
			expect(stripAnsi(writes.join(""))).not.toContain("[INFO] GET /");

			app.enable("logger");
			const res2 = await app.request("/");
			expect(res2.status).toBe(200);
			await new Promise((resolve) => setTimeout(resolve, 20));
			expect(stripAnsi(writes.join(""))).toContain("[INFO] GET /");
		} finally {
			writeSpy.mockRestore();
		}
	});

	it("silences the startup banner when disabled", async () => {
		const app = new Buntok();
		app.get("/", () => "ok");
		app.disable("logger");

		const logs: string[] = [];
		const logSpy = spyOn(console, "log").mockImplementation(((...args: unknown[]) => {
			logs.push(args.map(String).join(" "));
		}) as never);

		try {
			app.listen(0);
			expect(logs.join("")).not.toContain("ready in");
		} finally {
			logSpy.mockRestore();
			await app.close();
		}
	});
});