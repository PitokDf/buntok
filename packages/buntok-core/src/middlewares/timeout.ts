import type { Middleware } from "../app";

/**
 * Request timeout middleware - automatically aborts the handler if it takes
 * longer than `ms` milliseconds, returning 408 Request Timeout.
 *
 * @example
 * import { timeout } from "@buntok/core";
 *
 * app.get("/slow", timeout(5000), async (ctx) => {
 *   await longOperation();
 *   return ctx.json({ ok: true });
 * });
 *
 * // Custom error message
 * app.post("/upload", timeout(30000, "Upload timed out"), handler);
 */
export function timeout(ms: number, message = "Request timed out"): Middleware {
	return async (_ctx, next) => {
		// Industrial: skip timeout for SSE - SSE adalah long-lived, timeout akan bunuh koneksi 30s heartbeat
		if (_ctx.request.headers.get("accept")?.includes("text/event-stream")) return next();
		let timeoutId: ReturnType<typeof setTimeout>;

		const timeoutPromise = new Promise<never>((_, reject) => {
			timeoutId = setTimeout(() => {
				reject(new TimeoutError(message, ms));
			}, ms);
		});

		try {
			const response = await Promise.race([next(), timeoutPromise]);
			return response;
		} finally {
			clearTimeout(timeoutId!);
		}
	};
}

export class TimeoutError extends Error {
	public readonly timeoutMs: number;

	constructor(message: string, timeoutMs: number) {
		super(message);
		this.name = "TimeoutError";
		this.timeoutMs = timeoutMs;
	}
}
