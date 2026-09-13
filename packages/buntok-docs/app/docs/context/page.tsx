import { Heading } from "@/components/ui/Heading";
import { CodeBlock } from "@/components/ui/CodeBlock";
import { Callout } from "@/components/ui/Callout";

export const metadata = {
  title: "Context",
  description:
    "Access request data, response helpers, and store state via the Context object.",
};

export default function ContextPage() {
  return (
    <div>
      <Heading
        level={1}
        className="text-4xl font-bold mt-8 mb-4 text-text-primary"
      >
        Context
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        The <code>Context</code> object (<code>ctx</code>) is passed to every
        route handler and middleware. It provides access to the request,
        response helpers, validated data, and shared state.
      </p>

      {/* ──────────────── REQUEST PROPERTIES ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Request Properties
      </Heading>
      <div className="my-4 overflow-x-auto">
        <table className="w-full text-sm text-text-secondary border border-border-primary rounded-lg overflow-hidden">
          <thead className="bg-bg-tertiary border-b border-border-primary">
            <tr>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Property
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
              ["ctx.request", "Request", "Raw Bun Request object"],
              [
                "ctx.params",
                "Record<string, string>",
                "Route parameters (:id, *wildcard)",
              ],
              [
                "ctx.query",
                "Record<string, string>",
                "Parsed query string (lazily cached)",
              ],
              [
                "ctx.user",
                "Record<string, unknown> | undefined",
                "JWT payload (undefined before auth)",
              ],
              ["ctx.ip", "string", "Client IP (reads X-Forwarded-For)"],
              [
                "ctx.store",
                "Record<string, unknown>",
                "Per-request key-value store",
              ],
              ["ctx.di", "DI", "Dependency injection container values"],
            ].map(([prop, type, desc]) => (
              <tr
                key={prop}
                className="border-b border-border-primary/50 hover:bg-bg-tertiary/50 transition-colors"
              >
                <td className="px-4 py-2 font-mono text-accent">{prop}</td>
                <td className="px-4 py-2 font-mono text-text-secondary">
                  {type}
                </td>
                <td className="px-4 py-2">{desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Heading
        level={3}
        className="text-xl font-semibold mt-6 mb-2 text-text-primary"
      >
        Route Parameters
      </Heading>
      <CodeBlock
        code={`// Classic style
app.get("/users/:id", (ctx) => {
  const { id } = ctx.params; // string
  return ctx.json({ userId: id });
});

// Elysia-style destructuring + flexible return
app.get("/users/:id", ({ params }) => params); // { id: "123" } as JSON
app.get("/users/:id", ({ params: { id } }) => id); // "123" as text/plain

app.get("/files/*", (ctx) => {
  const path = ctx.params["*"]; // wildcard match
  return ctx.json({ filePath: path });
});
app.get("/files/*", ({ params }) => params["*"]); // shorthand`}
      />

      <Heading
        level={3}
        className="text-xl font-semibold mt-6 mb-2 text-text-primary"
      >
        Query Parameters
      </Heading>
      <CodeBlock
        code={`app.get("/search", (ctx) => {
  const { q, page, limit } = ctx.query;
  // All values are strings
  return ctx.json({ query: q, page, limit });
});

// GET /search?q=buntok&page=1&limit=10`}
      />

      <Heading
        level={3}
        className="text-xl font-semibold mt-6 mb-2 text-text-primary"
      >
        Client IP
      </Heading>
      <CodeBlock
        code={`app.get("/ip", (ctx) => {
  return ctx.json({ ip: ctx.ip });
});`}
      />

      <Callout type="info">
        <code>ctx.ip</code> reads from the <code>X-Forwarded-For</code> header
        (first value) if present, otherwise returns <code>"127.0.0.1"</code>.
      </Callout>

      <Heading
        level={3}
        className="text-xl font-semibold mt-6 mb-2 text-text-primary"
      >
        Per-Request Store
      </Heading>
      <CodeBlock
        code={`// Use ctx.store to share data between middleware
const auth = async (ctx, next) => {
  ctx.store.user = await verifyToken(ctx);
  return next();
};

app.get("/profile", auth, (ctx) => {
  return ctx.json({ user: ctx.store.user });
});`}
      />

      {/* ──────────────── REQUEST BODY ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Request Body
      </Heading>
      <div className="my-4 overflow-x-auto">
        <table className="w-full text-sm text-text-secondary border border-border-primary rounded-lg overflow-hidden">
          <thead className="bg-bg-tertiary border-b border-border-primary">
            <tr>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Method
              </th>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Return
              </th>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Description
              </th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-border-primary">
              <td className="px-4 py-2 font-mono text-accent">
                await ctx.body&lt;T&gt;()
              </td>
              <td className="px-4 py-2 font-mono">Promise&lt;T&gt;</td>
              <td className="px-4 py-2">
                Parse JSON body (cached after first call)
              </td>
            </tr>
            <tr className="border-b border-border-primary">
              <td className="px-4 py-2 font-mono text-accent">
                await ctx.formData()
              </td>
              <td className="px-4 py-2 font-mono">Promise&lt;FormData&gt;</td>
              <td className="px-4 py-2">Parse multipart/form-data (cached)</td>
            </tr>
          </tbody>
        </table>
      </div>

      <CodeBlock
        code={`// JSON body
app.post("/users", async (ctx) => {
  const { name, email } = await ctx.body();
  return ctx.json({ created: true }, 201);
});

// FormData (file uploads)
app.post("/upload", async (ctx) => {
  const form = await ctx.formData();
  const file = form.get("avatar");
  return ctx.json({ uploaded: true });
});`}
      />

      <Callout type="info">
        Both <code>ctx.body()</code> and <code>ctx.formData()</code> cache their
        result. You can call them multiple times without re-parsing.
      </Callout>

      {/* ──────────────── COOKIES ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Cookies
      </Heading>
      <div className="my-4 overflow-x-auto">
        <table className="w-full text-sm text-text-secondary border border-border-primary rounded-lg overflow-hidden">
          <thead className="bg-bg-tertiary border-b border-border-primary">
            <tr>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Method
              </th>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Return
              </th>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Description
              </th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-border-primary">
              <td className="px-4 py-2 font-mono text-accent">
                ctx.getCookie(name)
              </td>
              <td className="px-4 py-2 font-mono">string | undefined</td>
              <td className="px-4 py-2">Get a single cookie by name</td>
            </tr>
            <tr className="border-b border-border-primary">
              <td className="px-4 py-2 font-mono text-accent">
                ctx.getCookies()
              </td>
              <td className="px-4 py-2 font-mono">
                Record&lt;string, string&gt;
              </td>
              <td className="px-4 py-2">Get all cookies as a map</td>
            </tr>
          </tbody>
        </table>
      </div>

      <CodeBlock
        code={`app.get("/profile", (ctx) => {
  const token = ctx.getCookie("token");
  const all = ctx.getCookies();
  return ctx.json({ token, cookies: all });
});`}
      />

      {/* ──────────────── VALIDATED DATA ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Validated Data
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        After using <code>zValidator()</code>, access validated (and typed) data
        via <code>ctx.valid()</code>:
      </p>
      <CodeBlock
        code={`import { zValidator, z } from "@buntok/core/middlewares/validator";

const userSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
});

app.post("/users", zValidator("body", userSchema), (ctx) => {
  const data = ctx.valid("body"); // typed as { name: string; email: string }
  return ctx.json({ created: true, ...data });
});

app.get("/search", zValidator("query", searchSchema), (ctx) => {
  const { q } = ctx.valid("query"); // typed from schema
  return ctx.json({ results: [] });
});`}
      />

      <Callout type="warning">
        <code>ctx.valid()</code> throws if no <code>zValidator()</code> ran for
        that target. This fails loudly instead of returning{" "}
        <code>undefined</code>.
      </Callout>

      {/* ──────────────── FLEXIBLE RETURN ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Flexible Return (Elysia-style)
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Handlers may return primitives/objects directly — the framework
        auto-serializes via <code>toResponse()</code>. Both styles work
        side-by-side:
      </p>
      <div className="my-4 overflow-x-auto">
        <table className="w-full text-sm text-text-secondary border border-border-primary rounded-lg overflow-hidden">
          <thead className="bg-bg-tertiary border-b border-border-primary">
            <tr>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Return
              </th>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Serialized as
              </th>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Content-Type
              </th>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {[
              [
                "string",
                "new Response(string)",
                "text/plain; charset=utf-8",
                "200",
              ],
              [
                "number / boolean / bigint",
                "String(value)",
                "text/plain; charset=utf-8",
                "200",
              ],
              [
                "object / array",
                "Response.json(value)",
                "application/json",
                "200",
              ],
              ["null / undefined / void", "empty body", "—", "204"],
              [
                "Blob / ArrayBuffer / Uint8Array / ReadableStream",
                "new Response(value)",
                "from value",
                "200",
              ],
              ["Response", "passthrough", "as-is", "as-is"],
            ].map(([ret, ser, ct, status]) => (
              <tr
                key={ret}
                className="border-b border-border-primary/50 hover:bg-bg-tertiary/50 transition-colors"
              >
                <td className="px-4 py-2 font-mono text-accent">{ret}</td>
                <td className="px-4 py-2 font-mono text-text-secondary">
                  {ser}
                </td>
                <td className="px-4 py-2 font-mono text-text-secondary">
                  {ct}
                </td>
                <td className="px-4 py-2 font-mono text-text-secondary">
                  {status}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <CodeBlock
        code={`// All of these are valid handlers
app.get("/hello", () => "hello world");                    // text/plain
app.get("/json", () => ({ hello: "buntok" }));             // json
app.get("/num", () => 42);                                 // text/plain "42"
app.get("/users", () => [{ id: 1 }, { id: 2 }]);           // json array
app.get("/empty", () => null);                             // 204
app.get("/custom", () => new Response("hi", { status: 201 })); // passthrough

// Destructuring (ctx is an instance with params/query/store/ip/...)
app.get("/users/:id", ({ params }) => params);               // { id: "123" }
app.get("/users/:id", ({ params: { id } }) => id);          // "123"
app.get("/search", ({ query }) => query.q);                  // ?q=...
app.get("/profile", ({ store, request }) => store.user);`}
      />
      <Callout type="info">
        Type <code>HandlerReturn</code> (<code>src/app.ts:112</code>, exported
        from <code>@buntok/core</code>) covers all cases.{" "}
        <code>toResponse()</code> and <code>toResponseMaybeAsync()</code> are
        also exported from <code>@buntok/core</code> for custom wrapping.
      </Callout>

      {/* ──────────────── RESPONSE METHODS ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Response Methods
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
              ["ctx.json(data, status?)", "JSON response (default: 200)"],
              [
                "ctx.success(data?, message?, status?)",
                "Success envelope: { success, message, data }",
              ],
              [
                "ctx.paginate(data, total, page, limit, message?, status?)",
                "Offset-based pagination with meta",
              ],
              [
                "ctx.cursorPaginate(data, nextCursor, message?, status?)",
                "Cursor-based pagination (infinite scroll)",
              ],
              [
                "ctx.error(message, status?, details?)",
                "Error response: { success: false, message, details }",
              ],
              ["ctx.text(text, status?)", "Plain text response"],
              ["ctx.html(html, status?)", "HTML response"],
              [
                "ctx.redirect(url, status?)",
                "Redirect (301, 302, 303, 307, 308)",
              ],
              ["ctx.status(code)", "Empty response with status code"],
              [
                "ctx.htmlStream(generator, options?)",
                "Streaming HTML via async generator — yields chunks progressively",
              ],
              ["ctx.sse(handler, options?)", "Server-Sent Events stream"],
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

      <Heading
        level={3}
        className="text-xl font-semibold mt-6 mb-2 text-text-primary"
      >
        JSON Response
      </Heading>
      <CodeBlock
        code={`// Default 200
return ctx.json({ message: "Hello" });

// Custom status
return ctx.json({ created: true }, 201);`}
      />

      <Heading
        level={3}
        className="text-xl font-semibold mt-6 mb-2 text-text-primary"
      >
        Success Envelope
      </Heading>
      <CodeBlock
        code={`// { success: true, message: "Success", data: [...] }
return ctx.success(users);

// { success: true, message: "Created", data: {...} }, 201
return ctx.success(user, "Created", 201);`}
      />

      <Heading
        level={3}
        className="text-xl font-semibold mt-6 mb-2 text-text-primary"
      >
        Pagination
      </Heading>
      <CodeBlock
        code={`// Offset-based pagination
app.get("/users", async (ctx) => {
  const page = Number(ctx.query.page) || 1;
  const limit = Number(ctx.query.limit) || 10;
  const users = await db.user.findMany({ skip: (page - 1) * limit, take: limit });
  const total = await db.user.count();
  return ctx.paginate(users, total, page, limit);
});

// Response:
// {
//   success: true,
//   message: "Success",
//   data: [...],
//   meta: {
//     currentPage: 1,
//     perPage: 10,
//     total: 50,
//     lastPage: 5,
//     hasMore: true
//   }
// }

// Cursor-based pagination
return ctx.cursorPaginate(users, nextCursor);`}
      />

      <Heading
        level={3}
        className="text-xl font-semibold mt-6 mb-2 text-text-primary"
      >
        Error Response
      </Heading>
      <CodeBlock
        code={`// { success: false, message: "Validation failed", details: [...] }
return ctx.error("Validation failed", 422, errors);`}
      />

      <Heading
        level={3}
        className="text-xl font-semibold mt-6 mb-2 text-text-primary"
      >
        Redirect
      </Heading>
      <CodeBlock
        code={`// 302 redirect (default)
return ctx.redirect("/login");

// 301 permanent redirect
return ctx.redirect("/new-url", 301);`}
      />

      <Heading
        level={3}
        className="text-xl font-semibold mt-6 mb-2 text-text-primary"
      >
        Post-Response Hooks
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Register hooks that run after the response is sent — useful for logging,
        metrics, or response transformation:
      </p>
      <CodeBlock
        code={`app.get("/api", (ctx) => {
  ctx.onAfterResponse((res) => {
    console.log("Response status:", res.status);
    // Return modified response, or undefined to keep original
    return res;
  });

  return ctx.json({ data: "hello" });
});`}
      />

      {/* ──────────────── SERVER-SENT EVENTS ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Server-Sent Events
      </Heading>
      <CodeBlock
        code={`app.get("/events", (ctx) => {
  return ctx.sse((stream) => {
    stream.sendData("connected");
    stream.sendEvent("update", { count: 42 });
    stream.onClose(() => {
      console.log("Client disconnected");
    });
  });
});`}
      />

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
                "sendInitial",
                "boolean",
                "true",
                'Send initial "connected" event',
              ],
              [
                "initialEvent",
                "string",
                '"connected"',
                "Custom event name for initial",
              ],
              [
                "retry",
                "number",
                "undefined",
                "Client reconnection timeout (ms)",
              ],
            ].map(([opt, type, def, desc]) => (
              <tr
                key={opt}
                className="border-b border-border-primary/50 hover:bg-bg-tertiary/50 transition-colors"
              >
                <td className="px-4 py-2 font-mono text-accent">{opt}</td>
                <td className="px-4 py-2 font-mono text-text-secondary">
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

      {/* ──────────────── RAW REQUEST ACCESS ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Raw Request Access
      </Heading>
      <CodeBlock
        code={`app.get("/info", (ctx) => {
  // Headers
  const contentType = ctx.request.headers.get("Content-Type");
  const auth = ctx.request.headers.get("Authorization");

  // Method
  const method = ctx.request.method;

  // URL
  const url = ctx.request.url;

  return ctx.json({ method, url, contentType });
});`}
      />

      {/* ──────────────── TYPE GENERICS ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Type Generics
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        The <code>Context</code> class accepts two generic parameters for
        type-safe DI and params:
      </p>
      <CodeBlock
        code={`// Context<DI, Params>
// DI: type of the dependency injection container
// Params: type of route parameters (inferred from path)

app.get("/users/:id", (ctx) => {
  // ctx.params.id is typed as string
  // ctx.di is typed based on your DI setup
});`}
      />

      {/* ──────────────── FULL EXAMPLE ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Full Example
      </Heading>
      <CodeBlock
        code={`
import { z } from "@buntok/core/middlewares/validator";

const app = new App();

app.get("/", (ctx) => {
  return ctx.json({
    ip: ctx.ip,
    method: ctx.request.method,
    url: ctx.request.url,
  });
});

app.get("/search", zValidator("query", z.object({
  q: z.string(),
  page: z.coerce.number().default(1),
})), (ctx) => {
  const { q, page } = ctx.valid("query");
  return ctx.json({ query: q, page });
});

app.post("/users", zValidator("body", z.object({
  name: z.string().min(1),
  email: z.string().email(),
})), async (ctx) => {
  const data = ctx.valid("body");
  return ctx.success(data, "Created", 201);
});

app.get("/dashboard", (ctx) => {
  const token = ctx.getCookie("token");
  if (!token) return ctx.redirect("/login");
  return ctx.json({ user: ctx.user });
});

app.listen(1212);`}
      />

      {/* ──────────────── NEXT STEPS ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Next Steps
      </Heading>
      <ul className="my-3 ml-6 list-disc text-text-secondary space-y-1">
        <li>
          <a href="/docs/validation" className="text-accent hover:underline">
            Validation
          </a>{" "}
          - Validate and type request data
        </li>
        <li>
          <a href="/docs/routing" className="text-accent hover:underline">
            Routing
          </a>{" "}
          - Route parameters and query strings
        </li>
        <li>
          <a href="/docs/middleware" className="text-accent hover:underline">
            Middleware
          </a>{" "}
          - Access context in middleware
        </li>
        <li>
          <a href="/docs/sse" className="text-accent hover:underline">
            SSE
          </a>{" "}
          - Server-Sent Events
        </li>
      </ul>
    </div>
  );
}
