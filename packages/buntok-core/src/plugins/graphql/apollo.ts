import { createPlugin } from "../../plugin";
import type { Plugin } from "../../plugin";

export interface ApolloPluginConfig {
	/** GraphQL type definitions (SDL string or DocumentNode) */
	typeDefs: string | unknown;
	/** GraphQL resolvers object */
	resolvers: Record<string, unknown>;
	/** Route path (default: "/graphql") */
	path?: string;
	/** Enable GraphiQL playground in non-production (default: true) */
	enablePlayground?: boolean;
	/** Build GraphQL context from BunTok request */
	context?: (ctx: { request: Request; headers: Headers }) => Promise<unknown> | unknown;
}

/**
 * Apollo Server plugin for BunTok.
 *
 * Wraps `@apollo/server` and registers a single GraphQL route.
 *
 * @requires `@apollo/server` and `graphql` as peer dependencies.
 *
 * @example
 * ```ts
 * import { apolloPlugin } from "@buntok/core/plugins/graphql/apollo";
 *
 * app.plugin(apolloPlugin({
 *   typeDefs: `type Query { hello: String }`,
 *   resolvers: { Query: { hello: () => "Hello from Apollo!" } },
 * }));
 * ```
 */
export function apolloPlugin(config: ApolloPluginConfig): Plugin {
	const path = config.path ?? "/graphql";

	return createPlugin({
		name: "@buntok/graphql-apollo",
		install: async (app) => {
			// Lazy import peer dependencies
			const { ApolloServer } = await import("@apollo/server");
			const { startServer } = await import("@apollo/server/standalone");

			const server = new ApolloServer({
				typeDefs: config.typeDefs as any,
				resolvers: config.resolvers as any,
			});

			// Start Apollo without its own HTTP server
			const { url } = await startServer(server as any, { listen: { port: 0 } });
			// We don't need the standalone server - we'll use our own route
			// But startServer is required to initialize Apollo internally

			app.get(path, async (ctx) => {
				const accept = ctx.request.headers.get("accept") ?? "";

				// Serve GraphiQL playground in development
				if (
					config.enablePlayground !== false &&
					process.env.NODE_ENV !== "production" &&
					accept.includes("text/html")
				) {
					return ctx.html(`<!DOCTYPE html>
<html>
<head><title>GraphQL Playground</title></head>
<body>
<script src="https://unpkg.com/graphql-playground-react/build/static/js/middleware.js"></script>
<div id="root"></div>
<script>
GraphQLPlayground.init(document.getElementById('root'), { endpoint: '${path}' });
</script>
</body>
</html>`);
				}

				// Execute GraphQL query
				const urlObj = new URL(ctx.request.url);
				let body: { query?: string; variables?: Record<string, unknown>; operationName?: string } | undefined;
				if (ctx.request.method === "POST") {
					body = await ctx.request.json() as typeof body;
				}

				const operationName = urlObj.searchParams.get("operationName") ?? body?.operationName;
				const query = urlObj.searchParams.get("query") ?? body?.query;
				const variables = urlObj.searchParams.get("variables")
					? JSON.parse(urlObj.searchParams.get("variables")!)
					: body?.variables;

				if (!query) {
					return ctx.json({ errors: [{ message: "No query provided" }] }, 400);
				}

				const gqlContext = config.context
					? await config.context({ request: ctx.request, headers: ctx.request.headers })
					: {};

				const response = await (server as any).executeHTTPGraphQLRequest({
					httpGraphQLRequest: {
						method: ctx.request.method,
						headers: new Map(ctx.request.headers.entries()),
						body,
						search: urlObj.search,
					},
					context: () => gqlContext,
				});

				const headers: Record<string, string> = {};
				if (response.headers) {
					for (const [key, value] of response.headers) {
						headers[key] = value;
					}
				}

				if (response.body?.kind === "complete") {
					return new Response(response.body.string, {
						status: response.status ?? 200,
						headers: { "Content-Type": "application/json", ...headers },
					});
				}

				// Streaming response
				const stream = new ReadableStream({
					async start(controller) {
						if (response.body?.asyncIterator) {
							for await (const chunk of response.body.asyncIterator) {
								controller.enqueue(new TextEncoder().encode(chunk));
							}
						}
						controller.close();
					},
				});

				return new Response(stream, {
					status: response.status ?? 200,
					headers: { "Content-Type": "application/json", ...headers },
				});
			});

			app.post(path, async (ctx) => {
				const body = await ctx.request.json();
				const headers = new Map<string, string>();
				ctx.request.headers.forEach((v, k) => headers.set(k, v));

				const gqlContext = config.context
					? await config.context({ request: ctx.request, headers: ctx.request.headers })
					: {};

				const response = await (server as any).executeHTTPGraphQLRequest({
					httpGraphQLRequest: {
						method: "POST",
						headers,
						body,
						search: "",
					},
					context: () => gqlContext,
				});

				const respHeaders: Record<string, string> = {};
				if (response.headers) {
					for (const [key, value] of response.headers) {
						respHeaders[key] = value;
					}
				}

				if (response.body?.kind === "complete") {
					return new Response(response.body.string, {
						status: response.status ?? 200,
						headers: { "Content-Type": "application/json", ...respHeaders },
					});
				}

				const stream = new ReadableStream({
					async start(controller) {
						if (response.body?.asyncIterator) {
							for await (const chunk of response.body.asyncIterator) {
								controller.enqueue(new TextEncoder().encode(chunk));
							}
						}
						controller.close();
					},
				});

				return new Response(stream, {
					status: response.status ?? 200,
					headers: { "Content-Type": "application/json", ...respHeaders },
				});
			});
		},
	});
}
