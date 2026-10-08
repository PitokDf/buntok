import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const __dirname = import.meta.dir;

export const BIOME_CONFIG = {
	vcs: {
		enabled: true,
		clientKind: "git",
		useIgnoreFile: true,
	},
	files: {
		ignoreUnknown: true,
		includes: [
			"**",
			"!**/node_modules",
			"!**/dist",
			"!**/buntok",
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
			correctness: {
				noUnusedImports: {
					level: "warn",
					fix: "safe",
				},
			},
			suspicious: {
				noExplicitAny: "off",
			},
		},
	},
	javascript: {
		formatter: {
			quoteStyle: "double",
			trailingCommas: "all",
		},
	},
};

export const TSCONFIG_TEMPLATE = {
	compilerOptions: {
		// Environment setup & latest features
		lib: ["ESNext"],
		target: "ESNext",
		module: "Preserve",
		moduleDetection: "force",
		jsx: "react-jsx",
		allowJs: true,
		types: ["bun", "node"],

		// Bundler mode
		moduleResolution: "bundler",
		allowImportingTsExtensions: true,
		verbatimModuleSyntax: true,
		noEmit: true,

		// Strictness Options for TS 7+
		strict: true,
		noUncheckedIndexedAccess: true,
		exactOptionalPropertyTypes: true,
		noImplicitOverride: true,
		noFallthroughCasesInSwitch: true,
		isolatedModules: true,
		skipLibCheck: true,

		// Path alias
		paths: {
			"@/*": ["./src/*"],
		},
	},
	include: ["src/**/*"],
	exclude: ["node_modules", "buntok"],
};

export const VSCODE_SETTINGS = {
	"editor.formatOnSave": true,
	"editor.defaultFormatter": "biomejs.biome",
	"editor.codeActionsOnSave": {
		"source.fixAll.biome": "explicit",
		"source.organizeImports.biome": "explicit",
	},
	"[javascript]": {
		"editor.defaultFormatter": "biomejs.biome",
	},
	"[typescript]": {
		"editor.defaultFormatter": "biomejs.biome",
	},
	"[typescriptreact]": {
		"editor.defaultFormatter": "biomejs.biome",
	},
	"[json]": {
		"editor.defaultFormatter": "biomejs.biome",
	},
	"[jsonc]": {
		"editor.defaultFormatter": "biomejs.biome",
	},
	"[html]": {
		"editor.defaultFormatter": "biomejs.biome",
	},
	"[css]": {
		"editor.defaultFormatter": "biomejs.biome",
	},
};

export const INDEX_TEMPLATE = `import { Buntok } from "@buntok/core";
import "./env";

export const app = new Buntok();

app.get("/", (ctx) => {
	return ctx.json({ message: "Hello from Buntok!" });
});

export default app;
`;

export const ENV_TS_TEMPLATE = `import { Buntok } from "@buntok/core";
import { z } from "@buntok/core/middlewares/validator";

export const env = Buntok.validateEnv({
	PORT: z.coerce.number().default(1212),
	AUTH_STORE: z.enum(["header", "cookie"]).default("header"),
	AUTH_COOKIE: z.string().default("session"),
	NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});
`;

export const SERVER_TS_TEMPLATE = `import { app } from "./src/index";
import { env } from "./src/env";

app.listen(env.PORT);

export { app };
`;

export const ENV_CONTENT = `# Buntok Configuration
PORT=1212
AUTH_STORE=header
AUTH_COOKIE=session
`;

export const ENV_EXAMPLE_CONTENT = `# Buntok Configuration
#
# PORT: port is using for the app
# AUTH_STORE: Where to store/read JWT tokens
#   - "header" (default): Read from Authorization: Bearer <token> header
#   - "cookie": Read from HttpOnly cookie (set AUTH_COOKIE for cookie name)
#
# AUTH_COOKIE: Cookie name for JWT storage (only used when AUTH_STORE=cookie)
#
PORT=1212
AUTH_STORE=header
AUTH_COOKIE=session
`;

export const VERCEL_JSON_TEMPLATE = {
	$schema: "https://openapi.vercel.sh/vercel.json",
	framework: "bun",
	bunVersion: "1.4.x",
	outputDirectory: "buntok",
	regions: ["sin1"],
};

export const GITIGNORE_CONTENT = `# Dependencies
node_modules/

# Build output
buntok/

# Environment
.env
.env.local
.env.*.local

# IDE
.vscode/
.idea/
*.swp
*.swo
*~
public/swagger.json

# OS
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*

# Coverage
coverage/
`;

export const DOCKERFILE_TEMPLATE = `# Builder
FROM oven/bun:1-alpine AS builder
WORKDIR /app

COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile --production

COPY src/ src/
COPY server.ts ./
COPY tsconfig.json ./
COPY package.json ./

RUN bunx buntok build

# Production
FROM oven/bun:1-alpine
WORKDIR /app

COPY --from=builder /app/buntok buntok
COPY --from=builder /app/node_modules node_modules
COPY --from=builder /app/package.json ./

EXPOSE 1212

ENV NODE_ENV=production
ENV PORT=1212

CMD ["bun", "buntok/server.js"]
`;

export const DOCKERIGNORE_CONTENT = `node_modules
dist
buntok
*.log
.env
.env.*
coverage
`;

export function findSkillMdSource(): string | null {
	// 1. Relative path (works when running from @buntok/core package)
	const relativePath = join(
		__dirname,
		"..",
		"..",
		"scripts",
		"buntok-skill",
		"SKILL.md",
	);
	if (existsSync(relativePath)) return relativePath;

	// 2. Resolve from @buntok/core package (works when running from buntok CLI)
	try {
		// biome-ignore lint: dynamic import for package resolution
		const pkgJson = require.resolve("@buntok/core/package.json");
		const pkgDir = dirname(pkgJson);
		const skillPath = join(pkgDir, "scripts", "buntok-skill", "SKILL.md");
		if (existsSync(skillPath)) return skillPath;
	} catch {
		// package not found
	}

	return null;
}

export function copySkillMd(projectRoot: string): boolean {
	const sourceSkill = findSkillMdSource();

	if (!sourceSkill) {
		console.warn(
			"\x1b[33m⚠ SKILL.md not found in @buntok/core, skipping.\x1b[0m",
		);
		return false;
	}

	const skillDir = join(projectRoot, ".agents", "skills", "buntok-skill");
	const destSkill = join(skillDir, "SKILL.md");

	if (!existsSync(skillDir)) {
		mkdirSync(skillDir, { recursive: true });
	}

	writeFileSync(destSkill, readFileSync(sourceSkill, "utf-8"), "utf-8");
	console.log(`\x1b[32m✓ Created\x1b[0m .agents/skills/buntok-skill/SKILL.md`);
	return true;
}
