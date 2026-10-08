import { existsSync } from "node:fs";
import fs from "node:fs/promises";
import { join } from "node:path";
import { formatWithBiome } from "../project.js";
import { toPascalCase } from "../utils.js";

interface TestShape {
	/** Service constructor takes the repository as a dependency. */
	injectsRepo: boolean;
	hasRepoFile: boolean;
}

function generateTest(
	name: string,
	pascalName: string,
	shape: TestShape,
): string {
	const repoImport = shape.hasRepoFile
		? `import { ${pascalName}Repository } from "@/modules/${name}/${name}.repository";\n`
		: "";
	const repoCast = shape.hasRepoFile
		? `mockRepo as unknown as ${pascalName}Repository`
		: `mockRepo as any`;

	if (!shape.injectsRepo) {
		return `import { describe, it, expect, beforeEach } from "bun:test";
import { ${pascalName}Service } from "@/modules/${name}/${name}.service";

describe("${pascalName}Service", () => {
  let service: ${pascalName}Service;

  beforeEach(() => {
    service = new ${pascalName}Service();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  it("should return an array of items", async () => {
    const result = await service.getAll();
    expect(result).toBeInstanceOf(Array);
  });

  it("should return a single item by id", async () => {
    const result = await service.getById(1);
    expect(result).toHaveProperty("id", 1);
  });

  // TODO: Add more business logic tests here
});
`;
	}

	return `import { describe, it, expect, beforeEach, mock } from "bun:test";
import { ${pascalName}Service } from "@/modules/${name}/${name}.service";
${repoImport}
describe("${pascalName}Service", () => {
  let service: ${pascalName}Service;
  let mockRepo: any;

  beforeEach(() => {
    // 1. Mock the repository layer
    mockRepo = {
      findAll: mock(() => Promise.resolve([])),
      findById: mock((id: number) => Promise.resolve({ id, name: "Test ${pascalName}" })),
      create: mock((data: any) => Promise.resolve({ id: 1, ...data })),
      update: mock((id: number, data: any) => Promise.resolve({ id, ...data })),
      delete: mock((id: number) => Promise.resolve({ id })),
      count: mock(() => Promise.resolve(0)),
    };

    // 2. Inject mock repo into the service
    service = new ${pascalName}Service(${repoCast});
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  it("should return an array of items", async () => {
    const result = await service.getAll();
    expect(result).toBeInstanceOf(Array);
    expect(mockRepo.findAll).toHaveBeenCalledTimes(1);
  });

  it("should return a single item by id", async () => {
    const result = await service.getById(1);
    expect(result).toHaveProperty("id", 1);
    expect(result).toHaveProperty("name", "Test ${pascalName}");
    expect(mockRepo.findById).toHaveBeenCalledWith(1);
  });

  // TODO: Add more business logic tests here
});
`;
}

export async function makeTestCommand(name: string, flags: string[] = []) {
	const pascalName = toPascalCase(name);
	const dryRun = flags.includes("--dry-run");
	const force = flags.includes("--force");
	console.log(`\n\x1b[36mScaffolding Unit Test for ${pascalName}${dryRun ? " (dry-run)" : ""}...\x1b[0m\n`);

	// Stack awareness: the test must match what actually exists on disk
	const servicePath = join("src", "modules", name, `${name}.service.ts`);
	const repoPath = join("src", "modules", name, `${name}.repository.ts`);
	const hasService = existsSync(servicePath);
	const hasRepo = existsSync(repoPath);

	if (!hasService) {
		console.error(
			`\x1b[31mError: No service found at ${servicePath} - the unit test would import a file that does not exist.\x1b[0m`,
		);
		console.error(
			`  Generate it first: \x1b[36mbuntok create ${name} --service\x1b[0m`,
		);
		process.exitCode = 1;
		return;
	}

	const serviceSource = await fs.readFile(servicePath, "utf-8");
	const shape: TestShape = {
		injectsRepo: /constructor\s*\(/.test(serviceSource),
		hasRepoFile: hasRepo,
	};

	const testsDir = "tests";

	if (!existsSync(testsDir)) {
		if (dryRun) {
			console.log(`\x1b[90mWould create directory: ${testsDir}\x1b[0m`);
		} else {
			await fs.mkdir(testsDir, { recursive: true });
		}
	}

	const filePath = join(testsDir, `${name}.spec.ts`);

	if (existsSync(filePath) && !force) {
		console.error(
			`\x1b[31mError: Test file already exists at ${filePath} (use --force to overwrite)\x1b[0m`,
		);
		process.exitCode = 1;
		return;
	}

	const content = generateTest(name, pascalName, shape);

	if (dryRun) {
		console.log(`\x1b[90mWould create file: ${filePath}\x1b[0m`);
		console.log(`\n\x1b[36m--- Generated content ---\x1b[0m\n`);
		console.log(content);
		return;
	}

	await fs.writeFile(filePath, content);

	if (formatWithBiome([filePath])) {
		console.log(
			"\x1b[90m✨ Auto-formatted generated test file with Biome\x1b[0m",
		);
	}

	console.log(`\x1b[32m✓ Generated test suite:\x1b[0m ${filePath}`);

	console.log(`
\x1b[36mNext steps:\x1b[0m
  Run your test suite instantly using Bun's native test runner:
     \x1b[33mbun test\x1b[0m
     \x1b[33mbun test --watch\x1b[0m  (For TDD / Live Reload)
`);
}
