import { Heading } from "@/components/ui/Heading";
import { CodeBlock } from "@/components/ui/CodeBlock";
import { Callout } from "@/components/ui/Callout";

export const metadata = {
  title: "File Upload",
  description: "Handle multipart file uploads with custom storage drivers, magic bytes verification, and validation.",
};


export default function UploadPage() {
  return (
    <div>
      <Heading
        level={1}
        className="text-4xl font-bold mt-8 mb-4 text-text-primary"
      >
        File Upload
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Parse multipart/form-data requests for file uploads. Supports storage
        drivers, field validation, magic bytes verification, custom filenames,
        and middleware mode.
      </p>

      {/* ──────────────── STORAGE DRIVERS ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Storage Drivers
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
                LocalDiskStorage
              </td>
              <td className="px-4 py-2">
                Saves files to disk. Auto-creates directories.
              </td>
            </tr>
            <tr className="border-b border-border-primary">
              <td className="px-4 py-2 font-mono text-accent">
                MemoryStorage
              </td>
              <td className="px-4 py-2">
                Stores files in memory as ArrayBuffer. Good for processing.
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <Heading
        level={3}
        className="text-xl font-semibold mt-6 mb-2 text-text-primary"
      >
        Custom Storage Driver
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Implement the <code>StorageDriver</code> interface to use S3, GCS, or
        any other storage:
      </p>
      <CodeBlock
        code={`import type { StorageDriver, UploadedFile } from "@buntok/core/upload";

class S3Storage implements StorageDriver {
  constructor(private bucket: string, private region: string) {}

  async handleFile(file: File, name: string, ext: string): Promise<UploadedFile> {
    const key = \`uploads/\${name}\${ext}\`;
    await s3.putObject({
      Bucket: this.bucket,
      Key: key,
      Body: file,
      ContentType: file.type,
    });

    return {
      originalName: file.name,
      name,
      ext,
      size: file.size,
      type: file.type,
      path: key, // S3 key as "path"
    };
  }

  async deleteFile(key: string): Promise<boolean> {
    await s3.deleteObject({ Bucket: this.bucket, Key: key });
    return true;
  }
}

// Usage
const result = await handleUploads(ctx, {
  storage: new S3Storage("my-bucket", "us-east-1"),
});`}
      />

      <Callout type="info">
        <code>StorageDriver</code> requires two methods:{" "}
        <code>handleFile(file, name, ext)</code> and optional{" "}
        <code>deleteFile(path)</code>.
      </Callout>

      {/* ──────────────── BASIC USAGE ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Basic Usage
      </Heading>
      <CodeBlock
        code={`import { handleUploads, LocalDiskStorage } from "@buntok/core/upload";

app.post("/upload", async (ctx) => {
  const result = await handleUploads(ctx, {
    storage: new LocalDiskStorage("./uploads"),
  });

  return ctx.json({ files: result.files.map(f => f.name) });
});`}
      />

      {/* ──────────────── UPLOAD OPTIONS ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Options
      </Heading>
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
                Description
              </th>
            </tr>
          </thead>
          <tbody>
            {[
              [
                "storage",
                "StorageDriver",
                "Required. LocalDiskStorage or MemoryStorage",
              ],
              [
                "maxFileSize",
                "number",
                "Global max file size in bytes",
              ],
              [
                "allowedMimeTypes",
                "MimeType[]",
                "Global allowed MIME types",
              ],
              [
                "filename",
                "(originalName, file) => { name, ext }",
                "Global filename generator",
              ],
              [
                "fields",
                "Record<string, UploadFieldConfig>",
                "Per-field config (required, size, types, filename)",
              ],
              [
                "verifyMagicBytes",
                "boolean",
                "Verify file magic bytes against MIME type (default: true)",
              ],
            ].map(([opt, type, desc]) => (
              <tr
                key={opt}
                className="border-b border-border-primary/50 hover:bg-bg-tertiary/50 transition-colors"
              >
                <td className="px-4 py-2 font-mono text-accent">{opt}</td>
                <td className="px-4 py-2 font-mono text-text-secondary text-xs">
                  {type}
                </td>
                <td className="px-4 py-2">{desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ──────────────── MAGIC BYTES VERIFICATION ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Magic Bytes Verification
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        By default, <code>handleUploads</code> verifies that the file's actual
        content matches the claimed MIME type by checking magic bytes (file
        signatures). This prevents users from uploading malicious files with
        spoofed MIME types.
      </p>

      <Callout type="warning">
        Magic bytes verification is <strong>enabled by default</strong>. A file
        claiming to be <code>image/png</code> but without the PNG signature
        (89 50 4E 47) will be rejected.
      </Callout>

      <CodeBlock
        code={`import { handleUploads, LocalDiskStorage } from "@buntok/core/upload";

// Magic bytes verification ON (default)
const result = await handleUploads(ctx, {
  storage: new LocalDiskStorage("./uploads"),
  allowedMimeTypes: ["image/png", "image/jpeg"],
});

// Disable magic bytes verification (not recommended)
const result = await handleUploads(ctx, {
  storage: new LocalDiskStorage("./uploads"),
  verifyMagicBytes: false,
});`}
      />

      <Heading
        level={3}
        className="text-xl font-semibold mt-6 mb-2 text-text-primary"
      >
        Supported Formats
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Magic bytes verification supports 45+ formats including images, videos,
        audio, documents, archives, and fonts. Text-based formats (JSON, HTML,
        CSS, etc.) skip verification as they have no reliable magic bytes.
      </p>

      <div className="my-4 overflow-x-auto">
        <table className="w-full text-sm text-text-secondary border border-border-primary rounded-lg overflow-hidden">
          <thead className="bg-bg-tertiary border-b border-border-primary">
            <tr>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Category
              </th>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Formats
              </th>
            </tr>
          </thead>
          <tbody>
            {[
              ["Images", "JPEG, PNG, GIF, WebP, BMP, TIFF, ICO, AVIF, HEIC, HEIF"],
              ["Videos", "MP4, WebM, OGG, QuickTime, AVI, Matroska, MPEG"],
              ["Audio", "MP3, WAV, OGG, WebM, AAC, FLAC, M4A"],
              ["Documents", "PDF, RTF"],
              ["Office", "DOC, DOCX, XLS, XLSX, PPT, PPTX"],
              ["OpenDocument", "ODT, ODS, ODP"],
              ["Archives", "ZIP, 7Z, RAR, GZIP, TAR, BZIP2"],
              ["Fonts", "WOFF, WOFF2, TTF, OTF"],
            ].map(([category, formats]) => (
              <tr
                key={category}
                className="border-b border-border-primary/50 hover:bg-bg-tertiary/50 transition-colors"
              >
                <td className="px-4 py-2 font-mono text-accent">{category}</td>
                <td className="px-4 py-2">{formats}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ──────────────── FIELD CONFIG ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        UploadFieldConfig
      </Heading>
      <div className="my-4 overflow-x-auto">
        <table className="w-full text-sm text-text-secondary border border-border-primary rounded-lg overflow-hidden">
          <thead className="bg-bg-tertiary border-b border-border-primary">
            <tr>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Field
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
              ["required", "boolean", "Reject if field is missing (default: false)"],
              [
                "maxFileSize",
                "number",
                "Max size in bytes (overrides global)",
              ],
              [
                "allowedMimeTypes",
                "MimeType[]",
                "Allowed types (overrides global)",
              ],
              [
                "filename",
                "(originalName, file) => { name, ext }",
                "Filename generator (overrides global)",
              ],
              [
                "outputFormat",
                '"webp" | "png" | "jpeg" | "avif"',
                "Force image conversion on upload",
              ],
              [
                "multiple",
                "boolean",
                "Accept multiple files for this field (default: false)",
              ],
            ].map(([field, type, desc]) => (
              <tr
                key={field}
                className="border-b border-border-primary/50 hover:bg-bg-tertiary/50 transition-colors"
              >
                <td className="px-4 py-2 font-mono text-accent">{field}</td>
                <td className="px-4 py-2 font-mono text-text-secondary text-xs">
                  {type}
                </td>
                <td className="px-4 py-2">{desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ──────────────── IMAGE CONVERSION ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Image Conversion
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Use <code>outputFormat</code> to automatically convert uploaded images.
        The result is an <code>ImageUploadedFile</code> with metadata like width,
        height, and format:
      </p>
      <CodeBlock
        code={`const result = await handleUploads(ctx, {
  storage: new LocalDiskStorage("./uploads"),
  fields: {
    avatar: {
      required: true,
      outputFormat: "webp", // Convert to WebP
    },
  },
});

// result.fields.avatar is ImageUploadedFile
const avatar = result.fields.avatar;
if (avatar.kind === "image") {
  console.log(avatar.width, avatar.height, avatar.format);
  // avatar.originalType / avatar.originalExt if format changed
}`}
      />

      {/* ──────────────── VALIDATION ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Validation
      </Heading>
      <CodeBlock
        code={`import { handleUploads, LocalDiskStorage } from "@buntok/core/upload";

const result = await handleUploads(ctx, {
  storage: new LocalDiskStorage("./uploads"),
  maxFileSize: 5 * 1024 * 1024, // 5MB global
  allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
  fields: {
    avatar: {
      required: true,
      maxFileSize: 2 * 1024 * 1024, // 2MB (overrides global)
      allowedMimeTypes: ["image/jpeg", "image/png"],
    },
    document: {
      required: false,
      maxFileSize: 10 * 1024 * 1024, // 10MB
    },
  },
});`}
      />

      <Callout type="warning">
        Throws <code>BadRequestError</code> if validation fails (size, MIME type,
        magic bytes mismatch, or required fields missing).
      </Callout>

      {/* ──────────────── UPLOADED FILE ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        UploadedFile
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
              ["originalName", "string", "Original filename from user"],
              [
                "name",
                "string",
                "Generated name (with UUID)",
              ],
              ["ext", "string", "File extension with dot (e.g. .png)"],
              ["size", "number", "File size in bytes"],
              ["type", "string", "MIME type"],
              [
                "buffer",
                "ArrayBuffer",
                "File data (MemoryStorage only)",
              ],
              [
                "path",
                "string",
                "Absolute path on disk (LocalDiskStorage only)",
              ],
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

      {/* ──────────────── RESULT ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Result
      </Heading>
      <CodeBlock
        code={`const result = await handleUploads(ctx, options);

result.fields.name       // string (text field)
result.fields.avatar     // UploadedFile (file field)
result.fields.gallery    // UploadedFile[] (multiple files with same key)
result.files             // UploadedFile[] (all files, flattened)`}
      />

      <Heading
        level={3}
        className="text-xl font-semibold mt-6 mb-2 text-text-primary"
      >
        Type-Safe Field Inference
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        The <code>ParseUploadResult</code> type automatically infers the correct
        type based on your field configuration:
      </p>

      <div className="my-4 overflow-x-auto">
        <table className="w-full text-sm text-text-secondary border border-border-primary rounded-lg overflow-hidden">
          <thead className="bg-bg-tertiary border-b border-border-primary">
            <tr>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Configuration
              </th>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Type
              </th>
            </tr>
          </thead>
          <tbody>
            {[
              ["{ required: true }", "UploadedFile"],
              ["{ maxFileSize: ... }", "UploadedFile | undefined"],
              ["{ allowedMimeTypes: [...] }", "UploadedFile | undefined"],
              ["{ maxFileSize, allowedMimeTypes }", "UploadedFile | undefined"],
              [
                "{} (no config)",
                "UploadedFile | UploadedFile[] | undefined",
              ],
            ].map(([config, type]) => (
              <tr
                key={config}
                className="border-b border-border-primary/50 hover:bg-bg-tertiary/50 transition-colors"
              >
                <td className="px-4 py-2 font-mono text-accent">{config}</td>
                <td className="px-4 py-2 font-mono text-text-secondary">
                  {type}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <CodeBlock
        code={`const result = await handleUploads(ctx, {
  storage: new LocalDiskStorage("./uploads"),
  fields: {
    avatar: {
      required: true,  // → UploadedFile (guaranteed)
      maxFileSize: 1024 * 1024 * 5,
    },
    thumbnail: {
      maxFileSize: 1024 * 1024,  // → UploadedFile | undefined
    },
    docs: {},  // → UploadedFile | UploadedFile[] | undefined
  },
});

// Autocomplete works correctly:
result.fields.avatar.name;      // ✅ OK (UploadedFile)
result.fields.thumbnail?.name;  // ✅ OK (UploadedFile | undefined)
// result.fields.docs.name;     // ❌ Error (need to narrow type first)`}
      />

      {/* ──────────────── UPLOADER MIDDLEWARE ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Uploader Middleware
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Use <code>uploader()</code> as middleware to auto-parse uploads and store
        results in <code>ctx.store</code>:
      </p>
      <CodeBlock
        code={`import { uploader, LocalDiskStorage } from "@buntok/core/upload";

const upload = uploader({
  storage: new LocalDiskStorage("./uploads"),
  maxFileSize: 5 * 1024 * 1024,
  fields: {
    avatar: { required: true },
  },
});

// As route middleware
app.post("/profile", upload, async (ctx) => {
  const files = ctx.store.files;  // UploadedFile[]
  const fields = ctx.store.fields;
  return ctx.json({ uploaded: files.length });
});

// As global middleware
app.use(uploader({
  storage: new LocalDiskStorage("./uploads"),
}));

// As group middleware
const api = app.group("/api");
api.use(uploader({ storage: new LocalDiskStorage("./uploads") }));`}
      />

      {/* ──────────────── CUSTOM FILENAME ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Custom Filename
      </Heading>
      <CodeBlock
        code={`// Global custom filename
const result = await handleUploads(ctx, {
  storage: new LocalDiskStorage("./uploads"),
  filename: (originalName, file) => {
    const ext = originalName.split(".").pop();
    return { name: \`upload-\${Date.now()}\`, ext: \`.\${ext}\` };
  },
});

// Per-field custom filename (overrides global)
const result = await handleUploads(ctx, {
  storage: new LocalDiskStorage("./uploads"),
  fields: {
    avatar: {
      filename: (originalName, file) => {
        return { name: \`avatar-\${Date.now()}\`, ext: ".jpg" };
      },
    },
  },
});`}
      />

      {/* ──────────────── DELETE FILE ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Delete Uploaded File
      </Heading>
      <CodeBlock
        code={`import { deleteUploadedFile, LocalDiskStorage } from "@buntok/core/upload";

const storage = new LocalDiskStorage("./uploads");
const result = await handleUploads(ctx, { storage });

// Delete a specific file
const file = result.fields.avatar;
if (file) {
  await deleteUploadedFile(storage, file);
}`}
      />

      {/* ──────────────── RATE LIMITING ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Rate Limiting
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Combine with the built-in rate limiter to prevent upload abuse:
      </p>
      <CodeBlock
        code={`import { uploader, LocalDiskStorage } from "@buntok/core/upload";
import { rateLimiter, slidingWindowRateLimiter } from "@buntok/core";

// Rate limit uploads to 10 per hour per user
app.post("/upload",
  rateLimiter({ windowMs: 60 * 60 * 1000, max: 10 }),
  uploader({ storage: new LocalDiskStorage("./uploads") }),
  async (ctx) => {
    return ctx.json({ uploaded: true });
  }
);

// Rate limit by IP with sliding window
app.post("/upload",
  slidingWindowRateLimiter({
    windowMs: 60 * 60 * 1000,
    max: 10,
    keyGenerator: (ctx) => ctx.request.ip,
  }),
  uploader({ storage: new LocalDiskStorage("./uploads") }),
  async (ctx) => {
    return ctx.json({ uploaded: true });
  }
);`}
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
import { handleUploads, LocalDiskStorage } from "@buntok/core/upload";

const app = new App();

const storage = new LocalDiskStorage("./uploads");

// Single file upload
app.post("/avatar", async (ctx) => {
  const result = await handleUploads(ctx, {
    storage,
    maxFileSize: 2 * 1024 * 1024, // 2MB
    fields: {
      avatar: {
        required: true,
        allowedMimeTypes: ["image/jpeg", "image/png"],
      },
    },
  });

  const avatar = result.fields.avatar;
  return ctx.json({ path: avatar.path, name: avatar.name });
});

// Multiple file upload
app.post("/gallery", async (ctx) => {
  const result = await handleUploads(ctx, {
    storage,
    maxFileSize: 10 * 1024 * 1024, // 10MB
    fields: {
      images: {
        required: true,
        allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
      },
    },
  });

  const images = result.fields.images; // UploadedFile[]
  return ctx.json({ count: images.length });
});

// Text fields + file
app.post("/post", async (ctx) => {
  const result = await handleUploads(ctx, {
    storage,
    fields: {
      cover: { required: true },
    },
  });

  const title = result.fields.title;  // string (text field)
  const cover = result.fields.cover;  // UploadedFile (file field)

  const post = await db.post.create({
    data: { title, coverPath: cover.path },
  });

  return ctx.json({ id: post.id });
});

app.listen(1212);`}
      />
    </div>
  );
}
