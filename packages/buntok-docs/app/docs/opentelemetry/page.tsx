import { Heading } from "@/components/ui/Heading";
import { CodeBlock } from "@/components/ui/CodeBlock";
import { Callout } from "@/components/ui/Callout";

export const metadata = {
  title: "OpenTelemetry - BunTok",
  description: "Distributed tracing with OpenTelemetry.",
};

export default function OpenTelemetryPage() {
  return (
    <>
      <Heading level={1}>OpenTelemetry</Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Distributed tracing with per-request spans following HTTP semantic conventions. All telemetry
        dependencies are lazily imported - zero startup cost until the plugin is installed.
      </p>

      <Heading level={2} className="text-xl font-semibold mt-8 mb-3 text-text-primary">
        Installation
      </Heading>
      <CodeBlock language="bash" code={`bun add @opentelemetry/api`} />

      <Heading level={2} className="text-xl font-semibold mt-8 mb-3 text-text-primary">
        Quick Start
      </Heading>
      <CodeBlock
        language="typescript"
        code={`import { otelPlugin } from "@buntok/core/plugins/opentelemetry";

app.plugin(otelPlugin({
  serviceName: "my-api",
  exporter: "console",  // logs traces to console
}));`}
      />

      <Heading level={2} className="text-xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2">
        Options
      </Heading>
      <div className="my-4 overflow-x-auto">
        <table className="w-full text-sm text-text-secondary border border-border-primary rounded-lg overflow-hidden">
          <thead className="bg-bg-tertiary border-b border-border-primary">
            <tr>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">Option</th>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">Type</th>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">Default</th>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">Description</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-border-primary">
              <td className="px-4 py-2 font-mono text-accent">serviceName</td>
              <td className="px-4 py-2 font-mono text-xs">string</td>
              <td className="px-4 py-2">-</td>
              <td className="px-4 py-2">
                <strong>Required.</strong> Service name for trace identification.
              </td>
            </tr>
            <tr className="border-b border-border-primary">
              <td className="px-4 py-2 font-mono text-accent">serviceVersion</td>
              <td className="px-4 py-2 font-mono text-xs">string</td>
              <td className="px-4 py-2">-</td>
              <td className="px-4 py-2">Service version.</td>
            </tr>
            <tr className="border-b border-border-primary">
              <td className="px-4 py-2 font-mono text-accent">exporter</td>
              <td className="px-4 py-2 font-mono text-xs">
                &quot;console&quot; | &quot;otlp&quot;
              </td>
              <td className="px-4 py-2">&quot;console&quot;</td>
              <td className="px-4 py-2">Trace exporter.</td>
            </tr>
            <tr className="border-b border-border-primary">
              <td className="px-4 py-2 font-mono text-accent">otlpEndpoint</td>
              <td className="px-4 py-2 font-mono text-xs">string</td>
              <td className="px-4 py-2">
                &quot;http://localhost:4318&quot;
              </td>
              <td className="px-4 py-2">OTLP endpoint URL (only for &quot;otlp&quot;).</td>
            </tr>
            <tr className="border-b border-border-primary">
              <td className="px-4 py-2 font-mono text-accent">sampler</td>
              <td className="px-4 py-2 font-mono text-xs">
                &quot;alwaysOn&quot; | &quot;alwaysOff&quot; | &quot;traceIdRatioBased&quot;
              </td>
              <td className="px-4 py-2">&quot;alwaysOn&quot;</td>
              <td className="px-4 py-2">Sampling strategy.</td>
            </tr>
            <tr className="border-b border-border-primary">
              <td className="px-4 py-2 font-mono text-accent">sampleRate</td>
              <td className="px-4 py-2 font-mono text-xs">number</td>
              <td className="px-4 py-2">1</td>
              <td className="px-4 py-2">Sample ratio (0&#8211;1), only for &quot;traceIdRatioBased&quot;.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <Heading level={2} className="text-xl font-semibold mt-8 mb-3 text-text-primary">
        What It Does
      </Heading>
      <ol className="my-3 text-text-secondary leading-relaxed list-decimal list-inside space-y-1">
        <li>
          <strong>Initializes</strong> OpenTelemetry SDK with your service name
        </li>
        <li>
          <strong>Registers global middleware</strong> that creates a span per request
        </li>
        <li>
          <strong>Records HTTP semantic attributes</strong>:
          <ul className="ml-6 list-disc list-inside space-y-1">
            <li>
              <code>http.request.method</code> (GET, POST, etc.)
            </li>
            <li>
              <code>url.full</code> (full request URL)
            </li>
            <li>
              <code>http.response.status_code</code> (200, 404, etc.)
            </li>
          </ul>
        </li>
        <li>
          <strong>Sets span status</strong> OK/Error based on response status (2xx = OK, 4xx/5xx =
          ERROR)
        </li>
        <li>
          <strong>Records exceptions</strong> on error (stack trace captured)
        </li>
        <li>
          <strong>Graceful shutdown</strong> on <code>SIGTERM</code>/<code>SIGINT</code> - flushes
          remaining spans
        </li>
      </ol>

      <Heading level={2} className="text-xl font-semibold mt-8 mb-3 text-text-primary">
        OTLP Exporter (Production)
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        For production, send traces to a collector (Jaeger, Grafana Tempo, Honeycomb, etc.):
      </p>
      <CodeBlock
        language="typescript"
        code={`app.plugin(otelPlugin({
  serviceName: "my-api",
  exporter: "otlp",
  otlpEndpoint: "http://localhost:4318",
  sampler: "traceIdRatioBased",
  sampleRate: 0.1,  // sample 10% of requests
}));`}
      />

      <Heading level={2} className="text-xl font-semibold mt-8 mb-3 text-text-primary">
        Console Exporter (Development)
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Logs traces to console - useful for debugging:
      </p>
      <CodeBlock
        language="typescript"
        code={`app.plugin(otelPlugin({
  serviceName: "my-api",
  exporter: "console",
}));`}
      />

      <Heading level={2} className="text-xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2">
        Sampling Strategies
      </Heading>
      <div className="my-4 overflow-x-auto">
        <table className="w-full text-sm text-text-secondary border border-border-primary rounded-lg overflow-hidden">
          <thead className="bg-bg-tertiary border-b border-border-primary">
            <tr>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">Strategy</th>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">Description</th>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">Use Case</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-border-primary">
              <td className="px-4 py-2 font-mono text-accent">&quot;alwaysOn&quot;</td>
              <td className="px-4 py-2">Record all requests</td>
              <td className="px-4 py-2">Development, low traffic</td>
            </tr>
            <tr className="border-b border-border-primary">
              <td className="px-4 py-2 font-mono text-accent">&quot;alwaysOff&quot;</td>
              <td className="px-4 py-2">Record no requests</td>
              <td className="px-4 py-2">Disable tracing</td>
            </tr>
            <tr className="border-b border-border-primary">
              <td className="px-4 py-2 font-mono text-accent">
                &quot;traceIdRatioBased&quot;
              </td>
              <td className="px-4 py-2">Sample sampleRate % of requests</td>
              <td className="px-4 py-2">Production (reduce overhead)</td>
            </tr>
          </tbody>
        </table>
      </div>

      <Heading level={2} className="text-xl font-semibold mt-8 mb-3 text-text-primary">
        Span Lifecycle
      </Heading>
      <CodeBlock
        code={`Request arrives
  → span starts (method, url)
  → handler runs
  → response sent
  → span ends (status code, duration)
  → span exported to collector`}
      />

      <Heading level={2} className="text-xl font-semibold mt-8 mb-3 text-text-primary">
        What Gets Traced
      </Heading>
      <ul className="my-3 text-text-secondary leading-relaxed list-disc list-inside space-y-1">
        <li>Every HTTP request to any route</li>
        <li>Request method and URL</li>
        <li>Response status code</li>
        <li>Duration (start &#8594; end)</li>
        <li>Errors and exceptions</li>
      </ul>

      <Callout type="info">
        Dependencies are lazily imported. No <code>@opentelemetry/api</code> code runs until the
        plugin is installed via <code>app.plugin()</code>.
      </Callout>
    </>
  );
}
