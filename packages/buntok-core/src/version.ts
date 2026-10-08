import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

let _version = "0.0.0-dev";
try {
	let pkgPath = join(__dirname, "..", "package.json");
	if (!existsSync(pkgPath)) {
		pkgPath = join(__dirname, "..", "..", "package.json");
	}
	if (!existsSync(pkgPath)) {
		pkgPath = join(process.cwd(), "node_modules", "@buntok", "core", "package.json");
	}
	if (existsSync(pkgPath)) {
		const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
		if (typeof pkg.version === "string") _version = pkg.version;
	}
} catch {}
export const VERSION: string = _version;
