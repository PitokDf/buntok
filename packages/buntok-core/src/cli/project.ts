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

/** Escape a string for use inside a regular expression. */
export function escapeRegExp(value: string): string {
	return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export interface AppInstance {
	/** Declared variable name, e.g. `app` or `apiv1`. */
	name: string;
	/** Index just past the declaration (including the optional `;`). */
	declEnd: number;
	/** Whether the declaration is exported. */
	exported: boolean;
	/** `app` for `new App(...)`, `group` for `X = Y.group(...)`. */
	kind: "app" | "group";
	/** For groups: the receiver, e.g. `app` in `const apiv1 = app.group("/api/v1")`. */
	owner?: string;
	/** For groups: the mount prefix string, e.g. `/api/v1`. */
	prefix?: string;
}

const DECL_HEAD =
	/(?:export\s+)?(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*(?::[^=]*?)?=\s*/g;

const GROUP_CALL = /\.\s*group\s*\(/g;

/**
 * End of a statement starting at `from`: past a depth-0 `;`, or at a
 * depth-0 newline once a call has closed (ASI). Skips string literals so
 * parentheses/semicolons inside them do not confuse the scan.
 */
function statementEnd(src: string, from: number): number {
	let depth = 0;
	let seenClose = false;
	let quote: string | null = null;
	for (let i = from; i < src.length; i++) {
		const ch = src[i] ?? "";
		if (quote !== null) {
			if (ch === "\\") i++;
			else if (ch === quote) quote = null;
			continue;
		}
		if (ch === '"' || ch === "'" || ch === "`") {
			quote = ch;
			continue;
		}
		if (ch === "(") depth++;
		else if (ch === ")") {
			depth = Math.max(0, depth - 1);
			if (depth === 0) seenClose = true;
		} else if (ch === ";" && depth === 0) return i + 1;
		else if (ch === "\n" && depth === 0 && seenClose) return i;
	}
	return src.length;
}

/**
 * Detect every app-hosting declaration in a source file:
 * - `const app = new App(...)` (generic `new App<DI>()` too)
 * - `const apiv1 = app.group("/api/v1")` (RouterGroup targets)
 */
export function detectAppInstances(src: string): AppInstance[] {
	const instances: AppInstance[] = [];
	DECL_HEAD.lastIndex = 0;
	let m: RegExpExecArray | null;
	while ((m = DECL_HEAD.exec(src)) !== null) {
		const name = m[1] ?? "";
		const exported = m[0].startsWith("export ");
		const rhsStart = m.index + m[0].length;

		if (/^new\s+App(?:\s*<[^>]*>)?\s*\(/.test(src.slice(rhsStart, rhsStart + 200))) {
			const declEnd = statementEnd(src, m.index);
			instances.push({ name, declEnd, exported, kind: "app" });
			continue;
		}

		// RouterGroup: `X = <receiver>.group(...)` — the receiver is the
		// owner (an App, or another group whose owner we resolve later).
		const stmtEnd = statementEnd(src, m.index);
		const region = src.slice(rhsStart, stmtEnd);
		GROUP_CALL.lastIndex = 0;
		let first: RegExpExecArray | null = null;
		let last: RegExpExecArray | null = null;
		let g: RegExpExecArray | null;
		while ((g = GROUP_CALL.exec(region)) !== null) {
			first ??= g;
			last = g;
		}
		if (!first || !last) continue;
		// Owner = receiver before the FIRST .group( — for chains like
		// `app.group("/a").group("/b")` that root is still the App.
		const owner = region.slice(0, first.index).replace(/\s+/g, "");
		if (!/^[A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*$/.test(owner)) continue;
		const open = rhsStart + last.index + last[0].length - 1;
		const close = findBalancedClose(src, open);
		let declEnd = stmtEnd;
		if (close !== -1) {
			declEnd = close + 1;
			if (src[declEnd] === ";") declEnd++;
		}
		const prefix = /^\s*["'`]([^"'`]*)["'`]/.exec(src.slice(open + 1))?.[1];
		instances.push({
			name,
			declEnd,
			exported,
			kind: "group",
			owner,
			...(prefix !== undefined ? { prefix } : {}),
		});
	}
	return instances;
}

/**
 * Find the file that actually declares the App instance (registration
 * target), e.g. `src/app.ts` / `src/index.ts`. A file that merely calls
 * `app.listen()` (the scaffolded `server.ts`) never wins over the
 * declaration file. Falls back to the entry file when no candidate
 * declares an App.
 */
export function findAppDeclarationFile(cwd: string = process.cwd()): string | null {
	let plainApp: string | null = null;
	let groupOnly: string | null = null;
	for (const candidate of ENTRY_CANDIDATES) {
		const path = join(cwd, candidate);
		if (!existsSync(path)) continue;
		try {
			const src = readFileSync(path, "utf-8");
			const instances = detectAppInstances(src);
			if (instances.length === 0) continue;
			const apps = instances.filter((i) => i.kind === "app");
			if (apps.some((i) => i.exported)) return candidate;
			if (apps.length > 0) plainApp ??= candidate;
			else groupOnly ??= candidate;
		} catch {
			// unreadable candidate — keep looking
		}
	}
	return plainApp ?? groupOnly ?? findEntryFile(cwd);
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
 * End of a `const <name> = new App(...)` declaration (options object
 * supported), or null when there is no declaration for that instance.
 */
export function findAppDeclEnd(src: string, name = "app"): number | null {
	const instance = detectAppInstances(src).find((i) => i.name === name);
	return instance ? instance.declEnd : null;
}

/**
 * Find where to insert registration lines before <name>.listen / route
 * handlers / exports, with fallback chain. Returns insertion index and
 * the matched text starting at that index.
 */
export function findInsertionIndex(src: string, name = "app"): {
	index: number;
	before: string;
} {
	const ref = escapeRegExp(name);
	// Pattern 1: <name>.listen(
	const listenMatch = src.match(new RegExp(`(${ref}\\.listen\\s*\\()`));
	if (listenMatch?.index !== undefined && listenMatch[1]) {
		return { index: listenMatch.index, before: listenMatch[1] };
	}
	// Pattern 2: <name>.get( or <name>.post( etc (route handlers)
	const routeMatch = src.match(
		new RegExp(`\\n(${ref}\\.(?:get|post|put|delete|patch|all|use)\\s*\\()`),
	);
	if (routeMatch?.index !== undefined && routeMatch[1]) {
		return { index: routeMatch.index + 1, before: routeMatch[1] };
	}
	// Pattern 3: export default <name>
	const exportDefaultMatch = src.match(new RegExp(`\\n(export\\s+default\\s+${ref}\\b)`));
	if (exportDefaultMatch?.index !== undefined && exportDefaultMatch[1]) {
		return { index: exportDefaultMatch.index + 1, before: exportDefaultMatch[1] };
	}
	// Pattern 4: <name> declaration — insert after the balanced
	// declaration (options object supported)
	const instance = detectAppInstances(src).find((i) => i.name === name);
	if (instance) {
		return { index: instance.declEnd, before: "" };
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
 * name: the app instance variable that owns the registrations.
 */
export function collectImportedControllers(
	src: string,
	excludeFromScan: boolean,
	name = "app",
): string[] {
	const imports = src.match(
		/import\s*\{\s*(\w+Controller)\s*\}\s*from\s*["']@\/modules\/\w+["']/g,
	);
	const controllers: string[] = [];
	if (imports) {
		const ref = escapeRegExp(name);
		for (const imp of imports) {
			const match = imp.match(/\{\s*(\w+Controller)\s*\}/);
			if (match?.[1]) {
				if (excludeFromScan) {
					const rcSingleMatch = src.match(
						new RegExp(`${ref}\\.registerController\\((${match[1]})\\)`),
					);
					const rcArrayMatch = src.match(
						new RegExp(`${ref}\\.registerController\\(\\[([^\\]]*?${match[1]}[^\\]]*?)\\]\\)`),
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
