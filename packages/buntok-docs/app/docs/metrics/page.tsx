import { Heading } from "@/components/ui/Heading";
import { CodeBlock } from "@/components/ui/CodeBlock";
import { Callout } from "@/components/ui/Callout";

export const metadata = {
  title: "Metrics",
  description: "Request metrics collector with Prometheus export, per-route stats, and in-flight tracking.",
};

export default function MetricsPage() {
  return (
    <div>
      <Heading
        level={1}
        className="text-4xl font-bold mt-8 mb-4 text-text-primary"
      >
        Metrics
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Request metrics collector with Prometheus export. Tracks request count,
        duration, errors, and in-flight requests.
      </p>

      <CodeBlock
        code={`import { Metrics, metricsEndpoint, metricsMiddleware } from "@buntok/core";`}
      />

      {/* ──────────────── SETUP ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Setup
      </Heading>
      <CodeBlock
        code={`import { App } from "@buntok/core";
import { Metrics, metricsEndpoint, metricsMiddleware } from "@buntok/core";

const app = new App();
const metrics = new Metrics();

// Add middleware to record all requests
app.use(metricsMiddleware(metrics));

// Register /metrics endpoint for Prometheus scraping
metricsEndpoint(metrics, "/metrics");  // default: "/metrics"

app.listen(1212);`}
      />

      {/* ──────────────── READ METRICS ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Read Metrics
      </Heading>
      <CodeBlock
        code={`const snapshot = metrics.read();

console.log(snapshot.requests);        // total requests
console.log(snapshot.errors);         // total errors
console.log(snapshot.inFlight);       // currently in-flight
console.log(snapshot.totalDurationMs); // total duration across all requests

// Per-route breakdown
console.log(snapshot.byRoute);
// {
//   "GET /users": { count: 150, avgDurationMs: 12.5, p99Ms: 45.2 },
//   "POST /users": { count: 30, avgDurationMs: 25.1, p99Ms: 89.3 },
// }

// Per-status-class breakdown
console.log(snapshot.byStatusClass);
// { "2xx": 150, "4xx": 12, "5xx": 3 }`}
      />

      {/* ──────────────── PROMETHEUS EXPORT ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Prometheus Export
      </Heading>
      <CodeBlock
        code={`// Export in Prometheus text format
const prometheus = metrics.toPrometheus();
// # HELP http_requests_total Total HTTP requests
// # TYPE http_requests_total counter
// http_requests_total{method="GET",path="/users",status="200"} 150
// ...`}
      />

      {/* ──────────────── MANUAL RECORDING ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Manual Recording
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        If you need to record requests outside of the middleware (e.g., custom handlers):
      </p>
      <CodeBlock
        code={`app.get("/custom", (ctx) => {
  const end = metrics.start("GET /custom");

  // ... do work ...

  end(200); // record with status code

  return ctx.json({ ok: true });
});`}
      />

      {/* ──────────────── API REFERENCE ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        API Reference
      </Heading>

      <Heading
        level={3}
        className="text-xl font-semibold mt-6 mb-2 text-text-primary"
      >
        Metrics Class
      </Heading>
      <div className="my-4 overflow-x-auto">
        <table className="w-full text-sm text-text-secondary border border-border-primary rounded-lg overflow-hidden">
          <thead className="bg-bg-tertiary border-b border-border-primary">
            <tr>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Method
              </th>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Description
              </th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-border-primary/50 hover:bg-bg-tertiary/50 transition-colors">
              <td className="px-4 py-2 font-mono text-accent">
                metrics.record(route, statusCode, durationMs)
              </td>
              <td className="px-4 py-2">Record a completed request</td>
            </tr>
            <tr className="border-b border-border-primary/50 hover:bg-bg-tertiary/50 transition-colors">
              <td className="px-4 py-2 font-mono text-accent">
                metrics.start(route)
              </td>
              <td className="px-4 py-2">
                Start timing a request (returns <code>end</code> function)
              </td>
            </tr>
            <tr className="border-b border-border-primary/50 hover:bg-bg-tertiary/50 transition-colors">
              <td className="px-4 py-2 font-mono text-accent">
                metrics.read()
              </td>
              <td className="px-4 py-2">
                Get current <code>MetricSnapshot</code>
              </td>
            </tr>
            <tr className="border-b border-border-primary/50 hover:bg-bg-tertiary/50 transition-colors">
              <td className="px-4 py-2 font-mono text-accent">
                metrics.toPrometheus()
              </td>
              <td className="px-4 py-2">
                Export in Prometheus text format
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <Heading
        level={3}
        className="text-xl font-semibold mt-6 mb-2 text-text-primary"
      >
        Helper Functions
      </Heading>
      <div className="my-4 overflow-x-auto">
        <table className="w-full text-sm text-text-secondary border border-border-primary rounded-lg overflow-hidden">
          <thead className="bg-bg-tertiary border-b border-border-primary">
            <tr>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Function
              </th>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Description
              </th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-border-primary/50 hover:bg-bg-tertiary/50 transition-colors">
              <td className="px-4 py-2 font-mono text-accent">
                metricsMiddleware(metrics, route?)
              </td>
              <td className="px-4 py-2">Middleware that auto-records requests</td>
            </tr>
            <tr className="border-b border-border-primary/50 hover:bg-bg-tertiary/50 transition-colors">
              <td className="px-4 py-2 font-mono text-accent">
                metricsEndpoint(metrics, path?)
              </td>
              <td className="px-4 py-2">
                Register <code>/metrics</code> endpoint
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <Heading
        level={3}
        className="text-xl font-semibold mt-6 mb-2 text-text-primary"
      >
        MetricSnapshot
      </Heading>
      <CodeBlock
        code={`interface MetricSnapshot {
  requests: number;        // total request count
  errors: number;          // total error count (status >= 500)
  inFlight: number;        // currently in-flight requests
  totalDurationMs: number; // total duration across all requests
  byRoute: Record<string, {
    count: number;
    avgDurationMs: number;
    p99Ms: number;
  }>;
  byStatusClass: Record<string, number>; // { "2xx": N, "4xx": N, "5xx": N }
}`}
      />
    </div>
  );
}
