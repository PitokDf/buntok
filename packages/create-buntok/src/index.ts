#!/usr/bin/env bun

import { existsSync, mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { createInterface } from "node:readline";

const __dirname = import.meta.dir;

// ── Helpers ──────────────────────────────────────────────

function printBanner() {
	console.log(`\n\x1b[36m  create-buntok\x1b[0m\n`);
}

function printUsage() {
	console.log("Usage: bunx create-buntok <project-name>\n");
	console.log("Example:");
	console.log("  bunx create-buntok my-api\n");
}

function validateProjectName(name: string): boolean {
	if (!name || name.length === 0) {
		console.error("\x1b[31mError: Project name is required\x1b[0m");
		return false;
	}
	if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
		console.error(
			"\x1b[31mError: Project name can only contain letters, numbers, hyphens, and underscores\x1b[0m",
		);
		return false;
	}
	return true;
}

function askQuestion(question: string, defaultValue = true): Promise<boolean> {
	return new Promise((resolve) => {
		const rl = createInterface({
			input: process.stdin,
			output: process.stdout,
		});
		rl.question(question, (answer) => {
			rl.close();
			const normalized = answer.trim().toLowerCase();
			if (normalized === "") return resolve(defaultValue);
			resolve(normalized === "y" || normalized === "yes");
		});
	});
}

function askChoice(
	question: string,
	choices: string[],
	defaultIndex = 0,
): Promise<number> {
	return new Promise((resolve) => {
		const rl = createInterface({
			input: process.stdin,
			output: process.stdout,
		});
		console.log(question);
		choices.forEach((c, i) => {
			const marker = i === defaultIndex ? "\u2192" : " ";
			console.log(`  ${marker} ${i + 1}. ${c}`);
		});
		rl.question(
			`\x1b[36m  Enter choice [${defaultIndex + 1}]: \x1b[0m`,
			(answer) => {
				rl.close();
				const num = Number.parseInt(answer.trim()) - 1;
				if (Number.isNaN(num) || num < 0 || num >= choices.length) {
					resolve(defaultIndex);
				} else {
					resolve(num);
				}
			},
		);
	});
}

// ── Templates ────────────────────────────────────────────

const BIOME_CONFIG = {
	vcs: { enabled: true, clientKind: "git", useIgnoreFile: true },
	files: {
		ignoreUnknown: true,
		includes: [
			"**",
			"!**/node_modules",
			"!**/dist",
			"!**/.buntok",
			"!**/coverage",
		],
	},
	formatter: {
		enabled: true,
		indentStyle: "tab",
		indentWidth: 2,
		lineWidth: 100,
		lineEnding: "lf",
	},
	linter: {
		enabled: true,
		rules: {
			preset: "recommended",
			correctness: { noUnusedImports: { level: "warn", fix: "safe" } },
			suspicious: { noExplicitAny: "off" },
		},
	},
	javascript: {
		formatter: { quoteStyle: "double", trailingCommas: "all" },
	},
};

const TSCONFIG_TEMPLATE = {
	compilerOptions: {
		lib: ["ESNext"],
		target: "ESNext",
		module: "Preserve",
		moduleDetection: "force",
		jsx: "react-jsx",
		allowJs: true,
		types: ["bun", "node"],
		moduleResolution: "bundler",
		allowImportingTsExtensions: true,
		verbatimModuleSyntax: true,
		noEmit: true,
		strict: true,
		noUncheckedIndexedAccess: true,
		exactOptionalPropertyTypes: true,
		noImplicitOverride: true,
		noFallthroughCasesInSwitch: true,
		isolatedModules: true,
		skipLibCheck: true,
		paths: { "@/*": ["./src/*"] },
	},
	include: ["src/**/*"],
	exclude: ["node_modules", ".buntok"],
};

const VSCODE_SETTINGS = {
	"editor.formatOnSave": true,
	"editor.defaultFormatter": "biomejs.biome",
	"editor.codeActionsOnSave": {
		"source.fixAll.biome": "explicit",
		"source.organizeImports.biome": "explicit",
	},
	"[javascript]": { "editor.defaultFormatter": "biomejs.biome" },
	"[typescript]": { "editor.defaultFormatter": "biomejs.biome" },
	"[typescriptreact]": { "editor.defaultFormatter": "biomejs.biome" },
	"[json]": { "editor.defaultFormatter": "biomejs.biome" },
	"[jsonc]": { "editor.defaultFormatter": "biomejs.biome" },
	"[html]": { "editor.defaultFormatter": "biomejs.biome" },
	"[css]": { "editor.defaultFormatter": "biomejs.biome" },
};

const INDEX_TEMPLATE = `import { App } from "@buntok/core";
import "./env";

export const app = new App();

app.get("/", (ctx) => {
	return ctx.json({ message: "Hello from Buntok!" });
});

export default app;
`;

const ENV_TS_TEMPLATE = `import { App } from "@buntok/core";
import { z } from "@buntok/core/middlewares/validator";

export const env = App.validateEnv({
	PORT: z.coerce.number().default(1212),
	AUTH_STORE: z.enum(["header", "cookie"]).default("header"),
	AUTH_COOKIE: z.string().default("session"),
	NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});
`;

const SERVER_TS_TEMPLATE = `import { app } from "./src/index";
import { env } from "./src/env";

app.listen(env.PORT);
`;

const ENV_CONTENT = `PORT=1212
AUTH_STORE=header
AUTH_COOKIE=session
`;

const ENV_EXAMPLE_CONTENT = `# PORT: port is using for the app
# AUTH_STORE: Where to store/read JWT tokens
#   - "header" (default): Read from Authorization: Bearer <token> header
#   - "cookie": Read from HttpOnly cookie (set AUTH_COOKIE for cookie name)
# AUTH_COOKIE: Cookie name for JWT storage (only used when AUTH_STORE=cookie)
PORT=1212
AUTH_STORE=header
AUTH_COOKIE=session
`;

const GITIGNORE_CONTENT = `node_modules/
.buntok/
.env
.env.local
.env.*.local
.vscode/
.idea/
*.swp
*.swo
*~
.DS_Store
Thumbs.db
*.log
npm-debug.log*
coverage/
`;

const DOCKERFILE_TEMPLATE = `# Builder
FROM oven/bun:1-alpine AS builder
WORKDIR /app

COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile --production

COPY src/ src/
COPY server.ts ./
COPY tsconfig.json ./
COPY package.json ./

RUN bun run build

# Production
FROM oven/bun:1-alpine
WORKDIR /app

COPY --from=builder /app/.buntok .buntok
COPY --from=builder /app/node_modules node_modules
COPY --from=builder /app/package.json ./

EXPOSE 1212

ENV NODE_ENV=production
ENV PORT=1212

CMD ["bun", ".buntok/server.js"]
`;

const DOCKERIGNORE_CONTENT = `node_modules
dist
.buntok
*.log
.env
.env.*
coverage
`;

const DOCKER_COMPOSE_TEMPLATE = `version: "3.8"
services:
  app:
    build: .
    ports:
      - "1212:1212"
    env_file:
      - .env
`;

const VERCEL_JSON_TEMPLATE = {
	$schema: "https://openapi.vercel.sh/vercel.json",
	framework: "bun",
	bunVersion: "1.4.x",
};

// ── SKILL.md copy ────────────────────────────────────────

function findSkillMdSource(): string | null {
	// Try relative path (monorepo dev)
	const relativePath = join(
		__dirname,
		"..",
		"..",
		"buntok-core",
		"scripts",
		"buntok-skill",
		"SKILL.md",
	);
	if (existsSync(relativePath)) return relativePath;

	// Try resolving from @buntok/core package
	try {
		const pkgJson = require.resolve("@buntok/core/package.json");
		const pkgDir = dirname(pkgJson);
		const skillPath = join(pkgDir, "scripts", "buntok-skill", "SKILL.md");
		if (existsSync(skillPath)) return skillPath;
	} catch {}

	return null;
}

function copySkillMd(projectRoot: string) {
	const source = findSkillMdSource();
	if (!source) {
		console.warn("\x1b[33m\u26a0 SKILL.md not found, skipping.\x1b[0m");
		return;
	}
	const destDir = join(projectRoot, ".agents", "skills", "buntok-skill");
	mkdirSync(destDir, { recursive: true });
	writeFileSync(join(destDir, "SKILL.md"), readFileSync(source, "utf-8"), "utf-8");
	console.log(
		"\x1b[32m\u2713 Created\x1b[0m .agents/skills/buntok-skill/SKILL.md",
	);
}

// ── ORM templates ────────────────────────────────────────

const PRISMA_SCHEMA = `generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
`;

const PRISMA_DB_INDEX = `import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
`;

const DRIZZLE_CONFIG = `import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schemas/*",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
`;

const DRIZZLE_DB_INDEX = `import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schemas";

const connectionString = process.env.DATABASE_URL!;
const client = postgres(connectionString);

export const db = drizzle(client, { schema });
`;

const DRIZZLE_SCHEMAS_INDEX = `export {};
`;

const TYPEORM_ORM_CONFIG = `import "reflect-metadata";
import { DataSource } from "typeorm";

export const AppDataSource = new DataSource({
  type: "postgres",
  url: process.env.DATABASE_URL,
  synchronize: true,
  logging: false,
  entities: ["src/**/*.entity.ts"],
  migrations: ["src/migrations/*.ts"],
});
`;

const TYPEORM_DB_INDEX = `import "reflect-metadata";
import { AppDataSource } from "../../orm.config";

export async function connect() {
  try {
    await AppDataSource.initialize();
    console.log("Database connected");
  } catch (error) {
    console.error("Database connection failed:", error);
    process.exit(1);
  }
}
`;

// ── ORM package.json extras ──────────────────────────────

function getOrmDeps(orm: string): {
	dependencies: Record<string, string>;
	devDependencies: Record<string, string>;
	scripts: Record<string, string>;
} {
	switch (orm) {
		case "prisma":
			return {
				dependencies: {
					"@buntok/prisma": "latest",
					"@prisma/client": "latest",
				},
				devDependencies: { prisma: "latest" },
				scripts: {
					"db:generate": "bunx prisma generate",
					"db:migrate": "bunx prisma migrate dev",
					"db:push": "bunx prisma db push",
					"db:studio": "bunx prisma studio",
				},
			};
		case "drizzle":
			return {
				dependencies: {
					"@buntok/drizzle": "latest",
					"drizzle-orm": "latest",
					postgres: "latest",
				},
				devDependencies: { "drizzle-kit": "latest" },
				scripts: {
					"db:generate": "bunx drizzle-kit generate",
					"db:migrate": "bunx drizzle-kit migrate",
					"db:push": "bunx drizzle-kit push",
					"db:studio": "bunx drizzle-kit studio",
				},
			};
		case "typeorm":
			return {
				dependencies: {
					"@buntok/typeorm": "latest",
					typeorm: "latest",
					pg: "latest",
					"reflect-metadata": "latest",
				},
				devDependencies: {},
				scripts: {
					"db:migrate": "bunx typeorm migration:run",
					"db:generate": "bunx typeorm migration:generate",
				},
			};
		default:
			return { dependencies: {}, devDependencies: {}, scripts: {} };
	}
}

// ── Main ─────────────────────────────────────────────────

async function main() {
	printBanner();

	const args = process.argv.slice(2);
	const projectName = args[0];

	if (!projectName) {
		printUsage();
		process.exit(1);
	}

	if (!validateProjectName(projectName)) {
		process.exit(1);
	}

	const projectPath = resolve(process.cwd(), projectName);

	if (existsSync(projectPath)) {
		console.error(
			`\x1b[31mError: Directory "${projectName}" already exists\x1b[0m`,
		);
		process.exit(1);
	}

	console.log(`\x1b[36mCreating Buntok project: ${projectName}\x1b[0m\n`);

	// Ask options
	const useDocker = await askQuestion(
		"\x1b[36m? Do you want to include Docker support? (Y/n): \x1b[0m",
		true,
	);

	const useVercel = await askQuestion(
		"\x1b[36m? Do you want to deploy to Vercel? (y/N): \x1b[0m",
		false,
	);

	const ormChoices = ["Prisma (recommended)", "Drizzle", "TypeORM", "None"];
	const ormIndex = await askChoice(
		"\x1b[36m? Which ORM would you like to use?\x1b[0m",
		ormChoices,
		0,
	);
	const ormNames = ["prisma", "drizzle", "typeorm", "none"];
	const orm = ormNames[ormIndex];

	// Create project directory
	console.log("\n\x1b[90m  Creating project...\x1b[0m");
	mkdirSync(projectPath, { recursive: true });

	// Generate config files
	writeFileSync(
		join(projectPath, "biome.json"),
		JSON.stringify(BIOME_CONFIG, null, 2) + "\n",
	);
	writeFileSync(
		join(projectPath, "tsconfig.json"),
		JSON.stringify(TSCONFIG_TEMPLATE, null, 2) + "\n",
	);

	mkdirSync(join(projectPath, ".vscode"), { recursive: true });
	writeFileSync(
		join(projectPath, ".vscode", "settings.json"),
		JSON.stringify(VSCODE_SETTINGS, null, 2) + "\n",
	);

	// Generate source files
	const srcDir = join(projectPath, "src");
	mkdirSync(srcDir, { recursive: true });
	writeFileSync(join(srcDir, "index.ts"), INDEX_TEMPLATE);
	writeFileSync(join(srcDir, "env.ts"), ENV_TS_TEMPLATE);
	writeFileSync(join(projectPath, "server.ts"), SERVER_TS_TEMPLATE);

	// Generate env files
	writeFileSync(join(projectPath, ".env"), ENV_CONTENT);
	writeFileSync(join(projectPath, ".env.example"), ENV_EXAMPLE_CONTENT);

	// Generate .gitignore
	writeFileSync(join(projectPath, ".gitignore"), GITIGNORE_CONTENT);

	// Generate package.json
	const ormConfig = getOrmDeps(orm);
	const pkg = {
		name: projectName,
		version: "0.1.0",
		type: "module",
		scripts: {
			dev: "bun --watch server.ts",
			build: "buntok build",
			start: "bun .buntok/server.js",
			check: "bunx @biomejs/biome check --write .",
			format: "bunx @biomejs/biome format --write .",
			lint: "bunx @biomejs/biome lint .",
			...ormConfig.scripts,
		},
		dependencies: {
			"@buntok/core": "latest",
			...ormConfig.dependencies,
		},
		devDependencies: {
			"@biomejs/biome": "latest",
			"@types/bun": "latest",
			typescript: "^5",
			...ormConfig.devDependencies,
		},
	};
	writeFileSync(
		join(projectPath, "package.json"),
		JSON.stringify(pkg, null, 2) + "\n",
	);

	// Generate ORM files
	if (orm === "prisma") {
		const prismaDir = join(projectPath, "prisma");
		mkdirSync(prismaDir, { recursive: true });
		writeFileSync(join(prismaDir, "schema.prisma"), PRISMA_SCHEMA);

		const dbDir = join(srcDir, "db");
		mkdirSync(dbDir, { recursive: true });
		writeFileSync(join(dbDir, "index.ts"), PRISMA_DB_INDEX);

		// Add DATABASE_URL to .env
		const envPath = join(projectPath, ".env");
		const envContent = readFileSync(envPath, "utf-8");
		writeFileSync(
			envPath,
			envContent +
				"\nDATABASE_URL=postgresql://user:password@localhost:5432/mydb\n",
		);

		console.log("\x1b[32m\u2713 Created\x1b[0m prisma/schema.prisma");
		console.log("\x1b[32m\u2713 Created\x1b[0m src/db/index.ts");
	} else if (orm === "drizzle") {
		writeFileSync(join(projectPath, "drizzle.config.ts"), DRIZZLE_CONFIG);

		const dbDir = join(srcDir, "db");
		const schemasDir = join(dbDir, "schemas");
		mkdirSync(schemasDir, { recursive: true });
		writeFileSync(join(dbDir, "index.ts"), DRIZZLE_DB_INDEX);
		writeFileSync(join(schemasDir, "index.ts"), DRIZZLE_SCHEMAS_INDEX);

		const envPath = join(projectPath, ".env");
		const envContent = readFileSync(envPath, "utf-8");
		writeFileSync(
			envPath,
			envContent +
				"\nDATABASE_URL=postgresql://user:password@localhost:5432/mydb\n",
		);

		console.log("\x1b[32m\u2713 Created\x1b[0m drizzle.config.ts");
		console.log("\x1b[32m\u2713 Created\x1b[0m src/db/index.ts");
	} else if (orm === "typeorm") {
		writeFileSync(join(projectPath, "orm.config.ts"), TYPEORM_ORM_CONFIG);

		const dbDir = join(srcDir, "db");
		mkdirSync(dbDir, { recursive: true });
		writeFileSync(join(dbDir, "index.ts"), TYPEORM_DB_INDEX);

		const envPath = join(projectPath, ".env");
		const envContent = readFileSync(envPath, "utf-8");
		writeFileSync(
			envPath,
			envContent +
				"\nDATABASE_URL=postgresql://user:password@localhost:5432/mydb\n",
		);

		console.log("\x1b[32m\u2713 Created\x1b[0m orm.config.ts");
		console.log("\x1b[32m\u2713 Created\x1b[0m src/db/index.ts");
	}

	// Docker files
	if (useDocker) {
		writeFileSync(join(projectPath, "Dockerfile"), DOCKERFILE_TEMPLATE);
		writeFileSync(join(projectPath, ".dockerignore"), DOCKERIGNORE_CONTENT);
		writeFileSync(
			join(projectPath, "docker-compose.yml"),
			DOCKER_COMPOSE_TEMPLATE,
		);
		console.log("\x1b[32m\u2713 Created\x1b[0m Dockerfile");
		console.log("\x1b[32m\u2713 Created\x1b[0m .dockerignore");
		console.log("\x1b[32m\u2713 Created\x1b[0m docker-compose.yml");
	}

	// Vercel files
	if (useVercel) {
		writeFileSync(
			join(projectPath, "vercel.json"),
			JSON.stringify(VERCEL_JSON_TEMPLATE, null, 2) + "\n",
		);
		const publicDir = join(projectPath, "public");
		mkdirSync(publicDir, { recursive: true });
		writeFileSync(join(publicDir, ".gitkeep"), "");
		console.log("\x1b[32m\u2713 Created\x1b[0m vercel.json");
	}

	// SKILL.md
	copySkillMd(projectPath);

	// Install dependencies
	console.log("\n\x1b[90m  Installing dependencies...\x1b[0m\n");
	const proc = Bun.spawnSync(["bun", "install"], {
		cwd: projectPath,
		stdio: ["inherit", "inherit", "inherit"],
	});

	if (proc.exitCode !== 0) {
		console.error("\x1b[31mFailed to install dependencies\x1b[0m");
		process.exit(1);
	}

	// Success
	console.log(`
\x1b[32m\u2713 Project "${projectName}" created successfully!\x1b[0m

\x1b[36mGetting started:\x1b[0m
  cd ${projectName}
  bun run dev

\x1b[36mCode generation:\x1b[0m
  buntok create <entity>        # Generate all (schema, repo, service, controller)
  buntok create <entity> --schema  # Generate only schema
${orm !== "none" ? `\x1b[36mDatabase:\x1b[0m
  bun run db:generate                      # Generate migration/schema
  bun run db:migrate                       # Run migrations
  bun run db:studio                        # Open database studio
` : ""}${useDocker ? `\x1b[36mDocker:\x1b[0m
  docker compose up --build
` : ""}
\x1b[90mHappy coding with Buntok!\x1b[0m
`);
}

main();
