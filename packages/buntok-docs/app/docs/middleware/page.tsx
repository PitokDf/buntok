import { Heading } from "@/components/ui/Heading";
import { CodeBlock } from "@/components/ui/CodeBlock";
import { Callout } from "@/components/ui/Callout";

export const metadata = {
  title: "Middleware",
  description: "Write and compose middleware for CORS, rate limiting, compression, and more.",
};


export default function MiddlewarePage() {
  return (
    <div>
      <Heading
        level={1}
        className="text-4xl font-bold mt-8 mb-4 text-text-primary"
      >
        Middleware
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Middleware functions intercept requests before they reach your route
        handler. They can modify the context, short-circuit with a response, or
        pass control to the next handler.
      </p>

      {/* ──────────────── MIDDLEWARE TYPE ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Middleware Signature
      </Heading>
      <CodeBlock
        code={`type Middleware = (
  ctx: Context,
  next: () => Promise<void | Response>
) => Promise<void | Response>;`}
      />

      <div className="my-4 overflow-x-auto">
        <table className="w-full text-sm text-text-secondary border border-border-primary rounded-lg overflow-hidden">
          <thead className="bg-bg-tertiary border-b border-border-primary">
            <tr>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Parameter
              </th>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Description
              </th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-border-primary">
              <td className="px-4 py-2 font-mono text-accent">ctx</td>
              <td className="px-4 py-2">The request context object</td>
            </tr>
            <tr className="border-b border-border-primary">
              <td className="px-4 py-2 font-mono text-accent">next</td>
              <td className="px-4 py-2">
                Call <code>await next()</code> to continue to the next middleware/handler.
                Omit to short-circuit.
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <Heading
        level={3}
        className="text-xl font-semibold mt-6 mb-2 text-text-primary"
      >
        Basic Middleware
      </Heading>
      <CodeBlock
        code={`const logger = async (ctx, next) => {
  const start = Date.now();
  const response = await next();
  const duration = Date.now() - start;
  console.log(\`\${ctx.request.method} \${ctx.request.url} \${duration}ms\`);
  return response;
};`}
      />

      <Heading
        level={3}
        className="text-xl font-semibold mt-6 mb-2 text-text-primary"
      >
        Short-circuit (Block Request)
      </Heading>
      <CodeBlock
        code={`const authCheck = async (ctx, next) => {
  const token = ctx.request.headers.get("Authorization");
  if (!token) {
    return ctx.json({ error: "Unauthorized" }, 401);
    // Do NOT call next() - request stops here
  }
  return next(); // Token exists, continue
};`}
      />

      <Callout type="warning">
        Return a <code>Response</code> to short-circuit. Call{" "}
        <code>return next()</code> to continue to the next handler.
      </Callout>

      {/* ──────────────── GLOBAL MIDDLEWARE ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Global Middleware
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Runs on <strong>every request</strong>. Register before routes:
      </p>
      <CodeBlock
        code={`const app = new App();

app.use(logger);
app.cors({ origin: "*" });  // Use app.cors() for CORS
app.use(rateLimit);

// All routes inherit these middleware
app.get("/", handler);`}
      />

      {/* ──────────────── ROUTE-LEVEL MIDDLEWARE ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Route-level Middleware
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Pass middleware directly to route methods. They run in order:
      </p>
      <CodeBlock
        code={`app.get("/admin", authMiddleware, adminMiddleware, handler);

// Execution order: authMiddleware → adminMiddleware → handler`}
      />

      <Heading
        level={3}
        className="text-xl font-semibold mt-6 mb-2 text-text-primary"
      >
        Functional API
      </Heading>
      <CodeBlock
        code={`app.get("/users",
  requireAuth(secret),
  requireRole("admin"),
  async (ctx) => {
    return ctx.json({ users: [] });
  }
);`}
      />

      <Heading
        level={3}
        className="text-xl font-semibold mt-6 mb-2 text-text-primary"
      >
        Decorator API
      </Heading>
      <CodeBlock
        code={`@Controller("/users")
class UserController {
  @Get("/")
  @Use(requireAuth(secret))    // ← evaluated 2nd, applied 3rd → runs 1st
  @Use(requireRole("admin"))   // ← evaluated 3rd, applied 2nd → runs 2nd
  async list(ctx: Context) {
    return ctx.json({ users: [] });
  }
}
// Evaluate: Controller → requireAuth → requireRole → Get (top-to-bottom)
// Apply:    Get → requireRole → requireAuth → Controller (bottom-to-top)`}
      />

      <Callout type="info">
        <strong>Stage 3 ordering:</strong> factories evaluated top-to-bottom but
        applied bottom-to-top (via <code>unshift</code>). Place{" "}
        <code>@Use(requireAuth)</code> <strong>ABOVE</strong>{" "}
        <code>@Use(requireRole)</code> so auth runs first.
      </Callout>

      {/* ──────────────── GROUP MIDDLEWARE ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Group Middleware
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Apply middleware to a group of routes with a shared prefix:
      </p>
      <CodeBlock
        code={`const api = app.group("/api");
api.use(cors);
api.use(rateLimit);

api.get("/users", handler);      // /api/users
api.get("/posts", handler);      // /api/posts

// With requireAuth on group
const admin = app.group("/admin");
admin.use(requireAuth(secret));

admin.get("/dashboard", handler); // /admin/dashboard
admin.get("/settings", handler);  // /admin/settings`}
      />

      <Callout type="info">
        <strong>Execution order:</strong> Global middleware (<code>app.use</code>)
        runs first, then Group middleware (<code>group.use</code>), then
        Route-level middleware (left-to-right in handler args). If any middleware
        throws an error, it is caught by the framework and passed to the error
        handler.
      </Callout>

      {/* ──────────────── MIDDLEWARE WITH DATA ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Middleware with Parameters
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Use a factory function to create middleware with configuration:
      </p>
      <CodeBlock
        code={`// Factory function
function rateLimit(maxRequests: number, windowMs: number) {
  const hits = new Map<string, number[]>();

  return async (ctx, next) => {
    const ip = ctx.ip;
    const now = Date.now();
    const timestamps = hits.get(ip) || [];
    const recent = timestamps.filter(t => t > now - windowMs);

    if (recent.length >= maxRequests) {
      return ctx.json({ error: "Too many requests" }, 429);
    }

    recent.push(now);
    hits.set(ip, recent);
    await next();
  };
}

// Usage
app.get("/api", rateLimit(100, 60_000), handler);`}
      />

      {/* ──────────────── VALIDATION MIDDLEWARE ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        zValidator Middleware
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Validate request data with Zod schemas:
      </p>
      <CodeBlock
        code={`import { zValidator, z } from "@buntok/core/middlewares/validator";

const userSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
});

app.post("/users",
  zValidator("body", userSchema),
  async (ctx) => {
    const data = ctx.valid("body"); // typed
    return ctx.json({ created: true });
  }
);`}
      />

      {/* ──────────────── AFTER-RESPONSE HOOKS ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        After-Response Hooks
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Modify the response after the handler completes:
      </p>
      <CodeBlock
        code={`app.get("/data", async (ctx) => {
  ctx.onAfterResponse((res) => {
    // Add header to every response
    const newHeaders = new Headers(res.headers);
    newHeaders.set("X-Custom-Header", "value");
    return new Response(res.body, {
      status: res.status,
      headers: newHeaders,
    });
  });

  return ctx.json({ data: "value" });
});`}
      />

      {/* ──────────────── BUILT-IN MIDDLEWARE ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Built-in Middleware
      </Heading>
      <div className="my-4 overflow-x-auto">
        <table className="w-full text-sm text-text-secondary border border-border-primary rounded-lg overflow-hidden">
          <thead className="bg-bg-tertiary border-b border-border-primary">
            <tr>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Middleware
              </th>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Purpose
              </th>
            </tr>
          </thead>
          <tbody>
            {[
              ["requireAuth(secret)", "JWT authentication"],
              ["requireRole(...)", "Role-based access (OR logic)"],
              ["requirePermission(...)", "Permission-based access (AND logic)"],
              ["zValidator(target, schema)", "Request validation with Zod"],
              ["cors(options)", "Cross-Origin Resource Sharing"],
              ["rateLimiter(options)", "Fixed-window rate limiting"],
              ["slidingWindowRateLimiter(options)", "Sliding-window rate limiting (more accurate)"],
              ["compress(options)", "Brotli/gzip response compression"],
              ["bodySizeLimit(options)", "Limit request body size"],
              ["requestId(options)", "X-Request-Id generation"],
              ["responseTime(options)", "X-Response-Time header"],
              ["helmet(options)", "Security headers (HSTS, CSP, etc.)"],
              ["timeout(ms, message?)", "Request timeout (throws TimeoutError)"],
              ["auditLog(options)", "Request logging"],
            ].map(([middleware, purpose]) => (
              <tr
                key={middleware}
                className="border-b border-border-primary/50 hover:bg-bg-tertiary/50 transition-colors"
              >
                <td className="px-4 py-2 font-mono text-accent">
                  {middleware}
                </td>
                <td className="px-4 py-2">{purpose}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <CodeBlock
        code={`import { requireAuth } from "@buntok/core/auth";
import {
  requireRole, requirePermission,
  rateLimiter, slidingWindowRateLimiter,
  compress, bodySizeLimit, requestId, responseTime, helmet, timeout, auditLog,
} from "@buntok/core/middlewares";
import { cors } from "@buntok/core";
import { zValidator } from "@buntok/core/middlewares/validator";`}
      />

      {/* ──────────────── CORS ──────────────── */}
      <Heading
        level={3}
        className="text-xl font-semibold mt-6 mb-2 text-text-primary"
      >
        cors()
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        CORS with flexible <code>origin</code> handling (string, array, or function). Handles preflight <code>OPTIONS</code> automatically.
      </p>
      <CodeBlock
        code={`// Recommended — ensures CORS headers on ALL responses including errors
app.cors({
  origin: ["http://localhost:3000", "https://myapp.com"],
  // origin: (origin) => origin.endsWith(".myapp.com"),
  methods: ["GET", "POST", "PUT", "DELETE"],
  headers: ["Content-Type", "Authorization"],
  credentials: true,
});

// Defaults: methods GET,POST,PUT,DELETE,PATCH,OPTIONS
// headers Content-Type,Authorization,x-api-key
// origin string|string[]|((origin)=>boolean)
`}
      />
      <Callout type="info">
        <code>origin</code> can be a <code>string</code>, <code>string[]</code>, or <code>(origin: string) =&gt; boolean</code> for dynamic checks. Use <code>app.cors()</code> instead of <code>app.use(cors(...))</code> to ensure CORS headers are applied to error responses (4xx, 5xx) as well.
      </Callout>

      {/* ──────────────── REQUEST ID ──────────────── */}
      <Heading
        level={3}
        className="text-xl font-semibold mt-6 mb-2 text-text-primary"
      >
        requestId()
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Adds <code>X-Request-Id</code> (uuid) to every request. Also available <code>shortId</code> (8-char) and <code>uuid</code> helpers.
      </p>
      <CodeBlock
        code={`import { requestId, shortId, uuid } from "@buntok/core/middlewares";

app.use(requestId());
// RequestIdOptions { header="x-request-id", generator=uuid, store=true, storeKey="requestId" }

app.use(requestId({ header: "x-correlation-id", generator: shortId }));
app.use(requestId({ header: "x-request-id", generator: () => crypto.randomUUID() }));`}
      />

      {/* ──────────────── RESPONSE TIME ──────────────── */}
      <Heading
        level={3}
        className="text-xl font-semibold mt-6 mb-2 text-text-primary"
      >
        responseTime()
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Adds <code>X-Response-Time</code> header with request duration.
      </p>
      <CodeBlock
        code={`import { responseTime } from "@buntok/core/middlewares";

app.use(responseTime());
// ResponseTimeOptions { header="x-response-time", format="ms"|"s", store, storeKey="responseTime" }

app.use(responseTime({ header: "x-response-time", format: "s" }));`}
      />

      {/* ──────────────── HELMET ──────────────── */}
      <Heading
        level={3}
        className="text-xl font-semibold mt-6 mb-2 text-text-primary"
      >
        helmet()
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Security headers (X-Content-Type-Options, X-Frame-Options, XSS-Protection, Referrer-Policy, HSTS, DNS-Prefetch, Permissions-Policy).
      </p>
      <CodeBlock
        code={`import { helmet } from "@buntok/core/middlewares";

app.use(helmet());
// HelmetOptions { contentTypeOptions, frameOptions, xssProtection, referrerPolicy, hsts, dnsPrefetch, permissionsPolicy, additionalHeaders }

app.use(helmet({
  hsts: { maxAge: 31536000, includeSubDomains: true },
  frameOptions: "DENY",
}));`}
      />

      {/* ──────────────── TIMEOUT ──────────────── */}
      <Heading
        level={3}
        className="text-xl font-semibold mt-6 mb-2 text-text-primary"
      >
        timeout()
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Aborts handler if it exceeds <code>ms</code>. Throws <code>TimeoutError &#123; timeoutMs &#125;</code> caught by <code>app.onError</code>.
      </p>
      <CodeBlock
        code={`import { timeout, TimeoutError } from "@buntok/core/middlewares";

app.get("/slow", timeout(5000), async (ctx) => {
  await longOperation();
  return ctx.json({ ok: true });
});

app.get("/slow2", timeout(5000, "Custom timeout message"), handler);

// Custom error handling
app.onError((err, ctx) => {
  if (err instanceof TimeoutError) {
    return ctx.json({ error: "Timeout", timeoutMs: err.timeoutMs }, 408);
  }
  return ctx.json({ error: err.message }, 500);
});`}
      />

      {/* ──────────────── COMPRESS ──────────────── */}
      <Heading
        level={3}
        className="text-xl font-semibold mt-6 mb-2 text-text-primary"
      >
        compress()
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Response compression using Brotli or gzip, negotiated from{" "}
        <code>Accept-Encoding</code>. Only compresses responses above a size
        threshold to avoid wasting CPU on small payloads.
      </p>
      <CodeBlock
        code={`// Defaults: threshold=1024, brotliLevel=4
app.use(compress());

// Custom options
app.use(compress({
  threshold: 512,        // Compress responses > 512 bytes
  brotliLevel: 11,       // Max compression (slower)
  types: ["text/", "application/json", "image/svg+xml"],
}));`}
      />

      <div className="my-4 overflow-x-auto">
        <table className="w-full text-sm text-text-secondary border border-border-primary rounded-lg overflow-hidden">
          <thead className="bg-bg-tertiary border-b border-border-primary">
            <tr>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Option
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
              ["threshold", "1024", "Min response size (bytes) to compress"],
              ["brotliLevel", "4", "Brotli compression level (1-11)"],
              [
                'types',
                '["text/", "application/json", ...]',
                "Content-Type prefixes eligible for compression",
              ],
            ].map(([opt, def, desc]) => (
              <tr
                key={opt}
                className="border-b border-border-primary/50 hover:bg-bg-tertiary/50 transition-colors"
              >
                <td className="px-4 py-2 font-mono text-accent">{opt}</td>
                <td className="px-4 py-2 font-mono text-text-secondary">{def}</td>
                <td className="px-4 py-2">{desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ──────────────── BODY SIZE LIMIT ──────────────── */}
      <Heading
        level={3}
        className="text-xl font-semibold mt-6 mb-2 text-text-primary"
      >
        bodySizeLimit()
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Limits the maximum request body size. Returns 413 (Payload Too Large)
        when exceeded. Useful for preventing abuse and protecting server
        resources.
      </p>
      <CodeBlock
        code={`// Default: 10MB limit
app.use(bodySizeLimit());

// Custom limit (5MB)
app.use(bodySizeLimit({ maxSize: 5 * 1024 * 1024 }));

// Custom error message and status code
app.use(bodySizeLimit({
  maxSize: 1024 * 1024, // 1MB
  message: "File too large",
  statusCode: 413,
}));`}
      />

      <div className="my-4 overflow-x-auto">
        <table className="w-full text-sm text-text-secondary border border-border-primary rounded-lg overflow-hidden">
          <thead className="bg-bg-tertiary border-b border-border-primary">
            <tr>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Option
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
              ["maxSize", "10485760 (10MB)", "Max body size in bytes"],
              ["message", '"Payload Too Large"', "Custom error message"],
              ["statusCode", "413", "HTTP status code for rejection"],
            ].map(([opt, def, desc]) => (
              <tr
                key={opt}
                className="border-b border-border-primary/50 hover:bg-bg-tertiary/50 transition-colors"
              >
                <td className="px-4 py-2 font-mono text-accent">{opt}</td>
                <td className="px-4 py-2 font-mono text-text-secondary">{def}</td>
                <td className="px-4 py-2">{desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ──────────────── RATE LIMITERS ──────────────── */}
      <Heading
        level={3}
        className="text-xl font-semibold mt-6 mb-2 text-text-primary"
      >
        Rate Limiters
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Two built-in rate limiters: <code>rateLimiter</code> (fixed window, lower
        memory) and <code>slidingWindowRateLimiter</code> (more accurate, higher
        memory).
      </p>
      <CodeBlock
        code={`// Fixed window - 100 requests per minute
app.use(rateLimiter({ max: 100, windowMs: 60000 }));

// Sliding window - more accurate for burst traffic
app.use(slidingWindowRateLimiter({ max: 100, windowMs: 60000 }));

// Custom key & skip & headers
app.use(rateLimiter({
  max: 100,
  windowMs: 60000,
  message: "Too many requests",
  statusCode: 429,
  headers: true,
  skip: (ctx) => ctx.request.headers.get("x-api-key") === "internal",
  keyGenerator: (ctx) => ctx.ip, // default ctx.ip
}));`}
      />

      <div className="my-4 overflow-x-auto">
        <table className="w-full text-sm text-text-secondary border border-border-primary rounded-lg overflow-hidden">
          <thead className="bg-bg-tertiary border-b border-border-primary">
            <tr>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Option
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
              ["max", "100", "Max requests per window"],
              ["windowMs", "60000", "Window duration in ms"],
              ["message", '"Too many requests..."', "Response message"],
              ["statusCode", "429", "HTTP status code"],
              ["headers", "true", "Add RateLimit-* headers"],
              ["keyGenerator", "(ctx)=>ctx.ip", "Key for bucket (default ctx.ip)"],
              ["skip", "-", "Function (ctx)=>boolean to skip"],
              ["store", "in-memory Map", "Custom RateLimitStore"],
            ].map(([opt, def, desc]) => (
              <tr
                key={opt}
                className="border-b border-border-primary/50 hover:bg-bg-tertiary/50 transition-colors"
              >
                <td className="px-4 py-2 font-mono text-accent">{opt}</td>
                <td className="px-4 py-2 font-mono text-text-secondary">{def}</td>
                <td className="px-4 py-2">{desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ──────────────── FULL EXAMPLE ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Full Example
      </Heading>
      <CodeBlock
        code={`import { z } from "@buntok/core/middlewares/validator";

const app = new App();
const secret = process.env.JWT_SECRET!;

// Global middleware
app.cors();  // Use app.cors() for CORS
app.use(rateLimiter({ max: 100, windowMs: 60_000 }));

// Public route
app.get("/", (ctx) => {
  return ctx.json({ message: "Public" });
});

// Protected route
app.get("/profile",
  requireAuth(secret),
  async (ctx) => {
    return ctx.json({ user: ctx.user });
  }
);

// Admin-only route
app.get("/admin",
  requireAuth(secret),
  requireRole("admin"),
  async (ctx) => {
    return ctx.json({ admin: true });
  }
);

// Validated route
app.post("/users",
  zValidator("body", z.object({
    name: z.string().min(1),
    email: z.string().email(),
  })),
  async (ctx) => {
    const data = ctx.valid("body");
    return ctx.success(data, "Created", 201);
  }
);

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
          <a href="/docs/auth" className="text-accent hover:underline">
            Authentication
          </a>{" "}
          - JWT authentication middleware
        </li>
        <li>
          <a href="/docs/rbac" className="text-accent hover:underline">
            RBAC
          </a>{" "}
          - Role-based access control
        </li>
        <li>
          <a href="/docs/validation" className="text-accent hover:underline">
            Validation
          </a>{" "}
          - Request data validation
        </li>
      </ul>
    </div>
  );
}
