import { Heading } from "@/components/ui/Heading";
import { Callout } from "@/components/ui/Callout";
import { CodeBlock } from "@/components/ui/CodeBlock";

export const metadata = {
  title: "Helpers",
  description: "Utility functions for async, password hashing, crypto, strings, and more.",
};


export default function HelpersPage() {
  return (
    <div>
      <Heading
        level={1}
        className="text-4xl font-bold mt-8 mb-4 text-text-primary"
      >
        Helpers
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Utility functions available in <code>@buntok/core</code>.
      </p>

      {/* ──────────────── PASSWORD ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Password Hashing
      </Heading>
      <div className="my-4 overflow-x-auto">
        <table className="w-full text-sm text-text-secondary border border-border-primary rounded-lg overflow-hidden">
          <thead className="bg-bg-tertiary border-b border-border-primary">
            <tr>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Function
              </th>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Description
              </th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-border-primary">
              <td className="px-4 py-2 font-mono text-accent">
                hashPassword(password)
              </td>
              <td className="px-4 py-2">
                Hash password using argon2id (via Bun.password)
              </td>
            </tr>
            <tr className="border-b border-border-primary">
              <td className="px-4 py-2 font-mono text-accent">
                verifyPassword(password, hash)
              </td>
              <td className="px-4 py-2">
                Verify password (supports argon2id + legacy scrypt + PBKDF2)
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <CodeBlock
        code={`import { hashPassword, verifyPassword } from "@buntok/core/helpers";

// Hash
const hash = await hashPassword("my-password");

// Verify
const isValid = await verifyPassword("my-password", hash);`}
      />
      <Callout type="info">
        Uses <strong>argon2id</strong> via <code>Bun.password</code> (native, Zig-based, 2-10x faster than node:crypto). Backward compatible
        with legacy scrypt and PBKDF2 hashes.
      </Callout>

      {/* ──────────────── TIMEZONE ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Timezone Helpers
      </Heading>
      <div className="my-4 overflow-x-auto">
        <table className="w-full text-sm text-text-secondary border border-border-primary rounded-lg overflow-hidden">
          <thead className="bg-bg-tertiary border-b border-border-primary">
            <tr>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Function
              </th>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Description
              </th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-border-primary">
              <td className="px-4 py-2 font-mono text-accent">
                parseTime(time, tz)
              </td>
              <td className="px-4 py-2">Parse time string in timezone</td>
            </tr>
            <tr className="border-b border-border-primary">
              <td className="px-4 py-2 font-mono text-accent">
                formatInTimezone(date, tz, format)
              </td>
              <td className="px-4 py-2">Format date in timezone</td>
            </tr>
            <tr className="border-b border-border-primary">
              <td className="px-4 py-2 font-mono text-accent">
                toTimezoneParts(date, tz)
              </td>
              <td className="px-4 py-2">Get timezone parts</td>
            </tr>
            <tr className="border-b border-border-primary">
              <td className="px-4 py-2 font-mono text-accent">
                nowInTimezone(tz)
              </td>
              <td className="px-4 py-2">Get current time in timezone</td>
            </tr>
            <tr className="border-b border-border-primary">
              <td className="px-4 py-2 font-mono text-accent">
                getTimezoneOffset(tz)
              </td>
              <td className="px-4 py-2">Get offset in minutes (negative = ahead of UTC, e.g. Jakarta -420)</td>
            </tr>
            <tr className="border-b border-border-primary">
              <td className="px-4 py-2 font-mono text-accent">
                getTimezoneOffsetString(tz)
              </td>
              <td className="px-4 py-2">Get offset as string (+07:00)</td>
            </tr>
            <tr className="border-b border-border-primary">
              <td className="px-4 py-2 font-mono text-accent">
                toISOWithTimezone(date, tz)
              </td>
              <td className="px-4 py-2">ISO string with offset</td>
            </tr>
            <tr className="border-b border-border-primary">
              <td className="px-4 py-2 font-mono text-accent">
                groupByTimezone(items, field, tz, groupBy)
              </td>
              <td className="px-4 py-2">Group by hour/day/month/year</td>
            </tr>
            <tr className="border-b border-border-primary">
              <td className="px-4 py-2 font-mono text-accent">
                getGroupLabels(groupBy)
              </td>
              <td className="px-4 py-2">Get group labels</td>
            </tr>
            <tr className="border-b border-border-primary">
              <td className="px-4 py-2 font-mono text-accent">
                formatGroupLabel(label, groupBy, tz)
              </td>
              <td className="px-4 py-2">Format group label</td>
            </tr>
            <tr className="border-b border-border-primary">
              <td className="px-4 py-2 font-mono text-accent">
                isValidTimezone(tz)
              </td>
              <td className="px-4 py-2">Check if timezone is valid</td>
            </tr>
          </tbody>
        </table>
      </div>
      <CodeBlock
        code={`import {
  parseTime, formatInTimezone, toTimezoneParts,
  nowInTimezone, getTimezoneOffset, getTimezoneOffsetString, isValidTimezone,
  groupByTimezone, getGroupLabels, formatGroupLabel, toISOWithTimezone,
} from "@buntok/core/helpers";

const date = parseTime("14:30", "Asia/Jakarta");
const formatted = formatInTimezone(new Date(), "Asia/Jakarta", "short"); // "short"|"default"|"full"
const offset = getTimezoneOffset("Asia/Jakarta"); // -420 (UTC+7, negative = ahead)
const offsetStr = getTimezoneOffsetString("Asia/Jakarta"); // "+07:00"
isValidTimezone("Asia/Jakarta"); // true
// Group: groupByTimezone(items, "createdAt", "Asia/Jakarta", "day") // GroupByKey "hour"|"day"|"month"|"year"
toISOWithTimezone(new Date(), "Asia/Jakarta"); // "2024-01-15T17:30:00+07:00"`}
      />

      {/* ──────────────── ASYNC HELPERS ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Async Helpers
      </Heading>
      <div className="my-4 overflow-x-auto">
        <table className="w-full text-sm text-text-secondary border border-border-primary rounded-lg overflow-hidden">
          <thead className="bg-bg-tertiary border-b border-border-primary">
            <tr>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Function
              </th>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Description
              </th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-border-primary">
              <td className="px-4 py-2 font-mono text-accent">
                delay(ms)
              </td>
              <td className="px-4 py-2">Promise-based sleep</td>
            </tr>
            <tr className="border-b border-border-primary">
              <td className="px-4 py-2 font-mono text-accent">
                retry(fn, options?)
              </td>
              <td className="px-4 py-2">
                Retry with configurable backoff
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <CodeBlock
        code={`import { delay, retry } from "@buntok/core/helpers";

// Promise-based sleep
await delay(1000); // 1 second

// Retry with exponential backoff
const data = await retry(
  () => fetch("https://api.example.com/data").then(r => r.json()),
  { retries: 3, delay: 1000, backoff: "exponential" }
);

// Retry with custom error filter
await retry(
  () => db.query("SELECT ..."),
  {
    retries: 5,
    delay: 500,
    backoff: "fixed",
    onError: (err, attempt) => {
      // Only retry on connection errors
      return err instanceof ConnectionError;
    },
  }
);`}
      />

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
              ["retries", "number", "3", "Max retry attempts"],
              ["delay", "number", "1000", "Base delay in ms"],
              ["backoff", '"fixed" | "exponential"', '"exponential"', "Backoff strategy"],
              ["onError", "(err, attempt) => boolean", "always retry", "Decide if error is retryable"],
            ].map(([opt, type, def, desc]) => (
              <tr
                key={opt}
                className="border-b border-border-primary/50 hover:bg-bg-tertiary/50 transition-colors"
              >
                <td className="px-4 py-2 font-mono text-accent">{opt}</td>
                <td className="px-4 py-2 font-mono text-text-secondary">{type}</td>
                <td className="px-4 py-2 font-mono text-text-secondary">{def}</td>
                <td className="px-4 py-2">{desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Callout type="info">
        <code>delay</code> is a simple Promise-based sleep. <code>retry</code> wraps
        an async function with configurable retries, backoff, and error filtering.
      </Callout>

      {/* ──────────────── ERROR HANDLING ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Error Helpers (asyncHandler)
      </Heading>
      <div className="my-4 overflow-x-auto">
        <table className="w-full text-sm text-text-secondary border border-border-primary rounded-lg overflow-hidden">
          <thead className="bg-bg-tertiary border-b border-border-primary">
            <tr>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">Function / Class</th>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">Description</th>
            </tr>
          </thead>
          <tbody>
            {[
              ["asyncHandler(handler)", "Wrap handler, auto-catch → error response"],
              ["HttpError", "Base error class"],
              ["BadRequestError (400)", "Invalid request"],
              ["UnauthorizedError (401)", "Auth missing"],
              ["ForbiddenError (403)", "No access"],
              ["NotFoundError (404)", "Not found"],
              ["ConflictError (409)", "Conflict"],
              ["UnprocessableEntityError (422)", "Business validation"],
              ["TooManyRequestsError (429)", "Rate limit"],
              ["InternalServerError (500)", "Server error"],
              ["ServiceUnavailableError (503)", "Service unavailable"],
            ].map(([func, desc]) => (
              <tr key={func} className="border-b border-border-primary/50 hover:bg-bg-tertiary/50 transition-colors">
                <td className="px-4 py-2 font-mono text-accent text-xs">{func}</td>
                <td className="px-4 py-2">{desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <CodeBlock code={`import { asyncHandler, NotFoundError } from "@buntok/core/helpers";

app.get("/users/:id", asyncHandler(async (ctx) => {
  const user = await findUser(ctx.params.id);
  if (!user) throw new NotFoundError("User not found");
  return ctx.json(user);
}));`} />
      <Callout type="info">
        See <a href="/docs/error-handling" className="text-accent hover:underline">Error Handling</a> for full details.
      </Callout>

      {/* ──────────────── FILE UPLOAD ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        File Upload
      </Heading>
      <CodeBlock
        code={`import { handleUploads, LocalDiskStorage } from "@buntok/core/upload";

const result = await handleUploads(ctx, {
  storage: new LocalDiskStorage("./uploads"),
  maxFileSize: 5 * 1024 * 1024,
  fields: {
    avatar: { required: true, allowedMimeTypes: ["image/png"] },
  },
});

result.fields.avatar // UploadedFile | ImageUploadedFile (if outputFormat set)
result.files         // (UploadedFile | ImageUploadedFile)[]`}
      />
      <Callout type="info">
        See the{" "}
        <a href="/docs/upload" className="text-accent hover:underline">
          Upload
        </a>{" "}
        page for full documentation including storage drivers, custom filenames,
        and middleware.
      </Callout>

      {/* ──────────────── CRYPTO ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Crypto Helpers
      </Heading>
      <div className="my-4 overflow-x-auto">
        <table className="w-full text-sm text-text-secondary border border-border-primary rounded-lg overflow-hidden">
          <thead className="bg-bg-tertiary border-b border-border-primary">
            <tr>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Function
              </th>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Description
              </th>
            </tr>
          </thead>
          <tbody>
            {[
              ["hash(data, algorithm?) — SYNC", "Hash data (default: SHA-256, Bun.CryptoHasher)"],
              ["sha256(data) — SYNC", "SHA-256 hash"],
              ["sha512(data) — SYNC", "SHA-512 hash"],
              ["md5(data) — async", "MD5 hash (pure JS)"],
              ["hmac(data, key, algorithm?) — async", "HMAC hash (WebCrypto)"],
              ["hashVerify(data, expected, algorithm?) — async", "Verify hash matches"],
              ["randomBytes(length)", "Random bytes as Uint8Array"],
              ["randomHex(length)", "Random hex string"],
              ["randomAlphaNumeric(length)", "Random alphanumeric string"],
              ["randomToken(length?)", "Random URL-safe token"],
              ["encrypt(data, key, iv?) → {ciphertext, iv}", "AES-256-GCM encrypt (iv hex)"],
              ["decrypt(ciphertext, key, iv)", "AES-256-GCM decrypt"],
            ].map(([func, desc]) => (
              <tr
                key={func}
                className="border-b border-border-primary/50 hover:bg-bg-tertiary/50 transition-colors"
              >
                <td className="px-4 py-2 font-mono text-accent text-xs">
                  {func}
                </td>
                <td className="px-4 py-2">{desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <CodeBlock
        code={`import { hash, sha256, md5, randomHex, randomToken, encrypt, decrypt } from "@buntok/core/helpers";

// hash/sha256/sha512 are SYNC (Bun.CryptoHasher)
const h = hash("hello world"); // default SHA-256, or hash("data", "SHA-512")
const h2 = sha256("hello world"); // sync
const md5Hash = await md5("hello world"); // async pure JS
const hex = randomHex(16); // "a1b2c3..."
const token = randomToken(); // "dGhpcyBpcyBh..."
const { ciphertext, iv } = await encrypt("secret", key); // AES-256-GCM, iv is hex
const decrypted = await decrypt(ciphertext, key, iv);`}
      />

      {/* ──────────────── DATE ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Date Helpers
      </Heading>
      <div className="my-4 overflow-x-auto">
        <table className="w-full text-sm text-text-secondary border border-border-primary rounded-lg overflow-hidden">
          <thead className="bg-bg-tertiary border-b border-border-primary">
            <tr>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Function
              </th>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Description
              </th>
            </tr>
          </thead>
          <tbody>
            {[
              ["formatDate(date)", "Format date as ISO string"],
              ["timeAgo(date)", "Human-readable relative time"],
              ["daysBetween(date1, date2)", "Days between two dates"],
              ["addDays(date, days)", "Add days to a date"],
              ["isBefore(date1, date2)", "Check if date1 is before date2"],
              ["isAfter(date1, date2)", "Check if date1 is after date2"],
              ["startOfDay(date)", "Get start of day"],
              ["endOfDay(date)", "Get end of day"],
              ["formatDuration(seconds)", "Format seconds as human-readable"],
            ].map(([func, desc]) => (
              <tr
                key={func}
                className="border-b border-border-primary/50 hover:bg-bg-tertiary/50 transition-colors"
              >
                <td className="px-4 py-2 font-mono text-accent text-xs">
                  {func}
                </td>
                <td className="px-4 py-2">{desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <CodeBlock
        code={`import { timeAgo, addDays, formatDuration, startOfDay } from "@buntok/core/helpers";

timeAgo(new Date("2024-01-01")); // "3 months ago"
const tomorrow = addDays(new Date(), 1);
formatDuration(3661); // "1h 1m 1s"
startOfDay(new Date()); // 00:00:00 today`}
      />

      {/* ──────────────── STRING ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        String Helpers
      </Heading>
      <div className="my-4 overflow-x-auto">
        <table className="w-full text-sm text-text-secondary border border-border-primary rounded-lg overflow-hidden">
          <thead className="bg-bg-tertiary border-b border-border-primary">
            <tr>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Function
              </th>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Description
              </th>
            </tr>
          </thead>
          <tbody>
            {[
              ["slugify(str)", "URL-friendly slug"],
              ["truncate(str, max, suffix?)", "Truncate with ellipsis"],
              ["capitalize(str)", "Capitalize first letter"],
              ["camelCase(str)", "Convert to camelCase"],
              ["snakeCase(str)", "Convert to snake_case"],
              ["kebabCase(str)", "Convert to kebab-case"],
            ].map(([func, desc]) => (
              <tr
                key={func}
                className="border-b border-border-primary/50 hover:bg-bg-tertiary/50 transition-colors"
              >
                <td className="px-4 py-2 font-mono text-accent text-xs">
                  {func}
                </td>
                <td className="px-4 py-2">{desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <CodeBlock
        code={`import { slugify, truncate, camelCase, kebabCase } from "@buntok/core/helpers";

slugify("Hello World!"); // "hello-world"
truncate("Long text here", 10); // "Long te..."
camelCase("hello_world"); // "helloWorld"
kebabCase("helloWorld"); // "hello-world"`}
      />

      {/* ──────────────── NUMBER ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Number Helpers
      </Heading>
      <div className="my-4 overflow-x-auto">
        <table className="w-full text-sm text-text-secondary border border-border-primary rounded-lg overflow-hidden">
          <thead className="bg-bg-tertiary border-b border-border-primary">
            <tr>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Function
              </th>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Description
              </th>
            </tr>
          </thead>
          <tbody>
            {[
              ["clamp(value, min, max)", "Clamp number to range"],
              ["random(min, max)", "Random integer in range"],
              ["randomFloat(min, max)", "Random float in range"],
              ["formatNumber(n, locale?)", "Format number with locale"],
              ["formatBytes(bytes)", "Format bytes as human-readable"],
              ["formatCurrency(amount, currency, locale?)", "Format as currency"],
            ].map(([func, desc]) => (
              <tr
                key={func}
                className="border-b border-border-primary/50 hover:bg-bg-tertiary/50 transition-colors"
              >
                <td className="px-4 py-2 font-mono text-accent text-xs">
                  {func}
                </td>
                <td className="px-4 py-2">{desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <CodeBlock
        code={`import { clamp, formatBytes, formatCurrency } from "@buntok/core/helpers";

clamp(15, 0, 10); // 10
formatBytes(1536); // "1.5 KB"
formatCurrency(25000, "IDR"); // "Rp 25.000"`}
      />

      {/* ──────────────── OBJECT ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Object Helpers
      </Heading>
      <div className="my-4 overflow-x-auto">
        <table className="w-full text-sm text-text-secondary border border-border-primary rounded-lg overflow-hidden">
          <thead className="bg-bg-tertiary border-b border-border-primary">
            <tr>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Function
              </th>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Description
              </th>
            </tr>
          </thead>
          <tbody>
            {[
              ["pick(obj, keys)", "Pick specified keys"],
              ["omit(obj, keys)", "Omit specified keys"],
              ["groupBy(arr, key)", "Group array by key"],
              ["uniq(arr)", "Remove duplicates"],
              ["flatten(arr, depth?)", "Flatten nested array"],
              ["chunk(arr, size)", "Split array into chunks"],
              ["deepMerge(target, ...sources)", "Deep merge objects"],
              ["flattenObject(obj, sep?)", "Flatten nested object"],
            ].map(([func, desc]) => (
              <tr
                key={func}
                className="border-b border-border-primary/50 hover:bg-bg-tertiary/50 transition-colors"
              >
                <td className="px-4 py-2 font-mono text-accent text-xs">
                  {func}
                </td>
                <td className="px-4 py-2">{desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <CodeBlock
        code={`import { pick, omit, groupBy, uniq, deepMerge } from "@buntok/core/helpers";

pick({ a: 1, b: 2, c: 3 }, ["a", "c"]); // { a: 1, c: 3 }
omit({ a: 1, b: 2 }, ["b"]); // { a: 1 }
groupBy([{ type: "a" }, { type: "b" }, { type: "a" }], "type");
// { a: [...], b: [...] }
uniq([1, 2, 2, 3]); // [1, 2, 3]
deepMerge({ a: 1 }, { b: 2 }); // { a: 1, b: 2 }`}
      />

      {/* ──────────────── NETWORK ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Network Helpers
      </Heading>
      <div className="my-4 overflow-x-auto">
        <table className="w-full text-sm text-text-secondary border border-border-primary rounded-lg overflow-hidden">
          <thead className="bg-bg-tertiary border-b border-border-primary">
            <tr>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Function
              </th>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Description
              </th>
            </tr>
          </thead>
          <tbody>
            {[
              ["getClientIP(request)", "Extract client IP from request"],
              ["isPrivateIP(ip)", "Check if IP is private/local"],
              ["parseUserAgent(request)", "Parse User-Agent header"],
            ].map(([func, desc]) => (
              <tr
                key={func}
                className="border-b border-border-primary/50 hover:bg-bg-tertiary/50 transition-colors"
              >
                <td className="px-4 py-2 font-mono text-accent text-xs">
                  {func}
                </td>
                <td className="px-4 py-2">{desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <CodeBlock
        code={`import { getClientIP, isPrivateIP, parseUserAgent } from "@buntok/core/helpers";

const ip = getClientIP(request);
isPrivateIP("192.168.1.1"); // true
const ua = parseUserAgent(request);
// { browser: "Chrome", os: "Windows", device: "desktop" }`}
      />

      {/* ──────────────── COOKIE ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Cookie Helpers
      </Heading>
      <div className="my-4 overflow-x-auto">
        <table className="w-full text-sm text-text-secondary border border-border-primary rounded-lg overflow-hidden">
          <thead className="bg-bg-tertiary border-b border-border-primary">
            <tr>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Function
              </th>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Description
              </th>
            </tr>
          </thead>
          <tbody>
            {[
              ["getCookie(request, name)", "Get cookie from Request"],
              ["getCookies(request)", "Get all cookies from Request"],
              ["setCookie(response, name, value, options?)", "Set cookie on Response"],
              ["deleteCookie(response, name, options?)", "Delete cookie on Response"],
              ["parseCookies(cookieHeader)", "Parse Cookie header string"],
              ["serializeCookie(name, value, options?)", "Serialize cookie to string"],
            ].map(([func, desc]) => (
              <tr
                key={func}
                className="border-b border-border-primary/50 hover:bg-bg-tertiary/50 transition-colors"
              >
                <td className="px-4 py-2 font-mono text-accent text-xs">
                  {func}
                </td>
                <td className="px-4 py-2">{desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <CodeBlock
        code={`import { setCookie, deleteCookie, getCookie } from "@buntok/core/helpers";

// Set cookie on response
const response = ctx.json({ ok: true });
return setCookie(response, "token", "abc123", {
  httpOnly: true,
  secure: true,
  sameSite: "lax",
  path: "/",
  maxAge: 86400,
});

// Delete cookie
return deleteCookie(response, "token", { path: "/" });`}
      />

      {/* ──────────────── ID GENERATORS ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        ID Generators
      </Heading>
      <div className="my-4 overflow-x-auto">
        <table className="w-full text-sm text-text-secondary border border-border-primary rounded-lg overflow-hidden">
          <thead className="bg-bg-tertiary border-b border-border-primary">
            <tr>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Function
              </th>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Description
              </th>
            </tr>
          </thead>
          <tbody>
            {[
              ["nanoid(size?)", "URL-safe unique ID (default: 21 chars)"],
              ["ulid()", "Sortable unique ID (时间排序)"],
              ["generateCode(prefix?, counter?)", "Generate sequential code (ORD-001)"],
              ["resetCounter(prefix?)", "Reset counter for generateCode"],
            ].map(([func, desc]) => (
              <tr
                key={func}
                className="border-b border-border-primary/50 hover:bg-bg-tertiary/50 transition-colors"
              >
                <td className="px-4 py-2 font-mono text-accent text-xs">
                  {func}
                </td>
                <td className="px-4 py-2">{desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <CodeBlock
        code={`import { nanoid, ulid } from "@buntok/core/helpers";

nanoid(); // "V1StGXR8_Z5jdHi6B-myT"
ulid(); // "01ARZ3NDEKTSV4RRFFQ69G5FAV"
generateCode("ORD"); // "ORD-001"
generateCode("ORD"); // "ORD-002"`}
      />
    </div>
  );
}
