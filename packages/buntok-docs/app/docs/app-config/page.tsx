import { Heading } from "@/components/ui/Heading";
import { CodeBlock } from "@/components/ui/CodeBlock";
import { Callout } from "@/components/ui/Callout";

export const metadata = {
  title: "App Configuration",
  description:
    "Validate environment variables and configure built-in features.",
};

export default function AppConfigPage() {
  return (
    <div>
      <Heading
        level={1}
        className="text-4xl font-bold mt-8 mb-4 text-text-primary"
      >
        App Configuration
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Methods on the <code>App</code> class for environment validation,
        feature toggles, and production settings.
      </p>

      {/* ──────────────── VALIDATEENV ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        validateEnv()
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Type-safe environment variable validation using Zod. Validates{" "}
        <code>process.env</code> against a schema and exits with formatted
        errors if validation fails.
      </p>
      <p className="my-3 text-text-secondary leading-relaxed">
        The <code>buntok init</code> command generates a{" "}
        <code>src/env.ts</code> file with a default schema. You can extend it
        as needed:
      </p>
      <CodeBlock
        code={`import { App } from "@buntok/core";
import { z } from "@buntok/core/middlewares/validator";

export const env = App.validateEnv({
  PORT: z.coerce.number().default(1212),
  AUTH_STORE: z.enum(["header", "cookie"]).default("header"),
  AUTH_COOKIE: z.string().default("session"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
});

// env is fully typed!
console.log(env.PORT); // number (defaulted)
console.log(env.DATABASE_URL); // string (required)`}
      />

      <Callout type="warning">
        If validation fails, the server prints a formatted error and calls{" "}
        <code>process.exit(1)</code>. The app will not start.
      </Callout>

      <Heading
        level={3}
        className="text-xl font-semibold mt-6 mb-2 text-text-primary"
      >
        Error Output
      </Heading>
      <CodeBlock
        code={`🚨 Buntok Environment Error

Missing or invalid environment variables:
  ❯ DATABASE_URL: Expected string to be a URL
  ❯ JWT_SECRET: String must contain at least 32 character(s)

Server boot aborted.`}
      />

      <Heading
        level={3}
        className="text-xl font-semibold mt-6 mb-2 text-text-primary"
      >
        Custom Error Handler
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Use the <code>onError</code> callback to handle validation errors
        yourself (e.g., send to Sentry, log to a file):
      </p>
      <CodeBlock
        code={`const env = app.validateEnv(
  {
    DATABASE_URL: z.string().url(),
    JWT_SECRET: z.string().min(32),
  },
  {
    onError: (errors) => {
      // Send to monitoring service
      console.error("Env validation failed:", errors);
      // You must exit manually when using onError
      process.exit(1);
    },
  }
);`}
      />

      <Callout type="info">
        When <code>onError</code> is provided, the default error printing and{" "}
        <code>process.exit(1)</code> are skipped. You must handle the exit
        yourself.
      </Callout>

      {/* ──────────────── DISABLE / ENABLE ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        disable() / enable()
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Toggle built-in features. Currently supports <code>"x-powered-by"</code>{" "}
        - the <code>X-Powered-By: buntok</code> response header.
      </p>
      <CodeBlock
        code={`const app = new App();

// Disable X-Powered-By header (common in production)
app.disable("x-powered-by");

// Re-enable later if needed
app.enable("x-powered-by");`}
      />

      <Callout type="info">
        <strong>Production defaults (performance-optimized):</strong> Request
        logging (<code>logRequests</code>) and <code>x-request-id</code> header
        generation are <strong>disabled by default</strong> in production for
        maximum throughput. Enable via <code>LOG_REQUESTS=true</code> env or{" "}
        <code>app.setLogResponse(true)</code> when you need observability.
      </Callout>

      {/* ──────────────── ENABLEREUSEPORT ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        enableReusePort()
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Enable <code>SO_REUSEPORT</code> for multi-process load balancing (Linux
        only). When enabled, multiple instances of the app can bind to the same
        port, and incoming requests are load-balanced at the kernel level.
      </p>
      <CodeBlock
        code={`const app = new App();

app.enableReusePort();

// Or explicitly disable
app.enableReusePort(false);`}
      />

      <Callout type="info">
        <code>SO_REUSEPORT</code> is Linux-only. On other platforms, a warning
        is logged in development mode and the option is ignored. Useful when
        running multiple Bun processes behind a load balancer on the same
        machine.
      </Callout>

      {/* ──────────────── ICON ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        icon()
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Set a custom favicon path. Buntok serves a built-in{" "}
        <code>favicon.ico</code> by default.
      </p>
      <CodeBlock code={`app.icon("./public/favicon.svg");`} />

      {/* ──────────────── CHAINING ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Method Chaining
      </Heading>
      <CodeBlock
        code={`const env = app.validateEnv({
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
});

app
  .disable("x-powered-by")
  .enableReusePort()
  .icon("./public/favicon.svg")
  .cors()
  .use(compress())
  .onError(handler)
  .notFound(notFoundHandler)
  .listen(env.PORT);`}
      />
    </div>
  );
}
