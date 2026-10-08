import { afterEach, describe, expect, it } from "bun:test";
import { Buntok } from "../src/buntok";
import { InternalServerError, NotFoundError } from "../src/helpers/async-handler";

const PREV_NODE_ENV = process.env.NODE_ENV;

function setNodeEnv(value: string | undefined): void {
	if (value === undefined) {
		delete process.env.NODE_ENV;
	} else {
		process.env.NODE_ENV = value;
	}
}

afterEach(() => {
	setNodeEnv(PREV_NODE_ENV);
});

describe("default error handler: production message masking", () => {
	it("keeps the message of a 4xx HttpError in production", async () => {
		setNodeEnv("production");
		const app = new Buntok();
		app.get("/categories", () => {
			throw new NotFoundError("Categories not found");
		});

		const res = await app.request("/categories");
		const body = await res.json();

		expect(res.status).toBe(404);
		expect(body).toEqual({
			success: false,
			error: "Not Found",
			message: "Categories not found",
		});
	});

	it("masks a 5xx HttpError message in production", async () => {
		setNodeEnv("production");
		const app = new Buntok();
		app.get("/pay", () => {
			throw new InternalServerError("Payment gateway timeout");
		});

		const res = await app.request("/pay");
		const body = await res.json();

		expect(res.status).toBe(500);
		expect(body).toEqual({
			success: false,
			error: "Internal Server Error",
			message: "An unexpected error occurred",
		});
	});

	it("masks unexpected (non-HttpError) errors in production", async () => {
		setNodeEnv("production");
		const app = new Buntok();
		app.get("/boom", () => {
			throw new Error("db creds invalid");
		});

		const res = await app.request("/boom");
		const body = await res.json();

		expect(res.status).toBe(500);
		expect(body).toEqual({
			success: false,
			error: "Internal Server Error",
			message: "An unexpected error occurred",
		});
	});

	it("shows the original message in development", async () => {
		setNodeEnv("development");
		const app = new Buntok();
		app.get("/boom", () => {
			throw new Error("db creds invalid");
		});
		app.get("/missing", () => {
			throw new NotFoundError("Categories not found");
		});

		const boom = await app.request("/boom");
		expect(await boom.json()).toMatchObject({
			message: "db creds invalid",
		});

		const missing = await app.request("/missing");
		expect(await missing.json()).toMatchObject({
			error: "Not Found",
			message: "Categories not found",
		});
	});
});

describe("default error handler: custom onError", () => {
	it("lets app.onError override the default handler", async () => {
		setNodeEnv("production");
		const app = new Buntok();
		app.onError(() => new Response("custom handler", { status: 418 }));
		app.get("/teapot", () => {
			throw new NotFoundError("Categories not found");
		});

		const res = await app.request("/teapot");
		expect(res.status).toBe(418);
		expect(await res.text()).toBe("custom handler");
	});
});
