import { Heading } from "@/components/ui/Heading";
import { CodeBlock } from "@/components/ui/CodeBlock";
import { Callout } from "@/components/ui/Callout";

export const metadata = {
  title: "Scheduler",
  description: "Run cron jobs and scheduled tasks with the built-in scheduler.",
};


export default function SchedulerPage() {
  return (
    <div>
      <Heading
        level={1}
        className="text-4xl font-bold mt-8 mb-4 text-text-primary"
      >
        Scheduler
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Cron-based task scheduling using{" "}
        <a
          href="https://github.com/hexagon/croner"
          className="text-accent hover:underline"
        >
          croner
        </a>
        . Run tasks on a schedule - daily cleanups, periodic reports, health
        checks.
      </p>

      {/* ──────────────── BASIC USAGE ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Basic Usage
      </Heading>
      <CodeBlock
        code={`import { Scheduler } from "@buntok/core";

const scheduler = new Scheduler();

// Run every minute
scheduler.schedule("* * * * *", () => {
  console.log("Running every minute");
});

// Run daily at midnight
scheduler.schedule("0 0 * * *", async () => {
  await cleanupOldRecords();
});

// Run every 5 minutes
scheduler.schedule("*/5 * * * *", async () => {
  await syncExternalData();
});`}
      />

      {/* ──────────────── SCHEDULER API ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Scheduler API
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
                scheduler.schedule(pattern, handler)
              </td>
              <td className="px-4 py-2">Register a cron job</td>
            </tr>
            <tr className="border-b border-border-primary">
              <td className="px-4 py-2 font-mono text-accent">
                scheduler.stopAll()
              </td>
              <td className="px-4 py-2">Stop all scheduled jobs</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ──────────────── CRON PATTERN ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Cron Patterns
      </Heading>
      <div className="my-4 overflow-x-auto">
        <table className="w-full text-sm text-text-secondary border border-border-primary rounded-lg overflow-hidden">
          <thead className="bg-bg-tertiary border-b border-border-primary">
            <tr>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Pattern
              </th>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Description
              </th>
            </tr>
          </thead>
          <tbody>
            {[
              ["* * * * *", "Every minute"],
              ["0 * * * *", "Every hour (at minute 0)"],
              ["0 0 * * *", "Daily at midnight"],
              ["0 0 * * 1", "Weekly on Monday at midnight"],
              ["0 0 1 * *", "Monthly on the 1st at midnight"],
              ["*/5 * * * *", "Every 5 minutes"],
              ["0 9-17 * * 1-5", "Every hour from 9am-5pm, Mon-Fri"],
              ["30 4 1,15 * *", "4:30am on 1st and 15th of month"],
            ].map(([pattern, desc]) => (
              <tr
                key={pattern}
                className="border-b border-border-primary/50 hover:bg-bg-tertiary/50 transition-colors"
              >
                <td className="px-4 py-2 font-mono text-accent">{pattern}</td>
                <td className="px-4 py-2">{desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ──────────────── @CRONJOB DECORATOR ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        @CronJob Decorator
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Schedule a controller method as a cron job. The job is bound to the
        class instance, so <code>this</code> works correctly:
      </p>
      <CodeBlock
        code={`import { Controller, Get } from "@buntok/core";
import { CronJob } from "@buntok/core";

class CacheService {
  deletePattern(pattern: string) { /* ... */ }
}

@Controller("/tasks")
class TaskController {
  constructor(private readonly cache: CacheService) {}

  @CronJob("0 0 * * *")  // Daily at midnight
  async dailyCleanup() {
    // 'this' is the TaskController instance
    await this.cache.deletePattern("tmp:*");
    console.log("Cache cleaned");
  }

  @CronJob("*/5 * * * *")  // Every 5 minutes
  async syncData() {
    await this.fetchExternalAPI();
  }
}`}
      />

      <Callout type="info">
        The <code>@CronJob</code> decorator uses{" "}
        <code>context.addInitializer</code> so the job is scheduled when the
        class is instantiated, not at definition time. This means{" "}
        <code>this</code> and injected services work correctly.
      </Callout>

      {/* ──────────────── DRIVERS ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Drivers
      </Heading>
      <div className="my-4 overflow-x-auto">
        <table className="w-full text-sm text-text-secondary border border-border-primary rounded-lg overflow-hidden">
          <thead className="bg-bg-tertiary border-b border-border-primary">
            <tr>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Driver
              </th>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Description
              </th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-border-primary">
              <td className="px-4 py-2 font-mono text-accent">
                MemorySchedulerDriver
              </td>
              <td className="px-4 py-2">
                In-memory cron via <code>croner</code> (default)
              </td>
            </tr>
            <tr className="border-b border-border-primary">
              <td className="px-4 py-2 font-mono text-accent">
                BunCronSchedulerDriver
              </td>
              <td className="px-4 py-2">
                OS-level cron via <code>Bun.cron()</code> — survives restarts
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <Heading
        level={3}
        className="text-xl font-semibold mt-6 mb-2 text-text-primary"
      >
        BunCronSchedulerDriver
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Uses Bun&apos;s native <code>Bun.cron()</code> API to register jobs
        with the OS scheduler (crontab on Linux, launchd on macOS, Task
        Scheduler on Windows). Jobs survive process restarts. Requires Bun
        &gt;= 1.3.11.
      </p>
      <CodeBlock
        code={`import { Scheduler, BunCronSchedulerDriver } from "@buntok/core";

const scheduler = new Scheduler(new BunCronSchedulerDriver());

scheduler.schedule("0 0 * * *", async () => {
  await dailyCleanup();
});`}
      />

      <Heading
        level={3}
        className="text-xl font-semibold mt-6 mb-2 text-text-primary"
      >
        Setting Default Driver for @CronJob
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Use <code>setDefaultSchedulerDriver</code> to make the{" "}
        <code>@CronJob</code> decorator use <code>BunCronSchedulerDriver</code>{" "}
        instead of the in-memory driver:
      </p>
      <CodeBlock
        code={`import { setDefaultSchedulerDriver, BunCronSchedulerDriver } from "@buntok/core";

// Call before any @CronJob classes are instantiated
setDefaultSchedulerDriver(new BunCronSchedulerDriver());`}
      />

      {/* ──────────────── FULL EXAMPLE ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Full Example
      </Heading>
      <CodeBlock
        code={`import { App } from "@buntok/core";
import { Scheduler } from "@buntok/core";

const app = new App();
const scheduler = new Scheduler();

// Clean up old sessions every hour
scheduler.schedule("0 * * * *", async () => {
  await db.session.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });
  console.log("Expired sessions cleaned");
});

// Generate daily report
scheduler.schedule("0 2 * * *", async () => {
  const report = await generateDailyReport();
  await mailer.send({
    to: "admin@example.com",
    subject: "Daily Report",
    html: report,
  });
});

// Health check every minute
scheduler.schedule("* * * * *", async () => {
  const healthy = await checkDatabase();
  if (!healthy) {
    await alertOps("Database is down!");
  }
});

app.listen(1212);`}
      />
    </div>
  );
}
