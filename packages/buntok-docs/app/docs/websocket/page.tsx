import { Heading } from "@/components/ui/Heading";
import { CodeBlock } from "@/components/ui/CodeBlock";
import { Callout } from "@/components/ui/Callout";

export const metadata = {
  title: "WebSocket",
  description: "Handle WebSocket connections with rooms, pub/sub, and typed messages.",
};


export default function WebSocketPage() {
  return (
    <div>
      <Heading
        level={1}
        className="text-4xl font-bold mt-8 mb-4 text-text-primary"
      >
        WebSocket
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Bidirectional real-time communication backed by Bun's native WebSocket
        server. No polyfills or extra abstraction - direct access to{" "}
        <code>Bun.serve</code> WebSocket.
      </p>

      <Callout type="info">
        For one-way server-to-client streaming, see{" "}
        <a href="/docs/sse" className="text-accent hover:underline">
          SSE
        </a>
        . WebSocket is best for chat, games, and collaboration where both sides
        need to send messages.
      </Callout>

      {/* ──────────────── BASIC USAGE ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Basic Usage
      </Heading>
      <CodeBlock
        code={`const app = new App();

app.ws("/chat", {
  open: (ws) => {
    console.log("Client connected");
  },
  message: (ws, message) => {
    // Echo back
    ws.send(message);
  },
  close: (ws, code, reason) => {
    console.log("Disconnected:", code, reason);
  },
});

app.listen(1212);`}
      />

      {/* ──────────────── WS HANDLER ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        WSHandler
      </Heading>
      <div className="my-4 overflow-x-auto">
        <table className="w-full text-sm text-text-secondary border border-border-primary rounded-lg overflow-hidden">
          <thead className="bg-bg-tertiary border-b border-border-primary">
            <tr>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Callback
              </th>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Signature
              </th>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                When
              </th>
            </tr>
          </thead>
          <tbody>
            {[
              [
                "open",
                "(ws) => void",
                "Client connects",
              ],
              [
                "message",
                "(ws, message: string | Buffer) => void",
                "Client sends a message",
              ],
              [
                "close",
                "(ws, code: number, reason: string) => void",
                "Client disconnects",
              ],
              [
                "drain",
                "(ws) => void",
                "Buffer is ready for more data",
              ],
              [
                "authenticate",
                "(ws) => Promise<unknown | null>",
                "Client connects (return null to reject)",
              ],
            ].map(([cb, sig, when]) => (
              <tr
                key={cb}
                className="border-b border-border-primary/50 hover:bg-bg-tertiary/50 transition-colors"
              >
                <td className="px-4 py-2 font-mono text-accent">{cb}</td>
                <td className="px-4 py-2 font-mono text-text-secondary text-xs">
                  {sig}
                </td>
                <td className="px-4 py-2">{when}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ──────────────── AUTHENTICATION ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Authentication
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        WebSocket bypasses HTTP middleware. Use the{" "}
        <code>authenticate</code> option to validate connections:
      </p>
      <CodeBlock
        code={`app.ws("/chat", {
  authenticate: async (ws) => {
    const url = new URL(ws.data.ctx.request.url);
    const token = url.searchParams.get("token");
    
    if (!token) return null; // Reject connection
    
    const user = await verifyToken(token);
    return user ? { user } : null; // Return auth data or reject
  },
  open: (ws) => {
    // ws.data.auth contains the return value from authenticate
    const { user } = ws.data.auth as { user: User };
    console.log("Authenticated:", user.name);
  },
  message: (ws, msg) => {
    const { user } = ws.data.auth as { user: User };
    // user is available here
  },
});`}
      />

      <Callout type="warning">
        If <code>authenticate</code> returns <code>null</code>, the connection is
        immediately closed with code <code>4001</code>. The <code>open</code>{" "}
        handler is never called. Always return <code>null</code> for
        unauthenticated clients.
      </Callout>

      <Heading
        level={3}
        className="text-xl font-semibold mt-6 mb-2 text-text-primary"
      >
        wsAuth Helper
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Use <code>wsAuth</code> for a composable auth pattern — it returns a{" "}
        <code>WSHandler</code> with the <code>open</code> callback wired up:
      </p>
      <CodeBlock
        code={`import { wsAuth } from "@buntok/core/ws-helpers";

app.ws("/chat", {
  ...wsAuth(async (ws) => {
    const url = new URL(ws.data.ctx.request.url);
    const token = url.searchParams.get("token");
    if (!token) return null;
    const user = await verifyToken(token);
    return user ? { user } : null;
  }),
  message: (ws, msg) => {
    // ws.data.auth is available here
    const { user } = ws.data.auth as { user: User };
  },
});`}
      />

      {/* ──────────────── MESSAGE VALIDATION ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Message Validation
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Use <code>validateWSMessage</code> with Zod to validate incoming
        messages:
      </p>
      <CodeBlock
        code={`import { z } from "@buntok/core/middlewares/validator";
import { validateWSMessage } from "@buntok/core/ws-helpers";

const messageSchema = z.object({
  type: z.enum(["chat", "ping", "join"]),
  payload: z.string().optional(),
});

app.ws("/chat", {
  message: (ws, message) => {
    const result = validateWSMessage(messageSchema, message);
    
    if (!result.success) {
      ws.send(JSON.stringify({
        error: "Invalid message",
        details: result.errors.issues,
      }));
      return;
    }
    
    // result.data is fully typed
    switch (result.data.type) {
      case "chat":
        handleChat(ws, result.data.payload);
        break;
      case "ping":
        ws.send(JSON.stringify({ type: "pong" }));
        break;
      case "join":
        handleJoin(ws, result.data.payload);
        break;
    }
  },
});`}
      />

      {/* ──────────────── ROOM MANAGEMENT ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Room Management
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Use the <code>Room</code> class for higher-level room management:
      </p>
      <CodeBlock
        code={`import { Room } from "@buntok/core/ws-helpers";

const rooms = new Map<string, Room>();

app.ws("/chat", {
  open: (ws) => {
    const roomName = ws.data.ctx.query.get("room") || "general";
    let room = rooms.get(roomName);
    
    if (!room) {
      room = new Room(roomName);
      rooms.set(roomName, room);
    }
    
    room.join(ws);
    ws.data.room = room;
    
    // Notify others
    room.broadcast({
      type: "user:joined",
      users: room.size,
    }, ws);
  },
  message: (ws, msg) => {
    const room = ws.data.room as Room;
    room.broadcast(msg, ws); // Broadcast to all except sender
  },
  close: (ws) => {
    const room = ws.data.room as Room;
    room.leave(ws);
    
    room.broadcast({
      type: "user:left",
      users: room.size,
    });
  },
});`}
      />

      <Heading
        level={3}
        className="text-xl font-semibold mt-6 mb-2 text-text-primary"
      >
        Room API
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
            {[
              ["room.join(ws)", "Add a WebSocket to the room"],
              ["room.leave(ws)", "Remove a WebSocket from the room"],
              [
                "room.broadcast(message, exclude?)",
                "Send to all members except sender",
              ],
              ["room.sendAll(message)", "Send to all members including sender"],
              ["room.getMembers()", "Get all WebSocket members as an array"],
              ["room.size", "Number of members in the room"],
              ["room.isEmpty", "Check if the room has no members"],
              ["room.has(ws)", "Check if a WebSocket is in the room"],
              [
                "room.closeAll()",
                "Close all connections and clear the room",
              ],
            ].map(([method, desc]) => (
              <tr
                key={method}
                className="border-b border-border-primary/50 hover:bg-bg-tertiary/50 transition-colors"
              >
                <td className="px-4 py-2 font-mono text-accent text-xs">
                  {method}
                </td>
                <td className="px-4 py-2">{desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ──────────────── HEARTBEAT ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Heartbeat (Ping/Pong)
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Use <code>wsHeartbeat</code> to detect stale connections:
      </p>
      <CodeBlock
        code={`import { wsHeartbeat } from "@buntok/core/ws-helpers";

app.ws("/chat", {
  ...wsHeartbeat(30_000), // 30 second interval
  open: (ws) => {
    console.log("Client connected");
  },
  message: (ws, msg) => {
    // Handle message
  },
});`}
      />

      {/* ──────────────── PUB/SUB ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Pub/Sub (Rooms)
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Bun's WebSocket supports publish/subscribe for broadcasting to groups of
        clients (rooms):
      </p>
      <CodeBlock
        code={`app.ws("/chat", {
  open: (ws) => {
    // Join a room
    ws.subscribe("general");
  },
  message: (ws, message) => {
    // Broadcast to everyone in the room
    ws.publish("general", message);
  },
  close: (ws) => {
    // Auto-unsubscribed on close
  },
});`}
      />

      <Heading
        level={3}
        className="text-xl font-semibold mt-6 mb-2 text-text-primary"
      >
        Multiple Rooms
      </Heading>
      <CodeBlock
        code={`app.ws("/chat", {
  open: (ws) => {
    ws.subscribe("room-1");
    ws.subscribe("room-2");
  },
  message: (ws, msg) => {
    // Send to specific room
    ws.publish("room-1", msg);
  },
});`}
      />

      {/* ──────────────── SERVER BROADCAST ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Server-side Broadcast
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Use <code>app.server.publish()</code> to broadcast from HTTP routes:
      </p>
      <CodeBlock
        code={`// HTTP route broadcasts to WebSocket clients
app.post("/notify", async (ctx) => {
  const { message } = await ctx.body();

  // Broadcast to all clients in "notifications" room
  app.server?.publish("notifications", JSON.stringify({
    type: "notification",
    data: message,
  }));

  return ctx.json({ sent: true });
});

// WebSocket handler subscribes to the room
app.ws("/notifications", {
  open: (ws) => ws.subscribe("notifications"),
  message: (ws, msg) => ws.publish("notifications", msg),
});`}
      />

      {/* ──────────────── BINARY DATA ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Binary Data
      </Heading>
      <CodeBlock
        code={`app.ws("/binary", {
  message: (ws, message) => {
    if (message instanceof Buffer) {
      // Handle binary data
      console.log("Received bytes:", message.length);
      ws.send(message); // Echo binary
    } else {
      // Handle text data
      ws.send(JSON.stringify({ echo: message }));
    }
  },
});`}
      />

      {/* ──────────────── CONTEXT ACCESS ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Context Access
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Each WebSocket connection has access to the HTTP request context via{" "}
        <code>ws.data</code>:
      </p>
      <CodeBlock
        code={`app.ws("/auth-ws", {
  open: (ws) => {
    // Access the HTTP request context
    const ctx = ws.data.ctx;
    const url = ctx.request.url;
    const ip = ctx.ip;
    console.log(\`New connection from \${ip} to \${url}\`);
  },
  message: (ws, message) => {
    // Access handler reference
    const handler = ws.data.handler;
  },
});`}
      />

      {/* ──────────────── GROUP WEBSOCKET ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Group WebSocket
      </Heading>
      <CodeBlock
        code={`const api = app.group("/api");

// /api/ws/notifications
api.ws("/ws/notifications", {
  open: (ws) => ws.subscribe("notifications"),
  message: (ws, msg) => ws.publish("notifications", msg),
});`}
      />

      {/* ──────────────── CHAT EXAMPLE ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Full Example: Chat Room
      </Heading>
      <CodeBlock
        code={`import { App } from "@buntok/core";

const app = new App();
const rooms = new Map<string, Set<string>>();

app.ws("/chat/:room", {
  open: (ws) => {
    const room = ws.data.ctx.params.room;
    ws.subscribe(room);

    if (!rooms.has(room)) rooms.set(room, new Set());
    rooms.get(room)!.add(ws.data.ctx.ip);

    ws.publish(room, JSON.stringify({
      type: "join",
      users: rooms.get(room)!.size,
    }));
  },
  message: (ws, message) => {
    const room = ws.data.ctx.params.room;
    ws.publish(room, JSON.stringify({
      type: "message",
      data: message,
    }));
  },
  close: (ws, code) => {
    const room = ws.data.ctx.params.room;
    const roomUsers = rooms.get(room);
    if (roomUsers) {
      roomUsers.delete(ws.data.ctx.ip);
      if (roomUsers.size === 0) rooms.delete(room);
    }
  },
});

app.listen(1212);`}
      />

      {/* ──────────────── RATE LIMITING ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Rate Limiting
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Limit the number of messages per connection to prevent abuse.
      </p>
      <CodeBlock
        code={`import { wsRateLimit } from "@buntok/core/ws-helpers";

app.ws("/chat", {
  ...wsRateLimit({
    windowMs: 60_000,   // 1 minute window
    max: 100,           // max 100 messages per window
    closeCode: 4002,    // custom close code (default: 4002)
  }),
  message: (ws, msg) => { /* handle */ },
});`}
      />

      {/* ──────────────── PLUGGABLE INFRASTRUCTURE ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Pluggable Infrastructure
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        For multi-instance deployments, replace in-memory PubSub and rate limit stores.
      </p>
      <CodeBlock
        code={`import {
  MemoryWSPubSub,        // default in-memory PubSub
  MemoryWSRateLimitStore, // default in-memory rate limit store
} from "@buntok/core/ws-helpers";

// Custom PubSub (e.g., Redis-backed for cluster-wide broadcasting)
const pubSub = new RedisWSPubSub({ url: "redis://localhost:6379" });

// Custom rate limit store (e.g., Redis-backed for distributed limits)
const rateLimitStore = new RedisWSRateLimitStore({ url: "redis://localhost:6379" });`}
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
              <td className="px-4 py-2 font-mono text-accent">WSPubSub</td>
              <td className="px-4 py-2 font-mono text-xs">publish, subscribe, unsubscribe</td>
              <td className="px-4 py-2">MemoryWSPubSub</td>
            </tr>
            <tr className="border-b border-border-primary/50 hover:bg-bg-tertiary/50 transition-colors">
              <td className="px-4 py-2 font-mono text-accent">WSRateLimitStore</td>
              <td className="px-4 py-2 font-mono text-xs">increment, get, reset</td>
              <td className="px-4 py-2">MemoryWSRateLimitStore</td>
            </tr>
          </tbody>
        </table>
      </div>

      <Callout type="info">
        Room supports cluster-wide broadcasting: <code>new Room("name", {"{"} pubSub, channel {"}"})</code>
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
          <a href="/docs/sse" className="text-accent hover:underline">
            SSE
          </a>{" "}
          - Simpler server-to-client streaming
        </li>
        <li>
          <a href="/docs/emitter" className="text-accent hover:underline">
            Event Emitter
          </a>{" "}
          - Decouple code with events
        </li>
        <li>
          <a href="/docs/routing" className="text-accent hover:underline">
            Routing
          </a>{" "}
          - Route groups and middleware
        </li>
      </ul>
    </div>
  );
}
