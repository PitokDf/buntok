import { Heading } from "@/components/ui/Heading";
import { CodeBlock } from "@/components/ui/CodeBlock";
import { Callout } from "@/components/ui/Callout";

export const metadata = {
  title: "App API",
  description: "Complete reference for the App class and its methods.",
};

export default function AppApiPage() {
  return (
    <div>
      <Heading
        level={1}
        className="text-4xl font-bold mt-8 mb-4 text-text-primary"
      >
        App API
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        The <code>App</code> class is the core of Buntok. It provides HTTP
        routing, middleware, dependency injection, and server lifecycle
        management.
      </p>

      {/* ──────────────── CONSTRUCTOR ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Constructor
      </Heading>
      <CodeBlock code={`const app = new App();`} />

      {/* ──────────────── HTTP METHODS ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        HTTP Route Methods
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        All route methods accept a path, optional middlewares, and a handler.
        They return <code>this</code> for fluent chaining.
      </p>
      <CodeBlock
        code={`app.get("/users", handler)
  .post("/users", handler)
  .put("/users/:id", handler)
  .patch("/users/:id", handler)
  .delete("/users/:id", handler)
  .options("/users", handler)
  .head("/users", handler)
  .all("/users", handler)
  .query("/search", handler);  // QUERY method (Bun-specific, supports body)`}
      />

      <div className="overflow-x-auto my-4">
        <table className="min-w-full border border-border-primary text-sm">
          <thead>
            <tr className="bg-bg-secondary">
              <th className="border border-border-primary px-4 py-2 text-left text-text-primary">
                Method
              </th>
              <th className="border border-border-primary px-4 py-2 text-left text-text-primary">
                HTTP Method
              </th>
              <th className="border border-border-primary px-4 py-2 text-left text-text-primary">
                Notes
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-border-primary px-4 py-2 text-text-secondary">
                <code>get()</code>
              </td>
              <td className="border border-border-primary px-4 py-2 text-text-secondary">
                GET
              </td>
              <td className="border border-border-primary px-4 py-2 text-text-secondary"></td>
            </tr>
            <tr>
              <td className="border border-border-primary px-4 py-2 text-text-secondary">
                <code>post()</code>
              </td>
              <td className="border border-border-primary px-4 py-2 text-text-secondary">
                POST
              </td>
              <td className="border border-border-primary px-4 py-2 text-text-secondary"></td>
            </tr>
            <tr>
              <td className="border border-border-primary px-4 py-2 text-text-secondary">
                <code>put()</code>
              </td>
              <td className="border border-border-primary px-4 py-2 text-text-secondary">
                PUT
              </td>
              <td className="border border-border-primary px-4 py-2 text-text-secondary"></td>
            </tr>
            <tr>
              <td className="border border-border-primary px-4 py-2 text-text-secondary">
                <code>patch()</code>
              </td>
              <td className="border border-border-primary px-4 py-2 text-text-secondary">
                PATCH
              </td>
              <td className="border border-border-primary px-4 py-2 text-text-secondary"></td>
            </tr>
            <tr>
              <td className="border border-border-primary px-4 py-2 text-text-secondary">
                <code>delete()</code>
              </td>
              <td className="border border-border-primary px-4 py-2 text-text-secondary">
                DELETE
              </td>
              <td className="border border-border-primary px-4 py-2 text-text-secondary"></td>
            </tr>
            <tr>
              <td className="border border-border-primary px-4 py-2 text-text-secondary">
                <code>options()</code>
              </td>
              <td className="border border-border-primary px-4 py-2 text-text-secondary">
                OPTIONS
              </td>
              <td className="border border-border-primary px-4 py-2 text-text-secondary"></td>
            </tr>
            <tr>
              <td className="border border-border-primary px-4 py-2 text-text-secondary">
                <code>head()</code>
              </td>
              <td className="border border-border-primary px-4 py-2 text-text-secondary">
                HEAD
              </td>
              <td className="border border-border-primary px-4 py-2 text-text-secondary"></td>
            </tr>
            <tr>
              <td className="border border-border-primary px-4 py-2 text-text-secondary">
                <code>all()</code>
              </td>
              <td className="border border-border-primary px-4 py-2 text-text-secondary">
                All standard methods
              </td>
              <td className="border border-border-primary px-4 py-2 text-text-secondary">
                GET, HEAD, POST, PUT, PATCH, DELETE, OPTIONS
              </td>
            </tr>
            <tr>
              <td className="border border-border-primary px-4 py-2 text-text-secondary">
                <code>query()</code>
              </td>
              <td className="border border-border-primary px-4 py-2 text-text-secondary">
                QUERY
              </td>
              <td className="border border-border-primary px-4 py-2 text-text-secondary">
                Bun-specific, supports request body
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ──────────────── GROUP ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        group()
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Create a route group with a shared prefix. The group supports all HTTP
        methods, middleware, WebSocket, static files, and controller
        registration.
      </p>
      <CodeBlock
        code={`const api = app.group("/api/v1");

// Group-level middleware
api.use(cors);
api.use(auth);

// Routes in the group
api.get("/users", handler);
api.post("/users", handler);

// Nested groups
const admin = api.group("/admin");
admin.get("/dashboard", handler);`}
      />

      {/* ──────────────── MIDDLEWARE ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Middleware & Error Handling
      </Heading>
      <div className="overflow-x-auto my-4">
        <table className="min-w-full border border-border-primary text-sm">
          <thead>
            <tr className="bg-bg-secondary">
              <th className="border border-border-primary px-4 py-2 text-left text-text-primary">
                Method
              </th>
              <th className="border border-border-primary px-4 py-2 text-left text-text-primary">
                Description
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-border-primary px-4 py-2 text-text-secondary">
                <code>use(middleware)</code>
              </td>
              <td className="border border-border-primary px-4 py-2 text-text-secondary">
                Add global middleware (runs on every request)
              </td>
            </tr>
            <tr>
              <td className="border border-border-primary px-4 py-2 text-text-secondary">
                <code>onError(handler)</code>
              </td>
              <td className="border border-border-primary px-4 py-2 text-text-secondary">
                Set custom global error handler
              </td>
            </tr>
            <tr>
              <td className="border border-border-primary px-4 py-2 text-text-secondary">
                <code>notFound(handler)</code>
              </td>
              <td className="border border-border-primary px-4 py-2 text-text-secondary">
                Set custom 404 handler
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ──────────────── CORS ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        cors()
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Configure CORS. Unlike <code>app.use(cors(...))</code>, this also
        ensures CORS headers are applied to error responses (4xx/5xx).
      </p>
      <CodeBlock
        code={`app.cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE"],
  headers: ["Content-Type", "Authorization"],
});`}
      />

      {/* ──────────────── DEPENDENCY INJECTION ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Dependency Injection
      </Heading>
      <div className="overflow-x-auto my-4">
        <table className="min-w-full border border-border-primary text-sm">
          <thead>
            <tr className="bg-bg-secondary">
              <th className="border border-border-primary px-4 py-2 text-left text-text-primary">
                Method
              </th>
              <th className="border border-border-primary px-4 py-2 text-left text-text-primary">
                Description
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-border-primary px-4 py-2 text-text-secondary">
                <code>set(key, value)</code>
              </td>
              <td className="border border-border-primary px-4 py-2 text-text-secondary">
                Set a value in the DI map (accessible via{" "}
                <code>ctx.di[key]</code>)
              </td>
            </tr>
            <tr>
              <td className="border border-border-primary px-4 py-2 text-text-secondary">
                <code>setContainer(container)</code>
              </td>
              <td className="border border-border-primary px-4 py-2 text-text-secondary">
                Attach an IoC Container for automatic controller resolution
              </td>
            </tr>
            <tr>
              <td className="border border-border-primary px-4 py-2 text-text-secondary">
                <code>getContainer()</code>
              </td>
              <td className="border border-border-primary px-4 py-2 text-text-secondary">
                Get the attached Container (creates one if none set)
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <CodeBlock
        code={`// Simple DI
app.set("db", database);
app.set("config", config);

// IoC Container
const container = new Container();
container.scan([UserController]);
app.setContainer(container);`}
      />

      {/* ──────────────── CONTROLLER REGISTRATION ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        registerController()
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Register controllers decorated with <code>@Controller</code>. Accepts a
        single class, an instance, or an array.
      </p>
      <CodeBlock
        code={`// Single controller
app.registerController(UserController);

// Array of controllers
app.registerController([UserController, PostController]);

// On a group
const api = app.group("/api/v1");
api.registerController([UserController, PostController]);`}
      />
      <Callout type="info">
        When a Container is set via <code>setContainer()</code>, controllers
        with <code>@Dependencies</code> are resolved automatically.
      </Callout>

      {/* ──────────────── WEBSOCKET ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        WebSocket
      </Heading>
      <div className="overflow-x-auto my-4">
        <table className="min-w-full border border-border-primary text-sm">
          <thead>
            <tr className="bg-bg-secondary">
              <th className="border border-border-primary px-4 py-2 text-left text-text-primary">
                Method
              </th>
              <th className="border border-border-primary px-4 py-2 text-left text-text-primary">
                Description
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-border-primary px-4 py-2 text-text-secondary">
                <code>ws(path, handler)</code>
              </td>
              <td className="border border-border-primary px-4 py-2 text-text-secondary">
                Register a WebSocket endpoint
              </td>
            </tr>
            <tr>
              <td className="border border-border-primary px-4 py-2 text-text-secondary">
                <code>wsOptions(opts)</code>
              </td>
              <td className="border border-border-primary px-4 py-2 text-text-secondary">
                Configure Bun WebSocket options
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ──────────────── STATIC FILES ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        static()
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Serve static files with directory-traversal protection and ETag caching.
      </p>
      <CodeBlock
        code={`app.static("/public", "./public", {
  maxAge: 3600,           // 1 hour
  cacheControl: "public, max-age=3600",
});`}
      />

      {/* ──────────────── API DOCS ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        apiDocs()
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Enable interactive Swagger UI documentation.
      </p>
      <CodeBlock
        code={`app.apiDocs({
  path: "/docs",           // default: "/docs"
  title: "My API",
  version: "1.0.0",
  description: "API documentation",
  safeOnProduction: true,  // hide docs when NODE_ENV=production
});`}
      />

      {/* ──────────────── VALIDATE ENV ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        validateEnv()
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Validate <code>process.env</code> against a Zod schema. Exits with a
        clear error on failure.
      </p>
      <CodeBlock
        code={`import { App } from "@buntok/core";
import { z } from "@buntok/core/middlewares/validator";

// Static method
const env = App.validateEnv({
  PORT: z.coerce.number().default(1212),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
});

// Instance method (backward compatible)
const env = app.validateEnv({ ... });`}
      />

      {/* ──────────────── SERVER LIFECYCLE ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        listen()
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Start the HTTP server. Performs AOT compilation, auto-increments port on{" "}
        <code>EADDRINUSE</code>, and sets up graceful shutdown.
      </p>
      <CodeBlock
        code={`app.listen(1212, () => {
  console.log("Server running on port 1212");
});

// Uses process.env.PORT or 1212 by default
app.listen();`}
      />

      {/* ──────────────── TESTING ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Testing & Serverless
      </Heading>
      <div className="overflow-x-auto my-4">
        <table className="min-w-full border border-border-primary text-sm">
          <thead>
            <tr className="bg-bg-secondary">
              <th className="border border-border-primary px-4 py-2 text-left text-text-primary">
                Method
              </th>
              <th className="border border-border-primary px-4 py-2 text-left text-text-primary">
                Description
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-border-primary px-4 py-2 text-text-secondary">
                <code>request(input, init?)</code>
              </td>
              <td className="border border-border-primary px-4 py-2 text-text-secondary">
                Send a test request without binding to a port (fast)
              </td>
            </tr>
            <tr>
              <td className="border border-border-primary px-4 py-2 text-text-secondary">
                <code>fetch(request)</code>
              </td>
              <td className="border border-border-primary px-4 py-2 text-text-secondary">
                Standard fetch handler for serverless platforms (Vercel,
                Cloudflare)
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <CodeBlock
        code={`// In tests
const response = await app.request("/api/users", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ name: "John" }),
});

// Serverless (Vercel)
export default { fetch: (req) => app.fetch(req) };`}
      />

      {/* ──────────────── CONFIGURATION ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Configuration
      </Heading>
      <div className="overflow-x-auto my-4">
        <table className="min-w-full border border-border-primary text-sm">
          <thead>
            <tr className="bg-bg-secondary">
              <th className="border border-border-primary px-4 py-2 text-left text-text-primary">
                Method
              </th>
              <th className="border border-border-primary px-4 py-2 text-left text-text-primary">
                Description
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-border-primary px-4 py-2 text-text-secondary">
                <code>disable("x-powered-by")</code>
              </td>
              <td className="border border-border-primary px-4 py-2 text-text-secondary">
                Disable the X-Powered-By header
              </td>
            </tr>
            <tr>
              <td className="border border-border-primary px-4 py-2 text-text-secondary">
                <code>enable("x-powered-by")</code>
              </td>
              <td className="border border-border-primary px-4 py-2 text-text-secondary">
                Re-enable the X-Powered-By header
              </td>
            </tr>
            <tr>
              <td className="border border-border-primary px-4 py-2 text-text-secondary">
                <code>enableReusePort(bool?)</code>
              </td>
              <td className="border border-border-primary px-4 py-2 text-text-secondary">
                Enable SO_REUSEPORT (Linux only)
              </td>
            </tr>
            <tr>
              <td className="border border-border-primary px-4 py-2 text-text-secondary">
                <code>icon(path)</code>
              </td>
              <td className="border border-border-primary px-4 py-2 text-text-secondary">
                Set custom favicon path (default:{" "}
                <code>./public/favicon.ico</code>)
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ──────────────── PROPERTIES ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Properties
      </Heading>
      <div className="overflow-x-auto my-4">
        <table className="min-w-full border border-border-primary text-sm">
          <thead>
            <tr className="bg-bg-secondary">
              <th className="border border-border-primary px-4 py-2 text-left text-text-primary">
                Property
              </th>
              <th className="border border-border-primary px-4 py-2 text-left text-text-primary">
                Type
              </th>
              <th className="border border-border-primary px-4 py-2 text-left text-text-primary">
                Description
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-border-primary px-4 py-2 text-text-secondary">
                <code>server</code>
              </td>
              <td className="border border-border-primary px-4 py-2 text-text-secondary">
                <code>Server | undefined</code>
              </td>
              <td className="border border-border-primary px-4 py-2 text-text-secondary">
                Bun Server instance (available after <code>listen()</code>)
              </td>
            </tr>
            <tr>
              <td className="border border-border-primary px-4 py-2 text-text-secondary">
                <code>di</code>
              </td>
              <td className="border border-border-primary px-4 py-2 text-text-secondary">
                <code>DI</code>
              </td>
              <td className="border border-border-primary px-4 py-2 text-text-secondary">
                Dependency injection map
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ──────────────── FULL EXAMPLE ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Graceful Shutdown
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Production-ready shutdown with resource cleanup, in-flight request drain, and signal handling.
      </p>
      <CodeBlock
        code={`const app = new App({
  handleSignals: true,        // auto-register SIGINT/SIGTERM (default: true)
  shutdownTimeout: 30_000,    // max ms to wait for resource cleanup
});

// Register resources for cleanup on shutdown
app.registerResource({
  name: "db-pool",
  close: async () => {
    await db.$disconnect();
  },
});

// Manual shutdown (e.g., in tests)
await app.close({ timeout: 5_000 });  // stop accepting, flush in 5s
await app.shutdown();                  // alias for app.close()`}
      />

      <div className="overflow-x-auto my-4">
        <table className="min-w-full border border-border-primary text-sm">
          <thead>
            <tr className="bg-bg-secondary">
              <th className="border border-border-primary px-4 py-2 text-left text-text-primary">
                Option / Method
              </th>
              <th className="border border-border-primary px-4 py-2 text-left text-text-primary">
                Description
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-border-primary px-4 py-2 text-text-secondary">
                <code>handleSignals</code>
              </td>
              <td className="border border-border-primary px-4 py-2 text-text-secondary">
                Auto-register <code>SIGINT</code>/<code>SIGTERM</code> handlers (default: <code>true</code>)
              </td>
            </tr>
            <tr>
              <td className="border border-border-primary px-4 py-2 text-text-secondary">
                <code>shutdownTimeout</code>
              </td>
              <td className="border border-border-primary px-4 py-2 text-text-secondary">
                Max ms to wait for resource cleanup (default: <code>30000</code>)
              </td>
            </tr>
            <tr>
              <td className="border border-border-primary px-4 py-2 text-text-secondary">
                <code>app.close(options?)</code>
              </td>
              <td className="border border-border-primary px-4 py-2 text-text-secondary">
                Stop accepting traffic, flush resources — <code>{`{ timeout?, force? }`}</code>
              </td>
            </tr>
            <tr>
              <td className="border border-border-primary px-4 py-2 text-text-secondary">
                <code>app.registerResource(resource)</code>
              </td>
              <td className="border border-border-primary px-4 py-2 text-text-secondary">
                Register a resource for cleanup — <code>{`{ name?, close?(), dispose?() }`}</code>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ──────────────── FULL EXAMPLE ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        WebSocket Configuration
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Configure Bun WebSocket options globally (permessage-deflate, payload limits, backpressure).
      </p>
      <CodeBlock
        code={`app.wsOptions({
  perMessageDeflate: true,      // enable compression (default: false)
  maxPayloadLength: 1024 * 1024, // 1MB max message size
  idleTimeout: 30,              // seconds before idle connection closes
  maxBackpressure: 1024,        // max bytes buffered per connection
  publishToSelf: false,         // don't deliver to sender's own connection
});`}
      />

      {/* ──────────────── TRUSTED PROXY ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Trusted Proxy
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Configure which proxy peers supply <code>X-Forwarded-For</code>, <code>X-Forwarded-Proto</code>, etc. headers. <strong>Not trusted by default.</strong>
      </p>
      <CodeBlock
        code={`// Trust only specific proxy addresses
app.setTrustedProxy({
  addresses: ["127.0.0.1", "10.0.0.0/8"],
  depth: 1,  // how many proxies to trust (default: 1)
});

// Trust all (e.g., behind reverse proxy in same network)
app.setTrustedProxy();`}
      />

      {/* ──────────────── FULL EXAMPLE ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Full Example
      </Heading>
      <CodeBlock
        code={`import { App } from "@buntok/core";
import { z } from "@buntok/core/middlewares/validator";

const env = App.validateEnv({
  PORT: z.coerce.number().default(1212),
});

const app = new App();

// Global middleware
app.use(async (ctx, next) => {
  console.log(\`\${ctx.method} \${ctx.path}\`);
  return next();
});

// CORS
app.cors({ origin: "*" });

// API docs
app.apiDocs({ title: "My API", version: "1.0.0" });

// Routes
app.get("/", (ctx) => ctx.json({ hello: "world" }));
app.get("/users/:id", (ctx) => ctx.json({ id: ctx.params.id }));

// Error handling
app.onError((err, ctx) => {
  console.error(err);
  return ctx.json({ error: "Internal Server Error" }, 500);
});

// Start server
app.listen(env.PORT);`}
      />
    </div>
  );
}
