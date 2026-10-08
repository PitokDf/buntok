/**
 * Lightweight event emitter for loose coupling between modules.
 *
 * @example
 * ```ts
 * import { emitter } from "buntok";
 *
 * // Subscribe to events
 * emitter.on("user:created", async ({ user, ctx }) => {
 *   await sendWelcomeEmail(user.email);
 * });
 *
 * // Emit events
 * emitter.emit("user:created", { user, ctx });
 *
 * // One-time listener
 * emitter.once("app:ready", () => {
 *   console.log("Buntok is ready!");
 * });
 * ```
 */

type EventMap = Record<string, any>;

type Listener<T> = (data: T) => Promise<void> | void;

export interface EmitOptions {
	/**
	 * Isolate errors per listener. When true, a failing listener won't reject
	 * the entire emit() call or affect other listeners.
	 * Defaults to false for backward compatibility.
	 */
	isolatedErrors?: boolean;

	/**
	 * Custom error handler called when a listener throws.
	 * Only used when `isolatedErrors` is true.
	 */
	onError?: (event: string, error: unknown, listener: Listener<any>) => void;
}

export interface EventEmitterOptions {
	/**
	 * Maximum number of listeners per event.
	 * Set to 0 or undefined for unlimited (default).
	 * When exceeded, `on()` throws an error.
	 */
	maxListeners?: number;
}

export class EventEmitter<TEvents extends EventMap = EventMap> {
	private listeners = new Map<keyof TEvents, Set<Listener<any>>>();
	private maxListeners: number;

	constructor(options?: EventEmitterOptions) {
		this.maxListeners = options?.maxListeners ?? 0;
	}

	/**
	 * Subscribe to an event.
	 * @returns Unsubscribe function
	 */
	on<K extends keyof TEvents>(event: K, listener: Listener<TEvents[K]>): () => void {
		if (!this.listeners.has(event)) {
			this.listeners.set(event, new Set());
		}

		const eventListeners = this.listeners.get(event)!;

		// Check maxListeners limit
		if (this.maxListeners > 0 && eventListeners.size >= this.maxListeners) {
			throw new Error(
				`Max listeners (${this.maxListeners}) exceeded for event "${String(event)}". ` +
				`Use increaseMaxListeners() to increase the limit.`,
			);
		}

		eventListeners.add(listener);

		// Return unsubscribe function
		return () => {
			this.listeners.get(event)?.delete(listener);
		};
	}

	/**
	 * Subscribe to an event, but only fire once.
	 * @returns Unsubscribe function
	 */
	once<K extends keyof TEvents>(event: K, listener: Listener<TEvents[K]>): () => void {
		const wrapper: Listener<TEvents[K]> = async (data) => {
			unsub();
			await listener(data);
		};
		const unsub = this.on(event, wrapper);
		return unsub;
	}

	/**
	 * Emit an event with data.
	 * Returns a promise that resolves when all listeners have finished.
	 *
	 * @example
	 * // Default behavior - all listeners run in parallel, any error rejects
	 * await emitter.emit("user:created", { user });
	 *
	 * @example
	 * // With error isolation - listeners run in parallel, errors don't affect others
	 * await emitter.emit("user:created", { user }, {
	 *   isolatedErrors: true,
	 *   onError: (event, error, listener) => {
	 *     console.error(`Listener failed for ${event}:`, error);
	 *   }
	 * });
	 */
	async emit<K extends keyof TEvents>(
		event: K,
		data: TEvents[K],
		options?: EmitOptions,
	): Promise<void> {
		const listeners = this.listeners.get(event);
		if (!listeners || listeners.size === 0) return;

		const promises: Promise<void>[] = [];
		for (const listener of listeners) {
			promises.push(this.invokeListener(event, listener, data, options));
		}

		if (options?.isolatedErrors) {
			// Use Promise.allSettled to isolate errors
			await Promise.allSettled(promises);
		} else {
			// Default behavior - any error rejects
			await Promise.all(promises);
		}
	}

	/**
	 * Emit an event serially (one listener at a time).
	 * Stops on first error unless `isolatedErrors` is true.
	 *
	 * @example
	 * // Serial execution - stops on first error
	 * await emitter.emitSerial("user:created", { user });
	 *
	 * @example
	 * // With error isolation - continues despite errors
	 * await emitter.emitSerial("user:created", { user }, {
	 *   isolatedErrors: true,
	 *   onError: (event, error) => console.error(error),
	 * });
	 */
	async emitSerial<K extends keyof TEvents>(
		event: K,
		data: TEvents[K],
		options?: EmitOptions,
	): Promise<void> {
		const listeners = this.listeners.get(event);
		if (!listeners || listeners.size === 0) return;

		for (const listener of listeners) {
			await this.invokeListener(event, listener, data, options);
		}
	}

	/**
	 * Remove all listeners for an event, or all listeners entirely.
	 */
	off<K extends keyof TEvents>(event?: K): void {
		if (event) {
			this.listeners.delete(event);
		} else {
			this.listeners.clear();
		}
	}

	/**
	 * Get the number of listeners for an event.
	 */
	listenerCount<K extends keyof TEvents>(event: K): number {
		return this.listeners.get(event)?.size ?? 0;
	}

	/**
	 * Get all event names that have listeners.
	 */
	eventNames(): (string | symbol)[] {
		const keys = Array.from(this.listeners.keys());
		const result: (string | symbol)[] = [];
		for (const key of keys) {
			if (typeof key === "string" || typeof key === "symbol") {
				result.push(key);
			}
		}
		return result;
	}

	/**
	 * Increase the max listeners limit for an event.
	 * Returns the EventEmitter for chaining.
	 */
	increaseMaxListeners(maxListeners: number): this {
		this.maxListeners = maxListeners;
		return this;
	}

	/**
	 * Get the current max listeners limit.
	 */
	getMaxListeners(): number {
		return this.maxListeners;
	}

	/**
	 * Invoke a single listener with error handling.
	 */
	private async invokeListener<K extends keyof TEvents>(
		event: K,
		listener: Listener<TEvents[K]>,
		data: TEvents[K],
		options?: EmitOptions,
	): Promise<void> {
		try {
			await Promise.resolve(listener(data));
		} catch (error) {
			if (options?.isolatedErrors) {
				options.onError?.(String(event), error, listener);
			} else {
				throw error;
			}
		}
	}
}

/**
 * Default emitter instance with common application events.
 *
 * @example
 * ```ts
 * import { emitter } from "buntok";
 *
 * emitter.on("user:created", ({ user }) => {
 *   console.log("New user:", user.name);
 * });
 * ```
 */
export interface AppEvents {
	// Auth events
	"user:created": { user: any; ctx?: any };
	"user:updated": { user: any; ctx?: any };
	"user:deleted": { userId: string | number; ctx?: any };
	"user:logged_in": { user: any; ctx?: any };
	"user:logged_out": { user: any; ctx?: any };

	// Request events
	"request:start": { method: string; path: string; ctx?: any };
	"request:end": { method: string; path: string; status: number; duration: number; ctx?: any };
	"request:error": { method: string; path: string; error: Error; ctx?: any };

	// Buntok events
	"app:ready": void;
	"app:shutdown": void;

	// Custom events (extensible)
	[key: string]: any;
}

export const emitter = new EventEmitter<AppEvents>();
