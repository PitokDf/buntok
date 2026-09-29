import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export type ORM = "prisma" | "drizzle" | "typeorm";

/**
 * Detect the project ORM from config files first (definitive), then
 * package.json dependencies. Returns null when nothing matches.
 */
export function detectORMOrNull(): ORM | null {
	// Config / schema files
	if (existsSync("prisma/schema.prisma") || existsSync("prisma/schema.ts")) {
		return "prisma";
	}
	if (existsSync("drizzle.config.ts") || existsSync("drizzle.config.js")) {
		return "drizzle";
	}
	if (
		existsSync("ormconfig.json") ||
		existsSync("ormconfig.ts") ||
		existsSync("ormconfig.js")
	) {
		return "typeorm";
	}

	// Dependencies
	if (existsSync("package.json")) {
		try {
			const pkg = JSON.parse(readFileSync("package.json", "utf-8"));
			const deps = { ...pkg.dependencies, ...pkg.devDependencies };
			if (deps["@prisma/client"] || deps["prisma"]) return "prisma";
			if (deps["drizzle-orm"] || deps["drizzle-kit"]) return "drizzle";
			if (deps["typeorm"]) return "typeorm";
		} catch {
			// ignore parse errors
		}
	}

	return null;
}

/** Detect ORM with `prisma` as fallback (for generators). */
export function detectORM(): ORM {
	return detectORMOrNull() ?? "prisma";
}

/** Candidate entry files, probed in order (union of dev/debug/scaffold). */
export const ENTRY_CANDIDATES = [
	"server.ts",
	"src/index.ts",
	"src/main.ts",
	"src/app.ts",
	"src/server.ts",
	"index.ts",
] as const;

/**
 * Find the app entry file (relative path) or null when none exists.
 * Prefers a candidate that actually hosts the app (listen/new App/export).
 */
export function findEntryFile(cwd: string = process.cwd()): string | null {
	const existing: string[] = [];
	for (const candidate of ENTRY_CANDIDATES) {
		if (existsSync(join(cwd, candidate))) existing.push(candidate);
	}
	if (existing.length === 0) return null;
	for (const candidate of existing) {
		try {
			const src = readFileSync(join(cwd, candidate), "utf-8");
			if (/app\.listen\s*\(|new\s+App\s*\(|export\s+default\s+app/.test(src)) {
				return candidate;
			}
		} catch {
			// unreadable candidate — keep looking
		}
	}
	return existing[0] ?? null;
}

/** Index just past a balanced `)` starting at openIndex (points at `(`). */
function findBalancedClose(src: string, openIndex: number): number {
	let depth = 0;
	for (let i = openIndex; i < src.length; i++) {
		const ch = src[i];
		if (ch === "(") depth++;
		else if (ch === ")") {
			depth--;
			if (depth === 0) return i;
		}
	}
	return -1;
}

/**
 * End of a `const app = new App(...)` declaration (options object supported),
 * or null when there is no app declaration.
 */
export function findAppDeclEnd(src: string): number | null {
	const m = src.match(/(?:export\s+)?const\s+app\s*=\s*new\s+App\s*\(/);
	if (m?.index === undefined) return null;
	const open = m.index + m[0].length - 1;
	const close = findBalancedClose(src, open);
	if (close === -1) return null;
	let end = close + 1;
	if (src[end] === ";") end++;
	return end;
}

/**
 * Find where to insert registration lines before app.listen / route
 * handlers / exports, with fallback chain. Returns insertion index and
 * the matched text starting at that index.
 */
export function findInsertionIndex(src: string): {
	index: number;
	before: string;
} {
	// Pattern 1: app.listen(
	const listenMatch = src.match(/(app\.listen\s*\()/);
	if (listenMatch?.index !== undefined && listenMatch[1]) {
		return { index: listenMatch.index, before: listenMatch[1] };
	}
	// Pattern 2: app.get( or app.post( etc (route handlers)
	const routeMatch = src.match(/\n(app\.(get|post|put|delete|patch|all|use)\s*\()/);
	if (routeMatch?.index !== undefined && routeMatch[1]) {
		return { index: routeMatch.index + 1, before: routeMatch[1] };
	}
	// Pattern 3: export default app
	const exportDefaultMatch = src.match(/\n(export\s+default\s+app)/);
	if (exportDefaultMatch?.index !== undefined && exportDefaultMatch[1]) {
		return { index: exportDefaultMatch.index + 1, before: exportDefaultMatch[1] };
	}
	// Pattern 4: export const app = new App(...) — insert after the
	// balanced declaration (options object supported)
	const exportConstMatch = src.match(/export\s+const\s+app\s*=\s*new\s+App\s*\(/);
	if (exportConstMatch?.index !== undefined) {
		const open = exportConstMatch.index + exportConstMatch[0].length - 1;
		const close = findBalancedClose(src, open);
		if (close !== -1) {
			let end = close + 1;
			if (src[end] === ";") end++;
			return { index: end, before: "" };
		}
	}
	// Fallback: append at end
	return { index: src.length, before: "" };
}

/** Add an import line after the last existing import (no duplicates). */
export function ensureImport(src: string, imp: string): string {
	if (src.includes(imp)) return src;
	const lines = src.split("\n");
	let lastImportIndex = -1;
	for (let i = 0; i < lines.length; i++) {
		if (lines[i]?.startsWith("import ")) {
			lastImportIndex = i;
		}
	}
	if (lastImportIndex !== -1) {
		lines.splice(lastImportIndex + 1, 0, imp);
	} else {
		lines.unshift(imp);
	}
	return lines.join("\n");
}

/**
 * Collect controllers imported from @/modules/*.
 * excludeFromScan: skip controllers already passed to registerController.
 */
export function collectImportedControllers(
	src: string,
	excludeFromScan: boolean,
): string[] {
	const imports = src.match(
		/import\s*\{\s*(\w+Controller)\s*\}\s*from\s*["']@\/modules\/\w+["']/g,
	);
	const controllers: string[] = [];
	if (imports) {
		for (const imp of imports) {
			const match = imp.match(/\{\s*(\w+Controller)\s*\}/);
			if (match?.[1]) {
				if (excludeFromScan) {
					const rcSingleMatch = src.match(
						new RegExp(`app\\.registerController\\((${match[1]})\\)`),
					);
					const rcArrayMatch = src.match(
						new RegExp(`app\\.registerController\\(\\[([^\\]]*?${match[1]}[^\\]]*?)\\]\\)`),
					);
					if (rcSingleMatch || rcArrayMatch) continue;
				}
				controllers.push(match[1]);
			}
		}
	}
	return controllers;
}

/**
 * Format files with Biome when it is installed locally.
 * Skips silently when node_modules/.bin/biome is absent (avoids `bunx`
 * resolving to an unrelated npm package).
 */
export function formatWithBiome(paths: string[]): boolean {
	if (paths.length === 0) return false;
	const bin = join(process.cwd(), "node_modules", ".bin", "biome");
	if (!existsSync(bin) && !existsSync(`${bin}.cmd`)) return false;
	const proc = Bun.spawnSync(
		["bunx", "biome", "format", "--write", ...paths],
		{ stdio: ["ignore", "ignore", "ignore"] },
	);
	return proc.exitCode === 0;
}
