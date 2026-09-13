import { Heading } from "@/components/ui/Heading";
import { CodeBlock } from "@/components/ui/CodeBlock";
import { Callout } from "@/components/ui/Callout";

export const metadata = {
  title: "Testing",
  description: "Write unit and integration tests with app.request().",
};

export default function TestingPage() {
  return (
    <div>
      <Heading
        level={1}
        className="text-4xl font-bold mt-8 mb-4 text-text-primary"
      >
        Testing
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Buntok provides <code>app.request()</code> for testing routes without
        binding a real port. It dispatches requests directly through the router,
        making tests fast and deterministic.
      </p>

      {/* ──────────────── APP.REQUEST ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        app.request()
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Dispatch a request without starting a server. Returns a standard{" "}
        <code>Response</code> object.
      </p>
      <CodeBlock
        code={`import { App } from "@buntok/core";

const app = new App();

app.get("/users", async (ctx) => {
  return ctx.json([{ id: 1, name: "Alice" }]);
});

app.post("/users", async (ctx) => {
  const body = await ctx.body();
  return ctx.json({ created: true, ...body }, 201);
});

// GET request
const res = await app.request("/users");
const data = await res.json();
// data === [{ id: 1, name: "Alice" }]

// POST request with body
const res2 = await app.request("/users", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ name: "Bob" }),
});
console.log(res2.status); // 201`}
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
              <td className="px-4 py-2 font-mono text-accent">input</td>
              <td className="px-4 py-2 font-mono">string | URL | Request</td>
              <td className="px-4 py-2">The request path or URL</td>
            </tr>
            <tr className="border-b border-border-primary">
              <td className="px-4 py-2 font-mono text-accent">init?</td>
              <td className="px-4 py-2 font-mono">RequestInit</td>
              <td className="px-4 py-2">Method, headers, body, etc.</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ──────────────── UNIT TESTING ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Unit Testing Example
      </Heading>
      <CodeBlock
        code={`import { describe, it, expect } from "bun:test";
import { App } from "@buntok/core";
import { NotFoundError } from "@buntok/core/helpers";

function createTestApp() {
  const app = new App();

  app.get("/health", (ctx) => {
    return ctx.json({ status: "ok" });
  });

  app.get("/users/:id", async (ctx) => {
    const id = ctx.params.id;
    if (id === "999") {
      throw new NotFoundError("User not found");
    }
    return ctx.json({ id, name: "Alice" });
  });

  return app;
}

describe("API Routes", () => {
  it("GET /health returns ok", async () => {
    const app = createTestApp();
    const res = await app.request("/health");
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.status).toBe("ok");
  });

  it("GET /users/:id returns user", async () => {
    const app = createTestApp();
    const res = await app.request("/users/1");
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.name).toBe("Alice");
  });

  it("GET /users/:id returns 404 for unknown", async () => {
    const app = createTestApp();
    const res = await app.request("/users/999");

    expect(res.status).toBe(404);
  });
});`}
      />

      <Callout type="info">
        <code>app.request()</code> processes requests through the full
        middleware stack, so you can test auth, validation, and error handling
        just like real HTTP requests.
      </Callout>

      {/* ──────────────── WITH MIDDLEWARE ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Testing with Middleware
      </Heading>
      <CodeBlock
        code={`const app = new App();

app.use(requireAuth(process.env.JWT_SECRET!));

app.get("/protected", (ctx) => {
  return ctx.json({ user: ctx.user });
});

// Without token → 401
const res1 = await app.request("/protected");
expect(res1.status).toBe(401);

// With valid token → 200
const token = await signToken({ id: 1, role: "admin" });
const res2 = await app.request("/protected", {
  headers: { Authorization: \`Bearer \${token}\` },
});
expect(res2.status).toBe(200);`}
      />
    </div>
  );
}
