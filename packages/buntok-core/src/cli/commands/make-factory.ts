import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import {
	fakerLinesForFields,
	getEntityModel,
	loadPrismaSchema,
	parseFieldsFlag,
	tsLinesForFields,
	type FieldDef,
	type PrismaSchema,
} from "../generators/model.js";
import { detectORMOrNull, formatWithBiome } from "../project.js";
import { toPascalCase, toSnakeCase } from "../utils.js";

interface FactoryShape {
	typeImport: string;
	typeDecl: string;
	body: string;
}

function generateFactoryTemplate(
	entityName: string,
	orm: string | null,
	fields: FieldDef[] | null,
	schema: PrismaSchema | null,
): FactoryShape {
	const interfaceName = toPascalCase(entityName);
	const fakerLines = fields ? fakerLinesForFields(fields, schema) : [];
	const body =
		fakerLines.length > 0
			? fakerLines.map((l) => `  ${l}`).join("\n")
			: `  // TODO: Define your factory fields here
  // Example:
  // id: faker.number.int({ max: 10000 }),
  // name: faker.person.fullName(),
  // email: faker.internet.email(),`;

	// Prisma projects get the generated model type; other ORMs get an inline
	// type derived from the schema fields when available.
	if (orm === "prisma" || (!orm && !fields)) {
		const typeImport = `import type { ${interfaceName} } from "@prisma/client";`;
		return {
			typeImport,
			typeDecl: "",
			body,
		};
	}

	const tsLines = fields ? tsLinesForFields(fields, schema) : [];
	const typeDecl =
		tsLines.length > 0
			? `type ${interfaceName} = {\n${tsLines.map((l) => `  ${l}`).join("\n")}\n};`
			: `type ${interfaceName} = Record<string, unknown>;`;
	return {
		typeImport: "",
		typeDecl,
		body,
	};
}

export async function makeFactoryCommand(
	entityName: string,
	flags: string[],
): Promise<void> {
	const targetDir = process.cwd();
	const isDryRun = flags.includes("--dry-run");
	const force = flags.includes("--force");
	const fieldsFlagValue = (() => {
		const i = flags.indexOf("--fields");
		return i !== -1 ? flags[i + 1] : undefined;
	})();

	// Resolve paths
	const factoryDir = resolve(targetDir, "src", "factories");

	// Ensure factories directory exists
	if (!existsSync(factoryDir)) {
		if (!isDryRun) {
			mkdirSync(factoryDir, { recursive: true });
		}
		console.log(`Created directory: src/factories/`);
	}

	// Model awareness: Prisma schema first, `--fields` overrides
	const schema = fieldsFlagValue ? null : loadPrismaSchema();
	const model = schema ? getEntityModel(entityName, schema) : null;
	const fields: FieldDef[] | null = fieldsFlagValue
		? parseFieldsFlag(fieldsFlagValue)
		: (model?.fields ?? null);
	const orm = detectORMOrNull();
	const shape = generateFactoryTemplate(entityName, orm, fields, schema);

	const className = toPascalCase(entityName) + "Factory";
	const importLines = [
		`import { Factory } from "@buntok/core";`,
		`import { faker } from "@faker-js/faker";`,
		shape.typeImport,
	].filter((l) => l.length > 0);
	const content = `${importLines.join("\n")}

export const ${className} = Factory.define<${toPascalCase(entityName)}>(() => ({
${shape.body}
}));
${shape.typeDecl ? `\n${shape.typeDecl}\n` : ""}`;

	const fileName = `${toSnakeCase(entityName)}.factory.ts`;
	const filePath = join(factoryDir, fileName);

	if (isDryRun) {
		console.log(`\n\x1b[36m[DRY RUN] Would create:\x1b[0m`);
		console.log(`  ${filePath}`);
		console.log(`\x1b[36mContent:\x1b[0m`);
		console.log(content);
		return;
	}

	// Check if file already exists
	if (existsSync(filePath) && !force) {
		console.error(
			`\x1b[31mError: Factory file already exists: ${filePath} (use --force to overwrite)\x1b[0m`,
		);
		process.exitCode = 1;
		return;
	}

	// Write factory file
	writeFileSync(filePath, content, "utf-8");
	if (formatWithBiome([filePath])) {
		console.log(
			"\x1b[90m✨ Auto-formatted generated factory file with Biome\x1b[0m",
		);
	}
	console.log(`Created: src/factories/${fileName}`);

	// Print usage hint
	console.log(`\n\x1b[36mUsage:\x1b[0m`);
	console.log(
		`  import { ${className} } from "@/factories/${fileName.replace(".ts", "")}";`,
	);
	console.log(``);
	console.log(`  const user = await ${className}.create();`);
	console.log(`  const users = await ${className}.createMany(10);`);
	console.log(`  const admin = await ${className}.create({ role: "admin" });`);
}
