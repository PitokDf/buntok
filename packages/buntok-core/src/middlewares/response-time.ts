import type { Middleware } from "../buntok";

export interface ResponseTimeOptions {
	/** Header name (default: x-response-time) */
	header?: string;
	/** Format: 'ms' | 's' (default: 'ms') */
	format?: "ms" | "s";
	/** Store response time in ctx.store (default: false) */
	store?: boolean;
	/** Property name in ctx.store (default: responseTime) */
	storeKey?: string;
}

/**
 * Middleware to measure and add response time to response headers
 */
export function responseTime(options: ResponseTimeOptions = {}): Middleware {
	const header = options.header || "x-response-time";
	const format = options.format || "ms";
	const storeKey = options.storeKey || "responseTime";

	return async (ctx, next) => {
		const start = performance.now();

		const result = await next();

		const duration = performance.now() - start;
		const formatted =
			format === "s"
				? `${(duration / 1000).toFixed(3)}s`
				: `${duration.toFixed(2)}ms`;

		// Store in ctx.store if enabled
		if (options.store) {
			ctx.store[storeKey] = formatted;
		}

		// Add response time header
		if (result instanceof Response) {
			result.headers.set(header, formatted);
		}

		return result;
	};
}
