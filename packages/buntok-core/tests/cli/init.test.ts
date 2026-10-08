import { afterAll, describe, expect, it } from "bun:test";
import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { cleanupProjects, makeProject, projectHas, readProject } from "./helpers";

afterAll(cleanupProjects);

const CLI = join(import.meta.dir, "..", "..", "src", "cli", "index.ts");

describe("buntok init (subprocess)", () => {
	it("answers piped stdin questions without hanging", () => {
		const dir = makeProject({});

		const r = spawnSync(process.execPath, [CLI, "init"], {
			cwd: dir,
			encoding: "utf-8",
			input: "y\ny\n",
			timeout: 30000,
			env: process.env,
		});
		const out = `${r.stdout ?? ""}${r.stderr ?? ""}`;

		expect(r.status).toBe(0);
		expect(projectHas(dir, "package.json")).toBe(true);
		expect(projectHas(dir, "vercel.json")).toBe(true);
		expect(projectHas(dir, "Dockerfile")).toBe(true);
		expect(projectHas(dir, "src/index.ts")).toBe(true);
		expect(readProject(dir, "server.ts")).toContain("export { app }");
		expect(out).not.toContain("Failed to install");
	});
});
