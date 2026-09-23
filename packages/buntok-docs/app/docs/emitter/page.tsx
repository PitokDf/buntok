import { Heading } from "@/components/ui/Heading";
import { CodeBlock } from "@/components/ui/CodeBlock";

export const metadata = {
  title: "Event Emitter",
  description:
    "Decouple logic with typed events, listeners, and one-time handlers.",
};

export default function EmitterPage() {
  return (
    <div>
      <Heading
        level={1}
        className="text-4xl font-bold mt-8 mb-4 text-text-primary"
      >
        Event Emitter
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Lightweight typed event emitter for decoupling modules. Emit events from
        one part of your app, listen from another - no direct imports needed.
      </p>

      {/* ──────────────── BASIC USAGE ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Basic Usage
      </Heading>
      <CodeBlock
        code={`import { emitter } from "@buntok/core";

// Listen to events
emitter.on("user:created", async (data) => {
  await sendWelcomeEmail(data.user.email);
});

// Emit events
await emitter.emit("user:created", { user: { email: "test@example.com" } });

// One-time listener
emitter.once("app:ready", () => {
  console.log("App is ready!");
});

// Unsubscribe
const unsub = emitter.on("user:created", handler);
unsub(); // Stop listening`}
      />

      {/* ──────────────── EMITTER API ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        API
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
              [
                "emitter.on(event, listener)",
                "Subscribe to an event (returns unsubscribe function)",
              ],
              [
                "emitter.once(event, listener)",
                "Subscribe once, auto-unsubscribes after first call",
              ],
              [
                "emitter.emit(event, data, options?)",
                "Emit an event (waits for all listeners to finish)",
              ],
              [
                "emitter.emitSerial(event, data, options?)",
                "Emit listeners serially (one at a time)",
              ],
              [
                "emitter.off(event?)",
                "Remove all listeners for an event, or all listeners",
              ],
              [
                "emitter.listenerCount(event)",
                "Get number of listeners for an event",
              ],
              [
                "emitter.eventNames()",
                "Get all event names with listeners",
              ],
            ].map(([method, desc]) => (
              <tr
                key={method}
                className="border-b border-border-primary/50 hover:bg-bg-tertiary/50 transition-colors"
              >
                <td className="px-4 py-2 font-mono text-accent">{method}</td>
                <td className="px-4 py-2">{desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ──────────────── ERROR ISOLATION ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Error Isolation
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        By default, if any listener throws, the entire <code>emit()</code>{" "}
        call rejects. Use <code>isolatedErrors</code> to prevent one failing
        listener from blocking others:
      </p>
      <CodeBlock
        code={`// Default behavior - one failure rejects all
await emitter.emit("user:created", { user }); // Rejects if any listener fails

// With error isolation - failures don't affect other listeners
await emitter.emit("user:created", { user }, {
  isolatedErrors: true,
  onError: (event, error, listener) => {
    console.error(\`Listener failed for \${event}:\`, error);
  },
});`}
      />

      {/* ──────────────── SERIAL EXECUTION ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Serial Execution
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Use <code>emitSerial()</code> to run listeners one at a time (useful
        when order matters):
      </p>
      <CodeBlock
        code={`// Listeners run in order, one after another
await emitter.emitSerial("order:placed", { order });

// With error isolation - continues despite failures
await emitter.emitSerial("order:placed", { order }, {
  isolatedErrors: true,
  onError: (event, error) => console.error(error),
});`}
      />

      {/* ──────────────── MAX LISTENERS ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Max Listeners
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Prevent memory leaks by limiting the number of listeners per event:
      </p>
      <CodeBlock
        code={`const emitter = new EventEmitter({
  maxListeners: 10, // Max 10 listeners per event
});

// Throws if limit exceeded
emitter.on("test", handler); // ✅
// ... 9 more listeners
emitter.on("test", handler); // ❌ Throws "Max listeners (10) exceeded"

// Increase limit if needed
emitter.increaseMaxListeners(20);`}
      />

      {/* ──────────────── TYPED EVENTS ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Typed Events
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Define your event map for full type safety:
      </p>
      <CodeBlock
        code={`import { EventEmitter } from "@buntok/core";

interface AppEvents {
  "user:created": { id: number; name: string; email: string };
  "user:deleted": { id: number };
  "order:placed": { orderId: string; total: number };
  "payment:failed": { orderId: string; reason: string };
}

const emitter = new EventEmitter<AppEvents>();

// ✅ Typed - data is { id: number; name: string; email: string }
emitter.on("user:created", async (data) => {
  console.log(data.name); // string
});

// ❌ Compile error - wrong event name
emitter.on("user:removed", handler);

// ❌ Compile error - wrong data shape
emitter.emit("user:created", { name: 123 });`}
      />

      {/* ──────────────── DEFAULT EMITTER ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Default Emitter
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        A pre-configured emitter with common app events is available:
      </p>
      <CodeBlock
        code={`import { emitter } from "@buntok/core";

// Built-in events:
emitter.on("user:created", async ({ user }) => { /* ... */ });
emitter.on("user:updated", async ({ user }) => { /* ... */ });
emitter.on("user:deleted", async ({ userId }) => { /* ... */ });
emitter.on("user:logged_in", async ({ user }) => { /* ... */ });
emitter.on("user:logged_out", async ({ user }) => { /* ... */ });

emitter.on("request:start", async ({ method, path }) => { /* ... */ });
emitter.on("request:end", async ({ method, path, status, duration }) => { /* ... */ });
emitter.on("request:error", async ({ method, path, error }) => { /* ... */ });

emitter.on("app:ready", async () => { /* ... */ });
emitter.on("app:shutdown", async () => { /* ... */ });

// Custom events also work (extensible via [key: string]: any)
emitter.emit("custom:event", { anything: true });`}
      />

      {/* ──────────────── PRACTICAL EXAMPLES ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Practical Examples
      </Heading>

      <Heading
        level={3}
        className="text-xl font-semibold mt-6 mb-2 text-text-primary"
      >
        Decouple Auth from Notifications
      </Heading>
      <CodeBlock
        code={`// auth.service.ts - emits events, knows nothing about notifications
import { emitter } from "@buntok/core";

async function createUser(data) {
  const user = await db.user.create({ data });
  await emitter.emit("user:created", { user });
  return user;
}

// notification.service.ts - listens, knows nothing about auth
import { emitter } from "@buntok/core";

emitter.on("user:created", async ({ user }) => {
  await sendWelcomeEmail(user.email);
  await sendSlackNotification(\`New user: \${user.name}\`);
});`}
      />

      <Heading
        level={3}
        className="text-xl font-semibold mt-6 mb-2 text-text-primary"
      >
        Audit Trail
      </Heading>
      <CodeBlock
        code={`emitter.on("user:deleted", async ({ userId, ctx }) => {
  await db.auditLog.create({
    data: {
      action: "user:deleted",
      entityId: String(userId),
      ip: ctx?.ip,
      timestamp: new Date(),
    },
  });
});`}
      />

      <Heading
        level={3}
        className="text-xl font-semibold mt-6 mb-2 text-text-primary"
      >
        Cleanup
      </Heading>
      <CodeBlock
        code={`// Remove all listeners for an event
emitter.off("user:created");

// Remove ALL listeners
emitter.off();

// Check listener count
const count = emitter.listenerCount("user:created");`}
      />
    </div>
  );
}
