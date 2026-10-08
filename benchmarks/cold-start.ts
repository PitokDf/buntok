// Cold start benchmark - measures time from process start to first request served
import { performance } from "node:perf_hooks";

const frameworks = [
	{ name: "buntok", file: "./benchmarks/buntok.ts" },
	{ name: "elysia", file: "./benchmarks/elysia.ts" },
	{ name: "hono", file: "./benchmarks/hono.ts" },
];

const ITERATIONS = 5;

async function measureColdStart(file: string): Promise<number> {
	const start = performance.now();

	const proc = Bun.spawn(["bun", "run", file], {
		stdio: ["pipe", "pipe", "pipe"],
		env: { ...process.env, NODE_ENV: "production" },
	});

	// Wait for "running on" message
	const reader = proc.stdout.getReader();
	const decoder = new TextDecoder();
	let found = false;

	while (!found) {
		const { value, done } = await reader.read();
		if (done) break;
		const text = decoder.decode(value);
		if (text.includes("running on")) {
			found = true;
		}
	}

	const readyTime = performance.now() - start;

	// Send one request to confirm it's working
	try {
		await fetch("http://localhost:3000/plaintext");
	} catch {}

	proc.kill();
	// Wait for process to exit
	await proc.exited;

	return readyTime;
}

async function main() {
	console.log("🔥 Cold Start Benchmark\n");

	for (const fw of frameworks) {
		const times: number[] = [];
		for (let i = 0; i < ITERATIONS; i++) {
			// Wait a bit between runs
			await new Promise((r) => setTimeout(r, 500));
			const t = await measureColdStart(fw.file);
			times.push(t);
		}
		const avg = times.reduce((a, b) => a + b, 0) / times.length;
		const min = Math.min(...times);
		const max = Math.max(...times);
		console.log(`${fw.name}: avg=${avg.toFixed(1)}ms min=${min.toFixed(1)}ms max=${max.toFixed(1)}ms`);
	}
}

main();
