import type { Buntok } from "./buntok";

/**
 * Plugin interface for extending BunTok apps.
 *
 * Plugins are isolated, named extensions that can add middleware,
 * routes, context properties, or any other functionality.
 *
 * @example
 * ```ts
 * const myPlugin = createPlugin({
 *   name: 'my-plugin',
 *   install: (app) => {
 *     app.use(myMiddleware);
 *     app.get('/plugin-route', handler);
 *   }
 * });
 *
 * app.plugin(myPlugin);
 * ```
 */
export interface Plugin<DI extends Record<string, unknown> = Record<string, unknown>> {
	name: string;
	install: (app: Buntok<DI>) => void | Promise<void>;
	dispose?: (app: Buntok<DI>) => void | Promise<void>;
}

/**
 * Create a reusable plugin.
 */
export function createPlugin<DI extends Record<string, unknown> = Record<string, unknown>>(config: {
	name: string;
	install: (app: Buntok<DI>) => void | Promise<void>;
	dispose?: (app: Buntok<DI>) => void | Promise<void>;
}): Plugin<DI> {
	return {
		name: config.name,
		install: config.install,
		dispose: config.dispose,
	};
}
