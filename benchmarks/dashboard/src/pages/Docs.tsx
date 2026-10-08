
import { useState, useEffect } from 'react';
import { CodeBlock } from '../components/CodeBlock';
import { Zap, ShieldAlert, Database, Layers } from 'lucide-react';

export function DocsPage({ isDark }: { isDark: boolean }) {
  const [activeSection, setActiveSection] = useState('quick-start');

  const groups: { label: string; items: { id: string; label: string }[] }[] = [
    {
      label: 'Core Concepts',
      items: [
        { id: 'philosophy', label: 'Architecture & Philosophy' },
      ],
    },
    {
      label: 'Getting Started',
      items: [
        { id: 'quick-start', label: 'Quick Start' },
        { id: 'initialization', label: 'Server Initialization' },
      ],
    },
    {
      label: 'Routing',
      items: [
        { id: 'controllers', label: 'Controllers & RouteContext' },
        { id: 'groups', label: 'Route Groups' },
        { id: 'context', label: 'Context Object' },
        { id: 'body-query', label: 'Body & Query Params' },
      ],
    },
    {
      label: 'Advanced',
      items: [
        { id: 'di', label: 'Dependency Injection' },
        { id: 'middlewares', label: 'Global Middlewares' },
        { id: 'built-in', label: 'Built-in Middlewares' },
        { id: 'websockets', label: 'WebSockets' },
        { id: 'sse', label: 'Server-Sent Events' },
        { id: 'advanced-methods', label: 'QUERY Method' },
      ],
    },
    {
      label: 'Utilities',
      items: [
        { id: 'static-files', label: 'Static Files & SPA' },
        { id: 'cookies', label: 'Cookie Helpers' },
        { id: 'uploads', label: 'File Uploads' },
        { id: 'health', label: 'Health Check' },
      ],
    },
    {
      label: 'Enterprise',
      items: [
        { id: 'enterprise', label: 'Cache & Queue' },
        { id: 'jwt-auth', label: 'JWT & Auth' },
        { id: 'env-validator', label: 'Env Validator' },
        { id: 'testing', label: 'Testing Client' },
        { id: 'mailer', label: 'Built-in Mailer' },
        { id: 'devtools', label: 'DevTools Dashboard' },
        { id: 'ai', label: 'AI & LLM Integration' },
        { id: 'cli', label: 'Code Generation' },
        { id: 'api-docs', label: 'OpenAPI / Swagger' },
      ],
    },
    {
      label: 'Examples',
      items: [
        { id: 'examples', label: 'Full CRUD API' },
        { id: 'error-handling', label: 'Error Handling' },
      ],
    },
  ];

  const allItems = groups.flatMap(g => g.items);

  useEffect(() => {
    const obs = new IntersectionObserver(
      entries => {
        entries.forEach(e => { if (e.isIntersecting) setActiveSection(e.target.id); });
      },
      { rootMargin: '-15% 0px -75% 0px' }
    );
    allItems.forEach(item => {
      const el = document.getElementById(item.id);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, []);

  const scrollTo = (id: string) => {
    setActiveSection(id);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="animate-fade-up flex flex-col md:flex-row gap-8 items-start pt-8">

      {/* Mobile select */}
      <div className="w-full md:hidden">
        <select
          value={activeSection}
          onChange={e => scrollTo(e.target.value)}
          className="w-full bg-bg-secondary border border-border-primary rounded-lg px-3 py-2 text-sm text-text-primary outline-none focus:border-border-hover"
        >
          {allItems.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}
        </select>
      </div>

      {/* Sidebar */}
      <aside className="hidden md:block w-52 shrink-0 sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto pr-2">
        <nav className="space-y-5">
          {groups.map(group => (
            <div key={group.label}>
              <p className="text-[10px] font-bold uppercase tracking-widest text-text-secondary mb-1.5 px-2">{group.label}</p>
              <ul className="space-y-0.5">
                {group.items.map(item => (
                  <li key={item.id}>
                    <button
                      onClick={() => scrollTo(item.id)}
                      className={`w-full text-left px-2 py-1.5 rounded-md text-sm transition-colors ${
                        activeSection === item.id
                          ? 'text-text-primary font-medium bg-bg-secondary border-l-2 border-[#f97316] pl-[7px]'
                          : 'text-text-secondary hover:text-text-primary hover:bg-bg-secondary'
                      }`}
                    >
                      {item.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </aside>

      {/* Content */}
      <div className="flex-1 min-w-0 max-w-3xl space-y-14 pb-16">
        <div className="pb-6 border-b border-border-primary">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Documentation</h1>
          <p className="text-text-secondary">
            Complete reference for Buntok - the decorator-first Bun framework.
          </p>
        </div>

        <DocSection id="philosophy" title="Architecture & Philosophy">
          <p className="text-text-secondary leading-relaxed mb-4">
            Buntok wasn't built to just be another Express clone. We wanted the <strong>structural elegance of NestJS</strong> with the <strong>raw, unadulterated speed of the Bun runtime</strong>.
          </p>

          <h3 className="text-lg font-semibold mt-8 mb-3">Ahead-of-Time (AOT) Routing</h3>
          <p className="text-text-secondary leading-relaxed mb-4">
            <strong>What makes Buntok faster?</strong> Most frameworks resolve routes dynamically on every request. They iterate through arrays of regexes to find a match, which costs valuable milliseconds. 
            Buntok uses an <strong>AOT compiler</strong>. At startup, it reads all your decorators, paths, and middlewares, then flattens them into a single, highly optimized mapping function passed directly into <code>Bun.serve()</code>. The routing overhead is effectively zero.
          </p>

          <h3 className="text-lg font-semibold mt-8 mb-3">Enterprise-Ready by Default</h3>
          <p className="text-text-secondary leading-relaxed mb-4">
            Modern applications require more than just a router. Buntok includes zero-dependency enterprise features built directly into the core framework, including:
          </p>
          <ul className="list-disc list-inside text-text-secondary space-y-2 mb-6 ml-2">
            <li><strong>Telescope DevTools:</strong> Real-time network and error monitoring dashboard.</li>
            <li><strong>WebCrypto JWT:</strong> Native, high-performance JWT authentication.</li>
            <li><strong>Built-in Mailer:</strong> Zero-dependency HTTP email clients for Resend, SendGrid, and Mailgun.</li>
            <li><strong>Zod Validation:</strong> Compile-time safety for environment variables and request payloads.</li>
          </ul>

          <h3 className="text-lg font-semibold mt-8 mb-3">Generative AI Protocol Support</h3>
          <p className="text-text-secondary leading-relaxed mb-4">
            Buntok natively supports the <strong>Vercel AI SDK Data Stream Protocol</strong> out of the box. By using our built-in <code>streamAI()</code> utility, you can effortlessly pipe OpenAI or Anthropic responses directly into React, Vue, or Svelte frontends without dealing with raw SSE buffers or ReadableStreams.
          </p>
        </DocSection>

        <DocSection id="quick-start" title="Quick Start">
          <p className="text-text-secondary leading-relaxed mb-4">Scaffold a Buntok project in seconds with the official CLI. It sets up TypeScript, Biome linting, and all standard configs.</p>
          <CodeBlock language="bash" isDark={isDark}>{`bun create buntok@latest my-app
cd my-app && bun install
bun run dev`}</CodeBlock>
          <p className="text-text-secondary leading-relaxed mt-4">Dev server launches on <code>http://localhost:1212</code> with hot-reload enabled.</p>
        </DocSection>

        <DocSection id="initialization" title="Server Initialization">
          <p className="text-text-secondary leading-relaxed mb-4">Buntok listens on port <code>1212</code> by default or reads from <code>PORT</code> env.</p>
          <CodeBlock language="typescript" isDark={isDark}>{`import { Buntok } from "buntok";

const app = new Buntok();

app.listen(1212, () => {
  console.log("🚀 Server running on http://localhost:1212");
});`}</CodeBlock>
        </DocSection>

        <DocSection id="controllers" title="Controllers & ZodCtx">
          <p className="text-text-secondary leading-relaxed mb-4">
            Controllers group route handlers using ES classes and decorators. At startup, Buntok's AOT compiler
            resolves all decorators into an optimized switch-case router - zero per-request overhead.
          </p>
          <h3 className="font-semibold text-sm uppercase tracking-widest text-text-secondary mt-6 mb-3">Strongly-Typed Decorators with ZodCtx</h3>
          <p className="text-text-secondary leading-relaxed mb-4">
            TypeScript decorators cannot mutate method parameter types at the type level. <code>ZodCtx</code> solves this DX issue - it gives you automatic type inference for path params, request body, and query validations by simply passing your Zod schemas into an object!
          </p>
          <CodeBlock language="typescript" isDark={isDark}>{`import { Controller, Get, Post, ZodCtx, Use, zValidator } from 'buntok';
import { z } from 'zod';

const userSchema = z.object({ name: z.string() });
const paginationSchema = z.object({ page: z.number() });

@Controller('/users')
export class UserController {

  // 1. Path Params Inference
  @Get('/:id/posts/:postId')
  getById(ctx: ZodCtx<{}, "/:id/posts/:postId">) {
    const { id, postId } = ctx.params; // fully typed strings ✓
    return ctx.json({ id, postId });
  }

  // 2. Body Inference from zValidator
  @Post('/')
  @Use(zValidator("body", userSchema))
  create(ctx: ZodCtx<{ body: typeof userSchema }>) {
    const body = ctx.valid("body"); // { name: string } ✓
    return ctx.json({ created: true, data: body }, 201);
  }
  
  // 3. Combined Validation
  @Get('/')
  @Use(zValidator("query", paginationSchema))
  getAll(ctx: ZodCtx<{ query: typeof paginationSchema }>) {
    const query = ctx.valid("query"); // { page: number } ✓
    return ctx.json({ page: query.page });
  }
}`}</CodeBlock>
          <h3 className="font-semibold text-sm uppercase tracking-widest text-text-secondary mt-6 mb-3">Registering Controllers</h3>
          <CodeBlock language="typescript" isDark={isDark}>{`import { Buntok } from 'buntok';
import { UserController } from './controllers/user';

const app = new Buntok();
app.registerController(new UserController());
app.listen(1212);`}</CodeBlock>
        </DocSection>

        <DocSection id="groups" title="Route Groups">
          <p className="text-text-secondary leading-relaxed mb-4">Create modular route groups with shared prefixes and nested middlewares.</p>
          <CodeBlock language="typescript" isDark={isDark}>{`const api = app.group("/api");
api.use(loggerMiddleware); // applied to all /api/* routes

const v1 = api.group("/v1");
v1.get("/users", handler); // GET /api/v1/users

const admin = api.group("/admin");
admin.use(adminAuthMiddleware);
admin.get("/dashboard", dashboardHandler); // GET /api/admin/dashboard`}</CodeBlock>
        </DocSection>

        <DocSection id="context" title="The Context Object">
          <p className="text-text-secondary leading-relaxed mb-4">Every handler receives a lightweight <code>Context</code> - a zero-overhead wrapper around the native Bun <code>Request</code>.</p>

          <h3 className="font-semibold text-sm uppercase tracking-widest text-text-secondary mt-6 mb-3">ctx.request & ctx.params</h3>
          <CodeBlock language="typescript" isDark={isDark}>{`app.get("/users/:id", (ctx) => {
  const ua = ctx.request.headers.get("User-Agent");
  const { id } = ctx.params; // string
  return ctx.json({ id, ua });
});`}</CodeBlock>

          <h3 className="font-semibold text-sm uppercase tracking-widest text-text-secondary mt-6 mb-3">ctx.store - inter-middleware state</h3>
          <CodeBlock language="typescript" isDark={isDark}>{`app.use(async (ctx, next) => {
  ctx.store.user = await db.getUserFromToken(ctx.getCookie("token"));
  return next();
});

app.get("/profile", (ctx) => {
  return ctx.json({ user: ctx.store.user });
});`}</CodeBlock>

          <h3 className="font-semibold text-sm uppercase tracking-widest text-text-secondary mt-6 mb-3">Response helpers</h3>
          <CodeBlock language="typescript" isDark={isDark}>{`return ctx.json({ error: "Invalid input" }, 400); // JSON
return ctx.text("Hello, World!");                    // Plain text
return ctx.status(204);                              // No content`}</CodeBlock>
        </DocSection>

        <DocSection id="body-query" title="Body & Query Parsing">
          <h3 className="font-semibold text-sm uppercase tracking-widest text-text-secondary mt-0 mb-3">Query Params</h3>
          <p className="text-text-secondary leading-relaxed mb-4">Parsed automatically into <code>ctx.query</code>. All values are strings - convert manually if needed.</p>
          <CodeBlock language="typescript" isDark={isDark}>{`// GET /search?q=buntok&limit=10
app.get('/search', (ctx) => {
  const { q, limit } = ctx.query;
  return ctx.json({ q, limit: Number(limit) });
});`}</CodeBlock>

          <h3 className="font-semibold text-sm uppercase tracking-widest text-text-secondary mt-6 mb-3">JSON Body</h3>
          <p className="text-text-secondary leading-relaxed mb-4"><code>ctx.body&lt;T&gt;()</code> parses JSON and throws a 400 if malformed.</p>
          <CodeBlock language="typescript" isDark={isDark}>{`@Post('/create')
async create(ctx: RouteContext<"/", { name: string; email: string }>) {
  const body = await ctx.body(); // { name: string; email: string }
  return ctx.json({ success: true, data: body });
}`}</CodeBlock>
        </DocSection>

        <DocSection id="di" title="Dependency Injection">
          <p className="text-text-secondary leading-relaxed mb-4">Buntok provides two DI approaches: lightweight <code>app.set()</code> for simple cases, and a full IoC Container with decorator-based injection for enterprise apps.</p>
          
          <h3 className="font-semibold text-sm uppercase tracking-widest text-text-secondary mt-6 mb-3">Approach 1: app.set() (Lightweight)</h3>
          <CodeBlock language="typescript" isDark={isDark}>{`type Container = {
  db: Database;
  logger: Logger;
};

const app = new Buntok<Container>();
app.set("db", new Database());
app.set("logger", new Logger());

// ctx.di is fully typed!
app.get("/users", async (ctx) => {
  const users = await ctx.di.db.findMany();
  ctx.di.logger.info("Fetched users");
  return ctx.json({ data: users });
});`}</CodeBlock>

          <h3 className="font-semibold text-sm uppercase tracking-widest text-text-secondary mt-6 mb-3">Approach 2: IoC Container (Recommended)</h3>
          <p className="text-text-secondary leading-relaxed mb-4">Full decorator-based DI inspired by NestJS. Services are resolved at boot time - zero per-request overhead.</p>
          <CodeBlock language="typescript" isDark={isDark}>{`import { Buntok, Container, Injectable, Inject, Controller, Get } from "buntok";

@Injectable()
class UserRepository {
  findAll() { return [{ id: 1, name: "Budi" }]; }
}

@Injectable()
class UserService {
  @Inject(UserRepository) private repo!: UserRepository;
  getAll() { return this.repo.findAll(); }
}

@Controller("/users")
@Injectable()
class UserController {
  @Inject(UserService) private service!: UserService;

  @Get("/")
  getAll(ctx: Context) {
    return ctx.success(this.service.getAll());
  }
}

const container = new Container();
container.registerClass(UserRepository);
container.registerClass(UserService);
container.registerClass(UserController);

const app = new Buntok();
app.setContainer(container);
app.registerController(UserController);
app.listen(3000);`}</CodeBlock>

          <h3 className="font-semibold text-sm uppercase tracking-widest text-text-secondary mt-6 mb-3">Provider Syntax</h3>
          <CodeBlock language="typescript" isDark={isDark}>{`container.registerClass(UserService);
container.register("config", { useValue: { port: 3000 } });
container.register("factory", { useFactory: (c) => new Logger(c.get("config")) });`}</CodeBlock>
        </DocSection>

        <DocSection id="middlewares" title="Global Middlewares">
          <p className="text-text-secondary leading-relaxed mb-4">Asynchronous onion-style middleware using <code>next()</code>. Must return the response.</p>
          <CodeBlock language="typescript" isDark={isDark}>{`app.use(async (ctx, next) => {
  const start = performance.now();
  const response = await next();
  const ms = (performance.now() - start).toFixed(2);
  console.log(\`[\${ctx.req.method}] \${ctx.req.url} - \${ms}ms\`);
  return response;
});`}</CodeBlock>
        </DocSection>

        <DocSection id="built-in" title="Built-in Middlewares">
          <p className="text-text-secondary leading-relaxed mb-4">Production-ready middlewares included out of the box.</p>

          <div className="grid sm:grid-cols-2 gap-3 mb-6">
            {[
              { color: 'text-[#f97316]', icon: <Zap className="w-4 h-4"/>, name: 'CORS', desc: 'Customizable origins, headers, and credentials support.', import: 'buntok/middlewares/cors' },
              { color: 'text-red-500', icon: <ShieldAlert className="w-4 h-4"/>, name: 'zValidator', desc: 'Schema validation with Zod, Valibot, or Yup.', import: 'buntok' },
              { color: 'text-yellow-500', icon: <Database className="w-4 h-4"/>, name: 'Rate Limiter', desc: 'Sliding-window rate limiting with auto retry-after headers.', import: 'buntok/middlewares/rate-limiter' },
              { color: 'text-blue-500', icon: <Layers className="w-4 h-4"/>, name: 'Request ID', desc: 'Auto-attach unique UUIDs for distributed tracing.', import: 'buntok/middlewares/request-id' },
            ].map(mw => (
              <div key={mw.name} className="border border-border-primary rounded-lg p-4 bg-bg-secondary">
                <div className={`flex items-center gap-2 font-semibold text-sm mb-1.5 ${mw.color}`}>
                  {mw.icon} {mw.name}
                </div>
                <p className="text-xs text-text-secondary mb-2">{mw.desc}</p>
                <code className="text-[10px] text-blue-400">import from "{mw.import}"</code>
              </div>
            ))}
          </div>

          <h3 className="font-semibold text-sm uppercase tracking-widest text-text-secondary mt-6 mb-3">Validator - Functional vs Decorator</h3>
          <p className="text-text-secondary leading-relaxed mb-4"><code>zValidator</code> works the same way in both routing styles.</p>
          <CodeBlock language="typescript" isDark={isDark}>{`import { zValidator, Controller, Post, Use, RouteContext } from "buntok";
import { z } from "zod";

const UserSchema = z.object({ name: z.string(), email: z.string().email() });
type UserDTO = z.infer<typeof UserSchema>;

// ── Functional ──────────────────────────────────────────
app.post("/users", zValidator("body", UserSchema), async (ctx) => {
  const data = ctx.valid("body"); // UserDTO ✓
  return ctx.json({ created: true, data });
});

// ── Class-Based ──────────────────────────────────────────
@Controller("/api/users")
export class UserController {
  @Post("/")
  @Use(zValidator("body", UserSchema))
  async create(ctx: RouteContext<"/", UserDTO>) {
    const data = ctx.valid("body"); // UserDTO ✓
    return ctx.json({ created: true, data });
  }

  @Get("/")
  @Use(zValidator("query", z.object({ search: z.string() })))
  // Generics order: <Path, Body, DI, Query, Params>
  async search(ctx: RouteContext<"/", unknown, any, { search: string }>) {
    const query = ctx.valid("query"); // { search: string } ✓
    return ctx.json(query);
  }
}

// ── File Validation (multipart/form-data) ───────────────
const uploadSchema = z.object({
  title: z.string(),
  file: z.file().max(5 * 1024 * 1024) // natively validate files!
});

app.post(
  "/upload",
  zValidator("body", uploadSchema, { contentType: "multipart/form-data" }),
  (ctx) => {
    const { title, file } = ctx.valid("body"); // file is a standard Web File object
    return ctx.json({ title, filename: file.name, size: file.size });
  }
);`}</CodeBlock>

          <h3 className="font-semibold text-sm uppercase tracking-widest text-text-secondary mt-6 mb-3">CORS & Rate Limiter</h3>
          <CodeBlock language="typescript" isDark={isDark}>{`import { cors } from "buntok/middlewares/cors";
import { rateLimiter } from "buntok/middlewares/rate-limiter";
import { requestId } from "buntok/middlewares/request-id";

app.use(cors({ origin: ["https://example.com"], credentials: true }));
app.use(rateLimiter({ max: 100, windowMs: 60_000 })); // 100 req/min
app.use(requestId()); // attaches x-request-id header`}</CodeBlock>
        </DocSection>

        <DocSection id="websockets" title="WebSockets">
          <p className="text-text-secondary leading-relaxed mb-4">Buntok exposes Bun's native WebSocket server - RFC 6455, no wrappers, maximum throughput.</p>
          <CodeBlock language="typescript" isDark={isDark}>{`app.ws("/ws", {
  open: (ws) => {
    ws.subscribe(\`room:\${ws.data.roomId}\`);
    ws.send(JSON.stringify({ event: "connected" }));
  },
  message: (ws, msg) => {
    const { event, data } = JSON.parse(String(msg));
    if (event === "chat") {
      app.server?.publish(\`room:\${ws.data.roomId}\`, JSON.stringify({ event, data }));
    }
  },
  close: (ws) => {
    ws.unsubscribe(\`room:\${ws.data.roomId}\`);
  }
});`}</CodeBlock>
        </DocSection>

        <DocSection id="sse" title="Server-Sent Events (SSE)">
          <p className="text-text-secondary leading-relaxed mb-4">Real-time one-directional streaming from server to client, without WebSocket complexity.</p>
          <CodeBlock language="typescript" isDark={isDark}>{`import { SSE } from "buntok";

app.get("/events/live", (ctx) => {
  const sse = new SSE(ctx.request, {
    sendInitial: true,
    initialEvent: "connected",
    retry: 5000, // auto-reconnect in 5s if disconnected
  });

  // Send various event types
  sse.sendEvent("message", { text: "Hello from Buntok!" });
  sse.sendData("plain-string-data");
  sse.sendWithId(1, { id: 1, status: "processing" });

  return sse.connect(); // hold the stream open
});`}</CodeBlock>
        </DocSection>

        <DocSection id="advanced-methods" title="QUERY Method (RFC 10008)">
          <p className="text-text-secondary leading-relaxed mb-4">
            Need complex search filters but don't want to abuse <code>POST</code> for read-only operations?
            Buntok natively supports the upcoming <strong>QUERY</strong> HTTP method - idempotent, cacheable,
            and accepts a JSON body.
          </p>
          <CodeBlock language="typescript" isDark={isDark}>{`app.query("/orders", async (ctx) => {
  const filters = await ctx.body<{
    select: string[];
    where: Record<string, unknown>;
    limit: number;
    sort: { field: string; order: "asc" | "desc" }[];
  }>();

  const results = await db.query(filters);
  return ctx.json({ data: results });
});`}</CodeBlock>
        </DocSection>

        <DocSection id="static-files" title="Static Files & SPA">
          <p className="text-text-secondary leading-relaxed mb-4">Serve static assets and Single Page Applications with zero configuration.</p>
          <CodeBlock language="typescript" isDark={isDark}>{`// Serve ./public directory at /assets
app.static("/assets", "./public");

// Custom favicon
app.icon("./assets/favicon.ico");

// SPA catch-all - serve index.html for all unmatched routes
app.get("*", () => new Response(Bun.file("./public/index.html")));`}</CodeBlock>
        </DocSection>

        <DocSection id="cookies" title="Cookie Helpers">
          <p className="text-text-secondary leading-relaxed mb-4">First-class cookie support - read, set, and delete without external packages.</p>
          <CodeBlock language="typescript" isDark={isDark}>{`import { setCookie, deleteCookie } from "buntok/helpers/cookie";

// Set a secure, httpOnly cookie on login
app.post("/login", async (ctx) => {
  const response = ctx.json({ success: true });
  return setCookie(response, "auth_token", "jwt_here", {
    httpOnly: true, secure: true, sameSite: "lax", maxAge: 86400,
  });
});

// Read a single cookie
app.get("/me", (ctx) => {
  const token = ctx.getCookie("auth_token");
  return ctx.json({ token });
});

// Read all cookies as a Record<string, string>
const all = ctx.getCookies();

// Clear on logout
app.post("/logout", (ctx) => {
  return deleteCookie(ctx.json({ success: true }), "auth_token");
});`}</CodeBlock>
        </DocSection>

        <DocSection id="health" title="Health Check">
          <p className="text-text-secondary leading-relaxed mb-4">Kubernetes/Docker-ready health checks with multi-dependency validation.</p>
          <CodeBlock language="typescript" isDark={isDark}>{`import { healthCheck, createDatabaseCheck, createHealthCheck } from "buntok/middlewares/health-check";

// Simple ping
healthCheck(app, { path: "/health" });

// With DB + Redis checks
healthCheck(app, {
  path: "/api/health",
  check: createHealthCheck([
    { name: "database", check: async () => { await db.query("SELECT 1"); return true; } },
    { name: "redis",    check: async () => { await redis.ping(); return true; } },
  ]),
});
// → { status: "healthy", checks: { database: { status: "up", duration: 2 }, ... } }`}</CodeBlock>
        </DocSection>

        <DocSection id="uploads" title="File Uploads">
          <p className="text-text-secondary leading-relaxed mb-4">
            Parse and validate <code className="text-pink-400 bg-pink-500/10 px-1.5 py-0.5 rounded text-sm">multipart/form-data</code> uploads securely using built-in Storage Drivers. Validates file size and MIME-types out of the box.
          </p>
          <CodeBlock language="typescript" isDark={isDark}>{`import { uploader, LocalDiskStorage, parseUploads } from "buntok";

// Method 1: Automatic parsing via Middleware
app.post("/avatar", 
  uploader({
    storage: new LocalDiskStorage("./uploads"),
    maxFileSize: 5 * 1024 * 1024, // 5MB
    allowedMimeTypes: ["image/jpeg", "image/png"]
  }),
  (ctx) => {
    // Access uploaded files directly from store
    const file = ctx.store.files[0];
    return ctx.json({ success: true, file: file.filename });
  }
);

// Method 2: Manual parsing for maximum flexibility
app.post("/documents", async (ctx) => {
  const result = await parseUploads(ctx, {
    storage: new LocalDiskStorage("./storage/docs"),
    maxFileSize: 10 * 1024 * 1024
  });

  if (!result.success) return ctx.error(result.error);

  // Standard text inputs are separated into fields
  const { title } = result.fields;
  return ctx.json({ title, files: result.files });
});`}</CodeBlock>

          <h3 className="font-semibold text-sm uppercase tracking-widest text-text-secondary mt-6 mb-3">Custom Driver (Cloudinary, AWS S3)</h3>
          <p className="text-text-secondary leading-relaxed mb-4">
            Since Buntok uses a driver pattern, you can write 1 function to stream files directly to cloud providers.
          </p>
          <CodeBlock language="typescript" isDark={isDark}>{`import { StorageDriver, UploadedFile, uploader } from "buntok";
import { v2 as cloudinary } from "cloudinary";

export class CloudinaryStorage implements StorageDriver {
  async handleFile(file: File, filename: string): Promise<UploadedFile> {
    const buffer = Buffer.from(await file.arrayBuffer());
    return new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream({ public_id: filename }, (err, result) => {
        if (err) return reject(err);
        resolve({
          originalName: file.name,
          filename: result!.public_id,
          size: file.size,
          type: file.type,
          path: result!.secure_url, // Directly mapped to cloud URL!
        });
      }).end(buffer);
    });
  }
}

// Just drop it into the uploader!
app.post("/avatar", uploader({ storage: new CloudinaryStorage() }), (ctx) => {
  return ctx.json({ imageUrl: ctx.store.files[0].path });
});`}</CodeBlock>
        </DocSection>

        <DocSection id="enterprise" title="Enterprise Features">
          <p className="text-text-secondary leading-relaxed mb-4">
            Caching, background queues, and cron jobs - all built around a swappable <strong>Driver Pattern</strong>.
            Use the in-memory drivers locally, swap to Redis for production with a single line change.
          </p>

          <h3 className="font-semibold text-sm uppercase tracking-widest text-[#f97316] mt-0 mb-3">Cache: Atomic & Pattern Deletion</h3>
          <CodeBlock language="typescript" isDark={isDark}>{`import { Cache, MemoryCacheDriver } from "buntok";

const cache = new Cache(new MemoryCacheDriver());

// getOrSet: fetch from DB if missing, then cache for 5 mins
const user = await cache.getOrSet("user:1", () => db.findUser(1), 300);

// Atomic counters (great for rate limiting / views)
const views = await cache.increment("post:1:views");

// Pattern deletion (e.g., clear all sessions)
await cache.deletePattern("session:*");`}</CodeBlock>

          <h3 className="font-semibold text-sm uppercase tracking-widest text-[#f97316] mt-6 mb-3">Queue: Retries, Delays & Priorities</h3>
          <CodeBlock language="typescript" isDark={isDark}>{`import { Queue } from "buntok";

// Initialize with advanced options
const emailQueue = new Queue("email", { 
  maxRetries: 3, 
  retryDelay: 1000, 
  backoff: "exponential" 
});

emailQueue.process(async (job) => {
  console.log(\`[Attempt \${job.attempt + 1}]\`, job.data);
});

// Delay job by 5 seconds, and process before priority 0 jobs
await emailQueue.add(
  { to: "admin@example.com" }, 
  { delay: 5000, priority: 10 }
);`}</CodeBlock>

          <h3 className="font-semibold text-sm uppercase tracking-widest text-[#f97316] mt-6 mb-3">OOP + DI + Cron Integration</h3>
          <p className="text-text-secondary leading-relaxed mb-4">
            The full power of Buntok - inject Queue and Cache into a Controller via DI,
            and declare background jobs with <code>@CronJob</code> right inside the class. <code>this</code> context is safely bound!
          </p>
          <CodeBlock language="typescript" isDark={isDark}>{`import { Buntok, Controller, Post, RouteContext, CronJob } from "buntok";
import { cache, emailQueue } from "./infrastructure";

type Container = {
  cache: typeof cache;
  emailQueue: typeof emailQueue;
};

@Controller("/notifications")
export class NotificationController {

  @Post("/send")
  async send(ctx: RouteContext<"/send", { email: string }, Container>) {
    const { email } = await ctx.body();
    await ctx.di.emailQueue.add({ to: email, subject: "Welcome to Buntok!" });
    return ctx.json({ queued: true });
  }

  // Runs every day at midnight
  @CronJob("0 0 * * *")
  async dailyCleanup() {
    await cache.deletePattern("tmp:*");
    console.log("Cache cleaned.");
  }
}

const app = new Buntok<Container>();
app.set("cache", cache);
app.set("emailQueue", emailQueue);
app.registerController(new NotificationController());
app.listen(1212);`}</CodeBlock>

          <h3 className="font-semibold text-sm uppercase tracking-widest text-red-500 mt-6 mb-3">Auth Guards</h3>
          <CodeBlock language="typescript" isDark={isDark}>{`import { Controller, Get, UseGuard, type GuardFn } from "buntok";

const IsAdmin: GuardFn = async (ctx) => {
  const user = ctx.store.user;
  return user?.role === "admin"; // false → 403 Forbidden
};

@Controller("/admin")
export class AdminController {
  @Get("/dashboard")
  @UseGuard(IsAdmin)
  dashboard(ctx) {
    return ctx.json({ message: "Welcome, Admin." });
  }
}`}</CodeBlock>
        </DocSection>

        <DocSection id="jwt-auth" title="JWT & Auth Manager">
          <p className="text-text-secondary leading-relaxed mb-4">
            Buntok features a zero-dependency, incredibly fast JWT engine built directly on the <strong>WebCrypto API</strong>. 
            Because it uses native C++ bindings under the hood in Bun (instead of JavaScript polyfills like <code>jsonwebtoken</code>), 
            signing and verifying tokens is blazingly fast. It completely eliminates the need for bulky external dependencies while providing military-grade HMAC SHA-256 security.
          </p>
          <p className="text-text-secondary leading-relaxed mb-4">
            The module consists of two main parts: the <code>JwtService</code> for manual token generation/verification, and the <code>requireAuth</code> middleware for protecting your endpoints globally or on a per-route basis.
          </p>
          <h3 className="font-semibold text-sm uppercase tracking-widest text-[#f97316] mt-6 mb-3">1. Generating Tokens</h3>
          <p className="text-text-secondary leading-relaxed mb-4">
            You can instantiate the <code>JwtService</code> anywhere in your app. Pass your secret key to the constructor. The <code>sign</code> method accepts a payload and an optional expiration time in seconds.
          </p>
          <CodeBlock language="typescript" isDark={isDark}>{`import { JwtService } from "buntok";

// It is highly recommended to load this from your .env file
const jwt = new JwtService(process.env.JWT_SECRET || "SUPER_SECRET");

app.post("/login", async (ctx) => {
  // 1. Verify user credentials against the database...
  
  // 2. Sign a JWT valid for 24 hours (86400 seconds)
  const token = await jwt.sign({ 
    userId: 1, 
    role: "admin",
    email: "admin@buntok.dev"
  }, 86400);

  return ctx.success({ token });
});`}</CodeBlock>

          <h3 className="font-semibold text-sm uppercase tracking-widest text-[#f97316] mt-6 mb-3">2. Protecting Routes & Accessing Payload</h3>
          <p className="text-text-secondary leading-relaxed mb-4">
            To protect a route, drop the <code>requireAuth(secret)</code> middleware into your route handler array. Buntok will automatically intercept the request, look for a standard <code>Authorization: Bearer &lt;token&gt;</code> header, and verify it.
            If the token is missing, malformed, or expired, the request is immediately rejected with a <code>401 Unauthorized</code> response. If valid, the decoded payload is securely attached to <code>ctx.user</code>.
          </p>
          <CodeBlock language="typescript" isDark={isDark}>{`import { requireAuth } from "buntok";

// Protect a single route
app.get("/profile", [
  requireAuth("SUPER_SECRET"), 
  async (ctx) => {
    // ctx.user is guaranteed to be populated here!
    return ctx.success({ 
      message: "Welcome back!",
      userId: ctx.user.userId,
      role: ctx.user.role 
    }); 
  }
]);

// Or protect an entire group of routes:
const protectedApi = app.group("/dashboard");
protectedApi.use(requireAuth("SUPER_SECRET"));
protectedApi.get("/stats", (ctx) => ctx.json({ data: "Top Secret" }));`}</CodeBlock>
        </DocSection>

        <DocSection id="env-validator" title="T3 Env Validator">
          <p className="text-text-secondary leading-relaxed mb-4">
            One of the most common causes of production outages is a missing or misspelled environment variable in the <code>.env</code> file. Buntok solves this at the framework level with a built-in <strong>Zod-powered Environment Validator</strong> (inspired by the famous T3 Stack).
          </p>
          <p className="text-text-secondary leading-relaxed mb-4">
            By validating your environment variables immediately at boot time, you guarantee that your application will <em>never</em> start in a broken state. It also provides 100% Type-Safety across your entire codebase, meaning no more <code>process.env.FOO as string</code> hacks.
          </p>
          <CodeBlock language="typescript" isDark={isDark}>{`import { z } from "zod";
import { Buntok } from "buntok";

const app = new Buntok();

// 1. Define your strict schema
export const env = app.validateEnv({
  DATABASE_URL: z.string().url("Must be a valid Postgres/MySQL URL"),
  PORT: z.coerce.number().default(1212),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  SMTP_KEY: z.string().min(10, "SMTP key is too short"),
});

// 2. Use it anywhere with absolute type confidence!
console.log(env.DATABASE_URL); // TypeScript knows this is definitely a string
console.log(env.PORT);         // TypeScript knows this is definitely a number

app.listen(env.PORT);`}</CodeBlock>
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mt-6">
            <h4 className="text-red-500 font-semibold mb-2">What happens if it fails?</h4>
            <p className="text-text-secondary text-sm">
              If a variable is missing (e.g., you forgot <code>DATABASE_URL</code>), Buntok completely aborts the boot process (<code>process.exit(1)</code>) and prints a beautiful, color-coded error stack in the terminal showing exactly which variables failed validation and why.
            </p>
          </div>
        </DocSection>

        <DocSection id="testing" title="Built-in Testing Client">
          <p className="text-text-secondary leading-relaxed mb-4">
            Testing HTTP endpoints usually requires spinning up a mock server, assigning a random open port, and dealing with flaky network requests using bulky libraries like <code>SuperTest</code>. Buntok eliminates this entirely.
          </p>
          <p className="text-text-secondary leading-relaxed mb-4">
            Buntok apps expose a native <code>app.request()</code> method. This method takes a standard Web <code>Request</code> and routes it directly through Buntok's internal memory pipeline. <strong>No ports are opened, and no network sockets are used.</strong> This makes your unit tests and integration tests unbelievably fast and completely isolated.
          </p>
          <CodeBlock language="typescript" isDark={isDark}>{`import { describe, it, expect } from "bun:test";
import { app } from "../src/app"; // Import your configured Buntok app

describe("Authentication API", () => {
  it("should reject invalid login attempts", async () => {
    
    // Call the endpoint entirely in-memory!
    const res = await app.request("/api/login", {
      method: "POST",
      body: JSON.stringify({ email: "invalid-user@test.com" }),
      headers: { "Content-Type": "application/json" }
    });
    
    // Assert against standard Web Response objects
    expect(res.status).toBe(400);
    
    const data = await res.json();
    expect(data.error).toBe("Invalid credentials");
  });

  it("should return a 404 for unknown routes", async () => {
    const res = await app.request("/does-not-exist");
    expect(res.status).toBe(404);
  });
});`}</CodeBlock>
        </DocSection>

        <DocSection id="mailer" title="Built-in Mailer">
          <p className="text-text-secondary leading-relaxed mb-4">
            Sending transactional emails (Welcome Emails, OTPs, Password Resets) is a core requirement for almost every modern web application. Traditionally, this requires installing bloated packages like <code>nodemailer</code> and dealing with legacy SMTP configurations.
          </p>
          <p className="text-text-secondary leading-relaxed mb-4">
            Buntok provides a native, zero-dependency <code>Mailer</code> module designed around modern REST APIs. Out of the box, it supports <strong>Resend</strong>, <strong>SendGrid</strong>, and <strong>Mailgun</strong> using Bun's ultra-fast native HTTP <code>fetch</code> client to dispatch emails without holding up your event loop. 
            It also supports classic <strong>SMTP</strong> (via dynamic import of <code>nodemailer</code>).
          </p>
          
          <h3 className="font-semibold text-sm uppercase tracking-widest text-[#f97316] mt-6 mb-3">1. HTTP Providers (Zero-Dependency)</h3>
          <CodeBlock language="typescript" isDark={isDark}>{`import { Mailer } from "buntok";

// 1. Resend
const resendMailer = new Mailer({ provider: "resend", apiKey: "re_123456" });

// 2. SendGrid
const sgMailer = new Mailer({ provider: "sendgrid", apiKey: "SG.123456" });

// 3. Mailgun (requires domain)
const mgMailer = new Mailer({ provider: "mailgun", apiKey: "key-123", domain: "sandbox.mailgun.org" });

// Sending works identically for all providers:
app.post("/register", async (ctx) => {
  // Fire and forget! (runs in background)
  resendMailer.send({
    from: "Buntok <hello@buntok.dev>",
    to: "user@example.com",
    subject: "Welcome to Buntok!",
    html: "<h1>The fastest framework</h1>"
  });
  return ctx.success("Registered!");
});`}</CodeBlock>

          <h3 className="font-semibold text-sm uppercase tracking-widest text-[#f97316] mt-6 mb-3">2. Classic SMTP Integration</h3>
          <p className="text-text-secondary leading-relaxed mb-4">
            If you need to connect to Gmail, Mailtrap, or a custom mail server, you can use the <code>smtp</code> provider. Note: Buntok dynamically imports <code>nodemailer</code> under the hood to preserve its zero-dependency philosophy. You must run <code>bun add nodemailer</code> in your project first.
          </p>
          <CodeBlock language="typescript" isDark={isDark}>{`const smtpMailer = new Mailer({
  provider: "smtp",
  smtp: {
    host: "smtp.mailtrap.io",
    port: 2525,
    auth: {
      user: "username",
      pass: "password"
    }
  }
});

await smtpMailer.send({
  from: "admin@server.local",
  to: ["user1@gmail.com", "user2@gmail.com"],
  subject: "Server Alert",
  text: "Disk space is running low."
});`}</CodeBlock>
        </DocSection>

        <DocSection id="devtools" title="Buntok Telescope (DevTools)">
          <p className="text-text-secondary leading-relaxed mb-4">
            Debugging backend applications usually involves staring at a chaotic terminal window trying to decipher JSON strings. To solve this, Buntok ships with an integrated Developer Tools GUI-affectionately known as <strong>Telescope</strong>.
          </p>
          <p className="text-text-secondary leading-relaxed mb-4">
            When enabled, Buntok intercepts all incoming HTTP requests, API Route maps, and even terminal <code>console.log()</code> events, streaming them via WebSockets directly to a beautiful, real-time web dashboard running alongside your app.
          </p>
          
          <h3 className="font-semibold text-sm uppercase tracking-widest text-[#f97316] mt-6 mb-3">Enabling DevTools</h3>
          <p className="text-text-secondary leading-relaxed mb-4">
            Simply call <code>app.enableDevTools()</code> before starting your server. Ensure this is only enabled in development environments to prevent performance degradation and memory leaks in production.
          </p>
          <CodeBlock language="typescript" isDark={isDark}>{`import { Buntok } from "buntok";

const app = new Buntok();

// Enable the real-time DevTools UI
if (process.env.NODE_ENV !== "production") {
  app.enableDevTools();
}

app.listen(1212);
// 🚀 Visit: http://localhost:1212/__buntok/ to open the GUI
`}</CodeBlock>
          <ul className="list-disc pl-5 mt-4 text-text-secondary space-y-2">
            <li><strong>Request Inspector:</strong> View HTTP Method, URL, Body, Headers, and Response times in real-time.</li>
            <li><strong>API Explorer:</strong> Instantly view a generated tree of all registered endpoints and controllers in your application.</li>
            <li><strong>Console Interceptor:</strong> See <code>console.log</code>, <code>warn</code>, and <code>error</code> outputs directly in the browser UI, perfectly color-coded.</li>
          </ul>
        </DocSection>

        <DocSection id="ai" title="AI & LLM Integration">
          <p className="text-text-secondary leading-relaxed mb-4">
            Buntok natively supports the <strong>Vercel AI SDK Data Stream Protocol</strong>. Even though Vercel AI is famous in the Next.js ecosystem, it is actually <strong>framework-agnostic</strong>! This means Buntok is the perfect backend for Generative UI or chatbots regardless of whether your frontend is built in React (Vite), Vue, Svelte, Solid, or Next.js.
          </p>
          <p className="text-text-secondary leading-relaxed mb-4">
            Instead of dealing with raw <code>ReadableStreams</code> and parsing SSE formats manually, Buntok provides high-level utilities that let you focus entirely on your AI logic.
          </p>

          <h3 className="font-semibold text-sm uppercase tracking-widest text-[#f97316] mt-0 mb-3">AI Streaming & Guardrails</h3>
          <p className="text-text-secondary leading-relaxed mb-4">
            When building AI applications, securing your AI from "prompt injection attacks" is critical. You must ensure the user cannot override your AI's core instructions. Buntok provides <code>injectSystemPrompt()</code> which safely scrubs rogue system prompts sent by the user and enforces your official system instruction at the very top.
          </p>
          <p className="text-text-secondary leading-relaxed mb-4">
            Combined with <code>streamAI()</code>, Buntok automatically transforms OpenAI's raw output into the strict <code>0:"text"</code> chunk format required by Vercel AI SDK's frontend hooks (like <code>useChat</code> in <code>@ai-sdk/react</code> or <code>@ai-sdk/vue</code>).
          </p>
          <CodeBlock language="typescript" isDark={isDark}>{`import { Router, streamAI, injectSystemPrompt } from "buntok";
import { OpenAI } from "openai";

const app = new Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.post("/api/chat", async (ctx) => {
  const { messages } = await ctx.body();
  
  // Guardrails: Forcefully inject our system prompt and prevent prompt-injection attacks
  const securedMessages = injectSystemPrompt(messages, \`
    You are BuntokAI, a specialized customer support assistant.
    1. Only answer questions related to our store operations.
    2. If the user asks about unrelated topics, politely decline.
    3. Keep responses concise, friendly, and under 3 sentences.
  \`);
  
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.2, // Lower temperature for more focused, deterministic answers
    stream: true,
    messages: securedMessages,
  });

  // Automatically parses OpenAI chunks and streams Vercel AI Protocol (0:"text")
  return streamAI(ctx, response); 
});`}</CodeBlock>

          <h3 className="font-semibold text-sm uppercase tracking-widest text-[#f97316] mt-8 mb-3">Semantic AI Cache (Cost Saver)</h3>
          <p className="text-text-secondary leading-relaxed mb-4">
            LLM API calls (like OpenAI or Anthropic) are expensive and slow. If hundreds of users ask the exact same common question, you shouldn't pay for the AI to generate the same answer repeatedly.
          </p>
          <p className="text-text-secondary leading-relaxed mb-4">
            Buntok provides an <code>AICache</code> utility that hooks into your existing <strong>Cache Driver</strong>. It hashes the conversation history and serves instant cached responses for identical queries, saving you 100% of the API cost and returning results in milliseconds.
          </p>
          <CodeBlock language="typescript" isDark={isDark}>{`import { AICache, MemoryCacheDriver, streamAI } from "buntok";

// Initialize AI Cache using Buntok's standard CacheDriver architecture
const aiCache = new AICache(new MemoryCacheDriver());

app.post("/api/chat", async (ctx) => {
  const { messages } = await ctx.body();
  
  // 1. Instant Cache Hit: Check if we've seen this exact conversation history recently
  const cached = await aiCache.get(messages);
  if (cached) {
    console.log("⚡ AI Cache Hit! Returning instant response and saving OpenAI tokens.");
    
    // Serve the cached text instantly, perfectly formatted for Vercel AI SDK
    return new Response(\`0:\${JSON.stringify(cached)}\\n\`, {
      headers: { "x-vercel-ai-data-stream": "v1" }
    });
  }

  // 2. Cache Miss: Fetch fresh response from OpenAI
  const response = await openai.chat.completions.create({ 
    model: "gpt-4o-mini", 
    stream: true, 
    messages 
  });

  // 3. Stream back to user, and cache the complete response automatically when done
  return streamAI(ctx, response, {
    onCompletion: async (fullText) => {
      // Store the generated response in the cache for 1 hour (3600 seconds)
      await aiCache.set(messages, fullText, 3600); 
    }
  });
});`}</CodeBlock>
        </DocSection>

        <DocSection id="cli" title="Code Generation (CLI)">
          <p className="text-text-secondary leading-relaxed mb-4">
            The Buntok CLI generates a full layered architecture (Controller → Service → Repository → Drizzle Schema).
            By default all layers are wired together, but each flag makes the CLI generate only what you need - no forced coupling.
          </p>
          <CodeBlock language="bash" isDark={isDark}>{`# 1. All layers (Controller + Service + Repo + Schema)
bunx buntok create user

# 2. Controller only (no Service import generated)
bunx buntok create auth --controller

# 3. Controller + Service, no Repo
bunx buntok create payment --controller --service

# 4. Repo + Schema only
bunx buntok create audit --repo --schema`}</CodeBlock>
        </DocSection>

        <DocSection id="api-docs" title="OpenAPI / Swagger Docs">
          <p className="text-text-secondary leading-relaxed mb-4">
            Buntok can auto-generate a full <strong>OpenAPI 3.0</strong> spec and serve a <strong>Scalar UI</strong> dashboard
            by scanning your routes and Zod schemas.
          </p>
          <CodeBlock language="bash" isDark={isDark}>{`# Scan routes & output swagger.json + docs.html to /public
bunx buntok make:docs`}</CodeBlock>
          <CodeBlock language="typescript" isDark={isDark}>{`// src/index.ts - export is required for the CLI to scan it
export const app = new Buntok();
app.static("/", "./public"); // serve the generated docs
app.listen(1212);
// → visit http://localhost:1212/docs.html`}</CodeBlock>
        </DocSection>

        <DocSection id="examples" title="Full Example: CRUD API">
          <p className="text-text-secondary leading-relaxed mb-4">A complete RESTful CRUD API in a single file.</p>
          <CodeBlock language="typescript" isDark={isDark}>{`import { Buntok } from "buntok";

const app = new Buntok();
const users: Array<{ id: string; name: string; email: string }> = [];

app.get("/users",       (ctx) => ctx.json({ data: users }));

app.get("/users/:id",   (ctx) => {
  const user = users.find(u => u.id === ctx.params.id);
  if (!user) return ctx.json({ error: "Not found" }, 404);
  return ctx.json({ data: user });
});

app.post("/users", async (ctx) => {
  const body = await ctx.body<{ name: string; email: string }>();
  const user = { id: crypto.randomUUID(), ...body };
  users.push(user);
  return ctx.json({ data: user }, 201);
});

app.put("/users/:id", async (ctx) => {
  const idx = users.findIndex(u => u.id === ctx.params.id);
  if (idx === -1) return ctx.json({ error: "Not found" }, 404);
  users[idx] = { ...users[idx], ...await ctx.body<{ name: string; email: string }>() };
  return ctx.json({ data: users[idx] });
});

app.delete("/users/:id", (ctx) => {
  const idx = users.findIndex(u => u.id === ctx.params.id);
  if (idx === -1) return ctx.json({ error: "Not found" }, 404);
  users.splice(idx, 1);
  return ctx.status(204);
});

app.listen(1212, () => console.log("Running on :1212"));`}</CodeBlock>
        </DocSection>

        <DocSection id="error-handling" title="Error Handling">
          <p className="text-text-secondary leading-relaxed mb-4">Buntok catches all unhandled errors and missing routes, letting you define consistent JSON responses.</p>
          <CodeBlock language="typescript" isDark={isDark}>{`// Global exception handler
app.onError((err, ctx) => {
  console.error("Exception:", err.message);
  return ctx.json({ success: false, message: "Internal Server Error" }, 500);
});

// 404 not-found handler
app.notFound((ctx) => {
  return ctx.json({
    success: false,
    error: \`Route \${new URL(ctx.request.url).pathname} not found\`,
  }, 404);
});`}</CodeBlock>
        </DocSection>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════ */
export function DocSection({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-20">
      <h2 className="text-2xl font-bold tracking-tight text-text-primary mb-6 flex items-center gap-3">
        <span className="w-1 h-6 bg-[#f97316] rounded-full shrink-0" />
        {title}
      </h2>
      <div>{children}</div>
    </section>
  );
}
