import { existsSync, readFileSync } from "node:fs";
import fs from "node:fs/promises";
import { join } from "node:path";
import { generateBarrel } from "../generators/barrel.js";
import { generateController } from "../generators/controller.js";
import {
	getEntityModel,
	loadPrismaSchema,
	parseFieldsFlag,
	zodLinesForFields,
} from "../generators/model.js";
import { generateRepository } from "../generators/repository.js";
import { generateSchemaFile } from "../generators/schema.js";
import { generateService } from "../generators/service.js";
import {
	collectImportedControllers,
	type AppInstance,
	detectAppInstances,
	detectORM,
	escapeRegExp,
	ensureImport,
	findAppDeclarationFile,
	findAppDeclEnd,
	findInsertionIndex,
	formatWithBiome,
	type ORM,
} from "../project.js";
import { scanRoutes, warnDuplicateRoutes } from "../routes-scan.js";
import { selectFrom, toPascalCase } from "../utils.js";

interface CreateOptions {
	repo: boolean;
	service: boolean;
	controller: boolean;
	schema: boolean;
	all: boolean;
	dryRun: boolean;
	force: boolean;
	base: boolean;
	fields?: string;
	orm?: ORM;
	/** Target app instance name, e.g. `apiV1` (--app apiV1). */
	app?: string;
}

function parseOptions(args: string[]): CreateOptions {
	const options: CreateOptions = {
		repo: false,
		service: false,
		controller: false,
		schema: false,
		all: true,
		dryRun: false,
		force: false,
		base: false,
	};

	for (let i = 0; i < args.length; i++) {
		const arg = args[i] ?? "";
		switch (arg) {
			case "--repo":
				options.repo = true;
				options.all = false;
				break;
			case "--service":
				options.service = true;
				options.all = false;
				break;
			case "--controller":
				options.controller = true;
				options.all = false;
				break;
			case "--schema":
				options.schema = true;
				options.all = false;
				break;
			case "--dry-run":
				options.dryRun = true;
				break;
			case "--force":
				options.force = true;
				break;
			case "--base":
				options.base = true;
				break;
			case "--fields":
				options.fields = args[i + 1];
				i++;
				break;
			case "--app":
				options.app = args[i + 1];
				i++;
				break;
			case "--prisma":
				options.orm = "prisma";
				break;
			case "--drizzle":
				options.orm = "drizzle";
				break;
			case "--typeorm":
				options.orm = "typeorm";
				break;
		}
	}

	// If any specific option is set, don't generate all
	if (!options.all) {
		return options;
	}

	// Generate all by default
	return {
		repo: true,
		service: true,
		controller: true,
		schema: true,
		all: false,
		dryRun: options.dryRun,
		force: options.force,
		base: options.base,
		fields: options.fields,
		orm: options.orm,
		app: options.app,
	};
}

interface RegistrationTarget {
	/** File that declares the App instance(s), e.g. `src/app.ts`. */
	file: string;
	instances: AppInstance[];
	/** Instance that owns the registration, e.g. `app` or `apiV1`. */
	name: string;
}

type RegistrationResolution =
	| { target: RegistrationTarget | null }
	| { error: true };

/** Deterministic instance when there are several and no prompt is possible. */
function pickDefaultInstance(src: string, instances: AppInstance[]): number {
	const byName = instances.findIndex((i) => i.name === "app");
	if (byName !== -1) return byName;
	const appKind = instances.findIndex((i) => i.kind === "app");
	if (appKind !== -1) return appKind;
	const byListen = instances.findIndex((i) =>
		new RegExp(`${escapeRegExp(i.name)}\\.listen\\s*\\(`).test(src),
	);
	if (byListen !== -1) return byListen;
	const byExport = instances.findIndex((i) => i.exported);
	if (byExport !== -1) return byExport;
	return 0;
}

/** Human-readable label: `apiv1 (group /api/v1)` for RouterGroup targets. */
function instanceLabel(i: AppInstance): string {
	if (i.kind !== "group") return i.name;
	return i.prefix !== undefined ? `${i.name} (group ${i.prefix})` : `${i.name} (group)`;
}

/**
 * Walk a group's owner chain to the instance that can host the container:
 * `apiv1 = app.group(...)` → `app` (RouterGroup has no setContainer()).
 */
function resolveContainerHost(name: string, instances: AppInstance[]): string {
	let current = name;
	for (let i = 0; i < 10; i++) {
		const found = instances.find((x) => x.name === current);
		if (!found || found.kind === "app" || !found.owner) return current;
		current = found.owner;
	}
	return current;
}

/**
 * Pick the registration file (the one declaring `new App(...)`, not the
 * listener-only `server.ts`) and the target instance. Honors `--app`,
 * prompts when several instances exist on a TTY, and falls back to a
 * deterministic default in CI.
 */
async function resolveRegistrationTarget(
	options: CreateOptions,
): Promise<RegistrationResolution> {
	if (options.dryRun || !options.controller) return { target: null };

	const file = findAppDeclarationFile();
	if (!file || !existsSync(file)) return { target: null };

	const content = readFileSync(file, "utf-8");
	const instances = detectAppInstances(content);

	if (options.app) {
		if (instances.length === 0) {
			console.error(
				`\x1b[31mError: --app ${options.app} given, but no App instance is declared in ${file}\x1b[0m`,
			);
			process.exitCode = 1;
			return { error: true };
		}
		if (!instances.some((i) => i.name === options.app)) {
			const available = instances.map(instanceLabel).join(", ");
			console.error(
				`\x1b[31mError: App instance "${options.app}" not found in ${file} (available: ${available})\x1b[0m`,
			);
			process.exitCode = 1;
			return { error: true };
		}
		return { target: { file, instances, name: options.app } };
	}

	if (instances.length === 0) {
		console.log(
			`\x1b[33m⚠ No App instance declared in ${file} — registering via "app"\x1b[0m`,
		);
		return { target: { file, instances, name: "app" } };
	}
	if (instances.length === 1) {
		return { target: { file, instances, name: instances[0]?.name ?? "app" } };
	}

	// Several instances (apiV1, apiV2, ...): ask on a TTY, otherwise use
	// the deterministic default so scripts and CI never hang.
	const names = instances.map((i) => i.name);
	const defaultIndex = pickDefaultInstance(content, instances);
	if (process.stdin.isTTY) {
		const picked = await selectFrom(
			`\x1b[36mRegister the controller to which App instance in ${file}?\x1b[0m`,
			instances.map(instanceLabel),
			defaultIndex,
		);
		if (picked !== null && names[picked] !== undefined) {
			return { target: { file, instances, name: names[picked] } };
		}
	}
	const chosen = names[defaultIndex] ?? names[0] ?? "app";
	console.log(
		`\x1b[33m⚠ ${file} declares multiple App instances (${names.join(", ")}) — registered via "${chosen}". Use --app <name> to pick another.\x1b[0m`,
	);
	return { target: { file, instances, name: chosen } };
}

export async function createCommand(entityName: string, args: string[]) {
	const options = parseOptions(args);
	const pascalName = toPascalCase(entityName);
	const orm = options.orm ?? detectORM();
	const moduleDir = join("src/modules", entityName);

	// Resolve where (and to which App instance) the controller gets
	// registered before touching any file, so an invalid --app fails clean.
	const registration = await resolveRegistrationTarget(options);
	if ("error" in registration) return;

	const repoPath = join(moduleDir, `${entityName}.repository.ts`);
	const servicePath = join(moduleDir, `${entityName}.service.ts`);
	const controllerPath = join(moduleDir, `${entityName}.controller.ts`);
	const schemaPath = join(moduleDir, `${entityName}.schema.ts`);

	// Cross-generator awareness: what already exists on disk?
	const hasRepo = existsSync(repoPath);
	const hasService = existsSync(servicePath);
	const hasController = existsSync(controllerPath);
	const hasSchema = existsSync(schemaPath);

	// Template style: explicit --base wins, otherwise follow existing module
	// files (a module built with BaseService/BaseController stays base-styled).
	let useBase = options.base;
	if (!options.base) {
		for (const existing of [servicePath, controllerPath]) {
			if (!existsSync(existing)) continue;
			const source = readFileSync(existing, "utf-8");
			if (
				source.includes("extends BaseService") ||
				source.includes("extends BaseController")
			) {
				useBase = true;
				break;
			}
		}
	}

	// A service generated with a repo (or next to an existing one) gets the
	// wired template; a controller generated next to an existing service does
	// too. `--base` (or a base-styled module on disk) always implies the
	// wired templates — the Base* variants carry @Dependencies themselves.
	const serviceWithRepo = options.repo || hasRepo || useBase;
	const controllerWithService = options.service || hasService || useBase;

	const prefix = options.dryRun ? "\x1b[33m[DRY RUN]\x1b[0m " : "";
	console.log(`\n${prefix}\x1b[36mCreating ${pascalName} entity (orm: ${orm})...\x1b[0m\n`);

	// Ensure module directory exists (skip in dry-run)
	if (!options.dryRun) {
		if (!existsSync(moduleDir)) {
			await fs.mkdir(moduleDir, { recursive: true });
		}
	}

	const results: string[] = [];
	const generatedFiles: string[] = [];
	const tasks: Promise<void>[] = [];

	// Helper to generate file asynchronously
	const generateFile = async (
		path: string,
		contentGenerator: () => string,
		type: string,
	) => {
		if (options.dryRun) {
			const content = contentGenerator();
			results.push(`[DRY RUN] ${type}: ${path}`);
			console.log(`\n\x1b[90m--- ${path} ---\x1b[0m`);
			console.log(content);
			console.log(`\x1b[90m--- end ---\x1b[0m\n`);
			return;
		}
		if (!existsSync(path) || options.force) {
			await fs.writeFile(path, contentGenerator());
			results.push(`✓ ${type}: ${path}`);
			generatedFiles.push(path);
		} else {
			results.push(`• ${type}: ${path} (already exists)`);
		}
	};

	if (options.repo) {
		tasks.push(
			generateFile(
				repoPath,
				() => generateRepository(entityName, pascalName, orm, { base: useBase }),
				"Repository",
			),
		);
	}

	if (options.service) {
		tasks.push(
			generateFile(
				servicePath,
				() =>
					generateService(entityName, pascalName, serviceWithRepo, orm, {
						base: useBase,
					}),
				"Service",
			),
		);
	}

	if (options.controller) {
		tasks.push(
			generateFile(
				controllerPath,
				() =>
					generateController(entityName, pascalName, controllerWithService, orm, {
						base: useBase,
					}),
				"Controller",
			),
		);
	}

	if (options.schema) {
		// Model awareness: `--fields` wins, then the Prisma model, then placeholder
		let zodLines: string[] | null = null;
		if (options.fields) {
			const flagFields = parseFieldsFlag(options.fields);
			zodLines = flagFields.length > 0 ? zodLinesForFields(flagFields, null) : null;
		} else {
			const prismaSchema = loadPrismaSchema();
			const model = prismaSchema ? getEntityModel(entityName, prismaSchema) : null;
			if (model) {
				zodLines = zodLinesForFields(model.fields, prismaSchema);
			}
		}
		if (!options.dryRun) {
			const result = await generateSchemaFile(entityName, moduleDir, options.force, {
				lines: zodLines,
			});
			if (result) {
				results.push(`✓ Schema: ${result}`);
				generatedFiles.push(result);
			} else {
				results.push(`• Schema: ${schemaPath} (already exists)`);
			}
		} else {
			results.push(`[DRY RUN] Schema: ${schemaPath}`);
		}
	}

	// Execute all file generations concurrently
	await Promise.all(tasks);

	// Barrel export: create when missing, otherwise append only the exports
	// that are not present yet (merge instead of skip).
	const barrelPath = join(moduleDir, "index.ts");
	const barrelParts = {
		repository: hasRepo || options.repo,
		service: hasService || options.service,
		controller: hasController || options.controller,
		schema: hasSchema || options.schema,
	};
	if (options.dryRun) {
		results.push(`[DRY RUN] Barrel: ${barrelPath}`);
	} else if (!existsSync(barrelPath)) {
		await fs.writeFile(barrelPath, generateBarrel(entityName, pascalName, barrelParts));
		results.push(`✓ Barrel: ${barrelPath}`);
		generatedFiles.push(barrelPath);
	} else {
		const existingBarrel = readFileSync(barrelPath, "utf-8");
		const wanted = generateBarrel(entityName, pascalName, barrelParts)
			.split("\n")
			.filter((line) => line.trim() && !existingBarrel.includes(line));
		if (wanted.length > 0) {
			await fs.writeFile(
				barrelPath,
				`${existingBarrel.trimEnd()}\n${wanted.join("\n")}\n`,
			);
			results.push(`✓ Barrel: ${barrelPath} (+${wanted.length} export${wanted.length > 1 ? "s" : ""})`);
			generatedFiles.push(barrelPath);
		} else {
			results.push(`• Barrel: ${barrelPath} (up to date)`);
		}
	}

	// Auto-format generated files with Biome if available (skip in dry-run)
	if (generatedFiles.length > 0 && !options.dryRun) {
		if (formatWithBiome(generatedFiles)) {
			console.log(
				"\x1b[90m✨ Auto-formatted generated files with Biome\x1b[0m\n",
			);
		}
	}

	// Auto-register in the file that declares the App instance — never the
	// listener-only entry (server.ts). Null on dry-run / non-controller runs.
	const target = registration.target;
	if (target && existsSync(target.file)) {
		const inst = target.name;
		const ref = escapeRegExp(inst);
		const indexContent = readFileSync(target.file, "utf-8");
		const controllerName = `${pascalName}Controller`;
		const controllerImport = `import { ${controllerName} } from "@/modules/${entityName}";`;

		// Determine registration type based on whether the generated controller
		// has @Dependencies (i.e. was generated with the wired service template)
		const useContainer = controllerWithService;

		// Check if this controller is already registered on this instance
		const rcSingleRegex = new RegExp(`${ref}\\.registerController\\((\\w+)\\)\\s*;`);
		const rcArrayRegex = new RegExp(`${ref}\\.registerController\\(\\[([^\\]]*)\\]\\)\\s*;`);
		const scanRegex = new RegExp(
			`(?:${ref}\\.getContainer\\(\\)|container)\\.scan\\(\\[([^\\]]*)\\]\\)\\s*;`,
		);

		const rcSingleMatch = indexContent.match(rcSingleRegex);
		const rcArrayMatch = indexContent.match(rcArrayRegex);
		const scanMatch = indexContent.match(scanRegex);

		let alreadyRegistered = false;
		if (useContainer && scanMatch?.[1]) {
			alreadyRegistered = scanMatch[1].includes(controllerName);
		} else if (!useContainer && rcSingleMatch?.[1]) {
			alreadyRegistered = rcSingleMatch[1] === controllerName;
		} else if (!useContainer && rcArrayMatch?.[1]) {
			alreadyRegistered = rcArrayMatch[1].includes(controllerName);
		}

		if (!alreadyRegistered) {
			let content = indexContent;
			// All new statements are collected first and spliced as one block so
			// they keep execution order and never stack on the same anchor.
			const toInsert: string[] = [];

			if (useContainer) {
				// === container.scan() + registerController() flow ===

				// Step 1: Add Container import if missing
				const containerImportRegex = /import\s*\{[^}]*Container[^}]*\}\s*from\s*["']@buntok\/core["']/;
				if (!containerImportRegex.test(content)) {
					// Add Container to existing @buntok/core import
					content = content.replace(
						/import\s*\{([^}]+)\}\s*from\s*["']@buntok\/core["']/,
						(_match, imports: string) => {
							if (imports.includes("Container")) return _match;
							return `import { ${imports.trim()}, Container } from "@buntok/core"`;
						},
					);
				}

				// Step 2: Add controller import if missing
				content = ensureImport(content, controllerImport);

				// Step 3: Add/merge container.scan()
				const existingScan = content.match(scanRegex);
				if (existingScan?.[1]) {
					// Already has scan — merge
					const existing = existingScan[1].trim();
					const merged = existing ? `${existing}, ${controllerName}` : controllerName;
					content = content.replace(scanRegex, `container.scan([${merged}]);`);
				} else {
					// No scan found — collect all imported @Dependencies controllers
					const allControllers = collectImportedControllers(content, true, inst);
					if (!allControllers.includes(controllerName)) {
						allControllers.push(controllerName);
					}
					toInsert.push(`container.scan([${allControllers.join(", ")}]);`);
				}

				// Step 4: Add <host>.setContainer(container) if missing.
				// RouterGroup has no setContainer() — attach to the owning
				// App instead (`apiv1 = app.group(...)` → `app`).
				const host = resolveContainerHost(inst, target.instances);
				const hostRef = escapeRegExp(host);
				const setContainerRegex = new RegExp(
					`${hostRef}\\.setContainer\\s*\\(\\s*container\\s*\\)\\s*;`,
				);
				if (!setContainerRegex.test(content)) {
					toInsert.push(`${host}.setContainer(container);`);
				}
			} else {
				// === registerController() flow ===
				content = ensureImport(content, controllerImport);
			}

			// Step 5: Add/merge registerController() — required for endpoint registration
			const rcSingleNew = content.match(rcSingleRegex);
			const rcArrayNew = content.match(rcArrayRegex);
			if (rcArrayNew?.[1]) {
				// Already has array — merge
				const existing = rcArrayNew[1].trim();
				const merged = existing ? `${existing}, ${controllerName}` : controllerName;
				content = content.replace(rcArrayRegex, `${inst}.registerController([${merged}]);`);
			} else if (rcSingleNew?.[1]) {
				// Has single — convert to array
				content = content.replace(
					rcSingleRegex,
					`${inst}.registerController([${rcSingleNew[1]}, ${controllerName}]);`,
				);
			} else {
				toInsert.push(`${inst}.registerController([${controllerName}]);`);
			}

			// Single ordered splice of all pending statements
			if (toInsert.length > 0) {
				const insertion = findInsertionIndex(content, inst);
				const rest = content.slice(insertion.index);
				const lead = /^\n*/.exec(rest)?.[0].length ?? 0;
				const prefix =
					insertion.index > 0 && content[insertion.index - 1] !== "\n"
						? "\n"
						: "";
				// Exactly one blank line before whatever follows: count the
				// leading newlines the remainder already provides.
				const separator = "\n".repeat(Math.max(0, 2 - Math.min(lead, 2)));
				content =
					content.slice(0, insertion.index) +
					prefix +
					toInsert.join("\n\n") +
					separator +
					rest;
			}

			// Step 6: declare the container right after the hosting app's
			// declaration (kept after the splice so it stays above every
			// inserted statement)
			if (useContainer) {
				const containerDeclRegex = /(?:const|let|var)\s+container\s*=\s*new\s+Container\(\)/;
				if (!containerDeclRegex.test(content)) {
					const host = resolveContainerHost(inst, target.instances);
					const declEnd =
						findAppDeclEnd(content, host) ?? findAppDeclEnd(content, inst);
					if (declEnd !== null) {
						content =
							content.slice(0, declEnd) +
							"\nconst container = new Container();" +
							content.slice(declEnd);
					} else {
						// No `const <inst> = new App(...)` to anchor on — declare
						// the container directly above the inserted block.
						const insertion = findInsertionIndex(content, inst);
						const prefix =
							insertion.index > 0 &&
							content[insertion.index - 1] !== "\n"
								? "\n"
								: "";
						content =
							content.slice(0, insertion.index) +
							prefix +
							"const container = new Container();\n" +
							content.slice(insertion.index);
					}
				}
			}

			console.log(
				useContainer
					? `\x1b[32m✔ Registered ${controllerName} via ${inst} (container.scan() + registerController) in ${target.file}\x1b[0m`
					: `\x1b[32m✔ Registered ${controllerName} via ${inst} in ${target.file}\x1b[0m`,
			);

			await fs.writeFile(target.file, content);
		} else {
			const location = useContainer ? "container.scan()" : "registerController";
			console.log(
				`\x1b[90m• ${target.file}: ${controllerName} already registered in ${location} (${inst})\x1b[0m`,
			);
		}
	}

	// Static route scan: warn when the new controller collides with existing routes
	if (!options.dryRun && options.controller) {
		warnDuplicateRoutes(scanRoutes());
	}

	// Print results
	console.log(options.dryRun ? "\x1b[33mWould generate:\x1b[0m" : "\x1b[32mGenerated files:\x1b[0m");
	for (const result of results.sort()) {
		console.log(`  ${result}`);
	}

	if (options.dryRun) {
		console.log(`\n\x1b[33mRun without --dry-run to create these files.\x1b[0m\n`);
	} else {
		console.log(`
\x1b[36mNext steps:\x1b[0m
  1. Start dev server: \x1b[33mbun run dev\x1b[0m
`);
	}
}
