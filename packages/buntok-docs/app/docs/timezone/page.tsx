import { Heading } from "@/components/ui/Heading";
import { CodeBlock } from "@/components/ui/CodeBlock";

export const metadata = {
  title: "Timezone",
  description:
    "Convert and format dates across timezones with built-in helpers.",
};

export default function TimezonePage() {
  return (
    <div>
      <Heading
        level={1}
        className="text-4xl font-bold mt-8 mb-4 text-text-primary"
      >
        Timezone Helpers
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Timezone utilities for handling dates across different timezones. Uses
        the Intl API (built-in, zero-deps).
      </p>

      {/* ──────────────── PARSE TIME ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        parseTime
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Parse a time string in a specific timezone:
      </p>
      <CodeBlock
        code={`import { parseTime } from "@buntok/core";

// Time only
const date = parseTime("14:30", "Asia/Jakarta");

// Date + time
const date = parseTime("2024-01-15 14:30", "America/New_York");

// Returns a Date object in the specified timezone`}
      />

      {/* ──────────────── FORMAT IN TIMEZONE ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        formatInTimezone
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Format a Date object in a specific timezone:
      </p>
      <CodeBlock
        code={`import { formatInTimezone } from "@buntok/core";

// 3rd arg is enum: "short" | "default" | "full" (not custom pattern)
const formatted = formatInTimezone(new Date(), "Asia/Jakarta", "short");
// "14:30" — short

formatInTimezone(new Date(), "Asia/Jakarta", "default");
// "2024-01-15 14:30:00" — default (includes date)

formatInTimezone(new Date(), "Asia/Jakarta", "full");
// "Monday, January 15, 2024 at 14:30:00 GMT+07:00" — full`}
      />

      {/* ──────────────── TO TIMEZONE PARTS ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        toTimezoneParts
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Get individual timezone parts:
      </p>
      <CodeBlock
        code={`import { toTimezoneParts } from "@buntok/core";

const parts = toTimezoneParts(new Date(), "Asia/Jakarta");
// { year: 2024, month: 1, day: 15, hour: 14, minute: 30, second: 0 }
// (6 fields — no weekday)
`}
      />

      {/* ──────────────── NOW IN TIMEZONE ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        nowInTimezone
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Get current time in a specific timezone:
      </p>
      <CodeBlock
        code={`import { nowInTimezone } from "@buntok/core";

const jakartaTime = nowInTimezone("Asia/Jakarta");
const nyTime = nowInTimezone("America/New_York");`}
      />

      {/* ──────────────── GET TIMEZONE OFFSET ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        getTimezoneOffset
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Get timezone offset in minutes from UTC:
      </p>
      <CodeBlock
        code={`import { getTimezoneOffset, getTimezoneOffsetString } from "@buntok/core";

getTimezoneOffset("Asia/Jakarta");      // -420 (UTC+7, negative = ahead)
getTimezoneOffset("America/New_York");  // 240 or 300 (DST, positive = behind)
getTimezoneOffset("UTC");               // 0

getTimezoneOffsetString("Asia/Jakarta"); // "+07:00"
getTimezoneOffsetString("America/New_York"); // "-05:00" or "-04:00" (DST)
`}
      />

      {/* ──────────────── IS VALID TIMEZONE ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        isValidTimezone
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Check if a timezone string is valid:
      </p>
      <CodeBlock
        code={`import { isValidTimezone } from "@buntok/core";

isValidTimezone("Asia/Jakarta");     // true
isValidTimezone("America/New_York"); // true
isValidTimezone("Invalid/Zone");     // false`}
      />

      {/* ──────────────── ADDITIONAL HELPERS ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Additional Helpers
      </Heading>
      <div className="my-4 overflow-x-auto">
        <table className="w-full text-sm text-text-secondary border border-border-primary rounded-lg overflow-hidden">
          <thead className="bg-bg-tertiary border-b border-border-primary">
            <tr>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">Function</th>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">Description</th>
            </tr>
          </thead>
          <tbody>
            {[
              ["getTimezoneOffsetString(tz)", "Offset as string (+07:00)"],
              ["toISOWithTimezone(date, tz)", "ISO string with offset (2024-01-15T17:30:00+07:00)"],
              ['groupByTimezone(items, field, tz, "day")', "Group items by hour/day/month/year"],
              ["getGroupLabels(groupBy)", "Get group labels"],
              ["formatGroupLabel(label, groupBy, tz)", "Format label for display"],
            ].map(([fn, desc]) => (
              <tr key={fn} className="border-b border-border-primary/50 hover:bg-bg-tertiary/50 transition-colors">
                <td className="px-4 py-2 font-mono text-accent text-xs">{fn}</td>
                <td className="px-4 py-2">{desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <CodeBlock
        code={`import {
  toISOWithTimezone, groupByTimezone, getGroupLabels, formatGroupLabel,
} from "@buntok/core";
// Types: GroupByKey = "hour"|"day"|"month"|"year", GroupByTimezoneOptions { locale?, labelFormatter? }

toISOWithTimezone(new Date(), "Asia/Jakarta");
// "2024-01-15T17:30:00+07:00"

const grouped = groupByTimezone(orders, "createdAt", "Asia/Jakarta", "day");
// Map<string, Order[]> — e.g. "2024-01-15" → [orders]

const labels = getGroupLabels("day"); // ["2024-01-15", ...]
formatGroupLabel("2024-01-15", "day", "Asia/Jakarta"); // "15 Jan 2024"`}
      />

      {/* ──────────────── FULL EXAMPLE ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Full Example
      </Heading>
      <CodeBlock
        code={`import {
  parseTime, formatInTimezone, nowInTimezone,
  getTimezoneOffset, getTimezoneOffsetString, isValidTimezone, toTimezoneParts,
} from "@buntok/core";

// API endpoint returning user's local time
app.get("/time/:timezone", (ctx) => {
  const { timezone } = ctx.params;

  if (!isValidTimezone(timezone)) {
    return ctx.error("Invalid timezone", 400);
  }

  return ctx.json({
    timezone,
    now: nowInTimezone(timezone),
    formatted: formatInTimezone(new Date(), timezone, "default"), // "short"|"default"|"full"
    offset: getTimezoneOffset(timezone), // -420 for Jakarta
    offsetStr: getTimezoneOffsetString(timezone), // "+07:00"
    parts: toTimezoneParts(new Date(), timezone), // { year, month, day, hour, minute, second }
  });
});`}
      />
    </div>
  );
}
