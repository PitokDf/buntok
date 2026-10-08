import { afterAll, describe, expect, it } from "bun:test";
import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { cleanupProjects, makeProject } from "./helpers";

afterAll(cleanupProjects);

const CLI = join(import.meta.dir, "..", "..", "src", "cli", "index.ts");
const CORE_SRC = join(import.meta.dir, "..", "..", "src", "buntok.ts");

function runCli(dir: string, args: string[]) {
	const r = spawnSync(process.execPath, [CLI, ...args], {
		cwd: dir,
		encoding: "utf-8",
		timeout: 15000,
		env: process.env,
	});
	return { code: r.status, out: `${r.stdout ?? ""}${r.stderr ?? ""}` };
}

const APP_EXPORTING = `import { Buntok } from ${JSON.stringify(CORE_SRC)};

export const app = new Buntok();

app.get("/", () => "ok");
`;

const APP_NOT_EXPORTING = `import { Buntok } from ${JSON.stringify(CORE_SRC)};

const app = new Buntok();

app.get("/", () => "ok");
`;

describe("debug:routes (subprocess)", () => {
	it("prints the route table and exits 0 when the entry exports the app", () => {
		const dir = makeProject({ "src/index.ts": APP_EXPORTING });

		const { code, out } = runCli(dir, ["debug:routes"]);

		expect(code).toBe(0);
		expect(out).toContain("routes registered");
		expect(out).toContain("GET");
	});

	it("exits 0 when server.ts re-exports the app", () => {
		const dir = makeProject({
			"src/index.ts": APP_EXPORTING,
			"server.ts": `import { app } from "./src/index";
app.listen(3000);
export { app };
`,
		});

		const { code, out } = runCli(dir, ["debug:routes"]);

		expect(code).toBe(0);
		expect(out).toContain("routes registered");
	});

	it("falls back to src/index.ts when server.ts does not re-export the app", () => {
		const dir = makeProject({
			"src/index.ts": APP_EXPORTING,
			"server.ts": `import { app } from "./src/index";
app.listen(3000);
`,
		});

		const { code, out } = runCli(dir, ["debug:routes"]);

		expect(code).toBe(0);
		expect(out).toContain("routes registered");
	});

	it("fails listing checked candidates when no entry exports the app", () => {
		const dir = makeProject({ "src/index.ts": APP_NOT_EXPORTING });

		const { code, out } = runCli(dir, ["debug:routes"]);

		expect(code).toBe(1);
		expect(out).toContain("Could not find Buntok instance");
		expect(out).toContain("src/index.ts");
	});
});
