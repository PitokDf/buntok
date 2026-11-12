import { describe, expect, it } from "bun:test";
import { Buntok } from "../src/buntok";

function fakeServer(): any {
	return {};
}

async function getFreePort(): Promise<number> {
	const probe = Bun.serve({ port: 0, fetch: () => new Response("probe") });
	const port = probe.port;
	await probe.stop(true);
	return port;
}

// biome-ignore lint/suspicious/noExplicitAny: asserting on serve options
function serveOptions(app: Buntok): any {
	return (app as any)._serveOptions;
}

describe("httpIdleTimeout", () => {
	it("should default to 120s (above the 30s SSE heartbeat)", async () => {
		const app = new Buntok();
		const port = await getFreePort();
		app.listen(port);
		try {
			expect(serveOptions(app).idleTimeout).toBe(120);
		} finally {
			await app.close({ timeout: 1000, force: true });
		}
	});

	it("should accept a constructor override and clamp Bun's 255s limit", async () => {
		const overLimit = new Buntok({ httpIdleTimeout: 1000 });
		expect((overLimit as any)._httpIdleTimeout).toBe(255);

		const underLimit = new Buntok({ httpIdleTimeout: 45 });
		expect((underLimit as any)._httpIdleTimeout).toBe(45);
	});

	it("should apply app.httpIdleTimeout() before listen()", async () => {
		const app = new Buntok();
		app.httpIdleTimeout(30);

		const port = await getFreePort();
		app.listen(port);
		try {
			expect(serveOptions(app).idleTimeout).toBe(30);
		} finally {
			await app.close({ timeout: 1000, force: true });
		}
	});

	it("should apply app.httpIdleTimeout() on a running server", async () => {
		const app = new Buntok();
		app.get("/ping", () => "pong");

		const port = await getFreePort();
		app.listen(port);
		try {
			app.httpIdleTimeout(60);
			expect(serveOptions(app).idleTimeout).toBe(60);

			const res = await app.fetch(
				new Request(`http://localhost:${port}/ping`),
				fakeServer(),
			);
			expect(await res.text()).toBe("pong");
		} finally {
			await app.close({ timeout: 1000, force: true });
		}
	});

	it("should keep an SSE stream alive past the server idle timeout", async () => {
		const app = new Buntok();
		// Server would kill the connection after 1s of silence...
		app.httpIdleTimeout(1);
		app.get("/events", (ctx) =>
			ctx.sse(
				(sse) => {
					sse.sendData("tick");
				},
				{
					sendInitial: false,
					heartbeatInterval: 300, // ...but heartbeats keep resetting it
					retry: 1000,
				},
			),
		);

		const port = await getFreePort();
		app.listen(port);
		const res = await fetch(`http://localhost:${port}/events`);
		expect(res.status).toBe(200);

		const reader = res.body!.getReader();
		const decoder = new TextDecoder();
		let text = "";
		const deadline = Date.now() + 2500; // 2.5x the idle timeout
		try {
			while (Date.now() < deadline) {
				const { value, done } = await reader.read();
				if (done) break;
				text += decoder.decode(value);
			}
			// Survived beyond the idle timeout and kept heartbeating
			expect(text).toContain(": heartbeat");
		} finally {
			await reader.cancel().catch(() => {});
			await app.close({ timeout: 1000, force: true });
		}
	});
});
