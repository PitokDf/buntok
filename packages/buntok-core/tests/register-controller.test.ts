import { describe, it, expect } from "bun:test";
import { Buntok } from "../src/buntok";
import { Controller, Get, Post, Use } from "../src/decorators";

@Controller("/users")
class UserController {
	@Get("/")
	list() {
		return { users: [] };
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
		return { post: {} };
	}
}

@Controller("/auth")
class AuthController {
	@Post("/login")
	login() {
		return { token: "abc" };
	}
}

@Controller("/comments")
class CommentController {
	@Get("/")
	list() {
		return { comments: [] };
	}
}

describe("registerController with array", () => {
	it("should register multiple controllers from array", async () => {
		const app = new Buntok();
		app.registerController([UserController, PostController, AuthController]);

		const res1 = await app.request("/users");
		expect(res1.status).toBe(200);

		const res2 = await app.request("/posts");
		expect(res2.status).toBe(200);

		const res3 = await app.request("/auth/login", { method: "POST" });
		expect(res3.status).toBe(200);
	});

	it("should register single controller (backward compatible)", async () => {
		const app = new Buntok();
		app.registerController(UserController);

		const res = await app.request("/users");
		expect(res.status).toBe(200);
	});

	it("should work with RouterGroup", async () => {
		const app = new Buntok();
		const api = app.group("/api/v1");
		api.registerController([UserController, PostController]);

		const res1 = await app.request("/api/v1/users");
		expect(res1.status).toBe(200);

		const res2 = await app.request("/api/v1/posts");
		expect(res2.status).toBe(200);
	});

	it("should be chainable", () => {
		const app = new Buntok();
		const result = app.registerController([UserController, PostController]);
		expect(result).toBe(app);
	});

	it("should return this for single controller", () => {
		const app = new Buntok();
		const result = app.registerController(UserController);
		expect(result).toBe(app);
	});

	it("should handle mixed single and array calls", async () => {
		const app = new Buntok();
		app.registerController(UserController);
		app.registerController([PostController, AuthController]);

		const res1 = await app.request("/users");
		expect(res1.status).toBe(200);

		const res2 = await app.request("/posts");
		expect(res2.status).toBe(200);

		const res3 = await app.request("/auth/login", { method: "POST" });
		expect(res3.status).toBe(200);
	});

	it("should handle array with single element", async () => {
		const app = new Buntok();
		app.registerController([CommentController]);

		const res = await app.request("/comments");
		expect(res.status).toBe(200);
	});

	it("should execute group middlewares before route middlewares in RouterGroup", async () => {
		const order: string[] = [];
		const groupMw = async (_ctx: any, next: any) => {
			order.push("group");
			return next();
		};
		const routeMw = async (_ctx: any, next: any) => {
			order.push("route");
			return next();
		};

		@Controller("/ordered")
		class OrderedController {
			@Get("/")
			@Use(routeMw)
			test() {
				order.push("handler");
				return "ok";
			}
		}

		const app = new Buntok();
		const api = app.group("/api");
		api.use(groupMw);
		api.registerController(OrderedController);

		const res = await app.request("/api/ordered");
		expect(res.status).toBe(200);
		expect(order).toEqual(["group", "route", "handler"]);
	});
});
