import { afterEach, describe, expect, it, spyOn } from "bun:test";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { Buntok } from "../src/buntok";
import { Container, Dependencies } from "../src/container";
import { file } from "../src/helpers/file";
import { JwtService, requireAuth } from "../src/auth";
import { helmet } from "../src/middlewares/helmet";
import { LocalDiskStorage } from "../src/upload";
import { Router } from "../src/router";

function tempDir(): string {
	return mkdtempSync(join(tmpdir(), "buntok-fixes-"));
}

describe("upload path traversal (BT-001)", () => {
	it("strips directory components from client filenames", async () => {
		const dir = tempDir();
		try {
			const storage = new LocalDiskStorage(dir);
			const uploaded = await storage.handleFile(
				new File(["data"], "../../evil.png", { type: "image/png" }),
				"../../evil-uuid",
				".png",
			);
			expect(uploaded.path).toBe(join(dir, "evil-uuid.png"));
			expect(existsSync(uploaded.path as string)).toBe(true);
		} finally {
			rmSync(dir, { recursive: true, force: true });
		}
	});

	it("refuses to delete files outside the upload root", async () => {
		const dir = tempDir();
		try {
			const storage = new LocalDiskStorage(dir);
			expect(await storage.deleteFile("/etc/hosts")).toBe(false);
			expect(await storage.deleteFile(resolve(dir, "..", "outside.txt"))).toBe(false);
		} finally {
			rmSync(dir, { recursive: true, force: true });
		}
	});
});

describe("detached fetch/request (BT-002)", () => {
	it("keeps working when app.fetch is destructured", async () => {
		const app = new Buntok({ handleSignals: false });
		app.get("/ping", () => "pong");
		const fetchHandler = app.fetch;
		const res = await fetchHandler(new Request("http://localhost/ping"));
		expect(await res.text()).toBe("pong");
	});

	it("keeps working when app.request is destructured", async () => {
		const app = new Buntok({ handleSignals: false });
		app.get("/ping", () => "pong");
		const request = app.request;
		const res = await request("/ping");
		expect(await res.text()).toBe("pong");
	});
});

describe("request body handling (BT-004, BT-008)", () => {
	it("returns 400 for invalid JSON instead of 500", async () => {
		const app = new Buntok({ handleSignals: false });
		app.post("/json", async (ctx) => ctx.json(await ctx.body()));
		const res = await app.request("/json", {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: "{nope",
		});
		expect(res.status).toBe(400);
	});

	it("returns 413 when the body exceeds the default 4 MB limit", async () => {
		const app = new Buntok({ handleSignals: false });
		app.post("/json", async (ctx) => ctx.json(await ctx.body()));
		const res = await app.request("/json", {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: "x".repeat(4 * 1024 * 1024 + 10),
		});
		expect(res.status).toBe(413);
	});

	it("respects a custom body limit", async () => {
		const app = new Buntok({ handleSignals: false });
		app.bodyLimit(10);
		app.post("/json", async (ctx) => ctx.json(await ctx.body()));
		const res = await app.request("/json", {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({ value: "too long" }),
		});
		expect(res.status).toBe(413);
	});
});

describe("router subpath build entry (BT-005)", () => {
	it("every tsup entry exists on disk and the router module is importable", () => {
		const config = readFileSync(
			join(import.meta.dir, "..", "tsup.config.ts"),
			"utf-8",
		);
		const entries = [...config.matchAll(/"src\/[^"]+\.ts"/g)].map((m) =>
			m[0].slice(1, -1),
		);
		expect(entries.length).toBeGreaterThan(0);
		for (const entry of entries) {
			expect(existsSync(join(import.meta.dir, "..", entry))).toBe(true);
		}
		expect(typeof Router).toBe("function");
	});
});

describe("405 Method Not Allowed (BT-007)", () => {
	it("answers 405 with an Allow header for a known path", async () => {
		const app = new Buntok({ handleSignals: false });
		app.post("/only-post", () => "ok");
		const res = await app.request("/only-post");
		expect(res.status).toBe(405);
		expect(res.headers.get("allow")).toBe("POST");
	});

	it("still answers 404 for an unknown path", async () => {
		const app = new Buntok({ handleSignals: false });
		app.post("/only-post", () => "ok");
		const res = await app.request("/missing");
		expect(res.status).toBe(404);
	});

	it("lets CORS answer OPTIONS preflight before the 405 handler", async () => {
		const app = new Buntok({ handleSignals: false });
		app.cors();
		app.get("/test", () => "ok");
		const res = await app.request("/test", { method: "OPTIONS" });
		expect(res.status).toBe(204);
	});
});

describe("helmet hides X-Powered-By (BT-009)", () => {
	it("removes the header by default", async () => {
		const app = new Buntok({ handleSignals: false });
		app.use(helmet());
		app.get("/", () => "ok");
		const res = await app.request("/");
		expect(res.headers.get("x-powered-by")).toBeNull();
	});

	it("keeps the header when hidePoweredBy is false", async () => {
		const app = new Buntok({ handleSignals: false });
		app.use(helmet({ hidePoweredBy: false }));
		app.get("/", () => "ok");
		const res = await app.request("/");
		expect(res.headers.get("x-powered-by")).toBe("buntok");
	});
});

describe("missing file responses (BT-012)", () => {
	it("returns 404 for a missing lazy file", async () => {
		const app = new Buntok({ handleSignals: false });
		app.get("/missing", () => file("/definitely/not/here/xyz.bin"));
		const res = await app.request("/missing");
		expect(res.status).toBe(404);
	});
});

describe("JWT and auth hardening (BT-014, BT-015)", () => {
	const warn = spyOn(console, "warn");

	afterEach(() => {
		warn.mockClear();
	});

	it("warns for short secrets in development", () => {
		new JwtService("short");
		expect(warn).toHaveBeenCalled();
	});

	it("does not warn for 32+ byte secrets", () => {
		new JwtService("x".repeat(32));
		expect(warn).not.toHaveBeenCalled();
	});

	it("accepts a lowercase bearer scheme", async () => {
		const secret = "x".repeat(32);
		const jwt = new JwtService(secret);
		const token = await jwt.sign({ sub: "42" });
		const app = new Buntok({ handleSignals: false });
		app.use(requireAuth(secret));
		app.get("/me", (ctx) => ctx.json({ user: ctx.user }));
		const res = await app.request("/me", {
			headers: { authorization: `bearer ${token}` },
		});
		expect(res.status).toBe(200);
	});
});

describe("container hardening (BT-019, BT-020, BT-021)", () => {
	it("clears the resolving marker after a factory throws", () => {
		const container = new Container();
		let shouldThrow = true;
		container.register("boom", {
			useFactory: () => {
				if (shouldThrow) throw new Error("boom");
				return "ok";
			},
		});
		expect(() => container.resolve("boom")).toThrow("boom");
		shouldThrow = false;
		expect(container.resolve("boom")).toBe("ok");
	});

	it("rejects useValue: undefined", () => {
		const container = new Container();
		expect(() =>
			container.register("bad", { useValue: undefined } as never),
		).toThrow(TypeError);
	});

	it("does not silently register classes that need arguments", () => {
		class NeedsArgs {
			constructor(public dep: string) {}
		}
		const container = new Container();
		container.scan([NeedsArgs]);
		expect(() => container.resolve(NeedsArgs)).toThrow(
			"No provider registered for: NeedsArgs",
		);
	});

	it("still resolves @Dependencies() classes", () => {
		class Service {
			value = "ok";
		}
		@Dependencies(Service)
		class Consumer {
			constructor(public service: Service) {}
		}
		const container = new Container();
		container.scan([Consumer]);
		expect(container.resolve(Consumer).service.value).toBe("ok");
	});
});
