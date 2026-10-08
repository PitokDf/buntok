import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { Buntok } from "../src/buntok";
import { Controller, Get, Post } from "../src/decorators";
import { cors } from "../src/middlewares/cors";
import { existsSync, rmSync } from "node:fs";
import { join } from "node:path";

const DOCS_DIR = join(process.cwd(), "public/docs");
const SWAGGER_PATH = join(DOCS_DIR, "swagger.json");

function cleanup() {
	if (existsSync(SWAGGER_PATH)) {
		rmSync(SWAGGER_PATH);
	}
}

function getPort(app: any): number {
	return app.server?.port ?? 1212;
}

// ─── Controllers ────────────────────────────────────────────────
@Controller("/users")
class UserController {
	@Get("/")
	list() {
		return { users: [] };
	}

	@Get("/:id")
	getById() {
		return { user: { id: 1 } };
	}

	@Post("/")
	create() {
		return { created: true };
	}
}

@Controller("/posts")
class PostController {
	@Get("/")
	list() {
		return { posts: [] };
	}

	@Get("/:id")
	getById() {
		return { post: { id: 1 } };
	}
}

@Controller("/comments")
class CommentController {
	@Get("/")
	list() {
		return { comments: [] };
	}
}

@Controller("/auth")
class AuthController {
	@Post("/login")
	login() {
		return { token: "abc" };
	}
}

@Controller("/products")
class ProductController {
	@Get("/")
	list() {
		return { products: [] };
	}
}

// ─── Tests ──────────────────────────────────────────────────────
describe("Combination: registerController array + cors", () => {
	it("should work with array registration + cors on normal responses", async () => {
		const app = new Buntok();
		app.cors({ origin: "http://example.com" });
		app.registerController([UserController, PostController, CommentController]);

		const res1 = await app.request("/users", {
			headers: { Origin: "http://example.com" },
		});
		expect(res1.status).toBe(200);
		expect(res1.headers.get("Access-Control-Allow-Origin")).toBe("http://example.com");

		const res2 = await app.request("/posts", {
			headers: { Origin: "http://example.com" },
		});
		expect(res2.status).toBe(200);
		expect(res2.headers.get("Access-Control-Allow-Origin")).toBe("http://example.com");

		const res3 = await app.request("/comments", {
			headers: { Origin: "http://example.com" },
		});
		expect(res3.status).toBe(200);
		expect(res3.headers.get("Access-Control-Allow-Origin")).toBe("http://example.com");
	});

	it("should work with array registration + cors on plain string returns", async () => {
		const app = new Buntok();
		app.cors({ origin: "http://example.com" });
		app.get("/text", () => "hello");
		app.registerController([UserController]);

		const res = await app.request("/text", {
			headers: { Origin: "http://example.com" },
		});
		expect(res.status).toBe(200);
		expect(res.headers.get("Access-Control-Allow-Origin")).toBe("http://example.com");
		expect(await res.text()).toBe("hello");
	});

	it("should work with array registration + cors on number returns", async () => {
		const app = new Buntok();
		app.cors({ origin: "http://example.com" });
		app.get("/num", () => 42);
		app.registerController([UserController]);

		const res = await app.request("/num", {
			headers: { Origin: "http://example.com" },
		});
		expect(res.status).toBe(200);
		expect(res.headers.get("Access-Control-Allow-Origin")).toBe("http://example.com");
		expect(await res.text()).toBe("42");
	});

	it("should work with array registration + cors on null returns", async () => {
		const app = new Buntok();
		app.cors({ origin: "http://example.com" });
		app.get("/null", () => null);
		app.registerController([UserController]);

		const res = await app.request("/null", {
			headers: { Origin: "http://example.com" },
		});
		expect(res.status).toBe(204);
		expect(res.headers.get("Access-Control-Allow-Origin")).toBe("http://example.com");
	});

	it("should work with array registration + cors + preflight", async () => {
		const app = new Buntok();
		app.cors({
			origin: "http://example.com",
			methods: ["GET", "POST"],
			credentials: true,
		});
		app.registerController([UserController, PostController]);

		const res = await app.request("/users", { method: "OPTIONS" });
		expect(res.status).toBe(204);
		expect(res.headers.get("Access-Control-Allow-Origin")).toBe("http://example.com");
		expect(res.headers.get("Access-Control-Allow-Methods")).toBe("GET,POST");
		expect(res.headers.get("Access-Control-Allow-Credentials")).toBe("true");
	});

	it("should work with array registration + cors + error handler", async () => {
		const app = new Buntok();
		app.cors({ origin: "http://example.com" });
		app.registerController([UserController]);
		app.get("/error", () => {
			throw new Error("boom");
		});

		const res = await app.request("/error", {
			headers: { Origin: "http://example.com" },
		});
		expect(res.status).toBe(500);
		expect(res.headers.get("Access-Control-Allow-Origin")).toBe("http://example.com");
	});
});

describe("Combination: RouterGroup + array registerController + cors", () => {
	it("should work with group prefix + array + cors", async () => {
		const app = new Buntok();
		const api = app.group("/api/v1");
		api.use(cors({ origin: "http://example.com" }));
		api.registerController([UserController, PostController]);

		const res = await app.request("/api/v1/users", {
			headers: { Origin: "http://example.com" },
		});
		expect(res.status).toBe(200);
		expect(res.headers.get("Access-Control-Allow-Origin")).toBe("http://example.com");

		const res2 = await app.request("/api/v1/posts", {
			headers: { Origin: "http://example.com" },
		});
		expect(res2.status).toBe(200);
		expect(res2.headers.get("Access-Control-Allow-Origin")).toBe("http://example.com");
	});

	it("should work with multiple groups + array", async () => {
		const app = new Buntok();
		const api1 = app.group("/api/v1");
		const api2 = app.group("/api/v2");

		api1.use(cors({ origin: "http://v1.example.com" }));
		api1.registerController([UserController]);

		api2.use(cors({ origin: "http://v2.example.com" }));
		api2.registerController([PostController]);

		const res1 = await app.request("/api/v1/users", {
			headers: { Origin: "http://v1.example.com" },
		});
		expect(res1.status).toBe(200);
		expect(res1.headers.get("Access-Control-Allow-Origin")).toBe("http://v1.example.com");

		const res2 = await app.request("/api/v2/posts", {
			headers: { Origin: "http://v2.example.com" },
		});
		expect(res2.status).toBe(200);
		expect(res2.headers.get("Access-Control-Allow-Origin")).toBe("http://v2.example.com");
	});

	it("should work with group + array + plain string returns", async () => {
		const app = new Buntok();
		const api = app.group("/api");
		api.use(cors({ origin: "http://example.com" }));
		api.get("/text", () => "plain text");
		api.registerController([UserController]);

		const res = await app.request("/api/text", {
			headers: { Origin: "http://example.com" },
		});
		expect(res.status).toBe(200);
		expect(res.headers.get("Access-Control-Allow-Origin")).toBe("http://example.com");
		expect(await res.text()).toBe("plain text");
	});
});

describe("Combination: apiDocs + array registerController", () => {
	beforeEach(cleanup);
	afterEach(cleanup);

	it("should include routes from array-registered controllers in swagger.json", async () => {
		const app = new Buntok();
		app.apiDocs({ title: "Array Routes API", version: "1.0.0" });
		app.registerController([UserController, PostController, AuthController]);

		app.listen(0);
		const port = getPort(app);
		await Bun.sleep(200);

		const res = await fetch(`http://localhost:${port}/docs/swagger.json`);
		const body = await res.json();

		expect(body.paths["/users"]).toBeDefined();
		expect(body.paths["/users"].get).toBeDefined();
		expect(body.paths["/users"].post).toBeDefined();
		expect(body.paths["/posts"]).toBeDefined();
		expect(body.paths["/posts"].get).toBeDefined();
		expect(body.paths["/auth/login"]).toBeDefined();
		expect(body.paths["/auth/login"].post).toBeDefined();

		app.server?.stop();
	});

	it("should include routes from array in group in swagger.json", async () => {
		const app = new Buntok();
		app.apiDocs({ title: "Group Array API", version: "1.0.0" });
		const api = app.group("/api/v1");
		api.registerController([UserController, PostController]);

		app.listen(0);
		const port = getPort(app);
		await Bun.sleep(200);

		const res = await fetch(`http://localhost:${port}/docs/swagger.json`);
		const body = await res.json();

		expect(body.paths["/api/v1/users"]).toBeDefined();
		expect(body.paths["/api/v1/posts"]).toBeDefined();

		app.server?.stop();
	});

	it("should serve docs UI with assets when using array controllers", async () => {
		const app = new Buntok();
		app.apiDocs({ title: "Docs UI Array" });
		app.registerController([UserController, PostController]);

		app.listen(0);
		const port = getPort(app);
		await Bun.sleep(100);

		const resUI = await fetch(`http://localhost:${port}/docs`);
		expect(resUI.status).toBe(200);

		const resJS = await fetch(`http://localhost:${port}/docs/tailwind.js`);
		expect(resJS.status).toBe(200);

		const resCSS = await fetch(`http://localhost:${port}/docs/font-googles.css`);
		expect(resCSS.status).toBe(200);

		app.server?.stop();
	});

	it("should serve docs at trailing slash with array controllers", async () => {
		const app = new Buntok();
		app.apiDocs({ title: "Trailing Array" });
		app.registerController([UserController]);

		app.listen(0);
		const port = getPort(app);
		await Bun.sleep(100);

		const res = await fetch(`http://localhost:${port}/docs/`);
		expect(res.status).toBe(200);
		expect(res.headers.get("Content-Type")).toContain("text/html");

		app.server?.stop();
	});
});

describe("Combination: apiDocs + cors + array registerController", () => {
	beforeEach(cleanup);
	afterEach(cleanup);

	it("should work with full stack: cors + array + apiDocs", async () => {
		const app = new Buntok();
		app.cors({ origin: "http://example.com" });
		app.apiDocs({ title: "Full Stack API", version: "1.0.0" });
		app.registerController([UserController, PostController, CommentController]);

		app.listen(0);
		const port = getPort(app);
		await Bun.sleep(200);

		// Test routes with CORS
		const res1 = await app.request("/users", {
			headers: { Origin: "http://example.com" },
		});
		expect(res1.status).toBe(200);
		expect(res1.headers.get("Access-Control-Allow-Origin")).toBe("http://example.com");

		// Test swagger.json
		const resSwagger = await fetch(`http://localhost:${port}/docs/swagger.json`);
		const body = await resSwagger.json();
		expect(body.paths["/users"]).toBeDefined();
		expect(body.paths["/posts"]).toBeDefined();
		expect(body.paths["/comments"]).toBeDefined();

		// Test docs UI
		const resUI = await fetch(`http://localhost:${port}/docs`);
		expect(resUI.status).toBe(200);

		app.server?.stop();
	});

	it("should work with cors origin array + apiDocs + registerController array", async () => {
		const app = new Buntok();
		app.cors({
			origin: ["http://allowed.com", "http://also-allowed.com"],
		});
		app.apiDocs({ title: "CORS Array API" });
		app.registerController([UserController, PostController]);

		app.listen(0);
		const port = getPort(app);
		await Bun.sleep(200);

		// Allowed origin
		const res1 = await app.request("/users", {
			headers: { Origin: "http://allowed.com" },
		});
		expect(res1.status).toBe(200);
		expect(res1.headers.get("Access-Control-Allow-Origin")).toBe("http://allowed.com");

		// Disallowed origin
		const res2 = await app.request("/users", {
			headers: { Origin: "http://evil.com" },
		});
		expect(res2.status).toBe(200);
		expect(res2.headers.get("Access-Control-Allow-Origin")).toBe("");

		app.server?.stop();
	});

	it("should work with cors function origin + apiDocs + registerController array", async () => {
		const app = new Buntok();
		app.cors({
			origin: (origin) => origin.startsWith("http://trusted."),
		});
		app.apiDocs({ title: "CORS Function API" });
		app.registerController([UserController]);

		app.listen(0);
		const port = getPort(app);
		await Bun.sleep(200);

		// Trusted origin
		const res1 = await app.request("/users", {
			headers: { Origin: "http://trusted.example.com" },
		});
		expect(res1.status).toBe(200);
		expect(res1.headers.get("Access-Control-Allow-Origin")).toBe("http://trusted.example.com");

		// Untrusted origin
		const res2 = await app.request("/users", {
			headers: { Origin: "http://evil.com" },
		});
		expect(res2.status).toBe(200);
		expect(res2.headers.get("Access-Control-Allow-Origin")).toBe("");

		app.server?.stop();
	});
});

describe("Combination: mixed registration (single + array) + cors", () => {
	it("should work with mixed single and array calls + cors", async () => {
		const app = new Buntok();
		app.cors({ origin: "http://example.com" });
		app.registerController(UserController);
		app.registerController([PostController, CommentController]);
		app.registerController(AuthController);

		const res1 = await app.request("/users", {
			headers: { Origin: "http://example.com" },
		});
		expect(res1.status).toBe(200);
		expect(res1.headers.get("Access-Control-Allow-Origin")).toBe("http://example.com");

		const res2 = await app.request("/posts", {
			headers: { Origin: "http://example.com" },
		});
		expect(res2.status).toBe(200);

		const res3 = await app.request("/comments", {
			headers: { Origin: "http://example.com" },
		});
		expect(res3.status).toBe(200);

		const res4 = await app.request("/auth/login", {
			method: "POST",
			headers: { Origin: "http://example.com" },
		});
		expect(res4.status).toBe(200);
	});

	it("should work with group + mixed single and array + cors", async () => {
		const app = new Buntok();
		const api = app.group("/api");
		api.use(cors({ origin: "http://example.com" }));

		api.registerController(UserController);
		api.registerController([PostController, CommentController]);

		const res1 = await app.request("/api/users", {
			headers: { Origin: "http://example.com" },
		});
		expect(res1.status).toBe(200);
		expect(res1.headers.get("Access-Control-Allow-Origin")).toBe("http://example.com");

		const res2 = await app.request("/api/posts", {
			headers: { Origin: "http://example.com" },
		});
		expect(res2.status).toBe(200);

		const res3 = await app.request("/api/comments", {
			headers: { Origin: "http://example.com" },
		});
		expect(res3.status).toBe(200);
	});
});

describe("Combination: error scenarios", () => {
	it("should handle cors + array controllers + 404", async () => {
		const app = new Buntok();
		app.cors({ origin: "http://example.com" });
		app.registerController([UserController]);

		const res = await app.request("/nonexistent", {
			headers: { Origin: "http://example.com" },
		});
		expect(res.status).toBe(404);
		expect(res.headers.get("Access-Control-Allow-Origin")).toBe("http://example.com");
	});

	it("should handle cors + array controllers + BadRequestError", async () => {
		const app = new Buntok();
		app.cors({ origin: "http://example.com" });
		app.registerController([UserController]);
		app.get("/bad", () => {
			throw new Error("bad request");
		});

		const res = await app.request("/bad", {
			headers: { Origin: "http://example.com" },
		});
		expect(res.status).toBe(500);
		expect(res.headers.get("Access-Control-Allow-Origin")).toBe("http://example.com");
	});

	it("should handle apiDocs + cors + array + 404", async () => {
		const app = new Buntok();
		app.cors({ origin: "http://example.com" });
		app.apiDocs({ title: "404 Test API" });
		app.registerController([UserController]);

		app.listen(0);
		const port = getPort(app);
		await Bun.sleep(200);

		const res = await app.request("/nonexistent", {
			headers: { Origin: "http://example.com" },
		});
		expect(res.status).toBe(404);
		expect(res.headers.get("Access-Control-Allow-Origin")).toBe("http://example.com");

		// Docs should still work
		const resDocs = await fetch(`http://localhost:${port}/docs`);
		expect(resDocs.status).toBe(200);

		app.server?.stop();
	});
});

describe("Combination: chainability and return values", () => {
	it("registerController array returns app instance", () => {
		const app = new Buntok();
		const result = app.registerController([UserController, PostController]);
		expect(result).toBe(app);
	});

	it("registerController single returns app instance", () => {
		const app = new Buntok();
		const result = app.registerController(UserController);
		expect(result).toBe(app);
	});

	it("group.registerController array returns group instance", () => {
		const app = new Buntok();
		const group = app.group("/api");
		const result = group.registerController([UserController, PostController]);
		expect(result).toBe(group);
	});

	it("group.registerController single returns group instance", () => {
		const app = new Buntok();
		const group = app.group("/api");
		const result = group.registerController(UserController);
		expect(result).toBe(group);
	});

	it("fluent chaining with cors + array + apiDocs", () => {
		const app = new Buntok();
		const result = app
			.cors({ origin: "http://example.com" })
			.apiDocs({ title: "Chained API" })
			.registerController([UserController, PostController]);

		expect(result).toBe(app);
	});
});

describe("Combination: response body verification", () => {
	it("should return correct JSON from array-registered controllers", async () => {
		const app = new Buntok();
		app.registerController([UserController, PostController]);

		const res1 = await app.request("/users");
		expect(res1.status).toBe(200);
		const body1 = await res1.json();
		expect(body1).toEqual({ users: [] });

		const res2 = await app.request("/posts");
		expect(res2.status).toBe(200);
		const body2 = await res2.json();
		expect(body2).toEqual({ posts: [] });
	});

	it("should return correct JSON from single controller in array", async () => {
		const app = new Buntok();
		app.registerController([AuthController]);

		const res = await app.request("/auth/login", { method: "POST" });
		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body).toEqual({ token: "abc" });
	});

	it("should return correct JSON from mixed registration", async () => {
		const app = new Buntok();
		app.registerController(UserController);
		app.registerController([PostController]);

		const res1 = await app.request("/users");
		const body1 = await res1.json();
		expect(body1).toEqual({ users: [] });

		const res2 = await app.request("/posts");
		const body2 = await res2.json();
		expect(body2).toEqual({ posts: [] });
	});

	it("should return correct JSON from group + array", async () => {
		const app = new Buntok();
		const api = app.group("/api");
		api.registerController([UserController, PostController]);

		const res1 = await app.request("/api/users");
		const body1 = await res1.json();
		expect(body1).toEqual({ users: [] });

		const res2 = await app.request("/api/posts");
		const body2 = await res2.json();
		expect(body2).toEqual({ posts: [] });
	});
});
