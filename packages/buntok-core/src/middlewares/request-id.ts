import type { Middleware } from "../buntok";

export interface RequestIdOptions {
	/** Header name (default: x-request-id) */
	header?: string;
	/** Custom generator function */
	generator?: () => string;
	/** Store request ID in ctx.store (default: true) */
	store?: boolean;
	/** Property name in ctx.store (default: requestId) */
	storeKey?: string;
}

/**
 * Generate a unique request ID
 */
function generateRequestId(): string {
	return crypto.randomUUID();
}

/**
 * Middleware to add unique request ID to every request
 */
export function requestId(options: RequestIdOptions = {}): Middleware {
	const header = options.header || "x-request-id";
	const storeKey = options.storeKey || "requestId";
	const generator = options.generator || generateRequestId;
	const useStore = options.store !== false;

	return async (ctx, next) => {
		// Accept only bounded header values; malformed IDs are replaced locally.
		const existingId = ctx.request.headers.get(header);
		const id = existingId && /^[A-Za-z0-9._:-]{1,128}$/.test(existingId)
			? existingId
			: generator();

		// Make the generated ID available to the app logger as well as handlers.
		try {
			ctx.request.headers.set(header, id);
		} catch {
			// Some adapter Requests expose immutable headers.
		}

		// Store in ctx.store if enabled
		if (useStore) {
			ctx.store[storeKey] = id;
		}

		const result = await next();

		// Add request ID to response headers
		if (result instanceof Response) {
			result.headers.set(header, id);
		}

		return result;
	};
}

/**
 * Simple UUID v4 generator (no dependencies)
 */
export function uuid(): string {
	return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
		const r = (Math.random() * 16) | 0;
		const v = c === "x" ? r : (r & 0x3) | 0x8;
		return v.toString(16);
	});
}

/**
 * Short ID generator (8 characters)
 */
export function shortId(): string {
	return crypto.randomUUID().replace(/-/g, "").slice(0, 8);
}
