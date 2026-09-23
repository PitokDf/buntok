import { Heading } from "@/components/ui/Heading";
import { CodeBlock } from "@/components/ui/CodeBlock";
import { Callout } from "@/components/ui/Callout";

export const metadata = {
  title: "Audit Log",
  description: "Track user actions with middleware-based audit logging.",
};


export default function AuditLogPage() {
  return (
    <div>
      <Heading
        level={1}
        className="text-4xl font-bold mt-8 mb-4 text-text-primary"
      >
        Audit Log
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Request logging middleware with customizable storage. Track every API
        call with timing, user info, and optional body/query logging.
      </p>

      {/* ──────────────── BASIC USAGE ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Basic Usage
      </Heading>
      <CodeBlock
        code={`import { auditLog } from "@buntok/core";

// Log all requests to console
app.use(auditLog());`}
      />

      <Callout type="info">
        Without a <code>storage</code> option, logs go to{" "}
        <code>logger.info</code> (respects your logger config for format/file
        output). 5xx = error, 4xx = warn, others = log.
      </Callout>

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
              [
                "storage",
                "(entry) => Promise<void>",
                "logger.info",
                "Custom storage function",
              ],
              [
                "excludePaths",
                "string[]",
                "[]",
                "Paths to skip logging",
              ],
              [
                "excludeMethods",
                "string[]",
                "[]",
                "HTTP methods to skip",
              ],
              ["logBody", "boolean", "false", "Log request body"],
              ["logQuery", "boolean", "true", "Log query parameters"],
              [
                "maxBodySize",
                "number",
                "1024",
                "Max body size to log (bytes)",
              ],
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

      {/* ──────────────── CUSTOM STORAGE ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Custom Storage
      </Heading>
      <CodeBlock
        code={`app.use(auditLog({
  storage: async (entry) => {
    await db.auditLog.create({ data: entry });
  },
  excludePaths: ["/health", "/ping"],
  excludeMethods: ["OPTIONS"],
  logBody: true,
  logQuery: true,
}));`}
      />

      {/* ──────────────── AUDIT LOG ENTRY ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        AuditLogEntry
      </Heading>
      <div className="my-4 overflow-x-auto">
        <table className="w-full text-sm text-text-secondary border border-border-primary rounded-lg overflow-hidden">
          <thead className="bg-bg-tertiary border-b border-border-primary">
            <tr>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Field
              </th>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Type
              </th>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Description
              </th>
            </tr>
          </thead>
          <tbody>
            {[
              ["timestamp", "string", "ISO 8601 timestamp"],
              ["method", "string", "HTTP method (GET, POST, etc.)"],
              ["path", "string", "Request path"],
              ["status", "number", "Response status code"],
              ["duration", "number", "Request duration in ms"],
              ["ip", "string", "Client IP address"],
              ["userId", "string | number", "Authenticated user ID (if available)"],
              ["userAgent", "string", "Client user agent"],
              ["body", "any", "Request body (if logBody is true)"],
              ["query", "Record<string, any>", "Query params (if logQuery is true)"],
              ["error", "string", "Error message (if status >= 400)"],
            ].map(([field, type, desc]) => (
              <tr
                key={field}
                className="border-b border-border-primary/50 hover:bg-bg-tertiary/50 transition-colors"
              >
                <td className="px-4 py-2 font-mono text-accent">{field}</td>
                <td className="px-4 py-2 font-mono text-text-secondary">
                  {type}
                </td>
                <td className="px-4 py-2">{desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ──────────────── DATABASE EXAMPLE ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Database Schema (Prisma)
      </Heading>
      <CodeBlock
        code={`// prisma/schema.prisma
model AuditLog {
  id        Int      @id @default(autoincrement())
  timestamp DateTime @default(now())
  method    String
  path      String
  status    Int
  duration  Float
  ip        String?
  userId    String?
  userAgent String?
  body      Json?
  query     Json?
  error     String?
  createdAt DateTime @default(now())
}`}
      />
    </div>
  );
}
