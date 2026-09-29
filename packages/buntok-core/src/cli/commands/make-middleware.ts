import { existsSync } from "node:fs";
import fs from "node:fs/promises";
import { join } from "node:path";
import { formatWithBiome } from "../project.js";
import { toPascalCase } from "../utils.js";

function generateMiddleware(_name: string, pascalName: string): string {
	return `import type { Context, Middleware } from "@buntok/core";

export const ${pascalName}Middleware: Middleware = async (ctx: Context, next: () => Promise<Response> | Response) => {
  const start = performance.now();

  const response = await next();

  const end = performance.now();
  const url = new URL(ctx.request.url);
  console.log(\`[\${ctx.request.method}] \${url.pathname} - \${Math.round(end - start)}ms\`);

  return response;
}
`;
}

export async function makeMiddlewareCommand(name: string, flags: string[] = []) {
	const pascalName = toPascalCase(name);
	const dryRun = flags.includes("--dry-run");
	const force = flags.includes("--force");
	console.log(`\n\x1b[36mCreating ${pascalName} Middleware${dryRun ? " (dry-run)" : ""}...\x1b[0m\n`);

	const middlewaresDir = "src/middlewares";

	if (!existsSync(middlewaresDir)) {
		if (dryRun) {
			console.log(`\x1b[90mWould create directory: ${middlewaresDir}\x1b[0m`);
		} else {
			await fs.mkdir(middlewaresDir, { recursive: true });
		}
	}

	const filePath = join(middlewaresDir, `${name}.middleware.ts`);

	if (existsSync(filePath) && !force) {
		console.error(
			`\x1b[31mError: Middleware file already exists at ${filePath} (use --force to overwrite)\x1b[0m`,
		);
		process.exitCode = 1;
		return;
	}

	const content = generateMiddleware(name, pascalName);

	if (dryRun) {
		console.log(`\x1b[90mWould create file: ${filePath}\x1b[0m`);
		console.log(`\n\x1b[36m--- Generated content ---\x1b[0m\n`);
		console.log(content);
		return;
	}

	await fs.writeFile(filePath, content);

	if (formatWithBiome([filePath])) {
		console.log("\x1b[90m✨ Auto-formatted generated file with Biome\x1b[0m");
	}

	console.log(`\x1b[32m✓ Generated middleware:\x1b[0m ${filePath}`);

	console.log(`
\x1b[36mUsage:\x1b[0m
  Import and apply it globally in src/index.ts:
     \x1b[32mapp.use(${pascalName}Middleware);\x1b[0m

  Or apply it to a specific controller:
     \x1b[32m@Use(${pascalName}Middleware)\x1b[0m
     \x1b[32mexport class MyController { ... }\x1b[0m
`);
}
