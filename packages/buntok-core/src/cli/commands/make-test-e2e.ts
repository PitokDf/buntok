import { existsSync } from "node:fs";
import fs from "node:fs/promises";
import { join } from "node:path";
import { formatWithBiome } from "../project.js";
import { resolveNames, toPascalCase } from "../utils.js";

function generateE2ETest(name: string, pascalName: string): string {
	const route = resolveNames(name).route;
	return `import { describe, it, expect } from "bun:test";
import { app } from "@/index";

describe("${pascalName} API (E2E)", () => {
  it("should return a list of items (GET /${route})", async () => {
    const response = await app.request("/${route}", {
      method: "GET",
    });

    expect(response.status).toBe(200);

    // const body = await response.json();
    // expect(Array.isArray(body)).toBe(true);
  });

  it("should create a new item (POST /${route})", async () => {
    const response = await app.request("/${route}", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        // TODO: add payload here
      }),
    });

    // expect(response.status).toBe(201);
  });

  it("should handle not found items (GET /${route}/999999)", async () => {
    const response = await app.request("/${route}/999999", {
      method: "GET",
    });

    // expect(response.status).toBe(404);
  });
});
`;
}

export async function makeTestE2ECommand(name: string, flags: string[] = []) {
	const pascalName = toPascalCase(name);
	const dryRun = flags.includes("--dry-run");
	const force = flags.includes("--force");
	console.log(
		`\n\x1b[36mScaffolding E2E Test for ${pascalName} API${dryRun ? " (dry-run)" : ""}...\x1b[0m\n`,
	);

	const testsDir = "tests/e2e";

	if (!existsSync(testsDir)) {
		if (dryRun) {
			console.log(`\x1b[90mWould create directory: ${testsDir}\x1b[0m`);
		} else {
			await fs.mkdir(testsDir, { recursive: true });
		}
	}

	const filePath = join(testsDir, `${name}.e2e.spec.ts`);

	if (existsSync(filePath) && !force) {
		console.error(
			`\x1b[31mError: E2E Test file already exists at ${filePath} (use --force to overwrite)\x1b[0m`,
		);
		process.exitCode = 1;
		return;
	}

	const content = generateE2ETest(name, pascalName);

	if (dryRun) {
		console.log(`\x1b[90mWould create file: ${filePath}\x1b[0m`);
		console.log(`\n\x1b[36m--- Generated content ---\x1b[0m\n`);
		console.log(content);
		return;
	}

	await fs.writeFile(filePath, content);

	if (formatWithBiome([filePath])) {
		console.log(
			"\x1b[90m✨ Auto-formatted generated E2E test file with Biome\x1b[0m",
		);
	}

	console.log(`\x1b[32m✓ Generated E2E test suite:\x1b[0m ${filePath}`);

	console.log(`
\x1b[36mNext steps:\x1b[0m
  Run all E2E tests:
     \x1b[33mbun test tests/e2e\x1b[0m
`);
}
