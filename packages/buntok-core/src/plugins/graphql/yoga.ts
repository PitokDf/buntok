import { createPlugin } from "../../plugin";
import type { Plugin } from "../../plugin";

export interface YogaPluginConfig {
	/** GraphQL type definitions (SDL string or DocumentNode) */
	typeDefs: string | unknown;
	/** GraphQL resolvers object */
	resolvers: Record<string, unknown>;
	/** Route path (default: "/graphql") */
	path?: string;
	/** Enable GraphiQL IDE (default: true in non-production) */
	graphiql?: boolean;
	/** Additional Yoga options */
	yogaOptions?: Record<string, unknown>;
}

/**
 * GraphQL Yoga plugin for BunTok.
 *
 * Wraps `graphql-yoga` which has native Web Standard `fetch` support -
 * zero adapter code needed.
 *
 * @requires `graphql-yoga` and `graphql` as peer dependencies.
 *
 * @example
 * ```ts
 * import { yogaPlugin } from "@buntok/core/plugins/graphql/yoga";
 *
 * app.plugin(yogaPlugin({
 *   typeDefs: `type Query { hello: String }`,
 *   resolvers: { Query: { hello: () => "Hello from Yoga!" } },
 * }));
 * ```
 */
export function yogaPlugin(config: YogaPluginConfig): Plugin {
	const path = config.path ?? "/graphql";

	return createPlugin({
		name: "@buntok/graphql-yoga",
		install: async (app) => {
			// Lazy import peer dependencies
			const { createYoga, createSchema } = await import("graphql-yoga");

			const yoga = createYoga({
				...config.yogaOptions,
				schema: createSchema({
					typeDefs: config.typeDefs as any,
					resolvers: config.resolvers as any,
				}),
				graphiql: config.graphiql ?? process.env.NODE_ENV !== "production",
				graphqlEndpoint: path,
			});

			// Yoga implements the standard fetch interface - delegate directly
			app.get(path, async (ctx) => {
				return yoga.fetch(ctx.request);
			});

			app.post(path, async (ctx) => {
				return yoga.fetch(ctx.request);
			});
		},
	});
}
