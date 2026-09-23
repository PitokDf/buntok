import { Heading } from "@/components/ui/Heading";
import { CodeBlock } from "@/components/ui/CodeBlock";
import { Callout } from "@/components/ui/Callout";

export const metadata = {
  title: "Decorators",
  description: "Use decorators for route handling, validation, guards, and middleware in Buntok.",
};


export default function DecoratorsPage() {
  return (
    <div>
      <Heading
        level={1}
        className="text-4xl font-bold mt-8 mb-4 text-text-primary"
      >
        Decorators
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Buntok uses Stage 3 TC39 decorators - the standard decorators natively
        supported by Bun and TypeScript 5+ without the{" "}
        <code>experimentalDecorators</code> flag.
      </p>

      <Callout type="info">
        Decorators execute once at class-definition time (bootstrap), not per
        request. This means zero runtime overhead - the router produces the same{" "}
        <code>registerRoute()</code> calls as manual{" "}
        <code>app.get()</code>/<code>app.post()</code> registrations.
      </Callout>

      {/* ──────────────── CONTROLLER DECORATOR ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        @Controller
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Marks a class as a controller and sets a route prefix. Must be the{" "}
        <strong>outermost (topmost)</strong> decorator on the class.
      </p>
      <CodeBlock
        code={`@Controller("/users")
class UserController {
  // All routes here will be prefixed with /users
}`}
      />

      <div className="my-4 overflow-x-auto">
        <table className="w-full text-sm text-text-secondary border border-border-primary rounded-lg overflow-hidden">
          <thead className="bg-bg-tertiary border-b border-border-primary">
            <tr>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Parameter
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
            <tr className="border-b border-border-primary">
              <td className="px-4 py-2 font-mono text-accent">prefix</td>
              <td className="px-4 py-2 font-mono">string</td>
              <td className="px-4 py-2">
                Route prefix (default: <code>""</code>)
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <Callout type="warning">
        <code>@Controller</code> must be the topmost decorator. Stage 3 (TC39)
        decorators are evaluated top-to-bottom but applied bottom-to-top, so{" "}
        <code>@Controller</code> (topmost, evaluated first) is applied last and
        captures all method routes already registered by <code>@Get</code>,{" "}
        <code>@Post</code>, etc.
      </Callout>

      {/* ──────────────── ROUTE DECORATORS ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Route Decorators
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Decorate class methods to register them as route handlers. Each
        decorator takes a path string as its first argument.
      </p>
      <CodeBlock
        code={`import type { Context } from "@buntok/core";

@Controller("/users")
class UserController {
  @Get("/")
  list(ctx: Context) { /* GET /users */ }

  @Get("/:id")
  detail(ctx: Context) { /* GET /users/:id */ }

  @Post("/")
  create(ctx: Context) { /* POST /users */ }

  @Put("/:id")
  update(ctx: Context) { /* PUT /users/:id */ }

  @Patch("/:id")
  patch(ctx: Context) { /* PATCH /users/:id */ }

  @Delete("/:id")
  remove(ctx: Context) { /* DELETE /users/:id */ }

  @Options("/info")
  options(ctx: Context) { /* OPTIONS /users/info */ }

  @Head("/check")
  check(ctx: Context) { /* HEAD /users/check */ }

  @All("/health")
  health(ctx: Context) { /* All methods on /users/health */ }
}`}
      />

      <div className="my-4 overflow-x-auto">
        <table className="w-full text-sm text-text-secondary border border-border-primary rounded-lg overflow-hidden">
          <thead className="bg-bg-tertiary border-b border-border-primary">
            <tr>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Decorator
              </th>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                HTTP Method
              </th>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Notes
              </th>
            </tr>
          </thead>
          <tbody>
            {[
              ["@Get(path?)", "GET", "Retrieve resources"],
              ["@Post(path?)", "POST", "Create resources"],
              ["@Put(path?)", "PUT", "Replace resources"],
              ["@Patch(path?)", "PATCH", "Partial update"],
              ["@Delete(path?)", "DELETE", "Remove resources"],
              ["@Options(path?)", "OPTIONS", "CORS preflight"],
              ["@Head(path?)", "HEAD", "Headers only"],
              ["@All(path?)", "All standard", "Matches all methods"],
              ["@Query(path?)", "QUERY", "Bun-specific: GET with body"],
            ].map(([decorator, method, notes]) => (
              <tr
                key={decorator}
                className="border-b border-border-primary/50 hover:bg-bg-tertiary/50 transition-colors"
              >
                <td className="px-4 py-2 font-mono text-accent">{decorator}</td>
                <td className="px-4 py-2 font-mono font-semibold text-text-primary">
                  {method}
                </td>
                <td className="px-4 py-2">{notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ──────────────── @QUERY ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        @Query
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Bun-specific HTTP method — like GET but with a request body (RFC 9110).
        Useful for complex search queries that don&apos;t fit in query params.
      </p>
      <CodeBlock
        code={`import type { Context } from "@buntok/core";

@Controller("/search")
class SearchController {
  @Query("/")
  async search(ctx: Context) {
    const body = await ctx.body(); // { filters: [...], sort: "date" }
    const results = await db.search(body);
    return ctx.json(results);
  }
}`}
      />

      {/* ──────────────── @USE ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        @Use
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Attach middleware to a single route. Multiple <code>@Use()</code> calls
        stack in declaration order.
      </p>
      <CodeBlock
        code={`import type { Context } from "@buntok/core";

const auth = async (ctx: Context, next) => {
  const token = ctx.getCookie("token");
  if (!token) return ctx.json({ error: "Unauthorized" }, 401);
  return next();
};

const log = async (ctx: Context, next) => {
  console.log(ctx.request.method, ctx.request.url);
  return next();
};

@Controller("/users")
class UserController {
  @Get("/public")
  publicEndpoint(ctx: Context) {
    return ctx.json({ data: "public" });
  }

  @Get("/private")
  @Use(auth)
  @Use(log)
  privateEndpoint(ctx: Context) {
    return ctx.json({ data: "private" });
  }
}

// Execution order for GET /users/private:
// auth → log → privateEndpoint`}
      />

      <div className="my-4 overflow-x-auto">
        <table className="w-full text-sm text-text-secondary border border-border-primary rounded-lg overflow-hidden">
          <thead className="bg-bg-tertiary border-b border-border-primary">
            <tr>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Parameter
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
            <tr className="border-b border-border-primary">
              <td className="px-4 py-2 font-mono text-accent">middleware</td>
              <td className="px-4 py-2 font-mono">
                (ctx, next) =&gt; Response
              </td>
              <td className="px-4 py-2">
                Middleware function receiving context and <code>next</code>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <Heading
        level={3}
        className="text-xl font-semibold mt-6 mb-2 text-text-primary"
      >
        With zValidator
      </Heading>
      <CodeBlock
        code={`import { zValidator, z } from "@buntok/core/middlewares/validator";
import type { ZodCtx } from "@buntok/core";

const userSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
});

@Controller("/users")
class UserController {
  @Post("/")
  @Use(zValidator("body", userSchema))
  async create(ctx: ZodCtx<{ body: typeof userSchema }>) {
    const data = ctx.valid("body"); // Fully typed!
    return ctx.json({ created: true, ...data }, 201);
  }

  @Get("/search")
  @Use(zValidator("query", searchSchema))
  search(ctx: ZodCtx<{ query: typeof searchSchema }>) {
    const { q } = ctx.valid("query");
    return ctx.json({ results: [] });
  }
}`}
      />

      {/* ──────────────── RESPONSE DECORATORS ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Response Decorators
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Zero-cost boot-time metadata — no per-request overhead. Configure status,
        headers and redirects without touching handler logic.
      </p>
      <CodeBlock
        code={`import { HttpCode, SetHeader, Redirect, Version } from "@buntok/core";

@Controller("/users")
class UserController {
  @Post("/")
  @HttpCode(201)
  create() { return { id: 1 }; } // 201 instead of 200

  @Get("/")
  @SetHeader("x-cache", "hit")
  list() { return []; } // header x-cache: hit

  @Get("/old")
  @Redirect("/new", 301)
  old() {} // 301 -> /new, handler ignored; return {url: "/other"} to override
}`}
      />
      <Callout type="info">
        <code>@Header</code> is deprecated alias to <code>@SetHeader</code>{" "}
        (same reference). <code>toResponse()</code> handles flexible return
        status/header/redirect composition.
      </Callout>

      {/* ──────────────── @SETMETADATA ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        @SetMetadata & @Public
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Attach arbitrary metadata to handlers (read via <code>getMetadata</code>{" "}
        in guards/interceptors). <code>@Public()</code> is shorthand for{" "}
        <code>SetMetadata("isPublic", true)</code>.
      </p>
      <CodeBlock
        code={`import { SetMetadata, Public } from "@buntok/core";
import { getMetadata } from "@buntok/core";

@SetMetadata("roles", ["admin"])
@Get("/admin")
admin() {}

@Public()
@Get("/health")
health() { return { ok: true }; }

// In guard
const roles = getMetadata(AdminController, "admin", "roles");`}
      />

      {/* ──────────────── APPLYDECORATORS ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        applyDecorators
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Compose multiple decorators (Nest <code>applyDecorators</code> alias) —
        boot-time helper.
      </p>
      <CodeBlock
        code={`import { applyDecorators, SetMetadata, UseGuard } from "@buntok/core";

const Auth = (...roles: string[]) => applyDecorators(
  SetMetadata("roles", roles),
  UseGuard((ctx) => checkRoles(ctx, roles))
);

@Auth("admin")
@Get("/secret")
secret() {}`}
      />

      {/* ──────────────── @USEGUARD ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        @UseGuard / @UseGuards
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        A convenience decorator for boolean authorization checks. A guard is a
        function that returns <code>boolean</code> or{" "}
        <code>Promise&lt;boolean&gt;</code>. If any guard returns{" "}
        <code>false</code>, the request is rejected with{" "}
        <code>403 Forbidden</code>. <code>UseGuards</code> is the recommended
        plural alias — <code>UseGuard</code> remains deprecated but same
        reference.
      </p>
      <CodeBlock
        code={`import type { Context } from "@buntok/core";

const isAdmin = (ctx: Context) => ctx.user?.role === "admin";
const isActive = (ctx: Context) => ctx.user?.status === "active";

const hasApiKey = async (ctx: Context) => {
  const key = ctx.request.headers.get("x-api-key");
  const valid = await validateApiKey(key);
  return valid;
};

@Controller("/admin")
class AdminController {
  @Get("/dashboard")
  @UseGuard(isAdmin)
  dashboard(ctx: Context) {
    return ctx.json({ secret: "admin data" });
  }

  @Get("/reports")
  @UseGuard(isAdmin, isActive)
  reports(ctx: Context) {
    return ctx.json({ reports: [] });
  }

  @Get("/api-data")
  @UseGuard(hasApiKey)
  apiData(ctx: Context) {
    return ctx.json({ data: "sensitive" });
  }
}`}
      />

      <div className="my-4 overflow-x-auto">
        <table className="w-full text-sm text-text-secondary border border-border-primary rounded-lg overflow-hidden">
          <thead className="bg-bg-tertiary border-b border-border-primary">
            <tr>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Parameter
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
            <tr className="border-b border-border-primary">
              <td className="px-4 py-2 font-mono text-accent">...guards</td>
              <td className="px-4 py-2 font-mono">
                (ctx) =&gt; boolean | Promise&lt;boolean&gt;
              </td>
              <td className="px-4 py-2">
                One or more guard functions (rest parameters)
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <Callout type="info">
        <code>@UseGuard</code> is syntactic sugar for <code>@Use</code>. It
        creates an async middleware that runs guards sequentially and returns 403
        on failure. Guards are awaited, so async guards (e.g., database lookups)
        are fully supported.
      </Callout>

      {/* ──────────────── @INJECTABLE / @INJECT (REMOVED) ──────────────── */}
      <Callout type="warning">
        <code>@Injectable</code> &amp; <code>@Inject</code> have been removed in{" "}
        <code>v2.1+</code>. Use <code>Container.register</code> with{" "}
        <code>useClass</code>/<code>useFactory</code> + <code>scope</code> for
        DI. See the <a href="/docs/ioc" className="text-accent hover:underline">IoC Container</a> page.
      </Callout>

      {/* ──────────────── DECORATOR ORDERING ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Decorator Ordering
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Stage 3 decorators: factories are evaluated <strong>top-to-bottom</strong>{" "}
        but applied <strong>bottom-to-top</strong>. <code>@Controller</code> is
        evaluated first (topmost) but applied last, so it captures all routes.
      </p>
      <CodeBlock
        code={`import type { Context } from "@buntok/core";

@Controller("/users")          // 4. Evaluated 1st, applied 4th → captures all
class UserController {
  @Get("/")                   // 3. Evaluated 4th, applied 1st → creates entry
  @Use(auth)                  // 2. Evaluated 2nd, applied 3rd → unshift → runs 1st
  @Use(log)                   // 1. Evaluated 3rd, applied 2nd → unshift → runs 2nd
  async list(ctx: Context) {
    return ctx.json([]);
  }
}

// Evaluate: Controller → auth → log → Get (top-to-bottom)
// Apply:    Get → log → auth → Controller (bottom-to-top)
// Execution order: auth → log → list`}
      />

      <Callout type="warning">
        If <code>@Controller</code> is not the topmost decorator, it will not
        capture the routes correctly. Always place it first.
      </Callout>

      {/* ──────────────── FULL EXAMPLE ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Full Example
      </Heading>
      <CodeBlock
        code={`import {
  App, Controller, Get, Post, Use, UseGuard, Dependencies,
  Container,
} from "@buntok/core";
import { zValidator, z } from "@buntok/core/middlewares/validator";
import type { Context, ZodCtx } from "@buntok/core";

// Service — plain class, no decorator
class UserService {
  async findAll() {
    return await db.user.findMany();
  }
  async create(data: CreateUser) {
    return await db.user.create({ data });
  }
}

// Middleware
const auth = async (ctx: Context, next) => {
  const token = ctx.getCookie("token");
  if (!token) return ctx.json({ error: "Unauthorized" }, 401);
  return next();
};

// Guards
const isAdmin = (ctx: Context) => ctx.user?.role === "admin";

// Schema
const createUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
});

// Controller — @Dependencies declares constructor dependencies
@Dependencies(UserService)
@Controller("/users")
class UserController {
  constructor(private service: UserService) {}

  @Get("/")
  async list(ctx: Context) {
    const users = await this.service.findAll();
    return ctx.json(users);
  }

  @Post("/")
  @Use(auth)
  @UseGuard(isAdmin)
  @Use(zValidator("body", createUserSchema))
  async create(ctx: ZodCtx<{ body: typeof createUserSchema }>) {
    const data = ctx.valid("body");
    const user = await this.service.create(data);
    return ctx.json({ created: true, ...user }, 201);
  }
}

// Setup — container.scan() resolves the entire dependency tree
const app = new App();
const container = new Container();
container.scan([UserController]);  // auto-resolves UserService → UserController
app.setContainer(container);
app.registerController(UserController);
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
          <a href="/docs/controllers" className="text-accent hover:underline">
            Controllers
          </a>{" "}
          - Class-based routing
        </li>
        <li>
          <a href="/docs/ioc" className="text-accent hover:underline">
            IoC Container
          </a>{" "}
          - Dependency injection
        </li>
        <li>
          <a href="/docs/validation" className="text-accent hover:underline">
            Validation
          </a>{" "}
          - Zod validation
        </li>
        <li>
          <a href="/docs/middleware" className="text-accent hover:underline">
            Middleware
          </a>{" "}
          - Middleware patterns
        </li>
      </ul>
    </div>
  );
}
