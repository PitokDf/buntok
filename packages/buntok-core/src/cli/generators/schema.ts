import { existsSync } from "node:fs";
import fs from "node:fs/promises";
import { join } from "node:path";
import { toPascalCase } from "../utils.js";

interface SchemaOptions {
	/** Zod object body lines (from the Prisma model or `--fields`). */
	lines?: string[] | null;
}

function generateSchema(
	name: string,
	pascalName: string,
	options?: SchemaOptions,
): string {
	const body =
		options?.lines && options.lines.length > 0
			? options.lines.map((l) => `  ${l}`).join("\n")
			: `  name: z.string().min(1).max(100),\n  // TODO: Add more fields`;
	return `import { z } from "@buntok/core/middlewares/validator";

export const Create${pascalName}Schema = z.object({
${body}
});

export const Update${pascalName}Schema = Create${pascalName}Schema.partial();

export type Create${pascalName}Input = z.infer<typeof Create${pascalName}Schema>;
export type Update${pascalName}Input = z.infer<typeof Update${pascalName}Schema>;
`;
}

export async function generateSchemaFile(
	name: string,
	moduleDir: string,
	force = false,
	options?: SchemaOptions,
): Promise<string | null> {
	const pascalName = toPascalCase(name);
	const filePath = join(moduleDir, `${name}.schema.ts`);

	if (existsSync(filePath) && !force) {
		return null;
	}

	await fs.writeFile(filePath, generateSchema(name, pascalName, options));
	return filePath;
}
