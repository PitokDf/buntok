import { join } from "node:path";
import { existsSync } from "node:fs";

export async function buildCommand() {
	const projectRoot = process.cwd();
	const entryPoint = join(projectRoot, "server.ts");
	const outDir = join(projectRoot, ".buntok");

	if (!existsSync(entryPoint)) {
		console.error("\x1b[31m❌ server.ts not found\x1b[0m");
		process.exitCode = 1;
		return;
	}

	// Read user's package.json to know their dependencies
	let userDeps: string[] = [];
	const pkgPath = join(projectRoot, "package.json");
	if (existsSync(pkgPath)) {
		const pkg = await Bun.file(pkgPath).json();
		userDeps = [
			...Object.keys(pkg.dependencies || {}),
			...Object.keys(pkg.devDependencies || {}),
		];
	}

	// BunTok peer deps (optional, user installs these)
	const peerDeps = [
		"@apollo/server",
		"graphql",
		"graphql-yoga",
		"@opentelemetry/api",
		"@opentelemetry/sdk-node",
		"@opentelemetry/resources",
		"@opentelemetry/semantic-conventions",
		"@opentelemetry/sdk-trace-node",
		"@opentelemetry/exporter-trace-otlp-http",
		"ioredis",
		"bullmq",
		"amqplib",
	];

	const external = [...new Set([...peerDeps, ...userDeps])];

	console.log("\x1b[36m🔨 Building project...\x1b[0m");

	const result = await Bun.build({
		entrypoints: [entryPoint],
		outdir: outDir,
		target: "bun",
		tsconfig: join(projectRoot, "tsconfig.json"),
		external,
	});

	if (!result.success) {
		console.error("\x1b[31m❌ Build failed:\x1b[0m");
		for (const log of result.logs) {
			console.error(log);
		}
		process.exitCode = 1;
		return;
	}

	console.log("\x1b[32m✅ Build successful → .buntok/server.js\x1b[0m");
	console.log("\x1b[90m  Deploy: copy .buntok/ + node_modules/ + package.json to server\x1b[0m");
}
