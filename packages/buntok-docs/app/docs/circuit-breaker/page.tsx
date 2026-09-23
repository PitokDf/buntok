import { Heading } from "@/components/ui/Heading";
import { CodeBlock } from "@/components/ui/CodeBlock";
import { Callout } from "@/components/ui/Callout";

export const metadata = {
  title: "Circuit Breaker",
  description: "Fail-fast resilience pattern for protecting against cascading failures. Supports sliding windows, fallbacks, events, and health checks.",
};


export default function CircuitBreakerPage() {
  return (
    <div>
      <Heading
        level={1}
        className="text-4xl font-bold mt-8 mb-4 text-text-primary"
      >
        Circuit Breaker
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Fail-fast resilience pattern for protecting against cascading failures.
        When a downstream service starts failing, the circuit breaker opens and
        rejects calls immediately — avoiding slow timeouts and resource exhaustion.
        Based on patterns from Resilience4j, Polly-TS, and Fiber.
      </p>

      {/* ──────────────── STATES ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        States
      </Heading>
      <div className="my-4 overflow-x-auto">
        <table className="w-full text-sm text-text-secondary border border-border-primary rounded-lg overflow-hidden">
          <thead className="bg-bg-tertiary border-b border-border-primary">
            <tr>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                State
              </th>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Behavior
              </th>
            </tr>
          </thead>
          <tbody>
            {[
              ["CLOSED", "Normal operation. Calls pass through. Failures are counted."],
              ["OPEN", "All calls rejected fast (CircuitOpenError or fallback). After timeout → HALF-OPEN."],
              ["HALF-OPEN", "Limited trial calls. If enough succeed → CLOSED. Any failure → OPEN."],
              ["DISABLED", "Manual override. All calls pass through, no tracking."],
            ].map(([state, behavior]) => (
              <tr
                key={state}
                className="border-b border-border-primary/50 hover:bg-bg-tertiary/50 transition-colors"
              >
                <td className="px-4 py-2 font-mono text-accent">{state}</td>
                <td className="px-4 py-2">{behavior}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ──────────────── INSTALLATION ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Installation
      </Heading>
      <CodeBlock
        code={`import { CircuitBreaker, CircuitOpenError } from "@buntok/core";
import { circuitBreaker, getCircuitBreakers } from "@buntok/core";`}
      />

      {/* ──────────────── AS MIDDLEWARE ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        As Middleware
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        The simplest way to use the circuit breaker. Wrap specific routes or
        mount globally to protect all routes.
      </p>
      <CodeBlock
        code={`import { App } from "@buntok/core";
import { circuitBreaker } from "@buntok/core";

const app = new App();

// Protect a specific route
app.post("/pay",
  circuitBreaker("payment", {
    failureThreshold: 5,          // consecutive failures to trip
    successThreshold: 2,          // successes in half-open to close
    timeout: 30000,               // ms in open before half-open
    slidingWindowType: "count",   // "count" | "time"
    slidingWindowSize: 10,        // calls or seconds
    minimumNumberOfCalls: 5,      // min calls before failure rate applies
    failureRateThreshold: 50,     // % to trip
    halfOpenMaxCalls: 1,          // concurrent trial calls in half-open
    slowCallDurationThreshold: 5000,
    slowCallRateThreshold: 100,   // 100 = disabled
    onOpen: (ctx) => ctx.json(
      { error: "Service temporarily unavailable" },
      503,
    ),
  }),
  async (ctx) => {
    const result = await processPayment();
    return ctx.json(result);
  },
);

// Or protect all routes globally
app.use(circuitBreaker("global", { failureThreshold: 10 }));`}
      />

      {/* ──────────────── OPTIONS ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Options
      </Heading>
      <div className="my-4 overflow-x-auto">
        <table className="w-full text-sm text-text-secondary border border-border-primary rounded-lg overflow-hidden">
          <thead className="bg-bg-tertiary border-b border-border-primary">
            <tr>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Option
              </th>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Default
              </th>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Description
              </th>
            </tr>
          </thead>
          <tbody>
            {[
              ["failureThreshold", "5", "Consecutive failures to open circuit"],
              ["successThreshold", "2", "Successes in half-open to close circuit"],
              ["timeout", "30000", "Ms in open state before half-open"],
              ["slidingWindowType", '"count"', "Window type: count-based or time-based"],
              ["slidingWindowSize", "10", "Window size (calls or seconds)"],
              ["minimumNumberOfCalls", "10", "Min calls before failure rate applies"],
              ["failureRateThreshold", "50", "Failure rate % to trip circuit"],
              ["slowCallDurationThreshold", "5000", "Ms to consider a call slow"],
              ["slowCallRateThreshold", "100", "Slow call rate % to trip (100=disabled)"],
              ["halfOpenMaxCalls", "1", "Max concurrent calls in half-open"],
              ["initialState", '"closed"', "Initial circuit state"],
              ["onOpen", "503 JSON", "Custom response when circuit is open (middleware only)"],
            ].map(([opt, def, desc]) => (
              <tr
                key={opt}
                className="border-b border-border-primary/50 hover:bg-bg-tertiary/50 transition-colors"
              >
                <td className="px-4 py-2 font-mono text-accent">{opt}</td>
                <td className="px-4 py-2 font-mono text-text-secondary">{def}</td>
                <td className="px-4 py-2">{desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ──────────────── PROGRAMMATIC USAGE ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Programmatic Usage
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Use <code>CircuitBreaker</code> directly for more control. The{" "}
        <code>fire()</code> method wraps any async function with circuit
        protection.
      </p>
      <CodeBlock
        code={`import { CircuitBreaker, CircuitOpenError } from "@buntok/core";

const breaker = new CircuitBreaker("payment", {
  failureThreshold: 5,
  timeout: 30000,
});

// Basic usage
try {
  const result = await breaker.fire(() => processPayment());
  console.log("Payment succeeded:", result);
} catch (err) {
  if (err instanceof CircuitOpenError) {
    console.log(\`Circuit open, retry after: \${err.retryAfter}\`);
  }
}

// With fallback
const result = await breaker.fire(
  () => processPayment(),
  { fallback: () => cachedPaymentResult },
);`}
      />

      {/* ──────────────── FALLBACK ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Fallback
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Provide a fallback function to return a default value when the circuit
        is open or the call fails. This prevents errors from propagating to
        the caller.
      </p>
      <CodeBlock
        code={`const breaker = new CircuitBreaker("weather-api", {
  failureThreshold: 3,
  timeout: 60000,
});

const weather = await breaker.fire(
  () => fetchWeatherFromAPI(),
  {
    fallback: () => ({
      temperature: 25,
      condition: "cached",
      message: "Using cached data",
    }),
  },
);`}
      />

      {/* ──────────────── MANUAL CONTROL ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Manual Control
      </Heading>
      <CodeBlock
        code={`breaker.reset();      // Force back to closed state
breaker.disable();    // All calls pass through (no tracking)
breaker.enable();     // Re-enable after disable`}
      />

      {/* ──────────────── EVENTS ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Events
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Subscribe to state changes, successes, and failures. Useful for
        logging, alerting, and monitoring.
      </p>
      <CodeBlock
        code={`breaker.on("open", () => logAlert("Circuit opened!"));
breaker.on("close", () => logInfo("Circuit closed - recovered"));
breaker.on("halfOpen", () => logInfo("Testing recovery..."));
breaker.on("success", (e) => logInfo(\`Success in \${e.duration}ms\`));
breaker.on("failure", (e) => logError(\`Failed: \${e.error.message}\`));
breaker.on("stateChange", (e) => logInfo(\`\${e.from} → \${e.to}\`));
breaker.on("callNotPermitted", () => logWarn("Call rejected - circuit open"));

// Unsubscribe
const unsub = breaker.on("failure", handler);
unsub();`}
      />

      {/* ──────────────── SLIDING WINDOWS ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Sliding Windows
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        The circuit breaker uses a sliding window to track call outcomes.
        Two strategies are available:
      </p>
      <div className="my-4 overflow-x-auto">
        <table className="w-full text-sm text-text-secondary border border-border-primary rounded-lg overflow-hidden">
          <thead className="bg-bg-tertiary border-b border-border-primary">
            <tr>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Type
              </th>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Size
              </th>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Best For
              </th>
            </tr>
          </thead>
          <tbody>
            {[
              ['count', "Number of calls (e.g., 10)", "Steady traffic, simple thresholding"],
              ['time', "Seconds (e.g., 60)", "Variable traffic, time-based decay"],
            ].map(([type, size, best]) => (
              <tr
                key={type}
                className="border-b border-border-primary/50 hover:bg-bg-tertiary/50 transition-colors"
              >
                <td className="px-4 py-2 font-mono text-accent">{type}</td>
                <td className="px-4 py-2">{size}</td>
                <td className="px-4 py-2">{best}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <CodeBlock
        code={`// Count-based (default)
new CircuitBreaker("api", {
  slidingWindowType: "count",
  slidingWindowSize: 20,       // last 20 calls
  minimumNumberOfCalls: 5,     // need at least 5 calls
  failureRateThreshold: 50,    // 50% failure rate trips
});

// Time-based
new CircuitBreaker("api", {
  slidingWindowType: "time",
  slidingWindowSize: 60,       // last 60 seconds
  minimumNumberOfCalls: 5,
  failureRateThreshold: 50,
});`}
      />

      {/* ──────────────── HEALTH CHECKS ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Health Checks
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Expose circuit breaker state in your health endpoint. Use{" "}
        <code>getCircuitBreakers()</code> to get all registered instances.
      </p>
      <CodeBlock
        code={`import { getCircuitBreakers } from "@buntok/core";

app.get("/health", (ctx) => {
  const breakers = getCircuitBreakers();
  const status = Object.fromEntries(
    [...breakers.entries()].map(([name, b]) => [
      name,
      {
        state: b.getState(),
        metrics: b.getMetrics(),
      },
    ]),
  );

  const allHealthy = Object.values(status).every(
    (s: any) => s.state !== "open",
  );

  return ctx.json(
    { status: allHealthy ? "healthy" : "degraded", circuits: status },
    allHealthy ? 200 : 503,
  );
});`}
      />

      {/* ──────────────── METRICS ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Metrics
      </Heading>
      <CodeBlock
        code={`const metrics = breaker.getMetrics();
// {
//   successes: 45,
//   failures: 3,
//   totalCalls: 48,
//   failureRate: 6.25,
//   slowCallRate: 0,
//   notPermittedCalls: 12,
// }`}
      />

      {/* ──────────────── EXAMPLE: PAYMENT SERVICE ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Example: Payment Service
      </Heading>
      <CodeBlock
        code={`import { App } from "@buntok/core";
import { circuitBreaker } from "@buntok/core";

const app = new App();

const paymentBreaker = circuitBreaker("payment", {
  failureThreshold: 3,
  successThreshold: 2,
  timeout: 30000,
  slidingWindowSize: 10,
  minimumNumberOfCalls: 3,
  failureRateThreshold: 50,
  onOpen: (ctx) =>
    ctx.json(
      {
        error: "Payment service temporarily unavailable",
        message: "Please try again later",
        retryAfter: 30,
      },
      503,
    ),
});

app.post("/checkout", paymentBreaker, async (ctx) => {
  const { items, userId } = ctx.body();

  const payment = await processPayment(userId, items);

  return ctx.json({
    success: true,
    transactionId: payment.id,
  });
});

app.get("/payment-status", async (ctx) => {
  // Access the breaker directly for status
  const { getCircuitBreakers } = await import("@buntok/core");
  const breakers = getCircuitBreakers();
  const payment = breakers.get("payment");

  return ctx.json({
    state: payment?.getState(),
    metrics: payment?.getMetrics(),
  });
});`}
      />

      <Callout type="info">
        Circuit breaker instances are shared by name. If you use{" "}
        <code>circuitBreaker("payment", ...)</code> in multiple routes, they
        all share the same circuit state.
      </Callout>
    </div>
  );
}
