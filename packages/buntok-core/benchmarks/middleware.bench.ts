import { bench, run } from "mitata";
import { createHonoMiddleware } from "../src/middlewares/helmet";
import { createHonoCompressMiddleware } from "../src/middlewares/compress";

// ──── Helmet middleware benchmarks ────
bench("helmet - middleware creation", () => {
	createHonoMiddleware();
});

bench("helmet - header generation (default)", () => {
	const middleware = createHonoMiddleware();
	// Simulate middleware execution
	const headers = new Headers();
	const config = {
		contentSecurityPolicy: true,
		crossOriginEmbedderPolicy: false,
		crossOriginOpenerPolicy: true,
		crossOriginResourcePolicy: true,
		dnsPrefetchControl: true,
		frameguard: true,
		hidePoweredBy: true,
		hsts: true,
		ieNoOpen: true,
		noSniff: true,
		referrerPolicy: true,
		xssFilter: true,
	};
});

// ──── Compress middleware benchmarks ────
bench("compress - middleware creation", () => {
	createHonoCompressMiddleware();
});

// ──── Router (inline) benchmarks ────
const routes = [
	"/api/users",
	"/api/users/:id",
	"/api/posts",
	"/api/posts/:id/comments",
	"/health",
];

bench("route matching - simple (5 routes)", () => {
	const paths = ["/api/users", "/api/posts", "/health"];
	for (const path of paths) {
		// Simple string matching simulation
		for (const route of routes) {
			if (route === path) break;
		}
	}
});

run();
