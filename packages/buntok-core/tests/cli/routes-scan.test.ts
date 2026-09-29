import { afterAll, describe, expect, it } from "bun:test";
import {
	findDuplicateRoutes,
	scanRoutes,
	scanRoutesInFile,
} from "../../src/cli/routes-scan";
import { cleanupProjects, makeProject, runInProject } from "./helpers";

afterAll(cleanupProjects);

const PLAIN = `import { Controller, Get, Post, Put, Delete } from "@buntok/core";

@Controller("/categories")
export class CategoryController {
  @Get("/")
  async getAll() {}

  @Get("/:id")
  async getById() {}

  @Post("/")
  async create() {}

  @Put("/:id")
  async update() {}

  @Delete("/:id")
  async delete() {}
}
`;

const BASE_STYLE = `import { Controller, BaseController } from "@buntok/core";

@Controller("/users")
export class UserController extends BaseController<User> {}
`;

describe("routes-scan: scanRoutesInFile", () => {
	it("joins controller prefix with method paths", () => {
		const routes = scanRoutesInFile("cat.controller.ts", PLAIN);
		expect(routes.map((r) => `${r.method} ${r.path}`)).toEqual([
			"GET /categories",
			"GET /categories/:id",
			"POST /categories",
			"PUT /categories/:id",
			"DELETE /categories/:id",
		]);
		expect(routes[0]?.controller).toBe("CategoryController");
		expect(routes[0]?.line).toBeGreaterThan(0);
	});

	it("normalizes doubled and trailing slashes", () => {
		const routes = scanRoutesInFile(
			"x.ts",
			`@Controller("/") export class X { @Get("/") a() {} @Get("list") b() {} }`,
		);
		expect(routes.map((r) => r.path)).toEqual(["/", "/list"]);
	});

	it("synthesizes inherited CRUD routes for BaseController subclasses", () => {
		const routes = scanRoutesInFile("user.controller.ts", BASE_STYLE);
		expect(routes.map((r) => `${r.method} ${r.path}`)).toEqual([
			"GET /users",
			"GET /users/:id",
			"POST /users",
			"PUT /users/:id",
			"DELETE /users/:id",
		]);
	});

	it("does not synthesize routes that the subclass overrides itself", () => {
		const src = `@Controller("/users")
export class UserController extends BaseController<User> {
  @Get("/")
  async getAll() {}
}`;
		const routes = scanRoutesInFile("user.controller.ts", src);
		const gets = routes.filter((r) => r.method === "GET" && r.path === "/users");
		expect(gets).toHaveLength(1);
		expect(routes).toHaveLength(5);
	});

	it("skips decorators inside comments", () => {
		const src = `@Controller("/a")
export class A {
  // @Get("/ghost")
  @Get("/real") x() {}
}`;
		const routes = scanRoutesInFile("a.ts", src);
		expect(routes.map((r) => r.path)).toEqual(["/a/real"]);
	});
});

describe("routes-scan: findDuplicateRoutes", () => {
	it("groups same method + path", () => {
		const a = scanRoutesInFile("a.ts", PLAIN);
		const b = scanRoutesInFile("b.ts", BASE_STYLE);
		const dups = findDuplicateRoutes([...a, ...b]);
		expect(dups).toHaveLength(0);

		const c = scanRoutesInFile("c.ts", PLAIN);
		const dups2 = findDuplicateRoutes([...a, ...c]);
		expect(dups2).toHaveLength(5);
		expect(dups2[0]?.key).toBe("GET /categories");
	});

	it("does not flag the same path with different methods", () => {
		const routes = scanRoutesInFile("a.ts", PLAIN);
		expect(findDuplicateRoutes(routes)).toHaveLength(0);
	});
});

describe("routes-scan: scanRoutes (fixture)", () => {
	it("walks src/ and finds decorated files", async () => {
		const dir = makeProject({
			"src/modules/category/category.controller.ts": PLAIN,
			"src/modules/user/user.controller.ts": BASE_STYLE,
			"src/ignored.txt": "not scanned",
		});

		await runInProject(dir, () => {
			const routes = scanRoutes(process.cwd());
			expect(routes).toHaveLength(10);
			const dups = findDuplicateRoutes(routes);
			expect(dups).toHaveLength(0);
		});
	});

	it("returns empty when src/ is missing", async () => {
		const dir = makeProject({ "package.json": "{}" });
		await runInProject(dir, () => {
			expect(scanRoutes(process.cwd())).toEqual([]);
		});
	});
});
