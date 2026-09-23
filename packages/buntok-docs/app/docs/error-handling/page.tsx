import { Heading } from "@/components/ui/Heading";
import { CodeBlock } from "@/components/ui/CodeBlock";
import { Callout } from "@/components/ui/Callout";

export const metadata = {
  title: "Error Handling",
  description: "Handle errors gracefully with built-in error classes and custom handlers.",
};


export default function ErrorHandlingPage() {
  return (
    <div>
      <Heading
        level={1}
        className="text-4xl font-bold mt-8 mb-4 text-text-primary"
      >
        Error Handling
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Built-in HTTP error classes and custom error handler. Throw errors in
        route handlers <strong>and middlewares</strong> - Buntok catches them
        automatically and returns proper JSON responses. You do NOT need{" "}
        <code>try/catch</code> in every handler.
      </p>

      {/* ──────────────── BUILT-IN ERRORS ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Built-in Error Classes
      </Heading>
      <div className="my-4 overflow-x-auto">
        <table className="w-full text-sm text-text-secondary border border-border-primary rounded-lg overflow-hidden">
          <thead className="bg-bg-tertiary border-b border-border-primary">
            <tr>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Class
              </th>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Status
              </th>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Usage
              </th>
            </tr>
          </thead>
          <tbody>
            {[
              ["BadRequestError", "400", "Invalid request data"],
              ["UnauthorizedError", "401", "Authentication required"],
              ["ForbiddenError", "403", "Access denied"],
              ["NotFoundError", "404", "Resource not found"],
              ["MethodNotAllowedError", "405", "HTTP method not allowed"],
              ["ConflictError", "409", "Resource conflict (duplicate, etc.)"],
              [
                "UnprocessableEntityError",
                "422",
                "Business logic validation",
              ],
              ["TooManyRequestsError", "429", "Rate limit exceeded"],
              ["InternalServerError", "500", "Server error"],
              ["ServiceUnavailableError", "503", "Service temporarily down"],
            ].map(([cls, status, usage]) => (
              <tr
                key={cls}
                className="border-b border-border-primary/50 hover:bg-bg-tertiary/50 transition-colors"
              >
                <td className="px-4 py-2 font-mono text-accent">{cls}</td>
                <td className="px-4 py-2 font-mono text-text-secondary">
                  {status}
                </td>
                <td className="px-4 py-2">{usage}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ──────────────── USAGE ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Usage
      </Heading>
      <CodeBlock
        code={`import {
  NotFoundError,
  ForbiddenError,
  ConflictError,
  BadRequestError,
} from "@buntok/core";

app.get("/users/:id", async (ctx) => {
  const user = await db.user.findUnique({ where: { id: ctx.params.id } });
  if (!user) throw new NotFoundError("User not found");
  return ctx.json(user);
});

app.delete("/users/:id", async (ctx) => {
  if (!isAdmin) throw new ForbiddenError("Admin only");
  await db.user.delete({ where: { id: ctx.params.id } });
  return ctx.json({ deleted: true });
});

app.post("/users", async (ctx) => {
  const existing = await db.user.findUnique({ where: { email } });
  if (existing) throw new ConflictError("Email already registered");
  // ...
});`}
      />

      {/* ──────────────── ERROR RESPONSE FORMAT ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Error Response Format
      </Heading>
      <CodeBlock
        code={`// All HttpError classes return this format:
{
  "success": false,
  "error": "NotFound",        // Error name (camelCase → PascalCase)
  "message": "User not found" // Your custom message
}`}
      />

      {/* ──────────────── CUSTOM ERROR HANDLER ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Custom Error Handler
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Override the default error handler to customize error responses:
      </p>
      <CodeBlock
        code={`const app = new App();

app.onError((error, ctx) => {
  console.error(error);

  // Custom error format
  return ctx.json({
    error: {
      name: error.name,
      message: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    },
  }, error instanceof HttpError ? error.status : 500);
});`}
      />

      {/* ──────────────── BASE ERROR ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Custom Error Classes
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Extend <code>HttpError</code> for domain-specific errors:
      </p>
      <CodeBlock
        code={`import { HttpError } from "@buntok/core";

// Extend HttpError for custom errors
class ValidationError extends HttpError {
  constructor(message: string) {
    super(422, message);
    this.name = "ValidationError";
  }
}

class InsufficientBalanceError extends HttpError {
  constructor(required: number, available: number) {
    super(400, \`Insufficient balance: need \${required}, have \${available}\`);
    this.name = "InsufficientBalanceError";
  }
}

// Usage
app.post("/transfer", async (ctx) => {
  const { amount } = await ctx.body();
  const balance = await getBalance(ctx.user.id);

  if (amount > balance) {
    throw new InsufficientBalanceError(amount, balance);
  }
  // ...
});`}
      />

      {/* ──────────────── TRY/CATCH ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Try/Catch
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        You can also catch errors manually for custom handling:
      </p>
      <CodeBlock
        code={`app.post("/payment", async (ctx) => {
  try {
    const result = await processPayment(await ctx.body());
    return ctx.json({ success: true, ...result });
  } catch (error) {
    if (error instanceof HttpError) {
      return ctx.json({ error: error.message }, error.status);
    }
    return ctx.json({ error: "Payment failed" }, 500);
  }
});`}
      />

      <Callout type="info">
        You don't need try/catch for most cases. Just throw an error class and
        Buntok handles the response automatically.
      </Callout>

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
          - 401 Unauthorized errors
        </li>
        <li>
          <a href="/docs/rbac" className="text-accent hover:underline">
            RBAC
          </a>{" "}
          - 403 Forbidden errors
        </li>
        <li>
          <a href="/docs/validation" className="text-accent hover:underline">
            Validation
          </a>{" "}
          - 422 Validation errors
        </li>
      </ul>
    </div>
  );
}
