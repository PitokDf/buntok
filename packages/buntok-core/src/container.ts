export type Scope = "singleton" | "transient";

// biome-ignore lint/suspicious/noExplicitAny: Constructor args are unknowable
export type Token = string | (new (...args: any[]) => unknown);

// biome-ignore lint/suspicious/noExplicitAny: Generic provider defaults require any
export interface ClassProvider<T = any> {
	useClass: new (
		// biome-ignore lint/suspicious/noExplicitAny: Constructor args are unknowable
		...args: any[]
	) => T;
	scope?: Scope;
}

// biome-ignore lint/suspicious/noExplicitAny: Generic provider defaults require any
export interface ValueProvider<T = any> {
	useValue: T;
}

// biome-ignore lint/suspicious/noExplicitAny: Generic provider defaults require any
export interface FactoryProvider<T = any> {
	useFactory: (container: Container) => T;
	scope?: Scope;
}

// biome-ignore lint/suspicious/noExplicitAny: Generic provider defaults require any
export type Provider<T = any> =
	| ClassProvider<T>
	| ValueProvider<T>
	| FactoryProvider<T>;

// ── Dependency declaration registry (used by @Dependencies) ────────
// biome-ignore lint/complexity/noBannedTypes: Registry keys are decorator targets
const dependenciesRegistry = new Map<Function, Token[]>();

/**
 * Declares constructor dependencies for a class. Used with `container.scan()`
 * to auto-resolve dependencies without needing `emitDecoratorMetadata`.
 *
 * @example
 * ```ts
 * import { Dependencies, Controller } from "@buntok/core";
 *
 * @Dependencies(UserService, Logger)
 * @Controller("/users")
 * class UserController {
 *   constructor(private service: UserService, private logger: Logger) {}
 * }
 * ```
 */
export function Dependencies(
	...tokens: Token[]
	// biome-ignore lint/complexity/noBannedTypes: TC39 decorator signature
): (target: Function, context: ClassDecoratorContext) => void {
	return (target: Function, context: ClassDecoratorContext) => {
		if (context.kind !== "class") {
			throw new Error("@Dependencies can only decorate classes");
		}
		for (const token of tokens) {
			if (typeof token !== "string" && typeof token !== "function") {
				throw new TypeError(
					`@Dependencies() expects class constructors or string tokens, got ${typeof token}`,
				);
			}
		}
		dependenciesRegistry.set(target, tokens);
	};
}

/**
 * Returns the dependency tokens declared via `@Dependencies()`.
 */
export function getDependencies(cls: Function): Token[] {
	return dependenciesRegistry.get(cls) ?? [];
}

// ────────────────────────────────────────────────────────────────────

function isClassProvider(p: Provider): p is ClassProvider {
	return "useClass" in p;
}

function isValueProvider(p: Provider): p is ValueProvider {
	return "useValue" in p;
}

function isFactoryProvider(p: Provider): p is FactoryProvider {
	return "useFactory" in p;
}

export class Container {
	// biome-ignore lint/suspicious/noExplicitAny: Internal provider storage
	private providers = new Map<Token, Provider<any>>();
	// biome-ignore lint/suspicious/noExplicitAny: Cached singleton instances
	private singletons = new Map<Token, any>();
	private resolving = new Set<Token>();

	/**
	 * Register a provider for a given token (class or string key).
	 */
	register<T>(token: Token, provider: Provider<T>): this {
		if (isValueProvider(provider) && provider.useValue === undefined) {
			const name = typeof token === "function" ? token.name : String(token);
			throw new TypeError(
				`Invalid provider for "${name}": useValue is undefined. ` +
					"Did you pass the wrong variable? Use a factory provider for lazy values.",
			);
		}
		this.providers.set(token, provider);
		return this;
	}

	/**
	 * Auto-register a class provider by its own constructor as the token.
	 */
	registerClass<T>(
		cls: new (
			// biome-ignore lint/suspicious/noExplicitAny: Constructor args are unknowable
			...args: any[]
		) => T,
		scope: Scope = "singleton",
	): this {
		this.providers.set(cls, { useClass: cls, scope });
		return this;
	}

	/**
	 * Resolve a dependency by token. Returns cached instance for singletons.
	 */
	resolve<T>(token: Token): T {
		const cached = this.singletons.get(token);
		if (cached !== undefined) return cached as T;

		if (this.resolving.has(token)) {
			const name = typeof token === "function" ? token.name : String(token);
			const chain = [...this.resolving].map((t) =>
				typeof t === "function" ? t.name : String(t),
			);
			throw new Error(
				`Circular dependency detected: ${name}\n` +
					`  Resolution chain: ${chain.join(" -> ")} -> ${name}\n` +
					`  Hint: Use FactoryProvider to break the cycle.`,
			);
		}

		const provider = this.providers.get(token);
		if (!provider) {
			const name = typeof token === "function" ? token.name : String(token);
			throw new Error(
				`No provider registered for: ${name}\n` +
					`  Hint: Register it with container.registerClass(${name}) or container.register("${name}", { useClass: ${name} })`,
			);
		}

		this.resolving.add(token);
		// biome-ignore lint/suspicious/noExplicitAny: Dynamic instantiation
		let instance: any;
		let scope: Scope = "singleton";

		try {
			if (isClassProvider(provider)) {
				scope = provider.scope ?? "singleton";
				instance = new provider.useClass();
			} else if (isValueProvider(provider)) {
				scope = "singleton";
				instance = provider.useValue;
			} else if (isFactoryProvider(provider)) {
				scope = provider.scope ?? "singleton";
				instance = provider.useFactory(this);
			}
		} finally {
			// Always clear the in-flight marker, otherwise a throwing factory
			// leaves the container permanently convinced there is a cycle.
			this.resolving.delete(token);
		}

		if (scope !== "transient") {
			this.singletons.set(token, instance);
		}

		return instance as T;
	}

	/**
	 * Resolve and return an instance, or undefined if not registered.
	 */
	get<T>(token: Token): T | undefined {
		if (this.singletons.has(token)) return this.singletons.get(token) as T;
		if (this.providers.has(token)) return this.resolve(token);
		return undefined;
	}

	/**
	 * Check whether a token has been registered.
	 */
	has(token: Token): boolean {
		return this.providers.has(token);
	}

	/**
	 * Check whether a token has been resolved and cached.
	 */
	hasResolved(token: Token): boolean {
		return this.singletons.has(token);
	}

	/**
	 * Auto-scan classes and register them with dependency resolution.
	 *
	 * Reads dependencies declared via `@Dependencies()` decorator
	 * (from `@buntok/core` decorators).
	 *
	 * @example
	 * ```ts
	 * import { Dependencies, Controller, Get } from "@buntok/core";
	 *
	 * @Dependencies(UserService)
	 * @Controller("/users")
	 * class UserController {
	 *   constructor(private service: UserService) {}
	 * }
	 *
	 * const container = new Container();
	 * container.scan([UserController]);
	 * app.setContainer(container);
	 * ```
	 */
	scan(
		classes: (new (...args: any[]) => any)[],
		scope: Scope = "singleton",
	): this {
		const visited = new Set<Token>();
		// biome-ignore lint/suspicious/noExplicitAny: Dynamic metadata introspection
		const self = this;

		// biome-ignore lint/suspicious/noExplicitAny: Dynamic metadata introspection
		function introspect(cls: any): void {
			if (visited.has(cls)) return;
			visited.add(cls);

			// Read dependency tokens from @Dependencies() decorator
			const depTokens: Token[] = getDependencies(cls);

			// Register dependencies first (bottom-up)
			for (const dep of depTokens) {
				if (dep && typeof dep === "function") {
					introspect(dep);
				}
			}

			// Register this class (skip if already registered manually).
			// Never guess: a class with constructor parameters but no
			// @Dependencies() is left unregistered so `resolve()` throws a
			// clear "No provider registered for: X" instead of a confusing
			// runtime `undefined is not a function`.
			if (!self.has(cls) && (depTokens.length > 0 || cls.length === 0)) {
				self.register(cls, {
					useFactory: (c) => {
						const args = depTokens.map((dep) => c.resolve(dep));
						return new cls(...args);
					},
					scope,
				});
			}
		}

		for (const cls of classes) {
			introspect(cls);
		}

		return this;
	}

	/**
	 * Force-clear all providers and cached instances.
	 * Useful in tests.
	 */
	clear(): void {
		this.providers.clear();
		this.singletons.clear();
		this.resolving.clear();
	}
}
