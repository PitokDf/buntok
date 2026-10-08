import { Heading } from "@/components/ui/Heading";
import { CodeBlock } from "@/components/ui/CodeBlock";
import { Callout } from "@/components/ui/Callout";

export const metadata = {
  title: "Date Library",
  description:
    "Complete date-fns port on @buntok/core/date: 250 functions, 396 fp variants, and 95 locales - zero dependencies.",
};

export default function DatePage() {
  return (
    <div>
      <Heading
        level={1}
        className="text-4xl font-bold mt-8 mb-4 text-text-primary"
      >
        Date Library
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Buntok ships a complete, dependency-free port of the date-fns v4 API
        across three subpaths. It behaves exactly like date-fns (parity-tested
        against date-fns@4.4.0), but you never have to install it.
      </p>

      <Callout type="info" title="Subpath imports">
        The date library is <strong>not</strong> exported from the root
        barrel - always import from <code>@buntok/core/date</code>,{" "}
        <code>@buntok/core/date/fp</code>, or{" "}
        <code>@buntok/core/date/locale</code>.
      </Callout>

      <div className="my-4 overflow-x-auto">
        <table className="w-full text-sm text-text-secondary border border-border-primary rounded-lg overflow-hidden">
          <thead className="bg-bg-tertiary border-b border-border-primary">
            <tr>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">Subpath</th>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">Exports</th>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">Contents</th>
            </tr>
          </thead>
          <tbody>
            {[
              ["@buntok/core/date", "250", "Format & parse, distances, relative time, intervals & durations, comparisons, start/end of, math, weeks & quarters, ISO/RFC helpers"],
              ["@buntok/core/date/fp", "396", "Curried variants of every function - arguments reversed for partial application"],
              ["@buntok/core/date/locale", "95", "Locale objects: id, en-US, ja, ar, ru, zh-CN, de, pt-BR, ..."],
            ].map(([subpath, count, desc]) => (
              <tr key={subpath} className="border-b border-border-primary/50 hover:bg-bg-tertiary/50 transition-colors">
                <td className="px-4 py-2 font-mono text-accent text-xs whitespace-nowrap">{subpath}</td>
                <td className="px-4 py-2 text-center font-mono text-xs">{count}</td>
                <td className="px-4 py-2">{desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ──────────────── FORMAT & PARSE ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Format &amp; parse
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        All date-fns format tokens are supported (<code>P</code>,{" "}
        <code>PPPP</code>, <code>EEEE</code>, <code>HH:mm</code>, ...), plus
        strict parsing and ISO helpers:
      </p>
      <CodeBlock
        code={`import {
  format, parse, parseISO, isValid, formatISO,
} from "@buntok/core/date";

const date = parseISO("2024-10-01T14:30:45Z");
isValid(date);                                   // true

// Outputs below are shown for a server in UTC+7
format(date, "EEEE, d MMMM yyyy 'pukul' HH:mm"); // "Tuesday, 1 October 2024 pukul 21:30"
format(date, "PPpp");                            // "10/01/2024, 9:30:45 PM"
formatISO(date);                                 // "2024-10-01T21:30:45+07:00"

// Reference date fills in missing fields
parse("10.01.2024", "MM.dd.yyyy", new Date());`}
      />

      {/* ──────────────── DISTANCES & RELATIVE ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Distances &amp; relative time
      </Heading>
      <CodeBlock
        code={`import {
  formatDistance, formatDistanceStrict, formatRelative,
  addDays, subDays, differenceInCalendarDays, getWeek, getQuarter,
} from "@buntok/core/date";

const now = new Date();

formatDistance(subDays(now, 10), now, { addSuffix: true });
// "10 days ago"

formatDistanceStrict(addDays(now, 14), now, { unit: "day", addSuffix: true });
// "in 14 days"

formatRelative(addDays(now, 1), now);
// e.g. "tomorrow at 20:15"

differenceInCalendarDays(now, new Date("2024-10-01")); // calendar-day difference
getWeek(now);                                          // week of year
getQuarter(now);                                       // 1–4`}
      />

      {/* ──────────────── INTERVALS ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Intervals &amp; durations
      </Heading>
      <CodeBlock
        code={`import {
  intervalToDuration, isWithinInterval, eachDayOfInterval,
} from "@buntok/core/date";

intervalToDuration({ start: date, end: addDays(date, 400) });
// { years: 1, months: 1, days: 4, hours: 0, ... }

isWithinInterval(date, { start: now, end: addDays(now, 7) }); // true / false
eachDayOfInterval({ start: now, end: addDays(now, 3) });      // Date[4]`}
      />

      {/* ──────────────── FP ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Functional style (fp)
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Every export has a curried variant on{" "}
        <code>@buntok/core/date/fp</code>. Arguments are{" "}
        <strong>reversed</strong> relative to the main API so the varying
        argument can be supplied last, and the argument list can be split
        across calls:
      </p>
      <CodeBlock
        code={`import {
  format, addDays, addWeeks, formatWithOptions, nextMonday,
} from "@buntok/core/date/fp";

const now = new Date();

addDays(10)(now);                 // main: addDays(now, 10) - same result
addDays()(10)(now);               // curried chain - same result
addDays(10, now);                 // full application in one call

const dayName = format("EEEE");   // reusable partial: date → weekday
dayName(now);                     // e.g. "Friday"

format("PP")(addWeeks(2)(now));   // composition: e.g. "Oct 16, 2026"
nextMonday(now);                  // arity-1 functions take the date directly

import { id } from "@buntok/core/date/locale";
formatWithOptions({ locale: id }, "EEEE, d MMMM yyyy")(now);
// "Jumat, 2 Oktober 2026"`}
      />

      {/* ──────────────── LOCALES ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Locales
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        95 locales ship on <code>@buntok/core/date/locale</code>. Pass any of
        them via the <code>{"{ locale }"}</code> option to{" "}
        <code>format</code>, <code>formatRelative</code>,{" "}
        <code>formatDistance</code>, <code>getWeek</code>, and friends:
      </p>
      <CodeBlock
        code={`import * as locales from "@buntok/core/date/locale";
import { id, ja, ar, zhCN } from "@buntok/core/date/locale";
import { format, formatRelative, getWeek, addDays } from "@buntok/core/date";

Object.keys(locales).length;                         // 95

const now = new Date();
const tomorrow = addDays(now, 1);

format(now, "EEEE, d MMMM yyyy", { locale: id });
// e.g. "Jumat, 2 Oktober 2026"

format(now, "EEEE, d MMMM yyyy", { locale: ja });
// e.g. "金曜日, 2 10月 2026"
formatRelative(tomorrow, now, { locale: ja });
// localized relative pattern (ja)
getWeek(now, { locale: ar });                        // locale week rules`}
      />
      <p className="my-3 text-text-secondary leading-relaxed">
        To discover a code, iterate <code>Object.keys(locales)</code>; each
        object exposes a canonical <code>code</code> property (e.g.{" "}
        <code>"zh-CN"</code>) you can use as a registry key:
      </p>
      <CodeBlock
        code={`const registry: Record<string, (typeof locales)[keyof typeof locales]> = {};
for (const locale of Object.values(locales)) {
  registry[locale.code] = locale;
}

registry["id"];    // Indonesian locale
registry["zh-CN"]; // Simplified Chinese`}
      />

      {/* ──────────────── FULL EXAMPLE ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Full Example
      </Heading>
      <CodeBlock
        code={`import { format, formatDistance, subDays, addDays } from "@buntok/core/date";
import { id } from "@buntok/core/date/locale";

// API endpoint summarizing this week in Indonesian
app.get("/reports/week", (ctx) => {
  const now = new Date();
  const since = subDays(now, 7);

  return ctx.json({
    today: format(now, "EEEE, d MMMM yyyy", { locale: id }), // "Jumat, 2 Oktober 2026"
    window: formatDistance(since, now, { addSuffix: true, locale: id }), // "7 hari yang lalu"
    days: [...Array(7)].map((_, i) => format(addDays(since, i), "d MMM", { locale: id })),
    // e.g. ["25 Sep", "26 Sep", ...]
  });
});`}
      />

      {/* ──────────────── WHICH IMPORT ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Which import should I use?
      </Heading>
      <div className="my-4 overflow-x-auto">
        <table className="w-full text-sm text-text-secondary border border-border-primary rounded-lg overflow-hidden">
          <thead className="bg-bg-tertiary border-b border-border-primary">
            <tr>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">Need</th>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">Use</th>
            </tr>
          </thead>
          <tbody>
            {[
              ["Quick one-offs in app code", '@buntok/core root helpers (formatDate, timeAgo, ...)'],
              ["Full formatting / parsing / comparisons", "@buntok/core/date"],
              ["Pipelines, reusable partials, point-free style", "@buntok/core/date/fp"],
              ["Non-English output, locale week rules", "{ locale } option from @buntok/core/date/locale"],
              ["Timezone conversion & formatting", "Timezone helpers (Intl-based)"],
            ].map(([need, use]) => (
              <tr key={need} className="border-b border-border-primary/50 hover:bg-bg-tertiary/50 transition-colors">
                <td className="px-4 py-2">{need}</td>
                <td className="px-4 py-2 font-mono text-accent text-xs">{use}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Callout type="tip" title="Zero dependencies">
        <code>date-fns</code> is only a dev dependency of the framework used
        for parity tests - your application never installs it, and the root{" "}
        <code>@buntok/core</code> barrel stays slim.
      </Callout>
    </div>
  );
}
