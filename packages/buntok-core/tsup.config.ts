import { defineConfig } from "tsup";

export default defineConfig({
	entry: [
		"src/core-exports.ts",
		"src/exports.ts",
		"src/index.ts",
		"src/cli/index.ts",
		"src/client.ts",
		"src/dev.ts",
		"src/plugin.ts",
		"src/plugins/opentelemetry.ts",
		"src/plugins/graphql/index.ts",
		"src/plugins/graphql/apollo.ts",
		"src/plugins/graphql/yoga.ts",
		"src/queue-drivers/index.ts",
		// Subpath exports for heavy modules (zod-dependent, lazy-loaded)
		"src/middlewares/validator.ts",
		"src/payment/index.ts",
		"src/ws-helpers.ts",
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
	],
	// Force bundle these deps into @buntok/core output
	// (they're in dependencies but tsup externalizes deps by default with splitting)
	noExternal: ["zod", "croner", "@asteasolutions/zod-to-openapi"],
});
