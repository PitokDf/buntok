import { describe, it, expect } from "bun:test";
import { z } from "zod";
import { Buntok } from "../src/buntok";
import { Context } from "../src/context";
import { zValidator } from "../src/middlewares/validator";
import {
	handleUploads,
	MemoryStorage,
	type StorageDriver,
} from "../src/upload";

function req(path = "/test", init?: RequestInit): Request {
	return new Request(`http://localhost${path}`, init);
}

describe("response profile", () => {
	it("keeps the default success envelope without a profile", async () => {
		const app = new Buntok();
		app.get("/", (ctx) => ctx.success({ id: 1 }));

		const body = await (await app.request("/")).json();
		expect(body).toEqual({ success: true, message: "Success", data: { id: 1 } });
	});

	it("applies success/paginate/error envelopes app-wide", async () => {
		const app = new Buntok();
		app.responseProfile({
			success: (data, message) => ({
				ok: true,
				message: message === "Success" ? "Berhasil" : message,
				data,
			}),
			paginate: (data, meta) => ({ ok: true, data, page: meta.currentPage }),
			error: (message, status) => ({ ok: false, message, status }),
		});

		app.get("/success", (ctx) => ctx.success({ id: 1 }));
		app.get("/paginate", (ctx) => ctx.paginate([1, 2], 10, 2, 2));
		app.get("/error", (ctx) => ctx.error("Nope", 400));
		app.get("/boom", () => {
			throw new Error("kaboom");
		});

		expect(await (await app.request("/success")).json()).toEqual({
			ok: true,
			message: "Berhasil",
			data: { id: 1 },
		});
		expect(await (await app.request("/paginate")).json()).toEqual({
			ok: true,
			data: [1, 2],
			page: 2,
		});
		expect(await (await app.request("/error")).json()).toEqual({
			ok: false,
			message: "Nope",
			status: 400,
		});
		// Unhandled errors use the profile error envelope too
		const boom = await (await app.request("/boom")).json();
		expect(boom.ok).toBe(false);
		expect(boom.status).toBe(500);
	});

	it("applies validation profile defaults and per-call overrides", async () => {
		const app = new Buntok();
		app.responseProfile({
			validation: {
				status: 400,
				message: "Invalid input data.",
				errors: (issues) =>
					(issues as z.ZodIssue[]).map((i) => ({
						path: i.path.join("."),
						message: i.message,
					})),
			},
		});

		const schema = z.object({ name: z.string() });
		app.post("/profile", zValidator("body", schema), (ctx) =>
			ctx.valid("body"),
		);
		app.post(
			"/override",
			zValidator("body", schema, {
				errorStatus: 409,
				errorMessage: "custom",
			}),
			(ctx) => ctx.valid("body"),
		);

		const res = await app.request("/profile", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ name: 1 }),
		});
		expect(res.status).toBe(400);
		const body = await res.json();
		expect(body.message).toBe("Invalid input data.");
		expect(body.details[0].path).toBe("name");

		const override = await app.request("/override", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ name: 1 }),
		});
		expect(override.status).toBe(409);
		expect((await override.json()).message).toBe("custom");
	});
});

describe("BigInt-safe JSON", () => {
	it("serializes BigInt as string by default", async () => {
		const app = new Buntok();
		app.get("/", (ctx) => ctx.json({ amount: 9007199254740993n }));

		const body = await (await app.request("/")).json();
		expect(body).toEqual({ amount: "9007199254740993" });
	});

	it('throws a descriptive error when bigint is "throw"', () => {
		const ctx = new Context(
			req(),
			{},
			{},
			undefined,
			{ json: { bigint: "throw" } },
		);
		expect(() => ctx.json({ amount: 1n })).toThrow(
			/serialisasi/,
		);
	});

	it("serializes BigInt returned directly from a handler", async () => {
		const app = new Buntok();
		app.get("/", () => ({ amount: 42n }));

		const body = await (await app.request("/")).json();
		expect(body).toEqual({ amount: "42" });
	});
});

describe("ctx helpers", () => {
	it("exposes pathname, search and path", () => {
		const ctx = new Context(req("/api/v1/outlets?page=2"), {});
		expect(ctx.pathname).toBe("/api/v1/outlets");
		expect(ctx.search).toBe("?page=2");
		expect(ctx.path).toBe("/api/v1/outlets?page=2");
	});

	it("sets cookies before the response exists", async () => {
		const app = new Buntok();
		app.get("/", (ctx) => {
			ctx.setCookie("token", "abc", { httpOnly: true, sameSite: "lax" });
			ctx.setCookie("role", "admin");
			return ctx.success({ ok: true });
		});

		const res = await app.request("/");
		const cookies = res.headers.getSetCookie();
		expect(cookies).toHaveLength(2);
		expect(cookies[0]).toContain("token=abc");
		expect(cookies[0]).toContain("HttpOnly");
		expect(cookies[1]).toContain("role=admin");
	});

	it("downloads a buffer with attachment headers", async () => {
		const app = new Buntok();
		app.get("/", (ctx) =>
			ctx.download(new Uint8Array([1, 2, 3]), "products.xlsx"),
		);

		const res = await app.request("/");
		expect(res.headers.get("content-disposition")).toBe(
			'attachment; filename="products.xlsx"',
		);
		expect(res.headers.get("content-type")).toBe(
			"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
		);
	});
});

describe("uploader messages", () => {
	it("uses custom per-category messages", async () => {
		const form = new FormData();
		form.append(
			"avatar",
			new File([new Uint8Array(10)], "a.png", { type: "image/png" }),
		);
		const request = new Request("http://localhost/upload", {
			method: "POST",
			headers: { "Content-Type": "multipart/form-data" },
			body: form,
		});
		const ctx = {
			request,
			formData: async () => form,
			store: {} as Record<string, unknown>,
		} as any;

		const error = await handleUploads(ctx, {
			storage: new MemoryStorage() as StorageDriver,
			maxFileSize: 5,
			messages: {
				maxFileSize: ({ field, limit }) =>
					`File terlalu besar. Maksimal ${limit} byte untuk ${field}.`,
			},
		}).catch((e: Error) => e);

		expect(error).toBeInstanceOf(Error);
		expect((error as Error).message).toBe(
			"File terlalu besar. Maksimal 5 byte untuk avatar.",
		);
	});

	it("falls back to built-in messages", async () => {
		const form = new FormData();
		form.append("avatar", new File([new Uint8Array(10)], "a.png"));
		const request = new Request("http://localhost/upload", {
			method: "POST",
			headers: { "Content-Type": "multipart/form-data" },
			body: form,
		});
		const ctx = {
			request,
			formData: async () => form,
			store: {} as Record<string, unknown>,
		} as any;

		const error = await handleUploads(ctx, {
			storage: new MemoryStorage() as StorageDriver,
			maxFileSize: 5,
		}).catch((e: Error) => e);

		expect((error as Error).message).toContain("exceeds max size");
	});
});
