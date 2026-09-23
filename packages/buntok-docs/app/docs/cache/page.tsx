import { Heading } from "@/components/ui/Heading";
import { CodeBlock } from "@/components/ui/CodeBlock";
import { Callout } from "@/components/ui/Callout";

export const metadata = {
  title: "Cache",
  description: "Cache responses and data with in-memory store, TTL, and pattern deletion.",
};


export default function CachePage() {
  return (
    <div>
      <Heading
        level={1}
        className="text-4xl font-bold mt-8 mb-4 text-text-primary"
      >
        Cache
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        In-memory caching with TTL support. Use for rate limiting, memoization,
        or temporary data storage.
      </p>

      {/* ──────────────── CACHE ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Cache
      </Heading>

      <Heading
        level={3}
        className="text-xl font-semibold mt-6 mb-2 text-text-primary"
      >
        Basic Usage
      </Heading>
      <CodeBlock
        code={`import { Cache } from "@buntok/core/cache";

const cache = new Cache();

// Set with TTL (seconds)
cache.set("key", "value", 60); // 1 minute

// Get (returns undefined if expired)
const value = cache.get("key");

// Delete
cache.delete("key");

// Clear all entries
cache.clear();`}
      />

      <Heading
        level={3}
        className="text-xl font-semibold mt-6 mb-2 text-text-primary"
      >
        Cache API
      </Heading>
      <div className="my-4 overflow-x-auto">
        <table className="w-full text-sm text-text-secondary border border-border-primary rounded-lg overflow-hidden">
          <thead className="bg-bg-tertiary border-b border-border-primary">
            <tr>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Method
              </th>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Return
              </th>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Description
              </th>
            </tr>
          </thead>
          <tbody>
            {[
              ["cache.get(key)", "Promise<T | null>", "Get value (null if expired)"],
              ["cache.set(key, value, ttl?)", "Promise<void>", "Set value with optional TTL (seconds)"],
              ["cache.delete(key)", "Promise<void>", "Delete a key"],
              ["cache.clear()", "Promise<void>", "Clear all entries"],
              ["cache.has(key)", "Promise<boolean>", "Check if key exists and hasn't expired"],
              [
                "cache.getOrSet(key, factory, ttl?)",
                "Promise<T>",
                "Get from cache or compute and cache",
              ],
              [
                "cache.increment(key, amount?, ttl?)",
                "Promise<number>",
                "Increment numeric value (atomic)",
              ],
              [
                "cache.decrement(key, amount?, ttl?)",
                "Promise<number>",
                "Decrement numeric value (atomic)",
              ],
              ["cache.mget(keys)", "(T | null)[]", "Get multiple keys at once"],
              [
                "cache.mset(entries, ttl?)",
                "void",
                "Set multiple key-value pairs",
              ],
              [
                "cache.deletePattern(pattern)",
                "number",
                "Delete keys matching glob pattern",
              ],
              ["cache.keys()", "string[]", "List all stored keys"],
            ].map(([method, ret, desc]) => (
              <tr
                key={method}
                className="border-b border-border-primary/50 hover:bg-bg-tertiary/50 transition-colors"
              >
                <td className="px-4 py-2 font-mono text-accent">{method}</td>
                <td className="px-4 py-2 font-mono text-text-secondary">{ret}</td>
                <td className="px-4 py-2">{desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Callout type="info">
        The <code>keys()</code> method is <strong>optional</strong> in the{" "}
        <code>CacheDriver</code> interface. Not all custom drivers implement it.
        If you call <code>cache.keys()</code> on a driver without{" "}
        <code>keys()</code>, it returns an empty array. The{" "}
        <code>deletePattern</code> method also depends on <code>keys()</code>{" "}
        being available.
      </Callout>

      <Heading
        level={3}
        className="text-xl font-semibold mt-6 mb-2 text-text-primary"
      >
        Common Patterns
      </Heading>
      <CodeBlock
        code={`// getOrSet - cache-aside pattern
const user = await cache.getOrSet(
  \`user:\${id}\`,
  () => db.user.findUnique({ where: { id } }),
  300 // TTL in seconds
);

// Atomic counter
await cache.increment("page:views", 1, 3600);
const views = await cache.get<number>("page:views");

// Batch operations
await cache.mset([["user:1", data1], ["user:2", data2]], 300);
const [u1, u2] = await cache.mget(["user:1", "user:2"]);

// Pattern delete - clear all session keys
await cache.deletePattern("session:*");`}
      />

      {/* ──────────────── AICACHE ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        AICache
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Cache for AI responses. Hashes messages to generate cache keys:
      </p>
      <CodeBlock
        code={`import { AICache } from "@buntok/core";
import { Cache, type CacheDriver } from "@buntok/core/cache";

const cacheDriver = new Cache();
const aiCache = new AICache(cacheDriver);

app.post("/chat", async (ctx) => {
  const { messages } = await ctx.body();

  // Check cache first
  const cached = await aiCache.get(messages);
  if (cached) return ctx.json({ response: cached });

  // Call AI
  const response = await callAI(messages);

  // Cache the result (default TTL: 3600s)
  await aiCache.set(messages, response);

  return ctx.json({ response });
});`}
      />

      <Callout type="info">
        <code>AICache</code> automatically generates cache keys by hashing the
        message array. Duplicate conversations are served from cache.
      </Callout>

      {/* ──────────────── CUSTOM DRIVERS ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Custom Drivers
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        The <code>Cache</code> class accepts any object implementing{" "}
        <code>CacheDriver</code>. Here&apos;s an example using a custom Redis driver:
      </p>
      <CodeBlock
        code={`import { Cache, type CacheDriver } from "@buntok/core/cache";
import { createClient } from "redis";

class RedisCacheDriver implements CacheDriver {
  private client: ReturnType<typeof createClient>;
  private prefix: string;

  constructor(url = "redis://localhost:6379", prefix = "cache:") {
    this.client = createClient({ url });
    this.prefix = prefix;
  }

  async get<T>(key: string): Promise<T | null> {
    const raw = await this.client.get(this.prefix + key);
    return raw ? (JSON.parse(raw) as T) : null;
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    const serialized = JSON.stringify(value);
    if (ttlSeconds) {
      await this.client.setEx(this.prefix + key, ttlSeconds, serialized);
    } else {
      await this.client.set(this.prefix + key, serialized);
    }
  }

  async delete(key: string): Promise<void> {
    await this.client.del(this.prefix + key);
  }

  async clear(): Promise<void> {
    const keys = await this.client.keys(this.prefix + "*");
    if (keys.length) await Promise.all(keys.map((k) => this.client.del(k)));
  }

  async keys(): Promise<string[]> {
    const raw = await this.client.keys(this.prefix + "*");
    return raw.map((k) => k.slice(this.prefix.length));
  }
}

// Usage — drop-in replacement for the default memory driver
const cache = new Cache(new RedisCacheDriver());
await cache.set("user:1", userData, 3600); // TTL 1 hour
const user = await cache.get<User>("user:1");`}
      />

      <Callout type="info">
        Install <code>redis</code> via <code>bun add redis</code> for persistent caching.
      </Callout>
    </div>
  );
}
