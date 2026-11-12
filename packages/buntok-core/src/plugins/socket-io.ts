import { createPlugin } from "../plugin";
import type { Plugin } from "../plugin";

/** Minimal structural type for a Socket.IO server instance. */
export interface SocketIOServerLike {
	bind(engine: unknown): void;
	close?(callback?: () => void): void;
}

/** Minimal structural type for a `@socket.io/bun-engine` server. */
export interface SocketIOEngineLike {
	handleRequest(
		request: Request,
		server: unknown,
	): Response | Promise<Response>;
	handler(): {
		fetch: (request: Request, server: unknown) => Response | Promise<Response>;
		websocket: Record<string, unknown>;
		idleTimeout?: number;
		maxRequestBodySize?: number;
	};
	close?(): void;
}

export interface SocketIOPluginOptions {
	/** Socket.IO server instance (`new Server()` from `socket.io`). */
	io: SocketIOServerLike;
	/** Path used by both polling and WebSocket transports. Default: `/socket.io/`. */
	path?: string;
	/** Options forwarded to `@socket.io/bun-engine`. */
	engine?: Record<string, unknown>;
	/** Close the Socket.IO server on app shutdown. Default: true. */
	closeOnShutdown?: boolean;
	/** @internal Override the Bun engine loader (used by tests). */
	engineFactory?: (
		options: Record<string, unknown>,
	) => Promise<SocketIOEngineLike>;
}

/**
 * Mount a Socket.IO server on the same Bun server as Buntok.
 *
 * Uses `@socket.io/bun-engine` - the official Bun-native Engine.IO backend -
 * so polling and WebSocket clients share the Buntok port without the Node
 * `http.Server` polyfill.
 *
 * @example
 * ```ts
 * import { Server } from "socket.io";
 * import { socketIOPlugin } from "@buntok/core/plugins/socket-io";
 *
 * const io = new Server();
 * io.on("connection", (socket) => {
 *   socket.on("hello", (msg) => socket.emit("world", msg));
 * });
 *
 * app.plugin(socketIOPlugin({ io }));
 * app.listen(3000);
 * ```
 */
export function socketIOPlugin<
	DI extends Record<string, unknown> = Record<string, unknown>,
>(options: SocketIOPluginOptions): Plugin<DI> {
	let cleanup: (() => void | Promise<void>) | undefined;

	return createPlugin({
		name: "@buntok/socket-io",
		install: async (app) => {
			const path = options.path ?? "/socket.io/";
			const engineOptions = { ...options.engine, path };
			let engine: SocketIOEngineLike;
			if (options.engineFactory) {
				engine = await options.engineFactory(engineOptions);
			} else {
				const { Server: Engine } = await import("@socket.io/bun-engine");
				engine = new Engine(engineOptions) as unknown as SocketIOEngineLike;
			}

			options.io.bind(engine);

			const { websocket, idleTimeout, maxRequestBodySize } = engine.handler();
			const serve: Record<string, unknown> = {};
			if (idleTimeout !== undefined) serve.idleTimeout = idleTimeout;
			if (maxRequestBodySize !== undefined) {
				serve.maxRequestBodySize = maxRequestBodySize;
			}

			app.integrate({
				path,
				label: "Socket.IO",
				fetch: (request, server) =>
					engine.handleRequest(request, server),
				websocket,
				serve,
			});

			cleanup = () => {
				try {
					engine.close?.();
				} catch { }
				if (options.closeOnShutdown !== false) {
					try {
						options.io.close?.();
					} catch { }
				}
			};
		},
		dispose: async () => {
			await cleanup?.();
		},
	});
}
