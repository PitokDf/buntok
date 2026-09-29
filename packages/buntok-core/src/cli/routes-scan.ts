import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

/**
 * Static route scanner: parses `@Controller` / `@Get` / `@Post` / ... string
 * literals from source files — no app import, no runtime needed.
 */

export interface ScannedRoute {
	file: string;
	controller: string | null;
	method: string;
	path: string;
	line: number;
}

const SKIP_DIRS = new Set([
	"node_modules",
	"dist",
	".buntok",
	".git",
	"build",
	"coverage",
]);

function walk(dir: string, out: string[]): void {
	let entries: string[];
	try {
		entries = readdirSync(dir);
	} catch {
		return;
	}
	for (const entry of entries) {
		if (entry.startsWith(".") && entry !== ".") continue;
		const full = join(dir, entry);
		if (SKIP_DIRS.has(entry)) continue;
		try {
			if (statSync(full).isDirectory()) walk(full, out);
			else if (entry.endsWith(".ts") && !entry.endsWith(".d.ts")) out.push(full);
		} catch {
			// unreadable entries are skipped
		}
	}
}

function normalizePath(...segments: string[]): string {
	let path = segments
		.filter((s) => s !== "")
		.join("")
		.replace(/\/{2,}/g, "/");
	if (!path.startsWith("/")) path = `/${path}`;
	if (path.length > 1 && path.endsWith("/")) path = path.slice(0, -1);
	return path;
}

function joinRoutePath(prefix: string, methodPath: string): string {
	const left = prefix.startsWith("/") ? prefix : `/${prefix}`;
	const right = methodPath.startsWith("/") ? methodPath : `/${methodPath}`;
	return normalizePath(`${left}${right}`);
}

const HTTP_METHODS = [
	"Get",
	"Post",
	"Put",
	"Patch",
	"Delete",
	"All",
	"Options",
	"Head",
] as const;

/** Scan one file's content for controller-prefixed HTTP routes. */
export function scanRoutesInFile(file: string, content: string): ScannedRoute[] {
	const routes: ScannedRoute[] = [];
	const controllerMatch = content.match(
		/@Controller\s*\(\s*["'`]([^"'`]*)["'`]\s*\)/,
	);
	const controllerPath = controllerMatch?.[1] ?? null;
	const controllerName =
		content.match(/export\s+(?:default\s+)?class\s+(\w+)/)?.[1] ?? null;
	const controllerLine = controllerMatch
		? content.slice(0, controllerMatch.index ?? 0).split("\n").length
		: 1;

	for (const method of HTTP_METHODS) {
		const re = new RegExp(`@${method}\\s*\\(\\s*["'\`]([^"\`]*)["'\`]\\s*\\)`, "g");
		let m: RegExpExecArray | null;
		while ((m = re.exec(content)) !== null) {
			// Skip decorator references inside comments
			const before = content.slice(0, m.index);
			const lastLineStart = before.lastIndexOf("\n") + 1;
			if (before.slice(lastLineStart).trimStart().startsWith("//")) continue;
			routes.push({
				file,
				controller: controllerName,
				method: method === "All" ? "ALL" : method.toUpperCase(),
				path: joinRoutePath(controllerPath ?? "", m[1] ?? ""),
				line: before.split("\n").length,
			});
		}
	}

	// BaseController subclasses inherit the five pre-decorated CRUD routes.
	if (controllerPath !== null && /extends\s+BaseController\b/.test(content)) {
		const inherited: [string, string][] = [
			["GET", "/"],
			["GET", "/:id"],
			["POST", "/"],
			["PUT", "/:id"],
			["DELETE", "/:id"],
		];
		const ownKeys = new Set(routes.map((r) => `${r.method} ${r.path}`));
		for (const [method, path] of inherited) {
			const fullPath = joinRoutePath(controllerPath, path);
			const key = `${method} ${fullPath}`;
			// Own decorators override inherited methods (base route shadowed)
			if (ownKeys.has(key)) continue;
			routes.push({
				file,
				controller: controllerName,
				method,
				path: fullPath,
				line: controllerLine,
			});
		}
	}
	return routes;
}

/** Scan all TypeScript files under src for decorated routes. */
export function scanRoutes(cwd: string = process.cwd()): ScannedRoute[] {
	const srcDir = join(cwd, "src");
	if (!existsSync(srcDir)) return [];
	const files: string[] = [];
	walk(srcDir, files);
	const routes: ScannedRoute[] = [];
	for (const file of files) {
		try {
			routes.push(...scanRoutesInFile(file, readFileSync(file, "utf-8")));
		} catch {
			// unreadable file
		}
	}
	return routes;
}

export interface RouteConflict {
	key: string;
	routes: ScannedRoute[];
}

/** Group routes sharing the same METHOD + normalized path. */
export function findDuplicateRoutes(routes: ScannedRoute[]): RouteConflict[] {
	const byKey = new Map<string, ScannedRoute[]>();
	for (const route of routes) {
		const key = `${route.method} ${route.path}`;
		const group = byKey.get(key);
		if (group) group.push(route);
		else byKey.set(key, [route]);
	}
	const conflicts: RouteConflict[] = [];
	for (const [key, group] of byKey) {
		if (group.length > 1) conflicts.push({ key, routes: group });
	}
	return conflicts;
}

/** Print conflicts; returns true when duplicates were found. */
export function warnDuplicateRoutes(
	routes: ScannedRoute[],
	cwd: string = process.cwd(),
): boolean {
	const conflicts = findDuplicateRoutes(routes);
	if (conflicts.length === 0) return false;
	for (const conflict of conflicts) {
		console.log(`\n\x1b[33m⚠ Duplicate route: ${conflict.key}\x1b[0m`);
		for (const r of conflict.routes) {
			const rel = r.file.startsWith(cwd) ? r.file.slice(cwd.length + 1) : r.file;
			console.log(`    ${rel}:${r.line} (${r.controller ?? "anonymous"})`);
		}
	}
	return true;
}
