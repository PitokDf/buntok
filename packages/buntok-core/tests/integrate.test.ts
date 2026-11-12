import { describe, it, expect } from "bun:test";
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

describe("app.integrate", () => {
	it("should intercept its exact path before router and middleware", async () => {
		const app = new Buntok();
		let middlewareCalled = false;
		app.use(async (_ctx, next) => {
			middlewareCalled = true;
			return next();
		});
		app.get("/", () => "home");
		app.integrate({
			path: "/socket.io/",
			fetch: () => new Response("integrated"),
		});

		const integrated = await app.fetch(
			new Request("http://localhost/socket.io/?EIO=4"),
			fakeServer(),
		);
		expect(await integrated.text()).toBe("integrated");
		expect(middlewareCalled).toBe(false);

		const home = await app.fetch(
			new Request("http://localhost/"),
			fakeServer(),
		);
		expect(await home.text()).toBe("home");
		expect(middlewareCalled).toBe(true);
	});

	it("should not intercept when no server is available", async () => {
		const app = new Buntok();
		app.integrate({
			path: "/socket.io/",
			fetch: () => new Response("integrated"),
		});

		const res = await app.fetch(
			new Request("http://localhost/socket.io/"),
		);
		expect(res.status).toBe(404);
	});

	it("should print integration labels in the startup banner", async () => {
		const app = new Buntok();
		app.integrate({
			path: "/socket.io/",
			label: "Socket.IO",
			fetch: () => new Response("ok"),
		});

		const port = await getFreePort();
		const logs: string[] = [];
		const originalLog = console.log;
		console.log = (...args: unknown[]) => {
			logs.push(args.map(String).join(" "));
		};
		try {
			app.listen(port);
		} finally {
			console.log = originalLog;
		}

		try {
			expect(
				logs.some(
					(line) =>
						line.includes("Socket.IO:") &&
						line.includes(`localhost:${port}/socket.io/`),
				),
			).toBe(true);
		} finally {
			await app.close({ timeout: 1000, force: true });
		}
	});

	it("should compose app.ws() with an external WebSocket handler", async () => {
		const app = new Buntok();
		app.ws("/chat", {
			open(ws) {
				ws.send("hello-buntok");
			},
		});
		app.integrate({
			path: "/socket.io/",
			fetch: (req, server) => {
				const upgraded = server.upgrade(req, { data: { transport: true } });
				return upgraded
					? new Response(null)
					: new Response("upgrade failed", { status: 500 });
			},
			websocket: {
				open(ws: any) {
					ws.send("hello-external");
				},
			},
			serve: { idleTimeout: 30 },
		});

		const port = await getFreePort();
		app.listen(port);
		const sockets: WebSocket[] = [];
		try {
			const buntokMessage = await new Promise<string>((resolve) => {
				const ws = new WebSocket(`ws://localhost:${port}/chat`);
				sockets.push(ws);
				ws.onmessage = (event) => resolve(String(event.data));
			});
			expect(buntokMessage).toBe("hello-buntok");

			const externalMessage = await new Promise<string>((resolve) => {
				const ws = new WebSocket(`ws://localhost:${port}/socket.io/`);
				sockets.push(ws);
				ws.onmessage = (event) => resolve(String(event.data));
			});
			expect(externalMessage).toBe("hello-external");
		} finally {
			for (const ws of sockets) ws.close();
			await app.close({ timeout: 1000, force: true });
		}
	});
});
