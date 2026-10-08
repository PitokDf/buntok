import { bench, run } from "mitata";
import { JSTrie } from "../src/ffi/fallback";

// Dynamic import for native FFI
let nativeParseQuery: ((query: string) => Record<string, string>) | null = null;
try {
	const ffi = await import("../src/ffi/index");
	nativeParseQuery = ffi.parseQuery;
} catch {
	// FFI not available, use fallback only
}

// ──── Router benchmarks ────
const testRoutes = [
	"/api/users",
	"/api/users/:id",
	"/api/users/:id/posts",
	"/api/posts",
	"/api/posts/:id/comments",
	"/api/auth/login",
	"/api/auth/register",
	"/health",
	"/api/v1/admin/users",
	"/api/v1/admin/users/:id/roles",
];

const testPaths = [
	"/api/users",
	"/api/users/123",
	"/api/users/456/posts",
	"/api/posts",
	"/api/posts/789/comments",
	"/api/auth/login",
	"/api/auth/register",
	"/health",
	"/api/v1/admin/users",
	"/api/v1/admin/users/42/roles",
];

// JSTrie (JS fallback)
bench("JSTrie - insert 10 routes", () => {
	const trie = new JSTrie();
	for (let i = 0; i < testRoutes.length; i++) {
		trie.insert(testRoutes[i], i);
	}
});

bench("JSTrie - find 10 paths", () => {
	const trie = new JSTrie();
	for (let i = 0; i < testRoutes.length; i++) {
		trie.insert(testRoutes[i], i);
	}
	for (const path of testPaths) {
		trie.find(path);
	}
});

// ──── Query string parsing ────
const testQuery = "name=john&age=30&email=test@example.com&active=true&page=1&limit=20";

bench("URLSearchParams (built-in)", () => {
	const params = new URLSearchParams(testQuery);
	const obj: Record<string, string> = {};
	params.forEach((v, k) => { obj[k] = v; });
});

if (nativeParseQuery) {
	bench("native parseQuery (FFI)", () => {
		nativeParseQuery!(testQuery);
	});
}

bench("JS fallback parseQuery", () => {
	const { jsParseQuery } = require("../src/ffi/fallback");
	jsParseQuery(testQuery);
});

// ──── Cookie parsing ────
const testCookie = "session=abc123; userId=42; theme=dark; lang=en; token=eyJhbGciOiJIUzI1NiJ9.test";

bench("JS fallback parseCookies", () => {
	const { jsParseCookies } = require("../src/ffi/fallback");
	jsParseCookies(testCookie);
});

run();
