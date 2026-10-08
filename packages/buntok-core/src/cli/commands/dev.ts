import { resolve } from "node:path";
import { buildChildEnv, loadEnvFiles, watchEnvFiles, type LoadedEnv } from "../env.js";
import { findEntryFile } from "../project.js";

export async function devCommand(flags: string[]): Promise<void> {
	const isExpose = flags.includes("--expose");
	const port = flags.find(f => f.startsWith("--port="))?.split("=")[1] || "1212";

	const targetDir = process.cwd();

	// Find the user's entry point (shared candidate list + content probe)
	const entry = findEntryFile(targetDir);

	if (!entry) {
		console.error("\x1b[31mError: Could not find app entry point (server.ts, src/index.ts, src/main.ts, src/app.ts, or src/server.ts)\x1b[0m");
		process.exitCode = 1;
		return;
	}
	const entryFile = resolve(targetDir, entry);

	// Build dev command
	const args = ["--watch", entryFile];

	// Resolve the tunnel before spawning so a missing localtunnel never leaves
	// an orphan server process behind.
	let tunnel: { url: string; close: () => Promise<unknown> } | undefined;
	if (isExpose) {
		console.log("\x1b[36mStarting development server with tunnel...\x1b[0m\n");
		try {
			// biome-ignore lint/suspicious/noExplicitAny: optional dynamic import
			const lt = await import("localtunnel" as string);
			// biome-ignore lint/suspicious/noExplicitAny: optional dynamic import
			tunnel = await (lt as any).default({
				port: Number.parseInt(port),
				subdomain: `buntok-${Date.now()}`,
			});
		} catch (err: any) {
			if (err.message?.includes("Cannot find module") || err.code === "ERR_MODULE_NOT_FOUND") {
				console.error("\x1b[31mError: localtunnel is required for --expose flag\x1b[0m");
				console.error("Install it with: \x1b[36mbun add -d localtunnel\x1b[0m");
				process.exitCode = 1;
				return;
			}
			throw err;
		}
	}

	// Environment for the child: parent values minus stale .env keys, overlaid
	// with the freshly parsed .env files. Bun lets the environment win over
	// .env files, so the merge has to be explicit whenever .env changes.
	let envKeys = new Set<string>();
	const nextEnv = (fresh: LoadedEnv): Record<string, string> => {
		const env = buildChildEnv(process.env, envKeys, fresh, {
			NODE_ENV: "development",
			PORT: port,
		});
		envKeys = new Set(fresh.keys);
		return env;
	};

	const spawnServer = (env: Record<string, string>) =>
		Bun.spawn(["bun", "run", ...args], {
			stdio: ["inherit", "inherit", "inherit"],
			env,
			cwd: targetDir,
		});

	let proc = spawnServer(nextEnv(loadEnvFiles(targetDir)));

	// Restart when any .env file changes - Bun's own --watch ignores .env.
	let restartRequested = false;
	const stopEnvWatch = watchEnvFiles(targetDir, (file) => {
		if (restartRequested) return;
		restartRequested = true;
		console.log(`\x1b[33m  🔁 ${file} changed - restarting dev server...\x1b[0m`);
		proc.kill();
	});

	const runServer = async (): Promise<void> => {
		for (;;) {
			await proc.exited;
			if (!restartRequested) return;
			restartRequested = false;
			const fresh = loadEnvFiles(targetDir);
			console.log(`\x1b[32m  ✅ Dev server restarted\x1b[0m`);
			proc = spawnServer(nextEnv(fresh));
		}
	};

	// Kill the child whenever this process goes away - SIGTERM to the parent
	// alone would otherwise leave an orphaned `bun --watch` behind.
	const shutdown = async () => {
		stopEnvWatch();
		proc.kill();
		if (tunnel) await tunnel.close();
		process.exit(0);
	};
	process.on("SIGINT", () => {
		void shutdown();
	});
	process.on("SIGTERM", () => {
		void shutdown();
	});
	process.on("exit", () => {
		stopEnvWatch();
		proc.kill();
	});

	if (tunnel) {
		console.log(`\x1b[32m  Server running at http://localhost:${port}\x1b[0m`);
		console.log(`\x1b[36m  Tunnel: ${tunnel.url} → http://localhost:${port}\x1b[0m`);
		console.log(`\n  Press Ctrl+C to stop\n`);

		await runServer();
		await tunnel.close();
	} else {
		console.log(`\x1b[36mStarting development server...\x1b[0m\n`);
		console.log(`\x1b[32m  Server running at http://localhost:${port}\x1b[0m`);
		console.log(`\n  Press Ctrl+C to stop\n`);

		await runServer();
		stopEnvWatch();
	}
}
