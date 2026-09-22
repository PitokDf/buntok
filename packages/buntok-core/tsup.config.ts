import { defineConfig } from "tsup";

export default defineConfig({
	entry: {
		// Core (minimal, fast cold start)
		"core-exports": "src/core-exports.ts",
		"exports": "src/exports.ts",
		"index": "src/index.ts",
		// Subpath exports — output names match subpath (no -exports suffix)
		"helpers": "src/helpers-exports.ts",
		"auth": "src/auth-exports.ts",
		"ai": "src/ai-exports.ts",
		"factory": "src/factory-exports.ts",
		"oauth": "src/oauth-exports.ts",
		"cache": "src/cache-exports.ts",
		"emitter": "src/emitter-exports.ts",
		"mailer": "src/mailer-exports.ts",
		"template": "src/template-exports.ts",
		"schedule": "src/schedule-exports.ts",
		"metrics": "src/metrics-exports.ts",
		"upload": "src/upload-exports.ts",
		"queue": "src/queue-exports.ts",
		"base": "src/base-exports.ts",
		"middlewares": "src/middlewares-exports.ts",
		// Existing subpath exports
		"client": "src/client.ts",
		"dev": "src/dev.ts",
		"plugins/opentelemetry": "src/plugins/opentelemetry.ts",
		"plugins/graphql/index": "src/plugins/graphql/index.ts",
		"plugins/graphql/apollo": "src/plugins/graphql/apollo.ts",
		"plugins/graphql/yoga": "src/plugins/graphql/yoga.ts",
		"middlewares/validator": "src/middlewares/validator.ts",
		"payment/index": "src/payment/index.ts",
		"ws-helpers": "src/ws-helpers.ts",
		"cli/index": "src/cli/index.ts",
	},
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
