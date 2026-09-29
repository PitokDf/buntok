import { existsSync, readFileSync, statSync, watch, type FSWatcher } from "node:fs";
import { join } from "node:path";

/** Files loaded by Bun, in ascending precedence order (development mode). */
const ENV_FILES = [".env", ".env.development", ".env.local"] as const;

/** Parse a single .env-style file (simple dotenv format, zero-dep). */
export function parseEnvFile(path: string): Record<string, string> {
	if (!existsSync(path)) return {};
	const values: Record<string, string> = {};
	for (const rawLine of readFileSync(path, "utf8").split("\n")) {
		const line = rawLine.trim();
		if (!line || line.startsWith("#")) continue;
		const withoutExport = line.startsWith("export ") ? line.slice(7).trim() : line;
		const eq = withoutExport.indexOf("=");
		if (eq <= 0) continue;
		const key = withoutExport.slice(0, eq).trim();
		if (!key) continue;
		let value = withoutExport.slice(eq + 1).trim();
		if (
			value.length >= 2 &&
			((value.startsWith('"') && value.endsWith('"')) ||
				(value.startsWith("'") && value.endsWith("'")))
		) {
			value = value.slice(1, -1);
		}
		values[key] = value;
	}
	return values;
}

export interface LoadedEnv {
	values: Record<string, string>;
	keys: string[];
}

/** Load every supported .env file in Bun's precedence order. */
export function loadEnvFiles(dir: string): LoadedEnv {
	const values: Record<string, string> = {};
	for (const name of ENV_FILES) {
		Object.assign(values, parseEnvFile(join(dir, name)));
	}
	return { values, keys: Object.keys(values) };
}

/**
 * Build the child environment for the dev server: strip keys that came from
 * the previous .env generation (so deletions propagate), then overlay the
 * freshly parsed values. Shell/process values always win over files in Bun,
 * which is why the merge must be explicit on restart.
 */
export function buildChildEnv(
	parentEnv: Record<string, string | undefined>,
	oldKeys: ReadonlySet<string>,
	fresh: LoadedEnv,
	overrides: Record<string, string>,
): Record<string, string> {
	const out: Record<string, string> = {};
	for (const [key, value] of Object.entries(parentEnv)) {
		if (value !== undefined) out[key] = value;
	}
	for (const key of oldKeys) delete out[key];
	Object.assign(out, fresh.values, overrides);
	return out;
}

function envFileSignature(dir: string): string {
	return ENV_FILES.map((name) => {
		try {
			return statSync(join(dir, name)).mtimeMs;
		} catch {
			return 0;
		}
	}).join(",");
}

/**
 * Watch a directory for .env file changes (created, modified, renamed, or
 * deleted) and invoke `onChange` (debounced). Returns a stop function.
 *
 * The directory itself is watched instead of each file so editors that save
 * via atomic rename keep triggering events. If the event has no filename
 * (some platforms), an mtime signature of the .env files is used instead.
 */
export function watchEnvFiles(dir: string, onChange: (file: string) => void): () => void {
	let timer: ReturnType<typeof setTimeout> | undefined;
	let signature = envFileSignature(dir);

	const schedule = (file: string) => {
		if (timer) clearTimeout(timer);
		timer = setTimeout(() => {
			timer = undefined;
			signature = envFileSignature(dir);
			onChange(file);
		}, 150);
	};

	let watcher: FSWatcher;
	try {
		watcher = watch(dir, (_event, filename) => {
			const name = filename ? filename.toString() : "";
			if (name && !/^\.env(\..+)?$/.test(name)) return;
			if (!name) {
				const next = envFileSignature(dir);
				if (next === signature) return;
				signature = next;
				schedule(".env");
				return;
			}
			schedule(name);
		});
	} catch {
		// Directory unreadable / no permission — env watching stays disabled.
		return () => {};
	}

	return () => {
		if (timer) clearTimeout(timer);
		watcher.close();
	};
}
