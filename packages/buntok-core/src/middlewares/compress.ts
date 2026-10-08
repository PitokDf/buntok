import type { Middleware } from "../buntok";

export interface CompressOptions {
	/**
	 * Minimum response body size (bytes) before compressing. Compressing
	 * tiny payloads wastes CPU for zero/negative gain, so this defaults to
	 * 1024 rather than compressing everything unconditionally.
	 */
	threshold?: number;
	/** Content-Type prefixes eligible for compression. */
	types?: string[];
	/** Brotli compression level (1-11). Default 4 gives ~85% of max compression
	 * at 3-5x the speed of level 11. Set to 11 for maximum ratio. */
	brotliLevel?: number;
}

const DEFAULT_TYPES = [
	"text/",
	"application/json",
	"application/javascript",
	"application/xml",
	"image/svg+xml",
];

const DEFAULT_OPTIONS: Required<CompressOptions> = {
	threshold: 1024,
	types: DEFAULT_TYPES,
	brotliLevel: 4,
};

/**
 * Compress response bodies with gzip or brotli, negotiated from the
 * request's `Accept-Encoding` header. Opt-in via `app.use(compress())` -
 * compression is real CPU work, so routes that don't need it (or that
 * already stream pre-compressed/binary content) shouldn't pay for it.
 *
 * Uses Bun's native `Bun.gzipSync` (Zig, not a JS gzip implementation) and
 * falls back to `node:zlib`'s brotli when the client prefers `br`.
 *
 * Brotli defaults to level 4 for a good speed/ratio tradeoff - roughly
 * 3-5x faster than level 11 with only ~15% larger output.
 */
export function compress(options: CompressOptions = {}): Middleware {
	const opts = { ...DEFAULT_OPTIONS, ...options };

	// Hoist brotli import to creation scope - avoid per-request microtask
	let brotliModule: typeof import("node:zlib") | undefined;

	return async (ctx, next) => {
		const result = await next();
		if (!(result instanceof Response) || !result.body) return result;

		if (result.headers.get("Content-Encoding")) return result;

		const contentType = result.headers.get("Content-Type") || "";
		// Industrial: jangan compress SSE/WebSocket streaming - break spec
		if (contentType.includes("text/event-stream")) return result;
		const eligible = opts.types.some((t) => contentType.startsWith(t));
		if (!eligible) return result;

		const acceptEncoding = ctx.request.headers.get("Accept-Encoding") || "";
		const supportsBrotli = acceptEncoding.includes("br");
		const supportsGzip = acceptEncoding.includes("gzip");
		if (!supportsBrotli && !supportsGzip) return result;

		// Fast path: use Content-Length header to skip buffering for small responses
		const contentLength = result.headers.get("Content-Length");
		if (contentLength && Number(contentLength) < opts.threshold) {
			return result;
		}

		// If no Content-Length, we must buffer to check size - but only compress
		// if above threshold. For small responses without Content-Length, skip
		// compression entirely to avoid unnecessary buffering + new Response.
		if (!contentLength) return result;

		const buffer = new Uint8Array(await result.arrayBuffer());
		if (buffer.byteLength < opts.threshold) {
			return result;
		}

		let compressed: Uint8Array;
		let encoding: string;

		if (supportsBrotli) {
			if (!brotliModule) {
				brotliModule = await import("node:zlib");
			}
			compressed = brotliModule.brotliCompressSync(buffer, {
				params: {
					[brotliModule.constants.BROTLI_PARAM_QUALITY]: opts.brotliLevel,
				},
			});
			encoding = "br";
		} else {
			compressed = Bun.gzipSync(buffer);
			encoding = "gzip";
		}

		const headers = new Headers(result.headers);
		headers.set("Content-Encoding", encoding);
		headers.set("Vary", "Accept-Encoding");
		headers.delete("Content-Length");

		return new Response(compressed, {
			status: result.status,
			statusText: result.statusText,
			headers,
		});
	};
}
