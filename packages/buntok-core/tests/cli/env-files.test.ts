import { afterAll, describe, expect, it } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { buildChildEnv, loadEnvFiles, parseEnvFile, watchEnvFiles } from "../../src/cli/env";

const tmpRoots: string[] = [];

function makeTmpDir(): string {
	const dir = mkdtempSync(join(tmpdir(), "buntok-env-"));
	tmpRoots.push(dir);
	return dir;
}

afterAll(() => {
	for (const dir of tmpRoots) rmSync(dir, { recursive: true, force: true });
});

describe("parseEnvFile", () => {
	it("parses KEY=VALUE lines and skips comments/blank lines", () => {
		const dir = makeTmpDir();
		const file = join(dir, ".env");
		writeFileSync(
			file,
			[
				"# comment",
				"",
				"PORT=3000",
				"  SPACED = value with spaces  ",
				"export EXPORTED=yes",
				"EMPTY=",
				"NOEQ_LINE",
				'QUOTED="hello world"',
				"SINGLE='single quoted'",
			].join("\n"),
		);

		expect(parseEnvFile(file)).toEqual({
			PORT: "3000",
			SPACED: "value with spaces",
			EXPORTED: "yes",
			EMPTY: "",
			QUOTED: "hello world",
			SINGLE: "single quoted",
		});
	});

	it("returns {} for a missing file", () => {
		expect(parseEnvFile("/nonexistent/.env")).toEqual({});
	});
});

describe("loadEnvFiles", () => {
	it("merges .env < .env.development < .env.local in precedence order", () => {
		const dir = makeTmpDir();
		writeFileSync(join(dir, ".env"), "A=base\nB=base\nC=base");
		writeFileSync(join(dir, ".env.development"), "B=dev");
		writeFileSync(join(dir, ".env.local"), "C=local\nD=local");

		const loaded = loadEnvFiles(dir);
		expect(loaded.values).toEqual({ A: "base", B: "dev", C: "local", D: "local" });
		expect(loaded.keys.sort()).toEqual(["A", "B", "C", "D"]);
	});

	it("works when no .env files exist", () => {
		const dir = makeTmpDir();
		expect(loadEnvFiles(dir)).toEqual({ values: {}, keys: [] });
	});
});

describe("buildChildEnv", () => {
	it("strips stale keys, overlays fresh values, and applies overrides last", () => {
		const parentEnv = {
			PATH: "/usr/bin",
			REMOVED_KEY: "stale",
			CHANGED_KEY: "stale",
			UNDEFINED_KEY: undefined,
		} as Record<string, string | undefined>;
		const oldKeys = new Set(["REMOVED_KEY", "CHANGED_KEY"]);
		const fresh = {
			values: { CHANGED_KEY: "fresh", ADDED_KEY: "fresh" },
			keys: ["CHANGED_KEY", "ADDED_KEY"],
		};

		const env = buildChildEnv(parentEnv, oldKeys, fresh, {
			NODE_ENV: "development",
			PORT: "1212",
		});

		expect(env).toEqual({
			PATH: "/usr/bin",
			CHANGED_KEY: "fresh",
			ADDED_KEY: "fresh",
			NODE_ENV: "development",
			PORT: "1212",
		});
	});

	it("lets explicit overrides win over .env values", () => {
		const env = buildChildEnv({}, new Set(), { values: { PORT: "9999" }, keys: ["PORT"] }, {
			PORT: "1212",
		});
		expect(env.PORT).toBe("1212");
	});
});

describe("watchEnvFiles", () => {
	it("fires (debounced) when an .env file changes, and not for other files", async () => {
		const dir = makeTmpDir();
		mkdirSync(dir, { recursive: true });

		let stopped = false;
		const events: string[] = [];
		let resolveDone: () => void;
		const done = new Promise<void>((resolve) => {
			resolveDone = resolve;
		});

		const stop = watchEnvFiles(dir, (file) => {
			events.push(file);
			if (!stopped) {
				stopped = true;
				stop();
				resolveDone();
			}
		});

		// Unrelated file must NOT trigger.
		writeFileSync(join(dir, "readme.txt"), "not env");
		await Bun.sleep(300);

		// Burst of env writes must debounce into a single event.
		writeFileSync(join(dir, ".env"), "A=1\n");
		writeFileSync(join(dir, ".env"), "A=2\n");

		const timeout = Bun.sleep(3000).then(() => "timeout");
		const result = await Promise.race([done.then(() => "done"), timeout]);
		expect(result).toBe("done");
		expect(events).toEqual([".env"]);
	});

	it("triggers for .env.local as well and can be stopped", async () => {
		const dir = makeTmpDir();
		let stopped = false;
		const events: string[] = [];
		let resolveDone: () => void;
		const done = new Promise<void>((resolve) => {
			resolveDone = resolve;
		});

		const stop = watchEnvFiles(dir, (file) => {
			events.push(file);
			if (!stopped) {
				stopped = true;
				stop();
				resolveDone();
			}
		});

		writeFileSync(join(dir, ".env.local"), "SECRET=1");
		const timeout = Bun.sleep(3000).then(() => "timeout");
		const result = await Promise.race([done.then(() => "done"), timeout]);
		expect(result).toBe("done");
		expect(events).toEqual([".env.local"]);
	});
});
