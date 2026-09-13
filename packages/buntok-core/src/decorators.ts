import type { Middleware } from "./app";
import type { Context } from "./context";

/**
 * Decorator-based controller routing, built on Stage 3 (TC39) decorators -
 * the same kind natively supported by Bun/TypeScript 5+ without setting
 * `experimentalDecorators`.
 *
 * This is a thin layer on top of the existing functional API: decorators
 * only run once at class-definition/bootstrap time, and end up calling the
 * exact same `app.registerRoute()` used by `app.get()`/`app.post()`. There
 * is zero per-request overhead - the router has no idea (and doesn't care)
 * whether a route came from a decorator or a direct `.get()` call.
 *
 * ```ts
 * @Controller("/users")
 * class UserController {
 *   @Get("/:id")
 *   getUser(ctx: Context) {
 *     return ctx.json({ id: ctx.params.id });
 *   }
 *
 *   @Post("/")
 *   @Use(zValidator("body", createUserSchema))
 *   createUser(ctx: Context) {
 *     const data = ctx.valid<{ name: string }>("body");
 *     return ctx.json(data, 201);
 *   }
 * }
 *
 * app.registerController(UserController);
 * ```
 */

export interface RouteMeta {
	method: string;
	path: string;
	propertyKey: string;
	middlewares: Middleware[];
	/** @HttpCode status override (e.g. 201) */
	statusCode?: number;
	/** @Header / @SetHeader entries */
	headers?: Array<[string, string]>;
	/** @Redirect target */
	redirect?: { url: string; statusCode: number };
	/** @Version value */
	version?: string | string[];
	/** Generic metadata via SetMetadata */
	metadata?: Map<string, unknown>;
}

export interface ControllerMeta {
	prefix: string;
	routes: RouteMeta[];
}

let pendingRoutes: RouteMeta[] = [];

// Generic metadata registry for SetMetadata / Roles / Version
const metadataRegistry = new WeakMap<Function, Map<string, Map<string, unknown>>>();
function getOrCreateMethodMetadata(
	target: Function,
	propertyKey: string,
): Map<string, unknown> {
	let classMap = metadataRegistry.get(target);
	if (!classMap) {
		classMap = new Map();
		metadataRegistry.set(target, classMap);
	}
	let methodMap = classMap.get(propertyKey);
	if (!methodMap) {
		methodMap = new Map();
		classMap.set(propertyKey, methodMap);
	}
	return methodMap;
}

// biome-ignore lint/complexity/noBannedTypes: Native Decorator API uses Function
const controllerRegistry = new WeakMap<Function, ControllerMeta>();

type MethodDecoratorFn = (
	// biome-ignore lint/suspicious/noExplicitAny: Required for TS method decorator contravariance
	originalMethod: (...args: any[]) => any,
	context: ClassMethodDecoratorContext,
) => void;

function createRouteDecorator(method: string) {
	return (path: string = ""): MethodDecoratorFn => {
		return (_originalMethod, context) => {
			if (context.kind !== "method") {
				throw new Error(`@${method} can only decorate methods`);
			}
			const propertyKey = String(context.name);
			const entry = pendingRoutes.find((r) => r.propertyKey === propertyKey);
			if (entry) {
				entry.method = method;
				entry.path = path;
			} else {
				pendingRoutes.push({
					method,
					path,
					propertyKey,
					middlewares: [],
				});
			}
		};
	};
}

export const Get = createRouteDecorator("GET");
export const Post = createRouteDecorator("POST");
export const Put = createRouteDecorator("PUT");
export const Patch = createRouteDecorator("PATCH");
export const Delete = createRouteDecorator("DELETE");
export const Options = createRouteDecorator("OPTIONS");
export const Head = createRouteDecorator("HEAD");
export const Query = createRouteDecorator("QUERY");

/**
 * Matches ALL HTTP methods. Useful for catch-all handlers or proxies.
 * Note: more specific method decorators (@Get, @Post, etc.) registered on the
 * same path will take precedence in the AOT-compiled router.
 */
export const All = createRouteDecorator("ALL");

/**
 * Attach middleware to a single decorated route. Stack multiple `@Use()`
 * calls to chain several - they run in the order listed, same as passing
 * multiple middleware args to `app.get(path, mw1, mw2, handler)`.
 */
// biome-ignore lint/suspicious/noExplicitAny: Flexible middleware signature for decorators
export function Use(
	middleware: (ctx: any, next: any) => any,
): MethodDecoratorFn {
	return (_originalMethod, context) => {
		if (context.kind !== "method") {
			throw new Error("@Use can only decorate methods");
		}
		const propertyKey = String(context.name);
		let entry = pendingRoutes.find((r) => r.propertyKey === propertyKey);
		if (!entry) {
			entry = { method: "", path: "", propertyKey, middlewares: [] };
			pendingRoutes.push(entry);
		}
		entry.middlewares.unshift(middleware as Middleware);
	};
}

export type GuardFn<DI = Record<string, unknown>> = (
	ctx: Context<DI>,
) => boolean | Promise<boolean>;

/**
 * Apply one or more guards to a controller method.
 * A guard is a function that returns a boolean. If it returns false,
 * the request is rejected with a 403 Forbidden.
 */
export function UseGuard<DI = Record<string, unknown>>(
	...guards: GuardFn<DI>[]
) {
	// biome-ignore lint/suspicious/noExplicitAny: Required for internal Context bypass
	return Use(async (ctx: any, next: any) => {
		for (const guard of guards) {
			const passed = await guard(ctx);
			if (!passed) {
				return ctx.error("Forbidden resource", 403);
			}
		}
		return next();
	});
}

/**
 * @deprecated Use `UseGuards` instead. Kept as alias to `UseGuard` for backward compatibility.
 */
export const UseGuards = UseGuard;

// ──────────────────────────────────────────────────────────────────────────────
// Fase 1 zero-cost Nest-style decorators - boot-time metadata, <1% AOT overhead
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Set arbitrary metadata on a handler (read via `getMetadata()` / Reflector).
 * Pure WeakMap write at decoration time - zero per-request cost.
 */
export function SetMetadata(key: string, value: unknown): MethodDecoratorFn {
	return (_originalMethod, context) => {
		if (context.kind !== "method") {
			throw new Error("@SetMetadata can only decorate methods");
		}
		const propertyKey = String(context.name);
		let entry = pendingRoutes.find((r) => r.propertyKey === propertyKey);
		if (!entry) {
			entry = { method: "", path: "", propertyKey, middlewares: [] };
			pendingRoutes.push(entry);
		}
		if (!entry.metadata) entry.metadata = new Map();
		entry.metadata.set(key, value);
		// Also store in global metadataRegistry for Reflector-style lookups
		// We need a class reference; store lazily and resolve via Controller prefix later
		// For now, also keep pending; final association done in @Controller
	};
}

/**
 * Mark route as public (skip auth). Equivalent to `SetMetadata("isPublic", true)` and checked by guards.
 */
export function Public(): MethodDecoratorFn {
	return SetMetadata("isPublic", true);
}

/**
 * Override HTTP status code for handler return (e.g. POST -> 201).
 * Stored as RouteMeta.statusCode and applied at registerRoute time via wrapper.
 */
export function HttpCode(statusCode: number): MethodDecoratorFn {
	return (_originalMethod, context) => {
		if (context.kind !== "method") {
			throw new Error("@HttpCode can only decorate methods");
		}
		const propertyKey = String(context.name);
		let entry = pendingRoutes.find((r) => r.propertyKey === propertyKey);
		if (!entry) {
			entry = { method: "", path: "", propertyKey, middlewares: [] };
			pendingRoutes.push(entry);
		}
		entry.statusCode = statusCode;
	};
}

/**
 * Set a static response header for the route (e.g. `@SetHeader("x-cache", "hit")`).
 * Multiple usages stack.
 */
export function SetHeader(name: string, value: string): MethodDecoratorFn {
	return (_originalMethod, context) => {
		if (context.kind !== "method") {
			throw new Error("@SetHeader can only decorate methods");
		}
		const propertyKey = String(context.name);
		let entry = pendingRoutes.find((r) => r.propertyKey === propertyKey);
		if (!entry) {
			entry = { method: "", path: "", propertyKey, middlewares: [] };
			pendingRoutes.push(entry);
		}
		if (!entry.headers) entry.headers = [];
		entry.headers.push([name, value]);
	};
}

/** @deprecated Use `SetHeader` instead. Alias kept for Nest compatibility. */
export const Header = SetHeader;

/**
 * Redirect to URL with status (default 302). Static redirect - handler not executed.
 * If handler returns `{url, statusCode}`, it overrides decorator value (Nest behavior).
 */
export function Redirect(url: string, statusCode = 302): MethodDecoratorFn {
	return (_originalMethod, context) => {
		if (context.kind !== "method") {
			throw new Error("@Redirect can only decorate methods");
		}
		const propertyKey = String(context.name);
		let entry = pendingRoutes.find((r) => r.propertyKey === propertyKey);
		if (!entry) {
			entry = { method: "", path: "", propertyKey, middlewares: [] };
			pendingRoutes.push(entry);
		}
		entry.redirect = { url, statusCode };
	};
}

/**
 * Set API version for route (prefix or metadata). Stored as string, applied as path prefix or metadata.
 */
export function Version(version: string | string[]): MethodDecoratorFn {
	return (_originalMethod, context) => {
		if (context.kind !== "method") {
			throw new Error("@Version can only decorate methods");
		}
		const propertyKey = String(context.name);
		let entry = pendingRoutes.find((r) => r.propertyKey === propertyKey);
		if (!entry) {
			entry = { method: "", path: "", propertyKey, middlewares: [] };
			pendingRoutes.push(entry);
		}
		entry.version = version;
	};
}

/**
 * Compose multiple decorators into one (Nest `applyDecorators` equivalent).
 * Zero-cost boot-time helper.
 */
export function applyDecorators(
	...decorators: Array<(target: any, context: any) => void>
): MethodDecoratorFn & ((target: Function, context: ClassDecoratorContext) => void) {
	return ((target: any, context: any) => {
		for (const dec of decorators) {
			(dec as any)(target, context);
		}
	}) as any;
}

/**
 * Retrieve metadata set via @SetMetadata (helper for guards/interceptors).
 */
export function getMetadata(
	target: Function,
	propertyKey: string,
	key: string,
): unknown {
	const classMap = metadataRegistry.get(target);
	if (!classMap) return undefined;
	const methodMap = classMap.get(propertyKey);
	if (!methodMap) return undefined;
	return methodMap.get(key);
}

/**
 * Marks a class as a controller and registers its accumulated `@Get`/
 * `@Post`/etc. routes under `prefix`. Must be the outermost (topmost)
 * decorator on the class so it runs after all method decorators have
 * populated the pending route list.
 */
export function Controller(prefix = "") {
	// biome-ignore lint/complexity/noBannedTypes: Native Decorator API uses Function
	return (target: Function, context: ClassDecoratorContext): void => {
		if (context.kind !== "class") {
			throw new Error("@Controller can only decorate classes");
		}
		const routes = pendingRoutes.filter((r) => r.method !== "");
		// Transfer metadata from pendingRoutes to global metadataRegistry
		for (const route of routes) {
			if (route.metadata) {
				let classMap = metadataRegistry.get(target);
				if (!classMap) {
					classMap = new Map();
					metadataRegistry.set(target, classMap);
				}
				classMap.set(route.propertyKey, route.metadata);
			}
		}
		pendingRoutes = [];
		controllerRegistry.set(target, { prefix, routes });
	};
}

/**
 * Reads the routes registered on a `@Controller`-decorated class. Used
 * internally by `App.registerController()`. Walks the prototype chain
 * to merge parent class routes with child class routes.
 */
export function getControllerMeta(
	// biome-ignore lint/complexity/noBannedTypes: Native Decorator API uses Function
	ControllerClass: Function,
): ControllerMeta | undefined {
	const meta = controllerRegistry.get(ControllerClass);

	// Walk prototype chain to get parent routes
	const parentProto = Object.getPrototypeOf(ControllerClass.prototype);
	const ParentClass = parentProto?.constructor;

	if (
		ParentClass &&
		ParentClass !== Function.prototype &&
		ParentClass !== Object
	) {
		const parentMeta = getControllerMeta(ParentClass);
		if (parentMeta) {
			// Merge: parent routes + child routes (child overrides parent on same propertyKey)
			const childRoutes = meta?.routes ?? [];
			const parentRoutes = parentMeta.routes;

			// Child routes override parent routes with same propertyKey
			const mergedRoutes = [...parentRoutes];
			for (const childRoute of childRoutes) {
				const existingIndex = mergedRoutes.findIndex(
					(r) => r.propertyKey === childRoute.propertyKey,
				);
				if (existingIndex >= 0) {
					mergedRoutes[existingIndex] = childRoute;
				} else {
					mergedRoutes.push(childRoute);
				}
			}

			return {
				prefix: meta?.prefix ?? parentMeta.prefix,
				routes: mergedRoutes,
			};
		}
	}

	return meta;
}


