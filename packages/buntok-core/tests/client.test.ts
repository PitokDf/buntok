import { describe, it, expect, beforeEach } from "bun:test";
import { createClient, ClientError, type RouteContract } from "../src/client";

// ─── Test Contracts ─────────────────────────────────────────────────────────────

const routes = {
	getUser: {
		method: "GET",
		path: "/users/:id",
	} as RouteContract<{ id: string }, undefined, undefined, { id: string; name: string }>,

	createUser: {
		method: "POST",
		path: "/users",
	} as RouteContract<undefined, undefined, { name: string }, { id: string; name: string }>,

	listUsers: {
		method: "GET",
		path: "/users",
	} as RouteContract<undefined, { page?: number; limit?: number }, undefined, { users: string[] }>,

	deleteUser: {
		method: "DELETE",
		path: "/users/:id",
	} as RouteContract<{ id: string }, undefined, undefined, void>,
};

// ─── ClientError ────────────────────────────────────────────────────────────────

describe("ClientError", () => {
	it("should have method, path, status, and body", () => {
		const err = new ClientError("GET", "/users/1", 404, "Not found");
		expect(err.method).toBe("GET");
		expect(err.path).toBe("/users/1");
		expect(err.status).toBe(404);
		expect(err.body).toBe("Not found");
		expect(err.name).toBe("ClientError");
		expect(err).toBeInstanceOf(Error);
	});

	it("should have a descriptive message", () => {
		const err = new ClientError("POST", "/users", 500, null);
		expect(err.message).toBe("POST /users failed with status 500");
	});
});

// ─── createClient ───────────────────────────────────────────────────────────────

describe("createClient", () => {
	let mockFetch: typeof fetch;
	let requests: Request[];

	beforeEach(() => {
		requests = [];
		mockFetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
			const req = input instanceof Request ? input : new Request(input, init);
			requests.push(req);

			const url = req.url;
			if (url.includes("/users/1")) {
				return new Response(JSON.stringify({ id: "1", name: "Alice" }), {
					status: 200,
					headers: { "Content-Type": "application/json" },
				});
			}
			if (url.includes("/users") && req.method === "POST") {
				return new Response(JSON.stringify({ id: "2", name: "Bob" }), {
					status: 201,
					headers: { "Content-Type": "application/json" },
				});
			}
			if (url.includes("/users") && req.method === "GET") {
				return new Response(JSON.stringify({ users: ["Alice", "Bob"] }), {
					status: 200,
					headers: { "Content-Type": "application/json" },
				});
			}
			return new Response("Not found", { status: 404 });
		};
	});

	it("should substitute path params", async () => {
		const api = createClient(routes, "http://localhost:1212", { fetch: mockFetch });
		await api.getUser({ params: { id: "42" } });
		expect(requests[0].url).toBe("http://localhost:1212/users/42");
		expect(requests[0].method).toBe("GET");
	});

	it("should send POST with JSON body", async () => {
		const api = createClient(routes, "http://localhost:1212", { fetch: mockFetch });
		await api.createUser({ body: { name: "Bob" } });
		expect(requests[0].method).toBe("POST");
		const body = await requests[0].json();
		expect(body).toEqual({ name: "Bob" });
	});

	it("should append query params", async () => {
		const api = createClient(routes, "http://localhost:1212", { fetch: mockFetch });
		await api.listUsers({ query: { page: 2, limit: 10 } });
		expect(requests[0].url).toContain("page=2");
		expect(requests[0].url).toContain("limit=10");
	});

	it("should skip undefined query params", async () => {
		const api = createClient(routes, "http://localhost:1212", { fetch: mockFetch });
		await api.listUsers({ query: { page: undefined } });
		expect(requests[0].url).not.toContain("page=");
	});

	it("should parse JSON response", async () => {
		const api = createClient(routes, "http://localhost:1212", { fetch: mockFetch });
		const user = await api.getUser({ params: { id: "1" } });
		expect(user).toEqual({ id: "1", name: "Alice" });
	});

	it("should add Content-Type header for POST", async () => {
		const api = createClient(routes, "http://localhost:1212", { fetch: mockFetch });
		await api.createUser({ body: { name: "Bob" } });
		expect(requests[0].headers.get("Content-Type")).toBe("application/json");
	});

	it("should add custom headers", async () => {
		const api = createClient(routes, "http://localhost:1212", {
			fetch: mockFetch,
			headers: { Authorization: "Bearer token123" },
		});
		await api.getUser({ params: { id: "1" } });
		expect(requests[0].headers.get("Authorization")).toBe("Bearer token123");
	});

	it("should throw ClientError on non-ok response", async () => {
		const errorFetch = async (): Promise<Response> => {
			return new Response("Unauthorized", { status: 401 });
		};
		const api = createClient(routes, "http://localhost:1212", { fetch: errorFetch });

		try {
			await api.getUser({ params: { id: "1" } });
			expect(true).toBe(false); // should not reach
		} catch (err) {
			expect(err).toBeInstanceOf(ClientError);
			expect((err as ClientError).status).toBe(401);
		}
	});

	it("should call onRequest interceptor", async () => {
		const interceptor = async (req: Request): Promise<Request> => {
			req.headers.set("X-Custom", "intercepted");
			return req;
		};
		const api = createClient(routes, "http://localhost:1212", {
			fetch: mockFetch,
			onRequest: interceptor,
		});
		await api.getUser({ params: { id: "1" } });
		expect(requests[0].headers.get("X-Custom")).toBe("intercepted");
	});

	it("should call onResponse interceptor", async () => {
		const interceptor = async (res: Response): Promise<Response> => {
			return new Response("intercepted", { status: res.status });
		};
		const api = createClient(routes, "http://localhost:1212", {
			fetch: mockFetch,
			onResponse: interceptor,
		});
		const result = await api.getUser({ params: { id: "1" } });
		expect(result).toBe("intercepted");
	});
});

// ─── Retry Logic ────────────────────────────────────────────────────────────────

describe("Client Retry Logic", () => {
	it("should retry on 500 status", async () => {
		let attempts = 0;
		const retryFetch = async (): Promise<Response> => {
			attempts++;
			if (attempts < 3) {
				return new Response("Server Error", { status: 500 });
			}
			return new Response(JSON.stringify({ ok: true }), {
				status: 200,
				headers: { "Content-Type": "application/json" },
			});
		};

		const api = createClient(
			{ get: { method: "GET", path: "/test" } as RouteContract },
			"http://localhost:1212",
			{
				fetch: retryFetch,
				retries: 3,
				retryDelay: 10,
			},
		);

		const result = await api.get();
		expect(attempts).toBe(3);
		expect(result).toEqual({ ok: true });
	});

	it("should not retry on 400 status", async () => {
		let attempts = 0;
		const retryFetch = async (): Promise<Response> => {
			attempts++;
			return new Response("Bad Request", { status: 400 });
		};

		const api = createClient(
			{ get: { method: "GET", path: "/test" } as RouteContract },
			"http://localhost:1212",
			{
				fetch: retryFetch,
				retries: 3,
				retryDelay: 10,
			},
		);

		try {
			await api.get();
		} catch (err) {
			expect(err).toBeInstanceOf(ClientError);
		}
		expect(attempts).toBe(1);
	});

	it("should throw after all retries exhausted", async () => {
		let attempts = 0;
		const retryFetch = async (): Promise<Response> => {
			attempts++;
			return new Response("Server Error", { status: 500 });
		};

		const api = createClient(
			{ get: { method: "GET", path: "/test" } as RouteContract },
			"http://localhost:1212",
			{
				fetch: retryFetch,
				retries: 2,
				retryDelay: 10,
			},
		);

		try {
			await api.get();
		} catch (err) {
			expect(err).toBeInstanceOf(ClientError);
			expect((err as ClientError).status).toBe(500);
		}
		expect(attempts).toBe(3); // initial + 2 retries
	});
});

// ─── Timeout ────────────────────────────────────────────────────────────────────

describe("Client Timeout", () => {
	it("should abort request after timeout", async () => {
		const slowFetch = async (_url: string, opts: RequestInit): Promise<Response> => {
			return new Promise((resolve, reject) => {
				const timer = setTimeout(() => resolve(new Response("ok")), 5000);
				opts.signal?.addEventListener("abort", () => {
					clearTimeout(timer);
					reject(new DOMException("The operation was aborted.", "AbortError"));
				});
			});
		};

		const api = createClient(
			{ get: { method: "GET", path: "/test" } as RouteContract },
			"http://localhost:1212",
			{
				fetch: slowFetch as any,
				timeout: 50,
			},
		);

		try {
			await api.get();
			expect(true).toBe(false);
		} catch (err) {
			expect(err).toBeInstanceOf(Error);
		}
	});
});
