import { defineConfig } from "tsup";

export default defineConfig({
	entry: [
		// Root barrels
		"src/core-exports.ts", // Slim root: @buntok/core
		"src/all.ts", // Full namespace: @buntok/core/all (backward compat)
		"src/index.ts", // Legacy alias (slim)
		"src/exports.ts", // Legacy alias (slim)

		// Core modules
		"src/app.ts",
		"src/auth.ts",
		"src/base-controller.ts",
		"src/base-service.ts",
		"src/cache.ts",
		"src/circuit-breaker.ts",
		"src/client.ts",
		"src/container.ts",
		"src/context.ts",
		"src/decorators.ts",
		"src/emitter.ts",
		"src/factory.ts",
		"src/logger.ts",
		"src/metrics.ts",
		"src/plugin.ts",
		"src/router.ts",
		"src/version.ts",
		"src/ai.ts",
		"src/ffi/index.ts",
		"src/aot/sucrose.ts",
		"src/helpers/index.ts",
		"src/middlewares/index.ts",

		// Heavy / feature modules (subpath-only)
		"src/queue.ts",
		"src/queue-drivers/index.ts",
		"src/schedule.ts",
		"src/sse.ts",
		"src/upload.ts",
		"src/mailer.ts",
		"src/template.ts",
		"src/oauth/index.ts",

		// Existing subpath modules
		"src/dev.ts",
		"src/middlewares/validator.ts",
		"src/payment/index.ts",
		"src/ws-helpers.ts",
		"src/plugins/opentelemetry.ts",
		"src/plugins/graphql/index.ts",
		"src/plugins/graphql/apollo.ts",
		"src/plugins/graphql/yoga.ts",

		// CLI (dev-only tooling)
		"src/cli/index.ts",
	],
	format: ["esm", "cjs"],
	dts: false,
	splitting: true,
	sourcemap: true,
	clean: true,
	target: "es2022",
	outDir: "dist",
	external: [
		/^bun:.*/,
		// Node.js builtins — Bun resolves these natively at runtime
		// (tsup with es2022 target would otherwise treat them as browser polyfills)
		/^(node:)?(fs|fs\/promises|path|crypto|os|child_process|readline|stream|http|https|net|tls|buffer|util|events|dns|zlib|assert|worker_threads|perf_hooks|tty|url)$/,
		// Peer deps — users install these
		"@apollo/server",
		"graphql",
		"graphql-yoga",
		"@opentelemetry/api",
		"@opentelemetry/sdk-node",
		"@opentelemetry/resources",
		"@opentelemetry/semantic-conventions",
		"@opentelemetry/sdk-trace-node",
		"@opentelemetry/exporter-trace-otlp-http",
		// Queue driver peer deps
		"ioredis",
		"bullmq",
		"amqplib",
		// Mailer peer deps
		"nodemailer",
		// Heavy deps — kept in `dependencies` (auto-installed) but EXTERNAL so
		// the consumer bundler tree-shakes & dedupes them. This keeps cold start
		// light: zod/croner/zod-to-openapi are only loaded when actually used.
		"zod",
		"croner",
		"@asteasolutions/zod-to-openapi",
	],
});