import { createSSE, type SSE, type SSEOptions } from "./sse";
import { getClientIP } from "./helpers/network";
import { BuntokFile, type FileOptions } from "./helpers/file";
import { serializeCookie, type CookieOptions } from "./helpers/cookie";
import {
	downloadBuffer,
	type DownloadOptions,
} from "./helpers/download";
import {
	jsonResponse,
	type BigIntMode,
	type JsonConfig,
} from "./helpers/response";
import {
	BadRequestError,
	PayloadTooLargeError,
} from "./helpers/async-handler";

/** Default request body limit: 4 MB. */
export const DEFAULT_BODY_LIMIT = 4 * 1024 * 1024;

function safeDecodeURIComponent(component: string, what: string): string {
	try {
		return decodeURIComponent(component);
	} catch {
		throw new BadRequestError(`Invalid ${what}`);
	}
}

export type HTTPHeaders = Record<string, string | number | null> & {
	'www-authenticate'?: string;
	authorization?: string;
	'proxy-authenticate'?: string;
	'proxy-authorization'?: string;
	age?: string;
	'cache-control'?: string;
	'clear-site-data'?: string;
	expires?: string;
	'no-vary-search'?: string;
	pragma?: string;
	'last-modified'?: string;
	etag?: string;
	'if-match'?: string;
	'if-none-match'?: string;
	'if-modified-since'?: string;
	'if-unmodified-since'?: string;
	vary?: string;
	connection?: string;
	'keep-alive'?: string;
	accept?: string;
	'accept-encoding'?: string;
	'accept-language'?: string;
	expect?: string;
	'max-forwards'?: number | string;
	cookie?: string;
	'set-cookie'?: string | string[];
	'access-control-allow-origin'?: string;
	'access-control-allow-credentials'?: string;
	'access-control-allow-headers'?: string;
	'access-control-allow-methods'?: string;
	'access-control-expose-headers'?: string;
	'access-control-max-age'?: number | string;
	'access-control-request-headers'?: string;
	'access-control-request-method'?: string;
	origin?: string;
	'timing-allow-origin'?: string;
	'content-disposition'?: string;
	'content-length'?: number | string;
	'content-type'?: string;
	'content-encoding'?: string;
	'content-language'?: string;
	'content-location'?: string;
	forwarded?: string;
	via?: string;
	location?: string;
	refresh?: string;
	allow?: string;
	server?: string;
	'accept-ranges'?: string;
	range?: string;
	'if-range'?: string;
	'content-range'?: string;
	'content-security-policy'?: string;
	'content-security-policy-report-only'?: string;
	'cross-origin-embedder-policy'?: string;
	'cross-origin-opener-policy'?: string;
	'cross-origin-resource-policy'?: string;
	'expect-ct'?: string;
	'permission-policy'?: string;
	'strict-transport-security'?: string;
	'upgrade-insecure-requests'?: string;
	'x-content-type-options'?: string;
	'x-frame-options'?: string;
	'x-xss-protection'?: string;
	'last-event-id'?: string;
	'ping-from'?: string;
	'ping-to'?: string;
	'report-to'?: string;
	te?: string;
	trailer?: string;
	'transfer-encoding'?: string;
	'alt-svc'?: string;
	'alt-used'?: string;
	date?: string;
	dnt?: string;
	'early-data'?: string;
	'large-allocation'?: number | string;
	link?: string;
	'retry-after'?: number | string;
	'service-worker-allowed'?: string;
	'source-map'?: string;
	upgrade?: string;
	'x-dns-prefetch-control'?: string;
	'x-forwarded-for'?: string;
	'x-forwarded-host'?: string;
	'x-forwarded-proto'?: string;
	'x-powered-by'?: 'buntok' | (string & {});
	'x-request-id'?: string;
	'x-requested-with'?: string;
	'x-robots-tag'?: string;
	'x-ua-compatible'?: string;
};

export interface PaginationMeta {
	currentPage: number;
	perPage: number;
	total: number;
	lastPage: number;
	hasMore: boolean;
}

export interface CursorPaginationMeta {
	nextCursor: string | number | null;
	hasMore: boolean;
}

/**
 * App-level response envelope customization. Installed once via
 * `app.responseProfile()` and applied to every `ctx.success()`,
 * `ctx.paginate()`, `ctx.cursorPaginate()` and `ctx.error()` call.
 *
 * Profile callbacks return the envelope **object** (not a `Response`) so the
 * framework can still merge `ctx.set.headers`, cookies and BigInt serialization.
 */
export interface ResponseProfile {
	success?: (
		data: unknown,
		message: string,
		status: number,
		// biome-ignore lint/suspicious/noExplicitAny: profile is app-agnostic
		ctx: Context<any, any>,
	) => unknown;
	paginate?: (
		data: unknown[],
		meta: PaginationMeta,
		message: string,
		status: number,
		// biome-ignore lint/suspicious/noExplicitAny: profile is app-agnostic
		ctx: Context<any, any>,
	) => unknown;
	cursorPaginate?: (
		data: unknown[],
		meta: CursorPaginationMeta,
		message: string,
		status: number,
		// biome-ignore lint/suspicious/noExplicitAny: profile is app-agnostic
		ctx: Context<any, any>,
	) => unknown;
	error?: (
		message: string,
		status: number,
		details: unknown,
		// biome-ignore lint/suspicious/noExplicitAny: profile is app-agnostic
		ctx: Context<any, any>,
	) => unknown;
	/** Defaults for `zValidator()` failures. Per-call options win. */
	validation?: {
		status?: number;
		message?: string;
		errors?: (issues: unknown[]) => unknown[];
	};
}

export interface ContextOptions {
	responseProfile?: ResponseProfile;
	json?: JsonConfig;
	/** Max request body size in bytes. Defaults to 4 MB. */
	bodyLimit?: number;
}

export class Context<
	DI = Record<string, unknown>,
	Params = Record<string, string>,
> {
	public request: Request;
	public params: Params & Record<string, string>;
	public user?: Record<string, unknown>;

	/**
	 * App-level response profile installed via `app.responseProfile()`.
	 * Read-mostly: used by `ctx.success()`/`ctx.error()` and `zValidator()`.
	 */
	public readonly profile?: ResponseProfile;
	/** BigInt serialization mode, configured via `app.json({ bigint })`. */
	public readonly bigint: BigIntMode;
	/** Max request body size in bytes (default 4 MB, `app.bodyLimit()`). */
	public readonly bodyLimit: number;

	private _store: Record<string, unknown> | undefined;
	private _cookies: Record<string, string> | undefined;
	private _query: Record<string, string> | undefined;
	private _queryAll: Record<string, string[]> | undefined;
	private _validated: Record<string, unknown> | undefined;
	private _pathname: string | undefined;
	private _search: string | undefined;
	public readonly di: DI;
	public _afterHooks?: Array<(res: Response) => Response | undefined>;
	/**
	 * Mutable response header bag - merged into the final response by Buntok.
	 * Access via `ctx.set.headers[...]`; do not touch this field directly.
	 */
	public _set?: { headers: HTTPHeaders };
	private readonly clientIPResolver: (request: Request) => string;

	constructor(
		request: Request,
		params: Record<string, string>,
		di: DI,
		clientIPResolver: (request: Request) => string = getClientIP,
		options?: ContextOptions,
	) {
		this.request = request;
		this.params = params as unknown as Params & Record<string, string>;
		this.di = di;
		this.clientIPResolver = clientIPResolver;
		this.profile = options?.responseProfile;
		this.bigint = options?.json?.bigint ?? "string";
		this.bodyLimit = options?.bodyLimit ?? DEFAULT_BODY_LIMIT;
	}

	public get store(): Record<string, unknown> {
		if (!this._store) {
			this._store = {};
		}
		return this._store;
	}

	public set store(value: Record<string, unknown>) {
		this._store = value;
	}

	/**
	 * Elysia-style mutable response scope (`c.set.headers`).
	 *
	 * Headers assigned here are merged into the final response - including
	 * error responses - and win over built-in headers (`X-Powered-By`,
	 * `x-request-id`).
	 *
	 * @example
	 * ctx.set.headers["x-powered-by"] = "benchmark";
	 * return ctx.text("Hi");
	 */
	public get set(): { headers: HTTPHeaders } {
		if (!this._set) {
			this._set = { headers: {} };
		}
		return this._set;
	}

	public get ip(): string {
		return this.clientIPResolver(this.request);
	}

	private parseCookies(): Record<string, string> {
		if (this._cookies) return this._cookies;

		const nativeCookies = (this.request as { cookies?: unknown }).cookies;
		if (nativeCookies && typeof nativeCookies === "object") {
			const map = nativeCookies as Iterable<[string, string]>;
			const result: Record<string, string> = {};
			for (const [key, value] of map) {
				result[key] = value;
			}
			this._cookies = result;
			return this._cookies;
		}

		const cookieHeader = this.request.headers.get("Cookie");
		if (!cookieHeader) {
			this._cookies = {};
			return this._cookies;
		}

		const result: Record<string, string> = {};
		let start = 0;
		while (start < cookieHeader.length) {
			let end = cookieHeader.indexOf(";", start);
			if (end === -1) end = cookieHeader.length;

			const eqIdx = cookieHeader.indexOf("=", start);
			if (eqIdx !== -1 && eqIdx < end) {
				let keyStart = start;
				while (keyStart < eqIdx && cookieHeader[keyStart] === " ") keyStart++;

				let valStart = eqIdx + 1;
				while (valStart < end && cookieHeader[valStart] === " ") valStart++;

				const key = cookieHeader.substring(keyStart, eqIdx);
				const val = cookieHeader.substring(valStart, end);
				if (key && val) result[key] = safeDecodeURIComponent(val, "cookie value");
			}
			start = end + 1;
		}

		this._cookies = result;
		return this._cookies;
	}

	/**
	 * Get a cookie value from request
	 */
	public getCookie(name: string): string | undefined {
		const nativeCookies = (this.request as { cookies?: unknown }).cookies;
		if (
			!this._cookies &&
			nativeCookies &&
			typeof (nativeCookies as { get?: unknown }).get === "function"
		) {
			return (
				(nativeCookies as { get: (name: string) => string | null }).get(name) ??
				undefined
			);
		}
		return this.parseCookies()[name];
	}

	/**
	 * Get all cookies from request
	 */
	public getCookies(): Record<string, string> {
		return this.parseCookies();
	}

	/**
	 * Parsed query string parameters - accessed as a plain property.
	 * Parsed lazily and cached after first access.
	 *
	 * @example
	 * // GET /search?q=buntok&limit=10
	 * const { q, limit } = ctx.query;
	 */
	public get query(): Record<string, string> {
		if (this._query) return this._query;

		this._query = {};
		const url = this.request.url;
		const queryIdx = url.indexOf("?");
		if (queryIdx !== -1) {
			const queryStr = url.substring(queryIdx + 1);
			if (queryStr) {
				const pairs = queryStr.split("&");
				for (let i = 0; i < pairs.length; i++) {
					const pair = pairs[i] as string;
					if (!pair) continue;
					const eqIdx = pair.indexOf("=");
					if (eqIdx !== -1) {
						const key = safeDecodeURIComponent(
							pair.substring(0, eqIdx).replace(/\+/g, " "),
							"query key",
						);
						const value = safeDecodeURIComponent(
							pair.substring(eqIdx + 1).replace(/\+/g, " "),
							"query value",
						);
						this._query[key] = value;
					} else {
						const key = safeDecodeURIComponent(
							pair.replace(/\+/g, " "),
							"query key",
						);
						this._query[key] = "";
					}
				}
			}
		}

		return this._query;
	}

	/**
	 * All values for each query key - e.g. `?t=a&t=b` → `{ t: ["a","b"] }`.
	 * Parsed lazily and cached after first access.
	 */
	public queryAll(): Record<string, string[]> {
		if (this._queryAll) return this._queryAll;

		this._queryAll = {};
		const url = this.request.url;
		const queryIdx = url.indexOf("?");
		if (queryIdx !== -1) {
			const queryStr = url.substring(queryIdx + 1);
			if (queryStr) {
				const pairs = queryStr.split("&");
				for (let i = 0; i < pairs.length; i++) {
					const pair = pairs[i] as string;
					if (!pair) continue;
					const eqIdx = pair.indexOf("=");
					if (eqIdx !== -1) {
						const key = safeDecodeURIComponent(
							pair.substring(0, eqIdx).replace(/\+/g, " "),
							"query key",
						);
						const value = safeDecodeURIComponent(
							pair.substring(eqIdx + 1).replace(/\+/g, " "),
							"query value",
						);
						(this._queryAll[key] ??= []).push(value);
					} else {
						const key = safeDecodeURIComponent(
							pair.replace(/\+/g, " "),
							"query key",
						);
						(this._queryAll[key] ??= []).push("");
					}
				}
			}
		}

		return this._queryAll;
	}

	/**
	 * Request pathname (without query string), e.g. `"/api/v1/outlets"`.
	 * Parsed lazily and cached after first access.
	 */
	public get pathname(): string {
		if (this._pathname === undefined) {
			const url = this.request.url;
			const start = url.indexOf("/", url.indexOf("//") + 2);
			if (start === -1) {
				this._pathname = "/";
			} else {
				const end = url.indexOf("?", start);
				this._pathname = url.substring(
					start,
					end === -1 ? url.length : end,
				);
			}
		}
		return this._pathname;
	}

	/**
	 * Query string including the leading `?`, e.g. `"?page=2"`.
	 * Empty string when the request has no query string.
	 */
	public get search(): string {
		if (this._search === undefined) {
			const q = this.request.url.indexOf("?");
			this._search = q === -1 ? "" : this.request.url.substring(q);
		}
		return this._search;
	}

	/**
	 * Pathname plus query string, e.g. `"/api/v1/outlets?page=2"`.
	 * Handy for response envelopes that record the request `path`.
	 */
	public get path(): string {
		return this.pathname + this.search;
	}

	/**
	 * Internal: used by validator middleware to stash parsed/validated data.
	 * Not intended to be called directly from route handlers.
	 */
	public setValidated(
		target: "body" | "query" | "params",
		data: unknown,
	): void {
		if (!this._validated) this._validated = {};
		this._validated[target] = data;
	}

	/**
	 * Read data previously validated by `zValidator()` for the given target,
	 * typed as `T`. Throws if no validator ran for that target, so a typo'd
	 * target (or forgetting to add the middleware) fails loudly instead of
	 * silently returning `undefined`.
	 */
	public valid<T>(target: "body" | "query" | "params"): T {
		if (!this._validated || !(target in this._validated)) {
			throw new Error(
				`ctx.valid("${target}") called but no zValidator("${target}", ...) middleware ran for this route`,
			);
		}
		return this._validated[target] as T;
	}

	private _body: unknown | undefined;
	private _bodyParsed = false;

	public async body<T>(): Promise<T> {
		if (this._bodyParsed) {
			return this._body as T;
		}

		// Reject oversized bodies before buffering whenever the client
		// declares Content-Length (the common case).
		const declared = Number(
			this.request.headers.get("content-length") ?? "0",
		);
		if (declared > this.bodyLimit) {
			throw new PayloadTooLargeError();
		}

		let buffer: ArrayBuffer;
		try {
			buffer = await this.request.arrayBuffer();
		} catch {
			throw new BadRequestError("Failed to read request body");
		}
		if (buffer.byteLength > this.bodyLimit) {
			throw new PayloadTooLargeError();
		}

		const text = new TextDecoder().decode(buffer);
		if (text === "") {
			// No body - mirror `Request.json()` (it would throw); callers that
			// guard with try/catch still see a client error, not a 500.
			throw new BadRequestError("Invalid JSON body");
		}
		try {
			this._body = JSON.parse(text);
		} catch {
			throw new BadRequestError("Invalid JSON body");
		}
		this._bodyParsed = true;
		return this._body as T;
	}

	// biome-ignore lint/suspicious/noExplicitAny: Undici types conflict with lib.dom FormData
	private _formData: any | undefined;

	/**
	 * Parse and cache the multipart/form-data body.
	 * Safe to call multiple times - the parsed FormData is cached after the first read,
	 * so `zValidator("form", ...)` and `uploader()` can both be used in the same route
	 * without conflicting over the body stream.
	 */
	// biome-ignore lint/suspicious/noExplicitAny: Undici types conflict with lib.dom FormData
	public async formData(): Promise<any> {
		if (this._formData !== undefined) {
			return this._formData;
		}
		const declared = Number(
			this.request.headers.get("content-length") ?? "0",
		);
		if (declared > this.bodyLimit) {
			throw new PayloadTooLargeError();
		}
		const formData = await this.request.formData();

		// Chunked uploads have no Content-Length - enforce the limit on the
		// decoded field/file sizes instead.
		if (!declared) {
			let total = 0;
			for (const value of formData.values()) {
				total += value instanceof File ? value.size : String(value).length;
				if (total > this.bodyLimit) {
					throw new PayloadTooLargeError();
				}
			}
		}

		this._formData = formData;
		return this._formData;
	}

	public json(data: unknown, status = 200): Response {
		return jsonResponse(data, status, this.bigint);
	}

	public success(data?: unknown, message = "Success", status = 200): Response {
		if (this.profile?.success) {
			return this.json(
				this.profile.success(data, message, status, this),
				status,
			);
		}
		return this.json({ success: true, message, data }, status);
	}

	/**
	 * Standardize an offset-based pagination response.
	 */
	public paginate<T>(
		data: T[],
		total: number,
		page: number,
		limit: number,
		message = "Success",
		status = 200,
	): Response {
		const meta: PaginationMeta = {
			currentPage: page,
			perPage: limit,
			total,
			lastPage: Math.ceil(total / limit),
			hasMore: page * limit < total,
		};
		if (this.profile?.paginate) {
			return this.json(
				this.profile.paginate(data, meta, message, status, this),
				status,
			);
		}
		return this.json({ success: true, message, data, meta }, status);
	}

	/**
	 * Standardize a cursor-based pagination response (infinite scroll).
	 */
	public cursorPaginate<T>(
		data: T[],
		nextCursor: string | number | null,
		message = "Success",
		status = 200,
	): Response {
		const meta: CursorPaginationMeta = {
			nextCursor,
			hasMore: nextCursor !== null,
		};
		if (this.profile?.cursorPaginate) {
			return this.json(
				this.profile.cursorPaginate(data, meta, message, status, this),
				status,
			);
		}
		return this.json({ success: true, message, data, meta }, status);
	}

	public error(message: string, status = 400, details?: unknown): Response {
		if (this.profile?.error) {
			return this.json(
				this.profile.error(message, status, details, this),
				status,
			);
		}
		return this.json({ success: false, message, details }, status);
	}

	/**
	 * Serve a buffer/bytes as a downloadable file
	 * (`Content-Disposition: attachment`), with MIME type inferred from the
	 * filename when `options.contentType` is omitted.
	 *
	 * @example
	 * ```ts
	 * return ctx.download(workbookBuffer, "products.xlsx");
	 * ```
	 */
	public download(
		data: ArrayBuffer | Uint8Array | Blob,
		filename: string,
		options?: DownloadOptions,
	): Response {
		return downloadBuffer(this, data, filename, options);
	}

	/**
	 * Queue a `Set-Cookie` header on the current response. Can be called
	 * anywhere in the handler - no need to wrap the returned `Response`.
	 * Headers are merged into the final response, including error responses.
	 *
	 * @example
	 * ```ts
	 * ctx.setCookie("token", token, { httpOnly: true, sameSite: "none" });
	 * return ctx.success(user);
	 * ```
	 */
	public setCookie(
		name: string,
		value: string,
		options: CookieOptions = {},
	): this {
		const cookie = serializeCookie(name, value, options);
		const existing = this.set.headers["set-cookie"];
		if (existing === undefined) {
			this.set.headers["set-cookie"] = cookie;
		} else if (Array.isArray(existing)) {
			this.set.headers["set-cookie"] = [...existing, cookie];
		} else {
			this.set.headers["set-cookie"] = [existing, cookie];
		}
		return this;
	}

	/**
	 * Queue an expired `Set-Cookie` header to delete a cookie on the client.
	 */
	public deleteCookie(
		name: string,
		options: Omit<CookieOptions, "maxAge" | "expires"> = {},
	): this {
		return this.setCookie(name, "", {
			...options,
			maxAge: 0,
			expires: new Date(0),
		});
	}

	private static readonly TEXT_HEADERS = {
		"Content-Type": "text/plain; charset=utf-8",
	};

	public text(text: string, status = 200): Response {
		if (status === 200) {
			return new Response(text);
		}
		return new Response(text, {
			status,
			headers: Context.TEXT_HEADERS,
		});
	}

	private static readonly HTML_HEADERS = {
		"Content-Type": "text/html; charset=utf-8",
	};
	/**
	 * Return HTML response
	 */
	public html(html: string, status = 200): Response {
		return new Response(html, {
			status,
			headers: Context.HTML_HEADERS,
		});
	}

	/**
	 * Streaming HTML response using an async generator.
	 * Yields HTML chunks progressively to the client.
	 *
	 * @example
	 * ```ts
	 * app.get('/stream', (ctx) => {
	 *   return ctx.htmlStream(async function* () {
	 *     yield '<!DOCTYPE html><html><body>';
	 *     const data = await fetchData();
	 *     yield `<p>${data}</p>`;
	 *     yield '</body></html>';
	 *   });
	 * });
	 * ```
	 */
	public htmlStream(
		generator: AsyncIterable<string>,
		options?: { status?: number; headers?: Record<string, string> },
	): Response {
		const iterator = generator[Symbol.asyncIterator]();
		const stream = new ReadableStream({
			async pull(controller) {
				const { value, done } = await iterator.next();
				if (done) {
					controller.close();
				} else {
					controller.enqueue(new TextEncoder().encode(value));
				}
			},
			async cancel() {
				// Client disconnected - release the generator to avoid leaks.
				await iterator.return?.();
			},
		});

		return new Response(stream, {
			status: options?.status ?? 200,
			headers: {
				"Content-Type": "text/html; charset=utf-8",
				"Transfer-Encoding": "chunked",
				...options?.headers,
			},
		});
	}

	/**
	 * Stream a file from disk as the response body.
	 *
	 * The file is not read into memory - Bun streams it natively and handles
	 * `Range` requests (`206 Partial Content`) for video/audio seeking.
	 *
	 * @example
	 * ```ts
	 * app.get('/video', (ctx) => ctx.file('./public/video.mp4'));
	 * ```
	 */
	public file(filePath: string, options?: FileOptions): BuntokFile {
		return new BuntokFile(filePath, options);
	}

	/**
	 * Stream an arbitrary chunk source as the response body.
	 *
	 * Accepts a `ReadableStream<Uint8Array>` or an async iterable of
	 * `string | Uint8Array | ArrayBuffer | Blob` chunks. For files on disk,
	 * prefer {@link Context.file} so `Range` and MIME detection are handled.
	 *
	 * @example
	 * ```ts
	 * app.get('/stream', (ctx) => {
	 *   return ctx.stream(async function* () {
	 *     yield "hello ";
	 *     yield "world";
	 *   }, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
	 * });
	 * ```
	 */
	public stream(
		source:
			| ReadableStream<Uint8Array>
			| AsyncIterable<string | Uint8Array | ArrayBuffer | Blob>,
		options?: { status?: number; headers?: Record<string, string> },
	): Response {
		if (source instanceof ReadableStream) {
			return new Response(source, {
				status: options?.status ?? 200,
				headers: options?.headers,
			});
		}

		const iterator = source[Symbol.asyncIterator]();
		const encoder = new TextEncoder();
		const body = new ReadableStream<Uint8Array>({
			async pull(controller) {
				const { value, done } = await iterator.next();
				if (done) {
					controller.close();
					return;
				}
				if (typeof value === "string") {
					controller.enqueue(encoder.encode(value));
				} else if (value instanceof Uint8Array) {
					controller.enqueue(value);
				} else if (value instanceof ArrayBuffer) {
					controller.enqueue(new Uint8Array(value));
				} else {
					controller.enqueue(new Uint8Array(await value.arrayBuffer()));
				}
			},
			async cancel(reason) {
				await iterator.return?.(reason);
			},
		});

		return new Response(body, {
			status: options?.status ?? 200,
			headers: {
				"Content-Type": "application/octet-stream",
				...options?.headers,
			},
		});
	}

	public onAfterResponse(hook: (res: Response) => Response | undefined): void {
		if (!this._afterHooks) this._afterHooks = [];
		this._afterHooks.push(hook);
	}

	/**
	 * Redirect to URL
	 */
	public redirect(
		url: string,
		status: 301 | 302 | 303 | 307 | 308 = 302,
	): Response {
		return new Response(null, {
			status,
			headers: { Location: url },
		});
	}

	/**
	 * Return empty response with status code
	 */
	public status(code: number): Response {
		return new Response(null, { status: code });
	}

	/**
	 * Start a Server-Sent Events (SSE) stream - Bun-only
	 */
	public sse(
		callback: (stream: SSE) => void | Promise<void>,
		options?: SSEOptions,
	): Response {
		const stream = createSSE(this.request, options);

		// queueMicrotask is faster than setTimeout(0) - no macrotask latency
		queueMicrotask(async () => {
			try {
				await callback(stream);
			} catch (err) {
				console.error("[SSE Error]", err);
				try { stream.sendEvent("error", String((err as Error).message)); } catch { }
				stream.close();
			}
		});

		return stream.connect();
	}
}
