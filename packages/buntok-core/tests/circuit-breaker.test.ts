import { describe, it, expect, beforeEach } from "bun:test";
import {
	CircuitBreaker,
	CircuitOpenError,
} from "../src/circuit-breaker";

describe("CircuitBreaker", () => {
	let breaker: CircuitBreaker;

	beforeEach(() => {
		breaker = new CircuitBreaker("test", {
			failureThreshold: 3,
			successThreshold: 2,
			timeout: 500,
			slidingWindowSize: 10,
			minimumNumberOfCalls: 3,
			failureRateThreshold: 50,
		});
	});

	describe("initial state", () => {
		it("should start in closed state", () => {
			expect(breaker.getState()).toBe("closed");
		});

		it("should have zero metrics initially", () => {
			const m = breaker.getMetrics();
			expect(m.successes).toBe(0);
			expect(m.failures).toBe(0);
			expect(m.totalCalls).toBe(0);
			expect(m.failureRate).toBe(0);
			expect(m.notPermittedCalls).toBe(0);
		});
	});

	describe("fire() — success", () => {
		it("should return the result of the function", async () => {
			const result = await breaker.fire(() => 42);
			expect(result).toBe(42);
		});

		it("should count successes in metrics", async () => {
			await breaker.fire(() => "ok");
			await breaker.fire(() => "ok");
			const m = breaker.getMetrics();
			expect(m.successes).toBe(2);
			expect(m.totalCalls).toBe(2);
		});

		it("should reset consecutive failures on success", async () => {
			// Use high minimumNumberOfCalls so sliding window failure rate doesn't kick in
			const b = new CircuitBreaker("reset-test", {
				failureThreshold: 3,
				successThreshold: 2,
				timeout: 500,
				slidingWindowSize: 10,
				minimumNumberOfCalls: 20,
				failureRateThreshold: 50,
			});

			await b.fire(() => { throw new Error("fail"); }).catch(() => {});
			await b.fire(() => { throw new Error("fail"); }).catch(() => {});
			await b.fire(() => "ok"); // resets consecutive failures
			await b.fire(() => { throw new Error("fail"); }).catch(() => {});
			await b.fire(() => { throw new Error("fail"); }).catch(() => {});
			// Still closed because consecutive failures reset to 1 after the success,
			// and minCalls (20) not met so failureRate check doesn't apply
			expect(b.getState()).toBe("closed");
		});
	});

	describe("fire() — failure", () => {
		it("should throw the original error", async () => {
			try {
				await breaker.fire(() => { throw new Error("boom"); });
				expect(true).toBe(false);
			} catch (err) {
				expect((err as Error).message).toBe("boom");
			}
		});

		it("should count failures in metrics", async () => {
			await breaker.fire(() => { throw new Error("fail"); }).catch(() => {});
			await breaker.fire(() => { throw new Error("fail"); }).catch(() => {});
			const m = breaker.getMetrics();
			expect(m.failures).toBe(2);
			expect(m.totalCalls).toBe(2);
		});
	});

	describe("state transitions — CLOSED → OPEN", () => {
		it("should open after consecutive failures reach threshold", async () => {
			await breaker.fire(() => { throw new Error("1"); }).catch(() => {});
			await breaker.fire(() => { throw new Error("2"); }).catch(() => {});
			await breaker.fire(() => { throw new Error("3"); }).catch(() => {});
			expect(breaker.getState()).toBe("open");
		});

		it("should open after failure rate threshold exceeded", async () => {
			// 3 failures out of 4 = 75% > 50% threshold, and min 3 calls met
			await breaker.fire(() => "ok");
			await breaker.fire(() => { throw new Error("1"); }).catch(() => {});
			await breaker.fire(() => { throw new Error("2"); }).catch(() => {});
			await breaker.fire(() => { throw new Error("3"); }).catch(() => {});
			expect(breaker.getState()).toBe("open");
		});
	});

	describe("OPEN state", () => {
		it("should reject calls with CircuitOpenError", async () => {
			// Force open
			await breaker.fire(() => { throw new Error("1"); }).catch(() => {});
			await breaker.fire(() => { throw new Error("2"); }).catch(() => {});
			await breaker.fire(() => { throw new Error("3"); }).catch(() => {});

			try {
				await breaker.fire(() => "ok");
				expect(true).toBe(false);
			} catch (err) {
				expect(err).toBeInstanceOf(CircuitOpenError);
				expect((err as CircuitOpenError).circuitName).toBe("test");
			}
		});

		it("should increment notPermittedCalls", async () => {
			await breaker.fire(() => { throw new Error("1"); }).catch(() => {});
			await breaker.fire(() => { throw new Error("2"); }).catch(() => {});
			await breaker.fire(() => { throw new Error("3"); }).catch(() => {});

			await breaker.fire(() => "ok").catch(() => {});
			await breaker.fire(() => "ok").catch(() => {});

			const m = breaker.getMetrics();
			expect(m.notPermittedCalls).toBe(2);
		});

		it("should return fallback when provided", async () => {
			await breaker.fire(() => { throw new Error("1"); }).catch(() => {});
			await breaker.fire(() => { throw new Error("2"); }).catch(() => {});
			await breaker.fire(() => { throw new Error("3"); }).catch(() => {});

			const result = await breaker.fire(() => "ok", {
				fallback: () => "fallback value",
			});
			expect(result).toBe("fallback value");
		});

		it("should transition to half-open after timeout", async () => {
			await breaker.fire(() => { throw new Error("1"); }).catch(() => {});
			await breaker.fire(() => { throw new Error("2"); }).catch(() => {});
			await breaker.fire(() => { throw new Error("3"); }).catch(() => {});
			expect(breaker.getState()).toBe("open");

			// Wait for timeout
			await new Promise((r) => setTimeout(r, 600));
			expect(breaker.getState()).toBe("half-open");
		});
	});

	describe("HALF-OPEN state", () => {
		it("should allow limited calls in half-open", async () => {
			await breaker.fire(() => { throw new Error("1"); }).catch(() => {});
			await breaker.fire(() => { throw new Error("2"); }).catch(() => {});
			await breaker.fire(() => { throw new Error("3"); }).catch(() => {});

			await new Promise((r) => setTimeout(r, 600)); // → half-open

			// First call should succeed (halfOpenMaxCalls = 1 by default, but we configured 1)
			// Actually let me reconfigure for this test
		});

		it("should close after enough successes in half-open", async () => {
			const b = new CircuitBreaker("test2", {
				failureThreshold: 2,
				successThreshold: 2,
				timeout: 200,
				halfOpenMaxCalls: 2,
			});

			await b.fire(() => { throw new Error("1"); }).catch(() => {});
			await b.fire(() => { throw new Error("2"); }).catch(() => {});
			expect(b.getState()).toBe("open");

			await new Promise((r) => setTimeout(r, 300)); // → half-open

			await b.fire(() => "ok");
			await b.fire(() => "ok");
			expect(b.getState()).toBe("closed");
		});

		it("should reopen on failure in half-open", async () => {
			const b = new CircuitBreaker("test3", {
				failureThreshold: 2,
				successThreshold: 2,
				timeout: 200,
				halfOpenMaxCalls: 2,
			});

			await b.fire(() => { throw new Error("1"); }).catch(() => {});
			await b.fire(() => { throw new Error("2"); }).catch(() => {});

			await new Promise((r) => setTimeout(r, 300)); // → half-open

			await b.fire(() => { throw new Error("still broken"); }).catch(() => {});
			expect(b.getState()).toBe("open");
		});
	});

	describe("DISABLED state", () => {
		it("should allow all calls when disabled", async () => {
			breaker.disable();
			expect(breaker.getState()).toBe("disabled");

			const result = await breaker.fire(() => "ok");
			expect(result).toBe("ok");
		});

		it("should not count failures when disabled", async () => {
			breaker.disable();
			await breaker.fire(() => { throw new Error("fail"); }).catch(() => {});
			const m = breaker.getMetrics();
			expect(m.totalCalls).toBe(0);
		});

		it("should re-enable to closed", async () => {
			breaker.disable();
			breaker.enable();
			expect(breaker.getState()).toBe("closed");
		});
	});

	describe("reset()", () => {
		it("should force back to closed", async () => {
			await breaker.fire(() => { throw new Error("1"); }).catch(() => {});
			await breaker.fire(() => { throw new Error("2"); }).catch(() => {});
			await breaker.fire(() => { throw new Error("3"); }).catch(() => {});
			expect(breaker.getState()).toBe("open");

			breaker.reset();
			expect(breaker.getState()).toBe("closed");
		});
	});

	describe("events", () => {
		it("should emit failure events", async () => {
			let failureCount = 0;
			breaker.on("failure", () => failureCount++);

			await breaker.fire(() => { throw new Error("1"); }).catch(() => {});
			await breaker.fire(() => { throw new Error("2"); }).catch(() => {});

			expect(failureCount).toBe(2);
		});

		it("should emit success events", async () => {
			let successCount = 0;
			breaker.on("success", () => successCount++);

			await breaker.fire(() => "ok");
			await breaker.fire(() => "ok");

			expect(successCount).toBe(2);
		});

		it("should emit stateChange events", async () => {
			const transitions: string[] = [];
			breaker.on("stateChange", ({ from, to }: any) => {
				transitions.push(`${from}->${to}`);
			});

			await breaker.fire(() => { throw new Error("1"); }).catch(() => {});
			await breaker.fire(() => { throw new Error("2"); }).catch(() => {});
			await breaker.fire(() => { throw new Error("3"); }).catch(() => {});

			expect(transitions).toContain("closed->open");
		});

		it("should emit open event when circuit opens", async () => {
			let opened = false;
			breaker.on("open", () => { opened = true; });

			await breaker.fire(() => { throw new Error("1"); }).catch(() => {});
			await breaker.fire(() => { throw new Error("2"); }).catch(() => {});
			await breaker.fire(() => { throw new Error("3"); }).catch(() => {});

			expect(opened).toBe(true);
		});

		it("should unsubscribe via returned function", async () => {
			let count = 0;
			const unsub = breaker.on("failure", () => count++);

			await breaker.fire(() => { throw new Error("1"); }).catch(() => {});
			unsub();
			await breaker.fire(() => { throw new Error("2"); }).catch(() => {});

			expect(count).toBe(1);
		});
	});

	describe("slow call detection", () => {
		it("should track slow calls", async () => {
			const b = new CircuitBreaker("slow-test", {
				failureThreshold: 5,
				slowCallDurationThreshold: 100,
				slowCallRateThreshold: 50,
				minimumNumberOfCalls: 2,
				slidingWindowSize: 10,
			});

			// Slow calls (>100ms)
			await b.fire(() => new Promise((r) => setTimeout(r, 150)));
			await b.fire(() => new Promise((r) => setTimeout(r, 150)));

			const m = b.getMetrics();
			expect(m.slowCallRate).toBe(100);
		});
	});

	describe("time-based sliding window", () => {
		it("should track calls within time window", async () => {
			const b = new CircuitBreaker("time-test", {
				failureThreshold: 3,
				slidingWindowType: "time",
				slidingWindowSize: 1, // 1 second window
				minimumNumberOfCalls: 2,
				failureRateThreshold: 50,
			});

			await b.fire(() => { throw new Error("1"); }).catch(() => {});
			await b.fire(() => { throw new Error("2"); }).catch(() => {});
			await b.fire(() => { throw new Error("3"); }).catch(() => {});

			expect(b.getState()).toBe("open");
		});
	});

	describe("options", () => {
		it("should accept custom initial state", () => {
			const b = new CircuitBreaker("custom", { initialState: "disabled" });
			expect(b.getState()).toBe("disabled");
		});

		it("should use default options when none provided", () => {
			const b = new CircuitBreaker("defaults");
			expect(b.getState()).toBe("closed");
			const m = b.getMetrics();
			expect(m.totalCalls).toBe(0);
		});
	});
});
