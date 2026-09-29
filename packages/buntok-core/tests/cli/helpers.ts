import {
	chmodSync,
	existsSync,
	mkdirSync,
	mkdtempSync,
	readFileSync,
	rmSync,
	writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

const tmpDirs: string[] = [];

function writeRaw(dir: string, rel: string, content: string): void {
	const path = join(dir, rel);
	mkdirSync(dirname(path), { recursive: true });
	writeFileSync(path, content);
}

/**
 * Create a throwaway fixture project in a temp dir.
 * Includes a stub `node_modules/.bin/biome` so generated-file formatting
 * resolves locally and exits immediately instead of fetching the wrong npm package.
 */
export function makeProject(files: Record<string, string>): string {
	const dir = mkdtempSync(join(tmpdir(), "buntok-cli-"));
	tmpDirs.push(dir);
	writeRaw(dir, "node_modules/.bin/biome", "#!/bin/sh\nexit 0\n");
	chmodSync(join(dir, "node_modules/.bin/biome"), 0o755);
	for (const [rel, content] of Object.entries(files)) {
		writeRaw(dir, rel, content);
	}
	return dir;
}

export function readProject(dir: string, rel: string): string {
	return readFileSync(join(dir, rel), "utf-8");
}

export function projectHas(dir: string, rel: string): boolean {
	return existsSync(join(dir, rel));
}

/**
 * Run a CLI command inside a fixture project.
 * Silences console output and restores cwd / exitCode afterwards.
 * Returns the exit code set by the command (0 when none).
 */
export async function runInProject(
	dir: string,
	fn: () => Promise<void> | void,
): Promise<number> {
	const prevCwd = process.cwd();
	const prevLog = console.log;
	const prevError = console.error;
	const prevExitCode = process.exitCode;
	process.chdir(dir);
	console.log = () => {};
	console.error = () => {};
	try {
		await fn();
		return typeof process.exitCode === "number" ? process.exitCode : 0;
	} finally {
		process.chdir(prevCwd);
		console.log = prevLog;
		console.error = prevError;
		// Bun ignores `process.exitCode = undefined`, so reset to 0 explicitly
		// to keep a failing command from leaking into later tests.
		process.exitCode = typeof prevExitCode === "number" ? prevExitCode : 0;
	}
}

export function cleanupProjects(): void {
	for (const dir of tmpDirs.splice(0)) {
		rmSync(dir, { recursive: true, force: true });
	}
}

export interface CapturedRun {
	output: string;
	exitCode: number;
}

/**
 * Run a CLI command inside a fixture project while capturing stdout/stderr.
 * Restores cwd / console / exitCode afterwards.
 */
export async function runCapturing(
	dir: string,
	fn: () => Promise<void> | void,
): Promise<CapturedRun> {
	const prevCwd = process.cwd();
	const prevLog = console.log;
	const prevError = console.error;
	const prevExitCode = process.exitCode;
	const out: string[] = [];
	const collect = (...a: unknown[]) => {
		out.push(a.map((v) => String(v)).join(" "));
	};
	process.chdir(dir);
	console.log = collect;
	console.error = collect;
	try {
		await fn();
		return {
			output: out.join("\n"),
			exitCode: typeof process.exitCode === "number" ? process.exitCode : 0,
		};
	} finally {
		process.chdir(prevCwd);
		console.log = prevLog;
		console.error = prevError;
		// Bun ignores `process.exitCode = undefined`, so reset to 0 explicitly
		// to keep a failing command from leaking into later tests.
		process.exitCode = typeof prevExitCode === "number" ? prevExitCode : 0;
	}
}
