import { Heading } from "@/components/ui/Heading";
import { CodeBlock } from "@/components/ui/CodeBlock";
import { Callout } from "@/components/ui/Callout";

export const metadata = {
  title: "Logger",
  description: "Zero-dependency logger with JSON/text formats, log levels, and file output.",
};

export default function LoggerPage() {
  return (
    <div>
      <Heading level={1} className="text-4xl font-bold mt-8 mb-4 text-text-primary">
        Logger
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Zero-dependency logger built into <code>@buntok/core</code>. Text format in development (colorized), JSON in production. Env-driven, supports file logging.
      </p>

      {/* ──────────────── BASIC USAGE ──────────────── */}
      <Heading level={2} className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2">
        Basic Usage
      </Heading>
      <CodeBlock
        code={`import { logger, Logger, LogLevel } from "@buntok/core";

logger.info("Server started", { port: 1212 });
logger.warn("High memory usage", { mb: 512 });
logger.error("DB connection failed", { error: err.message });
logger.debug("Verbose", { meta: 1 });

// LogLevel: DEBUG=0, INFO=1, WARN=2, ERROR=3
`}
      />

      {/* ──────────────── OPTIONS ──────────────── */}
      <Heading level={2} className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2">
        Logger Options
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
            {[
              ["level", "LogLevel", "INFO (dev) / WARN (prod)", "Min level to output"],
              ["format", '"text" | "json"', '"text" (dev) / "json" (prod)', "Output format"],
              ["logRequests", "boolean", "false (prod) / true (dev)", "Log every request (method + path + status). Disabled in production for performance."],
            ].map(([opt, type, def, desc]) => (
              <tr key={opt} className="border-b border-border-primary/50 hover:bg-bg-tertiary/50 transition-colors">
                <td className="px-4 py-2 font-mono text-accent">{opt}</td>
                <td className="px-4 py-2 font-mono text-text-secondary">{type}</td>
                <td className="px-4 py-2 font-mono text-text-secondary">{def}</td>
                <td className="px-4 py-2">{desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <CodeBlock
        code={`import { Logger, LogLevel } from "@buntok/core";

const custom = new Logger({
  level: LogLevel.DEBUG,
  format: "json",
  logRequests: false,
});

custom.info("Hello", { user: "Alice" });
`}
      />

      {/* ──────────────── ENV ──────────────── */}
      <Heading level={2} className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2">
        Environment Variables
      </Heading>
      <div className="my-4 overflow-x-auto">
        <table className="w-full text-sm text-text-secondary border border-border-primary rounded-lg overflow-hidden">
          <thead className="bg-bg-tertiary border-b border-border-primary">
            <tr>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">Variable</th>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">Effect</th>
            </tr>
          </thead>
          <tbody>
            {[
              ["NODE_ENV=production", "JSON format + WARN level (vs text + INFO)"],
              ["LOG_DIR=./logs", "Write logs to file: app-YYYY-MM-DD.log (JSON lines), auto mkdir"],
              ["LOG_REQUESTS=true", "Enable request logging (disabled by default in production for performance)"],
            ].map(([env, desc]) => (
              <tr key={env} className="border-b border-border-primary/50 hover:bg-bg-tertiary/50 transition-colors">
                <td className="px-4 py-2 font-mono text-accent">{env}</td>
                <td className="px-4 py-2">{desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Callout type="info">
        <code>LOG_DIR</code> creates daily files <code>app-YYYY-MM-DD.log</code> via <code>appendFile</code>. Production defaults to JSON lines with <code>timestamp, level, message, ...meta</code>.
      </Callout>

      {/* ──────────────── METHODS ──────────────── */}
      <Heading level={2} className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2">
        Methods
      </Heading>
      <div className="my-4 overflow-x-auto">
        <table className="w-full text-sm text-text-secondary border border-border-primary rounded-lg overflow-hidden">
          <thead className="bg-bg-tertiary border-b border-border-primary">
            <tr>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">Method</th>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">Description</th>
            </tr>
          </thead>
          <tbody>
            {[
              ["logger.debug(msg, meta?)", "DEBUG level (blue)"],
              ["logger.info(msg, meta?)", "INFO level (green)"],
              ["logger.warn(msg, meta?)", "WARN level (yellow)"],
              ["logger.error(msg, meta?)", "ERROR level (red, stderr)"],
              ["logger.logRequests", "Getter: boolean"],
              ["logger.flushSync()", "Flush buffered stdout/stderr (graceful shutdown)"],
            ].map(([m, d]) => (
              <tr key={m} className="border-b border-border-primary/50 hover:bg-bg-tertiary/50 transition-colors">
                <td className="px-4 py-2 font-mono text-accent text-xs">{m}</td>
                <td className="px-4 py-2">{d}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <CodeBlock
        code={`// Graceful shutdown
process.on("SIGTERM", () => {
  logger.info("Shutting down");
  logger.flushSync();
  process.exit(0);
});`}
      />
      <Callout type="warning">
        Logger buffers writes via <code>queueMicrotask</code> and auto-flushes. Call <code>flushSync()</code> before <code>process.exit()</code> to avoid losing last lines.
      </Callout>
    </div>
  );
}
