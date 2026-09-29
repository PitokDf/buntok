import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { findEntryFile } from "../project.js";

function getMethodColor(method: string): string {
	switch (method) {
		case "GET": return "\x1b[32m";    // green
		case "POST": return "\x1b[33m";   // yellow
		case "PUT": return "\x1b[34m";    // blue
		case "PATCH": return "\x1b[35m";  // magenta
		case "DELETE": return "\x1b[31m"; // red
		case "OPTIONS": return "\x1b[36m"; // cyan
		case "HEAD": return "\x1b[37m";   // white
		default: return "\x1b[37m";      // white
	}
}

function printRouteTable(routes: any[]): void {
	if (routes.length === 0) {
		console.log("\x1b[33mNo routes found.\x1b[0m");
		return;
	}

	// Calculate column widths
	const methodWidth = Math.max(6, ...routes.map((r: any) => r.method.length));
	const pathWidth = Math.max(4, ...routes.map((r: any) => r.path.length));
	const mwWidth = Math.max(11, ...routes.map((r: any) => {
		const mw = (r.middlewares || []).join(", ");
		return mw.length > 40 ? 40 : mw.length;
	}));
	const handlerWidth = Math.max(7, ...routes.map((r: any) => (r.handler || "anonymous").length));

	// Print header
	const header = [
		"Method".padEnd(methodWidth),
		"Path".padEnd(pathWidth),
		"Middlewares".padEnd(mwWidth),
		"Handler".padEnd(handlerWidth),
	].join(" │ ");

	const separator = [
		"─".repeat(methodWidth),
		"─".repeat(pathWidth),
		"─".repeat(mwWidth),
		"─".repeat(handlerWidth),
	].join("─┼─");

	console.log(`\x1b[1m${header}\x1b[0m`);
	console.log(separator);

	// Print rows
	for (const route of routes) {
		const methodColor = getMethodColor(route.method);
		const mwStr = (route.middlewares || []).length > 0 ? route.middlewares.join(", ") : "—";
		const truncatedMw = mwStr.length > 40 ? mwStr.slice(0, 37) + "..." : mwStr;

		const row = [
			`${methodColor}${route.method.padEnd(methodWidth)}\x1b[0m`,
			route.path.padEnd(pathWidth),
			truncatedMw.padEnd(mwWidth),
			(route.handler || "anonymous").padEnd(handlerWidth),
		].join(" │ ");

		console.log(row);
	}

	// Print summary
	console.log(`\n\x1b[36m${routes.length} routes registered\x1b[0m`);
}

function printSourceSummary(routes: any[]): void {
	const bySource: Record<string, any[]> = {};
	for (const route of routes) {
		const key = route.controller || route.group || route.source || "direct";
		if (!bySource[key]) bySource[key] = [];
		bySource[key].push(route);
	}

	const sources = Object.keys(bySource);
	if (sources.length <= 1) return;

	console.log(`\n\x1b[36mBy source:\x1b[0m`);
	for (const source of sources) {
		const count = bySource[source]?.length ?? 0;
		console.log(`  ${source}: ${count} routes`);
	}
}

export async function debugRoutesCommand(flags: string[]): Promise<void> {
	const isJson = flags.includes("--json");
	const targetDir = process.cwd();

	// Find the user's app entry point (shared candidate list + content probe)
	const entry = findEntryFile(targetDir);

	if (!entry) {
		console.error("\x1b[31mError: Could not find app entry point (server.ts, src/index.ts, src/main.ts, src/app.ts, or src/server.ts)\x1b[0m");
		process.exitCode = 1;
		return;
	}
	const entryFile = resolve(targetDir, entry);

	try {
		// Import the user's app to trigger route registration
		const fileUrl = pathToFileURL(entryFile).href;
		const mod = await import(fileUrl);

		// Find the app instance — check default export and named exports
		let app: any = null;
		if (mod.default && mod.default.routeDebugInfo) {
			app = mod.default;
		} else {
			// Search all exports for an app-like object
			for (const key of Object.keys(mod)) {
				if (mod[key] && mod[key].routeDebugInfo) {
					app = mod[key];
					break;
				}
			}
		}

		if (!app) {
			console.error("\x1b[31mError: Could not find App instance with routeDebugInfo. Make sure your entry point exports a Buntok App instance.\x1b[0m");
			process.exitCode = 1;
			return;
		}

		const routes = app.routeDebugInfo || [];

		if (isJson) {
			console.log(JSON.stringify(routes, null, 2));
		} else {
			printRouteTable(routes);
			printSourceSummary(routes);
		}
	} catch (err: any) {
		console.error(`\x1b[31mError importing app: ${err.message}\x1b[0m`);
		if (err.stack) {
			console.error(`\x1b[90m${err.stack}\x1b[0m`);
		}
		process.exitCode = 1;
	}
}
