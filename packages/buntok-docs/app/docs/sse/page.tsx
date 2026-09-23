import { Heading } from "@/components/ui/Heading";
import { CodeBlock } from "@/components/ui/CodeBlock";
import { Callout } from "@/components/ui/Callout";

export const metadata = {
  title: "Server-Sent Events",
  description: "Stream real-time updates to clients with SSE helpers.",
};


export default function SSEPage() {
  return (
    <div>
      <Heading
        level={1}
        className="text-4xl font-bold mt-8 mb-4 text-text-primary"
      >
        Server-Sent Events
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Real-time streaming from server to client using SSE. One-way
        communication from server to browser - ideal for live updates, progress
        bars, and AI streaming.
      </p>

      <Callout type="info">
        SSE uses a single persistent HTTP connection. Unlike WebSocket, SSE is
        simpler, works over standard HTTP, and automatically reconnects.
      </Callout>

      {/* ──────────────── BASIC USAGE ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Basic Usage
      </Heading>
      <CodeBlock
        code={`app.get("/events", (ctx) => {
  return ctx.sse(async (sse) => {
    sse.sendData("Connected!");

    // Send a named event
    sse.sendEvent("update", { count: 42 });

    // Listen for client disconnect
    sse.onClose(() => {
      console.log("Client disconnected");
    });
  });
});`}
      />

      {/* ──────────────── SSE API ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        SSE API
      </Heading>
      <div className="my-4 overflow-x-auto">
        <table className="w-full text-sm text-text-secondary border border-border-primary rounded-lg overflow-hidden">
          <thead className="bg-bg-tertiary border-b border-border-primary">
            <tr>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Method
              </th>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Description
              </th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-border-primary">
              <td className="px-4 py-2 font-mono text-accent">
                sse.sendData(data)
              </td>
              <td className="px-4 py-2">Send raw data as a string</td>
            </tr>
            <tr className="border-b border-border-primary">
              <td className="px-4 py-2 font-mono text-accent">
                sse.sendEvent(event, data)
              </td>
              <td className="px-4 py-2">
                Send a named event with data (data is JSON-serialized)
              </td>
            </tr>
            <tr className="border-b border-border-primary">
              <td className="px-4 py-2 font-mono text-accent">
                sse.send(message)
              </td>
              <td className="px-4 py-2">
                Send a full SSEMessage object with optional id, event, and data
              </td>
            </tr>
            <tr className="border-b border-border-primary">
              <td className="px-4 py-2 font-mono text-accent">
                sse.sendWithId(id, data)
              </td>
              <td className="px-4 py-2">
                Send data with an explicit event ID (for resumption support)
              </td>
            </tr>
            <tr className="border-b border-border-primary">
              <td className="px-4 py-2 font-mono text-accent">
                sse.getLastEventId()
              </td>
              <td className="px-4 py-2">
                Get the Last-Event-ID header value from the client
              </td>
            </tr>
            <tr className="border-b border-border-primary">
              <td className="px-4 py-2 font-mono text-accent">sse.close()</td>
              <td className="px-4 py-2">Close the SSE connection</td>
            </tr>
            <tr className="border-b border-border-primary">
              <td className="px-4 py-2 font-mono text-accent">
                sse.onClose(callback)
              </td>
              <td className="px-4 py-2">Register a close handler</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ──────────────── OPTIONS ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Options
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
                Default
              </th>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Description
              </th>
            </tr>
          </thead>
          <tbody>
            {[
              [
                "sendInitial",
                "boolean",
                "true",
                'Send initial "connected" event',
              ],
              [
                "initialEvent",
                "string",
                '"connected"',
                "Custom event name for initial",
              ],
              [
                "retry",
                "number",
                "undefined",
                "Client reconnection timeout (ms)",
              ],
              [
                "maxConnections",
                "number",
                "0 (unlimited)",
                "Max concurrent SSE connections. Returns 503 when exceeded.",
              ],
              [
                "onReconnect",
                "(lastEventId: string) => Promise<SSEMessage[]>",
                "undefined",
                "Callback to replay missed events on reconnection",
              ],
            ].map(([opt, type, def, desc]) => (
              <tr
                key={opt}
                className="border-b border-border-primary/50 hover:bg-bg-tertiary/50 transition-colors"
              >
                <td className="px-4 py-2 font-mono text-accent">{opt}</td>
                <td className="px-4 py-2 font-mono text-text-secondary">
                  {type}
                </td>
                <td className="px-4 py-2 font-mono text-text-secondary">
                  {def}
                </td>
                <td className="px-4 py-2">{desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <CodeBlock
        code={`app.get("/events", (ctx) => {
  return ctx.sse(async (sse) => {
    // No auto "connected" event, retry every 5s
  }, {
    sendInitial: false,
    retry: 5000,
  });
});`}
      />

      {/* ──────────────── RECONNECTION SUPPORT ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Reconnection Support
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Use <code>onReconnect</code> to replay missed events when a client
        reconnects with a <code>Last-Event-ID</code> header:
      </p>
      <CodeBlock
        code={`// Store event history (in production, use Redis or database)
const eventHistory: SSEMessage[][] = [];

app.get("/events", (ctx) => {
  return ctx.sse(async (sse) => {
    // Send current state
    sse.sendEvent("state", { count: 42 });

    // Listen for updates
    emitter.on("update", (data) => {
      const message = { id: Date.now(), event: "update", data };
      sse.send(message);
      eventHistory.push([message]);
    });
  }, {
    onReconnect: async (lastEventId) => {
      // Return missed events since lastEventId
      return eventHistory
        .flat()
        .filter(msg => msg.id && msg.id > Number(lastEventId));
    },
  });
});`}
      />

      {/* ──────────────── CONNECTION LIMITS ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Connection Limits
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Limit concurrent connections to prevent resource exhaustion:
      </p>
      <CodeBlock
        code={`app.get("/events", (ctx) => {
  return ctx.sse(async (sse) => {
    // Handle events
  }, {
    maxConnections: 100, // Limit to 100 concurrent connections
  });
});

// Check active connections
console.log("Active connections:", SSE.activeConnections);`}
      />

      {/* ──────────────── BROADCASTING ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Broadcasting
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Use <code>SSEBroadcaster</code> to manage multiple connections and
        broadcast to all clients:
      </p>
      <CodeBlock
        code={`import { SSEBroadcaster } from "@buntok/core";

const broadcaster = new SSEBroadcaster();

app.get("/events", (ctx) => {
  return ctx.sse(async (sse) => {
    broadcaster.add(sse);

    sse.onClose(() => {
      broadcaster.remove(sse);
    });

    // Keep connection alive
    await new Promise(() => {});
  });
});

// Broadcast to all clients
broadcaster.broadcast("update", { count: 42 });

// Broadcast with filter
broadcaster.broadcastWhere(
  (sse) => sse.isConnected,
  "notification",
  { message: "Hello!" }
);

// Check connected clients
console.log("Connected clients:", broadcaster.size);`}
      />

      {/* ──────────────── NAMED EVENTS ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Named Events
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Use named events so clients can listen for specific event types:
      </p>
      <CodeBlock
        code={`// Server
app.get("/notifications", (ctx) => {
  return ctx.sse(async (sse) => {
    emitter.on("user:created", (user) => {
      sse.sendEvent("user-created", user);
    });
    emitter.on("order:placed", (order) => {
      sse.sendEvent("order-placed", order);
    });
  });
});

// Client
const es = new EventSource("/notifications");
es.addEventListener("user-created", (e) => {
  const user = JSON.parse(e.data);
  console.log("New user:", user);
});
es.addEventListener("order-placed", (e) => {
  const order = JSON.parse(e.data);
  console.log("New order:", order);
});`}
      />

      {/* ──────────────── AI STREAMING ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        AI Streaming
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Stream AI responses token-by-token:
      </p>
      <CodeBlock
        code={`import { streamAI } from "@buntok/core";

app.post("/chat", async (ctx) => {
  const { message } = await ctx.body();

  return ctx.sse(async (sse) => {
    await streamAI({
      messages: [{ role: "user", content: message }],
      onChunk: (chunk) => {
        sse.sendEvent("chunk", { content: chunk });
      },
      onDone: () => {
        sse.sendEvent("done", { message: "Complete" });
        sse.close();
      },
    });
  });
});`}
      />

      {/* ──────────────── LIVE UPDATES ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Live Updates
      </Heading>
      <CodeBlock
        code={`// Push real-time data to clients
app.get("/live/metrics", (ctx) => {
  return ctx.sse(async (sse) => {
    const interval = setInterval(async () => {
      const metrics = await getMetrics();
      sse.sendEvent("metrics", metrics);
    }, 5000);

    sse.onClose(() => {
      clearInterval(interval);
    });
  });
});`}
      />

      {/* ──────────────── COMPARISON ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        SSE vs WebSocket
      </Heading>
      <div className="my-4 overflow-x-auto">
        <table className="w-full text-sm text-text-secondary border border-border-primary rounded-lg overflow-hidden">
          <thead className="bg-bg-tertiary border-b border-border-primary">
            <tr>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Feature
              </th>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                SSE
              </th>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                WebSocket
              </th>
            </tr>
          </thead>
          <tbody>
            {[
              ["Direction", "Server → Client", "Bidirectional"],
              ["Protocol", "HTTP", "ws:// / wss://"],
              ["Auto-reconnect", "Yes", "No (manual)"],
              ["Binary data", "No", "Yes"],
              ["Complexity", "Simple", "Moderate"],
              ["Use case", "Live feeds, notifications, AI", "Chat, games, collaboration"],
            ].map(([feature, sse, ws]) => (
              <tr
                key={feature}
                className="border-b border-border-primary/50 hover:bg-bg-tertiary/50 transition-colors"
              >
                <td className="px-4 py-2 font-semibold text-text-primary">
                  {feature}
                </td>
                <td className="px-4 py-2">{sse}</td>
                <td className="px-4 py-2">{ws}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ──────────────── PLUGGABLE INFRASTRUCTURE ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Pluggable Infrastructure
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        For production cluster deployments (multiple instances), replace in-memory PubSub and history with pluggable stores.
      </p>
      <CodeBlock
        code={`import {
  SSEBroadcaster,
  MemorySSEPubSub,     // default in-memory PubSub
  MemorySSEHistory,    // default in-memory ring buffer (1000 msg)
} from "@buntok/core";

// Default (single instance)
const broadcaster = new SSEBroadcaster();

// Custom (e.g., Redis-backed for multi-instance)
const broadcaster = new SSEBroadcaster({
  pubSub: redisPubSub,      // implements SSEPubSub interface
  historyStore: redisHistory, // implements SSEHistoryStore interface
  channel: "events",        // pub/sub channel name
});`}
      />

      <div className="my-4 overflow-x-auto">
        <table className="w-full text-sm text-text-secondary border border-border-primary rounded-lg overflow-hidden">
          <thead className="bg-bg-tertiary border-b border-border-primary">
            <tr>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Interface
              </th>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Methods
              </th>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Default
              </th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-border-primary/50 hover:bg-bg-tertiary/50 transition-colors">
              <td className="px-4 py-2 font-mono text-accent">SSEPubSub</td>
              <td className="px-4 py-2 font-mono text-xs">publish, subscribe, unsubscribe</td>
              <td className="px-4 py-2">MemorySSEPubSub</td>
            </tr>
            <tr className="border-b border-border-primary/50 hover:bg-bg-tertiary/50 transition-colors">
              <td className="px-4 py-2 font-mono text-accent">SSEHistoryStore</td>
              <td className="px-4 py-2 font-mono text-xs">add, getAfter, clear</td>
              <td className="px-4 py-2">MemorySSEHistory (1000 msg ring buffer)</td>
            </tr>
          </tbody>
        </table>
      </div>

      <Callout type="info">
        Additional SSE methods: <code>sse.sendComment(comment)</code> for custom heartbeats, <code>sse.offClose(callback)</code> to unregister close handlers, and <code>SSE.closeAll()</code> to gracefully close all connections.
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
          <a href="/docs/websocket" className="text-accent hover:underline">
            WebSocket
          </a>{" "}
          - Bidirectional real-time communication
        </li>
        <li>
          <a href="/docs/ai" className="text-accent hover:underline">
            AI Module
          </a>{" "}
          - AI streaming with SSE
        </li>
        <li>
          <a href="/docs/emitter" className="text-accent hover:underline">
            Event Emitter
          </a>{" "}
          - Decouple code with events
        </li>
      </ul>
    </div>
  );
}
