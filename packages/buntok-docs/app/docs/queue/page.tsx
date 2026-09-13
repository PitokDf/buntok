import { Heading } from "@/components/ui/Heading";
import { CodeBlock } from "@/components/ui/CodeBlock";
import { Callout } from "@/components/ui/Callout";

export const metadata = {
  title: "Queue",
  description: "Background job processing with built-in drivers: Memory, Redis, Bun Redis, BullMQ, and RabbitMQ.",
};


export default function QueuePage() {
  return (
    <div>
      <Heading
        level={1}
        className="text-4xl font-bold mt-8 mb-4 text-text-primary"
      >
        Queue
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Background job processing with priority, delays, retries, and backoff
        strategies. Built-in drivers for Memory, Redis (ioredis), Bun native
        Redis, BullMQ, and RabbitMQ.
      </p>

      {/* ──────────────── DRIVERS ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Built-in Drivers
      </Heading>
      <div className="my-4 overflow-x-auto">
        <table className="w-full text-sm text-text-secondary border border-border-primary rounded-lg overflow-hidden">
          <thead className="bg-bg-tertiary border-b border-border-primary">
            <tr>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Driver
              </th>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Package
              </th>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Use Case
              </th>
            </tr>
          </thead>
          <tbody>
            {[
              ["Memory", "built-in", "Default, development"],
              ["Redis", "ioredis", "Most common, production"],
              ["Bun Redis", "bun (native)", "Zero-dep on Bun"],
              ["BullMQ", "bullmq", "Enterprise, rate limiting"],
              ["RabbitMQ", "amqplib", "Fan-out, multi-language"],
            ].map(([driver, pkg, use]) => (
              <tr
                key={driver}
                className="border-b border-border-primary/50 hover:bg-bg-tertiary/50 transition-colors"
              >
                <td className="px-4 py-2 font-mono text-accent">{driver}</td>
                <td className="px-4 py-2 font-mono">{pkg}</td>
                <td className="px-4 py-2">{use}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Heading
        level={3}
        className="text-xl font-semibold mt-6 mb-2 text-text-primary"
      >
        Driver Imports
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        For production use, import driver classes directly:
      </p>
      <CodeBlock
        code={`import {
  Queue,
  RedisQueueDriver,
  BunRedisQueueDriver,
  BullmqQueueDriver,
  RabbitmqQueueDriver,
} from "@buntok/core/queue";

// Pass driver instance directly
const redisDriver = new RedisQueueDriver({ url: "redis://localhost:6379" });
const queue = new Queue("email", redisDriver);`}
      />

      {/* ──────────────── BASIC USAGE ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Basic Usage
      </Heading>
      <CodeBlock
        code={`import { Queue } from "@buntok/core/queue";

// Memory driver (default — development)
const emailQueue = new Queue<{ to: string; subject: string }>("emails");

// Add a job
await emailQueue.add({ to: "user@example.com", subject: "Welcome!" });

// Process jobs
emailQueue.process(async (job) => {
  console.log(\`Processing \${job.id}\`);
  await sendEmail(job.data.to, job.data.subject);
});`}
      />

      <Callout type="warning">
        The <strong>name</strong> (<code>&quot;emails&quot;</code>) is the first
        argument and is <strong>required</strong>. Each queue must have a unique
        name. This name is used for logging, debugging, and driver isolation.
      </Callout>

      {/* ──────────────── REDIS DRIVER ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Redis Driver (ioredis)
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Production-ready Redis driver using <code>ioredis</code>. Install{" "}
        <code>ioredis</code> first: <code>bun add ioredis</code>
      </p>
      <CodeBlock
        code={`import { Queue } from "@buntok/core/queue";
import Redis from "ioredis";

const redis = new Redis();

const emailQueue = new Queue<{ to: string }>("emails", {
  driver: "redis",
  client: redis,
  maxRetries: 3,
  retryDelay: 1000,
  backoff: "exponential",
});

// Or use URL directly
const queue = new Queue<Job>("tasks", {
  driver: "redis",
  url: "redis://localhost:6379",
});`}
      />

      {/* ──────────────── BUN REDIS DRIVER ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Bun Native Redis Driver
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Uses Bun&apos;s built-in Redis client (zero dependencies, requires Bun &gt;= 1.3).
      </p>
      <CodeBlock
        code={`import { Queue } from "@buntok/core/queue";

const emailQueue = new Queue<{ to: string }>("emails", {
  driver: "bun-redis",
  url: "redis://localhost:6379",
});`}
      />

      {/* ──────────────── BULLMQ DRIVER ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        BullMQ Driver
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Enterprise Redis-backed queue with rate limiting, job scheduling, and
        monitoring. Install <code>bullmq</code> first:{" "}
        <code>bun add bullmq</code>
      </p>
      <CodeBlock
        code={`import { Queue } from "@buntok/core/queue";

const emailQueue = new Queue<{ to: string }>("emails", {
  driver: "bullmq",
  connection: { host: "localhost", port: 6379 },
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 1000 },
    removeOnComplete: { age: 86400 },   // keep completed for 24h
    removeOnFail: { age: 604800 },      // keep failed for 7 days
  },
});`}
      />

      <Callout type="info">
        BullMQ provides built-in support for concurrency, rate limiting,
        repeatable jobs, and a monitoring dashboard. See{" "}
        <a
          href="https://docs.bullmq.io"
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent hover:underline"
        >
          BullMQ docs
        </a>{" "}
        for details.
      </Callout>

      {/* ──────────────── RABBITMQ DRIVER ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        RabbitMQ Driver
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        AMQP-based driver for fan-out patterns and multi-language workers.
        Install <code>amqplib</code> first: <code>bun add amqplib</code>
      </p>
      <CodeBlock
        code={`import { Queue } from "@buntok/core/queue";

const emailQueue = new Queue<{ to: string }>("emails", {
  driver: "rabbitmq",
  url: "amqp://guest:guest@localhost:5672",
  prefetch: 1,
  maxRetries: 3,
  retryDelay: 1000,
});`}
      />

      {/* ──────────────── QUEUE API ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Queue API
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
                "queue.add(data, opts?)",
                "Add a job (opts: priority, delay)",
              ],
              [
                "queue.process(handler)",
                "Register a handler for jobs",
              ],
              ["queue.size()", "Number of pending jobs"],
              ["queue.clear()", "Remove all pending jobs"],
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

      {/* ──────────────── JOB OBJECT ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Job Object
      </Heading>
      <div className="my-4 overflow-x-auto">
        <table className="w-full text-sm text-text-secondary border border-border-primary rounded-lg overflow-hidden">
          <thead className="bg-bg-tertiary border-b border-border-primary">
            <tr>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Property
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
              ["job.id", "string", "Auto-generated UUID"],
              ["job.data", "T", "Payload passed by the caller"],
              ["job.priority", "number", "Higher = processed sooner (default: 0)"],
              ["job.delay", "number", "ms to wait before processing"],
              ["job.attempt", "number", "Current attempt (0 = first)"],
              ["job.createdAt", "number", "Timestamp when added"],
            ].map(([prop, type, desc]) => (
              <tr
                key={prop}
                className="border-b border-border-primary/50 hover:bg-bg-tertiary/50 transition-colors"
              >
                <td className="px-4 py-2 font-mono text-accent">{prop}</td>
                <td className="px-4 py-2 font-mono text-text-secondary">
                  {type}
                </td>
                <td className="px-4 py-2">{desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ──────────────── PRIORITY & DELAY ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Priority & Delay
      </Heading>
      <CodeBlock
        code={`// High priority job (processed first)
await queue.add({ task: "urgent" }, { priority: 10 });

// Delayed job (process after 5 seconds)
await queue.add({ task: "later" }, { delay: 5000 });

// Both
await queue.add({ task: "important-later" }, {
  priority: 5,
  delay: 10_000,
});`}
      />

      {/* ──────────────── RETRIES ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Retries & Backoff
      </Heading>
      <CodeBlock
        code={`// Retry failed jobs up to 3 times
const queue = new Queue("tasks", {
  maxRetries: 3,
  retryDelay: 1000,      // 1 second between retries
  backoff: "fixed",       // or "exponential"
});

// Exponential backoff: 1s, 2s, 4s, 8s...
const queue = new Queue("tasks", {
  maxRetries: 4,
  retryDelay: 1000,
  backoff: "exponential",
});`}
      />

      <Callout type="info">
        Jobs that exceed <code>maxRetries</code> are permanently failed and
        logged to console. The queue continues processing remaining jobs.
      </Callout>

      {/* ──────────────── FULL EXAMPLE ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Full Example
      </Heading>
      <CodeBlock
        code={`import { App } from "@buntok/core";
import { Queue } from "@buntok/core/queue";

const emailQueue = new Queue<{
  to: string;
  subject: string;
  body: string;
}>("emails", { maxRetries: 3, backoff: "exponential" });

// Process emails in background
emailQueue.process(async (job) => {
  console.log(\`[\${job.attempt + 1}] Sending to \${job.data.to}\`);
  await transporter.sendMail({
    to: job.data.to,
    subject: job.data.subject,
    html: job.data.body,
  });
});

// HTTP endpoint adds jobs
app.post("/send-email", async (ctx) => {
  const { to, subject, body } = await ctx.body();
  await emailQueue.add({ to, subject, body });
  return ctx.json({ queued: true });
});

app.listen(1212);`}
      />

      {/* ──────────────── CUSTOM DRIVERS ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Custom Driver
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Implement the <code>QueueDriver</code> interface for custom backends:
      </p>
      <CodeBlock
        code={`import type { QueueDriver, Job, JobHandler } from "@buntok/core/queue";

class MyCustomDriver implements QueueDriver<{ to: string }> {
  async add(data: { to: string }, opts?: { priority?: number; delay?: number }): Promise<void> {
    // Your implementation
  }
  process(handler: JobHandler<{ to: string }>): void {
    // Your implementation
  }
  size(): number { return 0; }
  clear(): void {}
}

const queue = new Queue("email", new MyCustomDriver());`}
      />
    </div>
  );
}
