import type { Context } from "./context";
import { Controller, Delete, Get, Post, Put } from "./decorators";

/**
 * Abstract base controller with built-in CRUD routes using decorators.
 *
 * Extend this class and provide a route prefix via @Controller decorator.
 * The CRUD methods are pre-decorated with @Get, @Post, @Put, @Delete.
 *
 * @example
 * ```ts
 * import { Controller } from "@buntok/core";
 * import { BaseController } from "@buntok/core/base";
 * import type { Context } from "@buntok/core";
 *
 * // Simple usage (no input types needed)
 * @Controller("/users")
 * class UserController extends BaseController<User> {
 *   constructor(private userService: UserService) {
 *     super(userService);
 *   }
 * }
 *
 * // With typed inputs (optional)
 * @Controller("/users")
 * class UserController extends BaseController<User, CreateUserInput, UpdateUserInput> {
 *   constructor(private userService: UserService) {
 *     super(userService);
 *   }
 * }
 *
 * // Routes automatically registered:
 * // GET    /users
 * // GET    /users/:id
 * // POST   /users
 * // PUT    /users/:id
 * // DELETE /users/:id
 * ```
 */
@Controller("")
export abstract class BaseController<T, CreateInput = any, UpdateInput = any> {
	constructor(
		protected service: {
			getAll: () => Promise<T[]>;
			getById: (id: string | number) => Promise<T>;
			create: (data: CreateInput) => Promise<T>;
			update: (id: string | number, data: UpdateInput) => Promise<T>;
			delete: (id: string | number) => Promise<T>;
		},
	) {}

	/**
	 * Parse URL param id to the correct type.
	 * Default: tries to convert to number, falls back to string.
	 * Override this if you need custom id parsing (e.g., UUID).
	 */
	protected parseId(id: string): string | number {
		if (id === "") return id;
		const num = Number(id);
		return Number.isNaN(num) ? id : num;
	}

	@Get("/")
	async getAll(ctx: Context) {
		const data = await this.service.getAll();
		return ctx.success(data);
	}

	@Get("/:id")
	async getById(ctx: Context) {
		const id = this.parseId(ctx.params.id ?? "");
		const data = await this.service.getById(id);
		return ctx.success(data);
	}

	@Post("/")
	async create(ctx: Context) {
		const body = await ctx.body();
		const data = await this.service.create(body as CreateInput);
		return ctx.success(data, `Created successfully!.`, 201);
	}

	@Put("/:id")
	async update(ctx: Context) {
		const id = this.parseId(ctx.params.id ?? "");
		const body = await ctx.body();
		const data = await this.service.update(id, body as UpdateInput);
		return ctx.success(data);
	}

	@Delete("/:id")
	async delete(ctx: Context) {
		const id = this.parseId(ctx.params.id ?? "");
		await this.service.delete(id);
		return ctx.status(204);
	}
}
