import { Heading } from "@/components/ui/Heading";
import { CodeBlock } from "@/components/ui/CodeBlock";
import { Callout } from "@/components/ui/Callout";

export const metadata = {
  title: "Authentication",
  description: "Implement JWT authentication with header or cookie-based token storage.",
};


export default function AuthPage() {
  return (
    <div>
      <Heading level={1} className="text-4xl font-bold mt-8 mb-4 text-text-primary">Authentication</Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Buntok provides a zero-dependency JWT implementation using WebCrypto (built-in). Supports HMAC-SHA256 with expiration, Bearer tokens, and HttpOnly cookies.
      </p>

      <Callout type="info">
        No additional packages needed! JWT is already included in <code>@buntok/core</code>.
      </Callout>

      <Heading level={2} className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2">
        JwtService
      </Heading>

      <Heading level={3} className="text-xl font-semibold mt-6 mb-2 text-text-primary">Creating Instance</Heading>
      <CodeBlock
        code={`import { JwtService } from "@buntok/core";

const jwt = new JwtService("your-secret-key");`}
      />

      <Heading level={3} className="text-xl font-semibold mt-6 mb-2 text-text-primary">Sign Token</Heading>
      <CodeBlock
        code={`// Sign token (expires in 1 hour)
const token = await jwt.sign(
  { userId: 1, role: "admin" },
  3600  // seconds
);

// Sign token (expires in 7 days)
const token = await jwt.sign(
  { userId: 1, role: "user" },
  7 * 24 * 60 * 60
);`}
      />

      <Heading level={3} className="text-xl font-semibold mt-6 mb-2 text-text-primary">Verify Token</Heading>
      <CodeBlock
        code={`const payload = await jwt.verify(token);
// { userId: 1, role: "admin", exp: 1700000000 } or null if invalid

// Handle expired/invalid token
const payload = await jwt.verify(token);
if (!payload) {
  // Token is invalid or expired
}`}
      />

      <Heading level={2} className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2">
        requireAuth Middleware
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Extracts and verifies JWT from cookie or Authorization header. Injects the payload into <code>ctx.user</code>.
      </p>

      <CodeBlock
        code={`import { requireAuth } from "@buntok/core";

const secret = "your-secret-key";

// Basic usage
app.get("/protected", requireAuth(secret), (ctx) => {
  const user = ctx.user as { userId: number; role: string };
  return ctx.json({ user });
});`}
      />

      <Heading level={2} className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2">
        Cookie-based Auth
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Set <code>AUTH_COOKIE</code> in your <code>.env</code> to enable cookie-based authentication. When set, <code>requireAuth</code> reads JWT from that cookie first, then falls back to the Authorization header.
      </p>

      <Heading level={3} className="text-xl font-semibold mt-6 mb-2 text-text-primary">Setup</Heading>
      <CodeBlock
        code={`# .env (created by buntok init)
AUTH_STORE=cookie
AUTH_COOKIE=session`}
      />

      <Heading level={3} className="text-xl font-semibold mt-6 mb-2 text-text-primary">Login Flow</Heading>
      <CodeBlock
        code={`import { App } from "@buntok/core";
import { JwtService } from "@buntok/core";
import { setCookie, deleteCookie } from "@buntok/core";

const jwt = new JwtService(process.env.JWT_SECRET!);

// Login endpoint - set HttpOnly cookie
app.post("/login", async (ctx) => {
  const { email, password } = await ctx.body();

  const user = await db.user.findUnique({ where: { email } });
  if (!user || !await verifyPassword(password, user.password)) {
    return ctx.json({ error: "Invalid credentials" }, 401);
  }

  const token = await jwt.sign(
    { userId: user.id, role: user.role },
    86400  // 24 hours
  );

  // Set HttpOnly cookie (read by requireAuth automatically)
  const response = ctx.json({ success: true });
  return setCookie(response, process.env.AUTH_COOKIE!, token, {
    httpOnly: true,
    secure: true,       // HTTPS only
    sameSite: "lax",
    path: "/",
    maxAge: 86400,      // 24 hours
  });
});

// Logout endpoint - clear cookie
app.post("/logout", (ctx) => {
  const response = ctx.json({ success: true });
  return deleteCookie(response, process.env.AUTH_COOKIE!, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
  });
});`}
      />

      <Callout type="info">
        When <code>AUTH_STORE=cookie</code>, <code>requireAuth</code> reads JWT from the HttpOnly cookie named in <code>AUTH_COOKIE</code>. Falls back to <code>Authorization: Bearer &lt;token&gt;</code> if cookie is missing.
      </Callout>

      <Heading level={3} className="text-xl font-semibold mt-6 mb-2 text-text-primary">How It Works</Heading>
      <div className="my-4 overflow-x-auto">
        <table className="w-full text-sm text-text-secondary border border-border-primary rounded-lg overflow-hidden">
          <thead className="bg-bg-tertiary border-b border-border-primary">
            <tr>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">Env Variable</th>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">Default</th>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">Description</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-border-primary">
              <td className="px-4 py-2 font-mono text-accent">AUTH_STORE</td>
              <td className="px-4 py-2"><code>header</code></td>
              <td className="px-4 py-2">Where to read JWT: <code>header</code> or <code>cookie</code></td>
            </tr>
            <tr>
              <td className="px-4 py-2 font-mono text-accent">AUTH_COOKIE</td>
              <td className="px-4 py-2"><code>session</code></td>
              <td className="px-4 py-2">Cookie name (only used when <code>AUTH_STORE=cookie</code>)</td>
            </tr>
          </tbody>
        </table>
      </div>

      <Heading level={2} className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2">
        Bearer Token (Header)
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        The client can also send the token in the <code>Authorization</code> header:
      </p>

      <CodeBlock
        code={`// HTTP Header
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...

// Example with fetch
const response = await fetch("/api/profile", {
  headers: {
    "Authorization": \`Bearer \${token}\`,
  },
});`}
      />

      <Heading level={2} className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2">
        Example: Login Flow
      </Heading>
      <CodeBlock
        code={`import { App } from "@buntok/core";
import { JwtService, requireAuth } from "@buntok/core";

const jwt = new JwtService(process.env.JWT_SECRET!);

// Login endpoint
app.post("/login", async (ctx) => {
  const { email, password } = await ctx.body();

  // Find user in database
  const user = await db.user.findUnique({ where: { email } });
  if (!user || !await verifyPassword(password, user.password)) {
    return ctx.json({ error: "Invalid credentials" }, 401);
  }

  // Generate token
  const token = await jwt.sign(
    { userId: user.id, role: user.role },
    86400  // 24 hours
  );

  return ctx.json({ token });
});

// Protected endpoint
app.get("/profile", requireAuth(secret), async (ctx) => {
  const { userId } = ctx.user as { userId: number };

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true },
  });

  return ctx.json({ user });
});`}
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
              <th className="px-4 py-2 text-left font-semibold text-text-primary">Condition</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-border-primary">
              <td className="px-4 py-2">401</td>
              <td className="px-4 py-2"><code>Missing or invalid authentication token</code></td>
              <td className="px-4 py-2">No token found in cookie or Authorization header</td>
            </tr>
            <tr className="border-b border-border-primary">
              <td className="px-4 py-2">401</td>
              <td className="px-4 py-2"><code>Token is invalid or expired</code></td>
              <td className="px-4 py-2">Token has expired or is invalid</td>
            </tr>
          </tbody>
        </table>
      </div>

      <Heading level={2} className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2">
        Best Practices
      </Heading>
      <ul className="my-3 ml-6 list-disc text-text-secondary space-y-1">
        <li>Store JWT_SECRET in environment variables, not in code</li>
        <li>Use appropriate expiration times (1 hour for access tokens, 7 days for refresh tokens)</li>
        <li>Always use HTTPS in production</li>
        <li>Use <code>httpOnly: true</code> for cookies to prevent XSS attacks</li>
        <li>Use <code>sameSite: "lax"</code> or <code>"strict"</code> for CSRF protection</li>
        <li>Use <a href="/docs/rbac" className="text-accent hover:underline">RBAC</a> for role-based access control</li>
      </ul>

      <Heading level={2} className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2">
        Next Steps
      </Heading>
      <ul className="my-3 ml-6 list-disc text-text-secondary space-y-1">
        <li><a href="/docs/rbac" className="text-accent hover:underline">RBAC</a> - Role-based access control</li>
        <li><a href="/docs/middleware" className="text-accent hover:underline">Middleware</a> - Learn about middleware</li>
      </ul>
    </div>
  );
}
