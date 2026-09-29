import { describe, it, expect } from "bun:test";
import { App } from "../src/app";
import {
	Controller,
	Get,
	Post,
	HttpCode,
	SetHeader,
	Redirect,
} from "../src/decorators";
import { BaseController } from "../src/base-controller";

function respond(ctx: any, data: unknown) {
	return ctx.success(data, "Delegated");
}

describe("Decorator routes without middleware (full Context)", () => {
	it("app.registerController: ctx.success works with zero middleware", async () => {
		const app = new App();

		@Controller("/items")
		class ItemController {
			@Get("/")
			list(ctx: any) {
				return ctx.success({ items: [1, 2, 3] });
			}
		}

		app.registerController(ItemController);

		const res = await app.request("/items");
		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body.success).toBe(true);
		expect(body.data.items).toEqual([1, 2, 3]);
	});

	it("group.registerController: ctx.success works with zero middleware", async () => {
		const app = new App();

		@Controller("/gitems")
		class GroupItemController {
			@Get("/")
			list(ctx: any) {
				return ctx.success({ items: ["a", "b"] });
			}
		}

		const api = app.group("/api");
		api.registerController(GroupItemController);

		const res = await app.request("/api/gitems");
		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body.success).toBe(true);
		expect(body.data.items).toEqual(["a", "b"]);
	});

	it("group.registerController: ctx.params + ctx.success with zero middleware", async () => {
		const app = new App();

		@Controller("/gitems")
		class GroupItemController {
			@Get("/:id")
			getById(ctx: any) {
				return ctx.success({ id: ctx.params.id });
			}
		}

		const api = app.group("/api");
		api.registerController(GroupItemController);

		const res = await app.request("/api/gitems/42");
		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body.data.id).toBe("42");
	});

	it("delegated ctx (passed to helper function) works with zero middleware", async () => {
		const app = new App();

		@Controller("/delegated")
		class DelegatedController {
			@Get("/")
			list(ctx: any) {
				return respond(ctx, { via: "delegate" });
			}
		}

		app.registerController(DelegatedController);

		const res = await app.request("/delegated");
		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body.success).toBe(true);
		expect(body.message).toBe("Delegated");
		expect(body.data.via).toBe("delegate");
	});

	it("group.registerController: delegated ctx works with zero middleware", async () => {
		const app = new App();

		@Controller("/delegated")
		class DelegatedController {
			@Get("/")
			list(ctx: any) {
				return respond(ctx, { via: "group-delegate" });
			}
		}

		const api = app.group("/api");
		api.registerController(DelegatedController);

		const res = await app.request("/api/delegated");
		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body.success).toBe(true);
		expect(body.data.via).toBe("group-delegate");
	});

	it("ctx.cursorPaginate works with zero middleware", async () => {
		const app = new App();

		@Controller("/feeds")
		class FeedController {
			@Get("/")
			list(ctx: any) {
				return ctx.cursorPaginate([1, 2, 3], "cursor-abc");
			}
		}

		const api = app.group("/api");
		api.registerController(FeedController);

		const res = await app.request("/api/feeds");
		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body.success).toBe(true);
		expect(body.data).toEqual([1, 2, 3]);
		expect(body.meta.nextCursor).toBe("cursor-abc");
		expect(body.meta.hasMore).toBe(true);
	});

	it("ctx.paginate works with zero middleware", async () => {
		const app = new App();

		@Controller("/paged")
		class PagedController {
			@Get("/")
			list(ctx: any) {
				return ctx.paginate([1, 2], 25, 1, 10);
			}
		}

		app.registerController(PagedController);

		const res = await app.request("/paged");
		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body.data).toEqual([1, 2]);
		expect(body.meta.currentPage).toBe(1);
		expect(body.meta.total).toBe(25);
	});

	it("BaseController subclass via group: inherited ctx.success routes work", async () => {		const app = new App();

		const fakeService = {
			getAll: () => Promise.resolve([{ id: 1, name: "satu" }]),
			getById: (id: string | number) =>
				Promise.resolve({ id, name: "satu" }),
			create: (data: unknown) => Promise.resolve(data),
			update: (id: string | number, data: unknown) =>
				Promise.resolve({ id, ...data }),
			delete: () => Promise.resolve(undefined),
		};

		@Controller("/base-items")
		class BaseItemController extends BaseController<any> {
			constructor() {
				super(fakeService);
			}
		}

		const api = app.group("/api");
		api.registerController(BaseItemController);

		const res = await app.request("/api/base-items");
		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body.success).toBe(true);
		expect(body.data).toEqual([{ id: 1, name: "satu" }]);
	});
});

describe("Response decorators via RouterGroup.registerController", () => {
	it("applies @HttpCode", async () => {
		const app = new App();

		@Controller("/gcreated")
		class GroupCreateController {
			@Post("/")
			@HttpCode(201)
			create(ctx: any) {
				return ctx.success({ created: true });
			}
		}

		const api = app.group("/api");
		api.registerController(GroupCreateController);

		const res = await app.request("/api/gcreated", { method: "POST" });
		expect(res.status).toBe(201);
		const body = await res.json();
		expect(body.success).toBe(true);
	});

	it("applies @SetHeader", async () => {
		const app = new App();

		@Controller("/gcached")
		class GroupCachedController {
			@Get("/")
			@SetHeader("X-Cache", "hit")
			getCached(ctx: any) {
				return ctx.success({ cached: true });
			}
		}

		const api = app.group("/api");
		api.registerController(GroupCachedController);

		const res = await app.request("/api/gcached");
		expect(res.status).toBe(200);
		expect(res.headers.get("X-Cache")).toBe("hit");
	});

	it("applies @Redirect", async () => {
		const app = new App();

		@Controller("/gold")
		class GroupOldController {
			@Get("/path")
			@Redirect("/new/path")
			redirectOld(ctx: any) {
				return ctx.json({ unreachable: true });
			}
		}

		const api = app.group("/api");
		api.registerController(GroupOldController);

		const res = await app.request("/api/gold/path");
		expect(res.status).toBe(302);
		expect(res.headers.get("Location")).toBe("/new/path");
	});
});
