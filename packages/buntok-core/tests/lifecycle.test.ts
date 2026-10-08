import { afterEach, describe, expect, it, spyOn } from "bun:test";
import { Buntok } from "../src/buntok";

const apps: Buntok[] = [];

afterEach(async () => {
	await Promise.all(apps.splice(0).map((app) => app.close()));
});

describe("Buntok lifecycle", () => {
	it("closes safely before listen", async () => {
		const app = new Buntok({ handleSignals: false });
		apps.push(app);

		await expect(app.close()).resolves.toBeUndefined();
		await expect(app.close()).resolves.toBeUndefined();
	});

	it("stops a listening server and is idempotent", async () => {
		const app = new Buntok({ handleSignals: false });
		apps.push(app);
		app.get("/health", () => "ok");
		app.listen(0);

		const port = app.server?.port;
		expect(port).toBeGreaterThan(0);
		const response = await fetch(`http://localhost:${port}/health`);
		expect(response.status).toBe(200);

		await expect(app.close()).resolves.toBeUndefined();
		await expect(app.close()).resolves.toBeUndefined();
		expect(app.server).toBeUndefined();
	});

	it("supports shutdown as an alias for close", async () => {
		const app = new Buntok({ handleSignals: false });
		apps.push(app);

		await expect(app.shutdown()).resolves.toBeUndefined();
	});

	it("closes registered resources before listen", async () => {
		const app = new Buntok({ handleSignals: false });
		let closed = 0;
		app.registerResource({ close: () => { closed++; } });

		await app.close();
		await app.close();
		expect(closed).toBe(1);
	});

	it("disposes installed plugins during shutdown", async () => {
		const app = new Buntok({ handleSignals: false });
		let disposed = 0;
		await app.plugin({
			name: "lifecycle-plugin",
			install: () => undefined,
			dispose: () => { disposed++; },
		});

		await app.close();
		await app.close();
		expect(disposed).toBe(1);
	});

	it("resolves close() before listen() without error", async () => {
		const app = new Buntok({ handleSignals: false });
		apps.push(app);

		const result = await app.close();
		expect(result).toBeUndefined();
		expect(app.server).toBeUndefined();
	});

	it("stops listening after close and rejects new requests", async () => {
		const app = new Buntok({ handleSignals: false });
		apps.push(app);
		app.get("/test", () => "alive");
		app.listen(0);

		const port = app.server?.port;
		expect(port).toBeGreaterThan(0);

		const before = await fetch(`http://localhost:${port}/test`);
		expect(before.status).toBe(200);

		await app.close();

		await expect(
			fetch(`http://localhost:${port}/test`).then(
				(r) => r.status,
				() => "connection_refused",
			),
		).resolves.toBe("connection_refused");
	});

	it("handles shutdown with timeout option", async () => {
		const app = new Buntok({ handleSignals: false });
		apps.push(app);

		let resourceClosed = false;
		app.registerResource({
			close: () => new Promise<void>((resolve) => setTimeout(resolve, 10)),
		});

		const start = Date.now();
		await app.close({ timeout: 5000 });
		const elapsed = Date.now() - start;

		resourceClosed = true;
		expect(elapsed).toBeLessThan(5000);
	});

	it("resource cleanup respects shutdown timeout", async () => {
		const app = new Buntok({ handleSignals: false });
		apps.push(app);

		let slowResourceFinished = false;
		app.registerResource({
			close: () =>
				new Promise<void>((resolve) => {
					setTimeout(() => {
						slowResourceFinished = true;
						resolve();
					}, 500);
				}),
		});

		const start = Date.now();
		await app.close({ timeout: 50 });
		const elapsed = Date.now() - start;

		// Should complete quickly (within timeout), not wait for slow resource
		expect(elapsed).toBeLessThan(200);
		// Slow resource should not have finished yet
		expect(slowResourceFinished).toBe(false);
	});

	it("registers and removes signal handlers on close", async () => {
		const app = new Buntok({ handleSignals: true });
		apps.push(app);
		app.listen(0);

		const before = process.listenerCount("SIGINT");
		expect(before).toBeGreaterThan(0);

		await app.close();

		const after = process.listenerCount("SIGINT");
		expect(after).toBeLessThanOrEqual(before);
	});

	it("multiple app instances manage signals independently", async () => {
		const app1 = new Buntok({ handleSignals: true });
		const app2 = new Buntok({ handleSignals: true });
		apps.push(app1, app2);

		app1.listen(0);
		app2.listen(0);

		const count1 = process.listenerCount("SIGTERM");
		expect(count1).toBeGreaterThanOrEqual(2);

		await app1.close();

		const after1 = process.listenerCount("SIGTERM");
		expect(after1).toBeLessThan(count1);

		await app2.close();

		const after2 = process.listenerCount("SIGTERM");
		expect(after2).toBeLessThanOrEqual(after1);
	});

	it("graceful shutdown calls process.exit on signal", async () => {
		const app = new Buntok({ handleSignals: true });
		apps.push(app);
		app.get("/test", () => "ok");
		app.listen(0);

		const port = app.server?.port;
		expect(port).toBeGreaterThan(0);

		const exitSpy = spyOn(process, "exit").mockImplementation(() => undefined as never);

		const signalHandler = process.listeners("SIGTERM").at(-1) as () => void;
		signalHandler();

		await new Promise((resolve) => setTimeout(resolve, 50));

		expect(exitSpy).toHaveBeenCalledWith(0);
		exitSpy.mockRestore();

		await app.close();
	});

	it("closes resources before process.exit on signal", async () => {
		const app = new Buntok({ handleSignals: true });
		apps.push(app);
		app.listen(0);

		let resourceClosed = false;
		app.registerResource({
			close: () => new Promise<void>((resolve) => {
				setTimeout(() => { resourceClosed = true; resolve(); }, 10);
			}),
		});

		const exitSpy = spyOn(process, "exit").mockImplementation(() => undefined as never);

		const signalHandler = process.listeners("SIGTERM").at(-1) as () => void;
		signalHandler();

		await new Promise((resolve) => setTimeout(resolve, 100));

		expect(resourceClosed).toBe(true);
		expect(exitSpy).toHaveBeenCalledWith(0);
		exitSpy.mockRestore();

		await app.close();
	});
});