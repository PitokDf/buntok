import { resolve, join } from "node:path";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { toPascalCase, toSnakeCase } from "../utils.js";

function generateFactoryTemplate(entityName: string): string {
	const className = toPascalCase(entityName) + "Factory";
	const interfaceName = toPascalCase(entityName);

	return `import { Factory } from "@buntok/core";
import { faker } from "@faker-js/faker";
import type { ${interfaceName} } from "@prisma/client";

export const ${className} = Factory.define<${interfaceName}>(() => ({
  // TODO: Define your factory fields here
  // Example:
  // id: faker.number.int({ max: 10000 }),
  // name: faker.person.fullName(),
  // email: faker.internet.email(),
  // role: faker.helpers.arrayElement(["user", "admin"]),
}));
`;
}

export async function makeFactoryCommand(entityName: string, flags: string[]): Promise<void> {
	const targetDir = process.cwd();
	const isDryRun = flags.includes("--dry-run");

	// Resolve paths
	const modulesDir = resolve(targetDir, "src", "modules");
	const factoryDir = resolve(targetDir, "src", "factories");

	// Ensure factories directory exists
	if (!existsSync(factoryDir)) {
		if (!isDryRun) {
			mkdirSync(factoryDir, { recursive: true });
		}
		console.log(`Created directory: src/factories/`);
	}

	const fileName = `${toSnakeCase(entityName)}.factory.ts`;
	const filePath = join(factoryDir, fileName);
	const content = generateFactoryTemplate(entityName);

	if (isDryRun) {
		console.log(`\n\x1b[36m[DRY RUN] Would create:\x1b[0m`);
		console.log(`  ${filePath}`);
		console.log(`\n\x1b[36mContent:\x1b[0m`);
		console.log(content);
		return;
	}

	// Check if file already exists
	if (existsSync(filePath)) {
		console.error(`\x1b[31mError: Factory file already exists: ${filePath}\x1b[0m`);
		process.exitCode = 1;
		return;
	}

	// Write factory file
	writeFileSync(filePath, content, "utf-8");
	console.log(`Created: src/factories/${fileName}`);

	// Print usage hint
	const className = toPascalCase(entityName) + "Factory";
	console.log(`\n\x1b[36mUsage:\x1b[0m`);
	console.log(`  import { ${className} } from "@/factories/${fileName.replace(".ts", "")}";`);
	console.log(``);
	console.log(`  const user = await ${className}.create();`);
	console.log(`  const users = await ${className}.createMany(10);`);
	console.log(`  const admin = await ${className}.create({ role: "admin" });`);
}
