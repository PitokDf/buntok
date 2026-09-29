import { afterAll, describe, expect, it } from "bun:test";
import { writeFileSync } from "node:fs";
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

const SERVICE = `import { Dependencies, NotFoundError } from "@buntok/core";
import { UserRepository } from "./user.repository";

@Dependencies(UserRepository)
export class UserService {
  constructor(private readonly userRepository: UserRepository) {}
}
`;

describe("create: cross-generator awareness", () => {
	it("--controller next to an existing service wires the container", async () => {
		const dir = makeProject({
			"package.json": PKG,
			"src/index.ts": INDEX_LISTEN,
			"src/modules/user/user.service.ts": SERVICE,
		});

		await runInProject(dir, () =>
			createCommand("user", ["--prisma", "--controller"]),
		);

		const index = readProject(dir, "src/index.ts");
		expect(index).toContain('import { App, Container } from "@buntok/core";');
		expect(index).toContain("const container = new Container();");
		expect(index).toContain("container.scan([UserController]);");
		expect(index).toContain("app.setContainer(container);");
		expect(index).toContain("app.registerController([UserController]);");
		// order: container declared after app, before its usages
		expect(index.indexOf("const app = new App();")).toBeLessThan(
			index.indexOf("const container = new Container();"),
		);
		expect(index.indexOf("const container = new Container();")).toBeLessThan(
			index.indexOf("container.scan("),
		);
	});

	it("--controller without a service stays on the plain flow (no Container)", async () => {
		const dir = makeProject({
			"package.json": PKG,
			"src/index.ts": INDEX_LISTEN,
		});

		await runInProject(dir, () =>
			createCommand("user", ["--prisma", "--controller"]),
		);

		const index = readProject(dir, "src/index.ts");
		expect(index).not.toContain("Container");
		const controller = readProject(dir, "src/modules/user/user.controller.ts");
		expect(controller).not.toContain("@Dependencies");
	});

	it("--service next to an existing repository generates the wired template", async () => {
		const dir = makeProject({
			"package.json": PKG,
			"src/index.ts": INDEX_LISTEN,
			"src/modules/user/user.repository.ts": "export class UserRepository {}",
		});

		await runInProject(dir, () =>
			createCommand("user", ["--prisma", "--service"]),
		);

		const service = readProject(dir, "src/modules/user/user.service.ts");
		expect(service).toContain("@Dependencies(UserRepository)");
		expect(service).toContain("constructor(private readonly");
	});

	it("--service without a repository generates the standalone template", async () => {
		const dir = makeProject({
			"package.json": PKG,
			"src/index.ts": INDEX_LISTEN,
		});

		await runInProject(dir, () =>
			createCommand("user", ["--prisma", "--service"]),
		);

		const service = readProject(dir, "src/modules/user/user.service.ts");
		expect(service).not.toContain("@Dependencies");
		expect(service).toContain("export class UserService");
	});
});

describe("create: template style (--base / auto-detect)", () => {
	it("--base generates Base* variants", async () => {
		const dir = makeProject({
			"package.json": PKG,
			"src/index.ts": INDEX_LISTEN,
		});

		await runInProject(dir, () =>
			createCommand("user", ["--prisma", "--base"]),
		);

		expect(readProject(dir, "src/modules/user/user.service.ts")).toContain(
			"extends BaseService",
		);
		expect(readProject(dir, "src/modules/user/user.controller.ts")).toContain(
			"extends BaseController",
		);
		expect(readProject(dir, "src/modules/user/user.repository.ts")).toContain(
			"extends BaseRepository",
		);
	});

	it("default is plain (no Base* extensions)", async () => {
		const dir = makeProject({
			"package.json": PKG,
			"src/index.ts": INDEX_LISTEN,
		});

		await runInProject(dir, () => createCommand("user", ["--prisma"]));

		expect(readProject(dir, "src/modules/user/user.service.ts")).not.toContain(
			"extends BaseService",
		);
		expect(
			readProject(dir, "src/modules/user/user.controller.ts"),
		).not.toContain("extends BaseController");
		expect(
			readProject(dir, "src/modules/user/user.controller.ts"),
		).toContain("@Dependencies(UserService)");
	});

	it("detects base style from an existing service on disk", async () => {
		const dir = makeProject({
			"package.json": PKG,
			"src/index.ts": INDEX_LISTEN,
			"src/modules/user/user.service.ts": `import { BaseService } from "@buntok/core";
export class UserService extends BaseService<any> {}
`,
		});

		await runInProject(dir, () =>
			createCommand("user", ["--prisma", "--controller"]),
		);

		expect(readProject(dir, "src/modules/user/user.controller.ts")).toContain(
			"extends BaseController",
		);
	});
});

describe("create: barrel merge", () => {
	it("appends only the missing exports to an existing barrel", async () => {
		const dir = makeProject({
			"package.json": PKG,
			"src/index.ts": INDEX_LISTEN,
			"src/modules/user/index.ts": `export { UserService } from "./user.service";
`,
		});

		await runInProject(dir, () =>
			createCommand("user", ["--prisma", "--controller"]),
		);

		const barrel = readProject(dir, "src/modules/user/index.ts");
		expect(barrel).toContain(`export { UserService } from "./user.service";`);
		expect(barrel).toContain(`export { UserController } from "./user.controller";`);
		const occurrences = barrel.split(`from "./user.service"`).length - 1;
		expect(occurrences).toBe(1);
	});

	it("keeps a complete barrel byte-identical", async () => {
		const dir = makeProject({
			"package.json": PKG,
			"src/index.ts": INDEX_LISTEN,
		});
		await runInProject(dir, () => createCommand("user", ["--prisma"]));
		const before = readProject(dir, "src/modules/user/index.ts");

		await runInProject(dir, () => createCommand("user", ["--prisma"]));

		expect(readProject(dir, "src/modules/user/index.ts")).toBe(before);
	});
});

describe("create: --force", () => {
	it("regenerates files that already exist", async () => {
		const dir = makeProject({
			"package.json": PKG,
			"src/index.ts": INDEX_LISTEN,
		});
		await runInProject(dir, () => createCommand("user", ["--prisma"]));
		const servicePath = "src/modules/user/user.service.ts";
		const corrupted = `${readProject(dir, servicePath)}\n// corrupted\n`;
		writeFileSync(`${dir}/${servicePath}`, corrupted);

		await runInProject(dir, () =>
			createCommand("user", ["--prisma", "--service", "--force"]),
		);

		expect(readProject(dir, servicePath)).not.toContain("// corrupted");
	});

	it("keeps existing files without --force", async () => {
		const dir = makeProject({
			"package.json": PKG,
			"src/index.ts": INDEX_LISTEN,
			"src/modules/user/user.service.ts": "// hand-written\n",
		});

		await runInProject(dir, () => createCommand("user", ["--prisma"]));

		expect(readProject(dir, "src/modules/user/user.service.ts")).toBe(
			"// hand-written\n",
		);
	});
});

describe("create: model awareness (schema)", () => {
	it("--fields fills the schema from the flag", async () => {
		const dir = makeProject({
			"package.json": PKG,
			"src/index.ts": INDEX_LISTEN,
		});

		await runInProject(dir, () =>
			createCommand("note", ["--prisma", "--schema", "--fields", "title:string,done:boolean"]),
		);

		const schema = readProject(dir, "src/modules/note/note.schema.ts");
		expect(schema).toContain("title: z.string()");
		expect(schema).toContain("done: z.boolean()");
		expect(schema).not.toContain("TODO: Add more fields");
	});

	it("reads the Prisma model when there is no --fields flag", async () => {
		const dir = makeProject({
			"package.json": PKG,
			"src/index.ts": INDEX_LISTEN,
			"prisma/schema.prisma": `model Note {
  id    String  @id @default(cuid())
  title String
  views Int     @default(0)
}
`,
		});

		await runInProject(dir, () => createCommand("note", ["--prisma", "--schema"]));

		const schema = readProject(dir, "src/modules/note/note.schema.ts");
		expect(schema).toContain("title: z.string()");
		expect(schema).not.toContain("id:");
		expect(schema).not.toContain("views:");
		expect(schema).not.toContain("TODO: Add more fields");
	});

	it("falls back to a placeholder without model or fields", async () => {
		const dir = makeProject({
			"package.json": PKG,
			"src/index.ts": INDEX_LISTEN,
		});

		await runInProject(dir, () => createCommand("note", ["--prisma", "--schema"]));

		const schema = readProject(dir, "src/modules/note/note.schema.ts");
		expect(schema).toContain("z.string().min(1).max(100)");
	});
});

describe("create: entry awareness + route warnings", () => {
	it("registers into the candidate that actually hosts the app", async () => {
		const dir = makeProject({
			"package.json": PKG,
			"server.ts": "export const notTheApp = true;\n",
			"src/index.ts": INDEX_LISTEN,
		});

		await runInProject(dir, () =>
			createCommand("user", ["--prisma", "--controller"]),
		);

		expect(readProject(dir, "server.ts")).toBe("export const notTheApp = true;\n");
		expect(readProject(dir, "src/index.ts")).toContain(
			"app.registerController([UserController]);",
		);
	});

	it("handles an entry with an options object (container declared after App)", async () => {
		const dir = makeProject({
			"package.json": PKG,
			"src/index.ts": `import { App } from "@buntok/core";

const app = new App({
  port: 3000,
});

app.listen(env.PORT);
`,
		});

		await runInProject(dir, () => createCommand("user", ["--prisma"]));

		const index = readProject(dir, "src/index.ts");
		expect(index).toContain("});\nconst container = new Container();");
		expect(index.indexOf("const container = new Container();")).toBeLessThan(
			index.indexOf("container.scan("),
		);
	});

	it("warns about duplicate routes after generating a controller", async () => {
		const dir = makeProject({
			"package.json": PKG,
			"src/index.ts": INDEX_LISTEN,
			"src/modules/author/author.controller.ts": `import { Controller, Get } from "@buntok/core";

@Controller("/users")
export class AuthorController {
  @Get("/")
  async getAll() {}
}
`,
		});

		const { output } = await runCapturing(dir, () =>
			createCommand("user", ["--prisma", "--controller"]),
		);

		expect(output).toContain("Duplicate route: GET /users");
	});
});
