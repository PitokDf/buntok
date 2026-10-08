import { afterAll, describe, expect, it } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { buildCommand } from "../../src/cli/commands/build";
import { cleanupProjects, makeProject, projectHas, runInProject } from "./helpers";

afterAll(cleanupProjects);

const SERVER_TS = `const answer: number = 42;\nconsole.log(answer);\n`;

function fixture(): string {
	return makeProject({
		"package.json": JSON.stringify(
			{
				name: "staging-app",
				version: "0.0.0",
				dependencies: { "app-dep": "1.0.0" },
				devDependencies: { "dev-dep": "1.0.0" },
				peerDependencies: { bun: ">=1.2.0" },
			},
			null,
			2,
		),
		"tsconfig.json": "{}",
		"server.ts": SERVER_TS,
		"public/sample.txt": "hello",
		"node_modules/app-dep/package.json": JSON.stringify({
			name: "app-dep",
			version: "1.0.0",
			main: "index.js",
			dependencies: { "nested-dep": "2.0.0" },
		}),
		"node_modules/app-dep/index.js": "module.exports = {};\n",
		"node_modules/nested-dep/package.json": JSON.stringify({
			name: "nested-dep",
			version: "2.0.0",
			main: "index.js",
		}),
		"node_modules/nested-dep/index.js": "module.exports = {};\n",
		"node_modules/dev-dep/package.json": JSON.stringify({
			name: "dev-dep",
			version: "1.0.0",
			main: "index.js",
		}),
		"node_modules/dev-dep/index.js": "module.exports = {};\n",
		"node_modules/bun/package.json": JSON.stringify({
			name: "bun",
			version: "1.4.2",
			main: "index.js",
		}),
		"node_modules/bun/index.js": "module.exports = {};\n",
	});
}

async function runBuild(dir: string, vercel?: string): Promise<number> {
	const prev = process.env.VERCEL;
	if (vercel === undefined) delete process.env.VERCEL;
	else process.env.VERCEL = vercel;
	try {
		return await runInProject(dir, buildCommand);
	} finally {
		if (prev === undefined) delete process.env.VERCEL;
		else process.env.VERCEL = prev;
	}
}

describe("build: Vercel output staging", () => {
	it("stages runtime closure, public and package.json when VERCEL=1", async () => {
		const dir = fixture();
		const exit = await runBuild(dir, "1");

		expect(exit).toBe(0);
		expect(projectHas(dir, "buntok/server.js")).toBe(true);
		expect(projectHas(dir, "buntok/node_modules/app-dep/package.json")).toBe(true);
		expect(projectHas(dir, "buntok/node_modules/nested-dep/package.json")).toBe(true);
		expect(projectHas(dir, "buntok/node_modules/dev-dep")).toBe(false);
		expect(projectHas(dir, "buntok/node_modules/bun")).toBe(false);
		expect(projectHas(dir, "buntok/public/sample.txt")).toBe(true);
		expect(existsSync(`${dir}/.buntok`)).toBe(false);

		const stagedPkg = JSON.parse(readFileSync(`${dir}/buntok/package.json`, "utf-8"));
		expect(stagedPkg.type).toBe("module");
		expect(stagedPkg.name).toBe("staging-app-server");
	});

	it("does not stage outside a Vercel build", async () => {
		const dir = fixture();
		const exit = await runBuild(dir);

		expect(exit).toBe(0);
		expect(projectHas(dir, "buntok/server.js")).toBe(true);
		expect(existsSync(`${dir}/buntok/node_modules`)).toBe(false);
		expect(existsSync(`${dir}/buntok/public`)).toBe(false);
		expect(existsSync(`${dir}/buntok/package.json`)).toBe(false);
		expect(existsSync(`${dir}/.buntok`)).toBe(false);
	});
});
