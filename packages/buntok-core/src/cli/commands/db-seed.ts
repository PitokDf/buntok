import { existsSync } from "node:fs";
import fs from "node:fs/promises";
import { join, resolve } from "node:path";
import { detectORMOrNull, type ORM } from "../project.js";

export async function dbSeedCommand(orm?: ORM) {
	const detectedOrm = orm ?? detectORMOrNull() ?? "prisma";
	console.log("\x1b[36mRunning Database Seeders...\x1b[0m\n");

	const seederDir = resolve(process.cwd(), "src/db/seeders");

	if (!existsSync(seederDir)) {
		console.warn(
			`\x1b[33mWarning: No seeders directory found at ${seederDir}\x1b[0m`,
		);
		return;
	}

	const files = await fs.readdir(seederDir);
	const seederFiles = files.filter(
		(f) => f.endsWith(".ts") && !f.endsWith(".d.ts") && !f.startsWith("."),
	);

	if (seederFiles.length === 0) {
		console.log("\x1b[90mNo seeders to run.\x1b[0m");
		return;
	}

	// TypeORM needs an initialized DataSource; Prisma/Drizzle connect lazily
	const preamble =
		detectedOrm === "typeorm"
			? `import { AppDataSource } from "@/lib/data-source";\nawait AppDataSource.initialize();\n`
			: "";
	const epilogue =
		detectedOrm === "typeorm" ? `\n  await AppDataSource.destroy();` : "";

	// Create a temporary runner script to execute all seeders in the user's app context
	const runnerContent = `${seederFiles.map((file, i) => `import * as seeder${i} from "./${file.replace(".ts", "")}";`).join("\n")}
${preamble}
async function runSeeders() {
  console.log("🌱 Starting database seeding...");
  
  try {
    ${seederFiles
			.map(
				(_file, i) => `
    for (const key of Object.keys(seeder${i})) {
      if (typeof (seeder${i} as any)[key] === 'function') {
        await (seeder${i} as any)[key]();
      }
    }`,
			)
			.join("\n    ")}
    
    console.log("✅ All seeders executed successfully!");${epilogue}
    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
}

runSeeders();
`;

	const runnerPath = join(seederDir, ".runner.ts");
	await fs.writeFile(runnerPath, runnerContent);

	try {
		const proc = Bun.spawnSync(["bun", "run", runnerPath], {
			cwd: process.cwd(),
			stdio: ["inherit", "inherit", "inherit"],
		});

		if (proc.exitCode !== 0) {
			console.error("\x1b[31mSeeding process failed.\x1b[0m");
		}
	} finally {
		// Cleanup temporary runner
		if (existsSync(runnerPath)) {
			await fs.unlink(runnerPath);
		}
	}
}
