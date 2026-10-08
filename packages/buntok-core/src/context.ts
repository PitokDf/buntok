import { createSSE, type SSE, type SSEOptions } from "./sse";
import { getClientIP } from "./helpers/network";

export type HTTPHeaders = Record<string, string | number> & {
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

export class Context<
	DI = Record<string, unknown>,
	Params = Record<string, string>,
> {
	public request: Request;
	public params: Params & Record<string, string>;
	public user?: Record<string, unknown>;

	private _store: Record<string, unknown> | undefined;
	private _cookies: Record<string, string> | undefined;
	private _query: Record<string, string> | undefined;
	private _validated: Record<string, unknown> | undefined;
	public readonly di: DI;
	public _afterHooks?: Array<(res: Response) => Response | undefined>;
	/**
	 * Mutable response header bag - merged into the final response by Buntok.
	 * Access via `ctx.set.headers[...]`; do not touch this field directly.
	 */
	public _set?: { headers: HTTPHeaders };
	private readonly clientIPResolver: (request: Request) => string;

	constructor(request: Request, params: Record<string, string>, di: DI, clientIPResolver: (request: Request) => string = getClientIP) {
		this.request = request;
		this.params = params as unknown as Params & Record<string, string>;
		this.di = di;
		this.clientIPResolver = clientIPResolver;
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
				if (key && val) result[key] = decodeURIComponent(val);
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
						const key = decodeURIComponent(
							pair.substring(0, eqIdx).replace(/\+/g, " "),
						);
						const value = decodeURIComponent(
							pair.substring(eqIdx + 1).replace(/\+/g, " "),
						);
						this._query[key] = value;
					} else {
						const key = decodeURIComponent(pair.replace(/\+/g, " "));
						this._query[key] = "";
					}
				}
			}
		}

		return this._query;
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

	public async body<T>(): Promise<T> {
		if (this._body !== undefined) {
			return this._body as T;
		}
		this._body = await this.request.json();
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
		this._formData = await this.request.formData();
		return this._formData;
	}

	public json(data: unknown, status = 200): Response {
		if (status === 200) {
			return Response.json(data);
		}
		return Response.json(data, { status });
	}

	public success(data?: unknown, message = "Success", status = 200): Response {
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
		return this.json(
			{
				success: true,
				message,
				data,
				meta: {
					currentPage: page,
					perPage: limit,
					total,
					lastPage: Math.ceil(total / limit),
					hasMore: page * limit < total,
				},
			},
			status,
		);
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
		return this.json(
			{
				success: true,
				message,
				data,
				meta: {
					nextCursor,
					hasMore: nextCursor !== null,
				},
			},
			status,
		);
	}

	public error(message: string, status = 400, details?: unknown): Response {
		return this.json({ success: false, message, details }, status);
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

	private static readonly HTML_HEADERS = { "Content-Type": "text/html" };
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
