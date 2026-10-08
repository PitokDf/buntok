import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { Buntok } from "../src/buntok";
import { requireAuth, JwtService } from "../src/auth";
import { z } from "zod";

const SECRET = "test-secret";

function makeToken(payload: Record<string, unknown>, expiresInSeconds?: number) {
	const jwt = new JwtService(SECRET);
	return jwt.sign(payload, expiresInSeconds);
}

describe("requireAuth middleware", () => {
	beforeEach(() => {
		process.env.AUTH_STORE = "header";
		delete process.env.AUTH_COOKIE;
	});

	afterEach(() => {
		delete process.env.AUTH_STORE;
		delete process.env.AUTH_COOKIE;
	});

	it("should allow request with valid Bearer token in header", async () => {
		const app = new Buntok();
		const token = await makeToken({ userId: 1 });
		app.get("/protected", requireAuth(SECRET), (ctx) => {
			return ctx.json({ user: ctx.user });
		});

		const res = await app.request("/protected", {
			headers: { Authorization: `Bearer ${token}` },
		});
		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body.user.userId).toBe(1);
	});

	it("should return 401 when no token provided", async () => {
		const app = new Buntok();
		app.get("/protected", requireAuth(SECRET), (ctx) => {
			return ctx.json({ ok: true });
		});

		const res = await app.request("/protected");
		expect(res.status).toBe(401);
		const body = await res.json();
		expect(body.error).toBe("Unauthorized");
	});

	it("should return 401 for expired token", async () => {
		const app = new Buntok();
		const token = await makeToken({ userId: 1 }, -10);
		app.get("/protected", requireAuth(SECRET), (ctx) => {
			return ctx.json({ ok: true });
		});

		const res = await app.request("/protected", {
			headers: { Authorization: `Bearer ${token}` },
		});
		expect(res.status).toBe(401);
	});

	it("should return 401 for invalid token", async () => {
		const app = new Buntok();
		app.get("/protected", requireAuth(SECRET), (ctx) => {
			return ctx.json({ ok: true });
		});

		const res = await app.request("/protected", {
			headers: { Authorization: "Bearer invalid.token.here" },
		});
		expect(res.status).toBe(401);
	});

	it("should inject user into ctx.user", async () => {
		const app = new Buntok();
		const token = await makeToken({ userId: 42, role: "admin" });
		app.get("/me", requireAuth(SECRET), (ctx) => {
			return ctx.json({ userId: ctx.user?.userId, role: ctx.user?.role });
		});

		const res = await app.request("/me", {
			headers: { Authorization: `Bearer ${token}` },
		});
		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body.userId).toBe(42);
		expect(body.role).toBe("admin");
	});

	it("should read token from cookie when AUTH_STORE=cookie", async () => {
		process.env.AUTH_STORE = "cookie";
		process.env.AUTH_COOKIE = "session_token";

		const app = new Buntok();
		const token = await makeToken({ userId: 7 });
		app.get("/protected", requireAuth(SECRET), (ctx) => {
			return ctx.json({ user: ctx.user });
		});

		const res = await app.request("/protected", {
			headers: { Cookie: `session_token=${token}` },
		});
		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body.user.userId).toBe(7);
	});

	it("should fallback to header when cookie is empty", async () => {
		process.env.AUTH_STORE = "cookie";
		process.env.AUTH_COOKIE = "session_token";

		const app = new Buntok();
		const token = await makeToken({ userId: 8 });
		app.get("/protected", requireAuth(SECRET), (ctx) => {
			return ctx.json({ user: ctx.user });
		});

		const res = await app.request("/protected", {
			headers: {
				Authorization: `Bearer ${token}`,
				Cookie: "other=value",
			},
		});
		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body.user.userId).toBe(8);
	});

	it("should return 401 when Authorization header has wrong format", async () => {
		const app = new Buntok();
		app.get("/protected", requireAuth(SECRET), (ctx) => {
			return ctx.json({ ok: true });
		});

		const res = await app.request("/protected", {
			headers: { Authorization: "Token abc123" },
		});
		expect(res.status).toBe(401);
	});

	it("should work with middleware chain (next() called)", async () => {
		const app = new Buntok();
		const token = await makeToken({ userId: 1 });
		let nextCalled = false;

		app.get(
			"/chain",
			requireAuth(SECRET),
			(ctx, next) => {
				nextCalled = true;
				return next();
			},
			(ctx) => {
				return ctx.json({ chain: true });
			},
		);

		const res = await app.request("/chain", {
			headers: { Authorization: `Bearer ${token}` },
		});
		expect(res.status).toBe(200);
		expect(nextCalled).toBe(true);
	});
});
