import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { createInterface } from "node:readline";
import { detectORMOrNull, type ORM } from "../project.js";
import { dbSeedCommand } from "./db-seed.js";

type DbCommand = "migrate" | "seed" | "reset" | "generate" | "studio" | "status";

function runCommand(cmd: string, dryRun = false): void {
	if (dryRun) {
		console.log(`\x1b[90m[dry-run] Would execute: ${cmd}\x1b[0m`);
		return;
	}
	console.log(`\x1b[90m$ ${cmd}\x1b[0m`);
	try {
		execSync(cmd, { stdio: "inherit", cwd: process.cwd() });
	} catch {
		// Command already printed its error
		process.exitCode = 1;
	}
}

async function confirm(message: string): Promise<boolean> {
	const rl = createInterface({ input: process.stdin, output: process.stdout });
	return new Promise((resolve) => {
		rl.question(`\x1b[33m${message} (y/N): \x1b[0m`, (answer) => {
			rl.close();
			resolve(answer.toLowerCase() === "y" || answer.toLowerCase() === "yes");
		});
	});
}

function prismaCommand(subcommand: string, args: string[], dryRun = false): void {
	const cmd = `npx prisma ${subcommand} ${args.join(" ")}`.trim();
	runCommand(cmd, dryRun);
}

function drizzleCommand(subcommand: string, args: string[], dryRun = false): void {
	const commands: Record<string, string> = {
		migrate: "drizzle-kit generate",
		seed: "drizzle-kit seed",
		reset: "drizzle-kit drop",
		status: "drizzle-kit check",
		generate: "drizzle-kit generate",
		studio: "drizzle-kit studio",
	};
	const cmd = `${commands[subcommand] ?? subcommand} ${args.join(" ")}`.trim();
	runCommand(cmd, dryRun);
}

function typeormCommand(subcommand: string, args: string[], dryRun = false): void {
	const commands: Record<string, string> = {
		migrate: "typeorm migration:run",
		seed: "typeorm seed",
		reset: "typeorm migration:revert",
		generate: "typeorm migration:generate",
		status: "typeorm migration:show",
		studio: "echo 'TypeORM does not have a built-in studio command'",
	};
	const cmd = `${commands[subcommand] ?? subcommand} ${args.join(" ")}`.trim();
	runCommand(cmd, dryRun);
}

function printUsage(): void {
	console.log(`
\x1b[36mUsage:\x1b[0m
  buntok db <command> [args] [flags]

\x1b[36mCommands:\x1b[0m
  migrate [name]      Run pending migrations
  seed                Seed database
  reset               Reset database (drop & recreate)
  generate            Generate migration from schema changes
  studio              Open database GUI
  status              Show migration status

\x1b[36mFlags:\x1b[0m
  --dry-run           Preview command without executing

\x1b[36mSupported ORMs:\x1b[0m
  Prisma, Drizzle, TypeORM (auto-detected)

\x1b[36mExamples:\x1b[0m
  buntok db migrate                    # Run pending migrations
  buntok db migrate add user_table     # Create new migration
  buntok db seed                       # Seed database
  buntok db studio                     # Open Prisma Studio / etc
  buntok db reset --dry-run            # Preview reset command
`);
}

const DESTRUCTIVE_COMMANDS: DbCommand[] = ["reset"];

/**
 * A project-level seed configuration takes precedence (e.g. Prisma's
 * `prisma.seed` key in package.json). Otherwise, if the local seeders
 * directory exists, `buntok db seed` runs them via the built-in runner.
 */
function hasOrmSeedConfig(orm: ORM): boolean {
	if (orm !== "prisma" || !existsSync("package.json")) return false;
	try {
		const pkg = JSON.parse(readFileSync("package.json", "utf-8")) as {
			prisma?: { seed?: unknown };
		};
		return Boolean(pkg.prisma?.seed);
	} catch {
		return false;
	}
}

export async function dbCommand(args: string[]): Promise<void> {
	const subcommand = args[0] as DbCommand | undefined;

	if (!subcommand) {
		printUsage();
		return;
	}

	const validCommands: DbCommand[] = ["migrate", "seed", "reset", "generate", "studio", "status"];
	if (!validCommands.includes(subcommand)) {
		console.error(`\x1b[31mUnknown command: ${subcommand}\x1b[0m`);
		printUsage();
		process.exitCode = 1;
		return;
	}

	const orm = detectORMOrNull();
	if (!orm) {
		console.error("\x1b[31mCould not detect ORM.\x1b[0m");
		console.error("Supported: Prisma, Drizzle, TypeORM");
		console.error("Make sure you have one installed in package.json.");
		process.exitCode = 1;
		return;
	}

	const dryRun = args.includes("--dry-run");
	const subArgs = args.slice(1).filter((a) => a !== "--dry-run");

	console.log(`\x1b[36mDetected ORM: ${orm}\x1b[0m`);

	// Local seeders fallback: `buntok db seed` runs src/db/seeders directly
	// when the ORM has no seed configuration of its own.
	if (subcommand === "seed" && !hasOrmSeedConfig(orm)) {
		const localSeeders = join("src", "db", "seeders");
		if (existsSync(localSeeders)) {
			if (dryRun) {
				console.log(
					`\x1b[90m[dry-run] Would run local seeders from ${localSeeders} (orm: ${orm})\x1b[0m`,
				);
				return;
			}
			await dbSeedCommand(orm);
			return;
		}
	}

	// Confirmation for destructive commands
	if (DESTRUCTIVE_COMMANDS.includes(subcommand) && !dryRun) {
		const confirmed = await confirm(
			`\x1b[31mWARNING: This will ${subcommand} the database. Continue?\x1b[0m`,
		);
		if (!confirmed) {
			console.log("\x1b[90mAborted.\x1b[0m");
			return;
		}
	}

	switch (orm) {
		case "prisma":
			prismaCommand(subcommand, subArgs, dryRun);
			break;
		case "drizzle":
			drizzleCommand(subcommand, subArgs, dryRun);
			break;
		case "typeorm":
			typeormCommand(subcommand, subArgs, dryRun);
			break;
	}
}
