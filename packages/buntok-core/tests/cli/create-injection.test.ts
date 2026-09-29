import { afterAll, describe, expect, it } from "bun:test";
import { createCommand } from "../../src/cli/commands/create";
import {
	cleanupProjects,
	makeProject,
	projectHas,
	readProject,
	runInProject,
} from "./helpers";

afterAll(cleanupProjects);

const PKG = JSON.stringify(
	{
		name: "fixture-app",
		version: "0.0.0",
		dependencies: { "@buntok/core": "2.2.2", "@prisma/client": "5.0.0" },
	},
	null,
	2,
);

const INDEX_LISTEN = `import { App } from "@buntok/core";

const app = new App();

app.listen(3000);
`;

describe("create: module files", () => {
	it("full create generates repo, service, controller, schema and barrel", async () => {
		const dir = makeProject({
			"package.json": PKG,
			"src/index.ts": INDEX_LISTEN,
		});

		const exit = await runInProject(dir, () => createCommand("user", ["--prisma"]));

		expect(exit).toBe(0);
		expect(projectHas(dir, "src/modules/user/user.repository.ts")).toBe(true);
		expect(projectHas(dir, "src/modules/user/user.service.ts")).toBe(true);
		expect(projectHas(dir, "src/modules/user/user.controller.ts")).toBe(true);
		expect(projectHas(dir, "src/modules/user/user.schema.ts")).toBe(true);
		const barrel = readProject(dir, "src/modules/user/index.ts");
		expect(barrel).toContain(`export { UserRepository } from "./user.repository";`);
		expect(barrel).toContain(`export { UserService } from "./user.service";`);
		expect(barrel).toContain(`export { UserController } from "./user.controller";`);
		expect(barrel).toContain(`export { CreateUserSchema, UpdateUserSchema }`);
		expect(readProject(dir, "src/modules/user/user.service.ts")).toContain(
			"class UserService",
		);
	});

	it("second run is idempotent: existing files stay byte-identical", async () => {
		const dir = makeProject({
			"package.json": PKG,
			"src/index.ts": INDEX_LISTEN,
		});

		await runInProject(dir, () => createCommand("user", ["--prisma"]));
		const before = {
			repo: readProject(dir, "src/modules/user/user.repository.ts"),
			service: readProject(dir, "src/modules/user/user.service.ts"),
			controller: readProject(dir, "src/modules/user/user.controller.ts"),
			barrel: readProject(dir, "src/modules/user/index.ts"),
			index: readProject(dir, "src/index.ts"),
		};

		await runInProject(dir, () => createCommand("user", ["--prisma"]));

		expect(readProject(dir, "src/modules/user/user.repository.ts")).toBe(
			before.repo,
		);
		expect(readProject(dir, "src/modules/user/user.service.ts")).toBe(
			before.service,
		);
		expect(readProject(dir, "src/modules/user/user.controller.ts")).toBe(
			before.controller,
		);
		expect(readProject(dir, "src/modules/user/index.ts")).toBe(before.barrel);
		expect(readProject(dir, "src/index.ts")).toBe(before.index);
	});

	it("dry-run writes no files and leaves index untouched", async () => {
		const dir = makeProject({
			"package.json": PKG,
			"src/index.ts": INDEX_LISTEN,
		});

		await runInProject(dir, () =>
			createCommand("user", ["--prisma", "--dry-run"]),
		);

		expect(projectHas(dir, "src/modules/user")).toBe(false);
		expect(readProject(dir, "src/index.ts")).toBe(INDEX_LISTEN);
	});

	it("without src/index.ts: files generated, no index created", async () => {
		const dir = makeProject({ "package.json": PKG });

		await runInProject(dir, () => createCommand("user", ["--prisma"]));

		expect(projectHas(dir, "src/modules/user/user.controller.ts")).toBe(true);
		expect(projectHas(dir, "src/index.ts")).toBe(false);
	});
});

describe("create: registerController injection (non-container)", () => {
	it("fresh index: adds import and registerController array before listen", async () => {
		const dir = makeProject({
			"package.json": PKG,
			"src/index.ts": INDEX_LISTEN,
		});

		await runInProject(dir, () =>
			createCommand("user", ["--prisma", "--controller"]),
		);

		expect(readProject(dir, "src/index.ts")).toBe(
			`import { App } from "@buntok/core";
import { UserController } from "@/modules/user";

const app = new App();

app.registerController([UserController]);

app.listen(3000);
`,
		);
	});

	it("existing single registration converts to array", async () => {
		const dir = makeProject({
			"package.json": PKG,
			"src/index.ts": `import { App } from "@buntok/core";

const app = new App();

app.registerController(HelloController);

app.listen(3000);
`,
		});

		await runInProject(dir, () =>
			createCommand("user", ["--prisma", "--controller"]),
		);

		expect(readProject(dir, "src/index.ts")).toBe(
			`import { App } from "@buntok/core";
import { UserController } from "@/modules/user";

const app = new App();

app.registerController([HelloController, UserController]);

app.listen(3000);
`,
		);
	});

	it("existing registration array merges", async () => {
		const dir = makeProject({
			"package.json": PKG,
			"src/index.ts": `import { App } from "@buntok/core";

const app = new App();

app.registerController([HelloController, PostController]);

app.listen(3000);
`,
		});

		await runInProject(dir, () =>
			createCommand("user", ["--prisma", "--controller"]),
		);

		expect(readProject(dir, "src/index.ts")).toContain(
			"app.registerController([HelloController, PostController, UserController]);",
		);
	});

	it("same controller already registered: index unchanged (no import duplication)", async () => {
		const original = `import { App } from "@buntok/core";
import { UserController } from "@/modules/user";

const app = new App();

app.registerController(UserController);

app.listen(3000);
`;
		const dir = makeProject({
			"package.json": PKG,
			"src/index.ts": original,
		});

		await runInProject(dir, () =>
			createCommand("user", ["--prisma", "--controller"]),
		);

		expect(readProject(dir, "src/index.ts")).toBe(original);
	});

	it("existing controller import is not duplicated", async () => {
		const original = `import { App } from "@buntok/core";
import { UserController } from "@/modules/user";

const app = new App();

app.listen(3000);
`;
		const dir = makeProject({
			"package.json": PKG,
			"src/index.ts": original,
		});

		await runInProject(dir, () =>
			createCommand("user", ["--prisma", "--controller"]),
		);

		const index = readProject(dir, "src/index.ts");
		const occurrences = index.split("import { UserController }").length - 1;
		expect(occurrences).toBe(1);
		expect(index).toContain("app.registerController([UserController]);");
	});

	it("--controller without --service never introduces Container", async () => {
		const dir = makeProject({
			"package.json": PKG,
			"src/index.ts": INDEX_LISTEN,
		});

		await runInProject(dir, () =>
			createCommand("user", ["--prisma", "--controller"]),
		);

		const index = readProject(dir, "src/index.ts");
		expect(index).not.toContain("Container");
		expect(index).not.toContain("container.scan");
	});
});

describe("create: container flow (--service)", () => {
	it("fresh index: adds Container import, decl, scan, setContainer and register (in order)", async () => {
		const dir = makeProject({
			"package.json": PKG,
			"src/index.ts": INDEX_LISTEN,
		});

		await runInProject(dir, () => createCommand("user", ["--prisma"]));

		expect(readProject(dir, "src/index.ts")).toBe(
			`import { App, Container } from "@buntok/core";
import { UserController } from "@/modules/user";

const app = new App();
const container = new Container();

container.scan([UserController]);

app.setContainer(container);

app.registerController([UserController]);

app.listen(3000);
`,
		);
	});

	it("merge into existing scan + registerController", async () => {
		const dir = makeProject({
			"package.json": PKG,
			"src/index.ts": `import { App, Container } from "@buntok/core";

const app = new App();
const container = new Container();

container.scan([HelloController]);
app.setContainer(container);
app.registerController([HelloController]);

app.listen(3000);
`,
		});

		await runInProject(dir, () => createCommand("user", ["--prisma"]));

		expect(readProject(dir, "src/index.ts")).toBe(
			`import { App, Container } from "@buntok/core";
import { UserController } from "@/modules/user";

const app = new App();
const container = new Container();

container.scan([HelloController, UserController]);
app.setContainer(container);
app.registerController([HelloController, UserController]);

app.listen(3000);
`,
		);
	});

	it("already registered in scan: index unchanged", async () => {
		const original = `import { App, Container } from "@buntok/core";
import { UserController } from "@/modules/user";

const app = new App();
const container = new Container();

container.scan([UserController]);
app.setContainer(container);
app.registerController([UserController]);

app.listen(3000);
`;
		const dir = makeProject({
			"package.json": PKG,
			"src/index.ts": original,
		});

		await runInProject(dir, () => createCommand("user", ["--prisma"]));

		expect(readProject(dir, "src/index.ts")).toBe(original);
	});
});

describe("create: insertion fallbacks", () => {
	it("export default app: registration inserted before export", async () => {
		const dir = makeProject({
			"package.json": PKG,
			"src/index.ts": `import { App } from "@buntok/core";

const app = new App();

export default app;
`,
		});

		await runInProject(dir, () =>
			createCommand("user", ["--prisma", "--controller"]),
		);

		expect(readProject(dir, "src/index.ts")).toBe(
			`import { App } from "@buntok/core";
import { UserController } from "@/modules/user";

const app = new App();

app.registerController([UserController]);

export default app;
`,
		);
	});

	it("route handler present: registration inserted before app.get", async () => {
		const dir = makeProject({
			"package.json": PKG,
			"src/index.ts": `import { App } from "@buntok/core";

const app = new App();

app.get("/hello", () => "hi");
`,
		});

		await runInProject(dir, () =>
			createCommand("user", ["--prisma", "--controller"]),
		);

		expect(readProject(dir, "src/index.ts")).toBe(
			`import { App } from "@buntok/core";
import { UserController } from "@/modules/user";

const app = new App();

app.registerController([UserController]);

app.get("/hello", () => "hi");
`,
		);
	});
});
