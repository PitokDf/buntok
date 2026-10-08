#!/usr/bin/env bun

import { JSTrie } from "./src/ffi/fallback";

// ─── Load Native Trie (old implementation - for comparison only) ──────────────

let nativeLib: any = null;
let ffi: any = null;

function tryLoadNative(): boolean {
	try {
		ffi = require("bun:ffi");
		const fs = require("node:fs");
		const path = require("node:path");

		const ext =
			process.platform === "win32"
				? ".dll"
				: process.platform === "darwin"
					? ".dylib"
					: ".so";
		const prefix = process.platform === "win32" ? "" : "lib";

		const candidates = [
			path.join(
				process.cwd(),
				"node_modules",
				".buntok-native",
				`${prefix}buntok_trie${ext}`,
			),
			path.join(process.cwd(), "dist", "native", `${prefix}buntok_trie${ext}`),
			path.join(process.cwd(), "zig-out", "lib", `${prefix}buntok_trie${ext}`),
			path.join(process.cwd(), "zig-out", "lib", `buntok_trie${ext}`),
		];

		let triePath = "";
		for (const p of candidates) {
			if (fs.existsSync(p)) {
				triePath = p;
				break;
			}
		}

		if (!triePath) return false;

		const FFIType = ffi.FFIType;
		nativeLib = ffi.dlopen(triePath, {
			trie_init: { args: [], returns: FFIType.void },
			trie_deinit: { args: [], returns: FFIType.void },
			trie_insert: {
				args: [FFIType.ptr, FFIType.u32, FFIType.i32],
				returns: FFIType.void,
			},
			trie_find: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
			trie_node_count: { args: [], returns: FFIType.u32 },
		});
		nativeLib.symbols.trie_init();
		return true;
	} catch {
		return false;
	}
}

const nativeAvailable = tryLoadNative();

// ─── Test Data ───────────────────────────────────────────────────────────────

const STATIC_ROUTES = [
	"/",
	"/users",
	"/posts",
	"/comments",
	"/settings",
	"/profile",
	"/dashboard",
	"/api/v1/users",
	"/api/v1/posts",
	"/api/v1/comments",
	"/api/v1/settings",
	"/health",
	"/metrics",
	"/auth/login",
	"/auth/register",
	"/auth/logout",
];

const DYNAMIC_ROUTES = [
	"/users/:id",
	"/posts/:id",
	"/comments/:id",
	"/users/:id/posts",
	"/posts/:id/comments",
	"/api/v1/users/:id",
	"/api/v1/posts/:id",
	"/files/*path",
	"/static/*filepath",
	"/download/:filename",
];

const MIXED_ROUTES = [...STATIC_ROUTES, ...DYNAMIC_ROUTES];

// ─── Benchmark Helpers ───────────────────────────────────────────────────────

function benchmarkNativeInsert(routes: string[], iterations: number): number {
	const bufCache = new Map<string, { buf: Buffer; ptr: any }>();

	// Warmup
	for (let i = 0; i < 100; i++) {
		for (const route of routes) {
			let entry = bufCache.get(route);
			if (!entry) {
				entry = {
					buf: Buffer.from(route, "utf-8"),
					ptr: ffi.ptr(Buffer.from(route, "utf-8")),
				};
				bufCache.set(route, entry);
			}
			nativeLib.symbols.trie_insert(entry.ptr, entry.buf.length, i);
		}
	}

	const start = performance.now();
	for (let i = 0; i < iterations; i++) {
		for (const route of routes) {
			let entry = bufCache.get(route);
			if (!entry) {
				entry = {
					buf: Buffer.from(route, "utf-8"),
					ptr: ffi.ptr(Buffer.from(route, "utf-8")),
				};
				bufCache.set(route, entry);
			}
			nativeLib.symbols.trie_insert(entry.ptr, entry.buf.length, i);
		}
	}
	return performance.now() - start;
}

function benchmarkJSInsert(routes: string[], iterations: number): number {
	// Warmup
	for (let i = 0; i < 100; i++) {
		const trie = new JSTrie();
		for (const route of routes) {
			trie.insert(route, i);
		}
	}

	const start = performance.now();
	for (let i = 0; i < iterations; i++) {
		const trie = new JSTrie();
		for (const route of routes) {
			trie.insert(route, i);
		}
	}
	return performance.now() - start;
}

function benchmarkBothInsert(routes: string[], iterations: number): number {
	const bufCache = new Map<string, { buf: Buffer; ptr: any }>();

	// Warmup
	for (let i = 0; i < 100; i++) {
		const jsTrie = new JSTrie();
		for (const route of routes) {
			let entry = bufCache.get(route);
			if (!entry) {
				entry = {
					buf: Buffer.from(route, "utf-8"),
					ptr: ffi.ptr(Buffer.from(route, "utf-8")),
				};
				bufCache.set(route, entry);
			}
			nativeLib.symbols.trie_insert(entry.ptr, entry.buf.length, i);
			jsTrie.insert(route, i);
		}
	}

	const start = performance.now();
	for (let i = 0; i < iterations; i++) {
		const jsTrie = new JSTrie();
		for (const route of routes) {
			let entry = bufCache.get(route);
			if (!entry) {
				entry = {
					buf: Buffer.from(route, "utf-8"),
					ptr: ffi.ptr(Buffer.from(route, "utf-8")),
				};
				bufCache.set(route, entry);
			}
			nativeLib.symbols.trie_insert(entry.ptr, entry.buf.length, i);
			jsTrie.insert(route, i);
		}
	}
	return performance.now() - start;
}

function benchmarkNativeFind(routes: string[], iterations: number): number {
	const jsTrie = new JSTrie();
	const bufCache = new Map<string, { buf: Buffer; ptr: any }>();

	// Insert all routes
	for (let i = 0; i < routes.length; i++) {
		const route = routes[i];
		const entry = {
			buf: Buffer.from(route, "utf-8"),
			ptr: ffi.ptr(Buffer.from(route, "utf-8")),
		};
		bufCache.set(route, entry);
		nativeLib.symbols.trie_insert(entry.ptr, entry.buf.length, i);
		jsTrie.insert(route, i);
	}

	// Warmup
	for (let i = 0; i < 100; i++) {
		for (const route of routes) {
			const entry = bufCache.get(route)!;
			nativeLib.symbols.trie_find(entry.ptr, entry.buf.length);
		}
	}

	const start = performance.now();
	for (let i = 0; i < iterations; i++) {
		for (const route of routes) {
			const entry = bufCache.get(route)!;
			nativeLib.symbols.trie_find(entry.ptr, entry.buf.length);
		}
	}
	return performance.now() - start;
}

function benchmarkJSFind(routes: string[], iterations: number): number {
	const jsTrie = new JSTrie();

	// Insert all routes
	for (let i = 0; i < routes.length; i++) {
		jsTrie.insert(routes[i], i);
	}

	// Warmup
	for (let i = 0; i < 100; i++) {
		for (const route of routes) {
			jsTrie.find(route);
		}
	}

	const start = performance.now();
	for (let i = 0; i < iterations; i++) {
		for (const route of routes) {
			jsTrie.find(route);
		}
	}
	return performance.now() - start;
}

function benchmarkNativeFindWithJSParams(
	routes: string[],
	iterations: number,
): number {
	const jsTrie = new JSTrie();
	const bufCache = new Map<string, { buf: Buffer; ptr: any }>();

	// Insert all routes
	for (let i = 0; i < routes.length; i++) {
		const route = routes[i];
		const entry = {
			buf: Buffer.from(route, "utf-8"),
			ptr: ffi.ptr(Buffer.from(route, "utf-8")),
		};
		bufCache.set(route, entry);
		nativeLib.symbols.trie_insert(entry.ptr, entry.buf.length, i);
		jsTrie.insert(route, i);
	}

	// Warmup
	for (let i = 0; i < 100; i++) {
		for (const route of routes) {
			const entry = bufCache.get(route)!;
			nativeLib.symbols.trie_find(entry.ptr, entry.buf.length);
			jsTrie.find(route);
		}
	}

	const start = performance.now();
	for (let i = 0; i < iterations; i++) {
		for (const route of routes) {
			const entry = bufCache.get(route)!;
			nativeLib.symbols.trie_find(entry.ptr, entry.buf.length);
			jsTrie.find(route);
		}
	}
	return performance.now() - start;
}

// ─── Main ────────────────────────────────────────────────────────────────────

function run() {
	console.log("🔬 Trie Benchmark: Native vs JS\n");
	console.log(
		`   Native FFI: ${nativeAvailable ? "✅ available" : "❌ not available"}`,
	);
	if (!nativeAvailable) {
		console.log(
			"   Run 'bun run build:native' first to compile native libraries.\n",
		);
		process.exit(1);
	}

	const ITERATIONS = 10000;

	const testCases = [
		{ name: "Static routes (16)", routes: STATIC_ROUTES },
		{ name: "Dynamic routes (10)", routes: DYNAMIC_ROUTES },
		{ name: "Mixed routes (26)", routes: MIXED_ROUTES },
	];

	const results: Array<{
		"Test Case": string;
		"Native Insert (ms)": string;
		"JS Insert (ms)": string;
		"Both Insert (ms)": string;
		"Native Find (ms)": string;
		"JS Find (ms)": string;
		"Native+JS Params (ms)": string;
	}> = [];

	for (const tc of testCases) {
		const totalRoutes = tc.routes.length * ITERATIONS;

		const nativeInsertTime = benchmarkNativeInsert(tc.routes, ITERATIONS);
		const jsInsertTime = benchmarkJSInsert(tc.routes, ITERATIONS);
		const bothInsertTime = benchmarkBothInsert(tc.routes, ITERATIONS);

		const nativeFindTime = benchmarkNativeFind(tc.routes, ITERATIONS);
		const jsFindTime = benchmarkJSFind(tc.routes, ITERATIONS);
		const nativeFindWithJSParamsTime = benchmarkNativeFindWithJSParams(
			tc.routes,
			ITERATIONS,
		);

		const nativeInsertOps = Math.round(totalRoutes / (nativeInsertTime / 1000));
		const jsInsertOps = Math.round(totalRoutes / (jsInsertTime / 1000));
		const bothInsertOps = Math.round(totalRoutes / (bothInsertTime / 1000));

		const nativeFindOps = Math.round(totalRoutes / (nativeFindTime / 1000));
		const jsFindOps = Math.round(totalRoutes / (jsFindTime / 1000));
		const nativeFindWithJSParamsOps = Math.round(
			totalRoutes / (nativeFindWithJSParamsTime / 1000),
		);

		results.push({
			"Test Case": tc.name,
			"Native Insert (ms)": `${nativeInsertTime.toFixed(1)} (${nativeInsertOps.toLocaleString()} ops/s)`,
			"JS Insert (ms)": `${jsInsertTime.toFixed(1)} (${jsInsertOps.toLocaleString()} ops/s)`,
			"Both Insert (ms)": `${bothInsertTime.toFixed(1)} (${bothInsertOps.toLocaleString()} ops/s)`,
			"Native Find (ms)": `${nativeFindTime.toFixed(1)} (${nativeFindOps.toLocaleString()} ops/s)`,
			"JS Find (ms)": `${jsFindTime.toFixed(1)} (${jsFindOps.toLocaleString()} ops/s)`,
			"Native+JS Params (ms)": `${nativeFindWithJSParamsTime.toFixed(1)} (${nativeFindWithJSParamsOps.toLocaleString()} ops/s)`,
		});
	}

	console.log(`   Iterations: ${ITERATIONS} per test\n`);
	console.log("📊 Results:\n");
	console.table(results);

	// Summary
	console.log("\n📋 Summary (old native+JS vs new JS-only):\n");

	const _staticResults = results[0];
	const mixedResults = results[2];

	console.log("   INSERT comparison (Mixed routes):");
	console.log(`     OLD (native+JS): ${mixedResults["Both Insert (ms)"]}`);
	console.log(`     NEW (JS only):    ${mixedResults["JS Insert (ms)"]}`);

	console.log("\n   FIND comparison (Mixed routes):");
	console.log(`     OLD (native+JS): ${mixedResults["Native+JS Params (ms)"]}`);
	console.log(`     NEW (JS only):    ${mixedResults["JS Find (ms)"]}`);

	// Calculate improvement
	const oldInsert = parseFloat(mixedResults["Both Insert (ms)"]);
	const newInsert = parseFloat(mixedResults["JS Insert (ms)"]);
	const oldFind = parseFloat(mixedResults["Native+JS Params (ms)"]);
	const newFind = parseFloat(mixedResults["JS Find (ms)"]);

	const insertImprovement = (
		((oldInsert - newInsert) / oldInsert) *
		100
	).toFixed(0);
	const findImprovement = (((oldFind - newFind) / oldFind) * 100).toFixed(0);

	console.log(`\n   🚀 Improvement:`);
	console.log(
		`     Insert: ${insertImprovement}% faster (${oldInsert.toFixed(1)}ms → ${newInsert.toFixed(1)}ms)`,
	);
	console.log(
		`     Find:   ${findImprovement}% faster (${oldFind.toFixed(1)}ms → ${newFind.toFixed(1)}ms)`,
	);

	if (nativeAvailable) {
		nativeLib.symbols.trie_deinit();
	}
}

run();
