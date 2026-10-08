import { Heading } from "@/components/ui/Heading";
import { CodeBlock } from "@/components/ui/CodeBlock";
import { Callout } from "@/components/ui/Callout";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/Table";

export const metadata = {
  title: "Validation",
  description:
    "Validate request bodies, params, and query strings with Zod schemas.",
};

export default function ValidationPage() {
  return (
    <div>
      <Heading
        level={1}
        className="text-4xl font-bold mt-8 mb-4 text-text-primary"
      >
        Validation
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Buntok provides request data validation using Zod schemas. Zod is
        already included when you install <code>@buntok/core</code>.
      </p>

      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        zValidator
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Middleware for validating request data with Zod schemas. Supports:{" "}
        <code>body</code>, <code>query</code>, <code>params</code>.
      </p>

      <Heading
        level={3}
        className="text-xl font-semibold mt-6 mb-2 text-text-primary"
      >
        Body Validation
      </Heading>
      <CodeBlock
        code={`import { zValidator, z } from "@buntok/core/middlewares/validator";

const userSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  age: z.number().min(0).max(150).optional(),
});

app.post("/users", zValidator("body", userSchema), (ctx) => {
  const data = ctx.valid("body");
  // data is already validated, safe to use
  return ctx.json({ created: true, ...data });
});`}
      />

      <Heading
        level={3}
        className="text-xl font-semibold mt-6 mb-2 text-text-primary"
      >
        Query Validation
      </Heading>
      <CodeBlock
        code={`const paginationSchema = z.object({
  page: z.coerce.number().default(1),
  limit: z.coerce.number().default(10),
});

app.get("/users", zValidator("query", paginationSchema), (ctx) => {
  const { page, limit } = ctx.valid("query");
  return ctx.json({ page, limit });
});`}
      />

      <Heading
        level={3}
        className="text-xl font-semibold mt-6 mb-2 text-text-primary"
      >
        Params Validation
      </Heading>
      <CodeBlock
        code={`const idSchema = z.object({ id: z.string().uuid() });

app.get("/users/:id", zValidator("params", idSchema), (ctx) => {
  const { id } = ctx.valid("params");
  return ctx.json({ id });
});`}
      />

      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Model Registry
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Register schemas once with <code>app.model</code> and reference them by
        name anywhere a schema is accepted (<code>zValidator</code>,{" "}
        <code>zResponse</code>, <code>validate()</code>):
      </p>
      <CodeBlock
        code={`app.model("UserBody", z.object({ name: z.string().min(1) }));
// or app.model({ UserBody: ..., UserIdParams: ... });

app.post("/users", zValidator("body", "UserBody"), (ctx) =>
  ctx.json(ctx.valid("body"), 201)
);

const schema = app.getModel("UserBody"); // throws if not registered`}
      />
      <p className="my-3 text-text-secondary leading-relaxed">
        Names are module-global - use unique names in tests. An unknown name
        throws at route registration:{" "}
        <code>
          Unknown model &quot;X&quot;. Register it with app.model(&quot;X&quot;,
          schema) before routes use it.
        </code>
      </p>

      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        ZodCtx
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        <code>ZodCtx</code> is a TypeScript type that gives you{" "}
        <strong>fully typed</strong> access to validated data in decorator-based
        controllers. It infers types directly from your Zod schemas - no manual
        type annotations needed.
      </p>

      <Heading
        level={3}
        className="text-xl font-semibold mt-6 mb-2 text-text-primary"
      >
        Why ZodCtx?
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Without <code>ZodCtx</code>, you&apos;d have to manually type every
        validated field:
      </p>
      <CodeBlock
        code={`// Without ZodCtx - manual types, easy to drift out of sync
app.post("/users", zValidator("body", userSchema), (ctx) => {
  const data = ctx.valid<{ name: string; email: string }>("body");
  //                         ^^^ manually duplicated type
});`}
      />
      <p className="my-3 text-text-secondary leading-relaxed">
        With <code>ZodCtx</code>, the type is{" "}
        <strong>inferred automatically</strong> from the schema:
      </p>
      <CodeBlock
        code={`// With ZodCtx - types auto-inferred from Zod schema
const userSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
});

app.post("/users", zValidator("body", userSchema), (ctx: ZodCtx<{ body: typeof userSchema }>) => {
  const data = ctx.valid("body");
  //    ^? { name: string; email: string } - auto-inferred!
});`}
      />

      <Heading
        level={3}
        className="text-xl font-semibold mt-6 mb-2 text-text-primary"
      >
        How It Works
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        <code>ZodCtx&lt;T&gt;</code> accepts an object with optional{" "}
        <code>body</code>, <code>query</code>, and <code>params</code> keys.
        Each key accepts a Zod schema type (or a raw TypeScript type). The type
        system extracts the inferred type via Zod&apos;s internal{" "}
        <code>_type</code> property.
      </p>
      <CodeBlock
        code={`// ZodCtx infers types from Zod schemas
type MyCtx = ZodCtx<{
  body: typeof userSchema;      // z.object({...}) → inferred type
  query: typeof paginationSchema; // z.object({...}) → inferred type
  params: typeof idSchema;       // z.object({...}) → inferred type
}>

// It also works with raw TypeScript types (no Zod)
type MyCtx = ZodCtx<{
  body: { name: string; role: string }
}>`}
      />

      <Heading
        level={3}
        className="text-xl font-semibold mt-6 mb-2 text-text-primary"
      >
        Body Validation
      </Heading>
      <CodeBlock
        code={`import { Controller, Post, Use, ZodCtx } from "@buntok/core";
import { zValidator, z } from "@buntok/core/middlewares/validator";

const createUserSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
});

@Controller("/users")
export class UserController {
  @Post("/")
  @Use(zValidator("body", createUserSchema))
  async create(ctx: ZodCtx<{ body: typeof createUserSchema }>) {
    const { name, email, password } = ctx.valid("body");
    //    ^? string   ^? string    ^? string - all auto-typed!

    return ctx.json({ success: true, data: { name, email } });
  }
}`}
      />

      <Heading
        level={3}
        className="text-xl font-semibold mt-6 mb-2 text-text-primary"
      >
        Query Validation
      </Heading>
      <CodeBlock
        code={`const paginationSchema = z.object({
  page: z.coerce.number().default(1),
  limit: z.coerce.number().default(10),
  search: z.string().optional(),
});

@Controller("/users")
export class UserController {
  @Get("/")
  @Use(zValidator("query", paginationSchema))
  async list(ctx: ZodCtx<{ query: typeof paginationSchema }>) {
    const { page, limit, search } = ctx.valid("query");
    //    ^? number  ^? number  ^? string | undefined

    const users = await db.user.findMany({
      skip: (page - 1) * limit,
      take: limit,
      where: search ? { name: { contains: search } } : undefined,
    });

    return ctx.paginate(users, total, page, limit);
  }
}`}
      />

      <Heading
        level={3}
        className="text-xl font-semibold mt-6 mb-2 text-text-primary"
      >
        Params Validation
      </Heading>
      <CodeBlock
        code={`const idSchema = z.object({
  id: z.string().uuid(),
});

@Controller("/users")
export class UserController {
  @Get("/:id")
  @Use(zValidator("params", idSchema))
  async getById(ctx: ZodCtx<{ params: typeof idSchema }>) {
    const { id } = ctx.valid("params");
    //    ^? string (UUID)

    const user = await db.user.findUnique({ where: { id } });
    if (!user) return ctx.error("User not found", 404);
    return ctx.json(user);
  }
}`}
      />

      <Heading
        level={3}
        className="text-xl font-semibold mt-6 mb-2 text-text-primary"
      >
        Multiple Validators
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Combine body, query, and params validation in a single endpoint:
      </p>
      <CodeBlock
        code={`const createPostSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(10),
});

const postQuerySchema = z.object({
  draft: z.coerce.boolean().default(false),
});

@Controller("/users/:userId/posts")
export class PostController {
  @Post("/")
  @Use(zValidator("params", z.object({ userId: z.string().uuid() })))
  @Use(zValidator("body", createPostSchema))
  @Use(zValidator("query", postQuerySchema))
  async create(
    ctx: ZodCtx<{
      params: { userId: string };
      body: typeof createPostSchema;
      query: typeof postQuerySchema;
    }>
  ) {
    const { userId } = ctx.valid("params");
    const { title, content } = ctx.valid("body");
    const { draft } = ctx.valid("query");

    const post = await db.post.create({
      data: { title, content, draft, authorId: userId },
    });

    return ctx.json(post, 201);
  }
}`}
      />

      <Heading
        level={3}
        className="text-xl font-semibold mt-6 mb-2 text-text-primary"
      >
        What ZodCtx Gives You
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        <code>ZodCtx</code> extends the full{" "}
        <a href="/docs/context" className="text-accent hover:underline">
          Context
        </a>{" "}
        - you get all context methods plus typed validation:
      </p>
      <div className="my-4 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableCell header>Method</TableCell>
              <TableCell header>Description</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="font-mono text-accent">
                ctx.valid("body")
              </TableCell>
              <TableCell>Returns validated body (typed)</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-mono text-accent">
                ctx.valid("query")
              </TableCell>
              <TableCell>Returns validated query params (typed)</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-mono text-accent">
                ctx.valid("params")
              </TableCell>
              <TableCell>Returns validated route params (typed)</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-mono text-accent">
                ctx.body()
              </TableCell>
              <TableCell>
                Read and parse raw JSON body from request (no validation)
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-mono text-accent">
                ctx.json(data)
              </TableCell>
              <TableCell>JSON response</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-mono text-accent">
                ctx.error(msg, status)
              </TableCell>
              <TableCell>Error response</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-mono text-accent">
                ctx.paginate()
              </TableCell>
              <TableCell>Paginated response</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      <Heading
        level={3}
        className="text-xl font-semibold mt-6 mb-2 text-text-primary"
      >
        ZodCtx vs Context
      </Heading>
      <div className="my-4 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableCell header>Feature</TableCell>
              <TableCell header>Context</TableCell>
              <TableCell header>ZodCtx</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>Validation types</TableCell>
              <TableCell>
                Manual: <code>ctx.valid&lt;Type&gt;("body")</code>
              </TableCell>
              <TableCell>
                Auto-inferred: <code>ctx.valid("body")</code>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Works with</TableCell>
              <TableCell>Both decorator &amp; functional API</TableCell>
              <TableCell>Both decorator &amp; functional API</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Runtime behavior</TableCell>
              <TableCell>Same (Context instance)</TableCell>
              <TableCell>Same (Context instance)</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Recommended for</TableCell>
              <TableCell>Functional API handlers</TableCell>
              <TableCell>Decorator-based controllers</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      <Heading
        level={3}
        className="text-xl font-semibold mt-6 mb-2 text-text-title"
      >
        Functional API
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        <code>ZodCtx</code> works in functional handlers too, though you can
        also use manual types with <code>ctx.valid&lt;Type&gt;()</code>:
      </p>
      <CodeBlock
        code={`// ZodCtx pattern (auto-inferred)
app.post("/users", zValidator("body", userSchema), (ctx: ZodCtx<{ body: typeof userSchema }>) => {
  const data = ctx.valid("body"); // auto-typed
  return ctx.json(data, 201);
});

// Manual type pattern (also works)
app.post("/users", zValidator("body", userSchema), (ctx) => {
  const data = ctx.valid<{ name: string; email: string }>("body"); // manual type
  return ctx.json(data, 201);
});`}
      />

      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        ctx.valid()
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Retrieve data that has been validated by <code>zValidator</code>. With{" "}
        <code>ZodCtx</code>, the return type is auto-inferred. Without it, pass
        a type parameter manually.
      </p>
      <CodeBlock
        code={`// With ZodCtx (auto-inferred)
const data = ctx.valid("body");

// Without ZodCtx (manual type)
const data = ctx.valid<UserCreateDto>("body");`}
      />

      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Shortcuts
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Shortcut functions for common use cases:
      </p>
      <CodeBlock
        code={`// validateBody = zValidator("body", schema)
app.post("/users", validateBody(schema), handler);

// validateParams = zValidator("params", schema)
app.get("/users/:id", validateParams(idSchema), handler);`}
      />
      <Callout type="warning">
        <code>validateBody</code> and <code>validateParams</code> are
        deprecated. Use <code>zValidator(&quot;body&quot;, schema)</code> and{" "}
        <code>zValidator(&quot;params&quot;, schema)</code> instead - they
        provide full type inference via{" "}
        <a
          href="/docs/validation#zodctx"
          className="text-accent hover:underline"
        >
          ZodCtx
        </a>
        .
      </Callout>

      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Error Response
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        When validation fails, Buntok automatically returns a 422:
      </p>
      <CodeBlock
        code={`{
  "success": false,
  "message": "Validation Failed",
  "details": [
    {
      "field": "name",
      "message": "Name is required and must be at least 1 character long."
    },
    {
      "field": "email",
      "message": "Invalid email"
    }
  ]
}`}
      />

      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Custom Error Message
      </Heading>
      <CodeBlock
        code={`const schema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
});`}
      />

      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Custom Error Format
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        The default error response format is:
      </p>
      <CodeBlock
        code={`{
  "success": false,
  "message": "Validation Failed",
  "details": [
    { "field": "name", "message": "..." }
  ]
}`}
      />
      <p className="my-3 text-text-secondary leading-relaxed">
        <code>zValidator()</code> returns a 422 response directly, so it does
        not pass validation failures to <code>app.onError()</code>. Use a custom
        middleware if you need to transform the validator response format.
        <code>app.onError()</code> remains available for errors thrown by route
        handlers and other middleware:
      </p>
      <CodeBlock
        code={`import { Buntok } from "@buntok/core";

const app = new Buntok();

app.onError((error, ctx) => {
  // Handle other errors
  return ctx.json({
    status: "error",
    message: error.message,
  }, 500);
});`}
      />

      <Callout type="info">
        The error handler receives the thrown error and context. Validation
        failures returned by <code>zValidator()</code> are already responses and
        do not enter this handler.
      </Callout>

      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        When to Use ZodCtx
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Use <code>ZodCtx</code> in <strong>decorator-based controllers</strong>{" "}
        where you want types auto-inferred from Zod schemas. Use manual types
        with <code>ctx.valid&lt;Type&gt;()</code> in{" "}
        <strong>functional handlers</strong> or when your schema doesn&apos;t
        match your runtime type.
      </p>
      <CodeBlock
        code={`// Decorator controller - use ZodCtx for auto-inference
@Controller("/users")
export class UserController {
  @Post("/")
  @Use(zValidator("body", createUserSchema))
  async create(ctx: ZodCtx<{ body: typeof createUserSchema }>) {
    const { name, email } = ctx.valid("body"); // typed automatically
  }
}

// Functional handler - both work, ZodCtx is optional
app.post("/users", zValidator("body", createUserSchema), (ctx) => {
  const data = ctx.valid<UserCreateInput>("body"); // manual type
  return ctx.json(data);
});`}
      />

      <Callout type="info">
        <strong>Note:</strong> <code>zValidator</code> only supports{" "}
        <code>&quot;body&quot;</code>, <code>&quot;query&quot;</code>, and{" "}
        <code>&quot;params&quot;</code> targets. For headers validation, use a
        custom middleware or check <code>ctx.request.headers</code> directly.
      </Callout>

      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Combining Validators
      </Heading>
      <CodeBlock
        code={`app.post("/users",
  zValidator("body", userSchema),
  zValidator("query", paginationSchema),
  (ctx) => {
    const body = ctx.valid("body");
    const query = ctx.valid("query");
    return ctx.json({ body, query });
  }
);`}
      />

      <Callout type="info">
        Each <code>zValidator</code> only validates a specific target (body,
        query, params, or headers). You can use multiple validators
        simultaneously.
      </Callout>

      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        File Upload Validation
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        For file uploads, <code>zValidator</code> supports{" "}
        <code>multipart/form-data</code> with <code>z.file()</code> (Zod v4+) to
        validate file fields directly:
      </p>
      <CodeBlock
        code={`const schema = z.object({
  name: z.string().min(1),
  avatar: z.file().mime(["image/png", "image/jpeg"]),
});

app.post("/upload", zValidator("body", schema, { 
  contentType: "multipart/form-data" 
}), async (ctx) => {
  const { name, avatar } = ctx.valid("body");
  // avatar is a File object
  return ctx.json({ name, type: avatar.type });
});`}
      />

      <Heading
        level={3}
        className="text-xl font-semibold mt-6 mb-2 text-text-primary"
      >
        Multiple Files
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Use <code>z.array(z.file())</code> to validate multiple files with the
        same field name:
      </p>
      <CodeBlock
        code={`const schema = z.object({
  title: z.string(),
  images: z.array(z.file()).min(1).max(10),
});

app.post("/gallery", zValidator("body", schema, { 
  contentType: "multipart/form-data" 
}), async (ctx) => {
  const { title, images } = ctx.valid("body");
  // images is File[]
  return ctx.json({ title, count: images.length });
});`}
      />

      <Callout type="info">
        <code>zValidator</code> with <code>multipart/form-data</code> validates
        and parses both text fields and file fields. For comprehensive file
        validation (size, magic bytes, MIME types) and storage, use{" "}
        <code>
          <a href="/docs/upload" className="text-accent hover:underline">
            handleUploads()
          </a>
        </code>{" "}
        or the{" "}
        <code>
          <a
            href="/docs/upload#uploader-middleware"
            className="text-accent hover:underline"
          >
            uploader()
          </a>
        </code>{" "}
        middleware instead.
      </Callout>

      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Next Steps
      </Heading>
      <ul className="my-3 ml-6 list-disc text-text-secondary space-y-1">
        <li>
          <a href="/docs/upload" className="text-accent hover:underline">
            Upload
          </a>{" "}
          - Validate file uploads
        </li>
        <li>
          <a href="/docs/routing" className="text-accent hover:underline">
            Routing
          </a>{" "}
          - Route parameters and query strings
        </li>
      </ul>
    </div>
  );
}
