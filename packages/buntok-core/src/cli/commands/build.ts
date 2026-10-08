import { join, dirname, isAbsolute, relative } from "node:path";
import { existsSync } from "node:fs";
import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";

const readJson = async (path: string) => JSON.parse(await readFile(path, "utf8"));

const findPackageRoot = (startFile: string): string | null => {
	let dir = dirname(startFile);
	for (;;) {
		if (existsSync(join(dir, "package.json"))) return dir;
		const parent = dirname(dir);
		if (parent === dir) return null;
		dir = parent;
	}
};

const resolvePackageRoot = (spec: string, fromDir: string): string | null => {
	try {
		const resolved = Bun.resolveSync(spec, join(fromDir, "package.json"));
		if (!isAbsolute(resolved) || !existsSync(resolved)) return null;
		return findPackageRoot(resolved);
	} catch {
		return null;
	}
};

type PackageJson = {
	name?: string;
	dependencies?: Record<string, string>;
	devDependencies?: Record<string, string>;
	optionalDependencies?: Record<string, string>;
	peerDependencies?: Record<string, string>;
};

async function stageServerlessOutput(
	projectRoot: string,
	outDir: string,
	pkg: PackageJson,
): Promise<number> {
	await rm(join(outDir, "node_modules"), { recursive: true, force: true });
	await rm(join(outDir, "public"), { recursive: true, force: true });

	const publicDir = join(projectRoot, "public");
	if (existsSync(publicDir)) await cp(publicDir, join(outDir, "public"), { recursive: true });

	const nmRoot = join(projectRoot, "node_modules");
	const seeds = [
		...Object.keys(pkg.dependencies ?? {}),
		...Object.keys(pkg.optionalDependencies ?? {}),
		...Object.keys(pkg.peerDependencies ?? {}),
	];
	const queue: { spec: string; from: string }[] = seeds.map((spec) => ({
		spec,
		from: projectRoot,
	}));
	const visited = new Set<string>();
	let copied = 0;

	while (queue.length > 0) {
		const item = queue.shift();
		if (!item) break;
		const pkgRoot = resolvePackageRoot(item.spec, item.from);
		if (!pkgRoot || visited.has(pkgRoot)) continue;
		visited.add(pkgRoot);

		const rel = relative(nmRoot, pkgRoot);
		const dest =
			rel === "" || rel.startsWith("..")
				? join(outDir, "node_modules", item.spec)
				: join(outDir, "node_modules", rel);
		await mkdir(dirname(dest), { recursive: true });
		await cp(pkgRoot, dest, { recursive: true });
		copied++;

		const depPkg: PackageJson | null = await readJson(join(pkgRoot, "package.json")).catch(
			() => null,
		);
		if (!depPkg) continue;
		for (const dep of Object.keys({
			...depPkg.dependencies,
			...depPkg.optionalDependencies,
			...depPkg.peerDependencies,
		})) {
			queue.push({ spec: dep, from: pkgRoot });
		}
	}

	const stagedPkg = {
		name: pkg.name ? `${pkg.name}-server` : "buntok-app",
		private: true,
		type: "module",
	};
	await writeFile(join(outDir, "package.json"), `${JSON.stringify(stagedPkg, null, "\t")}\n`);
	return copied;
}

export async function buildCommand() {
	const projectRoot = process.cwd();
	const entryPoint = join(projectRoot, "server.ts");
	const onVercel = process.env.VERCEL === "1" || process.env.VERCEL === "true";
	const outDir = join(projectRoot, "buntok");

	if (!existsSync(entryPoint)) {
		console.error("\x1b[31m❌ server.ts not found\x1b[0m");
		process.exitCode = 1;
		return;
	}

	// Read user's package.json to know their dependencies
	let userPkg: PackageJson = {};
	const pkgPath = join(projectRoot, "package.json");
	if (existsSync(pkgPath)) userPkg = await readJson(pkgPath);
	const userDeps = [
		...Object.keys(userPkg.dependencies || {}),
		...Object.keys(userPkg.devDependencies || {}),
	];

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

	if (onVercel) {
		const copied = await stageServerlessOutput(projectRoot, outDir, userPkg);
		console.log(`\x1b[32m✅ Build successful → buntok/server.js\x1b[0m`);
		console.log(
			`\x1b[90m  Staged Vercel output: ${copied} packages + public + package.json → buntok/\x1b[0m`,
		);
		return;
	}

	console.log(`\x1b[32m✅ Build successful → buntok/server.js\x1b[0m`);
	console.log(`\x1b[90m  Deploy: copy buntok/ + node_modules/ + package.json to server\x1b[0m`);
}
