import { createPlugin } from "../plugin";
import type { Plugin } from "../plugin";
import type { Middleware } from "../buntok";

export interface OtelPluginConfig {
	/** Service name for trace identification */
	serviceName: string;
	/** Service version */
	serviceVersion?: string;
	/** Exporter type (default: "console") */
	exporter?: "console" | "otlp";
	/** OTLP endpoint URL (required when exporter is "otlp") */
	otlpEndpoint?: string;
	/** Sampling strategy (default: "alwaysOn") */
	sampler?: "alwaysOn" | "alwaysOff" | "traceIdRatioBased";
	/** Sample rate when using traceIdRatioBased (0-1, default: 1) */
	sampleRate?: number;
}

/**
 * OpenTelemetry plugin for BunTok.
 *
 * Sets up distributed tracing with per-request spans following
 * HTTP semantic conventions.
 *
 * Dependencies are lazily imported - no startup cost if the plugin is not used.
 *
 * @requires `@opentelemetry/api` as a dependency.
 *
 * @example
 * ```ts
 * import { otelPlugin } from "@buntok/core/plugins/opentelemetry";
 *
 * app.plugin(otelPlugin({
 *   serviceName: 'my-api',
 *   exporter: 'console',
 * }));
 * ```
 */
export function otelPlugin(config: OtelPluginConfig): Plugin {
	let shutdownSdk: (() => Promise<void>) | undefined;
	return createPlugin({
		name: "@buntok/opentelemetry",
		install: async (app) => {
			// Lazy import OTel dependencies
			const otelApi = await import("@opentelemetry/api");
			const { NodeSDK } = await import("@opentelemetry/sdk-node");
			const { resourceFromAttributes } = await import("@opentelemetry/resources");
			const { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } = await import(
				"@opentelemetry/semantic-conventions"
			);

			// Build resource attributes
			const attributes: Record<string, string> = {
				[ATTR_SERVICE_NAME]: config.serviceName,
			};
			if (config.serviceVersion) {
				attributes[ATTR_SERVICE_VERSION] = config.serviceVersion;
			}

			// Configure sampler
			let sampler;
			if (config.sampler === "alwaysOff") {
				sampler = { shouldSample: () => ({ decision: 0 }) } as any;
			} else if (config.sampler === "traceIdRatioBased") {
				const ratio = config.sampleRate ?? 1;
				sampler = {
					shouldSample: () => ({
						decision: Math.random() < ratio ? 1 : 0,
					}),
				} as any;
			}

			// Configure exporter
			let traceExporter;
			if (config.exporter === "otlp") {
				const { OTLPTraceExporter } = await import(
					"@opentelemetry/exporter-trace-otlp-http"
				);
				traceExporter = new OTLPTraceExporter({
					url: config.otlpEndpoint
						? `${config.otlpEndpoint}/v1/traces`
						: "http://localhost:4318/v1/traces",
				});
			} else {
				const { ConsoleSpanExporter } = await import("@opentelemetry/sdk-trace-node");
				traceExporter = new ConsoleSpanExporter();
			}

			// Initialize SDK
			const sdk = new NodeSDK({
				resource: resourceFromAttributes(attributes),
				traceExporter,
				sampler,
				instrumentations: [],
			});

			sdk.start();

			// Graceful shutdown
			const shutdown = async () => {
				try {
					await sdk.shutdown();
				} catch {
					// ignore
				}
			};
			shutdownSdk = shutdown;

			// Create tracer for per-request spans
			const tracer = otelApi.trace.getTracer(config.serviceName, config.serviceVersion ?? "0.0.0");

			// Register middleware that creates per-request spans
			const otelMiddleware: Middleware = async (ctx, next) => {
				const span = tracer.startSpan(
					`${ctx.request.method} ${new URL(ctx.request.url).pathname}`,
					{
						kind: otelApi.SpanKind.SERVER,
						attributes: {
							"http.request.method": ctx.request.method,
							"url.full": ctx.request.url,
							"url.path": new URL(ctx.request.url).pathname,
							"http.route": new URL(ctx.request.url).pathname,
						},
					},
				);

				const spanContext = otelApi.trace.setSpan(otelApi.context.active(), span);

				try {
					const result = await otelApi.context.with(spanContext, async () => {
						return next();
					});

					if (result instanceof Response) {
						span.setAttribute("http.response.status_code", result.status);
						if (result.status >= 400) {
							span.setStatus({
								code: otelApi.SpanStatusCode.ERROR,
								message: `HTTP ${result.status}`,
							});
						} else {
							span.setStatus({ code: otelApi.SpanStatusCode.OK });
						}
					}

					return result;
				} catch (err) {
					span.recordException(err as Error);
					span.setStatus({
						code: otelApi.SpanStatusCode.ERROR,
						message: (err as Error).message,
					});
					throw err;
				} finally {
					span.end();
				}
			};

			app.use(otelMiddleware);
		},
		dispose: async () => {
			await shutdownSdk?.();
			shutdownSdk = undefined;
		},
	});
}
