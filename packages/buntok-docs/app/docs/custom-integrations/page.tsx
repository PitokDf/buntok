import { Heading } from "@/components/ui/Heading";
import { CodeBlock } from "@/components/ui/CodeBlock";
import { Callout } from "@/components/ui/Callout";

export const metadata = {
  title: "Custom Integrations",
  description:
    "Mount third-party HTTP and WebSocket handlers on the same Bun server with app.integrate.",
};

export default function CustomIntegrationsPage() {
  return (
    <div>
      <Heading
        level={1}
        className="text-4xl font-bold mt-8 mb-4 text-text-primary"
      >
        Custom Integrations
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        <code>app.integrate()</code> mounts a raw Bun handler at one exact
        pathname on the same server as Buntok. It is not Socket.IO-specific - it
        works for any library or handler that exposes Bun&apos;s{" "}
        <code>(request, server) =&gt; Response</code> contract, with an optional
        WebSocket handler.
      </p>

      <Callout type="info">
        Use <code>app.integrate()</code> for third-party handlers that need the
        live <code>Bun.Server</code> (WebSocket upgrades, polling transports,
        raw proxies). For normal HTTP endpoints, prefer{" "}
        <code>app.get()</code>, <code>app.group()</code>, and{" "}
        <code>app.static()</code>.
      </Callout>

      {/* ──────────────── CONTRACT ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Contract
      </Heading>
      <div className="my-4 overflow-x-auto">
        <table className="w-full text-sm text-text-secondary border border-border-primary rounded-lg overflow-hidden">
          <thead className="bg-bg-tertiary border-b border-border-primary">
            <tr>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Option
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
            {[
              [
                "path",
                "string",
                "Exact pathname to intercept, e.g. /socket.io/ (required)",
              ],
              [
                "label",
                "string",
                "Human-readable name shown in the startup banner",
              ],
              [
                "fetch",
                "(request, server) => Response | Promise<Response>",
                "Raw Bun request handler (required); runs before router/middleware",
              ],
              [
                "websocket",
                "Record<string, unknown>",
                "Bun WebSocket handler for connections upgraded by this integration",
              ],
              [
                "serve",
                "Record<string, unknown>",
                "Extra Bun.serve options merged at listen(); fetch, websocket, routes, and port are ignored",
              ],
            ].map(([opt, type, desc]) => (
              <tr
                key={opt}
                className="border-b border-border-primary/50 hover:bg-bg-tertiary/50 transition-colors"
              >
                <td className="px-4 py-2 font-mono text-accent">{opt}</td>
                <td className="px-4 py-2 font-mono text-xs">{type}</td>
                <td className="px-4 py-2">{desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ──────────────── HTTP ONLY ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        HTTP-only Handler
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        The integration owns every method on its pathname. Middleware, Buntok
        context, and the AOT router are bypassed:
      </p>
      <CodeBlock
        code={`app.integrate({
  path: "/vendor/health/",
  label: "Vendor Health",
  fetch: () => new Response("ok", {
    headers: { "Content-Type": "text/plain" },
  }),
});

// GET /vendor/health/ → "ok"
// POST /vendor/health/ → also handled by the integration`}
      />

      {/* ──────────────── WEBSOCKET ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        HTTP + WebSocket
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        When the integration upgrades a connection via{" "}
        <code>server.upgrade()</code>, its <code>websocket</code> handler
        receives the connection. Buntok&apos;s <code>app.ws()</code> routes keep
        working at the same time - connections are separated by the{" "}
        <code>handler</code> marker Buntok attaches during upgrade:
      </p>
      <CodeBlock
        code={`app.integrate({
  path: "/custom-ws/",
  label: "Custom WS",
  fetch: (request, server) => {
    const upgraded = server.upgrade(request, {
      data: { source: "custom" },
    });
    return upgraded
      ? undefined as unknown as Response
      : new Response("Upgrade Required", { status: 426 });
  },
  websocket: {
    open(ws) {
      ws.send("custom connected");
    },
    message(ws, message) {
      ws.send(message);
    },
  },
  serve: { idleTimeout: 30 },
});

// Still works - Buntok routes its own WebSocket connections.
app.ws("/chat", {
  open(ws) {
    ws.send("buntok connected");
  },
});`}
      />

      <Callout type="warning">
        Only <strong>one</strong> third-party WebSocket handler can be mounted.
        Bun has a single global <code>websocket</code> handler; Buntok composes
        that one handler with <code>app.ws()</code> and throws at startup if
        more than one integration provides <code>websocket</code>.
      </Callout>

      {/* ──────────────── SOCKET.IO ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Socket.IO
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        For Socket.IO, use the official{" "}
        <a href="/docs/websocket" className="text-accent hover:underline">
          socketIOPlugin
        </a>{" "}
        instead of wiring the engine manually. The plugin calls{" "}
        <code>app.integrate()</code> for both the polling transport and the
        WebSocket handler.
      </p>
      <CodeBlock
        code={`import { Buntok } from "@buntok/core";
import { socketIOPlugin } from "@buntok/core/plugins/socket-io";
import { Server } from "socket.io";

const app = new Buntok();
const io = new Server();

await app.plugin(socketIOPlugin({ io }));
app.listen(1212);`}
      />
      <p className="my-3 text-text-secondary leading-relaxed">
        The startup banner prints the mount path:
      </p>
      <CodeBlock
        language="bash"
        code={`Buntok v2.2.4 ready in 5ms

Environment:  development
Listening on: http://localhost:1212
Socket.IO:    http://localhost:1212/socket.io/`}
      />

      {/* ──────────────── USE CASES ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Common Use Cases
      </Heading>
      <ul className="my-3 ml-6 list-disc text-text-secondary space-y-1">
        <li>Socket.IO / Engine.IO via <code>@socket.io/bun-engine</code></li>
        <li>
          GraphQL subscriptions or other WebSocket protocols with a Bun
          adapter
        </li>
        <li>
          Raw webhook receivers that need the original request/response cycle
        </li>
        <li>
          Streaming proxies and third-party handlers that expose{" "}
          <code>(request, server) =&gt; Response</code>
        </li>
        <li>
          Vendor health checks or internal diagnostics mounted at a dedicated
          path
        </li>
      </ul>

      {/* ──────────────── LIMITATIONS ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Limitations
      </Heading>
      <ul className="my-3 ml-6 list-disc text-text-secondary space-y-1">
        <li>
          <strong>Exact pathname only</strong> - no prefix, params, wildcard, or
          catch-all. Mount multiple integrations for multiple paths.
        </li>
        <li>
          <strong>Bypasses Buntok</strong> - no middleware, auth,{" "}
          <code>ctx</code>, DI, request logging, error handler, or lifecycle
          hooks. The integration must handle its own errors.
        </li>
        <li>
          <strong>Needs a live server</strong> - integrations are skipped in
          serverless dispatch such as <code>app.fetch(request)</code> without a{" "}
          <code>server</code> argument.
        </li>
        <li>
          <strong>Serve options are merged at listen time</strong> - adding an
          integration after <code>listen()</code> refreshes its WebSocket
          handler and routes, but not immutable serve options.
        </li>
      </ul>

      <Callout type="info">
        When in doubt, implement the endpoint as a normal Buntok route. Reach
        for <code>app.integrate()</code> only when a third-party handler needs
        raw access to the Bun server or owns its own protocol lifecycle.
      </Callout>
    </div>
  );
}
