import { Heading } from "@/components/ui/Heading";
import { CodeBlock } from "@/components/ui/CodeBlock";
import { Callout } from "@/components/ui/Callout";

export const metadata = {
  title: "Plugins - BunTok",
  description: "Extend BunTok apps with isolated, named plugins.",
};

export default function PluginsPage() {
  return (
    <>
      <Heading level={1}>Plugins</Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Extend BunTok apps with isolated, named plugins. Plugins can add middleware, routes, context
        properties, or any other functionality to the app.
      </p>

      <Heading level={2} className="text-xl font-semibold mt-8 mb-3 text-text-primary">
        Imports
      </Heading>
      <CodeBlock
        language="typescript"
        code={`import { createPlugin } from "@buntok/core";
import type { Plugin } from "@buntok/core";`}
      />

      <Heading level={2} className="text-xl font-semibold mt-8 mb-3 text-text-primary">
        Plugin Interface
      </Heading>
      <CodeBlock
        language="typescript"
        code={`interface Plugin<DI extends Record<string, unknown> = Record<string, unknown>> {
  name: string;
  install: (app: App<DI>) => void | Promise<void>;
}`}
      />
      <ul className="my-3 text-text-secondary leading-relaxed list-disc list-inside space-y-1">
        <li>
          <code>name</code> — unique identifier, used for dedup (same name = install once only)
        </li>
        <li>
          <code>install(app)</code> — receives the app instance, can be async
        </li>
        <li>
          <code>DI</code> generic — constrains the app's dependency injection type
        </li>
      </ul>

      <Heading level={2} className="text-xl font-semibold mt-8 mb-3 text-text-primary">
        Creating a Plugin
      </Heading>

      <Heading level={3} className="text-lg font-semibold mt-6 mb-2 text-text-primary">
        Simple plugin — add middleware
      </Heading>
      <CodeBlock
        language="typescript"
        code={`const loggerPlugin = createPlugin({
  name: "logger",
  install: (app) => {
    app.use(async (ctx, next) => {
      const start = Date.now();
      await next();
      const ms = Date.now() - start;
      console.log(\`\${ctx.request.method} \${ctx.request.url} - \${ms}ms\`);
    });
  },
});`}
      />

      <Heading level={3} className="text-lg font-semibold mt-6 mb-2 text-text-primary">
        Plugin with routes
      </Heading>
      <CodeBlock
        language="typescript"
        code={`const healthPlugin = createPlugin({
  name: "health",
  install: (app) => {
    app.get("/health", () => ({ status: "ok", timestamp: Date.now() }));
    app.get("/health/ready", () => ({ ready: true }));
  },
});`}
      />

      <Heading level={3} className="text-lg font-semibold mt-6 mb-2 text-text-primary">
        Plugin with async dependencies (lazy import)
      </Heading>
      <CodeBlock
        language="typescript"
        code={`const authPlugin = createPlugin({
  name: "@buntok/auth",
  install: async (app) => {
    // Lazy import — zero startup cost if plugin not installed
    const { JwtService } = await import("@buntok/core");
    const jwt = new JwtService(process.env.JWT_SECRET!);
    app.use(requireAuth(jwt));
  },
});`}
      />

      <Heading level={2} className="text-xl font-semibold mt-8 mb-3 text-text-primary">
        Installing Plugins
      </Heading>
      <CodeBlock
        language="typescript"
        code={`app.plugin(loggerPlugin);
app.plugin(healthPlugin);`}
      />

      <Callout type="info">
        <ul className="list-disc list-inside space-y-1">
          <li>
            Dedup by <code>name</code> — installing same plugin twice is a no-op
          </li>
          <li>
            <code>install()</code> runs immediately when <code>app.plugin()</code> is called
          </li>
          <li>
            Async <code>install()</code> is awaited — server won't start until all plugins finish
          </li>
          <li>
            Installed names tracked in <code>app.installedPlugins</code> (Set)
          </li>
        </ul>
      </Callout>

      <Heading level={2} className="text-xl font-semibold mt-8 mb-3 text-text-primary">
        Checking Installed Plugins
      </Heading>
      <CodeBlock
        language="typescript"
        code={`if (app.installedPlugins.has("logger")) {
  console.log("Logger plugin is installed");
}`}
      />

      <Heading level={2} className="text-xl font-semibold mt-8 mb-3 text-text-primary">
        Plugin Order Matters
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Plugins run in order of <code>app.plugin()</code> calls. Middleware added by earlier plugins
        runs before later ones:
      </p>
      <CodeBlock
        language="typescript"
        code={`app.plugin(corsPlugin);    // CORS runs first
app.plugin(authPlugin);    // Auth runs second
app.plugin(loggerPlugin);  // Logger runs third`}
      />
    </>
  );
}
