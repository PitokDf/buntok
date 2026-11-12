import { describe, it, expect } from "bun:test";
import { Buntok } from "../src/buntok";
import type {
	SocketIOEngineLike,
	SocketIOServerLike,
} from "../src/plugins/socket-io";
import { socketIOPlugin } from "../src/plugins/socket-io";

function fakeServer(): any {
	return {};
}

function createFakeEngine(overrides: Partial<SocketIOEngineLike> = {}) {
	const calls = {
		handleRequest: [] as Request[],
		close: 0,
	};
	const engine: SocketIOEngineLike = {
		handleRequest(request) {
			calls.handleRequest.push(request);
			return new Response("engine-response");
		},
		handler() {
			return {
				fetch: (request) => engine.handleRequest(request, {}),
				websocket: { open() { } },
				idleTimeout: 42,
				maxRequestBodySize: 1024,
			};
		},
		close() {
			calls.close++;
		},
		...overrides,
	};
	return { engine, calls };
}

describe("socketIOPlugin", () => {
	it("should bind the engine and route the Socket.IO path", async () => {
		const app = new Buntok();
		let boundEngine: SocketIOEngineLike | undefined;
		let closedIo = 0;
		const io: SocketIOServerLike = {
			bind(engine) {
				boundEngine = engine as SocketIOEngineLike;
			},
			close() {
				closedIo++;
			},
		};
		const { engine, calls } = createFakeEngine();

		await app.plugin(
			socketIOPlugin({
				io,
				engineFactory: async (opts) => {
					expect(opts.path).toBe("/socket.io/");
					return engine;
				},
			}),
		);

		expect(boundEngine).toBe(engine);

		const res = await app.fetch(
			new Request("http://localhost/socket.io/?EIO=4"),
			fakeServer(),
		);
		expect(await res.text()).toBe("engine-response");
		expect(calls.handleRequest).toHaveLength(1);

		await app.close();
		expect(calls.close).toBe(1);
		expect(closedIo).toBe(1);
	});

	it("should honor a custom path and keep the Socket.IO server open", async () => {
		const app = new Buntok();
		let closedIo = 0;
		const io: SocketIOServerLike = {
			bind() { },
			close() {
				closedIo++;
			},
		};
		const { engine, calls } = createFakeEngine();

		await app.plugin(
			socketIOPlugin({
				io,
				path: "/rt/",
				closeOnShutdown: false,
				engineFactory: async (opts) => {
					expect(opts.path).toBe("/rt/");
					return engine;
				},
			}),
		);

		const res = await app.fetch(
			new Request("http://localhost/rt/?EIO=4"),
			fakeServer(),
		);
		expect(await res.text()).toBe("engine-response");

		await app.close();
		expect(calls.close).toBe(1);
		expect(closedIo).toBe(0);
	});
});
