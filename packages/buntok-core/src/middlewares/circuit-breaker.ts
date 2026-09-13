import type { Middleware } from "../app";
import {
	CircuitBreaker,
	CircuitOpenError,
} from "../circuit-breaker";
import type { CircuitBreakerOptions } from "../circuit-breaker";

// ─── Global Registry ──────────────────────────────────────────────────────────

const breakers = new Map<string, CircuitBreaker>();

/**
 * Get or create a named circuit breaker.
 * Reuses existing instance if same name is used.
 */
function getOrCreate(name: string, options?: CircuitBreakerOptions): CircuitBreaker {
	let breaker = breakers.get(name);
	if (!breaker) {
		breaker = new CircuitBreaker(name, options);
		breakers.set(name, breaker);
	}
	return breaker;
}

/**
 * Get all registered circuit breakers (for health checks).
 */
export function getCircuitBreakers(): Map<string, CircuitBreaker> {
	return breakers;
}

// ─── Middleware Factory ────────────────────────────────────────────────────────

export interface CircuitBreakerMiddlewareOptions extends CircuitBreakerOptions {
	/** Custom response when circuit is open. Default: 503 JSON */
	onOpen?: (ctx: any) => Response | Promise<Response> | void;
}

/**
 * Circuit breaker middleware — protects routes from cascading failures.
 *
 * @example
 * ```ts
 * import { circuitBreaker } from "@buntok/core/middlewares";
 *
 * app.post("/pay", circuitBreaker("payment", {
 *   failureThreshold: 5,
 *   timeout: 30000,
 * }), async (ctx) => {
 *   return ctx.json(await fetchPayment());
 * });
 * ```
 */
export function circuitBreaker(
	name: string,
	options?: CircuitBreakerMiddlewareOptions,
): Middleware {
	const breaker = getOrCreate(name, options);

	return async (ctx, next) => {
		const currentState = breaker.getState();

		if (currentState === "open" || currentState === "half-open") {
			// Check if we should allow half-open probe
			if (currentState === "half-open") {
				const metrics = breaker.getMetrics();
				// Allow through — fire() handles half-open concurrency
			} else {
				// Circuit is open — reject fast
				if (options?.onOpen) {
					const result = options.onOpen(ctx);
					if (result !== undefined) return result;
				}
				return ctx.json(
					{
						error: "Service Unavailable",
						message: `Circuit "${name}" is open. Service is temporarily unavailable.`,
						retryAfter: Math.ceil((breaker as any).options?.timeout / 1000) || 30,
					},
					503,
				);
			}
		}

		try {
			const result = await breaker.fire(() => next());
			return result;
		} catch (err) {
			if (err instanceof CircuitOpenError) {
				if (options?.onOpen) {
					const result = options.onOpen(ctx);
					if (result !== undefined) return result;
				}
				return ctx.json(
					{
						error: "Service Unavailable",
						message: `Circuit "${name}" is open.`,
						retryAfter: Math.ceil((breaker as any).options?.timeout / 1000) || 30,
					},
					503,
				);
			}
			throw err;
		}
	};
}
