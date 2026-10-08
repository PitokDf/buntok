import { Heading } from "@/components/ui/Heading";
import { CodeBlock } from "@/components/ui/CodeBlock";
import { Callout } from "@/components/ui/Callout";

export const metadata = {
  title: "FFI & Native Helpers",
  description: "Optional native acceleration via Bun FFI for JSON escaping, query parsing, and cookie parsing.",
};

export default function FfiPage() {
  return (
    <div>
      <Heading level={1} className="text-4xl font-bold mt-8 mb-4 text-text-primary">
        FFI & Native Helpers
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Buntok includes an optional native acceleration layer powered by{" "}
        <code>bun:ffi</code>. When the native library is available, it accelerates
        JSON string escaping, query parsing, and cookie parsing. When unavailable,
        pure JS fallbacks are used transparently.
      </p>

      <Callout type="info">
        This is an internal optimization. You don't need to configure anything - the
        framework automatically detects and uses the best available backend.
      </Callout>

      {/* ──────────────── HOW IT WORKS ──────────────── */}
      <Heading level={2} className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2">
        How It Works
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        On startup, Buntok attempts to load a native shared library (<code>libbuntok_json</code>)
        from your project's <code>node_modules/.buntok-native/</code>,{" "}
        <code>dist/native/</code>, or <code>zig-out/lib/</code> directories.
        If found, the native backend is used for performance-critical operations.
      </p>
      <div className="overflow-x-auto my-4">
        <table className="min-w-full border border-border-primary text-sm">
          <thead>
            <tr className="bg-bg-secondary">
              <th className="border border-border-primary px-4 py-2 text-left text-text-primary">Operation</th>
              <th className="border border-border-primary px-4 py-2 text-left text-text-primary">Native</th>
              <th className="border border-border-primary px-4 py-2 text-left text-text-primary">JS Fallback</th>
            </tr>
          </thead>
          <tbody>
            <tr><td className="border border-border-primary px-4 py-2 text-text-secondary">JSON string escaping</td><td className="border border-border-primary px-4 py-2 text-text-secondary">Zig-optimized via FFI</td><td className="border border-border-primary px-4 py-2 text-text-secondary">Pure JS implementation</td></tr>
            <tr><td className="border border-border-primary px-4 py-2 text-text-secondary">Query string parsing</td><td className="border border-border-primary px-4 py-2 text-text-secondary">JS (same as fallback)</td><td className="border border-border-primary px-4 py-2 text-text-secondary">Pure JS implementation</td></tr>
            <tr><td className="border border-border-primary px-4 py-2 text-text-secondary">Cookie parsing</td><td className="border border-border-primary px-4 py-2 text-text-secondary">JS (same as fallback)</td><td className="border border-border-primary px-4 py-2 text-text-secondary">Pure JS implementation</td></tr>
          </tbody>
        </table>
      </div>

      {/* ──────────────── CHECKING STATUS ──────────────── */}
      <Heading level={2} className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2">
        Checking Native Status
      </Heading>
      <CodeBlock
        code={`import { isNativeAvailable, getBackend } from "@buntok/core";

// Check if native FFI is available
if (isNativeAvailable()) {
  console.log("Native acceleration enabled");
} else {
  console.log("Using JS fallbacks");
}

// Get the current backend name
const backend = getBackend(); // "native" | "js"
console.log(\`Backend: \${backend}\`);`}
      />

      {/* ──────────────── INSTALLING NATIVE LIB ──────────────── */}
      <Heading level={2} className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2">
        Installing the Native Library
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        The native library is optional. To enable it, build the{" "}
        <code>libbuntok_json</code> shared library and place it in one of these
        locations:
      </p>
      <ul className="list-disc list-inside my-3 text-text-secondary">
        <li><code>node_modules/.buntok-native/libbuntok_json.{`{so,dylib,dll}`}</code></li>
        <li><code>dist/native/libbuntok_json.{`{so,dylib,dll}`}</code></li>
        <li><code>zig-out/lib/libbuntok_json.{`{so,dylib,dll}`}</code></li>
      </ul>
      <CodeBlock
        code={`# Build with Zig (if available)
zig build -Doptimize=ReleaseFast

# The library will be output to zig-out/lib/
ls zig-out/lib/libbuntok_json.so  # Linux
ls zig-out/lib/libbuntok_json.dylib  # macOS`}
      />

      {/* ──────────────── URL ROUTING TRIE ──────────────── */}
      <Heading level={2} className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2">
        URL Routing Trie
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Buntok uses a Trie-based URL router for efficient pattern matching. The
        native Trie was benchmarked and found to be 38% slower than the pure JS
        implementation due to FFI sync overhead, so the JS version is used by default.
      </p>
      <Callout type="info">
        The JS Trie is optimal because V8/JSC optimizes <code>Map.get/set</code> in
        native C++, making the FFI round-trip overhead unnecessary.
      </Callout>

      {/* ──────────────── PERFORMANCE ──────────────── */}
      <Heading level={2} className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2">
        Performance Notes
      </Heading>
      <ul className="list-disc list-inside my-3 text-text-secondary">
        <li>JSON string escaping: ~2-3x faster with native backend</li>
        <li>Query/cookie parsing: identical performance (JS-only)</li>
        <li>URL routing: JS is faster than native+JS due to no FFI sync overhead</li>
        <li>The framework auto-selects the best backend per operation</li>
      </ul>
    </div>
  );
}
