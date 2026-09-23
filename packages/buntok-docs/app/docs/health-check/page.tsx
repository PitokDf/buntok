import { Heading } from "@/components/ui/Heading";
import { CodeBlock } from "@/components/ui/CodeBlock";
import { Callout } from "@/components/ui/Callout";

export const metadata = {
  title: "Health Check",
  description: "Monitor service health with configurable health check endpoints.",
};


export default function HealthCheckPage() {
  return (
    <div>
      <Heading
        level={1}
        className="text-4xl font-bold mt-8 mb-4 text-text-primary"
      >
        Health Check
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Health check endpoints for monitoring application status, database
        connectivity, and dependencies.
      </p>

      <Callout type="warning">
        <strong>Do NOT wrap <code>healthCheck()</code> with{" "}
        <code>app.get()</code>.</strong> The function registers the route itself.
        Wrapping it will create duplicate routes or cause unexpected behavior.
      </Callout>

      {/* ──────────────── BASIC USAGE ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Basic Usage
      </Heading>
      <CodeBlock
        code={`import { healthCheck } from "@buntok/core";

// Simple health check at /health
healthCheck(app);`}
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
                Type
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
              ["path", "string", '"/health"', "Endpoint path"],
              [
                "check",
                "() => Promise<HealthStatus>",
                "undefined",
                "Custom health check function",
              ],
              ["includeUptime", "boolean", "true", "Include uptime in response"],
              ["version", "string", "undefined", "App version in response"],
            ].map(([opt, type, def, desc]) => (
              <tr
                key={opt}
                className="border-b border-border-primary/50 hover:bg-bg-tertiary/50 transition-colors"
              >
                <td className="px-4 py-2 font-mono text-accent">{opt}</td>
                <td className="px-4 py-2 font-mono text-text-secondary text-xs">
                  {type}
                </td>
                <td className="px-4 py-2 font-mono text-text-secondary">
                  {def}
                </td>
                <td className="px-4 py-2">{desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ──────────────── DATABASE CHECK ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Database Check
      </Heading>
      <CodeBlock
        code={`import { healthCheck, createDatabaseCheck } from "@buntok/core";

healthCheck(app, {
  check: createDatabaseCheck(async () => {
    await db.\$queryRaw\`SELECT 1\`;
    return true; // healthy
  }),
});`}
      />

      {/* ──────────────── COMBINED CHECKS ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Combined Checks
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Use <code>createHealthCheck</code> to combine multiple checks:
      </p>
      <CodeBlock
        code={`import { healthCheck, createHealthCheck } from "@buntok/core";

healthCheck(app, {
  version: "1.0.0",
  check: createHealthCheck([
    {
      name: "database",
      check: async () => {
        await db.\$queryRaw\`SELECT 1\`;
        return true;
      },
    },
    {
      name: "redis",
      check: async () => {
        await redis.ping();
        return true;
      },
    },
    {
      name: "external-api",
      check: async () => {
        const res = await fetch("https://api.example.com/health");
        return res.ok;
      },
    },
  ]),
});`}
      />

      {/* ──────────────── RESPONSE ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Response
      </Heading>
      <CodeBlock
        code={`// Healthy (200)
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 3600,
  "version": "1.0.0",
  "checks": {
    "database": { "status": "up", "duration": 12 },
    "redis": { "status": "up", "duration": 3 }
  }
}

// Unhealthy (503)
{
  "status": "unhealthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "checks": {
    "database": { "status": "down", "message": "Connection refused" }
  }
}`}
      />

      {/* ──────────────── CUSTOM CHECK ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Kubernetes Liveness & Readiness Probes
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Kubernetes-ready health check endpoints for container orchestration.
      </p>
      <CodeBlock
        code={`import { livenessCheck, readinessCheck } from "@buntok/core";

// Liveness probe — is the process alive?
livenessCheck(app, { path: "/health/live" });  // default: "/health/live"

// Readiness probe — can it serve traffic?
readinessCheck(app, {
  path: "/health/ready",
  checks: [
    async () => {
      const dbOk = await checkDbConnection();
      return dbOk
        ? { status: "healthy" }
        : { status: "unhealthy", message: "DB unreachable" };
    },
  ],
});`}
      />

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
              <td className="px-4 py-2 font-mono text-accent">livenessCheck(app, opts?)</td>
              <td className="px-4 py-2">Register liveness endpoint — always returns <code>200 OK</code> if server is running</td>
            </tr>
            <tr className="border-b border-border-primary/50 hover:bg-bg-tertiary/50 transition-colors">
              <td className="px-4 py-2 font-mono text-accent">readinessCheck(app, opts?)</td>
              <td className="px-4 py-2">Register readiness endpoint — runs <code>checks</code> array, returns <code>200</code> if all healthy</td>
            </tr>
            <tr className="border-b border-border-primary/50 hover:bg-bg-tertiary/50 transition-colors">
              <td className="px-4 py-2 font-mono text-accent">runReadinessChecks(checks)</td>
              <td className="px-4 py-2">Execute <code>ReadinessCheck[]</code> and aggregate results</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ──────────────── CUSTOM CHECK ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Custom Check Function
      </Heading>
      <CodeBlock
        code={`healthCheck(app, {
  check: async () => {
    const dbOk = await checkDatabase();
    const redisOk = await checkRedis();
    const diskOk = await checkDiskSpace();

    if (dbOk && redisOk && diskOk) {
      return { status: "healthy" };
    }
    if (!dbOk) {
      return {
        status: "unhealthy",
        message: "Database is down",
        checks: { database: { status: "down" } },
      };
    }
    return {
      status: "degraded",
      message: "Some services unavailable",
      checks: {
        database: { status: "up" },
        redis: { status: redisOk ? "up" : "down" },
        disk: { status: diskOk ? "up" : "down" },
      },
    };
  },
});`}
      />
    </div>
  );
}
