import { Heading } from "@/components/ui/Heading";
import { CodeBlock } from "@/components/ui/CodeBlock";
import { Callout } from "@/components/ui/Callout";

export const metadata = {
  title: "API Documentation",
  description:
    "Generate OpenAPI docs and serve an interactive API client for exploring your endpoints.",
};

export default function ApiDocsPage() {
  return (
    <div>
      <Heading
        level={1}
        className="text-4xl font-bold mt-8 mb-4 text-text-primary"
      >
        API Docs
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Auto-generate OpenAPI 3.0 documentation from your Zod validation
        schemas and serve a full-featured interactive API client.
      </p>

      {/* ──────────────── QUICK START ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Quick Start
      </Heading>

      <Heading
        level={3}
        className="text-xl font-semibold mt-6 mb-2 text-text-primary"
      >
        1. Enable docs in your app
      </Heading>
      <CodeBlock
        code={`import { App } from "@buntok/core";

const app = new App();

app.apiDocs({
  path: "/docs",
  title: "My API",
  version: "1.0.0",
  description: "My awesome API documentation",
  safeOnProduction: true, // hides docs when NODE_ENV=production
});

app.listen(1212);
// Visit http://localhost:1212/docs
// swagger.json is auto-generated in the background on startup`}
      />

      <Callout type="info">
        <code>swagger.json</code> is automatically generated in the background when the server starts. No need to run <code>buntok make:docs</code> manually. The generation runs via <code>setImmediate()</code> and does not affect API response time.
      </Callout>

      <Callout type="info">
        Both <code>/docs</code> and <code>/docs/</code> (with trailing slash) work. Asset paths (CSS/JS) are automatically resolved to the correct absolute paths, so the docs UI loads correctly regardless of how the URL is accessed.
      </Callout>

      {/* ──────────────── OPTIONS ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Options
      </Heading>
      <div className="my-3 overflow-x-auto">
        <table className="w-full text-sm text-text-secondary">
          <thead>
            <tr className="border-b border-border-primary text-left">
              <th className="py-2 pr-4 font-semibold">Option</th>
              <th className="py-2 pr-4 font-semibold">Type</th>
              <th className="py-2 pr-4 font-semibold">Default</th>
              <th className="py-2 font-semibold">Description</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-primary">
            <tr>
              <td className="py-2 pr-4 font-mono text-xs text-accent">path</td>
              <td className="py-2 pr-4 font-mono text-xs">string</td>
              <td className="py-2 pr-4 font-mono text-xs">"/docs"</td>
              <td className="py-2">URL path for the docs UI</td>
            </tr>
            <tr>
              <td className="py-2 pr-4 font-mono text-xs text-accent">title</td>
              <td className="py-2 pr-4 font-mono text-xs">string</td>
              <td className="py-2 pr-4 font-mono text-xs">"API Documentation"</td>
              <td className="py-2">API title shown in the docs UI and swagger.json</td>
            </tr>
            <tr>
              <td className="py-2 pr-4 font-mono text-xs text-accent">version</td>
              <td className="py-2 pr-4 font-mono text-xs">string</td>
              <td className="py-2 pr-4 font-mono text-xs">"1.0.0"</td>
              <td className="py-2">API version shown in the docs UI and swagger.json</td>
            </tr>
            <tr>
              <td className="py-2 pr-4 font-mono text-xs text-accent">description</td>
              <td className="py-2 pr-4 font-mono text-xs">string</td>
              <td className="py-2 pr-4 font-mono text-xs">undefined</td>
              <td className="py-2">API description shown in the docs UI and swagger.json</td>
            </tr>
            <tr>
              <td className="py-2 pr-4 font-mono text-xs text-accent">safeOnProduction</td>
              <td className="py-2 pr-4 font-mono text-xs">boolean</td>
              <td className="py-2 pr-4 font-mono text-xs">false</td>
              <td className="py-2">When <code>true</code>, docs routes are not registered when <code>NODE_ENV=production</code></td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ──────────────── ANNOTATION ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Annotating Routes
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Use <code>zValidator</code> and <code>zResponse</code> in your route
        handlers. The CLI picks them up automatically.
      </p>

      <Heading
        level={3}
        className="text-xl font-semibold mt-6 mb-2 text-text-primary"
      >
        Body Validation
      </Heading>
      <CodeBlock
        code={`
import { z } from "@buntok/core/middlewares/validator";

const CreateUserSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  role: z.enum(["admin", "user"]).default("user"),
});

app.post(
  "/users",
  zValidator("body", CreateUserSchema),
  async (ctx) => {
    const data = ctx.valid("body");
    // ...
  }
);`}
      />

      <Heading
        level={3}
        className="text-xl font-semibold mt-6 mb-2 text-text-primary"
      >
        Query & Params Validation
      </Heading>
      <CodeBlock
        code={`// Query params
app.get(
  "/users",
  zValidator("query", z.object({
    page: z.coerce.number().int().default(1),
    limit: z.coerce.number().int().default(10),
    search: z.string().optional(),
  })),
  async (ctx) => {
    const { page, limit } = ctx.valid("query");
    // ...
  }
);

// Path params
app.get(
  "/users/:id",
  zValidator("params", z.object({
    id: z.string().uuid(),
  })),
  async (ctx) => {
    const { id } = ctx.valid("params");
    // ...
  }
);`}
      />

      <Heading
        level={3}
        className="text-xl font-semibold mt-6 mb-2 text-text-primary"
      >
        Documenting Responses
      </Heading>
      <CodeBlock
        code={`
const UserSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  email: z.string().email(),
  role: z.string(),
  createdAt: z.string(),
});

app.get(
  "/users/:id",
  zValidator("params", z.object({ id: z.string().uuid() })),
  zResponse(200, UserSchema, "User found"),
  zResponse(404, z.object({}), "User not found"),
  async (ctx) => {
    const user = await userRepo.findById(ctx.valid("params").id);
    if (!user) return ctx.error("Not found", 404);
    return ctx.json(user);
  }
);`}
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
import { App } from "@buntok/core";
import { z } from "@buntok/core/middlewares/validator";

const app = new App();

// ─── Schemas ───────────────────────────────────────
const CreateUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
});

const UserSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string(),
  createdAt: z.string(),
});

// ─── Routes ────────────────────────────────────────
app.get(
  "/users",
  zValidator("query", z.object({
    page: z.coerce.number().default(1),
    limit: z.coerce.number().default(10),
  })),
  zResponse(200, z.array(UserSchema), "List of users"),
  async (ctx) => {
    const users = await userRepo.findAll();
    return ctx.json(users);
  }
);

app.post(
  "/users",
  zValidator("body", CreateUserSchema),
  zResponse(201, UserSchema, "User created"),
  async (ctx) => {
    const user = await userRepo.create(ctx.valid("body"));
    return ctx.json(user, 201);
  }
);

app.get(
  "/users/:id",
  zValidator("params", z.object({ id: z.string() })),
  zResponse(200, UserSchema, "User found"),
  async (ctx) => {
    const user = await userRepo.findById(ctx.valid("params").id);
    if (!user) return ctx.error("Not found", 404);
    return ctx.json(user);
  }
);

// ─── Enable API docs ───────────────────────────────
app.apiDocs({
  path: "/docs",
  title: "User Management API",
  version: "1.0.0",
  safeOnProduction: true,
});

app.listen(1212);

// Visit: http://localhost:1212/docs
// swagger.json is auto-generated in the background on startup`}
      />

      {/* ──────────────── PRODUCTION ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Production Safety
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Use <code>safeOnProduction: true</code> to automatically hide the docs UI
        when <code>NODE_ENV=production</code>. This prevents exposing your API
        documentation in production environments.
      </p>
      <CodeBlock
        code={`app.apiDocs({
  path: "/docs",
  title: "My API",
  safeOnProduction: true, // disabled when NODE_ENV=production
});`}
      />

      <Callout type="warning">
        When <code>safeOnProduction</code> is <code>true</code> and{" "}
        <code>NODE_ENV=production</code>, the docs routes return 404. Make sure
        your deployment sets <code>NODE_ENV=production</code>.
      </Callout>

      {/* ──────────────── TIPS ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Tips
      </Heading>
      <ul className="my-3 ml-6 list-disc text-text-secondary space-y-2">
        <li>
          Routes without <code>zValidator</code> are still registered in the
          spec (no request/response schema)
        </li>
        <li>
          If a schema type is unsupported, that route is skipped with a warning.
          Annotate with <code>.openapi()</code> from{" "}
          <code>@asteasolutions/zod-to-openapi</code>
        </li>
        <li>
          The <code>zResponse</code> schema is wrapped in the standard Buntok
          envelope: <code>{"{ success, message, data }"}</code>
        </li>
        <li>
          The interactive docs UI includes request testing, code snippet
          generation, cookie management, and schema-powered body previews
        </li>
      </ul>

      <Callout type="info">
        <code>swagger.json</code> is auto-generated when you call{" "}
        <code>app.listen()</code>. For manual regeneration (e.g., CI/CD), run{" "}
        <code>buntok make:docs</code> — it imports your{" "}
        <code>src/index.ts</code> and generates the file.
      </Callout>
    </div>
  );
}
