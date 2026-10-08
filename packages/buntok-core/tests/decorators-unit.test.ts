import { describe, it, expect } from "bun:test";
import { Buntok } from "../src/buntok";
import {
	Controller,
	Get,
	Post,
	Put,
	Patch,
	Delete,
	Options,
	Head,
	Use,
	UseGuard,
	HttpCode,
	SetHeader,
	Redirect,
	Version,
	SetMetadata,
	Public,
	getMetadata,
	applyDecorators,
	getControllerMeta,
} from "../src/decorators";

describe("Decorators", () => {
	describe("HTTP method decorators", () => {
		it("should register PUT routes", async () => {
			const app = new Buntok();

			@Controller("/items")
			class ItemController {
				@Put("/:id")
				update(ctx: any) {
					return Response.json({ method: "PUT", id: ctx.params.id });
				}
			}

			app.registerController(ItemController);

			const res = await app.request("/items/123", { method: "PUT" });
			expect(res.status).toBe(200);
			const body = await res.json();
			expect(body.method).toBe("PUT");
			expect(body.id).toBe("123");
		});

		it("should register PATCH routes", async () => {
			const app = new Buntok();

			@Controller("/items")
			class ItemController {
				@Patch("/:id")
				patch(ctx: any) {
					return Response.json({ method: "PATCH", id: ctx.params.id });
				}
			}

			app.registerController(ItemController);

			const res = await app.request("/items/456", { method: "PATCH" });
			expect(res.status).toBe(200);
			const body = await res.json();
			expect(body.method).toBe("PATCH");
		});

		it("should register DELETE routes", async () => {
			const app = new Buntok();

			@Controller("/items")
			class ItemController {
				@Delete("/:id")
				remove(ctx: any) {
					return ctx.json({ method: "DELETE", id: ctx.params.id });
				}
			}

			app.registerController(ItemController);

			const res = await app.request("/items/789", { method: "DELETE" });
			expect(res.status).toBe(200);
			const body = await res.json();
			expect(body.method).toBe("DELETE");
		});

		it("should register OPTIONS routes", async () => {
			const app = new Buntok();

			@Controller("/items")
			class ItemController {
				@Options("/")
				options(ctx: any) {
					return ctx.status(204);
				}
			}

			app.registerController(ItemController);

			const res = await app.request("/items", { method: "OPTIONS" });
			expect(res.status).toBe(204);
		});
	});

	describe("@Use decorator", () => {
		it("should apply middleware to decorated route", async () => {
			const app = new Buntok();
			let middlewareCalled = false;

			const authMiddleware = async (ctx: any, next: () => any) => {
				middlewareCalled = true;
				return next();
			};

			@Controller("/items")
			class ItemController {
				@Get("/secret")
				@Use(authMiddleware)
				getSecret(ctx: any) {
					return ctx.json({ secret: "data" });
				}
			}

			app.registerController(ItemController);

			const res = await app.request("/items/secret");
			expect(res.status).toBe(200);
			expect(middlewareCalled).toBe(true);
		});

		it("should stack multiple middleware", async () => {
			const app = new Buntok();
			const order: string[] = [];

			@Controller("/items")
			class ItemController {
				@Get("/stack")
				@Use(async (ctx: any, next: () => any) => {
					order.push("first");
					return next();
				})
				@Use(async (ctx: any, next: () => any) => {
					order.push("second");
					return next();
				})
				getStack(ctx: any) {
					order.push("handler");
					return ctx.json({ order });
				}
			}

			app.registerController(ItemController);

			const res = await app.request("/items/stack");
			expect(res.status).toBe(200);
			const body = await res.json();
			expect(body.order).toEqual(["first", "second", "handler"]);
		});
	});

	describe("@UseGuard decorator", () => {
		it("should allow request when guard returns true", async () => {
			const app = new Buntok();

			const isOwner = (ctx: any) => {
				return ctx.params.id === "1";
			};

			@Controller("/items")
			class ItemController {
				@Get("/:id")
				@UseGuard(isOwner)
				getItem(ctx: any) {
					return ctx.json({ id: ctx.params.id });
				}
			}

			app.registerController(ItemController);

			const res = await app.request("/items/1");
			expect(res.status).toBe(200);
		});

		it("should return 403 when guard returns false", async () => {
			const app = new Buntok();

			const isOwner = (ctx: any) => {
				return ctx.params.id === "1";
			};

			@Controller("/items")
			class ItemController {
				@Get("/:id")
				@UseGuard(isOwner)
				getItem(ctx: any) {
					return ctx.json({ id: ctx.params.id });
				}
			}

			app.registerController(ItemController);

			const res = await app.request("/items/2");
			expect(res.status).toBe(403);
		});

		it("should support async guards", async () => {
			const app = new Buntok();

			const asyncGuard = async (ctx: any) => {
				return ctx.params.token === "valid";
			};

			@Controller("/secure")
			class SecureController {
				@Get("/:token")
				@UseGuard(asyncGuard)
				getSecure(ctx: any) {
					return ctx.json({ ok: true });
				}
			}

			app.registerController(SecureController);

			const res1 = await app.request("/secure/valid");
			expect(res1.status).toBe(200);

			const res2 = await app.request("/secure/invalid");
			expect(res2.status).toBe(403);
		});

		it("should chain multiple guards", async () => {
			const app = new Buntok();

			const guard1 = () => true;
			const guard2 = (ctx: any) => ctx.params.id !== "forbidden";

			@Controller("/items")
			class ItemController {
				@Get("/:id")
				@UseGuard(guard1, guard2)
				getItem(ctx: any) {
					return ctx.json({ id: ctx.params.id });
				}
			}

			app.registerController(ItemController);

			const res1 = await app.request("/items/1");
			expect(res1.status).toBe(200);

			const res2 = await app.request("/items/forbidden");
			expect(res2.status).toBe(403);
		});
	});

	describe("@HttpCode decorator", () => {
		it("should set custom status code", async () => {
			const app = new Buntok();

			@Controller("/items")
			class ItemController {
				@Post("/")
				@HttpCode(201)
				create(ctx: any) {
					return ctx.json({ created: true });
				}
			}

			app.registerController(ItemController);

			const res = await app.request("/items", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({}),
			});
			expect(res.status).toBe(201);
		});
	});

	describe("@SetHeader decorator", () => {
		it("should add static headers to response", async () => {
			const app = new Buntok();

			@Controller("/items")
			class ItemController {
				@Get("/cached")
				@SetHeader("X-Cache", "hit")
				@SetHeader("X-Custom", "value")
				getCached(ctx: any) {
					return ctx.json({ cached: true });
				}
			}

			app.registerController(ItemController);

			const res = await app.request("/items/cached");
			expect(res.status).toBe(200);
			expect(res.headers.get("X-Cache")).toBe("hit");
			expect(res.headers.get("X-Custom")).toBe("value");
		});
	});

	describe("@Redirect decorator", () => {
		it("should redirect to URL with 302", async () => {
			const app = new Buntok();

			@Controller("/old")
			class OldController {
				@Get("/path")
				@Redirect("/new/path")
				redirectOld(ctx: any) {
					return ctx.json({ unreachable: true });
				}
			}

			app.registerController(OldController);

			const res = await app.request("/old/path");
			expect(res.status).toBe(302);
			expect(res.headers.get("Location")).toBe("/new/path");
		});

		it("should redirect with custom status code", async () => {
			const app = new Buntok();

			@Controller("/old")
			class OldController {
				@Get("/permanent")
				@Redirect("/new", 301)
				redirectPermanent(ctx: any) {
					return ctx.json({ unreachable: true });
				}
			}

			app.registerController(OldController);

			const res = await app.request("/old/permanent");
			expect(res.status).toBe(301);
		});
	});

	describe("@Version decorator", () => {
		it("should store version metadata", async () => {
			@Controller("/items")
			class ItemController {
				@Get("/")
				@Version("v1")
				getItems(ctx: any) {
					return ctx.json({ version: "v1" });
				}
			}

			const meta = getControllerMeta(ItemController);
			expect(meta).toBeDefined();
			const route = meta!.routes.find((r) => r.propertyKey === "getItems");
			expect(route?.version).toBe("v1");
		});
	});

	describe("@SetMetadata and getMetadata", () => {
		it("should store and retrieve metadata", async () => {
			@Controller("/items")
			class ItemController {
				@Get("/")
				@SetMetadata("roles", ["admin", "editor"])
				getItems(ctx: any) {
					return ctx.json({ ok: true });
				}
			}

			const roles = getMetadata(ItemController, "getItems", "roles");
			expect(roles).toEqual(["admin", "editor"]);
		});

		it("should support @Public decorator", async () => {
			@Controller("/items")
			class ItemController {
				@Get("/public")
				@Public()
				getPublic(ctx: any) {
					return ctx.json({ public: true });
				}
			}

			const isPublic = getMetadata(ItemController, "getPublic", "isPublic");
			expect(isPublic).toBe(true);
		});
	});

	describe("@HttpCode error cases", () => {
		it("should throw when used on non-method", () => {
			expect(() => {
				@HttpCode(201)
				class BadClass {}
			}).toThrow("@HttpCode can only decorate methods");
		});
	});

	describe("@SetHeader error cases", () => {
		it("should throw when used on non-method", () => {
			expect(() => {
				@SetHeader("X-Test", "value")
				class BadClass {}
			}).toThrow("@SetHeader can only decorate methods");
		});
	});

	describe("@Redirect error cases", () => {
		it("should throw when used on non-method", () => {
			expect(() => {
				@Redirect("/new")
				class BadClass {}
			}).toThrow("@Redirect can only decorate methods");
		});
	});

	describe("@Version error cases", () => {
		it("should throw when used on non-method", () => {
			expect(() => {
				@Version("v1")
				class BadClass {}
			}).toThrow("@Version can only decorate methods");
		});
	});

	describe("applyDecorators", () => {
		it("should compose multiple decorators", async () => {
			const app = new Buntok();

			const AuthAndCache = applyDecorators(
				Use(async (ctx: any, next: () => any) => {
					ctx.store.authed = true;
					return next();
				}),
				SetHeader("X-Cache", "hit"),
			);

			@Controller("/items")
			class ItemController {
				@Get("/composed")
				@AuthAndCache
				getComposed(ctx: any) {
					return ctx.json({ authed: ctx.store.authed });
				}
			}

			app.registerController(ItemController);

			const res = await app.request("/items/composed");
			expect(res.status).toBe(200);
			expect(res.headers.get("X-Cache")).toBe("hit");
			const body = await res.json();
			expect(body.authed).toBe(true);
		});
	});

	describe("@Controller error cases", () => {
		it("should throw when used on non-class", () => {
			expect(() => {
				@Controller("/bad")
				class BadClass {}
			}).not.toThrow();
		});
	});
});
