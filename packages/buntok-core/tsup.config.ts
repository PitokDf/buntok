import { defineConfig } from "tsup";

export default defineConfig({
	entry: [
		// Core (minimal, fast cold start)
		"src/core-exports.ts",
		"src/exports.ts",
		"src/index.ts",
		// Subpath exports (optional, lazy-loaded)
		"src/helpers-exports.ts",
		"src/auth-exports.ts",
		"src/ai-exports.ts",
		"src/factory-exports.ts",
		"src/oauth-exports.ts",
		"src/cache-exports.ts",
		"src/emitter-exports.ts",
		"src/mailer-exports.ts",
		"src/template-exports.ts",
		"src/schedule-exports.ts",
		"src/metrics-exports.ts",
		"src/upload-exports.ts",
		"src/queue-exports.ts",
		"src/base-exports.ts",
		"src/middlewares-exports.ts",
		// Existing subpath exports
		"src/client.ts",
		"src/dev.ts",
		"src/plugins/opentelemetry.ts",
		"src/plugins/graphql/index.ts",
		"src/plugins/graphql/apollo.ts",
		"src/plugins/graphql/yoga.ts",
		"src/middlewares/validator.ts",
		"src/payment/index.ts",
		"src/ws-helpers.ts",
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
	],
	// Force bundle these deps into @buntok/core output
	// (they're in dependencies but tsup externalizes deps by default with splitting)
	noExternal: ["croner", "@asteasolutions/zod-to-openapi"],
});
