import type { Context } from "../context";

export interface ServeFileOptions {
	contentType?: string;
	cacheControl?: string;
}

/**
 * Extensions mapped directly to stay compatible with the legacy behavior
 * (e. `.js` → `application/javascript`) and so that common media/font
 * extensions don't fall through to `Bun.file().type` (an optional stat that
 * is expensive per-request). Extensions not listed here fall back to Bun's
 * native MIME DB.
 */
const MIME_TYPES: Record<string, string> = {
	png: "image/png",
	jpg: "image/jpeg",
	jpeg: "image/jpeg",
	webp: "image/webp",
	gif: "image/gif",
	svg: "image/svg+xml",
	pdf: "application/pdf",
	json: "application/json",
	txt: "text/plain",
	html: "text/html",
	css: "text/css",
	js: "application/javascript",
	csv: "text/csv",
	zip: "application/zip",
	xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
	docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
	mp4: "video/mp4",
	m4v: "video/mp4",
	webm: "video/webm",
	mov: "video/quicktime",
	mkv: "video/x-matroska",
	avi: "video/x-msvideo",
	mp3: "audio/mpeg",
	wav: "audio/wav",
	ogg: "audio/ogg",
	m4a: "audio/mp4",
	flac: "audio/flac",
	woff: "font/woff",
	woff2: "font/woff2",
	ttf: "font/ttf",
	otf: "font/otf",
	avif: "image/avif",
	ico: "image/x-icon",
	wasm: "application/wasm",
};

/**
 * Detect MIME type from file extension.
 *
 * Priority: `options.contentType` (caller) → extension map → Bun's native
 * MIME DB → `application/octet-stream`.
 */
export function detectMimeType(filePath: string): string {
	const ext = filePath.split(".").pop()?.toLowerCase();
	const known = ext ? MIME_TYPES[ext] : undefined;
	if (known) return known;
	const type = Bun.file(filePath).type;
	return type || "application/octet-stream";
}

interface CachedFile {
	value: ReturnType<typeof Bun.file>;
	size: number;
	expires: number;
}

/**
 * Cache `Bun.file()` + `size` per path, TTL 1 second.
 *
 * Without the cache, every request pays a sync stat ~6µs (`.size`) plus
 * `Bun.file()` construction - expensive for file endpoints with high
 * throughput. With the TTL, a file replaced on disk is visible at most 1
 * second late (Content-Range can be stale ≤1s).
 */
const FILE_CACHE_TTL_MS = 1000;
const FILE_CACHE_MAX = 512;
const fileCache = new Map<string, CachedFile>();

function getCachedFile(filePath: string): CachedFile {
	const now = Date.now();
	const hit = fileCache.get(filePath);
	if (hit && hit.expires > now) return hit;
	const value = Bun.file(filePath);
	const entry: CachedFile = { value, size: value.size, expires: now + FILE_CACHE_TTL_MS };
	if (fileCache.size >= FILE_CACHE_MAX) {
		const oldest = fileCache.keys().next();
		if (!oldest.done) fileCache.delete(oldest.value);
	}
	fileCache.set(filePath, entry);
	return entry;
}

type ParsedRange = { start: number; end: number } | "unsatisfiable" | null;

/**
 * Parse a `Range` header (RFC 7233) for a single `bytes=...` range.
 *
 * - `"unsatisfiable"` → reply 416 (Content-Range points at the full file size)
 * - `null` → ignore Range, serve the full 200 (servers are allowed to ignore
 *   multi-range & invalid syntax)
 */
function parseRangeHeader(header: string, size: number): ParsedRange {
	if (!header.startsWith("bytes=")) return null;
	const spec = header.slice(6).trim();
	// Multi-range (`bytes=0-1,5-6`) requires multipart/byteranges -
	// ignored per RFC (a server MAY ignore Range).
	if (spec.includes(",")) return null;
	const match = /^(\d*)-(\d*)$/.exec(spec);
	if (!match) return null;
	const [, rawStart, rawEnd] = match;
	if (rawStart === "" && rawEnd === "") return null;
	if (size === 0) return "unsatisfiable";

	// Suffix range: `bytes=-N` → last N bytes
	if (rawStart === "") {
		const suffix = Number(rawEnd);
		if (suffix === 0) return "unsatisfiable";
		return { start: Math.max(0, size - suffix), end: size - 1 };
	}

	const start = Number(rawStart);
	if (start >= size) return "unsatisfiable";
	if (rawEnd === "") return { start, end: size - 1 };

	let end = Number(rawEnd);
	// first-byte-pos > last-byte-pos → invalid, ignore
	if (end < start) return null;
	if (end > size - 1) end = size - 1;
	return { start, end };
}

export interface FileOptions {
	/** MIME type override (default: detected from the file extension). */
	type?: string;
	/** Additional headers sent along with the response. */
	headers?: Record<string, string>;
}

/**
 * Lazy file response - Elysia `ElysiaFile` style.
 *
 * `file()` / `new BuntokFile()` do not read the disk, do not call
 * `Bun.file()`, and do not build a `Response` when the route is registered:
 * all work (MIME detection, size stat, Range, stream) is deferred until a
 * handler returns it and the framework calls {@link BuntokFile.toResponse}.
 *
 * - Without `Range`: `200` + `Accept-Ranges: bytes` + `Content-Range: bytes 0-<n-1>/<n>`
 *   (Elysia header parity, including Content-Range on a full 200).
 * - Valid `Range` (single-range, suffix `bytes=-N`): `206` + `Content-Range`.
 * - Start beyond the size / suffix `0`: `416` + Content-Range `bytes *`
 *   with the file size (no Accept-Ranges, Elysia parity).
 * - Multi-range & invalid syntax are ignored → full `200` (RFC 7233 §3.1;
 *   deliberate deviation from Elysia, which serves the first sub-range).
 *
 * No fallback when the file is missing (the `file()` path = a pure static
 * endpoint); need a fallback/404 → {@link serveFileOrFallback}.
 */
export class BuntokFile {
	readonly path: string;
	#headers?: Record<string, string>;
	#type?: string;

	constructor(filePath: string, options?: FileOptions) {
		this.path = filePath;
		this.#headers = options?.headers;
		if (options?.type) this.#type = options.type;
	}

	/** Per-path cached `Bun.file()` (TTL 1s). */
	get value(): ReturnType<typeof Bun.file> {
		return getCachedFile(this.path).value;
	}

	/** MIME type: `options.type` override → extension → Bun MIME DB. */
	get type(): string {
		return (this.#type ??= detectMimeType(this.path));
	}

	/** File size (bytes) - from the per-path cache (TTL 1s). */
	get length(): number {
		return getCachedFile(this.path).size;
	}

	/** `Bun.file().slice()` - for user needs (multipart, etc.). */
	slice(start: number, end?: number): Blob {
		return this.value.slice(start, end);
	}

	/**
	 * Build the `Response` at response time - pass the `Request` so the
	 * `Range` header can be processed.
	 */
	toResponse(request?: Request): Response {
		const { value: file, size } = getCachedFile(this.path);
		const headers: Record<string, string> = {
			"Content-Type": this.type,
			"Accept-Ranges": "bytes",
			...this.#headers,
		};

		const rangeHeader = request?.headers.get("range");
		if (rangeHeader) {
			const range = parseRangeHeader(rangeHeader, size);
			if (range === "unsatisfiable") {
				return new Response(null, {
					status: 416,
					headers: {
						"Content-Range": `bytes */${size}`,
						...this.#headers,
					},
				});
			}
			if (range) {
				const { start, end } = range;
				return new Response(file.slice(start, end + 1), {
					status: 206,
					headers: {
						...headers,
						"Content-Range": `bytes ${start}-${end}/${size}`,
					},
				});
			}
		}
		// Elysia parity: Content-Range is also sent on a full 200
		if (size > 0) headers["Content-Range"] = `bytes 0-${size - 1}/${size}`;
		return new Response(file, { headers });
	}
}

/**
 * Serve a file lazily - Elysia `file()` style.
 *
 * Returns a {@link BuntokFile} (BREAKING from earlier versions that returned
 * a `Response` directly): the object is created without I/O and converted to
 * a `Response` by the framework at response time, so the original request's
 * `Range` header can be processed (video/audio seek → `206`/`416`).
 *
 * The MIME type is detected from the extension automatically (`clip.mp4` →
 * `video/mp4`) unless `options.type` is provided.
 *
 * @example
 * app.get("/video", () => file("public/kyuukurarin.mp4"));
 *
 * @example
 * app.get("/report", () => file("exports/report.pdf", {
 *   type: "application/pdf",
 *   headers: { "Cache-Control": "no-store" },
 * }));
 */
export function file(filePath: string, options?: FileOptions): BuntokFile {
	return new BuntokFile(filePath, options);
}

/**
 * Serve a file from disk. If file doesn't exist, return the fallback response.
 *
 * Supports HTTP `Range` (video/audio seek): a valid range request is
 * answered with `206 Partial Content` + `Content-Range`, an invalid one with
 * `416`, and `Accept-Ranges: bytes` is always sent.
 *
 * @example
 * // Serve file or return 404
 * serveFileOrFallback(ctx, doc.file_path, () => ctx.json({ error: "Not found" }, 404));
 *
 * @example
 * // Serve avatar or return default SVG
 * serveFileOrFallback(ctx, user.avatar_path, () => {
 *   return new Response(generateInitialAvatar(user.name, user.id), {
 *     headers: { "Content-Type": "image/svg+xml" }
 *   });
 * });
 */
export async function serveFileOrFallback(
	ctx: Context,
	filePath: string,
	fallback: Response | (() => Response | Promise<Response>),
	options?: ServeFileOptions,
): Promise<Response> {
	const file = Bun.file(filePath);

	if (await file.exists()) {
		const headers: Record<string, string> = {
			"Content-Type": options?.contentType ?? detectMimeType(filePath),
			"Cache-Control": options?.cacheControl ?? "public, max-age=86400",
			"Accept-Ranges": "bytes",
		};

		// ctx.request is optional so mock contexts in tests stay valid
		const rangeHeader = ctx.request?.headers.get("range");
		if (rangeHeader) {
			const range = parseRangeHeader(rangeHeader, file.size);
			if (range === "unsatisfiable") {
				return new Response(null, {
					status: 416,
					headers: {
						...headers,
						"Content-Range": `bytes */${file.size}`,
					},
				});
			}
			if (range) {
				const { start, end } = range;
				return new Response(file.slice(start, end + 1), {
					status: 206,
					headers: {
						...headers,
						"Content-Range": `bytes ${start}-${end}/${file.size}`,
					},
				});
			}
		}
		return new Response(file, { headers });
	}

	return typeof fallback === "function" ? fallback() : fallback;
}
