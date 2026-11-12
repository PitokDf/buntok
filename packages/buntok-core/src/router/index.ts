import { Trie as NativeTrie } from "../ffi";

export interface LookupResult {
	// biome-ignore lint/suspicious/noExplicitAny: generic router handler
	handler: ((...args: any[]) => any) | null;
	params: Record<string, string>;
}

const EMPTY_PARAMS: Record<string, string> = Object.freeze({});

// Ring buffer LRU cache for trie lookup results on dynamic routes.
// Avoids re-walking the trie for the same (method, pathname) pair -
// common in real apps where the same resource is hit repeatedly.
// Uses O(1) circular buffer instead of O(n) Array.shift().
const CACHE_MAX = 2048;

class LookupCache {
	private map = new Map<string, Map<string, LookupResult>>();
	private buffer: Array<{ method: string; path: string } | undefined> =
		new Array(CACHE_MAX);
	private head = 0;
	private tail = 0;
	private count = 0;

	get(method: string, path: string): LookupResult | undefined {
		const methodMap = this.map.get(method);
		if (!methodMap) return undefined;
		return methodMap.get(path);
	}

	set(method: string, path: string, val: LookupResult): void {
		let methodMap = this.map.get(method);
		if (!methodMap) {
			methodMap = new Map();
			this.map.set(method, methodMap);
		}

		if (methodMap.has(path)) {
			methodMap.set(path, val);
			return;
		}

		if (this.count >= CACHE_MAX) {
			// Evict the oldest entry (O(1) - no array re-indexing)
			const oldest = this.buffer[this.head];
			if (oldest) {
				const oldMethodMap = this.map.get(oldest.method);
				if (oldMethodMap) oldMethodMap.delete(oldest.path);
			}
			this.buffer[this.head] = undefined;
			this.head = (this.head + 1) % CACHE_MAX;
		} else {
			this.count++;
		}

		methodMap.set(path, val);
		this.buffer[this.tail] = { method, path };
		this.tail = (this.tail + 1) % CACHE_MAX;
	}
}

function splitSegments(path: string): string[] {
	const normalized =
		path.length > 1 && path.endsWith("/") ? path.replace(/\/+$/, "") : path;
	return normalized.split("/");
}

/** Extract ordered param names from a route path (e.g. `/orgs/:orgId/members` → `["orgId"]`). */
function extractParamNames(path: string): string[] {
	const names: string[] = [];
	for (const segment of splitSegments(path)) {
		if (segment.startsWith(":")) names.push(segment.slice(1));
		else if (segment.startsWith("*")) names.push(segment.slice(1) || "*");
	}
	return names;
}

/**
 * Cold-path matcher mirroring the trie: `:param` matches one segment and
 * `*name` matches the rest. Only used to build `Allow` headers.
 */
function matchesRoute(routePath: string, requestSegments: string[]): boolean {
	const routeSegments = splitSegments(routePath);
	for (let i = 0; i < routeSegments.length; i++) {
		const segment = routeSegments[i];
		if (segment === undefined) return false;
		if (segment[0] === "*") return true;
		if (i >= requestSegments.length) return false;
		if (segment[0] === ":" || segment === requestSegments[i]) continue;
		return false;
	}
	return routeSegments.length === requestSegments.length;
}

export class Router {
	// biome-ignore lint/suspicious/noExplicitAny: generic router handler
	public staticRoutes: Map<string, Map<string, (...args: any[]) => any>> =
		new Map();

	// Registry of dynamic (param/catchall) routes, mirroring staticRoutes:
	// path → method → handler. The native promotion pass iterates this to
	// build Bun.serve route values for `:param` paths.
	public dynamicRoutes: Map<string, Map<string, (...args: any[]) => any>> =
		new Map();

	// LRU cache for dynamic (param/catchall) route lookups
	private readonly lookupCache = new LookupCache();

	// Trie for dynamic route lookup
	private nativeTrie: NativeTrie;
	// biome-ignore lint/suspicious/noExplicitAny: generic router handler
	private handlerRegistry: Map<number, (...args: any[]) => any> = new Map();
	// route path per handlerId - used to restore correct param names when the
	// native trie reuses a param node across routes (e.g. /orgs/:id and
	// /orgs/:orgId/members share a node).
	private handlerPaths: Map<number, string> = new Map();
	private nextHandlerId = 0;

	constructor() {
		this.nativeTrie = new NativeTrie();
	}

	public insert(
		method: string,
		path: string,
		// biome-ignore lint/suspicious/noExplicitAny: generic router handler
		handler: (...args: any[]) => any,
	): void {
		if (path === "") return;

		const upperMethod = method.toUpperCase();
		const hasParams =
			path.includes(":") || path.includes("*");

		// Fast path: store static routes in flat map
		if (!hasParams) {
			let methodMap = this.staticRoutes.get(path);
			if (!methodMap) {
				methodMap = new Map();
				this.staticRoutes.set(path, methodMap);
			}
			methodMap.set(upperMethod, handler);
			return;
		}

		// Register in trie for dynamic routes
		const handlerId = this.nextHandlerId++;
		this.handlerRegistry.set(handlerId, handler);
		this.handlerPaths.set(handlerId, path);
		const compositeKey = `${upperMethod}:${path}`;
		this.nativeTrie.insert(compositeKey, handlerId);
		let dynMethodMap = this.dynamicRoutes.get(path);
		if (!dynMethodMap) {
			dynMethodMap = new Map();
			this.dynamicRoutes.set(path, dynMethodMap);
		}
		dynMethodMap.set(upperMethod, handler);
	}

	public find(method: string, path: string): LookupResult {
		// Normalize trailing slash for static-path lookup: `/ip/` → `/ip`
		// (root `/` is left untouched).
		const lookupPath =
			path.length > 1 && path.endsWith("/")
				? path.replace(/\/+$/, "")
				: path;

		const result = this.findOnce(method, lookupPath);
		// Standards-track behavior (Elysia/Hono/Express): a HEAD request is
		// answered by the GET route when no HEAD route is registered - Bun.serve
		// does the same for native route values, so the JS path mirrors it.
		if (result.handler === null && method === "HEAD") {
			return this.findOnce("GET", lookupPath);
		}
		return result;
	}

	/**
	 * All methods registered for a path, regardless of verb. Used to answer
	 * `405 Method Not Allowed` with an `Allow` header instead of a misleading
	 * `404`. Only called on route misses, so the dynamic-route scan is cold.
	 */
	public allowedMethods(path: string): string[] {
		const methods = new Set<string>();
		const staticMap = this.staticRoutes.get(path);
		if (staticMap) {
			for (const method of staticMap.keys()) methods.add(method);
		}

		if (this.dynamicRoutes.size > 0) {
			const requestSegments = splitSegments(path);
			for (const [routePath, methodMap] of this.dynamicRoutes) {
				if (matchesRoute(routePath, requestSegments)) {
					for (const method of methodMap.keys()) methods.add(method);
				}
			}
		}

		// HEAD is implicitly served by GET (see find()).
		if (methods.has("GET")) methods.add("HEAD");
		return [...methods].sort();
	}

	private findOnce(method: string, path: string): LookupResult {
		// Fast path: try flat static route cache first (O(1))
		const methodMap = this.staticRoutes.get(path);
		if (methodMap) {
			const handler = methodMap.get(method); // method is already uppercase
			if (handler) {
				return { handler, params: EMPTY_PARAMS };
			}
		}

		// LRU cache for dynamic routes - avoids re-walking the trie for
		// repeated (method, pathname) pairs (e.g. same user ID hit often)
		const cached = this.lookupCache.get(method, path);
		if (cached) return cached;

		// Trie lookup for dynamic routes
		const compositeKey = `${method}:${path}`;
		const nativeResult = this.nativeTrie.find(compositeKey);

		if (nativeResult.handlerId !== -1) {
			const handler = this.handlerRegistry.get(nativeResult.handlerId);
			if (handler) {
				let params = nativeResult.params;
				// The native trie may reuse a param node across routes, so the
				// param *names* it reports can belong to the first registered
				// route instead of this one. Restore names from this route's
				// path and zip with the captured values in segment order.
				const routePath = this.handlerPaths.get(nativeResult.handlerId);
				if (routePath) {
					const paramNames = extractParamNames(routePath);
					if (paramNames.length > 0) {
						const values = Object.values(params);
						params = Object.fromEntries(
							paramNames.map((name, i) => [
								name,
								values[i] ?? "",
							]),
						);
					}
				}
				const result: LookupResult = {
					handler,
					params,
				};
				this.lookupCache.set(method, path, result);
				return result;
			}
		}

		return { handler: null, params: EMPTY_PARAMS };
	}
}
