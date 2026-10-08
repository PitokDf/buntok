import { resolve } from "node:path";
import { writeFileSync, mkdirSync } from "node:fs";
import { z } from "zod";
import {
	OpenAPIRegistry,
	OpenApiGeneratorV3,
	extendZodWithOpenApi,
} from "@asteasolutions/zod-to-openapi";

extendZodWithOpenApi(z);

/**
 * Recursively walk a Zod schema and replace any type that zod-to-openapi
 * cannot handle (e.g. ZodFile from Zod v4) with a safe fallback so that
 * docs generation never crashes on an unsupported schema node.
 */
// biome-ignore lint/suspicious/noExplicitAny: schema introspection requires any
function sanitizeSchema(schema: any): any {
	if (!schema || typeof schema !== "object" || !schema._def) return schema;

	const typeName: string = schema._def?.typeName ?? schema._def?.type ?? "";

	// ZodFile (Zod v4) → OpenAPI string format:binary
	if (typeName === "ZodFile" || typeName === "file") {
		return z.string().openapi({ format: "binary", description: "Binary file" });
	}

	// ZodObject - recurse into shape
	if (typeName === "ZodObject" || typeName === "object") {
		const shape =
			typeof schema._def.shape === "function"
				? schema._def.shape()
				: (schema._def.shape ?? {});
		const newShape: Record<string, unknown> = {};
		for (const [key, value] of Object.entries(shape)) {
			newShape[key] = sanitizeSchema(value);
		}
		return z.object(newShape as Record<string, z.ZodTypeAny>);
	}

	// ZodArray - recurse into element
	if (typeName === "ZodArray" || typeName === "array") {
		return z.array(sanitizeSchema(schema._def.type));
	}

	// ZodOptional / ZodNullable - recurse into inner
	if (typeName === "ZodOptional" || typeName === "optional") {
		return sanitizeSchema(schema._def.innerType).optional();
	}
	if (typeName === "ZodNullable" || typeName === "nullable") {
		return sanitizeSchema(schema._def.innerType).nullable();
	}

	return schema;
}

export async function makeDocsCommand() {
	console.log("\x1b[36mGenerating OpenAPI documentation...\x1b[0m");

	// Prevent the user's app from starting its HTTP server during import
	process.env.BUNTOK_DOCS_BUILD = "1";

	const entryPath = resolve(process.cwd(), "src/index.ts");

	try {
		console.log(`\x1b[90mLoading app from ${entryPath}...\x1b[0m`);

		const userApp = await import(entryPath);
		const appInstance = userApp.app || userApp.default;

		if (!appInstance || !appInstance.openApiDocs) {
			throw new Error(
				"Could not find an exported 'app' instance in src/index.ts. Make sure you export your app: `export const app = new Buntok();`",
			);
		}

		const docsConfig = appInstance._apiDocsConfig;
		const registry = new OpenAPIRegistry();
		let skipped = 0;

		for (const doc of appInstance.openApiDocs) {
			// Convert express-style params /users/:id → OpenAPI /users/{id}
			const openapiPath = doc.path.replace(/:([a-zA-Z0-9_]+)/g, "{$1}");

			// biome-ignore lint/suspicious/noExplicitAny: RouteConfig populated dynamically
			const routeConfig: any = {
				method: doc.method,
				path: openapiPath,
				responses: {},
			};

			if (doc.request.params || doc.request.query || doc.request.body) {
				routeConfig.request = {};
				if (doc.request.params)
					routeConfig.request.params = sanitizeSchema(doc.request.params);
				if (doc.request.query)
					routeConfig.request.query = sanitizeSchema(doc.request.query);
				if (doc.request.body) {
					const contentType = doc.request.bodyContentType || "application/json";
					routeConfig.request.body = {
						content: {
							[contentType]: { schema: sanitizeSchema(doc.request.body) },
						},
					};
				}
			}

			if (doc.responses.length > 0) {
				for (const res of doc.responses) {
					routeConfig.responses[res.status.toString()] = {
						description: res.description,
						content: {
							"application/json": { schema: sanitizeSchema(res.schema) },
						},
					};
				}
			} else {
				routeConfig.responses["200"] = { description: "Success" };
			}

			// Per-route error handling: one bad schema must not abort everything
			try {
				registry.registerPath(routeConfig);
			} catch (err) {
				skipped++;
				const label = `${doc.method.toUpperCase()} ${doc.path}`;
				console.warn(
					`\x1b[33m  ⚠ Skipping ${label}: ${err instanceof Error ? err.message : "unknown error"}\x1b[0m`,
				);
			}
		}

		const generator = new OpenApiGeneratorV3(registry.definitions);
		const document = generator.generateDocument({
			openapi: "3.0.0",
			info: {
				version: docsConfig?.version ?? "1.0.0",
				title: docsConfig?.title ?? "Buntok API Documentation",
				description: docsConfig?.description ?? "Auto-generated OpenAPI docs from Zod schemas",
			},
		});

		// Output directory: public/docs/
		const docsDir = resolve(process.cwd(), "public/docs");
		mkdirSync(docsDir, { recursive: true });

		const swaggerPath = resolve(docsDir, "swagger.json");
		writeFileSync(swaggerPath, JSON.stringify(document, null, 2));
		console.log(
			`\x1b[32m✔ OpenAPI JSON generated at public/docs/swagger.json\x1b[0m`,
		);

		// Scalar UI - index.html so app.static("/docs", "./public/docs") just works
		const htmlPath = resolve(docsDir, "index.html");
		const html = `<!doctype html>
<html>
  <head>
    <title>API Reference</title>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
  </head>
  <body>
    <script id="api-reference" data-url="/docs/swagger.json"></script>
    <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
  </body>
</html>`;
		writeFileSync(htmlPath, html);
		console.log(
			`\x1b[32m✔ Scalar UI generated at public/docs/index.html\x1b[0m`,
		);

		if (skipped > 0) {
			console.log(
				`\x1b[33m  ${skipped} route(s) skipped due to unsupported schema types.\x1b[0m`,
			);
			console.log(
				`\x1b[33m  Tip: annotate unsupported types with .openapi({ ... }) from @asteasolutions/zod-to-openapi.\x1b[0m`,
			);
		}

		console.log(`\n\x1b[36mNext steps:\x1b[0m`);
		console.log(
			`  1. Serve docs: \x1b[90mapp.static("/docs", "./public/docs")\x1b[0m`,
		);
		console.log(
			`  2. Visit \x1b[90mhttp://localhost:1212/docs\x1b[0m to view your API documentation`,
		);
	} catch (error) {
		console.error("\x1b[31mFailed to generate docs:\x1b[0m");
		console.error(error);
	}
}
