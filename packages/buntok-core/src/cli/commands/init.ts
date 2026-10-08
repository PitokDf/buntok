import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { execSync } from "node:child_process";
import { createInterface } from "node:readline";
import {
	BIOME_CONFIG,
	DOCKERFILE_TEMPLATE,
	DOCKERIGNORE_CONTENT,
	ENV_CONTENT,
	ENV_EXAMPLE_CONTENT,
	ENV_TS_TEMPLATE,
	GITIGNORE_CONTENT,
	INDEX_TEMPLATE,
	SERVER_TS_TEMPLATE,
	TSCONFIG_TEMPLATE,
	VSCODE_SETTINGS,
	VERCEL_JSON_TEMPLATE,
	copySkillMd,
} from "../templates.js";

let pipedAnswers: string[] | null = null;

function askQuestion(question: string, defaultValue = true): Promise<boolean> {
	const finish = (raw: string): boolean => {
		const normalized = raw.trim().toLowerCase();
		if (normalized === "") return defaultValue;
		return normalized === "y" || normalized === "yes";
	};

	// Piped stdin: consume all answers up-front so a fast writer cannot
	// outrun per-question readline buffering (later prompts would hang or
	// silently swallow the rest of the setup).
	if (!process.stdin.isTTY) {
		if (pipedAnswers === null) {
			try {
				pipedAnswers = readFileSync(0, "utf-8").split("\n");
			} catch {
				pipedAnswers = [];
			}
		}
		process.stdout.write(question);
		const answer = pipedAnswers.shift() ?? "";
		return Promise.resolve(finish(answer));
	}

	return new Promise((resolve) => {
		const rl = createInterface({
			input: process.stdin,
			output: process.stdout,
		});

		rl.question(question, (answer) => {
			rl.close();
			resolve(finish(answer));
		});
	});
}

const REQUIRED_SCRIPTS: Record<string, string> = {
	dev: "bun --watch server.ts",
	build: "bunx buntok build",
	start: "bun buntok/server.js",
	check: "bunx @biomejs/biome check --write .",
	format: "bunx @biomejs/biome format --write .",
	lint: "bunx @biomejs/biome lint .",
};

function updatePackageJson(projectRoot: string): boolean {
	const pkgPath = join(projectRoot, "package.json");

	let pkg: { name?: string; scripts?: Record<string, string>; devDependencies?: Record<string, string> };
	if (existsSync(pkgPath)) {
		pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
	} else {
		const folderName = projectRoot.split("/").pop() || "my-app";
		pkg = { name: folderName, scripts: {}, devDependencies: {} };
	}

	if (!pkg.scripts) pkg.scripts = {};

	let added = 0;
	for (const [key, value] of Object.entries(REQUIRED_SCRIPTS)) {
		if (!pkg.scripts[key]) {
			pkg.scripts[key] = value;
			added++;
		}
	}

	if (added === 0) {
		console.log("\x1b[90m• package.json: all scripts already present\x1b[0m");
		return false;
	}

	writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n", "utf-8");
	console.log(`\x1b[32m✓ Updated\x1b[0m package.json (added ${added} scripts)`);
	return true;
}

function ensureProjectDependencies(projectRoot: string): void {
	if (process.env.BUNTOK_NO_AUTO_INSTALL === "1") return;

	const pkgPath = join(projectRoot, "package.json");
	if (!existsSync(pkgPath)) return;

	let allDeps: Record<string, unknown> = {};
	try {
		const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
		allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
	} catch {
		return;
	}

	if (!allDeps["@buntok/core"]) {
		console.log("\x1b[90m• Installing @buntok/core...\x1b[0m");
		try {
			execSync("bun add @buntok/core", {
				cwd: projectRoot,
				stdio: "ignore",
			});
			console.log("\x1b[32m✓ Installed\x1b[0m @buntok/core");
		} catch {
			console.warn(
				"\x1b[33m⚠ Failed to install @buntok/core, run: bun add @buntok/core\x1b[0m",
			);
		}
	}

	const missingTypes = ["@types/bun", "@types/node", "typescript"].filter(
		(pkg) => !allDeps[pkg],
	);
	if (missingTypes.length > 0) {
		console.log(
			"\x1b[90m• Installing TypeScript toolchain (@types/bun, @types/node, typescript)...\x1b[0m",
		);
		try {
			execSync(`bun add -d ${missingTypes.join(" ")}`, {
				cwd: projectRoot,
				stdio: "ignore",
			});
			console.log(`\x1b[32m✓ Installed\x1b[0m ${missingTypes.join(", ")}`);
		} catch {
			console.warn(
				"\x1b[33m⚠ Failed to install TypeScript toolchain, run: bun add -d @types/bun @types/node typescript\x1b[0m",
			);
		}
	}
}

function stripJsonComments(text: string): string {
	// Remove single-line comments (// ...) but not inside strings
	return text.replace(/(?<!["':].*)\/\/.*$/gm, "");
}

function setupTsconfig(projectRoot: string): boolean {
	const tsconfigPath = join(projectRoot, "tsconfig.json");

	if (existsSync(tsconfigPath)) {
		// Merge paths into existing tsconfig
		const raw = readFileSync(tsconfigPath, "utf-8");
		const existing = JSON.parse(stripJsonComments(raw));
		if (!existing.compilerOptions) existing.compilerOptions = {};
		if (!existing.compilerOptions.paths) {
			existing.compilerOptions.paths = { "@/*": ["./src/*"] };
			writeFileSync(tsconfigPath, JSON.stringify(existing, null, 2) + "\n", "utf-8");
			console.log("\x1b[32m✓ Updated\x1b[0m tsconfig.json (added path alias)");
			return true;
		}
		if (!existing.compilerOptions.paths["@/*"]) {
			existing.compilerOptions.paths["@/*"] = ["./src/*"];
			writeFileSync(tsconfigPath, JSON.stringify(existing, null, 2) + "\n", "utf-8");
			console.log("\x1b[32m✓ Updated\x1b[0m tsconfig.json (added path alias)");
			return true;
		}
		console.log("\x1b[90m• tsconfig.json: path alias already present\x1b[0m");
		return false;
	}

	// Create new tsconfig
	writeFileSync(tsconfigPath, JSON.stringify(TSCONFIG_TEMPLATE, null, 2) + "\n", "utf-8");
	console.log("\x1b[32m✓ Created\x1b[0m tsconfig.json");
	return true;
}

function setupBiome(projectRoot: string): boolean {
	const biomePath = join(projectRoot, "biome.json");

	if (existsSync(biomePath)) {
		console.log("\x1b[90m• biome.json: already exists, skipping\x1b[0m");
		return false;
	}

	// Check if @biomejs/biome is installed
	const pkgPath = join(projectRoot, "package.json");
	let needsInstall = false;
	if (process.env.BUNTOK_NO_AUTO_INSTALL !== "1" && existsSync(pkgPath)) {
		const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
		const allDeps = {
			...pkg.dependencies,
			...pkg.devDependencies,
		};
		needsInstall = !allDeps["@biomejs/biome"];
	}

	if (needsInstall) {
		console.log("\x1b[90m• Installing @biomejs/biome...\x1b[0m");
		try {
			execSync("bun add -d @biomejs/biome", {
				cwd: projectRoot,
				stdio: "ignore",
			});
			console.log("\x1b[32m✓ Installed\x1b[0m @biomejs/biome");
		} catch {
			console.warn(
				"\x1b[33m⚠ Failed to install @biomejs/biome, please install manually\x1b[0m",
			);
		}
	}

	writeFileSync(biomePath, JSON.stringify(BIOME_CONFIG, null, 2) + "\n", "utf-8");
	console.log("\x1b[32m✓ Created\x1b[0m biome.json");
	return true;
}

function createIndexFile(projectRoot: string): boolean {
	const srcDir = join(projectRoot, "src");
	const indexPath = join(srcDir, "index.ts");

	if (existsSync(indexPath)) {
		console.log("\x1b[90m• src/index.ts: already exists, skipping\x1b[0m");
		return false;
	}

	if (!existsSync(srcDir)) {
		mkdirSync(srcDir, { recursive: true });
	}

	writeFileSync(indexPath, INDEX_TEMPLATE, "utf-8");
	console.log("\x1b[32m✓ Created\x1b[0m src/index.ts");
	return true;
}

function createEnvTsFile(projectRoot: string): boolean {
	const srcDir = join(projectRoot, "src");
	const envTsPath = join(srcDir, "env.ts");

	if (existsSync(envTsPath)) {
		console.log("\x1b[90m• src/env.ts: already exists, skipping\x1b[0m");
		return false;
	}

	if (!existsSync(srcDir)) {
		mkdirSync(srcDir, { recursive: true });
	}

	writeFileSync(envTsPath, ENV_TS_TEMPLATE, "utf-8");
	console.log("\x1b[32m✓ Created\x1b[0m src/env.ts");
	return true;
}

function setupVscode(projectRoot: string): boolean {
	const vscodeDir = join(projectRoot, ".vscode");
	const settingsPath = join(vscodeDir, "settings.json");

	if (existsSync(settingsPath)) {
		console.log("\x1b[90m• .vscode/settings.json: already exists, skipping\x1b[0m");
		return false;
	}

	if (!existsSync(vscodeDir)) {
		mkdirSync(vscodeDir, { recursive: true });
	}

	writeFileSync(settingsPath, JSON.stringify(VSCODE_SETTINGS, null, 2) + "\n", "utf-8");
	console.log("\x1b[32m✓ Created\x1b[0m .vscode/settings.json");
	return true;
}

function createEnvFiles(projectRoot: string): boolean {
	const envPath = join(projectRoot, ".env");
	const envExamplePath = join(projectRoot, ".env.example");
	let created = false;

	if (!existsSync(envPath)) {
		writeFileSync(envPath, ENV_CONTENT, "utf-8");
		console.log("\x1b[32m✓ Created\x1b[0m .env");
		created = true;
	} else {
		console.log("\x1b[90m• .env: already exists, skipping\x1b[0m");
	}

	if (!existsSync(envExamplePath)) {
		writeFileSync(envExamplePath, ENV_EXAMPLE_CONTENT, "utf-8");
		console.log("\x1b[32m✓ Created\x1b[0m .env.example");
		created = true;
	} else {
		console.log("\x1b[90m• .env.example: already exists, skipping\x1b[0m");
	}

	return created;
}

function createGitignore(projectRoot: string): boolean {
	const gitignorePath = join(projectRoot, ".gitignore");

	if (existsSync(gitignorePath)) {
		console.log("\x1b[90m• .gitignore: already exists, skipping\x1b[0m");
		return false;
	}

	writeFileSync(gitignorePath, GITIGNORE_CONTENT, "utf-8");
	console.log("\x1b[32m✓ Created\x1b[0m .gitignore");
	return true;
}

function createVercelJson(projectRoot: string): boolean {
	const vercelPath = join(projectRoot, "vercel.json");

	if (existsSync(vercelPath)) {
		console.log("\x1b[90m• vercel.json: already exists, skipping\x1b[0m");
		return false;
	}

	writeFileSync(vercelPath, JSON.stringify(VERCEL_JSON_TEMPLATE, null, 2) + "\n", "utf-8");
	console.log("\x1b[32m✓ Created\x1b[0m vercel.json");

	// Create empty public/ directory (Vercel requires it for static files)
	const publicDir = join(projectRoot, "public");
	if (!existsSync(publicDir)) {
		mkdirSync(publicDir, { recursive: true });
		writeFileSync(join(publicDir, ".gitkeep"), "");
	}

	return true;
}

function createServerTsFile(projectRoot: string): boolean {
	const serverPath = join(projectRoot, "server.ts");

	if (existsSync(serverPath)) {
		console.log("\x1b[90m• server.ts: already exists, skipping\x1b[0m");
		return false;
	}

	writeFileSync(serverPath, SERVER_TS_TEMPLATE, "utf-8");
	console.log("\x1b[32m✓ Created\x1b[0m server.ts");
	return true;
}

function updateDevScript(projectRoot: string): boolean {
	const pkgPath = join(projectRoot, "package.json");
	if (!existsSync(pkgPath)) return false;

	const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
	if (!pkg.scripts) return false;

	if (pkg.scripts.dev === "bun --watch src/index.ts") {
		pkg.scripts.dev = "bun --watch server.ts";
		writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n", "utf-8");
		console.log("\x1b[32m✓ Updated\x1b[0m package.json (dev → server.ts)");
		return true;
	}

	return false;
}

function createDockerfile(projectRoot: string): boolean {
	const dockerfilePath = join(projectRoot, "Dockerfile");
	const dockerignorePath = join(projectRoot, ".dockerignore");

	let created = false;

	if (!existsSync(dockerfilePath)) {
		writeFileSync(dockerfilePath, DOCKERFILE_TEMPLATE, "utf-8");
		console.log("\x1b[32m✓ Created\x1b[0m Dockerfile");
		created = true;
	} else {
		console.log("\x1b[90m• Dockerfile: already exists, skipping\x1b[0m");
	}

	if (!existsSync(dockerignorePath)) {
		writeFileSync(dockerignorePath, DOCKERIGNORE_CONTENT, "utf-8");
		console.log("\x1b[32m✓ Created\x1b[0m .dockerignore");
		created = true;
	} else {
		console.log("\x1b[90m• .dockerignore: already exists, skipping\x1b[0m");
	}

	return created;
}

export async function initCommand() {
	const projectRoot = process.cwd();

	copySkillMd(projectRoot);
	updatePackageJson(projectRoot);
	ensureProjectDependencies(projectRoot);
	setupTsconfig(projectRoot);
	setupBiome(projectRoot);
	setupVscode(projectRoot);
	createEnvTsFile(projectRoot);
	createIndexFile(projectRoot);
	createEnvFiles(projectRoot);
	createGitignore(projectRoot);
	updateDevScript(projectRoot);

	const vercelPath = join(projectRoot, "vercel.json");
	if (!existsSync(vercelPath)) {
		console.log("");
		const useVercel = await askQuestion(
			"\x1b[36mDo you want to deploy to Vercel? (y/N): \x1b[0m",
			false,
		);
		if (useVercel) {
			createVercelJson(projectRoot);
		}
	} else {
		console.log("\x1b[90m• vercel.json: already exists, skipping\x1b[0m");
	}

	createServerTsFile(projectRoot);

	const dockerfilePath = join(projectRoot, "Dockerfile");
	if (!existsSync(dockerfilePath)) {
		console.log("");
		const useDocker = await askQuestion(
			"\x1b[36mDo you want to add Docker support? (Y/n): \x1b[0m",
			true,
		);
		if (useDocker) {
			createDockerfile(projectRoot);
		}
	} else {
		console.log("\x1b[90m• Dockerfile: already exists, skipping\x1b[0m");
	}
}
