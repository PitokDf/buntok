import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { generateOpenApiDocument } from "../../helpers/openapi";

export async function makeDocsCommand() {
	console.log("\x1b[36mGenerating OpenAPI documentation...\x1b[0m");

	// Prevent the user's app from starting its HTTP server during import
	process.env.BUNTOK_DOCS_BUILD = "1";

	const entryPath = resolve(process.cwd(), "src/index.ts");

	try {
		console.log(`\x1b[90mLoading app from ${entryPath}...\x1b[0m`);

		const userApp = await import(entryPath);
		const appInstance = userApp.app || userApp.default;

		if (!appInstance?.openApiDocs) {
			throw new Error(
				"Could not find an exported 'app' instance in src/index.ts. Make sure you export your app: `export const app = new Buntok();`",
			);
		}

		const docsConfig = appInstance._apiDocsConfig;

		const document = generateOpenApiDocument({
			openApiDocs: appInstance.openApiDocs,
			title: docsConfig?.title,
			version: docsConfig?.version,
			description: docsConfig?.description,
		});

		if (!document) {
			console.warn(
				"\x1b[33m  ⚠ No routes with OpenAPI metadata found. Add zValidator() or zResponse() to your routes.\x1b[0m",
			);
			process.exit(0);
		}

		// Output directory: public/docs/
		const docsDir = resolve(process.cwd(), "public/docs");
		mkdirSync(docsDir, { recursive: true });

		const swaggerPath = resolve(docsDir, "swagger.json");
		writeFileSync(swaggerPath, JSON.stringify(document, null, 2));
		console.log(
			`\x1b[32m✔ swagger.json generated at public/docs/swagger.json\x1b[0m`,
		);

		process.exit(0);
	} catch (error) {
		console.error("\x1b[31mFailed to generate docs:\x1b[0m");
		console.error(error);
		process.exit(1);
	}
}
