import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import { statSync } from "node:fs";
import os from "node:os";
import autocannon from "autocannon";
import { extraRoutes } from "./extra-routes.mjs";

/**
 * Alternating-rounds benchmark runner.
 *
 * Protocol (mirrors bun-http-framework-benchmark cases, fairness protocol from
 * the framework-bun A/B runs):
 *   - 4 spec routes: Ping, Query, Body (POST mirror), Video (streamed file)
 *   - ROUNDS total: round 0 is a warmup pass (spec verification, memory and
 *     time-series sampling), rounds 1..N-1 are measured; the best measured
 *     req/s per route wins (best-of).
 *   - Framework order is rotated every round so no framework always runs hot
 *     or cold.
 *   - bombardier --fasthttp, 10s per route, 500 connections (video: 10).
 *   - Server runs the minified Bun.build artifact (bundle size column).
 *   - express/fastify run on node, hono/elysia/buntok run on bun.
 *   - On Linux, server and load generator are pinned to disjoint core sets.
 */

const BASE = "http://127.0.0.1:3000";
const VIDEO_PATH = "benchmarks/public/kyuukurarin.mp4";
const videoSize = statSync(VIDEO_PATH).size;

type Runtime = "bun" | "node";
type RouteSpec = { key: string; connections?: number; args: string[] };

const frameworks: { name: string; runtime: Runtime }[] = [
	{ name: "express", runtime: "node" },
	{ name: "fastify", runtime: "node" },
	{ name: "hono", runtime: "bun" },
	{ name: "elysia", runtime: "bun" },
	{ name: "buntok", runtime: "bun" },
];

const ROUNDS = Number(process.env.BENCH_ROUNDS ?? 3);
const MEASURED_ROUNDS = ROUNDS - 1;
const CONNECTIONS = Number(process.env.BENCH_CONNS ?? 500);
const DURATION = process.env.BENCH_DURATION ?? "10s";
const VIDEO_CONNECTIONS = 10;

if (!Number.isInteger(ROUNDS) || MEASURED_ROUNDS < 1) {
	throw new Error(`BENCH_ROUNDS must be >= 2 (got ${ROUNDS})`);
}

const routes: RouteSpec[] = [
	{ key: "/", args: [`${BASE}/`] },
	{ key: "/id/1?name=bun", args: [`${BASE}/id/1?name=bun`] },
	{
		key: "POST /json",
		args: [
			"-m",
			"POST",
			"-H",
			"Content-Type:application/json",
			"-f",
			"./benchmarks/body.json",
			`${BASE}/json`,
		],
	},
	{
		key: "/video",
		connections: VIDEO_CONNECTIONS,
		args: [
			"-H",
			"Cache-Control:no-store",
			"-H",
			'If-None-Match:"benchmark-force-full-response"',
			`${BASE}/video`,
		],
	},
];

const verifyOnly = process.argv.includes("--verify");
const pinning = os.platform() === "linux" && os.cpus().length >= 2;

function coreSets() {
	const numCores = os.cpus().length;
	const mid = Math.floor(numCores / 2);
	return {
		server: numCores === 2 ? "0" : `0-${mid - 1}`,
		load: numCores === 2 ? "1" : `${mid}-${numCores - 1}`,
	};
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

function execCapture(
	cmd: string,
	args: string[],
): Promise<{ code: number; stdout: string; stderr: string }> {
	return new Promise((resolve) => {
		const child = spawn(cmd, args, { stdio: "pipe" });
		let stdout = "";
		let stderr = "";
		child.stdout?.on("data", (d: Buffer) => {
			stdout += d.toString();
		});
		child.stderr?.on("data", (d: Buffer) => {
			stderr += d.toString();
		});
		child.on("close", (code) =>
			resolve({ code: code ?? 1, stdout, stderr }),
		);
	});
}

type ServerHandle = {
	pid: number;
	kill: () => Promise<void>;
	output: () => string;
};

function spawnServer(fw: {
	name: string;
	runtime: Runtime;
}): ServerHandle {
	const file =
		fw.runtime === "node"
			? `benchmarks/dist/${fw.name}/index.cjs`
			: `benchmarks/dist/${fw.name}/index.js`;
	const exe = fw.runtime === "node" ? "node" : "bun";
	const { server: serverCores } = coreSets();
	const args = pinning
		? ["-c", serverCores, exe, file]
		: [exe, file];
	const child = spawn(pinning ? "taskset" : exe, args, {
		env: { ...process.env, NODE_ENV: "production" },
		stdio: "pipe",
	});
	let out = "";
	child.stdout?.on("data", (d: Buffer) => {
		out += d.toString();
	});
	child.stderr?.on("data", (d: Buffer) => {
		out += d.toString();
	});
	return {
		pid: child.pid ?? -1,
		kill: () =>
			new Promise((resolve) => {
				if (child.exitCode !== null) return resolve();
				child.on("close", () => resolve());
				child.kill("SIGTERM");
				setTimeout(() => {
					if (child.exitCode === null) child.kill("SIGKILL");
					resolve();
				}, 3000);
			}),
		output: () => out,
	};
}

async function assertPortFree() {
	for (let i = 0; i < 50; i++) {
		try {
			await fetch(`${BASE}/`, { signal: AbortSignal.timeout(500) });
		} catch {
			return;
		}
		await wait(100);
	}
	throw new Error(
		"Port 3000 is still occupied (stale bench server or `next dev`?) - stop it before re-running",
	);
}

async function waitReady(server: ServerHandle): Promise<number> {
	const startedAt = performance.now();
	while (performance.now() - startedAt < 10_000) {
		try {
			const res = await fetch(`${BASE}/`, {
				signal: AbortSignal.timeout(1000),
			});
			if (res.status === 200) {
				const body = await res.text();
				if (body !== "Hi") {
					throw new Error(
						`Port 3000 is serving a foreign app (body: ${JSON.stringify(body.slice(0, 60))}) - ` +
							"stop `next dev` or anything else on port 3000 before running the benchmark",
					);
				}
				return performance.now() - startedAt;
			}
		} catch (err) {
			if (err instanceof Error && err.message.includes("foreign app")) {
				throw err;
			}
			// server not up yet
		}
		await wait(50);
	}
	throw new Error(`Server did not become ready:\n${server.output()}`);
}

async function verifySpec() {
	const index = await fetch(`${BASE}/`);
	if ((await index.text()) !== "Hi")
		throw new Error("Ping: body mismatch");
	if (!index.headers.get("content-type")?.includes("text/plain"))
		throw new Error("Ping: content-type mismatch");

	const query = await fetch(`${BASE}/id/1?name=bun`);
	if ((await query.text()) !== "1 bun")
		throw new Error("Query: body mismatch");
	if (!query.headers.get("content-type")?.includes("text/plain"))
		throw new Error("Query: content-type mismatch");
	if (!query.headers.get("x-powered-by")?.includes("benchmark"))
		throw new Error("Query: x-powered-by mismatch");

	const edge = await fetch(`${BASE}/id/1?id=1`);
	if ((await edge.text()) !== "1 ")
		throw new Error("Query edge: body mismatch");

	const body = await fetch(`${BASE}/json`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ hello: "world" }),
	});
	if ((await body.text()) !== JSON.stringify({ hello: "world" }))
		throw new Error("Body: mirror mismatch");
	if (!body.headers.get("content-type")?.includes("application/json"))
		throw new Error("Body: content-type mismatch");

	const video = await fetch(`${BASE}/video`, {
		headers: {
			"Cache-Control": "no-store",
			'If-None-Match': '"benchmark-force-full-response"',
		},
	});
	if (video.status !== 200)
		throw new Error(`Video: expected 200, got ${video.status}`);
	if (!video.headers.get("content-type")?.includes("video/mp4"))
		throw new Error("Video: content-type mismatch");
	const bytes = (await video.arrayBuffer()).byteLength;
	if (bytes !== videoSize)
		throw new Error(`Video: expected ${videoSize} bytes, got ${bytes}`);
}

async function memoryUsage(pid: number): Promise<number | null> {
	const { code, stdout } = await execCapture("ps", [
		"-o",
		"rss=",
		"-p",
		String(pid),
	]);
	if (code !== 0) return null;
	const rss = Number.parseInt(stdout.trim(), 10);
	return Number.isFinite(rss) ? rss * 1024 : null;
}

async function buildOne(fw: { name: string; runtime: Runtime }) {
	const isNode = fw.runtime === "node";
	const result = await Bun.build({
		entrypoints: [`benchmarks/${fw.name}.ts`],
		outdir: `benchmarks/dist/${fw.name}`,
		naming: isNode ? "index.cjs" : "index.js",
		target: fw.runtime,
		format: isNode ? "cjs" : "esm",
		minify: true,
	});
	if (!result.success) {
		result.logs.forEach((log) => console.error(log));
		throw new Error(`Build failed for ${fw.name}`);
	}
	const out = `benchmarks/dist/${fw.name}/${isNode ? "index.cjs" : "index.js"}`;
	const { size } = await fs.stat(out);
	return size;
}

function bombardierArgs(route: RouteSpec): string[] {
	return [
		"--fasthttp",
		"-c",
		String(route.connections ?? CONNECTIONS),
		"-d",
		DURATION,
		"-l",
		"-o",
		"json",
		...route.args,
	];
}

async function runBombardier(route: RouteSpec) {
	const args = bombardierArgs(route);
	const { load: loadCores } = coreSets();
	const cmd = pinning ? "taskset" : "./bombardier";
	const fullArgs = pinning
		? ["-c", loadCores, "./bombardier", ...args]
		: args;
	const { code, stdout, stderr } = await execCapture(cmd, fullArgs);
	if (code !== 0) {
		throw new Error(
			`bombardier failed for ${route.key}: ${stderr.trim() || stdout}`,
		);
	}
	const jsonMatch = stdout.match(/\{"spec":.*/);
	if (!jsonMatch) {
		throw new Error(`No JSON result for ${route.key}: ${stdout}`);
	}
	const data = JSON.parse(jsonMatch[0]);
	if (!data.result) throw new Error(`Empty result for ${route.key}`);
	return data.result;
}

type RouteRun = {
	reqPerSec: number;
	latencyAvg: number;
	latencyMax: number;
	latencyP50: number | null;
	latencyP90: number | null;
	latencyP95: number | null;
	latencyP99: number | null;
	throughput: number;
	requests: number;
	errors: number;
};

function toRouteRun(result: any): RouteRun {
	return {
		reqPerSec: result.rps.mean,
		latencyAvg: result.latency.mean,
		latencyMax: result.latency.max,
		latencyP50: result.latency.percentiles?.["50"] ?? null,
		latencyP90: result.latency.percentiles?.["90"] ?? null,
		latencyP95: result.latency.percentiles?.["95"] ?? null,
		latencyP99: result.latency.percentiles?.["99"] ?? null,
		throughput: result.bytesRead.mean,
		requests:
			result.req1xx +
			result.req2xx +
			result.req3xx +
			result.req4xx +
			result.req5xx,
		errors: result.req4xx + result.req5xx,
	};
}

async function runTimeSeries(fwName: string) {
	const points: { reqPerSec: number }[] = [];
	const instance = autocannon({
		url: `${BASE}/`,
		connections: 100,
		duration: 10,
	}) as ReturnType<typeof autocannon> & NodeJS.EventEmitter;

	instance.on("tick", (stats: any) => {
		if (stats.counter > 0) points.push({ reqPerSec: stats.counter });
	});
	await new Promise<void>((resolve) =>
		instance.on("done", () => resolve()),
	);
	return points;
}

async function main() {
	console.log(
		`Benchmark suite: ${ROUNDS} rounds (1 warmup + ${MEASURED_ROUNDS} measured, best-of), ` +
		`-c${CONNECTIONS} --fasthttp -d${DURATION}, video c${VIDEO_CONNECTIONS}`,
	);

	// ── Build phase: minified artifacts + bundle sizes ──
	const bundleSizes: Record<string, number> = {};
	for (const fw of frameworks) {
		process.stdout.write(`Building ${fw.name}... `);
		bundleSizes[fw.name] = await buildOne(fw);
		console.log(
			`${(bundleSizes[fw.name]! / 1024).toFixed(1)} KB (${fw.runtime})`,
		);
	}

	// ── Verify phase: spec compliance before any load test ──
	const stats: Record<
		string,
		{
			startupTime: number;
			memoryBefore: number | null;
			memoryAfter: number | null;
		}
	> = {};
	const timeSeries: Record<string, { reqPerSec: number }[]> = {};
	for (const fw of frameworks) {
		console.log(`Verifying ${fw.name}...`);
		await assertPortFree();
		const server = spawnServer(fw);
		try {
			await waitReady(server);
			await verifySpec();
		} finally {
			await server.kill();
			await wait(2000);
		}
	}
	if (verifyOnly) {
		console.log("All frameworks passed spec verification.");
		return;
	}

	// ── Round loop: alternating framework order ──
	const runs: Record<string, Record<string, RouteRun[]>> = {};
	for (const fw of frameworks) runs[fw.name] = {};

	for (let round = 0; round < ROUNDS; round++) {
		const offset = round % frameworks.length;
		const order = [
			...frameworks.slice(offset),
			...frameworks.slice(0, offset),
		];
		const phase = round === 0 ? "warmup" : `round ${round}/${ROUNDS - 1}`;
		console.log(`\n=== ${phase} - order: ${order.map((f) => f.name).join(", ")} ===`);

		for (const fw of order) {
			console.log(`\n${fw.name} (${fw.runtime})`);
			await assertPortFree();
			const server = spawnServer(fw);
			try {
				const startupTime = await waitReady(server);
				if (round === 0) {
					await verifySpec();
					stats[fw.name] = {
						startupTime,
						memoryBefore: await memoryUsage(server.pid),
						memoryAfter: null,
					};
				}

				for (const route of routes) {
					process.stdout.write(`  - ${route.key} ... `);
					const result = await runBombardier(route);
					const run = toRouteRun(result);
					(runs[fw.name]![route.key] ??= []).push(run);
					console.log(`${Math.round(run.reqPerSec)} req/sec`);
				}

				if (round === 0) {
					stats[fw.name].memoryAfter = await memoryUsage(server.pid);
					process.stdout.write(`  - time series ... `);
					timeSeries[fw.name] = await runTimeSeries(fw.name);
					console.log(`${timeSeries[fw.name]?.length} points`);
				}
			} finally {
				await server.kill();
				await wait(3000);
			}
		}
	}

	// ── Aggregate: best-of measured rounds (round 0 is warmup) ──
	const results: Record<string, any> = {};
	for (const fw of frameworks) {
		results[fw.name] = {
			runtime: fw.runtime,
			bundleSize: bundleSizes[fw.name],
			...stats[fw.name],
		};
		for (const route of routes) {
			const rounds = runs[fw.name]![route.key] ?? [];
			const measured = rounds.slice(1);
			if (measured.length === 0) continue;
			const best = measured.reduce((a, b) =>
				b.reqPerSec > a.reqPerSec ? b : a,
			);
			results[fw.name][route.key] = {
				...best,
				rounds: rounds.map((r) => r.reqPerSec),
			};
		}
	}

	const cpus = os.cpus();
	const nodeVersion = (
		await execCapture(process.env.NODE_EXECUTABLE ?? "node", ["--version"])
	).stdout.trim();
	const cores = cpus.length;
	const mid = Math.floor(cores / 2);
	const machineInfo = {
		cpu: cpus[0]?.model ?? "Unknown",
		cores,
		memory: `${Math.round(os.totalmem() / (1024 * 1024 * 1024))}GB`,
		os: `${os.type()} ${os.release()}`,
		runtime: `Bun ${Bun.version} / ${nodeVersion || "node n/a"}`,
		date: new Date().toISOString(),
	};

	const methodology = {
		rounds: ROUNDS,
		warmupRounds: 1,
		measuredRounds: MEASURED_ROUNDS,
		aggregation: "best-of measured rounds per route",
		duration: DURATION,
		connections: CONNECTIONS,
		videoConnections: VIDEO_CONNECTIONS,
		client: "bombardier --fasthttp",
		scoring: "mean of per-route req/s",
		p50: "median across routes",
		p99: "worst route",
		backgroundRoutes: extraRoutes.length * 2,
		backgroundNote:
			"registered but never requested (real-world route table size)",
		runtimes: Object.fromEntries(
			frameworks.map((f) => [f.name, f.runtime]),
		),
		build: "Bun.build (minify); servers run the built artifact",
		corePinning: pinning
			? `taskset: server cores 0-${mid - 1}, load generator cores ${mid}-${cores - 1}`
			: "none",
		verification:
			"4-route spec + dynamic-query edge asserted before the load test",
	};

	const finalReport = {
		machine: machineInfo,
		methodology,
		frameworks: results,
		timeSeries,
	};

	const jsonString = JSON.stringify(finalReport, null, 2);
	const targets = [
		"dashboard-data.json",
		"benchmarks/dashboard/public/dashboard-data.json",
		"packages/buntok-docs/public/dashboard-data.json",
	];
	for (const target of targets) {
		try {
			await fs.writeFile(target, jsonString);
			console.log(`Wrote ${target}`);
		} catch (e) {
			console.warn(`Could not write ${target}`, e);
		}
	}
	console.log("\nDone: dashboard-data.json generated.");
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
