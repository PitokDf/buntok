import { afterAll, describe, expect, it } from "bun:test";
import { createCommand } from "../../src/cli/commands/create";
import {
	cleanupProjects,
	makeProject,
	projectHas,
	readProject,
	runCapturing,
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

describe("create: scaffold layout (server.ts + declaration file)", () => {
	const SERVER = `import { app } from "./src/index";
import { env } from "./src/env";

app.listen(env.PORT);
`;
	const INDEX = `import { App } from "@buntok/core";

export const app = new App();
`;

	it("registers in the App declaration file, never in listener-only server.ts", async () => {
		const dir = makeProject({
			"package.json": PKG,
			"server.ts": SERVER,
			"src/index.ts": INDEX,
		});

		await runInProject(dir, () =>
			createCommand("user", ["--prisma", "--controller"]),
		);

		expect(readProject(dir, "server.ts")).toBe(SERVER);
		expect(readProject(dir, "src/index.ts")).toBe(
			`import { App } from "@buntok/core";
import { UserController } from "@/modules/user";

export const app = new App();
app.registerController([UserController]);

`,
		);
	});

	it("prefers src/app.ts when it hosts the exported instance", async () => {
		const dir = makeProject({
			"package.json": PKG,
			"server.ts": SERVER,
			"src/index.ts": `export { app } from "./app";\n`,
			"src/app.ts": `import { App } from "@buntok/core";

export const app = new App();
`,
		});

		await runInProject(dir, () =>
			createCommand("user", ["--prisma", "--controller"]),
		);

		expect(readProject(dir, "server.ts")).toBe(SERVER);
		expect(readProject(dir, "src/index.ts")).toBe(`export { app } from "./app";\n`);
		expect(readProject(dir, "src/app.ts")).toContain(
			"app.registerController([UserController]);",
		);
	});
});

describe("create: renamed app instance", () => {
	const INDEX = `import { App } from "@buntok/core";

export const apiV1 = new App();

apiV1.listen(3000);
`;

	it("registers via the detected instance name", async () => {
		const dir = makeProject({ "package.json": PKG, "src/index.ts": INDEX });

		await runInProject(dir, () =>
			createCommand("user", ["--prisma", "--controller"]),
		);

		expect(readProject(dir, "src/index.ts")).toBe(
			`import { App } from "@buntok/core";
import { UserController } from "@/modules/user";

export const apiV1 = new App();

apiV1.registerController([UserController]);

apiV1.listen(3000);
`,
		);
	});

	it("second run stays idempotent for the renamed instance", async () => {
		const dir = makeProject({ "package.json": PKG, "src/index.ts": INDEX });

		await runInProject(dir, () =>
			createCommand("user", ["--prisma", "--controller"]),
		);
		const once = readProject(dir, "src/index.ts");
		await runInProject(dir, () =>
			createCommand("user", ["--prisma", "--controller"]),
		);

		expect(readProject(dir, "src/index.ts")).toBe(once);
	});
});

describe("create: multiple app instances", () => {
	const MULTI = `import { App } from "@buntok/core";

export const apiV1 = new App();
export const apiV2 = new App();

apiV1.listen(3000);
apiV2.listen(4000);
`;

	// The prompt only appears on a TTY; force the non-interactive path so
	// tests exercise the CI fallback instead of waiting on stdin.
	const withForcedNoTty = async <T>(fn: () => Promise<T>): Promise<T> => {
		const stdin = process.stdin as { isTTY?: boolean };
		const original = stdin.isTTY;
		stdin.isTTY = false;
		try {
			return await fn();
		} finally {
			stdin.isTTY = original;
		}
	};

	it("--app apiV2 registers only into apiV2", async () => {
		const dir = makeProject({ "package.json": PKG, "src/index.ts": MULTI });

		await runInProject(dir, () =>
			createCommand("user", ["--prisma", "--controller", "--app", "apiV2"]),
		);

		const index = readProject(dir, "src/index.ts");
		expect(index).toContain("apiV2.registerController([UserController]);");
		expect(index).not.toContain("apiV1.registerController");
		expect(index).toContain("apiV1.listen(3000);");
	});

	it("unknown --app fails with exit code 1 and writes nothing", async () => {
		const dir = makeProject({ "package.json": PKG, "src/index.ts": MULTI });

		const exit = await runInProject(dir, () =>
			createCommand("user", ["--prisma", "--controller", "--app", "apiV9"]),
		);

		expect(exit).toBe(1);
		expect(readProject(dir, "src/index.ts")).toBe(MULTI);
		expect(projectHas(dir, "src/modules/user")).toBe(false);
	});

	it("without --app on a non-TTY: warns and uses the default instance", async () => {
		const dir = makeProject({ "package.json": PKG, "src/index.ts": MULTI });

		const run = await withForcedNoTty(() =>
			runCapturing(dir, () => createCommand("user", ["--prisma", "--controller"])),
		);

		expect(run.exitCode).toBe(0);
		expect(run.output).toContain("multiple App instances");
		expect(run.output).toContain("--app <name>");
		const index = readProject(dir, "src/index.ts");
		expect(index).toContain("apiV1.registerController([UserController]);");
		expect(index).not.toContain("apiV2.registerController");
	});
});

describe("create: RouterGroup instance (--app <group>)", () => {
	const GROUPS = `import { App } from "@buntok/core";

export const app = new App();
const apiv1 = app.group("/api/v1");
const apiv2 = app.group("/api/v2");

app.listen(3000);
`;

	it("--app apiv1 registers into the group, leaving the others untouched", async () => {
		const dir = makeProject({ "package.json": PKG, "src/index.ts": GROUPS });

		await runInProject(dir, () =>
			createCommand("user", ["--prisma", "--controller", "--app", "apiv1"]),
		);

		expect(readProject(dir, "src/index.ts")).toBe(
			`import { App } from "@buntok/core";
import { UserController } from "@/modules/user";

export const app = new App();
const apiv1 = app.group("/api/v1");
apiv1.registerController([UserController]);

const apiv2 = app.group("/api/v2");

app.listen(3000);
`,
		);
	});

	it("container flow attaches the container to the owning App, not the group", async () => {
		const dir = makeProject({ "package.json": PKG, "src/index.ts": GROUPS });

		await runInProject(dir, () =>
			createCommand("user", ["--prisma", "--app", "apiv1"]),
		);

		const index = readProject(dir, "src/index.ts");
		expect(index).toBe(
			`import { App, Container } from "@buntok/core";
import { UserController } from "@/modules/user";

export const app = new App();
const container = new Container();
const apiv1 = app.group("/api/v1");
container.scan([UserController]);

app.setContainer(container);

apiv1.registerController([UserController]);

const apiv2 = app.group("/api/v2");

app.listen(3000);
`,
		);
		expect(index).not.toContain("apiv1.setContainer");
		expect(index).not.toContain("apiv2.setContainer");
		expect(index).not.toContain("apiv2.registerController");
	});

	it("running twice is idempotent (already registered)", async () => {
		const dir = makeProject({ "package.json": PKG, "src/index.ts": GROUPS });

		await runInProject(dir, () =>
			createCommand("user", ["--prisma", "--controller", "--app", "apiv1"]),
		);
		const once = readProject(dir, "src/index.ts");

		const run = await runCapturing(dir, () =>
			createCommand("user", ["--prisma", "--controller", "--app", "apiv1"]),
		);

		expect(run.output).toContain("already registered");
		expect(readProject(dir, "src/index.ts")).toBe(once);
	});

	it("unknown --app lists group labels and fails with exit code 1", async () => {
		const dir = makeProject({ "package.json": PKG, "src/index.ts": GROUPS });

		const run = await runCapturing(dir, () =>
			createCommand("user", ["--prisma", "--controller", "--app", "apiv9"]),
		);

		expect(run.exitCode).toBe(1);
		expect(run.output).toContain("apiv1 (group /api/v1)");
		expect(run.output).toContain("apiv2 (group /api/v2)");
		expect(readProject(dir, "src/index.ts")).toBe(GROUPS);
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
