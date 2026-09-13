import { Heading } from "@/components/ui/Heading";
import { CodeBlock } from "@/components/ui/CodeBlock";
import { Callout } from "@/components/ui/Callout";

export const metadata = {
  title: "Role-Based Access Control",
  description: "Enforce roles and permissions with requireRole and requirePermission middleware.",
};


export default function RBACPage() {
  return (
    <div>
      <Heading level={1} className="text-4xl font-bold mt-8 mb-4 text-text-primary">RBAC (Role-Based Access Control)</Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Buntok provides middleware for role-based access control.
      </p>

      <Callout type="info">
        RBAC middleware must be used AFTER <code>requireAuth</code> because it needs <code>ctx.user</code>.
      </Callout>

      <Heading level={2} className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2">
        requireRole
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Requires the user to have at least one of the specified roles. Must be used AFTER <code>requireAuth</code>.
      </p>

      <Heading level={3} className="text-xl font-semibold mt-6 mb-2 text-text-primary">Basic Usage</Heading>
      <CodeBlock
        code={`import { requireAuth } from "@buntok/core/auth";
import { requireRole } from "@buntok/core/middlewares";

const secret = "your-secret-key";

// Single role
app.get("/admin", requireAuth(secret), requireRole("admin"), adminHandler);

        // Multiple roles (OR logic - any one is sufficient)
app.get("/mod", requireAuth(secret), requireRole("admin", "moderator"), modHandler);`}
      />

      <Heading level={3} className="text-xl font-semibold mt-6 mb-2 text-text-primary">Decorator Usage</Heading>
      <Callout type="warning">
        <strong>Stage 3:</strong> evaluated top-to-bottom, applied bottom-to-top
        (via <code>unshift</code>). So <code>@Use(requireAuth)</code> must be{" "}
        <strong>ABOVE</strong> <code>@Use(requireRole)</code> to run first.
      </Callout>
      <CodeBlock
        code={`@Get("/admin")
@Use(requireAuth(secret))    // ← executes FIRST
@Use(requireRole("admin"))   // ← executes SECOND
async getAdmin(ctx: Context) {
  const user = ctx.user as { userId: number; role: string };
  return ctx.json({ admin: true });
}`}
      />

      <Heading level={3} className="text-xl font-semibold mt-6 mb-2 text-text-primary">Custom Resolver</Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        If the role is at a different path in the JWT payload:
      </p>
      <CodeBlock
        code={`app.get("/admin", requireAuth(secret), requireRole({
  roles: ["admin"],
  resolver: (user) => user.claims.roles,  // custom path
}), adminHandler);`}
      />

      <Heading level={3} className="text-xl font-semibold mt-6 mb-2 text-text-primary">Custom Error Message</Heading>
      <CodeBlock
        code={`app.get("/superadmin", requireAuth(secret), requireRole({
  roles: ["superadmin"],
  message: "Only superadmins are allowed to access",
}), superadminHandler);`}
      />

      <Callout type="info">
        <strong>Auto-detection:</strong> <code>requireRole</code> automatically looks for <code>user.role</code> (string) or <code>user.roles</code> (string[]).
      </Callout>

      <Heading level={2} className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2">
        requirePermission
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Requires the user to have <strong>ALL</strong> specified permissions.
      </p>

      <Heading level={3} className="text-xl font-semibold mt-6 mb-2 text-text-primary">Basic Usage</Heading>
      <CodeBlock
        code={`// Require ALL permissions
app.delete("/users/:id",
  requireAuth(secret),
  requirePermission("users:delete"),
  deleteUser
);

  // Multiple permissions (all required)
app.post("/posts",
  requireAuth(secret),
  requirePermission("posts:create", "posts:publish"),
  createPost
);`}
      />

      <Heading level={3} className="text-xl font-semibold mt-6 mb-2 text-text-primary">Decorator Usage</Heading>
      <CodeBlock
        code={`@Delete("/users/:id")
@Use(requireAuth(secret))
@Use(requirePermission("users:delete"))
async deleteUser(ctx: Context) {
  // ...
}

// Multiple permissions
@Post("/posts")
@Use(requireAuth(secret))
@Use(requirePermission("posts:create", "posts:publish"))
async createPost(ctx: Context) {
  // ...
}`}
      />

      <Heading level={3} className="text-xl font-semibold mt-6 mb-2 text-text-primary">Custom Resolver</Heading>
      <CodeBlock
        code={`app.delete("/users/:id",
  requireAuth(secret),
  requirePermission({
    permissions: ["posts:edit", "posts:delete"],
    resolver: (user) => user.scope,  // custom path
  }),
  deleteUser
);`}
      />

      <Heading level={2} className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2">
        Comparison
      </Heading>
      <div className="my-4 overflow-x-auto">
        <table className="w-full text-sm text-text-secondary border border-border-primary rounded-lg overflow-hidden">
          <thead className="bg-bg-tertiary border-b border-border-primary">
            <tr>
              <th className="px-4 py-2 text-left font-semibold text-text-primary"></th>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">requireRole</th>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">requirePermission</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-border-primary">
              <td className="px-4 py-2 font-semibold text-text-primary">Logic</td>
              <td className="px-4 py-2"><strong>OR</strong> (any one is sufficient)</td>
              <td className="px-4 py-2"><strong>AND</strong> (all required)</td>
            </tr>
            <tr className="border-b border-border-primary">
              <td className="px-4 py-2 font-semibold text-text-primary">Default field</td>
              <td className="px-4 py-2"><code>user.role</code> / <code>user.roles</code></td>
              <td className="px-4 py-2"><code>user.permissions</code></td>
            </tr>
            <tr className="border-b border-border-primary">
              <td className="px-4 py-2 font-semibold text-text-primary">Example</td>
              <td className="px-4 py-2"><code>requireRole(&quot;admin&quot;, &quot;moderator&quot;)</code></td>
              <td className="px-4 py-2"><code>requirePermission(&quot;posts:create&quot;, &quot;posts:publish&quot;)</code></td>
            </tr>
          </tbody>
        </table>
      </div>

      <Heading level={2} className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2">
        Expected JWT Payload
      </Heading>
      <CodeBlock
        code={`// Default detection for requireRole:
{
  userId: 1,
  role: "admin",           // ← requireRole checks this
  roles: ["admin", "user"] // ← or this
}

// Default detection for requirePermission:
{
  userId: 1,
  permissions: ["users:delete", "posts:create"]  // ← requirePermission checks this
}`}
      />

      <Heading level={2} className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2">
        Error Responses
      </Heading>
      <div className="my-4 overflow-x-auto">
        <table className="w-full text-sm text-text-secondary border border-border-primary rounded-lg overflow-hidden">
          <thead className="bg-bg-tertiary border-b border-border-primary">
            <tr>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">Status</th>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">Message</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-border-primary">
              <td className="px-4 py-2">401</td>
              <td className="px-4 py-2"><code>Authentication required</code> - ctx.user is missing</td>
            </tr>
            <tr className="border-b border-border-primary">
              <td className="px-4 py-2">403</td>
              <td className="px-4 py-2"><code>Requires one of: admin, moderator</code> - role does not match</td>
            </tr>
            <tr className="border-b border-border-primary">
              <td className="px-4 py-2">403</td>
              <td className="px-4 py-2"><code>Missing permissions: users:delete</code> - permission is missing</td>
            </tr>
          </tbody>
        </table>
      </div>

      <Heading level={2} className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2">
        Next Steps
      </Heading>
      <ul className="my-3 ml-6 list-disc text-text-secondary space-y-1">
        <li><a href="/docs/auth" className="text-accent hover:underline">Authentication</a> - JWT authentication</li>
        <li><a href="/docs/middleware" className="text-accent hover:underline">Middleware</a> - Learn about middleware</li>
      </ul>
    </div>
  );
}
