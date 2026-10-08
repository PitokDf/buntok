import { existsSync } from "node:fs";
import { join } from "node:path";

interface TSError {
	file: string;
	line: number;
	col: number;
	code: string;
	message: string;
}

function stripAnsi(str: string): string {
	// biome-ignore lint/suspicious/noControlCharactersInRegex: ANSI escape codes
	return str.replace(/\x1B\[[0-9;]*[mK]/g, "");
}

function parseTSErrors(output: string): TSError[] {
	const clean = stripAnsi(output);
	const lines = clean.split("\n");
	const errors: TSError[] = [];

	for (const line of lines) {
		// Format without --pretty: "file.ts(1,7): error TS2322: message"
		// Format with --pretty: "file.ts:1:7 - error TS2322: message"
		const match =
			line.match(/^(.+?)\((\d+),(\d+)\): error (TS\d+): (.+)$/) ||
			line.match(/^(.+?):(\d+):(\d+) - error (TS\d+): (.+)$/);
		if (match && match[1] && match[2] && match[3] && match[4] && match[5]) {
			errors.push({
				file: match[1],
				line: Number.parseInt(match[2], 10),
				col: Number.parseInt(match[3], 10),
				code: match[4],
				message: match[5],
			});
		}
	}

	return errors;
}

function getUniqueFiles(errors: TSError[]): string[] {
	return [...new Set(errors.map((e) => e.file))];
}

function countProjectFiles(cwd: string, tsconfigPath: string): number {
	try {
		const proc = Bun.spawnSync(
			["bunx", "tsc", "--noEmit", "--listFilesOnly", "--project", tsconfigPath],
			{ cwd },
		);
		const out = proc.stdout?.toString() || "";
		return out
			.split("\n")
			.map((line) => line.trim())
			.filter((line) => line.startsWith("/") && !line.includes("node_modules"))
			.length;
	} catch {
		return 0;
	}
}

export async function checkCommand(flags: string[] = []): Promise<void> {
	const cwd = process.cwd();
	const tsconfigPath = join(cwd, "tsconfig.json");
	const isJson = flags.includes("--json");
	const isPlain = flags.includes("--plain");

	if (!existsSync(tsconfigPath)) {
		if (isJson) {
			console.log(
				JSON.stringify({
					success: false,
					error: "tsconfig.json not found. Run `buntok init` first.",
					errors: [],
					errorCount: 0,
					fileCount: 0,
				}),
			);
		} else {
			console.error(
				"\x1b[31mError: tsconfig.json not found. Run `buntok init` first.\x1b[0m",
			);
		}
		process.exitCode = 1;
		return;
	}

	if (!isJson) {
		if (isPlain) {
			console.log("  Running type check...\n");
		} else {
			console.log("\x1b[36m  Running type check...\x1b[0m\n");
		}
	}

	const proc = Bun.spawnSync(
		["bunx", "tsc", "--noEmit", "--pretty", "--project", tsconfigPath],
		{ cwd },
	);

	const output = proc.stdout?.toString() || "";
	const errors = parseTSErrors(output);
	const files = getUniqueFiles(errors);
	const errorCount = errors.length;
	const fileCount = files.length;

	if (proc.exitCode === 0) {
		if (isJson) {
			console.log(
				JSON.stringify({
					success: true,
					errors: [],
					errorCount: 0,
					fileCount: countProjectFiles(cwd, tsconfigPath),
				}),
			);
		} else {
			if (isPlain) {
				console.log("\n  ✓ No errors found\n");
			} else {
				console.log(
					`\n\x1b[32m  ✓ No errors found\x1b[0m\n`,
				);
			}
		}
		process.exitCode = 0;
		return;
	}

	// Errors found
	if (isJson) {
		console.log(
			JSON.stringify({
				success: false,
				errors,
				errorCount,
				fileCount,
			}),
		);
	} else {
		// Show errors (limit to 50 for readability)
		const maxErrors = 50;
		const shownErrors = errors.slice(0, maxErrors);

		for (const err of shownErrors) {
			const file = isPlain ? err.file : `\x1b[36m${err.file}\x1b[0m`;
			const line = isPlain ? `${err.line}` : `\x1b[33m${err.line}\x1b[0m`;
			const col = isPlain ? `${err.col}` : `\x1b[33m${err.col}\x1b[0m`;
			const code = isPlain ? err.code : `\x1b[31m${err.code}\x1b[0m`;
			const msg = isPlain ? err.message : `\x1b[31m${err.message}\x1b[0m`;

			console.log(`${file}(${line},${col}): error ${code}: ${msg}`);
		}

		if (errorCount > maxErrors) {
			console.log(
				`\n  ... and ${errorCount - maxErrors} more errors`,
			);
		}

		// Summary
		const fileStr = fileCount === 1 ? "file" : "files";
		if (isPlain) {
			console.log(
				`\n  ✗ ${errorCount} error${errorCount === 1 ? "" : "s"} in ${fileCount} ${fileStr}\n`,
			);
		} else {
			console.log(
				`\n\x1b[31m  ✗ ${errorCount} error${errorCount === 1 ? "" : "s"} in ${fileCount} ${fileStr}\x1b[0m\n`,
			);
		}
	}

	process.exitCode = proc.exitCode ?? 1;
}
