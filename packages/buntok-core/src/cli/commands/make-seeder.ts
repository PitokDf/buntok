import { existsSync } from "node:fs";
import fs from "node:fs/promises";
import { join } from "node:path";
import type { ORM } from "../generators/repository.js";
import { detectORMOrNull, formatWithBiome } from "../project.js";
import { toCamelCase, toPascalCase, toSnakeCase } from "../utils.js";
import { makeFactoryCommand } from "./make-factory.js";

function generatePrismaSeeder(name: string, pascalName: string, useFactory: boolean): string {
	const delegate = toCamelCase(name);
	const factoryFile = toSnakeCase(name);
	if (useFactory) {
		return `import { prisma } from "@/lib/prisma";
import { ${pascalName}Factory } from "@/factories/${factoryFile}.factory";

export async function seed${pascalName}() {
  console.log("Seeding ${pascalName}...");

  const items = ${pascalName}Factory.buildMany(100);
  await prisma.${delegate}.createMany({ data: items });

  console.log("✓ ${pascalName} seeded successfully (100 records)");
}
`;
	}
	return `import { prisma } from "@/lib/prisma";

export async function seed${pascalName}() {
  console.log("Seeding ${pascalName}...");

  // TODO: Insert your dummy data here
  // await prisma.${delegate}.createMany({
  //   data: [
  //     { name: "Dummy 1" },
  //     { name: "Dummy 2" },
  //   ],
  // });

  console.log("✓ ${pascalName} seeded successfully");
}
`;
}

function generateDrizzleSeeder(name: string, pascalName: string, useFactory: boolean): string {
	if (useFactory) {
		return `import { db } from "@/lib/db";
import { ${name} } from "@/lib/db/schema";
import { ${pascalName}Factory } from "@/factories/${toSnakeCase(name)}.factory";

export async function seed${pascalName}() {
  console.log("Seeding ${pascalName}...");

  const items = ${pascalName}Factory.buildMany(100);
  await db.insert(${name}).values(items);

  console.log("✓ ${pascalName} seeded successfully (100 records)");
}
`;
	}
	return `import { db } from "@/lib/db";
import { ${name} } from "@/lib/db/schema";

export async function seed${pascalName}() {
  console.log("Seeding ${pascalName}...");

  // TODO: Insert your dummy data here
  // await db.insert(${name}).values([
  //   { name: "Dummy 1" },
  //   { name: "Dummy 2" },
  // ]);

  console.log("✓ ${pascalName} seeded successfully");
}
`;
}

function generateTypeORMSeeder(name: string, pascalName: string, useFactory: boolean): string {
	if (useFactory) {
		return `import { AppDataSource } from "@/lib/data-source";
import { ${pascalName} } from "@/lib/entities/${pascalName}";
import { ${pascalName}Factory } from "@/factories/${toSnakeCase(name)}.factory";

export async function seed${pascalName}() {
  console.log("Seeding ${pascalName}...");

  const repo = AppDataSource.getRepository(${pascalName});
  const items = ${pascalName}Factory.buildMany(100);
  await repo.save(items.map(item => repo.create(item)));

  console.log("✓ ${pascalName} seeded successfully (100 records)");
}
`;
	}
	return `import { AppDataSource } from "@/lib/data-source";
import { ${pascalName} } from "@/lib/entities/${pascalName}";

export async function seed${pascalName}() {
  console.log("Seeding ${pascalName}...");

  const repo = AppDataSource.getRepository(${pascalName});

  // TODO: Insert your dummy data here
  // await repo.save(repo.create({ name: "Dummy 1" }));
  // await repo.save(repo.create({ name: "Dummy 2" }));

  console.log("✓ ${pascalName} seeded successfully");
}
`;
}

function generatePlainSeeder(
	name: string,
	pascalName: string,
	useFactory: boolean,
): string {
	const factoryFile = toSnakeCase(name);
	if (useFactory) {
		return `import { ${pascalName}Factory } from "@/factories/${factoryFile}.factory";

export async function seed${pascalName}() {
  console.log("Seeding ${pascalName}...");

  const items = ${pascalName}Factory.buildMany(100);
  console.log(\`Generated \${items.length} ${name} records (no ORM detected - persist them in your own data layer)\`);

  console.log("✓ ${pascalName} seeded successfully");
}
`;
	}
	return `export async function seed${pascalName}() {
  console.log("Seeding ${pascalName}...");

  // TODO: Insert your dummy data here
  // console.log([{ name: "Dummy 1" }, { name: "Dummy 2" }]);

  console.log("✓ ${pascalName} seeded successfully");
}
`;
}

function generateSeeder(
	name: string,
	pascalName: string,
	orm: ORM | null,
	useFactory: boolean,
): string {
	if (orm === null) {
		return generatePlainSeeder(name, pascalName, useFactory);
	}
	switch (orm) {
		case "drizzle":
			return generateDrizzleSeeder(name, pascalName, useFactory);
		case "typeorm":
			return generateTypeORMSeeder(name, pascalName, useFactory);
		case "prisma":
		default:
			return generatePrismaSeeder(name, pascalName, useFactory);
	}
}

export async function makeSeederCommand(name: string, flags: string[] = []) {
	const pascalName = toPascalCase(name);
	const orm = detectORMOrNull();
	const useFactory = flags.includes("--factory");
	const dryRun = flags.includes("--dry-run");
	const force = flags.includes("--force");
	console.log(`\n\x1b[36mScaffolding Seeder for ${pascalName} (orm: ${orm ?? "plain"}${useFactory ? ", using factory" : ""}${dryRun ? ", dry-run" : ""})...\x1b[0m\n`);

	const seederDir = "src/db/seeders";

	if (!existsSync(seederDir)) {
		if (dryRun) {
			console.log(`\x1b[90mWould create directory: ${seederDir}\x1b[0m`);
		} else {
			await fs.mkdir(seederDir, { recursive: true });
		}
	}

	const filePath = join(seederDir, `${name}.seeder.ts`);

	if (existsSync(filePath) && !force) {
		console.error(
			`\x1b[31mError: Seeder file already exists at ${filePath} (use --force to overwrite)\x1b[0m`,
		);
		process.exitCode = 1;
		return;
	}

	const content = generateSeeder(name, pascalName, orm, useFactory);

	if (dryRun) {
		console.log(`\x1b[90mWould create file: ${filePath}\x1b[0m`);
		console.log(`\n\x1b[36m--- Generated content ---\x1b[0m\n`);
		console.log(content);
		return;
	}

	await fs.writeFile(filePath, content);

	if (formatWithBiome([filePath])) {
		console.log(
			"\x1b[90m✨ Auto-formatted generated seeder file with Biome\x1b[0m",
		);
	}

	console.log(`\x1b[32m✓ Generated seeder:\x1b[0m ${filePath}`);

	if (useFactory) {
		// Generate the factory on demand instead of just warning about it
		const factoryPath = `src/factories/${toSnakeCase(name)}.factory.ts`;
		if (!existsSync(factoryPath)) {
			console.log(
				`\n\x1b[90mFactory not found at ${factoryPath} - generating it...\x1b[0m`,
			);
			await makeFactoryCommand(name, []);
		}
	}
}
