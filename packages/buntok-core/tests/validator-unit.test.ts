import { describe, it, expect } from "bun:test";
import { Buntok } from "../src/buntok";
import { zValidator, z } from "../src/middlewares/validator";

describe("zValidator", () => {
	describe("body validation", () => {
		it("should validate JSON body with zod schema", async () => {
			const app = new Buntok();
			app.post(
				"/users",
				zValidator("body", z.object({ name: z.string(), age: z.number() })),
				(ctx) => {
					const data = ctx.valid<{ name: string; age: number }>("body");
					return ctx.json({ received: data });
				},
			);

			const res = await app.request("/users", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ name: "Budi", age: 25 }),
			});
			expect(res.status).toBe(200);
			const body = await res.json();
			expect(body.received.name).toBe("Budi");
			expect(body.received.age).toBe(25);
		});

		it("should return 422 for invalid body", async () => {
			const app = new Buntok();
			app.post(
				"/users",
				zValidator("body", z.object({ name: z.string(), age: z.number() })),
				(ctx) => ctx.json({ ok: true }),
			);

			const res = await app.request("/users", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ name: "Budi" }),
			});
			expect(res.status).toBe(422);
			const body = await res.json();
			expect(body.message).toBe("Validation Failed");
			expect(body.details).toBeArray();
		});

		it("should return 422 for invalid JSON", async () => {
			const app = new Buntok();
			app.post(
				"/data",
				zValidator("body", z.object({ key: z.string() })),
				(ctx) => ctx.json({ ok: true }),
			);

			const res = await app.request("/data", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: "not json",
			});
			expect(res.status).toBe(422);
		});

		it("should coerce types with z.coerce", async () => {
			const app = new Buntok();
			app.post(
				"/items",
				zValidator(
					"body",
					z.object({ count: z.coerce.number(), active: z.coerce.boolean() }),
				),
				(ctx) => {
					const data = ctx.valid<{ count: number; active: boolean }>("body");
					return ctx.json(data);
				},
			);

			const res = await app.request("/items", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ count: "5", active: "true" }),
			});
			expect(res.status).toBe(200);
			const body = await res.json();
			expect(body.count).toBe(5);
			expect(body.active).toBe(true);
		});
	});

	describe("query validation", () => {
		it("should validate query parameters", async () => {
			const app = new Buntok();
			app.get(
				"/search",
				zValidator("query", z.object({ q: z.string(), page: z.coerce.number() })),
				(ctx) => {
					const data = ctx.valid<{ q: string; page: number }>("query");
					return ctx.json(data);
				},
			);

			const res = await app.request("/search?q=test&page=2");
			expect(res.status).toBe(200);
			const body = await res.json();
			expect(body.q).toBe("test");
			expect(body.page).toBe(2);
		});

		it("should return 422 for missing required query param", async () => {
			const app = new Buntok();
			app.get(
				"/search",
				zValidator("query", z.object({ q: z.string() })),
				(ctx) => ctx.json({ ok: true }),
			);

			const res = await app.request("/search");
			expect(res.status).toBe(422);
		});

		it("should handle empty query string", async () => {
			const app = new Buntok();
			app.get(
				"/items",
				zValidator("query", z.object({ search: z.string().optional() })),
				(ctx) => {
					const data = ctx.valid<{ search?: string }>("query");
					return ctx.json(data);
				},
			);

			const res = await app.request("/items");
			expect(res.status).toBe(200);
			const body = await res.json();
			expect(body.search).toBeUndefined();
		});
	});

	describe("params validation", () => {
		it("should validate route params", async () => {
			const app = new Buntok();
			app.get(
				"/users/:id",
				zValidator("params", z.object({ id: z.coerce.number() })),
				(ctx) => {
					const data = ctx.valid<{ id: number }>("params");
					return ctx.json(data);
				},
			);

			const res = await app.request("/users/42");
			expect(res.status).toBe(200);
			const body = await res.json();
			expect(body.id).toBe(42);
		});

		it("should return 422 for invalid params", async () => {
			const app = new Buntok();
			app.get(
				"/users/:id",
				zValidator("params", z.object({ id: z.coerce.number().int().positive() })),
				(ctx) => ctx.json({ ok: true }),
			);

			const res = await app.request("/users/abc");
			expect(res.status).toBe(422);
		});
	});

	describe("content types", () => {
		it("should validate text/plain body", async () => {
			const app = new Buntok();
			app.post(
				"/text",
				zValidator("body", z.string().min(1), { contentType: "text/plain" }),
				(ctx) => {
					const data = ctx.valid<string>("body");
					return ctx.json({ text: data });
				},
			);

			const res = await app.request("/text", {
				method: "POST",
				headers: { "Content-Type": "text/plain" },
				body: "hello world",
			});
			expect(res.status).toBe(200);
			const body = await res.json();
			expect(body.text).toBe("hello world");
		});

		it("should return 422 for wrong content-type", async () => {
			const app = new Buntok();
			app.post(
				"/text",
				zValidator("body", z.string(), { contentType: "text/plain" }),
				(ctx) => ctx.json({ ok: true }),
			);

			const res = await app.request("/text", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ data: "test" }),
			});
			expect(res.status).toBe(422);
		});

		it("should validate x-www-form-urlencoded body", async () => {
			const app = new Buntok();
			app.post(
				"/form",
				zValidator(
					"body",
					z.object({ email: z.string(), age: z.coerce.number() }),
					{ contentType: "application/x-www-form-urlencoded" },
				),
				(ctx) => {
					const data = ctx.valid<{ email: string; age: number }>("body");
					return ctx.json(data);
				},
			);

			const res = await app.request("/form", {
				method: "POST",
				headers: { "Content-Type": "application/x-www-form-urlencoded" },
				body: "email=test@example.com&age=25",
			});
			expect(res.status).toBe(200);
			const body = await res.json();
			expect(body.email).toBe("test@example.com");
			expect(body.age).toBe(25);
		});
	});

	describe("metadata", () => {
		it("should attach validator metadata for OpenAPI", () => {
			const mw = zValidator("body", z.object({ name: z.string() }));
			expect((mw as any)._isBuntokValidator).toBe(true);
			expect((mw as any)._target).toBe("body");
			expect((mw as any)._schema).toBeDefined();
			expect((mw as any)._contentType).toBe("application/json");
		});

		it("should attach query target metadata", () => {
			const mw = zValidator("query", z.object({ q: z.string() }));
			expect((mw as any)._target).toBe("query");
			expect((mw as any)._contentType).toBe("");
		});
	});

	describe("ctx.valid()", () => {
		it("should throw when no validator ran for target", async () => {
			const app = new Buntok();
			app.get("/no-validator", (ctx) => {
				return ctx.valid("body");
			});

			const res = await app.request("/no-validator");
			expect(res.status).toBe(500);
		});
	});
});
