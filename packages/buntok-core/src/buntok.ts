import { join, sep, dirname, resolve } from "node:path";
import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import type { Server, ServerWebSocket, BunFile } from "bun";
import type { z } from "zod";
import { Container } from "./container";
import { Context } from "./context";
import { getControllerMeta, type RouteMeta } from "./decorators";
import { HttpError } from "./helpers/async-handler";
import { BuntokFile } from "./helpers/file";
import { toResponse } from "./helpers/response";
import {
	analyzeHandler,
	extractConstResponseOp,
	type ConstResponseOp,
} from "./aot/sucrose";
import { logger } from "./logger";
import { getModel, registerModel } from "./models";
import { Router } from "./router";
import { VERSION } from "./version";
import type { Plugin } from "./plugin";
import type { CorsOptions } from "./middlewares/cors";
import { applyCorsHeaders, cors } from "./middlewares/cors";
import { getClientIP, type TrustedProxyOptions } from "./helpers/network";

export interface WSData<DI = Record<string, unknown>> {
	ctx: Context<DI>;
	handler: WSHandler<DI>;
}

export interface WSOptions {
	/** Per-message deflate - Bun native, default false */
	perMessageDeflate?: boolean | object;
	/** Max payload length bytes - default 16MB */
	maxPayloadLength?: number;
	/** Idle timeout seconds before close - default 120, 30 for heartbeat */
	idleTimeout?: number;
	/** Backpressure highWaterMark */
	maxBackpressure?: number;
	/** Publish to self? default false */
	publishToSelf?: boolean;
}

export interface WSHandler<DI = Record<string, unknown>> {
	open?: (ws: ServerWebSocket<WSData<DI>>) => void;
	message?: (ws: ServerWebSocket<WSData<DI>>, message: string | Buffer) => void;
	close?: (
		ws: ServerWebSocket<WSData<DI>>,
		code: number,
		reason: string,
	) => void;
	drain?: (ws: ServerWebSocket<WSData<DI>>) => void;
	pong?: (ws: ServerWebSocket<WSData<DI>>) => void;
	/**
	 * Optional authentication handler.
	 * Called on connection open. Return null to reject the connection.
	 * The returned data is stored in `ws.data.auth`.
	 */
	authenticate?: (ws: ServerWebSocket<WSData<DI>>) => Promise<unknown | null>;
}

export type ExtractParams<Path extends string> =
	Path extends `${infer _Start}:${infer Param}/${infer Rest}`
	? { [K in Param]: string } & ExtractParams<`/${Rest}`>
	: Path extends `${infer _Start}:${infer Param}`
	? { [K in Param]: string }
	: Path extends `${infer _Start}*${infer Catchall}`
	? { [K in Catchall]: string } & { "*": string }
	: Record<string, never>;

/**
 * @deprecated Use `ZodCtx<{ body: typeof schema; query: typeof schema }>` instead.
 * `RouteContext` has 5 generic parameters that are hard to remember.
 * `ZodCtx` only needs one and infers types automatically from your Zod schemas.
 */
export type RouteContext<
	Path extends string = string,
	BodyType = unknown,
	DI = Record<string, unknown>,
	QueryType = unknown,
	ParamsType = ExtractParams<Path>,
> = {
	body(): Promise<BodyType>;
	valid<T extends "body" | "query" | "params">(
		target: T,
	): T extends "body"
		? BodyType
		: T extends "query"
		? QueryType
		: T extends "params"
		? ParamsType
		: unknown;
} & Context<DI, ParamsType>;

/**
 * Helper to infer Context types from Zod schemas automatically.
 *
 * Just pass your Zod schemas - no need to remember generic parameter order.
 *
 * @example
 * const paginationSchema = z.object({ page: z.coerce.number(), limit: z.coerce.number() });
 *
 * @Controller("/users")
 * export class UserController {
 *   @Get("/")
 *   @Use(zValidator("query", paginationSchema))
 *   async getAll(ctx: ZodCtx<{ query: typeof paginationSchema }>) {
 *     const { page, limit } = ctx.valid("query"); // Fully typed!
 *   }
 * }
 */
export type ZodCtx<
	// biome-ignore lint/suspicious/noExplicitAny: Requires accessing Zod types
	T extends { query?: any; body?: any; params?: any },
> = {
	body(): Promise<T["body"] extends { _type: infer U } ? U : T["body"]>;
	valid<Target extends "body" | "query" | "params">(
		target: Target,
	): Target extends "body"
		? T["body"] extends { _type: infer U }
		? U
		: T["body"]
		: Target extends "query"
		? T["query"] extends { _type: infer U }
		? U
		: T["query"]
		: Target extends "params"
		? T["params"] extends { _type: infer U }
		? U
		: T["params"]
		: unknown;
} & Context<
	Record<string, unknown>,
	T["params"] extends { _type: infer U }
	? U
	: T["params"] extends Record<string, string>
	? T["params"]
	: Record<string, string>
>;

export type HandlerReturn =
	| Response
	| BuntokFile
	| Blob
	| ArrayBuffer
	| Uint8Array
	| string
	| number
	| boolean
	| bigint
	| Record<string, unknown>
	| unknown[]
	| null
	| undefined
	| void
	| Promise<
		| Response
		| BuntokFile
		| Blob
		| ArrayBuffer
		| Uint8Array
		| string
		| number
		| boolean
		| bigint
		| Record<string, unknown>
		| unknown[]
		| null
		| undefined
		| void
	>;

export type Handler<
	DI = Record<string, unknown>,
	Path extends string = string,
> = (ctx: Context<DI, ExtractParams<Path>>) => HandlerReturn;
export type Middleware<
	DI = Record<string, unknown>,
	Path extends string = string,
> = (
	ctx: Context<DI, ExtractParams<Path>>,
	next: () => Promise<Response> | Response,
) => HandlerReturn;
export type ErrorHandler<DI = Record<string, unknown>> = (
	err: Error,
	// biome-ignore lint/suspicious/noExplicitAny: generic
	ctx: Context<DI, any>,
) => HandlerReturn;
export type NotFoundHandler<DI = Record<string, unknown>> = (
	// biome-ignore lint/suspicious/noExplicitAny: generic
	ctx: Context<DI, any>,
) => HandlerReturn;

export type LifecycleHookResult =
	| Response
	| void
	| Promise<Response | void>;
export type RequestHook<DI = Record<string, unknown>> = (
	// biome-ignore lint/suspicious/noExplicitAny: generic
	ctx: Context<DI, any>,
) => LifecycleHookResult;
export type BeforeHandleHook<DI = Record<string, unknown>> = (
	// biome-ignore lint/suspicious/noExplicitAny: generic
	ctx: Context<DI, any>,
) => LifecycleHookResult;
export type AfterHandleHook<DI = Record<string, unknown>> = (
	// biome-ignore lint/suspicious/noExplicitAny: generic
	ctx: Context<DI, any>,
	response: Response,
) => Response | void | Promise<Response | void>;
export type DeriveHook<DI = Record<string, unknown>> = (
	// biome-ignore lint/suspicious/noExplicitAny: generic
	ctx: Context<DI, any>,
) => Record<string, unknown> | Promise<Record<string, unknown>>;
export type AppHook = () => void | Promise<void>;

export interface EnvValidationOptions {
	/**
	 * Custom error handler called when env validation fails.
	 * If provided, the default error printing and process.exit(1) are skipped.
	 * Use this to send alerts to monitoring services or custom logging before exiting.
	 *
	 * @example
	 * app.validateEnv(schema, {
	 *   onError: (errors) => {
	 *     // Send to monitoring service
	 *     await sentry.captureException(new Error("Env validation failed"));
	 *     // Log to external service
	 *     await logger.fatal("Missing env vars", { errors });
	 *     // Then exit manually
	 *     process.exit(1);
	 *   }
	 * });
	 */
	onError?: (errors: { field: string; message: string }[]) => void | never;
}

export interface StaticOptions {
	/** Cache max-age in seconds (default: 3600) */
	maxAge?: number;
	/** Override the full Cache-Control header value */
	cacheControl?: string;
	/** Enable ETag generation and conditional requests (default: true) */
	etag?: boolean;
	/**
	 * Serve the directory through Bun's native `{ dir }` route - zero JS per
	 * request (kernel-clamped path traversal, native mime/etag/range/index.html).
	 * Falls back to the JS handler when the native gates are off (request
	 * logging on, X-Powered-By enabled, global middleware). When active, Bun
	 * controls the response: `maxAge`/`cacheControl`/`etag` options are not
	 * applied and missing files return an empty-body 404 instead of the JSON
	 * error body.
	 */
	native?: boolean;
}

/** Bun native `{ dir }` route value for `app.static({ native: true })`. */
interface DirRouteOptions {
	dir: string;
	statCache?: boolean;
}

/** Values that can be handed to Bun.serve `routes` directly (baked at boot). */
type NativeRouteValue = Response | BunFile | DirRouteOptions;

/**
 * Native Bun.serve route handler for `:param` paths - Bun's C++ router matches
 * the pattern, the closure runs the same JS as the fallback dispatch (params
 * re-extracted raw from the pathname for byte parity with the FFI trie).
 */
type NativeDynamicHandler = (request: Request) => Response | Promise<Response>;

/** Everything collectNativeStaticRoutes can put into Bun.serve `routes`. */
type NativeRouteEntry = NativeRouteValue | NativeDynamicHandler;

function isDirRouteValue(
	value: unknown,
): value is DirRouteOptions {
	return (
		typeof value === "object" &&
		value !== null &&
		!(value instanceof Response) &&
		!(value instanceof Blob) &&
		"dir" in value &&
		typeof (value as DirRouteOptions).dir === "string"
	);
}

export interface ApiDocsOptions {
	/** URL path for the docs UI (default: "/docs") */
	path?: string;
	/** API title displayed in the docs (default: "API Documentation") */
	title?: string;
	/** API version (default: "1.0.0") */
	version?: string;
	/** API description */
	description?: string;
	/** Hide docs when NODE_ENV is "production" (default: false) */
	safeOnProduction?: boolean;
}

export interface RouteDebugInfo {
	method: string;
	path: string;
	middlewares: string[];
	handler: string;
	source: "route" | "controller" | "group";
	controller?: string;
	group?: string;
}

export interface BuntokOptions {
	/** Register SIGINT and SIGTERM handlers when the app starts listening. */
	handleSignals?: boolean;
	/** Maximum time allowed for graceful shutdown. */
	shutdownTimeout?: number;
}

export interface DisposableResource {
	name?: string;
	close?: () => void | Promise<void>;
	dispose?: () => void | Promise<void>;
}

/**
 * Wrap a controller handler with the zero-cost response decorators
 * (@HttpCode / @SetHeader / @Redirect). Applied at boot time - no
 * per-request alloc beyond the wrapper closure. Returns the handler
 * unchanged when none of those decorators are present.
 *
 * Shared by `Buntok.registerController()` and `RouterGroup.registerController()`
 * so decorator behavior is identical on both registration paths.
 */
function applyRouteResponseDecorators<DI extends Record<string, unknown>>(
	handler: Handler<DI>,
	route: RouteMeta,
): Handler<DI> {
	const hasStatus = route.statusCode !== undefined;
	const hasHeaders = route.headers && route.headers.length > 0;
	const hasRedirect = !!route.redirect;
	if (!hasStatus && !hasHeaders && !hasRedirect) return handler;

	const original = handler;
	const routeMeta = route;
	const apply = (res: Response): Response => {
		let r: Response = res;
		if (hasStatus && r.status === 200) {
			// Override status only if default 200 (preserve explicit ctx.status etc.)
			r = new Response(r.body, { status: routeMeta.statusCode!, headers: r.headers });
		} else if (hasStatus && r.status === 204 && routeMeta.statusCode !== 204) {
			// For void returns that became 204, respect HttpCode
			r = new Response(r.body, { status: routeMeta.statusCode!, headers: r.headers });
		}
		if (hasHeaders) {
			for (const [k, v] of routeMeta.headers!) {
				r.headers.set(k, v);
			}
		}
		return r;
	};
	// biome-ignore lint/suspicious/noExplicitAny: wrapper must accept any Context shape
	const wrapped = ((ctx: any) => {
		// Redirect - static or dynamic override (Nest behavior)
		if (hasRedirect) {
			const result: any = original(ctx);
			// If handler returns promise, handle async
			if (result instanceof Promise) {
				return result.then((val: any) => {
					if (val instanceof Response) {
						return new Response(val.body, {
							status: routeMeta.redirect!.statusCode,
							headers: { Location: routeMeta.redirect!.url, ...Object.fromEntries(val.headers) },
						});
					}
					if (val && typeof val === "object" && "url" in val) {
						const url = (val as any).url as string;
						const sc = (val as any).statusCode ?? routeMeta.redirect!.statusCode;
						return new Response(null, { status: sc, headers: { Location: url } });
					}
					// Also allow string return as url override
					if (typeof val === "string" && val.startsWith("/")) {
						return new Response(null, { status: routeMeta.redirect!.statusCode, headers: { Location: val } });
					}
					// Static redirect
					return new Response(null, {
						status: routeMeta.redirect!.statusCode,
						headers: { Location: routeMeta.redirect!.url },
					});
				});
			}
			if (result instanceof Response) {
				// Handler returned a Response - apply redirect status + Location header
				return new Response(result.body, {
					status: routeMeta.redirect!.statusCode,
					headers: { Location: routeMeta.redirect!.url, ...Object.fromEntries(result.headers) },
				});
			}
			if (result && typeof result === "object" && "url" in result) {
				const url = (result as any).url as string;
				const sc = (result as any).statusCode ?? routeMeta.redirect!.statusCode;
				return new Response(null, { status: sc, headers: { Location: url } });
			}
			if (typeof result === "string" && result.startsWith("/")) {
				return new Response(null, { status: routeMeta.redirect!.statusCode, headers: { Location: result } });
			}
			return new Response(null, {
				status: routeMeta.redirect!.statusCode,
				headers: { Location: routeMeta.redirect!.url },
			});
		}
		const raw: any = original(ctx);
		if (raw instanceof Promise) {
			return raw.then((v: any) =>
				typeof v === "string"
					? apply(new Response(v))
					: apply(v instanceof Response ? v : toResponse(v, ctx?.request)),
			);
		}
		return typeof raw === "string"
			? apply(new Response(raw))
			: apply(raw instanceof Response ? raw : toResponse(raw, ctx?.request));
	}) as Handler<DI>;
	// Preserve sucrose target from original handler for AST analysis
	(wrapped as any)._sucroseTarget = (original as any)._sucroseTarget ?? original;
	// Mark: the wrapper adds status/headers/redirect - it must be executed,
	// never promote to native even when its _sucroseTarget is a constant literal.
	(wrapped as any)._buntokResponseDecorated = true;
	return wrapped;
}

export class Buntok<DI extends Record<string, unknown> = Record<string, unknown>> {
	private router: Router;
	private middlewares: Middleware<DI>[] = [];
	private requestHooks: RequestHook<DI>[] = [];
	private deriveHooks: DeriveHook<DI>[] = [];
	private beforeHandleHooks: BeforeHandleHook<DI>[] = [];
	private afterHandleHooks: AfterHandleHook<DI>[] = [];
	private startHooks: AppHook[] = [];
	private stopHooks: AppHook[] = [];
	private compiledGlobalPipeline?: (
		ctx: Context<DI>,
		finalHandler: Handler<DI>,
	) => HandlerReturn;
	private isListening: boolean = false;
	public di = {} as DI;
	private wsRoutes: Map<string, WSHandler<DI>> = new Map();
	private wsOpts: WSOptions = {};
	private poweredByHeaderEnabled: boolean = process.env.NODE_ENV !== "production";
	private _reusePort: boolean = false;
	private _skipLogResponse: boolean = false;
	// Cache sucrose analysis per handler to avoid AST analysis per request
	private _handlerNeedsFullContext = new WeakMap<Function, boolean>();
	// Track routes that have per-route middlewares (need full Context)
	private _routesWithMiddleware = new Set<string>();
	// Precomputed client IP resolver - avoid closure alloc per request
	private _clientIPResolver: (request: Request) => string = (req) => getClientIP(req);
	// Cache full needsFullContext per handler for AOT codegen (includes ctx.json detection)
	private _handlerFullContextCache = new WeakMap<Function, { needsFullContext: boolean; needsParams: boolean; needsSetHeaders: boolean }>();
	// Static handler values (string/Response/ConstResponseOp) per `METHOD:path`,
	// captured at registration for listen-time promotion to native Bun.serve routes.
	private _staticRouteValues = new Map<
		string,
		string | NativeRouteValue | ConstResponseOp
	>();
	// Map compiled pipeline → original handler for AOT sucrose analysis
	private _pipelineToHandler = new WeakMap<Function, Function>();
	public _apiDocsConfig: ApiDocsOptions | null = null;
	// biome-ignore lint/suspicious/noExplicitAny: Required for internal OpenAPI registry
	public openApiDocs: any[] = [];
	private container: Container | null = null;
	private installedPlugins = new Set<string>();
	private pluginDisposers = new Map<string, (app: Buntok<DI>) => void | Promise<void>>();
	private trustedProxy?: TrustedProxyOptions;
	private readonly handleSignals: boolean;
	private readonly shutdownTimeout: number;
	private shutdownPromise?: Promise<void>;
	private signalHandlers?: { signal: "SIGTERM" | "SIGINT"; handler: () => void }[];
	private resources = new Set<DisposableResource>();
	private corsConfig: CorsOptions | null = null;
	// biome-ignore lint/suspicious/noExplicitAny: OpenAPI document is dynamically generated
	private _swaggerDocument: any | null = null;
	public routeDebugInfo: RouteDebugInfo[] = [];

	/**
	 * The underlying Bun Server instance. Only available after app.listen() is called.
	 * Can be used for server.publish() to broadcast WebSocket messages.
	 */
	public server?: Server<WSData<DI>>;

	private customErrorHandler: ErrorHandler<DI> = (err, ctx) => {
		logger.error("Unhandled Exception", {
			error: err.message,
			stack: err.stack,
		});
		const status = err instanceof HttpError ? err.status : 500;
		const errorName =
			status === 400
				? "Bad Request"
				: status === 401
					? "Unauthorized"
					: status === 403
						? "Forbidden"
						: status === 404
							? "Not Found"
							: status === 405
								? "Method Not Allowed"
								: status === 409
									? "Conflict"
									: status === 422
										? "Unprocessable Entity"
										: status === 429
											? "Too Many Requests"
											: status === 503
												? "Service Unavailable"
												: "Internal Server Error";
		return ctx.json(
			{
				success: false,
				error: errorName,
				// Buntok-thrown 4xx HttpErrors keep their message (also in
				// production); 5xx and unexpected errors are masked in production.
				message:
					err instanceof HttpError && err.status < 500
						? err.message
						: process.env.NODE_ENV === "production"
							? "An unexpected error occurred"
							: err.message,
			},
			status,
		);
	};

	private customNotFoundHandler: NotFoundHandler<DI> = (ctx) => {
		return ctx.json(
			{
				success: false,
				error: "Not Found",
				path: new URL(ctx.request.url).pathname,
			},
			404,
		);
	};

	private iconPath: string = "./public/favicon.ico";

	constructor(options: BuntokOptions = {}) {
		this.handleSignals = options.handleSignals ?? true;
		this.shutdownTimeout = options.shutdownTimeout ?? 30_000;
		this.router = new Router();
		// Favicon served as static file from docs templates directory
	}

	public use(middleware: Middleware<DI>): this {
		this.middlewares.push(middleware);
		this._invalidateAOT(true);
		return this;
	}

	private get hasPipelineHooks(): boolean {
		return (
			this.middlewares.length > 0 ||
			this.requestHooks.length > 0 ||
			this.deriveHooks.length > 0 ||
			this.beforeHandleHooks.length > 0 ||
			this.afterHandleHooks.length > 0
		);
	}

	public onRequest(hook: RequestHook<DI>): this {
		this.requestHooks.push(hook);
		this._invalidateAOT(true);
		return this;
	}

	public onBeforeHandle(hook: BeforeHandleHook<DI>): this {
		this.beforeHandleHooks.push(hook);
		this._invalidateAOT(true);
		return this;
	}

	public onAfterHandle(hook: AfterHandleHook<DI>): this {
		this.afterHandleHooks.push(hook);
		this._invalidateAOT(true);
		return this;
	}

	public derive(hook: DeriveHook<DI>): this {
		this.deriveHooks.push(hook);
		this._invalidateAOT(true);
		return this;
	}

	public onStart(hook: AppHook): this {
		this.startHooks.push(hook);
		return this;
	}

	public onStop(hook: AppHook): this {
		this.stopHooks.push(hook);
		return this;
	}

	public model(name: string, schema: unknown): this;
	public model(models: Record<string, unknown>): this;
	public model(
		nameOrModels: string | Record<string, unknown>,
		schema?: unknown,
	): this {
		if (typeof nameOrModels === "string") {
			registerModel(nameOrModels, schema);
			return this;
		}
		for (const [name, model] of Object.entries(nameOrModels)) {
			registerModel(name, model);
		}
		return this;
	}

	public getModel<T = unknown>(name: string): T | undefined {
		return getModel(name) as T | undefined;
	}

	public decorate<T extends Record<string, unknown>>(values: T): Buntok<DI & T>;
	public decorate<K extends string, V>(name: K, value: V): Buntok<DI & Record<K, V>>;
	public decorate(
		nameOrValues: string | Record<string, unknown>,
		value?: unknown,
	): Buntok<DI & Record<string, unknown>> {
		if (typeof nameOrValues === "string") {
			(this.di as Record<string, unknown>)[nameOrValues] = value;
		} else {
			Object.assign(this.di, nameOrValues);
		}
		return this as unknown as Buntok<DI & Record<string, unknown>>;
	}

	/** Configure which proxy peers may supply forwarding headers. */
	public setTrustedProxy(options?: TrustedProxyOptions): this {
		this.trustedProxy = options;
		this._clientIPResolver = options
			? (req) => getClientIP(req, options)
			: (req) => getClientIP(req);
		this._invalidateAOT();
		return this;
	}

	/** Register an owned resource for graceful application shutdown. */
	public registerResource(resource: DisposableResource): this {
		this.resources.add(resource);
		return this;
	}

	/**
	 * Configure CORS for the application.
	 * Unlike `app.use(cors(...))`, this method also ensures CORS headers
	 * are applied to error responses (4xx, 5xx) generated by the framework.
	 */
	public cors(options: CorsOptions = {}): this {
		this.corsConfig = options;
		this.middlewares.push(cors(options));
		return this;
	}

	/**
	 * Install a plugin. Plugins are deduplicated by name -
	 * installing the same plugin twice is a no-op.
	 */
	public async plugin(plugin: Plugin<DI>): Promise<this> {
		if (this.installedPlugins.has(plugin.name)) return this;
		this.installedPlugins.add(plugin.name);
		try {
			await plugin.install(this);
			if (plugin.dispose) this.pluginDisposers.set(plugin.name, plugin.dispose);
		} catch (error) {
			this.installedPlugins.delete(plugin.name);
			throw error;
		}
		return this;
	}

	public set<K extends keyof DI>(key: K, value: DI[K]): this {
		this.di[key] = value;
		return this;
	}

	/**
	 * Attach an IoC Container to the app. When set, `registerController()`
	 * will resolve controllers via `container.resolve()` (use `FactoryProvider` for ctor deps).
	 */
	public setContainer(container: Container): this {
		this.container = container;
		return this;
	}

	/**
	 * Get the attached IoC Container, or create an empty one if none was set.
	 */
	public getContainer(): Container {
		if (!this.container) {
			this.container = new Container();
		}
		return this.container;
	}

	public group(prefix: string): RouterGroup<DI> {
		return new RouterGroup<DI>(prefix, this);
	}

	/**
	 * Register a WebSocket endpoint at an exact path (no params/wildcards).
	 * Backed directly by Bun's native WebSocket server - no polyfill or
	 * extra abstraction layer between your handler and `Bun.serve`.
	 *
	 * ```ts
	 * app.ws("/chat", {
	 *   open: (ws) => ws.subscribe("room"),
	 *   message: (ws, msg) => ws.publish("room", msg),
	 * });
	 * ```
	 */
	public ws(path: string, handler: WSHandler<DI>): this {
		this.wsRoutes.set(path, handler);
		return this;
	}

	/** Configure Bun WebSocket options - Bun-only, zero-deps */
	public wsOptions(opts: WSOptions): this {
		this.wsOpts = { ...this.wsOpts, ...opts };
		return this;
	}

	/**
	 * Type-safe Environment Variables Validator (static).
	 * Validates `process.env` against a Zod schema object and returns the typed result.
	 * If validation fails, it prints a beautiful error to the console and exits the process (stops booting).
	 *
	 * @example
	 * // Static - no Buntok instance needed (ideal for src/env.ts)
	 * const env = Buntok.validateEnv({
	 *   DATABASE_URL: z.string().url(),
	 *   PORT: z.coerce.number().default(3000),
	 * });
	 *
	 * @example
	 * // Custom error handler - send to monitoring before exiting
	 * const env = Buntok.validateEnv({
	 *   DATABASE_URL: z.string().url(),
	 * }, {
	 *   onError: (errors) => {
	 *     // Send to monitoring service
	 *     console.error("ENV ERROR:", errors);
	 *     // Exit manually after alerting
	 *     process.exit(1);
	 *   }
	 * });
	 */
	static validateEnv<T extends z.ZodRawShape>(
		schema: T,
		options?: EnvValidationOptions,
	): z.infer<z.ZodObject<T>> {
		// biome-ignore lint/style/noNonNullAssertion: Lazy load zod on first use
		const zod = (globalThis as Record<string, unknown>).__buntok_zod ??= require("zod").z;
		const envSchema = zod.object(schema);
		const result = envSchema.safeParse(process.env);

		if (!result.success) {
			const errors = result.error.issues.map((err: { path: { join: (s: string) => string }; message: string }) => ({
				field: err.path.join("."),
				message: err.message,
			}));

			// If custom handler provided, call it and skip default behavior
			if (options?.onError) {
				options.onError(errors);
				// If onError didn't throw/exit, throw error for caller to handle
				throw new Error(
					`Environment validation failed: ${errors.map((e: { field: string; message: string }) => `${e.field}: ${e.message}`).join(", ")}`,
				);
			}

			// Default behavior: print error and exit
			console.error("\n\x1b[41m\x1b[37m 🚨 Buntok Environment Error \x1b[0m\n");
			console.error(
				"\x1b[31mMissing or invalid environment variables:\x1b[0m\n",
			);

			errors.forEach((err: { field: string; message: string }) => {
				console.error(
					`  \x1b[33m❯\x1b[0m \x1b[36m${err.field}\x1b[0m: \x1b[90m${err.message}\x1b[0m`,
				);
			});

			console.error("\n\x1b[31mServer boot aborted.\x1b[0m\n");
			process.exit(1);
		}

		return result.data;
	}

	/**
	 * Type-safe Environment Variables Validator (instance).
	 * Delegates to the static method. Kept for backward compatibility.
	 *
	 * @example
	 * const app = new Buntok();
	 * const env = app.validateEnv({
	 *   DATABASE_URL: z.string().url(),
	 *   PORT: z.coerce.number().default(3000),
	 * });
	 */
	public validateEnv<T extends z.ZodRawShape>(
		schema: T,
		options?: EnvValidationOptions,
	): z.infer<z.ZodObject<T>> {
		return Buntok.validateEnv(schema, options);
	}

	/**
	 * Register all `@Get`/`@Post`/etc. routes declared on a `@Controller`
	 * class. This is sugar over `registerRoute()` - it instantiates the
	 * class once (at boot time, not per request) and wires each decorated
	 * method up exactly like a manual `app.get(path, handler)` call would.
	 *
	 * When a Container is attached via `app.setContainer()`, `@Inject`-
	 * annotated properties on the controller are automatically resolved
	 * from the container before routes are bound.
	 *
	 * ```ts
	 * app.registerController(UserController);
	 * app.registerController([UserController, PostController]);
	 * ```
	 */
	// biome-ignore lint/suspicious/noExplicitAny: Constructor args are unknowable
	public registerController<T extends object>(target: (new (...args: any[]) => T) | T): this;
	// biome-ignore lint/suspicious/noExplicitAny: Constructor args are unknowable
	public registerController<T extends object>(targets: Array<(new (...args: any[]) => T) | T>): this;
	// biome-ignore lint/suspicious/noExplicitAny: Constructor args are unknowable
	public registerController<T extends object>(
		target: (new (...args: any[]) => T) | T | Array<(new (...args: any[]) => T) | T>,
	): this {
		if (Array.isArray(target)) {
			for (const t of target) {
				this.registerController(t);
			}
			return this;
		}
		// Detect if target is a class (constructor) or an instance
		const isInstance =
			typeof target === "object" &&
			target !== null &&
			typeof target === "object";

		const ControllerClass = isInstance
			? // biome-ignore lint/suspicious/noExplicitAny: dynamic type narrowing
			(target as any).constructor
			: // biome-ignore lint/suspicious/noExplicitAny: dynamic type narrowing
			(target as new (
				...args: any[]
			) => T);

		const meta = getControllerMeta(ControllerClass);
		if (!meta) {
			throw new Error(
				`${ControllerClass.name} is not decorated with @Controller - did you forget to add it?`,
			);
		}

		let instance: T;

		if (isInstance) {
			// Use the provided instance directly
			instance = target as T;
		} else if (this.container?.has(ControllerClass)) {
			// Resolve from container if registered via scan()
			const resolved = this.container.resolve<T>(ControllerClass);
			instance = resolved;
		} else {
			// No container registration - create directly (no DI)
			instance = new ControllerClass();
		}

		const normalizedPrefix = meta.prefix.endsWith("/")
			? meta.prefix.slice(0, -1)
			: meta.prefix;

		for (const route of meta.routes) {
			const cleanPath = route.path === "/" ? "" : route.path;
			const fullPath = `${normalizedPrefix}${cleanPath}` || "/";
			// biome-ignore lint/suspicious/noExplicitAny: dynamic method dispatch by decorated property key
			const originalMethod = (instance as any)[route.propertyKey];
			let handler = ((...args: any[]) => originalMethod.apply(instance, args)) as Handler<DI>;
			// Attach original for sucrose analysis (bound/closure wrappers hide toString)
			(handler as any)._sucroseTarget = originalMethod;

			// Apply zero-cost wrappers for @HttpCode/@Header/@Redirect (boot-time, no per-request alloc beyond wrapper closure)
			handler = applyRouteResponseDecorators(handler, route);

			this.registerRoute(route.method, fullPath, [
				...(route.middlewares as Middleware<DI>[]),
				handler,
			], { source: "controller", controller: ControllerClass.name });
		}

		return this;
	}

	public onError(handler: ErrorHandler<DI>): this {
		this.customErrorHandler = handler;
		return this;
	}

	public notFound(handler: NotFoundHandler<DI>): this {
		this.customNotFoundHandler = handler;
		return this;
	}

	/**
	 * Disable a built-in feature:
	 *
	 * - `"x-powered-by"` - turns off the `X-Powered-By: buntok` response
	 *   header. The header's value itself is not configurable - this only
	 *   controls whether it's sent.
	 * - `"logger"` - silences the terminal logger entirely: request logs,
	 *   error/warn logs, graceful-shutdown messages, and the startup banner
	 *   (`Buntok vX ready in ...`). Also flags request logging as off so the
	 *   AOT router compiles its log-free fast path. Useful when you don't
	 *   want log noise during development.
	 *
	 * Both flags are read by the AOT codegen at compile time - toggling after
	 * compile triggers a lazy recompile on the next request.
	 */
	public disable(feature: "x-powered-by" | "logger"): this {
		if (feature === "x-powered-by") {
			this.poweredByHeaderEnabled = false;
		}
		if (feature === "logger") {
			logger.enabled = false;
			logger.logRequests = false;
		}
		this._invalidateAOT();
		return this;
	}

	/**
	 * Re-enable a feature previously turned off with `disable()`.
	 */
	public enable(feature: "x-powered-by" | "logger"): this {
		if (feature === "x-powered-by") {
			this.poweredByHeaderEnabled = true;
		}
		if (feature === "logger") {
			logger.enabled = true;
			logger.logRequests = true;
		}
		this._invalidateAOT();
		return this;
	}

	/**
	 * Enable SO_REUSEPORT for multi-process load balancing (Linux only).
	 * When enabled, multiple instances of the app can bind to the same port,
	 * and incoming requests are load-balanced at the kernel level.
	 *
	 * ⚠️ On non-Linux platforms (macOS, Windows), this option is silently ignored.
	 * A warning will be logged in development mode to help catch environment mismatches.
	 */
	public enableReusePort(enabled = true): this {
		this._reusePort = enabled;

		// Warn in development about platform limitation
		if (enabled && process.platform !== "linux") {
			console.warn(
				`\x1b[33m⚠ Warning: enableReusePort() is only supported on Linux. ` +
				`Current platform: ${process.platform}. ` +
				`This option will be ignored in production.\x1b[0m`,
			);
		}

		return this;
	}

	public icon(path?: string): this {
		if (path) this.iconPath = path;
		this.registerFaviconRoute();
		return this;
	}

	private registerFaviconRoute(): void {
		this.get("/favicon.ico", async (_ctx) => {
			// Try custom path first
			const customFile = Bun.file(this.iconPath);
			if (await customFile.exists()) {
				return new Response(customFile);
			}
			// Fallback to built-in icon
			const builtInFile = Bun.file(this.getBuiltInIconPath());
			if (await builtInFile.exists()) {
				return new Response(builtInFile);
			}
			// No favicon found
			return new Response(null, { status: 404 });
		});
		// Promote to a native Bun route value when the icon exists at boot -
		// registered after this.get() so registerRoute's static-value cleanup
		// doesn't wipe it. The async handler above stays as the JS fallback
		// (native gates off, or the file appears after registration).
		const resolved = existsSync(this.iconPath)
			? this.iconPath
			: this.getBuiltInIconPath();
		if (existsSync(resolved)) {
			this._staticRouteValues.set("GET:/favicon.ico", Bun.file(resolved));
		}
	}

	private getBuiltInIconPath(): string {
		return join(__dirname, "..", "public", "favicon.ico");
	}

	public get<Path extends string>(path: Path, handler: Handler<DI, Path> | string | Response): this;
	public get<Path extends string>(
		path: Path,
		middleware: Middleware<DI, Path>,
		handler: Handler<DI, Path> | string | Response,
	): this;
	public get<Path extends string>(
		path: Path,
		m1: Middleware<DI, Path>,
		m2: Middleware<DI, Path>,
		handler: Handler<DI, Path> | string | Response,
	): this;
	public get<Path extends string>(
		path: Path,
		m1: Middleware<DI, Path>,
		m2: Middleware<DI, Path>,
		m3: Middleware<DI, Path>,
		handler: Handler<DI, Path> | string | Response,
	): this;
	public get<Path extends string>(
		path: Path,
		m1: Middleware<DI, Path>,
		m2: Middleware<DI, Path>,
		m3: Middleware<DI, Path>,
		m4: Middleware<DI, Path>,
		handler: Handler<DI, Path> | string | Response,
	): this;
	public get<Path extends string>(
		path: Path,
		m1: Middleware<DI, Path>,
		m2: Middleware<DI, Path>,
		m3: Middleware<DI, Path>,
		m4: Middleware<DI, Path>,
		m5: Middleware<DI, Path>,
		handler: Handler<DI, Path> | string | Response,
	): this;
	public get<Path extends string>(
		path: Path,
		...handlers: Array<Middleware<DI, Path> | Handler<DI, Path> | string | Response>
	): this {
		this.registerRoute("GET", path, handlers, { source: "route" });
		return this;
	}

	public post<Path extends string>(
		path: Path,
		handler: Handler<DI, Path> | string | Response,
	): this;
	public post<Path extends string>(
		path: Path,
		middleware: Middleware<DI, Path>,
		handler: Handler<DI, Path> | string | Response,
	): this;
	public post<Path extends string>(
		path: Path,
		m1: Middleware<DI, Path>,
		m2: Middleware<DI, Path>,
		handler: Handler<DI, Path> | string | Response,
	): this;
	public post<Path extends string>(
		path: Path,
		m1: Middleware<DI, Path>,
		m2: Middleware<DI, Path>,
		m3: Middleware<DI, Path>,
		handler: Handler<DI, Path> | string | Response,
	): this;
	public post<Path extends string>(
		path: Path,
		m1: Middleware<DI, Path>,
		m2: Middleware<DI, Path>,
		m3: Middleware<DI, Path>,
		m4: Middleware<DI, Path>,
		handler: Handler<DI, Path> | string | Response,
	): this;
	public post<Path extends string>(
		path: Path,
		m1: Middleware<DI, Path>,
		m2: Middleware<DI, Path>,
		m3: Middleware<DI, Path>,
		m4: Middleware<DI, Path>,
		m5: Middleware<DI, Path>,
		handler: Handler<DI, Path> | string | Response,
	): this;
	public post<Path extends string>(
		path: Path,
		...handlers: Array<Middleware<DI, Path> | Handler<DI, Path> | string | Response>
	): this {
		this.registerRoute("POST", path, handlers, { source: "route" });
		return this;
	}

	public put<Path extends string>(path: Path, handler: Handler<DI, Path> | string | Response): this;
	public put<Path extends string>(
		path: Path,
		middleware: Middleware<DI, Path>,
		handler: Handler<DI, Path> | string | Response,
	): this;
	public put<Path extends string>(
		path: Path,
		m1: Middleware<DI, Path>,
		m2: Middleware<DI, Path>,
		handler: Handler<DI, Path> | string | Response,
	): this;
	public put<Path extends string>(
		path: Path,
		m1: Middleware<DI, Path>,
		m2: Middleware<DI, Path>,
		m3: Middleware<DI, Path>,
		handler: Handler<DI, Path> | string | Response,
	): this;
	public put<Path extends string>(
		path: Path,
		m1: Middleware<DI, Path>,
		m2: Middleware<DI, Path>,
		m3: Middleware<DI, Path>,
		m4: Middleware<DI, Path>,
		handler: Handler<DI, Path> | string | Response,
	): this;
	public put<Path extends string>(
		path: Path,
		m1: Middleware<DI, Path>,
		m2: Middleware<DI, Path>,
		m3: Middleware<DI, Path>,
		m4: Middleware<DI, Path>,
		m5: Middleware<DI, Path>,
		handler: Handler<DI, Path> | string | Response,
	): this;
	public put<Path extends string>(
		path: Path,
		...handlers: Array<Middleware<DI, Path> | Handler<DI, Path> | string | Response>
	): this {
		this.registerRoute("PUT", path, handlers, { source: "route" });
		return this;
	}

	public delete<Path extends string>(
		path: Path,
		handler: Handler<DI, Path> | string | Response,
	): this;
	public delete<Path extends string>(
		path: Path,
		middleware: Middleware<DI, Path>,
		handler: Handler<DI, Path> | string | Response,
	): this;
	public delete<Path extends string>(
		path: Path,
		m1: Middleware<DI, Path>,
		m2: Middleware<DI, Path>,
		handler: Handler<DI, Path> | string | Response,
	): this;
	public delete<Path extends string>(
		path: Path,
		m1: Middleware<DI, Path>,
		m2: Middleware<DI, Path>,
		m3: Middleware<DI, Path>,
		handler: Handler<DI, Path> | string | Response,
	): this;
	public delete<Path extends string>(
		path: Path,
		m1: Middleware<DI, Path>,
		m2: Middleware<DI, Path>,
		m3: Middleware<DI, Path>,
		m4: Middleware<DI, Path>,
		handler: Handler<DI, Path> | string | Response,
	): this;
	public delete<Path extends string>(
		path: Path,
		m1: Middleware<DI, Path>,
		m2: Middleware<DI, Path>,
		m3: Middleware<DI, Path>,
		m4: Middleware<DI, Path>,
		m5: Middleware<DI, Path>,
		handler: Handler<DI, Path> | string | Response,
	): this;
	public delete<Path extends string>(
		path: Path,
		...handlers: Array<Middleware<DI, Path> | Handler<DI, Path> | string | Response>
	): this {
		this.registerRoute("DELETE", path, handlers, { source: "route" });
		return this;
	}

	public options<Path extends string>(
		path: Path,
		handler: Handler<DI, Path> | string | Response,
	): this;
	public options<Path extends string>(
		path: Path,
		middleware: Middleware<DI, Path>,
		handler: Handler<DI, Path> | string | Response,
	): this;
	public options<Path extends string>(
		path: Path,
		m1: Middleware<DI, Path>,
		m2: Middleware<DI, Path>,
		handler: Handler<DI, Path> | string | Response,
	): this;
	public options<Path extends string>(
		path: Path,
		m1: Middleware<DI, Path>,
		m2: Middleware<DI, Path>,
		m3: Middleware<DI, Path>,
		handler: Handler<DI, Path> | string | Response,
	): this;
	public options<Path extends string>(
		path: Path,
		m1: Middleware<DI, Path>,
		m2: Middleware<DI, Path>,
		m3: Middleware<DI, Path>,
		m4: Middleware<DI, Path>,
		handler: Handler<DI, Path> | string | Response,
	): this;
	public options<Path extends string>(
		path: Path,
		m1: Middleware<DI, Path>,
		m2: Middleware<DI, Path>,
		m3: Middleware<DI, Path>,
		m4: Middleware<DI, Path>,
		m5: Middleware<DI, Path>,
		handler: Handler<DI, Path> | string | Response,
	): this;
	public options<Path extends string>(
		path: Path,
		...handlers: Array<Middleware<DI, Path> | Handler<DI, Path> | string | Response>
	): this {
		this.registerRoute("OPTIONS", path, handlers, { source: "route" });
		return this;
	}

	public query(path: string, handler: Handler<DI>): this;
	public query(
		path: string,
		middleware: Middleware<DI>,
		handler: Handler<DI>,
	): this;
	public query(
		path: string,
		m1: Middleware<DI>,
		m2: Middleware<DI>,
		handler: Handler<DI>,
	): this;
	public query(
		path: string,
		m1: Middleware<DI>,
		m2: Middleware<DI>,
		m3: Middleware<DI>,
		handler: Handler<DI>,
	): this;
	public query(
		path: string,
		m1: Middleware<DI>,
		m2: Middleware<DI>,
		m3: Middleware<DI>,
		m4: Middleware<DI>,
		handler: Handler<DI>,
	): this;
	public query(
		path: string,
		m1: Middleware<DI>,
		m2: Middleware<DI>,
		m3: Middleware<DI>,
		m4: Middleware<DI>,
		m5: Middleware<DI>,
		handler: Handler<DI>,
	): this;
	public query(
		path: string,
		...handlers: Array<Middleware<DI> | Handler<DI>>
	): this {
		this.registerRoute("QUERY", path, handlers, { source: "route" });
		return this;
	}

	public patch<Path extends string>(
		path: Path,
		handler: Handler<DI, Path> | string | Response,
	): this;
	public patch<Path extends string>(
		path: Path,
		middleware: Middleware<DI, Path>,
		handler: Handler<DI, Path> | string | Response,
	): this;
	public patch<Path extends string>(
		path: Path,
		m1: Middleware<DI, Path>,
		m2: Middleware<DI, Path>,
		handler: Handler<DI, Path> | string | Response,
	): this;
	public patch<Path extends string>(
		path: Path,
		m1: Middleware<DI, Path>,
		m2: Middleware<DI, Path>,
		m3: Middleware<DI, Path>,
		handler: Handler<DI, Path> | string | Response,
	): this;
	public patch<Path extends string>(
		path: Path,
		m1: Middleware<DI, Path>,
		m2: Middleware<DI, Path>,
		m3: Middleware<DI, Path>,
		m4: Middleware<DI, Path>,
		handler: Handler<DI, Path> | string | Response,
	): this;
	public patch<Path extends string>(
		path: Path,
		m1: Middleware<DI, Path>,
		m2: Middleware<DI, Path>,
		m3: Middleware<DI, Path>,
		m4: Middleware<DI, Path>,
		m5: Middleware<DI, Path>,
		handler: Handler<DI, Path> | string | Response,
	): this;
	public patch<Path extends string>(
		path: Path,
		...handlers: Array<Middleware<DI, Path> | Handler<DI, Path> | string | Response>
	): this {
		this.registerRoute("PATCH", path, handlers, { source: "route" });
		return this;
	}

	public head<Path extends string>(
		path: Path,
		handler: Handler<DI, Path> | string | Response,
	): this;
	public head<Path extends string>(
		path: Path,
		middleware: Middleware<DI, Path>,
		handler: Handler<DI, Path> | string | Response,
	): this;
	public head<Path extends string>(
		path: Path,
		m1: Middleware<DI, Path>,
		m2: Middleware<DI, Path>,
		handler: Handler<DI, Path> | string | Response,
	): this;
	public head<Path extends string>(
		path: Path,
		m1: Middleware<DI, Path>,
		m2: Middleware<DI, Path>,
		m3: Middleware<DI, Path>,
		handler: Handler<DI, Path> | string | Response,
	): this;
	public head<Path extends string>(
		path: Path,
		m1: Middleware<DI, Path>,
		m2: Middleware<DI, Path>,
		m3: Middleware<DI, Path>,
		m4: Middleware<DI, Path>,
		handler: Handler<DI, Path> | string | Response,
	): this;
	public head<Path extends string>(
		path: Path,
		m1: Middleware<DI, Path>,
		m2: Middleware<DI, Path>,
		m3: Middleware<DI, Path>,
		m4: Middleware<DI, Path>,
		m5: Middleware<DI, Path>,
		handler: Handler<DI, Path> | string | Response,
	): this;
	public head<Path extends string>(
		path: Path,
		...handlers: Array<Middleware<DI, Path> | Handler<DI, Path> | string | Response>
	): this {
		this.registerRoute("HEAD", path, handlers, { source: "route" });
		return this;
	}

	/**
	 * Register a handler for all standard HTTP methods (GET, HEAD, POST, PUT, PATCH, DELETE, OPTIONS).
	 */
	public all<Path extends string>(path: Path, handler: Handler<DI, Path> | string | Response): this;
	public all<Path extends string>(
		path: Path,
		middleware: Middleware<DI, Path>,
		handler: Handler<DI, Path> | string | Response,
	): this;
	public all<Path extends string>(
		path: Path,
		m1: Middleware<DI, Path>,
		m2: Middleware<DI, Path>,
		handler: Handler<DI, Path> | string | Response,
	): this;
	public all<Path extends string>(
		path: Path,
		m1: Middleware<DI, Path>,
		m2: Middleware<DI, Path>,
		m3: Middleware<DI, Path>,
		handler: Handler<DI, Path> | string | Response,
	): this;
	public all<Path extends string>(
		path: Path,
		m1: Middleware<DI, Path>,
		m2: Middleware<DI, Path>,
		m3: Middleware<DI, Path>,
		m4: Middleware<DI, Path>,
		handler: Handler<DI, Path> | string | Response,
	): this;
	public all<Path extends string>(
		path: Path,
		m1: Middleware<DI, Path>,
		m2: Middleware<DI, Path>,
		m3: Middleware<DI, Path>,
		m4: Middleware<DI, Path>,
		m5: Middleware<DI, Path>,
		handler: Handler<DI, Path> | string | Response,
	): this;
	public all<Path extends string>(
		path: Path,
		...handlers: Array<Middleware<DI, Path> | Handler<DI, Path> | string | Response>
	): this {
		const methods = [
			"GET",
			"HEAD",
			"POST",
			"PUT",
			"PATCH",
			"DELETE",
			"OPTIONS",
		];
		for (const method of methods) {
			this.registerRoute(method, path, handlers, { source: "route" });
		}
		return this;
	}

	/**
	 * Serve static files from `directory` under `routePath`.
	 *
	 * Rejects any request whose resolved path escapes `directory` (e.g.
	 * `/files/../../etc/passwd`) - without this check, static serving is a
	 * directory-traversal vulnerability.
	 *
	 * Supports ETag-based conditional requests (If-None-Match → 304).
	 * ETag is computed on every response and sent to the client, enabling
	 * efficient caching on subsequent requests.
	 */
	public static(routePath: string, directory: string, options?: StaticOptions): this {
		const baseDir = resolve(directory);
		const maxAge = options?.maxAge ?? 3600;
		const cacheControl = options?.cacheControl ?? `public, max-age=${maxAge}`;
		const enableEtag = options?.etag !== false;

		const handler: Handler<DI> = async (ctx) => {
			const requestedPath = ctx.params["*"] || "";
			let absolutePath = join(baseDir, requestedPath);

			if (absolutePath !== baseDir && !absolutePath.startsWith(baseDir + sep)) {
				return ctx.json({ error: "Forbidden" }, 403);
			}

			// If file doesn't exist, check for directory with index.html
			if (!(await Bun.file(absolutePath).exists())) {
				const indexPath = join(absolutePath, "index.html");
				if (await Bun.file(indexPath).exists()) {
					absolutePath = indexPath;
				}
			}

			const file = Bun.file(absolutePath);

			if (!(await file.exists())) {
				return ctx.json({ error: "File Not Found" }, 404);
			}

			const etag = enableEtag ? `"${file.size}-${file.lastModified}"` : null;

			// ETag-based conditional request (If-None-Match → 304)
			if (etag) {
				const ifNoneMatch = ctx.request.headers.get("If-None-Match");
				if (ifNoneMatch === etag) {
					return new Response(null, {
						status: 304,
						headers: { ETag: etag },
					});
				}
			}

			const headers: Record<string, string> = {
				"Cache-Control": cacheControl,
			};
			if (etag) {
				headers.ETag = etag;
			}

			return new Response(file, { headers });
		};

		const wildcardPath = routePath.endsWith("/")
			? `${routePath}*`
			: `${routePath}/*`;
		this.get(wildcardPath, handler);
		// Opt-in native directory serving - Bun answers the route with its
		// `{ dir }` implementation (zero JS). Registered after this.get() for
		// the same reason as the favicon: registerRoute clears static values.
		// Gates (logger / X-Powered-By / global mw) still apply at listen();
		// when off, the JS handler above keeps serving with full options.
		if (
			options?.native &&
			wildcardPath.startsWith("/") &&
			wildcardPath.endsWith("/*") &&
			!wildcardPath.includes("{")
		) {
			this._staticRouteValues.set(`GET:${wildcardPath}`, { dir: baseDir });
		}
		return this;
	}

	/**
	 * Enable interactive API documentation at the specified path.
	 *
	 * Serves a built-in docs UI and the generated OpenAPI spec (swagger.json).
	 * The docs routes are registered directly on the router and do NOT appear
	 * in the generated swagger.json.
	 *
	 * @example
	 * ```ts
	 * app.apiDocs({ path: "/docs", title: "My API", version: "1.0.0" });
	 * ```
	 */
	public apiDocs(options?: ApiDocsOptions): this {
		this._apiDocsConfig = {
			path: options?.path ?? "/docs",
			title: options?.title ?? "API Documentation",
			version: options?.version ?? "1.0.0",
			description: options?.description,
			safeOnProduction: options?.safeOnProduction ?? false,
		};
		return this;
	}

	public registerRoute(
		method: string,
		path: string,
		handlers: Array<Middleware<DI> | Handler<DI> | string | Response>,
		options?: { source?: "route" | "controller" | "group"; controller?: string; group?: string },
	): void {
		const routeMiddlewares = handlers.slice(0, -1) as Middleware<DI>[];
		const routeKey = `${method}:${path}`;
		let mainHandler = handlers[handlers.length - 1] as Handler<DI>;

		// Static handler value (Elysia style: `app.get('/', 'Hi')`) - wrap it
		// in a function so every execution path (pipeline, AOT codegen,
		// fallback) keeps working, and keep the raw value so listen() can
		// promote the route to native Bun.serve `routes` (hot path without JS).
		this._staticRouteValues.delete(routeKey);
		const rawMain = handlers[handlers.length - 1];
		if (typeof rawMain === "string" || rawMain instanceof Response) {
			const staticValue = rawMain;
			mainHandler = () => staticValue;
			if (routeMiddlewares.length === 0) {
				this._staticRouteValues.set(routeKey, staticValue);
			}
		} else if (routeMiddlewares.length === 0) {
			// Handler with a provably constant expression - a pure literal
			// (`() => "Hi"`), `ctx.text("Hi"[, 201])`, `ctx.html(...)` or
			// `ctx.json(<JSON-literal>[, 201])` - also promoted to native.
			// The original function stays on the JS path as a fallback when
			// a native gate is off (logging/global mw/etc.).
			const constOp = extractConstResponseOp(rawMain);
			if (constOp !== undefined) {
				this._staticRouteValues.set(routeKey, constOp);
			}
		}

		// Track routes with per-route middlewares for AOT Context optimization
		if (routeMiddlewares.length > 0) {
			this._routesWithMiddleware.add(routeKey);
		}

		// Pre-compute sucrose analysis for fallback path and AOT codegen
		if (!this._handlerNeedsFullContext.has(mainHandler)) {
			const a = analyzeHandler(mainHandler);
			this._handlerNeedsFullContext.set(mainHandler, !!(a.needsBody || a.needsValidation ||
				a.needsFormData || a.needsQuery || a.needsText || a.needsBinary));
		}
		// Full context check for AOT: includes ctx.json, ctx.error, etc.
		if (!this._handlerFullContextCache.has(mainHandler)) {
			const a = analyzeHandler(mainHandler);
			this._handlerFullContextCache.set(mainHandler, {
				needsFullContext: !!a.needsFullContext,
				needsParams: !!a.needsParams,
				needsSetHeaders: !!a.needsSetHeaders,
			});
		}

		// Capture debug info before compilation
		this.routeDebugInfo.push({
			method,
			path,
			middlewares: routeMiddlewares.map((mw) => mw.name || "anonymous"),
			handler: mainHandler.name || "anonymous",
			source: options?.source || "route",
			controller: options?.controller,
			group: options?.group,
		});

		// Collect OpenAPI metadata
		// biome-ignore lint/suspicious/noExplicitAny: Required for flexible schema representation
		const openApiDoc: any = {
			method: method.toLowerCase(),
			path,
			request: { params: null, query: null, body: null },
			responses: [],
		};

		for (const handler of handlers) {
			const h = handler as unknown as Record<string, unknown>;
			if (h._isBuntokValidator) {
				const target = h._target as string;
				const schema = h._schema;
				openApiDoc.request[target] = schema;
				if (target === "body") {
					openApiDoc.request.bodyContentType = h._contentType as string;
				}
			}
			if (h._isBuntokResponse) {
				openApiDoc.responses.push({
					status: h._status,
					schema: h._schema,
					description: h._description,
				});
			}
		}

		// Always register the route in OpenAPI, even if it lacks explicit validation/responses
		this.openApiDocs.push(openApiDoc);

		// AOT Compile route middlewares
		const executionChain = this.compilePipeline(routeMiddlewares, mainHandler);

		// Map compiled pipeline → original handler for AOT sucrose analysis
		this._pipelineToHandler.set(executionChain, mainHandler);

		this.router.insert(method, path, executionChain);
	}

	private compilePipeline(
		middlewares: Middleware<DI>[],
		finalHandler: Handler<DI>,
	): Handler<DI> {
		if (middlewares.length === 0) return finalHandler;

		const fns = [...middlewares, finalHandler];
		// Normalize the innermost handler result BEFORE it flows back through
		// the middleware chain: built-ins (requestId, responseTime, rateLimiter,
		// compress, auditLog) guard mutations with `result instanceof Response`
		// and would silently skip raw string/object returns (e. `() => "ok"`).
		let code = `const r = fns[${fns.length - 1}](ctx); return r instanceof Promise ? r.then((v) => normalize(v, ctx.request)) : normalize(r, ctx.request);`;
		for (let i = fns.length - 2; i >= 0; i--) {
			code = `return fns[${i}](ctx, () => { ${code} });`;
		}

		const factory = new Function(
			"fns",
			"normalize",
			`return function(ctx) { ${code} }`,
		);
		return factory(fns, this.normalizeReturn.bind(this)) as Handler<DI>;
	}

	/**
	 * Register API docs routes directly on the router.
	 * These routes do NOT go through registerRoute() and therefore
	 * do NOT appear in openApiDocs / swagger.json.
	 */
	private registerApiDocsRoutes(): void {
		const config = this._apiDocsConfig!;
		const basePath = (config.path ?? "/docs").replace(/\/+$/, "");

		// Resolve template paths relative to this package's dist directory
		const templatesDir = join(import.meta.dir, "cli", "templates");

		// Handler for serving the HTML docs UI - safe injection via app.apiDocs()
		const uiHandler: Handler<DI> = async () => {
			const htmlPath = join(templatesDir, "index.html");
			const file = Bun.file(htmlPath);
			if (await file.exists()) {
				let html = await file.text();
				// Safe HTML escape for <title> (prevent </title> injection)
				const rawTitle = config.title ?? "API Reference";
				const escTitleHtml = String(rawTitle)
					.replace(/&/g, "&amp;")
					.replace(/</g, "&lt;")
					.replace(/>/g, "&gt;")
					.replace(/"/g, "&quot;");
				html = html.replace(
					/<title>.*?<\/title>/,
					`<title>${escTitleHtml} - API Reference</title>`,
				);
				// Safe JSON injection via JSON.stringify (handles quotes, newlines, unicode)
				html = html.replace(
					/"title":\s*"API Documentation"/,
					`"title":${JSON.stringify(config.title ?? "API Documentation")}`,
				);
				html = html.replace(
					/"version":\s*"1\.0\.0"/,
					`"version":${JSON.stringify(config.version ?? "1.0.0")}`,
				);
				if (config.description) {
					html = html.replace(
						/"description":\s*"Loading API specification\.\.\."/,
						`"description":${JSON.stringify(config.description)}`,
					);
				}
				// Inject the swagger.json path based on the configured basePath
				const swaggerPath = `${basePath}/swagger.json`;
				html = html.replace(
					/const swaggerJsonPath = '.*?'/,
					`const swaggerJsonPath = ${JSON.stringify(swaggerPath)}`,
				);
				// Fix relative asset paths - browser resolves ./ against URL
				// which breaks when page is at /docs (no trailing slash)
				html = html.replace(/"\.\//g, `"${basePath}/`);
				return new Response(html, {
					headers: { "Content-Type": "text/html; charset=utf-8" },
				});
			}
			return new Response("Docs UI not found. Run 'buntok make:docs' first.", { status: 404 });
		};

		// Handler for serving swagger.json - memory first (instant), disk fallback
		const swaggerHandler: Handler<DI> = async () => {
			// Serve from in-memory cache (generated at startup)
			if (this._swaggerDocument) {
				return Response.json(this._swaggerDocument);
			}
			// Fallback to disk (for manual make:docs or if generation not done yet)
			const swaggerPath = join(process.cwd(), "public/docs/swagger.json");
			const file = Bun.file(swaggerPath);
			if (await file.exists()) {
				return new Response(file, {
					headers: { "Content-Type": "application/json" },
				});
			}
			return new Response(
				JSON.stringify({ error: "swagger.json not found." }),
				{ status: 404, headers: { "Content-Type": "application/json" } },
			);
		};

		// Handler for serving static assets (tailwind.js, font-googles.css)
		const assetsHandler: Handler<DI> = async (ctx) => {
			const assetName = ctx.params["*"] ?? "";
			const assetPath = join(templatesDir, assetName);
			const file = Bun.file(assetPath);
			if (await file.exists()) {
				const ext = assetName.split(".").pop()?.toLowerCase() ?? "";
				const contentTypes: Record<string, string> = {
					js: "application/javascript; charset=utf-8",
					css: "text/css; charset=utf-8",
					json: "application/json",
					png: "image/png",
					svg: "image/svg+xml",
					ico: "image/x-icon",
				};
				return new Response(file, {
					headers: { "Content-Type": contentTypes[ext] || "application/octet-stream" },
				});
			}
			return new Response("Not Found", { status: 404 });
		};

		// Register routes directly on router (bypass openApiDocs)
		this.router.insert("GET", `${basePath}/swagger.json`, swaggerHandler);
		this.router.insert("GET", `${basePath}/index.html`, uiHandler);
		this.router.insert("GET", `${basePath}/*`, assetsHandler);
		this.router.insert("GET", `${basePath}`, uiHandler);
		this.router.insert("GET", `${basePath}/`, uiHandler);

		// Serve favicon.ico from templates directory (root path)
		const faviconHandler: Handler<DI> = async () => {
			const file = Bun.file(join(templatesDir, "favicon.ico"));
			if (await file.exists()) {
				return new Response(file, { headers: { "Content-Type": "image/x-icon" } });
			}
			return new Response(null, { status: 404 });
		};
		this.router.insert("GET", "/favicon.ico", faviconHandler);
	}

	private compileGlobalPipeline(): void {
		if (!this.hasPipelineHooks) {
			this.compiledGlobalPipeline = (ctx, finalHandler) =>
				// biome-ignore lint/suspicious/noExplicitAny: compiled
				finalHandler(ctx as any);
			return;
		}

		type Next = () => Promise<Response> | Response;
		const preAdapter =
			(hook: RequestHook<DI> | BeforeHandleHook<DI>) =>
			(ctx: Context<DI>, next: Next): HandlerReturn => {
				const result = hook(ctx);
				if (result instanceof Promise) {
					return result.then((v) => (v instanceof Response ? v : next()));
				}
				if (result instanceof Response) return result;
				return next();
			};
		const deriveAdapter =
			(hook: DeriveHook<DI>) =>
			(ctx: Context<DI>, next: Next): HandlerReturn => {
				const result = hook(ctx);
				if (result instanceof Promise) {
					return result.then((v) => {
						if (v) Object.assign(ctx.store, v);
						return next();
					});
				}
				if (result) Object.assign(ctx.store, result);
				return next();
			};
		const afterAdapter =
			(hook: AfterHandleHook<DI>) =>
			(ctx: Context<DI>, next: Next): HandlerReturn => {
				const finish = (res: Response) => {
					const out = hook(ctx, res);
					return out instanceof Promise
						? out.then((v) => v ?? res)
						: (out ?? res);
				};
				const result = next();
				return result instanceof Promise ? result.then(finish) : finish(result);
			};

		// biome-ignore lint/suspicious/noExplicitAny: pipeline ctx params are normalized by codegen
		const fns: Array<(ctx: Context<DI, any>, next: Next) => HandlerReturn> = [
			...this.requestHooks.map(preAdapter),
			...this.middlewares,
			...this.deriveHooks.map(deriveAdapter),
			...this.beforeHandleHooks.map(preAdapter),
			...this.afterHandleHooks.map(afterAdapter),
		];
		// Same contract as compilePipeline: the final handler result is
		// normalized to a Response before it reaches any middleware, so
		// `result instanceof Response` mutations work regardless of the
		// handler's return type and of the logging flag.
		let code = `const r = finalHandler(ctx); return r instanceof Promise ? r.then((v) => normalize(v, ctx.request)) : normalize(r, ctx.request);`;
		for (let i = fns.length - 1; i >= 0; i--) {
			code = `return fns[${i}](ctx, () => { ${code} });`;
		}

		const factory = new Function(
			"fns",
			"normalize",
			`return function(ctx, finalHandler) { ${code} }`,
		);
		this.compiledGlobalPipeline = factory(
			fns,
			this.normalizeReturn.bind(this),
		) as (
			ctx: Context<DI>,
			finalHandler: Handler<DI>,
		) => HandlerReturn;
	}

	private compileAOTRouter(): (
		request: Request,
		server?: Server<WSData<DI>>,
	) => Response | Promise<Response> {
		// Snapshotted at compile time (not just at listen) - fetch/serverless
		// paths without listen() still get codegen without logResponse().
		this._skipLogResponse = !logger.logRequests;
		const hasGlobalMiddleware = this.hasPipelineHooks;
		let code =
			"return function(request, server) {\n" +
			"  const url = request.url;\n" +
			"  let start = url.indexOf('/', url.indexOf('//') + 2);\n" +
			"  if (start === -1) start = url.length;\n" +
			"  let end = url.indexOf('?', start);\n" +
			"  if (end === -1) end = url.length;\n" +
			"  const pathname = start === url.length ? '/' : url.substring(start, end);\n";

		if (this.wsRoutes.size > 0) {
			code +=
				"  if (server && wsRoutes.has(pathname)) {\n" +
				"    const wsHandler = wsRoutes.get(pathname);\n" +
				"    const wsCtx = new Context(request, EMPTY_PARAMS, di, clientIPResolver);\n" +
				"    const data = { ctx: wsCtx, handler: wsHandler };\n" +
				"    const upgraded = server.upgrade(request, { data });\n" +
				"    if (upgraded) return undefined;\n" +
				"    return new Response('Upgrade Required', { status: 426, headers: { Connection: 'Upgrade', Upgrade: 'websocket' } });\n" +
				"  }\n";
		}

		code += "  let ctx;\n  const method = request.method;\n" + "  try {\n" + "  switch(method) {\n";

		// biome-ignore lint/suspicious/noExplicitAny: generic
		const handlersList: any[] = [];
		// biome-ignore lint/suspicious/noExplicitAny: generic
		const handlersMap = new Map<any, string>();

		// biome-ignore lint/suspicious/noExplicitAny: generic
		function getHandlerIndex(handler: any) {
			if (handlersMap.has(handler)) return handlersMap.get(handler);
			const idx = handlersList.length;
			handlersList.push(handler);
			handlersMap.set(handler, `handlers[${idx}]`);
			return `handlers[${idx}]`;
		}

		// biome-ignore lint/suspicious/noExplicitAny: generic
		const methodPaths = new Map<string, { path: string; handler: any }[]>();
		for (const [path, methodMap] of this.router.staticRoutes.entries()) {
			for (const [method, handler] of methodMap.entries()) {
				if (!methodPaths.has(method)) methodPaths.set(method, []);
				// biome-ignore lint/style/noNonNullAssertion: guaranteed
				methodPaths.get(method)!.push({ path, handler });
			}
		}

		for (const [method, routes] of methodPaths.entries()) {
			code += `case "${method}": {\n`;
			code += "  switch(pathname) {\n";
			for (const route of routes) {
				const handlerRef = getHandlerIndex(route.handler);
				// Resolve original handler from pipeline for sucrose analysis
				const originalHandler = this._pipelineToHandler.get(route.handler) ?? route.handler;
				// Sucrose analysis via cached full-context check (detects ctx.json, ctx.error, etc.)
				const cached = this._handlerFullContextCache.get(originalHandler) ?? { needsFullContext: true, needsParams: false, needsSetHeaders: true };
				// Global middleware or per-route middleware (e.g. requireAuth, zValidator)
				// may use ctx.error, ctx.json, etc. - must provide full Context
				const routeKey = `${method}:${route.path}`;
				const needsFullContext = hasGlobalMiddleware || this._routesWithMiddleware.has(routeKey) || cached.needsFullContext;
				// Sucrose-proven: when nothing can write ctx.set.headers (route
				// middleware and global middleware both can - forced true above),
				// the response tail skips the applyCtxHeaders merge entirely.
				const needsSetHeaders =
					hasGlobalMiddleware ||
					this._routesWithMiddleware.has(routeKey) ||
					cached.needsSetHeaders;
				// Static-route codegen has no routeParams binding - and the
				// needsParams-only case is unreachable anyway (sucrose sets
				// needsFullContext whenever needsParams is true). Passing a
				// plain { request } here previously risked a ReferenceError.
				const ctxArg = needsFullContext ? "ctx" : "{ request }";
				// Error handler always needs full Context, so we declare ctx for catch blocks
				const ctxDecl = needsFullContext
					? "      ctx = new Context(request, EMPTY_PARAMS, di, clientIPResolver);\n"
					: "";

				code += `    case "${route.path}": {\n`;
				code += ctxDecl;
				code += hasGlobalMiddleware
					? `      const raw = compiledGlobalPipeline(${ctxArg}, ${handlerRef});\n`
					: `      const raw = ${handlerRef}(${ctxArg});\n`;
				if (this._skipLogResponse) {
					// Normalization expressions - promise branch (v) and sync branch
					// (raw) - shared by the set-headers and no-set variants below.
					const normV =
						'typeof v === "string" ? new Response(v) : v instanceof Response ? v : typeof v === "object" && v !== null ? (v instanceof BuntokFile ? v.toResponse(request) : Response.json(v)) : toResponse(v)';
					const normRaw =
						'typeof raw === "string" ? new Response(raw) : raw instanceof Response ? raw : typeof raw === "object" && raw !== null ? (raw instanceof BuntokFile ? raw.toResponse(request) : Response.json(raw)) : toResponse(raw)';
					const tailCatch =
						'.catch((e) => { if (!ctx) ctx = new Context(request, EMPTY_PARAMS, di, clientIPResolver); return handleError(request, pathname, ctx, e); });\n';
					if (!this.poweredByHeaderEnabled) {
						if (needsSetHeaders) {
							// Fastest path: no logging, no powered-by - skip setPoweredBy entirely
							code += "      if (raw instanceof Promise) {\n";
							code +=
								'        return raw.then((v) => applyCtxHeaders(ctx, ' + normV + '))' + tailCatch;
							code += "      }\n";
							code +=
								'      if (typeof raw === "string") return applyCtxHeaders(ctx, new Response(raw));\n';
							code +=
								"      if (raw instanceof Response) return applyCtxHeaders(ctx, raw);\n" +
								'      if (typeof raw === "object" && raw !== null) return applyCtxHeaders(ctx, raw instanceof BuntokFile ? raw.toResponse(request) : Response.json(raw));\n' +
								"      return applyCtxHeaders(ctx, toResponse(raw));\n";
						} else {
							// sucrose: handler can never write ctx.set.headers →
							// return the normalized response untouched.
							code += "      if (raw instanceof Promise) {\n";
							code +=
								'        return raw.then((v) => ' + normV + ')' + tailCatch;
							code += "      }\n";
							code +=
								'      if (typeof raw === "string") return new Response(raw);\n';
							code +=
								"      if (raw instanceof Response) return raw;\n" +
								'      if (typeof raw === "object" && raw !== null) return raw instanceof BuntokFile ? raw.toResponse(request) : Response.json(raw);\n' +
								"      return toResponse(raw);\n";
						}
					} else if (needsSetHeaders) {
						code += "      if (raw instanceof Promise) {\n";
						code +=
							'        return raw.then((v) => setPoweredBy(ctx, ' + normV + '))' + tailCatch;
						code += "      }\n";
						code +=
							'      if (typeof raw === "string") return setPoweredBy(ctx, new Response(raw));\n';
						code +=
							"      if (raw instanceof Response) return setPoweredBy(ctx, raw);\n" +
							'      if (typeof raw === "object" && raw !== null) return setPoweredBy(ctx, raw instanceof BuntokFile ? raw.toResponse(request) : Response.json(raw));\n' +
							"      return setPoweredBy(ctx, toResponse(raw));\n";
					} else {
						// powered-by without the ctx.set merge (baked at compile -
						// flag toggles trigger _recompileAOT()).
						code += "      if (raw instanceof Promise) {\n";
						code +=
							'        return raw.then((v) => { const r = ' + normV + '; r.headers.set("X-Powered-By", "buntok"); return r; })' + tailCatch;
						code += "      }\n";
						code +=
							'      const r = ' + normRaw + ';\n' +
							'      r.headers.set("X-Powered-By", "buntok");\n' +
							"      return r;\n";
					}
				} else {
					code += "      if (raw instanceof Promise) {\n";
					code +=
						'        return raw.then((v) => typeof v === "string" ? logResponse(request, pathname, ctx, new Response(v)) : logResponse(request, pathname, ctx, v instanceof Response ? v : typeof v === "object" && v !== null ? (v instanceof BuntokFile ? v.toResponse(request) : Response.json(v)) : toResponse(v))).catch((e) => { if (!ctx) ctx = new Context(request, EMPTY_PARAMS, di, clientIPResolver); return handleError(request, pathname, ctx, e); });\n';
					code += "      }\n";
					code +=
						'      if (typeof raw === "string") return logResponse(request, pathname, ctx, new Response(raw));\n';
					code +=
						"      if (raw instanceof Response) return logResponse(request, pathname, ctx, raw);\n" +
						'      if (typeof raw === "object" && raw !== null) return logResponse(request, pathname, ctx, raw instanceof BuntokFile ? raw.toResponse(request) : Response.json(raw));\n' +
						"      return logResponse(request, pathname, ctx, toResponse(raw));\n";
				}
				code += "    }\n";
			}
			code += "  }\n";
			code += "  break;\n";
			code += "}\n";
		}

		code += "  }\n  } catch(err) { if (!ctx) ctx = new Context(request, EMPTY_PARAMS, di, clientIPResolver); return handleError(request, pathname, ctx, err); }\n" + "  return fallback(request, server);\n" + "};\n";

		const factory = new Function(
			"Context",
			"EMPTY_PARAMS",
			"di",
			"handlers",
			"compiledGlobalPipeline",
			"logResponse",
			"handleError",
			"fallback",
			"wsRoutes",
			"clientIPResolver",
			"toResponse",
			"BuntokFile",
			"setPoweredBy",
			"applyCtxHeaders",
			code,
		);

		const EMPTY_PARAMS = Object.freeze({});
		return factory(
			Context,
			EMPTY_PARAMS,
			this.di,
			handlersList,
			this.compiledGlobalPipeline,
			this.logResponse,
			this.handleError,
			this.fallbackHandleRequest.bind(this),
			this.wsRoutes,
			this._clientIPResolver,
			toResponse,
			BuntokFile,
			this.setPoweredBy,
			this.applyCtxHeaders,
		);
	}

	private extractPathname(url: string): string {
		// Skip protocol + authority (http://localhost:1212)
		const start = url.indexOf("/", url.indexOf("//") + 2);
		if (start === -1) return "/";
		let end = url.indexOf("?", start);
		if (end === -1) end = url.length;
		return url.substring(start, end);
	}

	// Bound once per Buntok instance instead of allocating a new closure per request
	private readonly logResponse = (
		request: Request,
		pathname: string,
		ctx: Context<DI> | undefined,
		response: Response,
	): Response => {
		// Guard against undefined response from middleware chain
		if (!response) {
			return new Response("Internal Server Error", { status: 500 });
		}
		// Read requestId only when logging is on (avoids Headers.get per-request in prod)
		const requestId = logger.logRequests ? request.headers.get("x-request-id") : null;
		if (logger.logRequests) {
			const status = response.status;
			const logData = requestId ? { status, requestId } : { status };
			if (status >= 500) {
				logger.error(`${request.method} ${pathname}`, logData);
			} else if (status >= 400) {
				logger.warn(`${request.method} ${pathname}`, logData);
			} else {
				logger.info(`${request.method} ${pathname}`, logData);
			}
		}
		if (this.poweredByHeaderEnabled) {
			response.headers.set("X-Powered-By", "buntok");
		}
		if (requestId) response.headers.set("x-request-id", requestId);
		// ctx.set.headers applied last - user-set headers win over built-ins
		return this.applyCtxHeaders(ctx, response);
	};

	/**
	 * Merge `ctx.set.headers` (Elysia-style mutable response headers) into the
	 * final response. Called from every response exit point - success, error,
	 * not-found - with a cheap guard so routes that never touch `ctx.set`
	 * pay only a property check.
	 */
	private readonly applyCtxHeaders = (
		ctx: Context<DI> | undefined,
		response: Response,
	): Response => {
		const headers = ctx?._set?.headers;
		let result = response;
		if (headers) {
			for (const key in headers) {
				const value = headers[key];
				if (value === undefined || value === null) continue;
				if (key.toLowerCase() === "set-cookie" && Array.isArray(value)) {
					for (const cookie of value) {
						result.headers.append(key, cookie);
					}
					continue;
				}
				result.headers.set(key, String(value));
			}
		}
		if (ctx?._afterHooks) {
			for (const hook of ctx._afterHooks) {
				const out = hook(result);
				if (out) result = out;
			}
		}
		return result;
	};

	// Lightweight X-Powered-By setter for AOT skip-log path (no logging overhead)
	private readonly setPoweredBy = (
		ctx: Context<DI> | undefined,
		response: Response,
	): Response => {
		if (this.poweredByHeaderEnabled) {
			response.headers.set("X-Powered-By", "buntok");
		}
		return this.applyCtxHeaders(ctx, response);
	};

	/**
	 * Normalize flexible handler return (string | object | null etc.) to Response.
	 * Used by both AOT and fallback paths.
	 */
	private normalizeReturn(
		value: unknown,
		request?: Request,
	): Response | Promise<Response> {
		if (value instanceof Promise) {
			return value.then((v) =>
				typeof v === "string"
					? new Response(v)
					: v instanceof Response
						? v
						: toResponse(v, request),
			);
		}
		if (typeof value === "string") return new Response(value);
		return value instanceof Response ? value : toResponse(value, request);
	}

	/**
	 * Normalize handler return then pass through logResponse.
	 * Handles both sync and async flexible returns.
	 */
	private readonly logNormalized = (
		request: Request,
		pathname: string,
		value: unknown,
		ctx?: Context<DI> | null,
	): Response | Promise<Response> => {
		const normalized = this.normalizeReturn(value, request);
		if (normalized instanceof Promise) {
			return normalized.then((res) =>
				this.logResponse(request, pathname, ctx ?? undefined, res),
			);
		}
		return this.logResponse(request, pathname, ctx ?? undefined, normalized);
	};

	private readonly handleError = (
		request: Request,
		pathname: string,
		ctx: Context<DI>,
		err: unknown,
	): Response | Promise<Response> => {
		const errorObj = err instanceof Error ? err : new Error(String(err));
		logger.error(`${request.method} ${pathname}`, {
			error: errorObj.message,
		});
		const result = this.customErrorHandler(errorObj, ctx);
		// Normalize ErrorHandler flexible return as well
		const normalized = this.normalizeReturn(result, request);
		if (normalized instanceof Promise) {
			return normalized.then((response) => {
				if (this.corsConfig) {
					const requestOrigin =
						request.headers.get("Origin") || "*";
					applyCorsHeaders(response, requestOrigin, this.corsConfig);
				}
				if (this.poweredByHeaderEnabled) {
					response.headers.set("X-Powered-By", "buntok");
				}
				return this.applyCtxHeaders(ctx, response);
			});
		}
		if (this.corsConfig) {
			const requestOrigin = request.headers.get("Origin") || "*";
			applyCorsHeaders(normalized, requestOrigin, this.corsConfig);
		}
		if (this.poweredByHeaderEnabled) {
			normalized.headers.set("X-Powered-By", "buntok");
		}
		return this.applyCtxHeaders(ctx, normalized);
	};

	/**
	 * Dispatch a request through the app without binding to a real port.
	 * Meant for tests: `await app.request("/users/1")` is much faster than
	 * spinning up a server and making a real HTTP call.
	 *
	 * Accepts the same input as the global `fetch()` / `Request` constructor.
	 */
	public async request(
		input: string | Request | URL,
		init?: RequestInit,
	): Promise<Response> {
		const request =
			input instanceof Request && !init
				? input
				: new Request(
					typeof input === "string" && !/^https?:\/\//.test(input)
						? `http://localhost${input.startsWith("/") ? "" : "/"}${input}`
						: // biome-ignore lint/suspicious/noExplicitAny: Standard fetch input overriding
						(input as any),
					init,
				);
		return this._dispatch(request);
	}

	/**
	 * Standard fetch handler for serverless platforms (Vercel, Cloudflare Workers, etc.).
	 * Compiles AOT once, then dispatches straight to the router - no
	 * `request()` indirection (input normalization + `handleRequest`).
	 *
	 * Usage:
	 * ```ts
	 * const app = new Buntok();
	 * export default app;
	 * ```
	 */
	public fetch(request: Request): Response | Promise<Response> {
		return this._dispatch(request);
	}

	/**
	 * Recompile the AOT router (+ global pipeline if empty) and refresh the
	 * native static routes on the running server.
	 */
	private _recompileAOT(): void {
		if (!this.compiledGlobalPipeline) this.compileGlobalPipeline();
		this._compiledAOTRouter = this.compileAOTRouter();
		this._aotReady = true;
		if (this.server && this._serveOptions && this.isListening) {
			this._serveOptions.routes = this.collectNativeStaticRoutes() ?? {};
			this.server.reload({
				fetch: this._serveOptions.fetch,
				routes: this._serveOptions.routes,
				...(this._serveOptions.websocket
					? { websocket: this._serveOptions.websocket }
					: {}),
			});
		}
	}

	/**
	 * Invalidate the AOT after configuration changes (disable/enable logger|
	 * powered-by, setTrustedProxy, use()). When the server is already running,
	 * recompile + reload happen IMMEDIATELY - native static routes never touch
	 * fetch(), so lazy invalidation would never be triggered by a request.
	 * Without a server, marking is enough; the next dispatch/listen compiles.
	 *
	 * @param rebuildPipeline Force a recompile of the global pipeline
	 * (middlewares changed - `use()`).
	 */
	private _invalidateAOT(rebuildPipeline = false): void {
		if (rebuildPipeline) this.compiledGlobalPipeline = undefined;
		if (this.server && this._serveOptions && this.isListening) {
			this._recompileAOT();
		} else {
			this._aotReady = false;
		}
	}

	private _dispatch(
		request: Request,
		server?: Server<WSData<DI>>,
	): Response | Promise<Response> {
		if (!this.compiledGlobalPipeline) this.compileGlobalPipeline();
		// Lazy AOT - compile once; recompile when a codegen flag changes
		// (disable/enable logger|powered-by, setTrustedProxy, use()).
		if (!this._aotReady) this._recompileAOT();
		return this._compiledAOTRouter(request, server);
	}

	private _aotReady = false;
	// biome-ignore lint/suspicious/noExplicitAny: mirror opsi bag Bun.serve
	private _serveOptions: any;
	private _compiledAOTRouter: (
		request: Request,
		server?: Server<WSData<DI>>,
	) => Response | Promise<Response> = this.fallbackHandleRequest.bind(this);

	public handleRequest(
		request: Request,
		server?: Server<WSData<DI>>,
	): Response | Promise<Response> {
		return this._compiledAOTRouter(request, server);
	}

	public fallbackHandleRequest(
		request: Request,
		server?: Server<WSData<DI>>,
	): Response | Promise<Response> {
		const pathname = this.extractPathname(request.url);

		if (server && this.wsRoutes.size > 0) {
			const wsHandler = this.wsRoutes.get(pathname);
			if (wsHandler) {
				const ctx = new Context(request, {}, this.di, this._clientIPResolver) as Context<DI>;
				const data: WSData<DI> = { ctx, handler: wsHandler };
				const upgraded = server.upgrade(request, { data });
				if (upgraded) {
					return undefined as unknown as Response;
				}
				return new Response("Upgrade Required", {
					status: 426,
					headers: {
						Connection: "Upgrade",
						Upgrade: "websocket",
					},
				});
			}
		}

		const route = this.router.find(request.method, pathname);
		const routeParams = route.params;

		let finalHandler = route.handler as Handler<DI>;
		if (!finalHandler) {
			finalHandler = this.customNotFoundHandler;
		}

		// Sucrose: use cached analysis from compile time (includes ctx.json detection).
		// Global middleware must also get a full Context - mirrors the
		// hasGlobalMiddleware guard on the AOT codegen path.
		const cached = this._handlerFullContextCache.get(finalHandler);
		const needsFullContext =
			this.hasPipelineHooks || (cached ? cached.needsFullContext : true);
		const needsParams = cached ? cached.needsParams : false;
		const fullCtx = needsFullContext
			? new Context(request, routeParams, this.di, this._clientIPResolver)
			: null;
		const ctxArg = fullCtx ?? (needsParams ? { request, params: routeParams } : { request, params: routeParams });

		try {
			// biome-ignore lint/style/noNonNullAssertion: Guaranteed by compileGlobalPipeline
			const result = this.compiledGlobalPipeline!(ctxArg as Context<DI>, finalHandler);

			if (result instanceof Promise) {
				return result
					.then((value) => this.logNormalized(request, pathname, value, fullCtx))
					.catch((err) => {
						// Ensure full Context for error handler
						const errCtx = fullCtx ?? new Context(request, routeParams, this.di, this._clientIPResolver);
						return this.handleError(request, pathname, errCtx, err);
					});
			}
			return this.logNormalized(request, pathname, result, fullCtx);
		} catch (err) {
			const errCtx = fullCtx ?? new Context(request, routeParams, this.di, this._clientIPResolver);
			return this.handleError(request, pathname, errCtx, err);
		}
	}

	/**
	 * Promote static-value route handlers (Elysia style: `app.get('/', 'Hi')`)
	 * to native Bun.serve `routes` responses - Bun answers them without
	 * entering JS (no Context, no codegen, no per-request allocation).
	 * Returns undefined if any gate disqualifies the promotion (global
	 * middleware, request logging, dynamic/duplicate paths, etc.).
	 */
	private collectNativeStaticRoutes():
		| Record<string, Record<string, NativeRouteEntry>>
		| undefined {
		if (
			this.router.staticRoutes.size === 0 &&
			this.router.dynamicRoutes.size === 0
		) {
			return undefined;
		}
		// Global middleware / CORS must still run per request - run them in JS.
		if (this.hasPipelineHooks) return undefined;
		// Native responses bypass logResponse - don't silently drop request logs.
		if (logger.logRequests) return undefined;

		const methods = new Set(["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"]);
		const ready: Record<string, Record<string, NativeRouteEntry>> = Object.create(null);
		for (const [routeKey, value] of this._staticRouteValues) {
			const sep = routeKey.indexOf(":");
			const method = routeKey.slice(0, sep);
			const path = routeKey.slice(sep + 1);
			if (!methods.has(method)) continue;
			// Bun.serve rejects route paths without a leading `/` (boot crash).
			if (!path.startsWith("/")) continue;
			// Bun directory routes require a trailing `/*` splat - exempt them
			// from the splat skip below (the JS fallback handles `:`/`{` cases).
			const isDir = isDirRouteValue(value);
			if (isDir) {
				if (!path.endsWith("/*") || path.includes(":") || path.includes("{")) continue;
			} else if (path.includes("*") || path.includes("{")) {
				// Splat & `{}` patterns stay on fetch() - Bun's match semantics
				// for them can differ segment-for-segment from the FFI trie.
				// `:param` paths ARE promoted for constant values: the response
				// never reads the param, so raw-vs-decoded can't diverge.
				continue;
			}
			if (this.wsRoutes.has(path)) continue;
			// BunFile / directory values can't carry X-Powered-By - keep the JS
			// handler so the wire stays identical when the flag is enabled.
			if (this.poweredByHeaderEnabled && (isDir || value instanceof Blob)) continue;
			const response = this.materializeStatic(value);
			// Bake failed (e. status outside the Response range) → don't drop
			// the route: the JS path stays registered and handles the request.
			if (!response) continue;
			(ready[path] ??= Object.create(null))[method] = response;
		}
		// Param-dependent handlers: Bun matches `:segments` in C++, the closure
		// below runs the identical JS the fallback dispatch would run.
		for (const [path, methodMap] of this.router.dynamicRoutes) {
			if (!path.startsWith("/")) continue;
			// Splat/`{}` match semantics stay on fetch() (see above); ws paths
			// must reach the upgrade handshake in fetch().
			if (path.includes("*") || path.includes("{")) continue;
			if (this.wsRoutes.has(path)) continue;
			for (const [method, handler] of methodMap) {
				if (!methods.has(method)) continue;
				const key = `${method}:${path}`;
				// A constant value on this pattern (registered above) is cheaper
				// - zero JS. Also covers failed bakes: they stay on the JS path.
				if (this._staticRouteValues.has(key)) continue;
				(ready[path] ??= Object.create(null))[method] =
					this.makeNativeDynamicHandler(path, handler);
			}
		}
		// Static function handlers (e.g. `app.post("/json", async (c) => …)`):
		// Bun matches the exact path in C++ and the closure runs the same JS
		// the AOT codegen would run - minus the pathname parse and the
		// method/path switch. Constant values were handled by the first loop
		// (`_staticRouteValues` keys are skipped); `{}` patterns and splats
		// keep their fetch() semantics (see the static-value loop above).
		for (const [path, methodMap] of this.router.staticRoutes) {
			if (!path.startsWith("/")) continue;
			if (path.includes("*") || path.includes("{")) continue;
			if (this.wsRoutes.has(path)) continue;
			for (const [method, handler] of methodMap) {
				if (!methods.has(method)) continue;
				const key = `${method}:${path}`;
				// A constant value on this route (registered above) is cheaper -
				// zero JS. Also covers skipped bakes (BunFile + x-powered-by…).
				if (this._staticRouteValues.has(key)) continue;
				(ready[path] ??= Object.create(null))[method] =
					this.makeNativeStaticHandler(handler);
			}
		}
		return Object.keys(ready).length > 0 ? ready : undefined;
	}

	/**
	 * Build the native route handler for a `:param` path. The response tail is
	 * an inline mirror of `normalizeReturn` + `logResponse` with request
	 * logging off (a collect gate), so the wire is byte-identical to the JS
	 * fallback while skipping three call layers per request:
	 *
	 * - no `compiledGlobalPipeline` indirection (gates guarantee zero global
	 *   middleware → the pipeline is identity; `use()` recompiles + reloads,
	 *   which drops this route);
	 * - no pathname parsing on the success path - Bun already split the path
	 *   into `request.params`, and `decodeURIComponent` is the identity on
	 *   percent-free URLs, so raw === decoded there. URLs containing `%` take
	 *   the slow path (parse + split + raw capture - FFI-trie parity);
	 * - inline normalize+tail instead of `normalizeReturn` → `logResponse` →
	 *   `applyCtxHeaders` calls (same branches, same order, same output).
	 *
	 * Unmatched methods/paths fall through to `fetch()` → `_dispatch()`.
	 */
	private makeNativeDynamicHandler(
		path: string,
		// biome-ignore lint/suspicious/noExplicitAny: same shape the router stores
		handler: (...args: any[]) => any,
	): NativeDynamicHandler {
		// Precompute raw-capture segments for percent-encoded URLs
		// (`/u/:uid/p/:pid` → [{2,"uid"},{4,"pid"}]; split indices align with
		// pathname.split("/") because both include the leading "" element).
		const patternSegments = path.split("/");
		const paramSpec: Array<{ seg: number; name: string }> = [];
		for (let i = 0; i < patternSegments.length; i++) {
			const seg = patternSegments[i];
			if (seg && seg.length > 1 && seg.charCodeAt(0) === 58 /* ':' */) {
				paramSpec.push({ seg: i, name: seg.slice(1) });
			}
		}
		// Sucrose decision - mirrors the fallback (`_dispatch`) exactly: cache
		// keyed by the object the router stores (mw chain or raw handler).
		const cached = this._handlerFullContextCache.get(handler);
		const needsFullContext = cached ? cached.needsFullContext : true;
		const needsSetHeaders = cached ? cached.needsSetHeaders : true;
		// Baked like static values: flag toggles trigger _recompileAOT() →
		// collect() re-runs → this closure is rebuilt with the new flag.
		const xpb = this.poweredByHeaderEnabled;

		// Raw pathname (error path only - success never logs when the gate is
		// off, so it does not need `pathname`).
		const parsePathname = (request: Request): string => {
			const url = request.url;
			let start = url.indexOf("/", url.indexOf("//") + 2);
			if (start === -1) start = url.length;
			let end = url.indexOf("?", start);
			if (end === -1) end = url.length;
			return start === url.length ? "/" : url.substring(start, end);
		};

		const rawParams = (request: Request): Record<string, string> => {
			// Percent-free URLs: Bun's split == raw split (decode is identity).
			const url = request.url;
			if (!url.includes("%")) {
				// Bun attaches decoded params to the Request in route handlers.
				const bunParams = (request as Request & {
					params?: Record<string, string>;
				}).params;
				return bunParams ? { ...bunParams } : {};
			}
			// Percent-encoded: re-split the raw pathname - the FFI trie
			// captures without decoding (unlike Bun's req.params).
			const pathname = parsePathname(request);
			const parts = pathname.split("/");
			const params: Record<string, string> = {};
			for (let i = 0; i < paramSpec.length; i++) {
				const spec = paramSpec[i];
				if (spec) params[spec.name] = parts[spec.seg] ?? "";
			}
			return params;
		};

		// Inline mirror of normalizeReturn(v) + logResponse(...) with
		// logRequests=false: same string/Response/toResponse branches, then
		// X-Powered-By, then ctx.set.headers - nothing else runs with the
		// logging gate off (requestId reads and log lines are logRequests-only).
		const finish = (
			v: unknown,
			request: Request,
			fullCtx: Context<DI> | null,
		): Response => {
			const res =
				typeof v === "string"
					? new Response(v)
					: v instanceof Response
						? v
						: toResponse(v, request);
			if (xpb) res.headers.set("X-Powered-By", "buntok");
			// logResponse calls applyCtxHeaders(ctx ?? undefined) unconditionally;
			// with no full Context the guard is a property check → equivalent to
			// skipping it. Sucrose-proven no-ctx.set writers skip the merge
			// entirely - needsFullContext handlers may have set ctx.set.headers.
			if (needsSetHeaders && needsFullContext && fullCtx) {
				return this.applyCtxHeaders(fullCtx, res);
			}
			return res;
		};

		return (request: Request): Response | Promise<Response> => {
			const fullCtx = needsFullContext
				? new Context(request, rawParams(request), this.di, this._clientIPResolver)
				: null;
			const params = fullCtx ? fullCtx.params : rawParams(request);
			const ctxArg = fullCtx ?? { request, params };
			try {
				// No global middleware (collect gate) → pipeline is identity.
				const raw = handler(ctxArg);
				if (raw instanceof Promise) {
					return raw
						.then((v: unknown) => finish(v, request, fullCtx))
						.catch((err: unknown) => {
							const errCtx =
								fullCtx ??
								new Context(
									request,
									rawParams(request),
									this.di,
									this._clientIPResolver,
								);
							return this.handleError(request, parsePathname(request), errCtx, err);
						});
				}
				return finish(raw, request, fullCtx);
			} catch (err) {
				const errCtx =
					fullCtx ??
					new Context(
						request,
						rawParams(request),
						this.di,
						this._clientIPResolver,
					);
				return this.handleError(request, parsePathname(request), errCtx, err);
			}
		};
	}

	/**
	 * Build the native route handler for a static (parameter-free) path - the
	 * function-handler sibling of constant-value promotion. Same gates and
	 * the same response tail as `makeNativeDynamicHandler`, minus all param
	 * handling: the FFI trie yields `{}` params on static paths, so the
	 * closure shares one frozen empty object (AOT codegen parity - see
	 * `EMPTY_PARAMS` in `compileAOTRouter`).
	 *
	 * This is what keeps function routes like
	 * `app.post("/json", async (ctx) => ctx.json(await ctx.body()))` off the
	 * `fetch()` → `_dispatch()` path: Bun matches the exact path in C++ and
	 * the closure runs the same JS the AOT codegen would run - minus the
	 * pathname parse and the method/path switch.
	 *
	 * Unmatched methods fall through to `fetch()` → `_dispatch()`.
	 */
	private makeNativeStaticHandler(
		// biome-ignore lint/suspicious/noExplicitAny: same shape the router stores
		handler: (...args: any[]) => any,
	): NativeDynamicHandler {
		// Sucrose decision - same cache as the fallback/AOT paths (unknown or
		// middleware-chain handlers default to the conservative true).
		const cached = this._handlerFullContextCache.get(handler);
		const needsFullContext = cached ? cached.needsFullContext : true;
		const needsSetHeaders = cached ? cached.needsSetHeaders : true;
		// Baked like static values: flag toggles trigger _recompileAOT() →
		// collect() re-runs → this closure is rebuilt with the new flag.
		const xpb = this.poweredByHeaderEnabled;
		// Shared per closure - params are always `{}` on a static path;
		// frozen mirrors the AOT codegen's EMPTY_PARAMS.
		const EMPTY_PARAMS: Record<string, string> = Object.freeze({});

		// Raw pathname (error path only - the success path never needs it:
		// logging is off by the collect gate and static paths have no params).
		const parsePathname = (request: Request): string => {
			const url = request.url;
			let start = url.indexOf("/", url.indexOf("//") + 2);
			if (start === -1) start = url.length;
			let end = url.indexOf("?", start);
			if (end === -1) end = url.length;
			return start === url.length ? "/" : url.substring(start, end);
		};

		// Inline mirror of normalizeReturn(v) + logResponse(...) with
		// logRequests=false: same string/Response/toResponse branches, then
		// X-Powered-By, then (only when sucrose allows) ctx.set.headers.
		const finish = (
			v: unknown,
			request: Request,
			fullCtx: Context<DI> | null,
		): Response => {
			const res =
				typeof v === "string"
					? new Response(v)
					: v instanceof Response
						? v
						: toResponse(v, request);
			if (xpb) res.headers.set("X-Powered-By", "buntok");
			if (needsSetHeaders && fullCtx) {
				return this.applyCtxHeaders(fullCtx, res);
			}
			return res;
		};

		return (request: Request): Response | Promise<Response> => {
			const fullCtx = needsFullContext
				? new Context(request, EMPTY_PARAMS, this.di, this._clientIPResolver)
				: null;
			const ctxArg = fullCtx ?? { request, params: EMPTY_PARAMS };
			try {
				// No global middleware (collect gate) → pipeline is identity.
				const raw = handler(ctxArg);
				if (raw instanceof Promise) {
					return raw
						.then((v: unknown) => finish(v, request, fullCtx))
						.catch((err: unknown) => {
							const errCtx =
								fullCtx ??
								new Context(
									request,
									EMPTY_PARAMS,
									this.di,
									this._clientIPResolver,
								);
							return this.handleError(request, parsePathname(request), errCtx, err);
						});
				}
				return finish(raw, request, fullCtx);
			} catch (err) {
				const errCtx =
					fullCtx ??
					new Context(request, EMPTY_PARAMS, this.di, this._clientIPResolver);
				return this.handleError(request, parsePathname(request), errCtx, err);
			}
		};
	}

	/**
	 * Materialize a static value into a native route value - exactly mirroring
	 * the branches the original handler runs per request:
	 *
	 * - string handler       → ct `text/plain;charset=utf-8` (Elysia parity)
	 * - `ctx.text`           → 200 without explicit ct / non-200 `text/plain; charset=utf-8`
	 * - `ctx.html`           → `text/html` + status always
	 * - `ctx.json` / bare `{…}`/`[…]` → `Response.json(data[, { status }])`
	 * - bare `42` / `true`   → `text/plain; charset=utf-8` (toResponse parity)
	 * - bare `null`          → 204 No Content
	 * - `BunFile` / `{ dir }` → passed through untouched (opaque to X-Powered-By;
	 *   collect() skips them while the flag is enabled)
	 *
	 * Returns undefined if the bake fails → caller skips (the JS path handles
	 * it). X-Powered-By reads the `poweredByHeaderEnabled` flag (the only flag
	 * that can change after registration; always re-read at collect time).
	 */
	private materializeStatic(
		value: string | NativeRouteValue | ConstResponseOp,
	): NativeRouteValue | undefined {
		const xpb = this.poweredByHeaderEnabled;
		try {
			if (value instanceof Response) return value;
			// BunFile (opaque native value) - no per-response headers possible.
			if (value instanceof Blob) return value;
			if (isDirRouteValue(value)) return value;
			if (typeof value === "string") {
				return new Response(value, {
					headers: {
						"Content-Type": "text/plain;charset=utf-8",
						...(xpb ? { "X-Powered-By": "buntok" } : {}),
					},
				});
			}
			let response: Response;
			switch (value.kind) {
				case "string":
					response = new Response(value.body, {
						headers: {
							"Content-Type": "text/plain;charset=utf-8",
							...(xpb ? { "X-Powered-By": "buntok" } : {}),
						},
					});
					break;
				case "scalar":
					// mirrors toResponse (src/helpers/response.ts:18) - spaced charset
					response = new Response(value.body, {
						headers: {
							"Content-Type": "text/plain; charset=utf-8",
							...(xpb ? { "X-Powered-By": "buntok" } : {}),
						},
					});
					break;
				case "empty":
					// mirrors toResponse(null) → 204 without body/content-type
					response = new Response(null, { status: 204 });
					break;
				case "text":
					// mirrors Context.text (src/context.ts:301): 200 without explicit ct
					response = value.status === 200
						? new Response(value.body)
						: new Response(value.body, {
							status: value.status,
							headers: { "Content-Type": "text/plain; charset=utf-8" },
						});
					break;
				case "html":
					response = new Response(value.body, {
						status: value.status,
						headers: { "Content-Type": "text/html" },
					});
					break;
				case "json":
					response = value.status === 200
						? Response.json(value.data)
						: Response.json(value.data, { status: value.status });
					break;
			}
			if (xpb) response.headers.set("X-Powered-By", "buntok");
			return response;
		} catch {
			return undefined;
		}
	}

	public listen(port?: number, callback?: () => void): void {
		// Skip server startup when running under make:docs or when a CLI
		// command imports the entry point just to inspect it (debug:routes)
		if (process.env.BUNTOK_DOCS_BUILD === "1") return;
		if (process.env.BUNTOK_CLI_NO_LISTEN === "1") return;
		if (this.isListening) return;
		this.isListening = true;

		const startTime = performance.now();

		// Register API docs routes directly on router (bypasses openApiDocs)
		if (this._apiDocsConfig) {
			const isProduction = process.env.NODE_ENV === "production";
			if (!(this._apiDocsConfig.safeOnProduction && isProduction)) {
				this.registerApiDocsRoutes();
			}
		}

		// Perform AOT compilation for global middlewares
		this.compileGlobalPipeline();
		this._compiledAOTRouter = this.compileAOTRouter();
		this._aotReady = true;

		// Background generate swagger.json (non-blocking, only affects startup)
		if (this._apiDocsConfig) {
			const docsConfig = this._apiDocsConfig;
			const openApiDocs = this.openApiDocs;
			setImmediate(async () => {
				try {
					const { generateOpenApiDocument } = await import("./helpers/openapi");
					const doc = generateOpenApiDocument({
						openApiDocs,
						title: docsConfig.title,
						version: docsConfig.version,
						description: docsConfig.description,
					});
					if (doc) {
						this._swaggerDocument = doc;
						// Write to disk for backward compat (make:docs, external tools)
						const docsDir = join(process.cwd(), "public/docs");
						mkdirSync(docsDir, { recursive: true });
						writeFileSync(
							join(docsDir, "swagger.json"),
							JSON.stringify(doc, null, 2),
						);
					}
				} catch (err) {
					logger.error("Failed to generate swagger.json", {
						error: (err as Error).message,
					});
				}
			});
		}

		const finalPort = port || Number(process.env.PORT) || 1212;

		// biome-ignore lint/suspicious/noExplicitAny: Required for bun serve signature compatibility
		const serveOptions: any = {
			port: finalPort,
			// Stable trampoline: Bun.serve captures the fetch reference at start,
			// so dispatch reads the latest `_compiledAOTRouter` field per request
			// - recompiles (flag toggles, setTrustedProxy) still apply post-listen.
			fetch: (request: Request, server: Server<WSData<DI>>) =>
				this._dispatch(request, server),
		};

		if (this._reusePort) {
			serveOptions.reusePort = true;
		}

		if (this.wsRoutes.size > 0) {
			serveOptions.websocket = {
				// Bun-only native options - pluggable, zero-deps
				perMessageDeflate: this.wsOpts.perMessageDeflate ?? false,
				maxPayloadLength: this.wsOpts.maxPayloadLength ?? 16 * 1024 * 1024,
				idleTimeout: this.wsOpts.idleTimeout ?? 120,
				maxBackpressure: this.wsOpts.maxBackpressure,
				publishToSelf: this.wsOpts.publishToSelf ?? false,
				open: async (ws: ServerWebSocket<WSData<DI>>) => {
					try {
						if (ws.data.handler.authenticate) {
							const authData = await ws.data.handler.authenticate(ws);
							if (authData === null) {
								ws.close(4001, "Unauthorized");
								return;
							}
							(ws.data as unknown as Record<string, unknown>).auth = authData;
						}
						ws.data.handler.open?.(ws);
					} catch (err) {
						logger.error("WS open error", { error: (err as Error).message });
						try { ws.close(1011, "Internal error"); } catch { }
					}
				},
				message: (
					ws: ServerWebSocket<WSData<DI>>,
					message: string | Buffer,
				) => {
					try {
						ws.data.handler.message?.(ws, message);
					} catch (err) {
						logger.error("WS message error", { error: (err as Error).message });
					}
				},
				close: (
					ws: ServerWebSocket<WSData<DI>>,
					code: number,
					reason: string,
				) => {
					try { ws.data.handler.close?.(ws, code, reason); } catch (err) {
						logger.error("WS close error", { error: (err as Error).message });
					}
				},
				drain: (ws: ServerWebSocket<WSData<DI>>) => {
					try { ws.data.handler.drain?.(ws); } catch { }
				},
				pong: (ws: ServerWebSocket<WSData<DI>>) => {
					try {
						// heartbeat pong - reset alive (fix: pong is not a message)
						(ws.data.handler as unknown as { pong?: (ws: ServerWebSocket<WSData<DI>>) => void }).pong?.(ws);
						// also a fallback for wsHeartbeat attached on ws.data
						const hb = (ws.data as unknown as { heartbeat?: { alive: boolean } }).heartbeat;
						if (hb) hb.alive = true;
					} catch { }
				},
			} as unknown as Record<string, unknown>;
		}

		// Promote static-value handlers to native Bun.serve routes - computed
		// once here, recomputed on AOT recompile (see _dispatch).
		this._serveOptions = serveOptions;
		const nativeStaticRoutes = this.collectNativeStaticRoutes();
		if (nativeStaticRoutes) serveOptions.routes = nativeStaticRoutes;

		// Auto-increment port if already in use
		let currentPort = finalPort;
		const maxRetries = 10;
		for (let attempt = 0; attempt < maxRetries; attempt++) {
			try {
				serveOptions.port = currentPort;
				this.server = Bun.serve<WSData<DI>>(serveOptions);
				break;
			} catch (err: any) {
				if (err?.code === "EADDRINUSE" && attempt < maxRetries - 1) {
					const originalPort = currentPort;
					currentPort++;
					logger.warn(
						`⚠ Port ${originalPort} is already in use, using port ${currentPort} instead`,
					);
					continue;
				}
				throw err;
			}
		}

		// Setup graceful shutdown handlers
		this.setupGracefulShutdown();

		const startupTime = Math.round(performance.now() - startTime);
		const env = process.env.NODE_ENV || "development";
		// Startup banner mengikuti toggle logger - app.disable("logger")
		// membuat terminal sunyi total selama development.
		if (logger.enabled) {
			console.log(
				`\n  \x1b[36mBuntok v${VERSION}\x1b[0m ready in \x1b[32m${startupTime}ms\x1b[0m\n`,
			);
			console.log(`  Environment: \x1b[33m${env}\x1b[0m`);
			console.log(`  Listening on: \x1b[36mhttp://localhost:${currentPort}\x1b[0m`);
			if (this._apiDocsConfig) {
				const docsPath = (this._apiDocsConfig.path ?? "/docs").replace(/\/+$/, "");
				console.log(`  Docs:         \x1b[36mhttp://localhost:${currentPort}${docsPath}/\x1b[0m`);
			}
			console.log();
		}

		for (const hook of this.startHooks) {
			try {
				const out = hook();
				if (out instanceof Promise) {
					out.catch((error) =>
						logger.error("onStart hook failed", {
							error: (error as Error).message,
						}),
					);
				}
			} catch (error) {
				logger.error("onStart hook failed", {
					error: (error as Error).message,
				});
			}
		}

		if (callback) callback();
	}

	/** Stop accepting traffic and release resources owned by this app. */
	public close(options: { timeout?: number; force?: boolean } = {}): Promise<void> {
		if (this.shutdownPromise) return this.shutdownPromise;

		const timeout = options.timeout ?? this.shutdownTimeout;
		this.shutdownPromise = (async () => {
			this.removeSignalHandlers();
			if (!this.server) {
				this.isListening = false;
				await this.closeResources(timeout);
				return;
			}

			const server = this.server;
			this.server = undefined;
			this.isListening = false;
			let timeoutHandle: ReturnType<typeof setTimeout> | undefined;
			try {
				const stopped = await Promise.race([
					Promise.resolve(server.stop(false)).then(() => true),
					new Promise<boolean>((resolve) => {
						timeoutHandle = setTimeout(() => resolve(false), timeout);
					}),
				]);
				if (!stopped && options.force) server.stop(true);
			} finally {
				if (timeoutHandle) clearTimeout(timeoutHandle);
			}
			await this.closeResources(timeout);
		})().catch((error) => {
			this.shutdownPromise = undefined;
			throw error;
		});

		return this.shutdownPromise;
	}

	private async closeResources(timeout: number): Promise<void> {
		const deadline = Date.now() + timeout;
		for (const resource of this.resources) {
			const remaining = deadline - Date.now();
			if (remaining <= 0) break;
			await Promise.race([
				(resource.close ?? resource.dispose)?.(),
				new Promise<void>((resolve) => setTimeout(resolve, remaining)),
			]);
		}
		this.resources.clear();
		for (const dispose of this.pluginDisposers.values()) {
			const remaining = deadline - Date.now();
			if (remaining <= 0) break;
			await Promise.race([
				dispose(this),
				new Promise<void>((resolve) => setTimeout(resolve, remaining)),
			]);
		}
		this.pluginDisposers.clear();
		for (const hook of this.stopHooks) {
			try {
				await hook();
			} catch (error) {
				logger.error("onStop hook failed", {
					error: (error as Error).message,
				});
			}
		}
	}

	/** Alias for close(), kept for hosts that use shutdown terminology. */
	public shutdown(options: { timeout?: number; force?: boolean } = {}): Promise<void> {
		return this.close(options);
	}

	/**
	 * Setup graceful shutdown handlers for SIGTERM and SIGINT signals.
	 * When a signal is received, the server stops accepting new connections,
	 * waits for in-flight requests to complete, then exits cleanly.
	 */
	private setupGracefulShutdown(): void {
		if (!this.handleSignals || this.signalHandlers) return;

		const shutdown = async (signal: string) => {
			logger.info(`\n${signal} received. Starting graceful shutdown...`);
			await this.close();
			logger.info("Server shut down gracefully");
			process.exit(0);
		};

		const signals = ["SIGTERM", "SIGINT"] as const;
		this.signalHandlers = signals.map((signal) => {
			const handler = () => { shutdown(signal).catch(() => process.exit(1)); };
			process.on(signal, handler);
			return { signal, handler };
		});
	}

	private removeSignalHandlers(): void {
		for (const { signal, handler } of this.signalHandlers ?? []) {
			process.off(signal, handler);
		}
		this.signalHandlers = undefined;
	}
}

export class RouterGroup<
	DI extends Record<string, unknown> = Record<string, unknown>,
> {
	private prefix: string;
	private app: Buntok<DI>;
	private groupMiddlewares: Middleware<DI>[] = [];

	constructor(prefix: string, app: Buntok<DI>) {
		this.prefix = prefix.endsWith("/") ? prefix.slice(0, -1) : prefix;
		this.app = app;
	}

	public use(middleware: Middleware<DI>): this {
		this.groupMiddlewares.push(middleware);
		return this;
	}

	public group(prefix: string): RouterGroup<DI> {
		const newGroup = new RouterGroup<DI>(this.prefix + prefix, this.app);
		newGroup.groupMiddlewares = [...this.groupMiddlewares];
		return newGroup;
	}

	private normalizePath(path: string): string {
		const cleanPath = path === "/" ? "" : path;
		return `${this.prefix}${cleanPath}`;
	}

	public get<Path extends string>(path: Path, handler: Handler<DI, Path> | string | Response): this;
	public get<Path extends string>(
		path: Path,
		middleware: Middleware<DI, Path>,
		handler: Handler<DI, Path> | string | Response,
	): this;
	public get<Path extends string>(
		path: Path,
		m1: Middleware<DI, Path>,
		m2: Middleware<DI, Path>,
		handler: Handler<DI, Path> | string | Response,
	): this;
	public get<Path extends string>(
		path: Path,
		m1: Middleware<DI, Path>,
		m2: Middleware<DI, Path>,
		m3: Middleware<DI, Path>,
		handler: Handler<DI, Path> | string | Response,
	): this;
	public get<Path extends string>(
		path: Path,
		m1: Middleware<DI, Path>,
		m2: Middleware<DI, Path>,
		m3: Middleware<DI, Path>,
		m4: Middleware<DI, Path>,
		handler: Handler<DI, Path> | string | Response,
	): this;
	public get<Path extends string>(
		path: Path,
		m1: Middleware<DI, Path>,
		m2: Middleware<DI, Path>,
		m3: Middleware<DI, Path>,
		m4: Middleware<DI, Path>,
		m5: Middleware<DI, Path>,
		handler: Handler<DI, Path> | string | Response,
	): this;
	public get<Path extends string>(
		path: Path,
		...handlers: Array<Middleware<DI, Path> | Handler<DI, Path> | string | Response>
	): this {
		this.app.registerRoute("GET", this.normalizePath(path), [
			...this.groupMiddlewares,
			...handlers,
		], { source: "group", group: this.prefix });
		return this;
	}

	public post<Path extends string>(
		path: Path,
		handler: Handler<DI, Path> | string | Response,
	): this;
	public post<Path extends string>(
		path: Path,
		middleware: Middleware<DI, Path>,
		handler: Handler<DI, Path> | string | Response,
	): this;
	public post<Path extends string>(
		path: Path,
		m1: Middleware<DI, Path>,
		m2: Middleware<DI, Path>,
		handler: Handler<DI, Path> | string | Response,
	): this;
	public post<Path extends string>(
		path: Path,
		m1: Middleware<DI, Path>,
		m2: Middleware<DI, Path>,
		m3: Middleware<DI, Path>,
		handler: Handler<DI, Path> | string | Response,
	): this;
	public post<Path extends string>(
		path: Path,
		m1: Middleware<DI, Path>,
		m2: Middleware<DI, Path>,
		m3: Middleware<DI, Path>,
		m4: Middleware<DI, Path>,
		handler: Handler<DI, Path> | string | Response,
	): this;
	public post<Path extends string>(
		path: Path,
		m1: Middleware<DI, Path>,
		m2: Middleware<DI, Path>,
		m3: Middleware<DI, Path>,
		m4: Middleware<DI, Path>,
		m5: Middleware<DI, Path>,
		handler: Handler<DI, Path> | string | Response,
	): this;
	public post<Path extends string>(
		path: Path,
		...handlers: Array<Middleware<DI, Path> | Handler<DI, Path> | string | Response>
	): this {
		this.app.registerRoute("POST", this.normalizePath(path), [
			...this.groupMiddlewares,
			...handlers,
		], { source: "group", group: this.prefix });
		return this;
	}

	public put<Path extends string>(path: Path, handler: Handler<DI, Path> | string | Response): this;
	public put<Path extends string>(
		path: Path,
		middleware: Middleware<DI, Path>,
		handler: Handler<DI, Path> | string | Response,
	): this;
	public put<Path extends string>(
		path: Path,
		m1: Middleware<DI, Path>,
		m2: Middleware<DI, Path>,
		handler: Handler<DI, Path> | string | Response,
	): this;
	public put<Path extends string>(
		path: Path,
		m1: Middleware<DI, Path>,
		m2: Middleware<DI, Path>,
		m3: Middleware<DI, Path>,
		handler: Handler<DI, Path> | string | Response,
	): this;
	public put<Path extends string>(
		path: Path,
		m1: Middleware<DI, Path>,
		m2: Middleware<DI, Path>,
		m3: Middleware<DI, Path>,
		m4: Middleware<DI, Path>,
		handler: Handler<DI, Path> | string | Response,
	): this;
	public put<Path extends string>(
		path: Path,
		m1: Middleware<DI, Path>,
		m2: Middleware<DI, Path>,
		m3: Middleware<DI, Path>,
		m4: Middleware<DI, Path>,
		m5: Middleware<DI, Path>,
		handler: Handler<DI, Path> | string | Response,
	): this;
	public put<Path extends string>(
		path: Path,
		...handlers: Array<Middleware<DI, Path> | Handler<DI, Path> | string | Response>
	): this {
		this.app.registerRoute("PUT", this.normalizePath(path), [
			...this.groupMiddlewares,
			...handlers,
		], { source: "group", group: this.prefix });
		return this;
	}

	public delete<Path extends string>(
		path: Path,
		handler: Handler<DI, Path> | string | Response,
	): this;
	public delete<Path extends string>(
		path: Path,
		middleware: Middleware<DI, Path>,
		handler: Handler<DI, Path> | string | Response,
	): this;
	public delete<Path extends string>(
		path: Path,
		m1: Middleware<DI, Path>,
		m2: Middleware<DI, Path>,
		handler: Handler<DI, Path> | string | Response,
	): this;
	public delete<Path extends string>(
		path: Path,
		m1: Middleware<DI, Path>,
		m2: Middleware<DI, Path>,
		m3: Middleware<DI, Path>,
		handler: Handler<DI, Path> | string | Response,
	): this;
	public delete<Path extends string>(
		path: Path,
		m1: Middleware<DI, Path>,
		m2: Middleware<DI, Path>,
		m3: Middleware<DI, Path>,
		m4: Middleware<DI, Path>,
		handler: Handler<DI, Path> | string | Response,
	): this;
	public delete<Path extends string>(
		path: Path,
		m1: Middleware<DI, Path>,
		m2: Middleware<DI, Path>,
		m3: Middleware<DI, Path>,
		m4: Middleware<DI, Path>,
		m5: Middleware<DI, Path>,
		handler: Handler<DI, Path> | string | Response,
	): this;
	public delete<Path extends string>(
		path: Path,
		...handlers: Array<Middleware<DI, Path> | Handler<DI, Path> | string | Response>
	): this {
		this.app.registerRoute("DELETE", this.normalizePath(path), [
			...this.groupMiddlewares,
			...handlers,
		], { source: "group", group: this.prefix });
		return this;
	}

	// QUERY method - like GET but with body support
	public query(path: string, handler: Handler<DI>): this;
	public query(
		path: string,
		middleware: Middleware<DI>,
		handler: Handler<DI>,
	): this;
	public query(
		path: string,
		m1: Middleware<DI>,
		m2: Middleware<DI>,
		handler: Handler<DI>,
	): this;
	public query(
		path: string,
		m1: Middleware<DI>,
		m2: Middleware<DI>,
		m3: Middleware<DI>,
		handler: Handler<DI>,
	): this;
	public query(
		path: string,
		m1: Middleware<DI>,
		m2: Middleware<DI>,
		m3: Middleware<DI>,
		m4: Middleware<DI>,
		handler: Handler<DI>,
	): this;
	public query(
		path: string,
		m1: Middleware<DI>,
		m2: Middleware<DI>,
		m3: Middleware<DI>,
		m4: Middleware<DI>,
		m5: Middleware<DI>,
		handler: Handler<DI>,
	): this;
	public query(
		path: string,
		...handlers: Array<Middleware<DI> | Handler<DI>>
	): this {
		this.app.registerRoute("QUERY", this.normalizePath(path), [
			...this.groupMiddlewares,
			...handlers,
		], { source: "group", group: this.prefix });
		return this;
	}

	public options<Path extends string>(
		path: Path,
		handler: Handler<DI, Path> | string | Response,
	): this;
	public options<Path extends string>(
		path: Path,
		middleware: Middleware<DI, Path>,
		handler: Handler<DI, Path> | string | Response,
	): this;
	public options<Path extends string>(
		path: Path,
		m1: Middleware<DI, Path>,
		m2: Middleware<DI, Path>,
		handler: Handler<DI, Path> | string | Response,
	): this;
	public options<Path extends string>(
		path: Path,
		m1: Middleware<DI, Path>,
		m2: Middleware<DI, Path>,
		m3: Middleware<DI, Path>,
		handler: Handler<DI, Path> | string | Response,
	): this;
	public options<Path extends string>(
		path: Path,
		m1: Middleware<DI, Path>,
		m2: Middleware<DI, Path>,
		m3: Middleware<DI, Path>,
		m4: Middleware<DI, Path>,
		handler: Handler<DI, Path> | string | Response,
	): this;
	public options<Path extends string>(
		path: Path,
		m1: Middleware<DI, Path>,
		m2: Middleware<DI, Path>,
		m3: Middleware<DI, Path>,
		m4: Middleware<DI, Path>,
		m5: Middleware<DI, Path>,
		handler: Handler<DI, Path> | string | Response,
	): this;
	public options<Path extends string>(
		path: Path,
		...handlers: Array<Middleware<DI, Path> | Handler<DI, Path> | string | Response>
	): this {
		this.app.registerRoute("OPTIONS", this.normalizePath(path), [
			...this.groupMiddlewares,
			...handlers,
		], { source: "group", group: this.prefix });
		return this;
	}

	public patch<Path extends string>(
		path: Path,
		handler: Handler<DI, Path> | string | Response,
	): this;
	public patch<Path extends string>(
		path: Path,
		middleware: Middleware<DI, Path>,
		handler: Handler<DI, Path> | string | Response,
	): this;
	public patch<Path extends string>(
		path: Path,
		m1: Middleware<DI, Path>,
		m2: Middleware<DI, Path>,
		handler: Handler<DI, Path> | string | Response,
	): this;
	public patch<Path extends string>(
		path: Path,
		m1: Middleware<DI, Path>,
		m2: Middleware<DI, Path>,
		m3: Middleware<DI, Path>,
		handler: Handler<DI, Path> | string | Response,
	): this;
	public patch<Path extends string>(
		path: Path,
		m1: Middleware<DI, Path>,
		m2: Middleware<DI, Path>,
		m3: Middleware<DI, Path>,
		m4: Middleware<DI, Path>,
		handler: Handler<DI, Path> | string | Response,
	): this;
	public patch<Path extends string>(
		path: Path,
		m1: Middleware<DI, Path>,
		m2: Middleware<DI, Path>,
		m3: Middleware<DI, Path>,
		m4: Middleware<DI, Path>,
		m5: Middleware<DI, Path>,
		handler: Handler<DI, Path> | string | Response,
	): this;
	public patch<Path extends string>(
		path: Path,
		...handlers: Array<Middleware<DI, Path> | Handler<DI, Path> | string | Response>
	): this {
		this.app.registerRoute("PATCH", this.normalizePath(path), [
			...this.groupMiddlewares,
			...handlers,
		], { source: "group", group: this.prefix });
		return this;
	}

	public head<Path extends string>(
		path: Path,
		handler: Handler<DI, Path> | string | Response,
	): this;
	public head<Path extends string>(
		path: Path,
		middleware: Middleware<DI, Path>,
		handler: Handler<DI, Path> | string | Response,
	): this;
	public head<Path extends string>(
		path: Path,
		m1: Middleware<DI, Path>,
		m2: Middleware<DI, Path>,
		handler: Handler<DI, Path> | string | Response,
	): this;
	public head<Path extends string>(
		path: Path,
		m1: Middleware<DI, Path>,
		m2: Middleware<DI, Path>,
		m3: Middleware<DI, Path>,
		handler: Handler<DI, Path> | string | Response,
	): this;
	public head<Path extends string>(
		path: Path,
		m1: Middleware<DI, Path>,
		m2: Middleware<DI, Path>,
		m3: Middleware<DI, Path>,
		m4: Middleware<DI, Path>,
		handler: Handler<DI, Path> | string | Response,
	): this;
	public head<Path extends string>(
		path: Path,
		m1: Middleware<DI, Path>,
		m2: Middleware<DI, Path>,
		m3: Middleware<DI, Path>,
		m4: Middleware<DI, Path>,
		m5: Middleware<DI, Path>,
		handler: Handler<DI, Path> | string | Response,
	): this;
	public head<Path extends string>(
		path: Path,
		...handlers: Array<Middleware<DI, Path> | Handler<DI, Path> | string | Response>
	): this {
		this.app.registerRoute("HEAD", this.normalizePath(path), [
			...this.groupMiddlewares,
			...handlers,
		], { source: "group", group: this.prefix });
		return this;
	}

	/**
	 * Register a handler for all standard HTTP methods (GET, HEAD, POST, PUT, PATCH, DELETE, OPTIONS).
	 */
	public all<Path extends string>(path: Path, handler: Handler<DI, Path> | string | Response): this;
	public all<Path extends string>(
		path: Path,
		middleware: Middleware<DI, Path>,
		handler: Handler<DI, Path> | string | Response,
	): this;
	public all<Path extends string>(
		path: Path,
		m1: Middleware<DI, Path>,
		m2: Middleware<DI, Path>,
		handler: Handler<DI, Path> | string | Response,
	): this;
	public all<Path extends string>(
		path: Path,
		m1: Middleware<DI, Path>,
		m2: Middleware<DI, Path>,
		m3: Middleware<DI, Path>,
		handler: Handler<DI, Path> | string | Response,
	): this;
	public all<Path extends string>(
		path: Path,
		m1: Middleware<DI, Path>,
		m2: Middleware<DI, Path>,
		m3: Middleware<DI, Path>,
		m4: Middleware<DI, Path>,
		handler: Handler<DI, Path> | string | Response,
	): this;
	public all<Path extends string>(
		path: Path,
		m1: Middleware<DI, Path>,
		m2: Middleware<DI, Path>,
		m3: Middleware<DI, Path>,
		m4: Middleware<DI, Path>,
		m5: Middleware<DI, Path>,
		handler: Handler<DI, Path> | string | Response,
	): this;
	public all<Path extends string>(
		path: Path,
		...handlers: Array<Middleware<DI, Path> | Handler<DI, Path> | string | Response>
	): this {
		const methods = [
			"GET",
			"HEAD",
			"POST",
			"PUT",
			"PATCH",
			"DELETE",
			"OPTIONS",
		];
		for (const method of methods) {
			this.app.registerRoute(method, this.normalizePath(path), [
				...this.groupMiddlewares,
				...handlers,
			], { source: "group", group: this.prefix });
		}
		return this;
	}

	/**
	 * Register a WebSocket endpoint within this group.
	 * Path is prefixed with the group prefix.
	 */
	public ws(path: string, handler: WSHandler<DI>): this {
		this.app.ws(this.normalizePath(path), handler);
		return this;
	}

	/**
	 * Serve static files within this group.
	 * Route path is prefixed with the group prefix.
	 */
	public static(routePath: string, directory: string): this {
		this.app.static(this.normalizePath(routePath), directory);
		return this;
	}

	/**
	 * Register a decorator-based controller within this group.
	 * The controller's prefix is combined with the group prefix.
	 *
	 * @example
	 * const api = app.group("/api/v1");
	 * api.registerController(UserController);
	 * api.registerController([UserController, PostController]);
	 * // → routes registered as /api/v1/users, /api/v1/users/:id, etc.
	 */
	// biome-ignore lint/suspicious/noExplicitAny: Constructor args are unknowable
	public registerController<T extends object>(target: (new (...args: any[]) => T) | T): this;
	// biome-ignore lint/suspicious/noExplicitAny: Constructor args are unknowable
	public registerController<T extends object>(targets: Array<(new (...args: any[]) => T) | T>): this;
	// biome-ignore lint/suspicious/noExplicitAny: Constructor args are unknowable
	public registerController<T extends object>(
		target: (new (...args: any[]) => T) | T | Array<(new (...args: any[]) => T) | T>,
	): this {
		if (Array.isArray(target)) {
			for (const t of target) {
				this.registerController(t);
			}
			return this;
		}
		const isInstance =
			typeof target === "object" &&
			target !== null &&
			typeof target === "object";

		const ControllerClass = isInstance
			? // biome-ignore lint/suspicious/noExplicitAny: dynamic type narrowing
			(target as any).constructor
			: // biome-ignore lint/suspicious/noExplicitAny: dynamic type narrowing
			(target as new (
				...args: any[]
			) => T);

		const meta = getControllerMeta(ControllerClass);
		if (!meta) {
			throw new Error(
				`${ControllerClass.name} is not decorated with @Controller - did you forget to add it?`,
			);
		}

		let instance: T;

		if (isInstance) {
			instance = target as T;
		} else {
			const container = this.app.getContainer();
			if (container.has(ControllerClass)) {
				instance = container.resolve<T>(ControllerClass);
			} else {
				instance = new ControllerClass();
			}
		}

		const normalizedPrefix = meta.prefix.endsWith("/")
			? meta.prefix.slice(0, -1)
			: meta.prefix;

		for (const route of meta.routes) {
			const cleanPath = route.path === "/" ? "" : route.path;
			const fullPath =
				`${this.normalizePath(normalizedPrefix)}${cleanPath}` || "/";
			// biome-ignore lint/suspicious/noExplicitAny: dynamic method dispatch by decorated property key
			const originalMethod = (instance as any)[route.propertyKey];
			let handler = ((...args: any[]) => originalMethod.apply(instance, args)) as Handler<DI>;
			// Attach original for sucrose analysis (bound/closure wrappers hide toString)
			(handler as any)._sucroseTarget = originalMethod;
			// Apply @HttpCode/@SetHeader/@Redirect wrappers (same as Buntok.registerController)
			handler = applyRouteResponseDecorators(handler, route);

			this.app.registerRoute(route.method, fullPath, [
				...this.groupMiddlewares,
				...(route.middlewares as Middleware<DI>[]),
				handler,
			], { source: "controller", controller: ControllerClass.name, group: this.prefix });
		}

		return this;
	}
}
