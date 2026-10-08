import type { Middleware } from "../buntok";
import type { Context } from "../context";

export interface RateLimiterOptions {
	/** Maximum requests per window */
	max?: number;
	/** Window duration in milliseconds (default: 60000 = 1 minute) */
	windowMs?: number;
	/** Custom key function (default: IP address) */
	keyGenerator?: (ctx: Context) => string;
	/** Custom message when rate limit exceeded */
	message?: string;
	/** HTTP status code when rate limit exceeded (default: 429) */
	statusCode?: number;
	/** Skip rate limiting for certain requests */
	skip?: (ctx: Context) => boolean;
	/** Headers to include in response */
	headers?: boolean;
	/**
	 * Where counters are stored. Defaults to an in-memory Map, which is lost
	 * on restart and not shared across processes/instances. Pass
	 * `sqliteStore(path)` to persist counters in a bun:sqlite database instead
	 * (e.g. shared across a clustered deployment via a shared file, or simply
	 * to survive restarts without adding an external dependency like Redis).
	 */
	store?: RateLimitStore<unknown>;
}

interface RateLimitEntry {
	count: number;
	resetTime: number;
}

/**
 * Minimal Map-like interface the rate limiters need. Implemented by both the
 * default in-memory store and the optional bun:sqlite-backed store below.
 */
export interface RateLimitStore<T> {
	get(key: string): T | undefined;
	set(key: string, value: T): void;
	delete(key: string): void;
	entries(): IterableIterator<[string, T]>;
}

function memoryStore<T>(): RateLimitStore<T> {
	return new Map<string, T>();
}

/**
 * Persist rate-limit counters in a bun:sqlite database file instead of an
 * in-memory Map. Useful when you want counters to survive process restarts,
 * or to be shared across multiple instances pointed at the same file, without
 * pulling in an external dependency like Redis.
 *
 * Requires the Bun runtime (uses `bun:sqlite`).
 */
export function sqliteStore<T>(
	path = "rate-limiter.sqlite",
): RateLimitStore<T> {
	const { Database } = require("bun:sqlite") as typeof import("bun:sqlite");
	const db = new Database(path);
	db.run(
		"CREATE TABLE IF NOT EXISTS rate_limit_entries (key TEXT PRIMARY KEY, value TEXT NOT NULL)",
	);

	const getStmt = db.query(
		"SELECT value FROM rate_limit_entries WHERE key = ?",
	);
	const setStmt = db.query(
		"INSERT INTO rate_limit_entries (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
	);
	const deleteStmt = db.query("DELETE FROM rate_limit_entries WHERE key = ?");
	const allStmt = db.query("SELECT key, value FROM rate_limit_entries");

	return {
		get(key: string): T | undefined {
			const row = getStmt.get(key) as { value: string } | null;
			return row ? (JSON.parse(row.value) as T) : undefined;
		},
		set(key: string, value: T): void {
			setStmt.run(key, JSON.stringify(value));
		},
		delete(key: string): void {
			deleteStmt.run(key);
		},
		*entries(): IterableIterator<[string, T]> {
			const rows = allStmt.all() as Array<{ key: string; value: string }>;
			for (const row of rows) {
				yield [row.key, JSON.parse(row.value) as T];
			}
		},
	};
}

const DEFAULT_OPTIONS: Required<
	Omit<RateLimiterOptions, "keyGenerator" | "skip" | "store">
> = {
	max: 100,
	windowMs: 60000,
	message: "Too many requests, please try again later",
	statusCode: 429,
	headers: true,
};

/**
 * Simple in-memory rate limiter
 */
export function rateLimiter(options: RateLimiterOptions = {}): Middleware {
	const opts = { ...DEFAULT_OPTIONS, ...options };
	const store =
		(options.store as RateLimitStore<RateLimitEntry>) ??
		memoryStore<RateLimitEntry>();

	// Cleanup old entries periodically
	const cleanup = setInterval(() => {
		const now = Date.now();
		for (const [key, entry] of store.entries()) {
			if (now > entry.resetTime) {
				store.delete(key);
			}
		}
	}, opts.windowMs);

	// Prevent cleanup from keeping process alive
	if (typeof cleanup === "object" && cleanup.unref) {
		cleanup.unref();
	}

	const getKey =
		options.keyGenerator ||
		((ctx: Context) => {
			return ctx.ip || "unknown";
		});

	return async (ctx, next) => {
		// Skip if custom skip function returns true
		if (options.skip?.(ctx)) {
			return next();
		}

		const key = getKey(ctx);
		const now = Date.now();
		const entry = store.get(key);

		let count = 1;
		let resetTime = now + opts.windowMs;

		if (entry && now < entry.resetTime) {
			count = entry.count + 1;
			resetTime = entry.resetTime;
		}

		store.set(key, { count, resetTime });

		// Check if rate limit exceeded
		if (count > opts.max) {
			const response = new Response(JSON.stringify({ error: opts.message }), {
				status: opts.statusCode,
				headers: {
					"Content-Type": "application/json",
					"Retry-After": String(Math.ceil((resetTime - now) / 1000)),
					"X-RateLimit-Limit": String(opts.max),
					"X-RateLimit-Remaining": "0",
					"X-RateLimit-Reset": String(Math.ceil(resetTime / 1000)),
				},
			});
			return response;
		}

		const result = await next();

		// Add rate limit headers to successful response
		if (opts.headers && result instanceof Response) {
			result.headers.set("X-RateLimit-Limit", String(opts.max));
			result.headers.set(
				"X-RateLimit-Remaining",
				String(Math.max(0, opts.max - count)),
			);
			result.headers.set(
				"X-RateLimit-Reset",
				String(Math.ceil(resetTime / 1000)),
			);
		}

		return result;
	};
}

/**
 * Sliding window rate limiter (more accurate but uses more memory)
 */
export function slidingWindowRateLimiter(
	options: RateLimiterOptions = {},
): Middleware {
	const opts = { ...DEFAULT_OPTIONS, ...options };
	const store =
		(options.store as RateLimitStore<number[]>) ?? memoryStore<number[]>();

	const cleanup = setInterval(() => {
		const windowStart = Date.now() - opts.windowMs;
		for (const [key, timestamps] of store.entries()) {
			const valid = timestamps.filter((t) => t > windowStart);
			if (valid.length === 0) {
				store.delete(key);
			} else if (valid.length !== timestamps.length) {
				store.set(key, valid);
			}
		}
	}, opts.windowMs);

	if (typeof cleanup === "object" && cleanup.unref) {
		cleanup.unref();
	}

	const getKey =
		options.keyGenerator ||
		((ctx: Context) => {
			return (
				ctx.request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
				ctx.request.headers.get("x-real-ip") ||
				"unknown"
			);
		});

	return async (ctx, next) => {
		if (options.skip?.(ctx)) {
			return next();
		}

		const key = getKey(ctx);
		const now = Date.now();
		const windowStart = now - opts.windowMs;

		// Get existing timestamps
		const timestamps = store.get(key) || [];

		// Filter to only timestamps within window
		const validTimestamps = timestamps.filter((t) => t > windowStart);

		if (validTimestamps.length >= opts.max) {
			const oldestTimestamp = validTimestamps[0] || 0;
			const retryAfter = Math.ceil(
				(oldestTimestamp + opts.windowMs - now) / 1000,
			);

			return new Response(JSON.stringify({ error: opts.message }), {
				status: opts.statusCode,
				headers: {
					"Content-Type": "application/json",
					"Retry-After": String(retryAfter),
					"X-RateLimit-Limit": String(opts.max),
					"X-RateLimit-Remaining": "0",
				},
			});
		}

		// Add current timestamp
		validTimestamps.push(now);
		store.set(key, validTimestamps);

		const result = await next();

		if (result instanceof Response) {
			result.headers.set("X-RateLimit-Limit", String(opts.max));
			result.headers.set(
				"X-RateLimit-Remaining",
				String(opts.max - validTimestamps.length),
			);
		}

		return result;
	};
}
