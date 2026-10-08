import { Heading } from "@/components/ui/Heading";
import { CodeBlock } from "@/components/ui/CodeBlock";
import { Callout } from "@/components/ui/Callout";

export const metadata = {
  title: "Client SDK - BunTok",
  description: "Type-safe RPC client with retry, timeout, and interceptors.",
};

export default function ClientPage() {
  return (
    <>
      <Heading level={1}>Client SDK</Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Type-safe RPC client for calling your API from the frontend or other services. Define route
        contracts once, get full type inference everywhere.
      </p>

      <Heading level={2} className="text-xl font-semibold mt-8 mb-3 text-text-primary">
        Imports
      </Heading>
      <CodeBlock
        language="typescript"
        code={`import { createClient } from "@buntok/core/client";
import type { RouteContract } from "@buntok/core/client";`}
      />

      <Heading level={2} className="text-xl font-semibold mt-8 mb-3 text-text-primary">
        Define Contracts
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Each route is declared as a <code>RouteContract&lt;Params, Query, Body, Response&gt;</code>:
      </p>
      <CodeBlock
        language="typescript"
        code={`const routes = {
  getUser: {
    method: "GET",
    path: "/users/:id",
  } as RouteContract<
    { id: string },              // params
    undefined,                   // query
    undefined,                   // body
    { id: string; name: string } // response
  >,

  listUsers: {
    method: "GET",
    path: "/users",
  } as RouteContract<
    undefined,
    { page?: number; limit?: number },  // query
    undefined,
    { data: { id: string; name: string }[]; total: number }
  >,

  createUser: {
    method: "POST",
    path: "/users",
  } as RouteContract<
    undefined,
    undefined,
    { name: string; email: string },  // body
    { id: string; name: string }
  >,
};`}
      />

      <Heading level={2} className="text-xl font-semibold mt-8 mb-3 text-text-primary">
        Create Client
      </Heading>
      <CodeBlock
        language="typescript"
        code={`const api = createClient(routes, "http://localhost:1212");

// Fully typed - params, body, and return type are all inferred
const user = await api.getUser({ params: { id: "1" } });
// user: { id: string; name: string }

const list = await api.listUsers({ query: { page: 2, limit: 10 } });
// list: { data: { id: string; name: string }[]; total: number }

const created = await api.createUser({
  body: { name: "Tok", email: "tok@example.com" },
});
// created: { id: string; name: string }`}
      />

      <Heading level={2} className="text-xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2">
        Options
      </Heading>
      <div className="my-4 overflow-x-auto">
        <table className="w-full text-sm text-text-secondary border border-border-primary rounded-lg overflow-hidden">
          <thead className="bg-bg-tertiary border-b border-border-primary">
            <tr>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">Option</th>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">Type</th>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">Default</th>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">Description</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-border-primary">
              <td className="px-4 py-2 font-mono text-accent">headers</td>
              <td className="px-4 py-2 font-mono text-xs">Record&lt;string, string&gt;</td>
              <td className="px-4 py-2">-</td>
              <td className="px-4 py-2">Headers sent on every request</td>
            </tr>
            <tr className="border-b border-border-primary">
              <td className="px-4 py-2 font-mono text-accent">timeout</td>
              <td className="px-4 py-2 font-mono text-xs">number</td>
              <td className="px-4 py-2">30000</td>
              <td className="px-4 py-2">Request timeout in ms</td>
            </tr>
            <tr className="border-b border-border-primary">
              <td className="px-4 py-2 font-mono text-accent">retries</td>
              <td className="px-4 py-2 font-mono text-xs">number</td>
              <td className="px-4 py-2">0</td>
              <td className="px-4 py-2">Number of retry attempts</td>
            </tr>
            <tr className="border-b border-border-primary">
              <td className="px-4 py-2 font-mono text-accent">retryDelay</td>
              <td className="px-4 py-2 font-mono text-xs">number</td>
              <td className="px-4 py-2">1000</td>
              <td className="px-4 py-2">Delay between retries in ms</td>
            </tr>
            <tr className="border-b border-border-primary">
              <td className="px-4 py-2 font-mono text-accent">retryOn</td>
              <td className="px-4 py-2 font-mono text-xs">number[]</td>
              <td className="px-4 py-2">[408, 429, 500, 502, 503, 504]</td>
              <td className="px-4 py-2">Status codes to retry on</td>
            </tr>
            <tr className="border-b border-border-primary">
              <td className="px-4 py-2 font-mono text-accent">onRequest</td>
              <td className="px-4 py-2 font-mono text-xs">(req) =&gt; Request</td>
              <td className="px-4 py-2">-</td>
              <td className="px-4 py-2">Request interceptor</td>
            </tr>
            <tr className="border-b border-border-primary">
              <td className="px-4 py-2 font-mono text-accent">onResponse</td>
              <td className="px-4 py-2 font-mono text-xs">(res) =&gt; Response</td>
              <td className="px-4 py-2">-</td>
              <td className="px-4 py-2">Response interceptor</td>
            </tr>
            <tr className="border-b border-border-primary">
              <td className="px-4 py-2 font-mono text-accent">fetch</td>
              <td className="px-4 py-2 font-mono text-xs">typeof fetch</td>
              <td className="px-4 py-2">globalThis.fetch</td>
              <td className="px-4 py-2">Override fetch (useful for testing)</td>
            </tr>
          </tbody>
        </table>
      </div>

      <Heading level={2} className="text-xl font-semibold mt-8 mb-3 text-text-primary">
        ClientError
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Typed error thrown when a request fails (non-2xx status or network error):
      </p>
      <CodeBlock
        language="typescript"
        code={`import { ClientError } from "@buntok/core/client";

try {
  await api.getUser({ params: { id: "999" } });
} catch (err) {
  if (err instanceof ClientError) {
    console.log(err.status);  // 404
    console.log(err.method);  // "GET"
    console.log(err.path);    // "/users/999"
    console.log(err.body);    // response body (string or null)
    console.log(err.message); // "GET /users/999 failed with status 404"
  }
}`}
      />

      <Heading level={2} className="text-xl font-semibold mt-8 mb-3 text-text-primary">
        How It Works
      </Heading>
      <ol className="my-3 text-text-secondary leading-relaxed list-decimal list-inside space-y-1">
        <li>
          <code>createClient()</code> iterates over contract keys and creates typed functions
        </li>
        <li>Each function:</li>
        <ul className="ml-6 list-disc list-inside space-y-1">
          <li>Substitutes <code>:params</code> in the path (e.g. <code>/users/:id</code> → <code>/users/1</code>)</li>
          <li>Appends <code>?query</code> params to URL</li>
          <li>Serializes <code>body</code> as JSON</li>
          <li>Adds <code>Content-Type: application/json</code> header if body present</li>
          <li>Applies <code>onRequest</code> interceptor before fetch</li>
          <li>Applies <code>onResponse</code> interceptor after fetch</li>
          <li>Retries on failure if <code>retries &gt; 0</code> and status matches <code>retryOn</code></li>
          <li>Parses response as JSON or text based on Content-Type</li>
          <li>Throws <code>ClientError</code> on non-2xx if not retryable</li>
        </ul>
      </ol>

      <Heading level={2} className="text-xl font-semibold mt-8 mb-3 text-text-primary">
        RouteContract Type
      </Heading>
      <CodeBlock
        language="typescript"
        code={`interface RouteContract<
  TParams = undefined,   // URL params (e.g. { id: string })
  TQuery = undefined,    // Query params (e.g. { page?: number })
  TBody = undefined,     // Request body (e.g. { name: string })
  TResponse = unknown,   // Response type
> {
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "OPTIONS";
  path: string;          // e.g. "/users/:id"
  params?: TParams;      // type-only, never read at runtime
  query?: TQuery;
  body?: TBody;
  response?: TResponse;
}`}
      />

      <Callout type="info">
        The <code>RouteContract</code> type is type-only - <code>params</code>, <code>query</code>,{" "}
        <code>body</code>, and <code>response</code> fields are never read at runtime. They only
        exist for TypeScript inference.
      </Callout>
    </>
  );
}
