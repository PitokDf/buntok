import { Heading } from "@/components/ui/Heading";
import { CodeBlock } from "@/components/ui/CodeBlock";
import { Callout } from "@/components/ui/Callout";

export const metadata = {
  title: "Routing",
  description:
    "Define routes with path parameters, wildcards, and regex patterns in Buntok.",
};

export default function RoutingPage() {
  return (
    <div>
      <Heading
        level={1}
        className="text-4xl font-bold mt-8 mb-4 text-text-primary"
      >
        Routing
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Buntok provides a fast, type-safe routing system built on a trie-based
        data structure with AOT compilation. Routes are matched in O(1) for
        static paths and via efficient trie traversal for dynamic routes.
      </p>

      {/* ──────────────── BASIC ROUTES ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Basic Routes
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Register handlers for any HTTP method using the corresponding{" "}
        <code>app</code> method:
      </p>
      <CodeBlock
        code={`import { App } from "@buntok/core";

const app = new App();

// Classic style
app.get("/", (ctx) => {
  return ctx.json({ message: "Hello, World!" });
});

// Elysia-style flexible return (also supported)
app.get("/hello", () => "hello world");                    // text/plain
app.get("/json", () => ({ hello: "buntok" }));             // application/json
app.get("/users/:id", ({ params }) => params);               // { id: "123" }

app.post("/users", async (ctx) => {
  const body = await ctx.body();
  return ctx.json({ created: true, ...body }, 201);
});

app.put("/users/:id", (ctx) => {
  return ctx.json({ updated: true });
});

app.delete("/users/:id", (ctx) => {
  return ctx.json({ deleted: true });
});

app.listen(1212);`}
      />

      {/* ──────────────── HTTP METHODS ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        HTTP Methods
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Buntok supports all standard HTTP methods plus the Bun-specific QUERY
        method:
      </p>
      <div className="my-4 overflow-x-auto">
        <table className="w-full text-sm text-text-secondary border border-border-primary rounded-lg overflow-hidden">
          <thead className="bg-bg-tertiary border-b border-border-primary">
            <tr>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Method
              </th>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Handler
              </th>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Description
              </th>
            </tr>
          </thead>
          <tbody>
            {[
              ["GET", "app.get()", "Retrieve resources"],
              ["POST", "app.post()", "Create resources"],
              ["PUT", "app.put()", "Replace resources"],
              ["PATCH", "app.patch()", "Partial update"],
              ["DELETE", "app.delete()", "Remove resources"],
              ["OPTIONS", "app.options()", "CORS preflight"],
              ["HEAD", "app.head()", "Headers only (no body)"],
              ["ALL", "app.all()", "Matches all methods above"],
              ["QUERY", "app.query()", "Bun-specific: GET with body"],
            ].map(([method, handler, desc]) => (
              <tr
                key={method}
                className="border-b border-border-primary/50 hover:bg-bg-tertiary/50 transition-colors"
              >
                <td className="px-4 py-2 font-mono font-semibold text-text-primary">
                  {method}
                </td>
                <td className="px-4 py-2 font-mono text-accent">{handler}</td>
                <td className="px-4 py-2">{desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Callout type="info">
        <code>app.all()</code> registers a handler for all 7 standard HTTP
        methods (GET, HEAD, POST, PUT, PATCH, DELETE, OPTIONS). It does not
        include QUERY.
      </Callout>

      <Callout type="warning">
        <strong>Route matching:</strong> Exact static routes are checked before
        dynamic routes, so <code>app.get(&quot;/users/admin&quot;)</code> takes
        precedence over <code>app.get(&quot;/users/:id&quot;)</code> regardless
        of registration order. If you register the same static method and path
        more than once, the later registration replaces the earlier handler.
      </Callout>

      <Heading
        level={3}
        className="text-xl font-semibold mt-6 mb-2 text-text-primary"
      >
        Multiple Methods
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Use <code>app.all()</code> to handle multiple methods with a single
        handler:
      </p>
      <CodeBlock
        code={`app.all("/health", (ctx) => {
  return ctx.json({ status: "ok" });
});`}
      />

      {/* ──────────────── ROUTE PARAMETERS ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Route Parameters
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Capture dynamic segments from the URL using the <code>:param</code>{" "}
        syntax. Parameters are extracted from the path and available on{" "}
        <code>ctx.params</code>.
      </p>
      <CodeBlock
        code={`// Single parameter — classic
app.get("/users/:id", (ctx) => {
  const { id } = ctx.params;
  return ctx.json({ userId: id });
});

// Single parameter — Elysia-style
app.get("/users/:id", ({ params }) => params);               // { id: "123" }
app.get("/users/:id", ({ params: { id } }) => id);          // "123" text/plain

// Multiple parameters
app.get("/posts/:postId/comments/:commentId", (ctx) => {
  const { postId, commentId } = ctx.params;
  return ctx.json({ postId, commentId });
});
app.get("/posts/:postId/comments/:commentId", ({ params }) => params);`}
      />

      <Callout type="warning">
        Route parameters are always <code>string</code>. Use{" "}
        <code>Number()</code> or <code>parseInt()</code> to convert to a number.
      </Callout>

      <Heading
        level={3}
        className="text-xl font-semibold mt-6 mb-2 text-text-primary"
      >
        Type-Safe Parameters
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Buntok uses TypeScript template literal types to infer route parameters
        at compile time. When you define a route like <code>"/users/:id"</code>,
        the type of <code>ctx.params</code> is automatically{" "}
        <code>{"{ id: string }"}</code>.
      </p>
      <CodeBlock
        code={`app.get("/users/:id", (ctx) => {
  // ctx.params is typed as { id: string }
  const { id } = ctx.params; // ✅ Type-safe
  const { name } = ctx.params; // ❌ Type error: 'name' does not exist
});`}
      />

      {/* ──────────────── WILDCARD ROUTES ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Wildcard Routes
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Use <code>*</code> to match any path after a prefix. The matched value
        is accessible via <code>ctx.params["*"]</code>.
      </p>
      <CodeBlock
        code={`app.get("/files/*", (ctx) => {
  const path = ctx.params["*"];
  return ctx.json({ filePath: path });
});
app.get("/files/*", ({ params }) => params["*"]); // shorthand

// GET /files/documents/report.pdf
// Response: { "filePath": "documents/report.pdf" }`}
      />

      <Callout type="info">
        Wildcards are useful for serving static files or catching all routes
        under a prefix.
      </Callout>

      {/* ──────────────── QUERY PARAMETERS ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Query Parameters
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Query parameters are parsed lazily from the URL and available on{" "}
        <code>ctx.query</code>. They are cached after first access.
      </p>
      <CodeBlock
        code={`app.get("/search", (ctx) => {
  const { q, page, limit } = ctx.query;
  return ctx.json({ query: q, page, limit });
});
app.get("/search", ({ query }) => query); // shorthand

// GET /search?q=buntok&page=1&limit=10
// Response: { "query": "buntok", "page": "1", "limit": "10" }`}
      />

      <Callout type="warning">
        Query parameters are always <code>string</code>. For type-safe
        validation, use <code>zValidator("query", schema)</code>.
      </Callout>

      {/* ──────────────── ROUTE GROUPS ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Route Groups
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Group related routes under a common prefix using{" "}
        <code>app.group()</code>. Groups support nested grouping and shared
        middleware.
      </p>
      <CodeBlock
        code={`const api = app.group("/api");

api.get("/users", listUsers);
api.post("/users", createUser);
api.get("/users/:id", getUser);

// Registered routes:
// GET  /api/users
// POST /api/users
// GET  /api/users/:id`}
      />

      <Heading
        level={3}
        className="text-xl font-semibold mt-6 mb-2 text-text-primary"
      >
        Nested Groups
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Groups can be nested. Child groups inherit the parent's prefix and
        middleware.
      </p>
      <CodeBlock
        code={`const api = app.group("/api");
const v1 = api.group("/v1");
const v2 = api.group("/v2");

v1.get("/users", listUsersV1);
v2.get("/users", listUsersV2);

// Registered routes:
// GET /api/v1/users
// GET /api/v2/users`}
      />

      <Heading
        level={3}
        className="text-xl font-semibold mt-6 mb-2 text-text-primary"
      >
        Group Middleware
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Apply middleware to all routes in a group using <code>group.use()</code>
        . Group middleware runs after global middleware but before route-level
        middleware.
      </p>
      <CodeBlock
        code={`const api = app.group("/api");
api.use(cors);
api.use(rateLimit);

api.get("/users", listUsers);
api.post("/users", createUser);

// Execution order for GET /api/users:
// cors → rateLimit → listUsers`}
      />

      {/* ──────────────── MIDDLEWARE ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Middleware
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Middleware functions execute before the final handler. They receive the
        context and a <code>next</code> function to pass control forward.
      </p>

      <Heading
        level={3}
        className="text-xl font-semibold mt-6 mb-2 text-text-primary"
      >
        Route-Level Middleware
      </Heading>
      <CodeBlock
        code={`const auth = async (ctx, next) => {
  const token = ctx.getCookie("token");
  if (!token) return ctx.json({ error: "Unauthorized" }, 401);
  // verify token...
  return next();
};

app.get("/admin", auth, (ctx) => {
  return ctx.json({ secret: "data" });
});

// Multiple middleware
app.get("/admin/settings", auth, checkRole("admin"), (ctx) => {
  return ctx.json({ settings: {} });
});`}
      />

      <Heading
        level={3}
        className="text-xl font-semibold mt-6 mb-2 text-text-primary"
      >
        Global Middleware
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Use <code>app.use()</code> to register middleware that runs for every
        request, regardless of route.
      </p>
      <CodeBlock
        code={`// Runs for every request
app.use(logger);
app.cors({ origin: "*" });  // Use app.cors() for CORS

// Execution order:
// logger → cors → route-level middleware → handler`}
      />

      <Heading
        level={3}
        className="text-xl font-semibold mt-6 mb-2 text-text-primary"
      >
        Execution Order
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Middleware executes in this order:
      </p>
      <ol className="my-3 ml-6 list-decimal text-text-secondary space-y-1">
        <li>
          Global middleware (<code>app.use()</code>)
        </li>
        <li>
          Group middleware (<code>group.use()</code>)
        </li>
        <li>
          Route-level middleware (inline or <code>@Use()</code> decorator)
        </li>
        <li>Final handler</li>
      </ol>

      <Callout type="info">
        All middleware pipelines are AOT-compiled into a single function at boot
        time, eliminating runtime overhead from chaining.
      </Callout>

      {/* ──────────────── STATIC FILES ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Static File Serving
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Serve static files from a directory using <code>app.static()</code>.
      </p>
      <CodeBlock
        code={`// Serve files from ./public at /public/*
app.static("/public", "./public");

// Serve files from ./assets at /files/*
app.static("/files", "./assets");`}
      />

      <Heading
        level={3}
        className="text-xl font-semibold mt-6 mb-2 text-text-primary"
      >
        Security
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Directory traversal attacks (e.g., <code>/files/../../etc/passwd</code>)
        are automatically blocked. Requests that escape the base directory
        return <code>403 Forbidden</code>.
      </p>

      <Heading
        level={3}
        className="text-xl font-semibold mt-6 mb-2 text-text-primary"
      >
        Caching
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Static file responses include{" "}
        <code>Cache-Control: public, max-age=3600</code> (1 hour). ETag support
        is also included - if the client sends <code>If-None-Match</code> and
        the ETag matches, the server returns <code>304 Not Modified</code>.
      </p>

      {/* ──────────────── WEBSOCKET ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        WebSocket
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Register WebSocket endpoints using <code>app.ws()</code>. WebSocket
        paths must be static (no parameters or wildcards).
      </p>
      <CodeBlock
        code={`app.ws("/chat", {
  open: (ws) => {
    ws.send(JSON.stringify({ type: "connected" }));
  },
  message: (ws, message) => {
    // Broadcast to all connected clients
    ws.publish("chat", message);
  },
  close: (ws, code, reason) => {
    console.log("Client disconnected:", code);
  },
});`}
      />

      <Callout type="info">
        WebSocket uses Bun's native WebSocket server. The{" "}
        <code>ws.data.ctx</code> provides access to the request context,
        cookies, and DI container.
      </Callout>

      {/* ──────────────── ERROR HANDLING ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Error Handling
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Override the global error and 404 handlers using{" "}
        <code>app.onError()</code> and <code>app.notFound()</code>.
      </p>
      <CodeBlock
        code={`// Custom error handler
app.onError((err, ctx) => {
  console.error(err);
  return ctx.json(
    { success: false, error: err.message },
    500
  );
});

// Custom 404 handler
app.notFound((ctx) => {
  return ctx.json(
    { success: false, error: "Not Found", path: ctx.request.url },
    404
  );
});`}
      />

      <Heading
        level={3}
        className="text-xl font-semibold mt-6 mb-2 text-text-primary"
      >
        Built-in Error Classes
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Throw HTTP errors to trigger the error handler with the appropriate
        status code:
      </p>
      <div className="my-4 overflow-x-auto">
        <table className="w-full text-sm text-text-secondary border border-border-primary rounded-lg overflow-hidden">
          <thead className="bg-bg-tertiary border-b border-border-primary">
            <tr>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Error Class
              </th>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {[
              ["BadRequestError", "400"],
              ["UnauthorizedError", "401"],
              ["ForbiddenError", "403"],
              ["NotFoundError", "404"],
              ["MethodNotAllowedError", "405"],
              ["ConflictError", "409"],
              ["UnprocessableEntityError", "422"],
              ["TooManyRequestsError", "429"],
              ["InternalServerError", "500"],
              ["ServiceUnavailableError", "503"],
            ].map(([error, status]) => (
              <tr
                key={error}
                className="border-b border-border-primary/50 hover:bg-bg-tertiary/50 transition-colors"
              >
                <td className="px-4 py-2 font-mono text-accent">{error}</td>
                <td className="px-4 py-2 font-mono font-semibold text-text-primary">
                  {status}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <CodeBlock
        code={`import { NotFoundError, ForbiddenError } from "@buntok/core";

app.get("/users/:id", async (ctx) => {
  const user = await findUser(ctx.params.id);
  if (!user) throw new NotFoundError("User not found");
  if (!canView(user, ctx.user)) throw new ForbiddenError();
  return ctx.json(user);
});`}
      />

      {/* ──────────────── PERFORMANCE ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Performance
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Buntok's router is built for speed:
      </p>
      <ul className="my-3 ml-6 list-disc text-text-secondary space-y-1">
        <li>
          <strong>Static routes</strong> - Stored in a flat <code>Map</code> for
          O(1) lookup
        </li>
        <li>
          <strong>Dynamic routes</strong> - Trie-based with efficient JS
          implementation (optimized over native FFI)
        </li>
        <li>
          <strong>LRU cache</strong> - 2048-entry cache avoids re-traversal for
          repeated paths
        </li>
        <li>
          <strong>AOT compilation</strong> - Middleware pipelines compiled into
          single functions at boot
        </li>
      </ul>

      {/* ──────────────── API REFERENCE ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        API Reference
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
            {[
              ["app.get(path, ...handlers)", "Register GET route"],
              ["app.post(path, ...handlers)", "Register POST route"],
              ["app.put(path, ...handlers)", "Register PUT route"],
              ["app.patch(path, ...handlers)", "Register PATCH route"],
              ["app.delete(path, ...handlers)", "Register DELETE route"],
              ["app.options(path, ...handlers)", "Register OPTIONS route"],
              ["app.head(path, ...handlers)", "Register HEAD route"],
              ["app.all(path, ...handlers)", "Register all HTTP methods"],
              ["app.query(path, ...handlers)", "Register QUERY (Bun-specific)"],
              ["app.group(prefix)", "Create a route group"],
              ["app.static(routePath, dir)", "Serve static files"],
              ["app.ws(path, handler)", "Register WebSocket endpoint"],
              ["app.use(middleware)", "Register global middleware"],
              ["app.onError(handler)", "Override error handler"],
              ["app.notFound(handler)", "Override 404 handler"],
            ].map(([method, desc]) => (
              <tr
                key={method}
                className="border-b border-border-primary/50 hover:bg-bg-tertiary/50 transition-colors"
              >
                <td className="px-4 py-2 font-mono text-accent">{method}</td>
                <td className="px-4 py-2">{desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ──────────────── NEXT STEPS ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Next Steps
      </Heading>
      <ul className="my-3 ml-6 list-disc text-text-secondary space-y-1">
        <li>
          <a href="/docs/controllers" className="text-accent hover:underline">
            Controllers
          </a>{" "}
          - Organize routes with class-based controllers
        </li>
        <li>
          <a href="/docs/middleware" className="text-accent hover:underline">
            Middleware
          </a>{" "}
          - Learn more about middleware patterns
        </li>
        <li>
          <a href="/docs/validation" className="text-accent hover:underline">
            Validation
          </a>{" "}
          - Validate request data with Zod
        </li>
        <li>
          <a href="/docs/context" className="text-accent hover:underline">
            Context
          </a>{" "}
          - Explore the full Context API
        </li>
      </ul>
    </div>
  );
}
