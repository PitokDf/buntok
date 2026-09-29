import { afterAll, describe, expect, it } from "bun:test";
import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { dbCommand } from "../../src/cli/commands/db";
import { makeFactoryCommand } from "../../src/cli/commands/make-factory";
import { makeSeederCommand } from "../../src/cli/commands/make-seeder";
import { makeTestCommand } from "../../src/cli/commands/make-test";
import { makeTestE2ECommand } from "../../src/cli/commands/make-test-e2e";
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

describe("make:test", () => {
	it("fails with a hint when no service exists", async () => {
		const dir = makeProject({ "package.json": PKG });

		const { output, exitCode } = await runCapturing(dir, () =>
			makeTestCommand("user", []),
		);

		expect(exitCode).toBe(1);
		expect(output).toContain("No service found");
		expect(output).toContain("buntok create user --service");
		expect(projectHas(dir, "tests/user.spec.ts")).toBe(false);
	});

	it("generates the standalone variant for a service without constructor", async () => {
		const dir = makeProject({
			"package.json": PKG,
			"src/modules/user/user.service.ts": `export class UserService {
  async getAll(): Promise<any[]> {
    return [];
  }
}
`,
		});

		await runInProject(dir, () => makeTestCommand("user", []));

		const test = readProject(dir, "tests/user.spec.ts");
		expect(test).toContain("new UserService();");
		expect(test).not.toContain("mockRepo");
	});

	it("generates the repo-mocked variant for an injected service", async () => {
		const dir = makeProject({
			"package.json": PKG,
			"src/modules/user/user.service.ts": `export class UserService {
  constructor(private readonly userRepo: any) {}
}
`,
			"src/modules/user/user.repository.ts": "export class UserRepository {}",
		});

		await runInProject(dir, () => makeTestCommand("user", []));

		const test = readProject(dir, "tests/user.spec.ts");
		expect(test).toContain("mockRepo.findAll");
		expect(test).toContain("as unknown as UserRepository");
	});

	it("refuses to overwrite an existing test without --force", async () => {
		const dir = makeProject({
			"package.json": PKG,
			"src/modules/user/user.service.ts": "export class UserService {}",
			"tests/user.spec.ts": "// existing\n",
		});

		const { output, exitCode } = await runCapturing(dir, () =>
			makeTestCommand("user", []),
		);

		expect(exitCode).toBe(1);
		expect(output).toContain("--force");
		expect(readProject(dir, "tests/user.spec.ts")).toBe("// existing\n");

		await runInProject(dir, () => makeTestCommand("user", ["--force"]));
		expect(readProject(dir, "tests/user.spec.ts")).not.toBe("// existing\n");
	});
});

describe("make:test:e2e", () => {
	it("writes to tests/e2e with a pluralized route", async () => {
		const dir = makeProject({ "package.json": PKG });

		await runInProject(dir, () => makeTestE2ECommand("category", []));

		const test = readProject(dir, "tests/e2e/category.e2e.spec.ts");
		expect(test).toContain('"/categories"');
		expect(test).toContain('app.request("/categories"');
	});

	it("refuses to overwrite without --force", async () => {
		const dir = makeProject({
			"package.json": PKG,
			"tests/e2e/user.e2e.spec.ts": "// existing\n",
		});

		const { exitCode } = await runCapturing(dir, () =>
			makeTestE2ECommand("user", []),
		);

		expect(exitCode).toBe(1);
		expect(readProject(dir, "tests/e2e/user.e2e.spec.ts")).toBe("// existing\n");
	});
});

describe("make:seeder --factory", () => {
	it("generates the seeder and creates the missing factory", async () => {
		const dir = makeProject({ "package.json": PKG });

		await runInProject(dir, () => makeSeederCommand("user", ["--factory"]));

		expect(projectHas(dir, "src/db/seeders/user.seeder.ts")).toBe(true);
		expect(projectHas(dir, "src/factories/user.factory.ts")).toBe(true);
		const seeder = readProject(dir, "src/db/seeders/user.seeder.ts");
		expect(seeder).toContain(`from "@/factories/user.factory"`);
		expect(seeder).toContain("UserFactory");
	});

	it("generates a plain seeder without creating a factory", async () => {
		const dir = makeProject({ "package.json": PKG });

		await runInProject(dir, () => makeSeederCommand("user", []));

		expect(projectHas(dir, "src/db/seeders/user.seeder.ts")).toBe(true);
		expect(projectHas(dir, "src/factories/user.factory.ts")).toBe(false);
	});
});

describe("make:factory model awareness", () => {
	it("fills the factory from the Prisma model", async () => {
		const dir = makeProject({
			"package.json": PKG,
			"prisma/schema.prisma": `model Note {
  id    String @id @default(cuid())
  title String
  email String
}
`,
		});

		await runInProject(dir, () => makeFactoryCommand("note", []));

		const factory = readProject(dir, "src/factories/note.factory.ts");
		expect(factory).toContain("faker.");
		expect(factory).toContain("faker.internet.email()");
		expect(factory).toContain("@prisma/client");
	});

	it("builds from --fields when there is no schema", async () => {
		const dir = makeProject({ "package.json": PKG });

		await runInProject(dir, () =>
			makeFactoryCommand("task", ["--fields", "title:string,done:boolean"]),
		);

		const factory = readProject(dir, "src/factories/task.factory.ts");
		expect(factory).toContain("title:");
		expect(factory).toContain("done:");
	});
});

describe("db seed fallback", () => {
	it("runs local seeders when the ORM has no seed config", async () => {
		const dir = makeProject({
			"package.json": PKG,
			"prisma/schema.prisma": "model A { id String @id }",
			"src/db/seeders/user.seeder.ts": "export {};",
		});

		const { output, exitCode } = await runCapturing(dir, () =>
			dbCommand(["seed", "--dry-run"]),
		);

		expect(exitCode).toBe(0);
		expect(output).toContain("local seeders from src/db/seeders");
		expect(output).toContain("Detected ORM: prisma");
	});

	it("delegates to the ORM when package.json defines a seed script", async () => {
		const dir = makeProject({
			"package.json": JSON.stringify({
				name: "fixture-app",
				dependencies: { "@prisma/client": "5.0.0" },
				prisma: { seed: "bun run prisma/seed.ts" },
			}),
			"prisma/schema.prisma": "model A { id String @id }",
			"src/db/seeders/user.seeder.ts": "export {};",
		});

		const { output } = await runCapturing(dir, () =>
			dbCommand(["seed", "--dry-run"]),
		);

		expect(output).toContain("npx prisma seed");
		expect(output).not.toContain("local seeders");
	});

	it("uses the ORM command when there is no local seeders directory", async () => {
		const dir = makeProject({
			"package.json": PKG,
			"prisma/schema.prisma": "model A { id String @id }",
		});

		const { output } = await runCapturing(dir, () =>
			dbCommand(["seed", "--dry-run"]),
		);

		expect(output).toContain("npx prisma seed");
		expect(output).not.toContain("local seeders");
	});
});

describe("CLI routing (subprocess)", () => {
	const CLI = join(import.meta.dir, "..", "..", "src", "cli", "index.ts");

	function runCli(dir: string, args: string[]) {
		const r = spawnSync(process.execPath, [CLI, ...args], {
			cwd: dir,
			encoding: "utf-8",
		});
		return { code: r.status, out: `${r.stdout ?? ""}${r.stderr ?? ""}` };
	}

	it("routes create --schema --fields and writes the schema", () => {
		const dir = makeProject({ "package.json": PKG });

		const { code, out } = runCli(dir, [
			"create",
			"note",
			"--schema",
			"--fields",
			"title:string",
		]);

		expect(code).toBe(0);
		expect(out).toContain("Schema");
		expect(projectHas(dir, "src/modules/note/note.schema.ts")).toBe(true);
		expect(readProject(dir, "src/modules/note/note.schema.ts")).toContain(
			"title: z.string()",
		);
	});

	it("rejects create without an entity name", () => {
		const dir = makeProject({ "package.json": PKG });

		const { code, out } = runCli(dir, ["create"]);

		expect(code).toBe(1);
		expect(out).toContain("entity name is required");
	});

	it("rejects unknown commands with a hint", () => {
		const dir = makeProject({ "package.json": PKG });

		const { code, out } = runCli(dir, ["make:testt", "user"]);

		expect(code).toBe(1);
		expect(out).toContain("Unknown command");
		expect(out).toContain("Did you mean");
	});
});
