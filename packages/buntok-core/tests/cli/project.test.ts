import { afterAll, describe, expect, it } from "bun:test";
import { rmSync } from "node:fs";
import { join } from "node:path";
import {
	collectImportedControllers,
	detectAppInstances,
	detectORMOrNull,
	escapeRegExp,
	ensureImport,
	findAppDeclEnd,
	findAppDeclarationFile,
	findEntryFile,
	findInsertionIndex,
	formatWithBiome,
} from "../../src/cli/project";
import { cleanupProjects, makeProject, runInProject } from "./helpers";

afterAll(cleanupProjects);

describe("project: detectORMOrNull", () => {
	it("detects prisma from schema file", async () => {
		const dir = makeProject({ "prisma/schema.prisma": "model A { id String @id }" });
		await runInProject(dir, () => {
			expect(detectORMOrNull()).toBe("prisma");
		});
	});

	it("detects drizzle from config file", async () => {
		const dir = makeProject({ "drizzle.config.ts": "export default {};" });
		await runInProject(dir, () => {
			expect(detectORMOrNull()).toBe("drizzle");
		});
	});

	it("detects typeorm from ormconfig file", async () => {
		const dir = makeProject({ "ormconfig.json": "[]" });
		await runInProject(dir, () => {
			expect(detectORMOrNull()).toBe("typeorm");
		});
	});

	it("falls back to package.json dependencies", async () => {
		const dir = makeProject({
			"package.json": JSON.stringify({ devDependencies: { typeorm: "0.3.0" } }),
		});
		await runInProject(dir, () => {
			expect(detectORMOrNull()).toBe("typeorm");
		});
	});

	it("returns null when nothing matches", async () => {
		const dir = makeProject({ "package.json": JSON.stringify({ name: "bare" }) });
		await runInProject(dir, () => {
			expect(detectORMOrNull()).toBeNull();
		});
	});
});

describe("project: findEntryFile", () => {
	it("prefers a candidate that hosts the app", async () => {
		const dir = makeProject({
			"server.ts": "export const x = 1;",
			"src/index.ts": "const app = new App();\napp.listen(3000);",
		});
		await runInProject(dir, () => {
			expect(findEntryFile(process.cwd())).toBe("src/index.ts");
		});
	});

	it("returns the first existing candidate when none host the app", async () => {
		const dir = makeProject({ "server.ts": "export const x = 1;" });
		await runInProject(dir, () => {
			expect(findEntryFile(process.cwd())).toBe("server.ts");
		});
	});

	it("returns null when no candidate exists", async () => {
		const dir = makeProject({ "package.json": "{}" });
		await runInProject(dir, () => {
			expect(findEntryFile(process.cwd())).toBeNull();
		});
	});
});

describe("project: detectAppInstances", () => {
	it("detects a single exported instance", () => {
		const src = `import { App } from "@buntok/core";

export const app = new App();
`;
		const instances = detectAppInstances(src);
		expect(instances).toHaveLength(1);
		expect(instances[0]?.name).toBe("app");
		expect(instances[0]?.exported).toBe(true);
		expect(src.slice(0, instances[0]?.declEnd)).toEndWith("new App();");
	});

	it("detects multiple instances with options objects", () => {
		const src = `const apiV1 = new App({ handleSignals: false });
export const apiV2 = new App();
`;
		expect(detectAppInstances(src).map((i) => i.name)).toEqual(["apiV1", "apiV2"]);
	});

	it("matches generic App<DI> and let declarations", () => {
		const src = `const app = new App<DI>();
let legacy = new App();
const typed: App = new App();
`;
		expect(detectAppInstances(src).map((i) => i.name)).toEqual([
			"app",
			"legacy",
			"typed",
		]);
	});

	it("returns empty for a listener-only server.ts", () => {
		const src = `import { app } from "./src/index";

app.listen(3000);
`;
		expect(detectAppInstances(src)).toEqual([]);
	});

	it("detects RouterGroup declarations with kind, owner and prefix", () => {
		const src = `import { App } from "@buntok/core";

export const app = new App();
const apiv1 = app.group("/api/v1");
const apiv2 = app.group("/api/v2");
`;
		const instances = detectAppInstances(src);
		expect(instances.map((i) => i.name)).toEqual(["app", "apiv1", "apiv2"]);
		expect(instances[0]?.kind).toBe("app");
		expect(instances[1]).toMatchObject({
			kind: "group",
			owner: "app",
			prefix: "/api/v1",
		});
		expect(instances[2]).toMatchObject({
			kind: "group",
			owner: "app",
			prefix: "/api/v2",
		});
		expect(src.slice(0, instances[1]?.declEnd)).toEndWith(
			'const apiv1 = app.group("/api/v1");',
		);
	});

	it("detects a multiline group declaration", () => {
		const src = `const apiv1 = app
	.group("/api/v1");
`;
		const instances = detectAppInstances(src);
		expect(instances).toHaveLength(1);
		expect(instances[0]).toMatchObject({
			name: "apiv1",
			kind: "group",
			owner: "app",
			prefix: "/api/v1",
		});
		expect(src.slice(0, instances[0]?.declEnd)).toEndWith('group("/api/v1");');
	});

	it("detects chained .group() calls with the root receiver as owner", () => {
		const src = `const app = new App();
const nested = app.group("/api").group("/v1");
`;
		const instances = detectAppInstances(src);
		expect(instances.map((i) => i.name)).toEqual(["app", "nested"]);
		expect(instances[1]).toMatchObject({
			kind: "group",
			owner: "app",
			prefix: "/v1",
		});
		expect(src.slice(0, instances[1]?.declEnd)).toEndWith(
			'group("/v1");',
		);
	});

	it("ignores non-identifier receivers and plain object declarations", () => {
		const src = `const config = { a: 1 };
const broken = makeApp().group("/x");
const typed: Record<string, unknown> = {};
`;
		expect(detectAppInstances(src)).toEqual([]);
	});
});

describe("project: findAppDeclarationFile", () => {
	it("prefers the declaration file over the listener-only server.ts", async () => {
		const dir = makeProject({
			"server.ts": `import { app } from "./src/index";

app.listen(3000);
`,
			"src/index.ts": `import { App } from "@buntok/core";

export const app = new App();
`,
		});
		await runInProject(dir, () => {
			expect(findAppDeclarationFile(process.cwd())).toBe("src/index.ts");
		});
	});

	it("prefers a file with an exported instance when several declare one", async () => {
		const dir = makeProject({
			"src/index.ts": "const app = new App();\n",
			"src/app.ts": "export const app = new App();\n",
		});
		await runInProject(dir, () => {
			expect(findAppDeclarationFile(process.cwd())).toBe("src/app.ts");
		});
	});

	it("prefers a file declaring a RouterGroup over the listener-only server.ts", async () => {
		const dir = makeProject({
			"server.ts": `import { app } from "./src/index";

app.listen(3000);
`,
			"src/index.ts": `import { app } from "./app-core";

export const apiv1 = app.group("/api/v1");
`,
		});
		await runInProject(dir, () => {
			expect(findAppDeclarationFile(process.cwd())).toBe("src/index.ts");
		});
	});

	it("falls back to the entry file when nothing declares an App", async () => {
		const dir = makeProject({
			"server.ts": "export const x = 1;\n",
			"src/index.ts": "export const y = 2;\n",
		});
		await runInProject(dir, () => {
			expect(findAppDeclarationFile(process.cwd())).toBe("server.ts");
		});
	});

	it("returns null when no candidate exists", async () => {
		const dir = makeProject({ "package.json": "{}" });
		await runInProject(dir, () => {
			expect(findAppDeclarationFile(process.cwd())).toBeNull();
		});
	});
});

describe("project: findInsertionIndex", () => {
	it("pattern 1: inserts before app.listen", () => {
		const src = "const app = new App();\napp.listen(3000);\n";
		const { index, before } = findInsertionIndex(src);
		expect(src.slice(index)).toStartWith("app.listen");
		expect(before).toBe("app.listen(");
	});

	it("pattern 2: inserts before route handlers", () => {
		const src = "const app = new App();\napp.get('/', (ctx) => ctx.json({}));\n";
		const { index, before } = findInsertionIndex(src);
		expect(src.slice(index)).toStartWith("app.get(");
		expect(before).toBe("app.get(");
	});

	it("pattern 3: inserts before export default app", () => {
		const src = "const app = new App();\nexport default app;\n";
		const { index, before } = findInsertionIndex(src);
		expect(src.slice(index)).toStartWith("export default app");
		expect(before).toBe("export default app");
	});

	it("pattern 4: inserts after a balanced export const app declaration", () => {
		const src = "export const app = new App({\n  port: 3000,\n});\n";
		const { index, before } = findInsertionIndex(src);
		expect(before).toBe("");
		expect(src.slice(0, index)).toContain("port: 3000");
		expect(src.slice(index)).toBe("\n");
	});

	it("fallback: appends at the end", () => {
		const src = "export const somethingElse = 1;";
		const { index, before } = findInsertionIndex(src);
		expect(index).toBe(src.length);
		expect(before).toBe("");
	});

	it("renamed instance: anchors on apiV1.listen", () => {
		const src = "const apiV1 = new App();\napiV1.listen(3000);\n";
		const { index, before } = findInsertionIndex(src, "apiV1");
		expect(src.slice(index)).toStartWith("apiV1.listen");
		expect(before).toBe("apiV1.listen(");
	});

	it("renamed instance: falls back to its own declaration", () => {
		const src = "export const apiV1 = new App();\n";
		const { index, before } = findInsertionIndex(src, "apiV1");
		expect(before).toBe("");
		expect(src.slice(index)).toBe("\n");
	});

	it("renamed instance: ignores a different instance's listen", () => {
		const src = "const apiV1 = new App();\napiV1.listen(3000);\n";
		const { index } = findInsertionIndex(src, "apiV2");
		expect(index).toBe(src.length);
	});
});

describe("project: findAppDeclEnd with instance name", () => {
	it("returns the end of the apiV1 declaration", () => {
		const src = "const apiV1 = new App({\n  handleSignals: false,\n});\napiV1.listen();";
		const end = findAppDeclEnd(src, "apiV1");
		expect(end).not.toBeNull();
		expect(src.slice(end ?? 0)).toBe("\napiV1.listen();");
	});

	it("returns null for an instance that is not declared", () => {
		expect(findAppDeclEnd("const app = new App();", "apiV1")).toBeNull();
	});
});

describe("project: escapeRegExp", () => {
	it("escapes regex metacharacters", () => {
		expect(new RegExp(`${escapeRegExp("a.b")}x`).test("a.bx")).toBe(true);
		expect(new RegExp(`${escapeRegExp("a.b")}x`).test("aabx")).toBe(false);
	});
});

describe("project: findAppDeclEnd", () => {
	it("returns index past new App(...) with options", () => {
		const src = "const app = new App({\n  port: 3000,\n});\napp.listen();";
		const end = findAppDeclEnd(src);
		expect(end).not.toBeNull();
		expect(src.slice(end)).toBe("\napp.listen();");
	});

	it("returns null without an app declaration", () => {
		expect(findAppDeclEnd("export const other = 1;")).toBeNull();
	});
});

describe("project: ensureImport", () => {
	it("adds after the last import", () => {
		const src = 'import { App } from "@buntok/core";\nconst app = new App();\n';
		const out = ensureImport(src, 'import { UserController } from "@/modules/user";');
		expect(out).toBe(
			'import { App } from "@buntok/core";\nimport { UserController } from "@/modules/user";\nconst app = new App();\n',
		);
	});

	it("does not duplicate an existing import", () => {
		const src = 'import { App } from "@buntok/core";';
		const out = ensureImport(src, 'import { App } from "@buntok/core";');
		expect(out).toBe(src);
	});

	it("unshifts when there are no imports", () => {
		const out = ensureImport("const app = 1;", 'import { App } from "@buntok/core";');
		expect(out).toStartWith('import { App } from "@buntok/core";');
	});
});

describe("project: collectImportedControllers", () => {
	const SRC = `import { App } from "@buntok/core";
import { UserController } from "@/modules/user";
import { CategoryController } from "@/modules/category";
import { Other } from "@/utils/other";

const app = new App();
app.registerController(CategoryController);
app.registerController([UserController]);
`;

	it("collects controllers imported from @/modules/*", () => {
		expect(collectImportedControllers(SRC, false).sort()).toEqual([
			"CategoryController",
			"UserController",
		]);
	});

	it("excludes controllers already registered", () => {
		expect(collectImportedControllers(SRC, true)).toEqual([]);
	});

	it("keeps unregistered controllers when excluding", () => {
		const src = `import { UserController } from "@/modules/user";
const app = new App();
app.registerController(UserController);`;
		expect(collectImportedControllers(src, false)).toEqual(["UserController"]);
		expect(collectImportedControllers(src, true)).toEqual([]);
	});
});

describe("project: formatWithBiome", () => {
	it("spawns the local biome stub and reports success", async () => {
		const dir = makeProject({ "tmp.ts": "export const a=1;" });
		await runInProject(dir, () => {
			expect(formatWithBiome(["tmp.ts"])).toBe(true);
		});
	});

	it("skips silently when biome is not installed locally", async () => {
		const dir = makeProject({ "tmp.ts": "export const a=1;" });
		rmSync(join(dir, "node_modules", ".bin", "biome"));
		await runInProject(dir, () => {
			expect(formatWithBiome(["tmp.ts"])).toBe(false);
		});
	});

	it("returns false for an empty path list", () => {
		expect(formatWithBiome([])).toBe(false);
	});
});
