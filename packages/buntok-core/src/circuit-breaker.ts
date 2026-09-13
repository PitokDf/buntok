/**
 * Circuit Breaker — fail-fast resilience pattern for protecting against cascading failures.
 *
 * States:
 *   CLOSED  → normal operation, failures counted
 *   OPEN    → all calls rejected fast
 *   HALF_OPEN → trial calls to test recovery
 *   DISABLED → manual override, all calls pass through
 *
 * Based on patterns from Resilience4j, Polly-TS, and Fiber.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type CircuitState = "closed" | "open" | "half-open" | "disabled";

export type CircuitEvent =
	| "open"
	| "half-open"
	| "close"
	| "disable"
	| "reset"
	| "success"
	| "failure"
	| "stateChange"
	| "callNotPermitted";

export interface CircuitBreakerOptions {
	/** Consecutive failures before opening. Default: 5 */
	failureThreshold?: number;
	/** Successes in half-open to close. Default: 2 */
	successThreshold?: number;
	/** Duration (ms) in open state before half-open. Default: 30000 */
	timeout?: number;
	/** Sliding window type. Default: "count" */
	slidingWindowType?: "count" | "time";
	/** Sliding window size. Default: 10 (calls or seconds) */
	slidingWindowSize?: number;
	/** Minimum calls before failure rate can trip. Default: 10 */
	minimumNumberOfCalls?: number;
	/** Failure rate (%) to trip. Default: 50 */
	failureRateThreshold?: number;
	/** Duration (ms) to consider a call "slow". Default: 5000 */
	slowCallDurationThreshold?: number;
	/** Slow call rate (%) to trip. Default: 100 (disabled) */
	slowCallRateThreshold?: number;
	/** Max concurrent calls in half-open. Default: 1 */
	halfOpenMaxCalls?: number;
	/** Which exception types count as failure. Default: all */
	recordExceptions?: (new (...args: any[]) => Error)[];
	/** Which exception types are ignored entirely. Default: none */
	ignoreExceptions?: (new (...args: any[]) => Error)[];
	/** Initial state. Default: "closed" */
	initialState?: CircuitState;
}

export interface CircuitBreakerMetrics {
	readonly successes: number;
	readonly failures: number;
	readonly totalCalls: number;
	readonly failureRate: number;
	readonly slowCallRate: number;
	readonly notPermittedCalls: number;
}

export interface CircuitBreakerFireOptions<T> {
	fallback?: () => T | Promise<T>;
}

type EventListener = (...args: any[]) => void;

// ─── Sliding Window ───────────────────────────────────────────────────────────

interface WindowEntry {
	failed: boolean;
	slow: boolean;
}

class CountBasedWindow {
	private readonly buffer: WindowEntry[];
	private head = 0;
	private size = 0;
	private readonly maxSize: number;

	constructor(maxSize: number) {
		this.maxSize = maxSize;
		this.buffer = new Array(maxSize);
	}

	record(entry: WindowEntry): void {
		this.buffer[this.head] = entry;
		this.head = (this.head + 1) % this.maxSize;
		if (this.size < this.maxSize) this.size++;
	}

	getSnapshot(): { total: number; failed: number; slow: number } {
		let failed = 0;
		let slow = 0;
		for (let i = 0; i < this.size; i++) {
			const entry = this.buffer[i];
			if (entry?.failed) failed++;
			if (entry?.slow) slow++;
		}
		return { total: this.size, failed, slow };
	}

	reset(): void {
		this.head = 0;
		this.size = 0;
	}
}

class TimeBasedWindow {
	private buckets: Map<number, { failed: number; slow: number; total: number }> = new Map();
	private readonly windowSeconds: number;

	constructor(windowSeconds: number) {
		this.windowSeconds = windowSeconds;
	}

	record(entry: WindowEntry): void {
		const epoch = Math.floor(Date.now() / 1000);
		const bucket = this.buckets.get(epoch) ?? { failed: 0, slow: 0, total: 0 };
		if (entry.failed) bucket.failed++;
		if (entry.slow) bucket.slow++;
		bucket.total++;
		this.buckets.set(epoch, bucket);
		this.evict(epoch);
	}

	private evict(currentEpoch: number): void {
		const cutoff = currentEpoch - this.windowSeconds;
		for (const [key] of this.buckets) {
			if (key < cutoff) this.buckets.delete(key);
		}
	}

	getSnapshot(): { total: number; failed: number; slow: number } {
		const epoch = Math.floor(Date.now() / 1000);
		this.evict(epoch);
		let total = 0;
		let failed = 0;
		let slow = 0;
		for (const bucket of this.buckets.values()) {
			total += bucket.total;
			failed += bucket.failed;
			slow += bucket.slow;
		}
		return { total, failed, slow };
	}

	reset(): void {
		this.buckets.clear();
	}
}

// ─── Circuit Breaker ──────────────────────────────────────────────────────────

export class CircuitBreaker {
	readonly name: string;
	private state: CircuitState;
	private readonly options: Required<CircuitBreakerOptions>;
	private readonly window: CountBasedWindow | TimeBasedWindow;

	// Counters
	private consecutiveFailures = 0;
	private consecutiveSuccesses = 0;
	private halfOpenCalls = 0;
	private notPermittedCalls = 0;

	// Timing
	private openedAt = 0;

	// Event listeners
	private readonly listeners = new Map<CircuitEvent, Set<EventListener>>();

	constructor(name: string, options?: CircuitBreakerOptions) {
		this.name = name;
		this.options = {
			failureThreshold: options?.failureThreshold ?? 5,
			successThreshold: options?.successThreshold ?? 2,
			timeout: options?.timeout ?? 30_000,
			slidingWindowType: options?.slidingWindowType ?? "count",
			slidingWindowSize: options?.slidingWindowSize ?? 10,
			minimumNumberOfCalls: options?.minimumNumberOfCalls ?? 10,
			failureRateThreshold: options?.failureRateThreshold ?? 50,
			slowCallDurationThreshold: options?.slowCallDurationThreshold ?? 5000,
			slowCallRateThreshold: options?.slowCallRateThreshold ?? 100,
			halfOpenMaxCalls: options?.halfOpenMaxCalls ?? 1,
			recordExceptions: options?.recordExceptions ?? [],
			ignoreExceptions: options?.ignoreExceptions ?? [],
			initialState: options?.initialState ?? "closed",
		};

		this.state = this.options.initialState;

		if (this.options.slidingWindowType === "time") {
			this.window = new TimeBasedWindow(this.options.slidingWindowSize);
		} else {
			this.window = new CountBasedWindow(this.options.slidingWindowSize);
		}
	}

	// ─── Public API ──────────────────────────────────────────────────────

	/**
	 * Execute a function with circuit breaker protection.
	 * If the circuit is open, throws CircuitOpenError (unless fallback is provided).
	 */
	async fire<T>(
		fn: () => Promise<T> | T,
		fireOptions?: CircuitBreakerFireOptions<T>,
	): Promise<T> {
		const currentState = this.getState();

		if (currentState === "disabled") {
			return fn();
		}

		if (currentState === "open") {
			this.notPermittedCalls++;
			this.emit("callNotPermitted", { name: this.name });
			if (fireOptions?.fallback) {
				return fireOptions.fallback();
			}
			throw new CircuitOpenError(this.name, this.openedAt + this.options.timeout);
		}

		if (currentState === "half-open") {
			if (this.halfOpenCalls >= this.options.halfOpenMaxCalls) {
				this.notPermittedCalls++;
				this.emit("callNotPermitted", { name: this.name });
				if (fireOptions?.fallback) {
					return fireOptions.fallback();
				}
				throw new CircuitOpenError(this.name, this.openedAt + this.options.timeout);
			}
			this.halfOpenCalls++;
		}

		const start = Date.now();
		try {
			const result = await fn();
			const duration = Date.now() - start;
			this.onSuccess(duration);
			return result;
		} catch (err) {
			const duration = Date.now() - start;
			this.onFailure(err, duration);
			if (fireOptions?.fallback) {
				return fireOptions.fallback();
			}
			throw err;
		}
	}

	/** Get current state (auto-transitions open → half-open when timeout elapses). */
	getState(): CircuitState {
		if (this.state === "open") {
			if (Date.now() >= this.openedAt + this.options.timeout) {
				this.transitionTo("half-open");
			}
		}
		return this.state;
	}

	/** Get current metrics. */
	getMetrics(): CircuitBreakerMetrics {
		const snapshot = this.window.getSnapshot();
		const failureRate = snapshot.total >= this.options.minimumNumberOfCalls
			? (snapshot.failed / snapshot.total) * 100
			: 0;
		const slowCallRate = snapshot.total >= this.options.minimumNumberOfCalls
			? (snapshot.slow / snapshot.total) * 100
			: 0;

		return {
			successes: snapshot.total - snapshot.failed,
			failures: snapshot.failed,
			totalCalls: snapshot.total,
			failureRate,
			slowCallRate,
			notPermittedCalls: this.notPermittedCalls,
		};
	}

	/** Force reset to closed state. */
	reset(): void {
		this.transitionTo("closed");
	}

	/** Disable the circuit breaker (all calls pass through). */
	disable(): void {
		this.transitionTo("disabled");
	}

	/** Re-enable after disable (goes to closed). */
	enable(): void {
		if (this.state === "disabled") {
			this.transitionTo("closed");
		}
	}

	// ─── Event System ────────────────────────────────────────────────────

	/** Subscribe to a circuit breaker event. Returns unsubscribe function. */
	on(event: CircuitEvent, listener: EventListener): () => void {
		if (!this.listeners.has(event)) {
			this.listeners.set(event, new Set());
		}
		this.listeners.get(event)!.add(listener);
		return () => {
			this.listeners.get(event)?.delete(listener);
		};
	}

	private emit(event: CircuitEvent, ...args: any[]): void {
		const set = this.listeners.get(event);
		if (set) {
			for (const listener of set) {
				try {
					listener(...args);
				} catch {
					// swallow listener errors
				}
			}
		}
	}

	// ─── Internal State Machine ──────────────────────────────────────────

	private onSuccess(duration: number): void {
		const isSlow = duration >= this.options.slowCallDurationThreshold;
		this.window.record({ failed: false, slow: isSlow });
		this.consecutiveFailures = 0;

		if (this.state === "half-open") {
			this.consecutiveSuccesses++;
			if (this.consecutiveSuccesses >= this.options.successThreshold) {
				this.transitionTo("closed");
			}
		}

		this.emit("success", { name: this.name, duration });
	}

	private onFailure(err: unknown, duration: number): void {
		const isSlow = duration >= this.options.slowCallDurationThreshold;
		this.window.record({ failed: true, slow: isSlow });
		this.consecutiveSuccesses = 0;

		if (this.state === "half-open") {
			// Any failure in half-open → back to open
			this.transitionTo("open");
		} else if (this.state === "closed") {
			this.consecutiveFailures++;
			const snapshot = this.window.getSnapshot();
			const shouldTripByFailures =
				this.consecutiveFailures >= this.options.failureThreshold;
			const shouldTripByFailureRate =
				snapshot.total >= this.options.minimumNumberOfCalls &&
				(snapshot.failed / snapshot.total) * 100 >= this.options.failureRateThreshold;
			const shouldTripBySlowRate =
				snapshot.total >= this.options.minimumNumberOfCalls &&
				(snapshot.slow / snapshot.total) * 100 >= this.options.slowCallRateThreshold;

			if (shouldTripByFailures || shouldTripByFailureRate || shouldTripBySlowRate) {
				this.transitionTo("open");
			}
		}

		this.emit("failure", { name: this.name, error: err, duration });
	}

	private transitionTo(newState: CircuitState): void {
		const oldState = this.state;
		if (oldState === newState) return;

		this.state = newState;

		// Reset counters on transitions
		if (newState === "closed") {
			this.consecutiveFailures = 0;
			this.consecutiveSuccesses = 0;
			this.halfOpenCalls = 0;
			this.notPermittedCalls = 0;
			this.window.reset();
		} else if (newState === "open") {
			this.openedAt = Date.now();
			this.halfOpenCalls = 0;
		} else if (newState === "half-open") {
			this.consecutiveSuccesses = 0;
			this.halfOpenCalls = 0;
		}

		// Map state to event name
		const eventMap: Record<CircuitState, CircuitEvent> = {
			closed: "close",
			open: "open",
			"half-open": "half-open",
			disabled: "disable",
		};

		this.emit(eventMap[newState], { name: this.name });
		this.emit("stateChange", { name: this.name, from: oldState, to: newState });
	}
}

// ─── Errors ───────────────────────────────────────────────────────────────────

export class CircuitOpenError extends Error {
	readonly name = "CircuitOpenError";
	readonly circuitName: string;
	readonly retryAfter: number;

	constructor(circuitName: string, retryAfter: number) {
		super(`Circuit "${circuitName}" is open. Retry after ${new Date(retryAfter).toISOString()}`);
		this.circuitName = circuitName;
		this.retryAfter = retryAfter;
	}
}
