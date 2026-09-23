import { Heading } from "@/components/ui/Heading";
import { Callout } from "@/components/ui/Callout";
import { CodeBlock } from "@/components/ui/CodeBlock";

export const metadata = {
  title: "File Serving / Download / Export / Archive",
  description: "Serve files, file downloads, data export (CSV/JSON), and archive creation.",
};

export default function DownloadPage() {
  return (
    <div>
      <Heading
        level={1}
        className="text-4xl font-bold mt-8 mb-4 text-text-primary"
      >
        File Serving / Download / Export / Archive
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Helper functions for serving files, file downloads, data export, and archive creation.
        Zero dependencies — uses{" "}
        <code className="font-mono text-accent text-sm">Bun.Archive</code>{" "}
        (native tar) for archives.
      </p>
      <CodeBlock
        code={`import {
  serveFileOrFallback,
  downloadFile, downloadBuffer,
  exportCSV, exportJSON,
  createZIP,
} from "@buntok/core";`}
      />

      {/* ──────────────── serveFileOrFallback ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        serveFileOrFallback
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Serve a file from disk. If file doesn't exist, return the fallback response.
        Useful for serving user uploads with a default fallback (e.g., avatar with initials).
      </p>
      <div className="my-4 overflow-x-auto">
        <table className="w-full text-sm text-text-secondary border border-border-primary rounded-lg overflow-hidden">
          <thead className="bg-bg-tertiary border-b border-border-primary">
            <tr>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Parameter
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
            <tr className="border-b border-border-primary/50">
              <td className="px-4 py-2 font-mono text-accent text-xs">
                ctx
              </td>
              <td className="px-4 py-2">Context</td>
              <td className="px-4 py-2">Request context</td>
            </tr>
            <tr className="border-b border-border-primary/50">
              <td className="px-4 py-2 font-mono text-accent text-xs">
                filePath
              </td>
              <td className="px-4 py-2">string</td>
              <td className="px-4 py-2">Path to the file on disk</td>
            </tr>
            <tr className="border-b border-border-primary/50">
              <td className="px-4 py-2 font-mono text-accent text-xs">
                fallback
              </td>
              <td className="px-4 py-2">
                {`Response | (() => Response | Promise<Response>)`}
              </td>
              <td className="px-4 py-2">
                Response to return if file not found
              </td>
            </tr>
            <tr className="border-b border-border-primary/50">
              <td className="px-4 py-2 font-mono text-accent text-xs">
                options?
              </td>
              <td className="px-4 py-2">
                {`{ contentType?, cacheControl? }`}
              </td>
              <td className="px-4 py-2">Response options</td>
            </tr>
          </tbody>
        </table>
      </div>
      <CodeBlock
        code={`import { serveFileOrFallback, generateInitialAvatar } from "@buntok/core";

// Serve file or return 404
app.get("/documents/:id", async (ctx) => {
  return serveFileOrFallback(ctx, doc.file_path, () => {
    return ctx.json({ error: "Not found" }, 404);
  });
});

// Serve avatar or return default SVG initials
app.get("/avatars/:userId", async (ctx) => {
  const user = await db.users.find(ctx.params.userId);
  return serveFileOrFallback(ctx, user.avatar_path, () => {
    return new Response(generateInitialAvatar(user.name, user.id), {
      headers: { "Content-Type": "image/svg+xml" }
    });
  });
});

// With custom cache control
app.get("/images/:name", async (ctx) => {
  return serveFileOrFallback(ctx, \`./uploads/\${ctx.params.name}\`, () => {
    return new Response("Not found", { status: 404 });
  }, { cacheControl: "public, max-age=3600" });
});`}
      />
      <Callout type="info">
        File is served with <strong>inline</strong> content disposition (displayed in browser).
        Use <code>downloadFile</code> for forced downloads with <code>attachment</code> disposition.
      </Callout>

      {/* ──────────────── downloadFile ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        downloadFile
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Serve a file for download with{" "}
        <code className="font-mono text-accent text-sm">
          Content-Disposition: attachment
        </code>{" "}
        header.
      </p>
      <div className="my-4 overflow-x-auto">
        <table className="w-full text-sm text-text-secondary border border-border-primary rounded-lg overflow-hidden">
          <thead className="bg-bg-tertiary border-b border-border-primary">
            <tr>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Parameter
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
            <tr className="border-b border-border-primary/50">
              <td className="px-4 py-2 font-mono text-accent text-xs">
                ctx
              </td>
              <td className="px-4 py-2">Context</td>
              <td className="px-4 py-2">Request context</td>
            </tr>
            <tr className="border-b border-border-primary/50">
              <td className="px-4 py-2 font-mono text-accent text-xs">
                filePath
              </td>
              <td className="px-4 py-2">string</td>
              <td className="px-4 py-2">Path to the file</td>
            </tr>
            <tr className="border-b border-border-primary/50">
              <td className="px-4 py-2 font-mono text-accent text-xs">
                filename?
              </td>
              <td className="px-4 py-2">string</td>
              <td className="px-4 py-2">
                Download filename (defaults to basename)
              </td>
            </tr>
            <tr className="border-b border-border-primary/50">
              <td className="px-4 py-2 font-mono text-accent text-xs">
                options?
              </td>
              <td className="px-4 py-2">
                {`{ contentType?, cacheControl? }`}
              </td>
              <td className="px-4 py-2">Response options</td>
            </tr>
          </tbody>
        </table>
      </div>
      <CodeBlock
        code={`import { downloadFile } from "@buntok/core";

// Serve file as download
app.get("/reports/:id", async (ctx) => {
  return downloadFile(ctx, \`./reports/\${ctx.params.id}.pdf\`);
});

// Custom filename
app.get("/export/users", async (ctx) => {
  return downloadFile(ctx, "./data/users.csv", "users-export.csv");
});

// With options
app.get("/download/:filename", async (ctx) => {
  return downloadFile(ctx, \`./files/\${ctx.params.filename}\`, undefined, {
    cacheControl: "no-cache",
  });
});`}
      />
      <Callout type="info">
        Returns <strong>404</strong> if file not found. Content type is
        auto-detected via <code>Bun.file()</code>.
      </Callout>

      {/* ──────────────── downloadBuffer ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        downloadBuffer
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Download a buffer or bytes as a file.
      </p>
      <div className="my-4 overflow-x-auto">
        <table className="w-full text-sm text-text-secondary border border-border-primary rounded-lg overflow-hidden">
          <thead className="bg-bg-tertiary border-b border-border-primary">
            <tr>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Parameter
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
            <tr className="border-b border-border-primary/50">
              <td className="px-4 py-2 font-mono text-accent text-xs">
                ctx
              </td>
              <td className="px-4 py-2">Context</td>
              <td className="px-4 py-2">Request context</td>
            </tr>
            <tr className="border-b border-border-primary/50">
              <td className="px-4 py-2 font-mono text-accent text-xs">
                data
              </td>
              <td className="px-4 py-2">
                {`ArrayBuffer | Uint8Array | Blob`}
              </td>
              <td className="px-4 py-2">File data to download</td>
            </tr>
            <tr className="border-b border-border-primary/50">
              <td className="px-4 py-2 font-mono text-accent text-xs">
                filename
              </td>
              <td className="px-4 py-2">string</td>
              <td className="px-4 py-2">Download filename</td>
            </tr>
            <tr className="border-b border-border-primary/50">
              <td className="px-4 py-2 font-mono text-accent text-xs">
                options?
              </td>
              <td className="px-4 py-2">
                {`{ contentType? }`}
              </td>
              <td className="px-4 py-2">Response options</td>
            </tr>
          </tbody>
        </table>
      </div>
      <CodeBlock
        code={`import { downloadBuffer } from "@buntok/core";

// Generate PDF on the fly
app.get("/generate-pdf", async (ctx) => {
  const pdfBytes = await generatePDF(data);
  return downloadBuffer(ctx, pdfBytes, "document.pdf");
});

// From Uint8Array
app.get("/download-binary", async (ctx) => {
  const buffer = new Uint8Array([72, 101, 108, 108, 111]);
  return downloadBuffer(ctx, buffer, "data.bin", {
    contentType: "application/octet-stream",
  });
});`}
      />

      {/* ──────────────── exportCSV ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        exportCSV
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Export array of objects as CSV file download. Handles commas, quotes,
        and newlines (RFC 4180 compliant).
      </p>
      <div className="my-4 overflow-x-auto">
        <table className="w-full text-sm text-text-secondary border border-border-primary rounded-lg overflow-hidden">
          <thead className="bg-bg-tertiary border-b border-border-primary">
            <tr>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Parameter
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
            <tr className="border-b border-border-primary/50">
              <td className="px-4 py-2 font-mono text-accent text-xs">
                ctx
              </td>
              <td className="px-4 py-2">Context</td>
              <td className="px-4 py-2">Request context</td>
            </tr>
            <tr className="border-b border-border-primary/50">
              <td className="px-4 py-2 font-mono text-accent text-xs">
                data
              </td>
              <td className="px-4 py-2">{"T[]"}</td>
              <td className="px-4 py-2">Array of objects to export</td>
            </tr>
            <tr className="border-b border-border-primary/50">
              <td className="px-4 py-2 font-mono text-accent text-xs">
                filename?
              </td>
              <td className="px-4 py-2">string</td>
              <td className="px-4 py-2">Download filename (default: export.csv)</td>
            </tr>
            <tr className="border-b border-border-primary/50">
              <td className="px-4 py-2 font-mono text-accent text-xs">
                options?
              </td>
              <td className="px-4 py-2">
                {`{ delimiter?, header? }`}
              </td>
              <td className="px-4 py-2">CSV options</td>
            </tr>
          </tbody>
        </table>
      </div>
      <CodeBlock
        code={`import { exportCSV } from "@buntok/core";

// Export users as CSV
app.get("/users/export", async (ctx) => {
  const users = await db.users.find();
  return exportCSV(ctx, users, "users.csv");
});

// Custom delimiter
app.get("/orders/export", async (ctx) => {
  const orders = await db.orders.find();
  return exportCSV(ctx, orders, "orders.tsv", { delimiter: "\\t" });
});

// Without header row
app.get("/data/export", async (ctx) => {
  return exportCSV(ctx, rows, "data.csv", { header: false });
});`}
      />
      <Callout type="info">
        Auto-escapes values containing commas, quotes, or newlines. Nested
        objects are flattened with dot notation (e.g.,{" "}
        <code>user.name</code>).
      </Callout>

      {/* ──────────────── exportJSON ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        exportJSON
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Export data as JSON file download.
      </p>
      <CodeBlock
        code={`import { exportJSON } from "@buntok/core";

app.get("/data/export", async (ctx) => {
  const data = await db.orders.find();
  return exportJSON(ctx, data, "orders.json");
});`}
      />

      {/* ──────────────── createZIP ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        createZIP
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Create a tar archive from multiple files and serve as download. Uses{" "}
        <code className="font-mono text-accent text-sm">Bun.Archive</code>{" "}
        (native).
      </p>
      <div className="my-4 overflow-x-auto">
        <table className="w-full text-sm text-text-secondary border border-border-primary rounded-lg overflow-hidden">
          <thead className="bg-bg-tertiary border-b border-border-primary">
            <tr>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Parameter
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
            <tr className="border-b border-border-primary/50">
              <td className="px-4 py-2 font-mono text-accent text-xs">
                ctx
              </td>
              <td className="px-4 py-2">Context</td>
              <td className="px-4 py-2">Request context</td>
            </tr>
            <tr className="border-b border-border-primary/50">
              <td className="px-4 py-2 font-mono text-accent text-xs">
                files
              </td>
              <td className="px-4 py-2">{"ZIPEntry[]"}</td>
              <td className="px-4 py-2">
                Files to include ({`{ name, data }`})
              </td>
            </tr>
            <tr className="border-b border-border-primary/50">
              <td className="px-4 py-2 font-mono text-accent text-xs">
                filename?
              </td>
              <td className="px-4 py-2">string</td>
              <td className="px-4 py-2">Download filename (default: archive.tar)</td>
            </tr>
            <tr className="border-b border-border-primary/50">
              <td className="px-4 py-2 font-mono text-accent text-xs">
                options?
              </td>
              <td className="px-4 py-2">{"{ compress? }"}</td>
              <td className="px-4 py-2">
                Enable gzip compression
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <CodeBlock
        code={`import { createZIP, exportCSV, exportJSON } from "@buntok/core";

// Export multiple files as archive
app.get("/export/bundle", async (ctx) => {
  const users = await db.users.find();
  const orders = await db.orders.find();

  return createZIP(ctx, [
    { name: "users.csv", data: exportCSVToString(users) },
    { name: "orders.json", data: JSON.stringify(orders) },
  ], "export.tar");
});

// With gzip compression
app.get("/export/compressed", async (ctx) => {
  const data = await db.exports.find();
  return createZIP(ctx, [
    { name: "data.json", data: JSON.stringify(data) },
  ], "export.tar.gz", { compress: true });
});`}
      />
      <Callout type="info">
        Uses <strong>tar</strong> format (not zip). For{" "}
        <code>.tar.gz</code>, pass{" "}
        <code>{`{ compress: true }`}</code>.
      </Callout>
    </div>
  );
}
