import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import {
	BuntokFile,
	detectMimeType,
	file,
	serveFileOrFallback,
} from "../../src/helpers/file";
import { Buntok } from "../../src/buntok";
import { existsSync, mkdirSync, writeFileSync, unlinkSync } from "node:fs";

const TEST_DIR = "/tmp/buntok-file-test";
const TEST_FILE = `${TEST_DIR}/test.txt`;

function createMockContext(headers?: Record<string, string>): any {
	return {
		json: (data: any, status = 200) =>
			new Response(JSON.stringify(data), { status }),
		request: new Request("http://localhost/", { headers }),
	};
}

beforeEach(() => {
	if (!existsSync(TEST_DIR)) mkdirSync(TEST_DIR, { recursive: true });
	writeFileSync(TEST_FILE, "hello world");
});

afterEach(() => {
	if (existsSync(TEST_FILE)) unlinkSync(TEST_FILE);
	if (existsSync(TEST_DIR)) {
		try {
			require("node:fs").rmdirSync(TEST_DIR);
		} catch {}
	}
});

describe("serveFileOrFallback", () => {
	it("should serve file if it exists", async () => {
		const ctx = createMockContext();
		const result = await serveFileOrFallback(ctx, TEST_FILE, () =>
			new Response("fallback"),
		);
		expect(result).toBeInstanceOf(Response);
		expect(await result.text()).toBe("hello world");
	});

	it("should return fallback if file does not exist", async () => {
		const ctx = createMockContext();
		const result = await serveFileOrFallback(
			ctx,
			"/nonexistent/file.txt",
			() => new Response("fallback"),
		);
		expect(await result.text()).toBe("fallback");
	});

	it("should return static fallback response", async () => {
		const ctx = createMockContext();
		const fallback = new Response("static fallback");
		const result = await serveFileOrFallback(
			ctx,
			"/nonexistent/file.txt",
			fallback,
		);
		expect(result).toBe(fallback);
	});

	it("should detect content type from extension", async () => {
		const pngFile = `${TEST_DIR}/test.png`;
		writeFileSync(pngFile, "png data");
		try {
			const ctx = createMockContext();
			const result = await serveFileOrFallback(ctx, pngFile, () =>
				new Response("fallback"),
			);
			expect(result.headers.get("Content-Type")).toBe("image/png");
		} finally {
			unlinkSync(pngFile);
		}
	});

	it("should use custom content type", async () => {
		const ctx = createMockContext();
		const result = await serveFileOrFallback(
			ctx,
			TEST_FILE,
			() => new Response("fallback"),
			{ contentType: "text/custom" },
		);
		expect(result.headers.get("Content-Type")).toBe("text/custom");
	});

	it("should use custom cache control", async () => {
		const ctx = createMockContext();
		const result = await serveFileOrFallback(
			ctx,
			TEST_FILE,
			() => new Response("fallback"),
			{ cacheControl: "no-store" },
		);
		expect(result.headers.get("Cache-Control")).toBe("no-store");
	});
});

describe("detectMimeType", () => {
	it("resolves video/audio types via Bun's native MIME DB", () => {
		expect(detectMimeType("clip.mp4")).toBe("video/mp4");
		expect(detectMimeType("movie.webm")).toBe("video/webm");
		expect(detectMimeType("song.mp3")).toBe("audio/mpeg");
		expect(detectMimeType("font.woff2")).toBe("font/woff2");
	});

	it("keeps legacy extension map behavior", () => {
		expect(detectMimeType("app.js")).toBe("application/javascript");
		expect(detectMimeType("photo.PNG")).toBe("image/png");
		expect(detectMimeType("report.xlsx")).toBe(
			"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
		);
	});

	it("falls back to application/octet-stream for unknown extensions", () => {
		expect(detectMimeType("blob.unknownext")).toBe("application/octet-stream");
		expect(detectMimeType("noextension")).toBe("application/octet-stream");
	});

	it("serves mp4 with video/mp4 instead of octet-stream", async () => {
		const mp4File = `${TEST_DIR}/clip.mp4`;
		writeFileSync(mp4File, "fake-video-bytes");
		try {
			const result = await serveFileOrFallback(
				createMockContext(),
				mp4File,
				() => new Response("fallback"),
			);
			expect(result.headers.get("Content-Type")).toBe("video/mp4");
		} finally {
			unlinkSync(mp4File);
		}
	});
});

describe("serveFileOrFallback HTTP Range support", () => {
	it("advertises Accept-Ranges on full responses", async () => {
		const result = await serveFileOrFallback(
			createMockContext(),
			TEST_FILE,
			() => new Response("fallback"),
		);
		expect(result.status).toBe(200);
		expect(result.headers.get("Accept-Ranges")).toBe("bytes");
		expect(await result.text()).toBe("hello world"); // 11 bytes
	});

	it("returns 206 with Content-Range for bytes=start-end", async () => {
		const ctx = createMockContext({ Range: "bytes=0-4" });
		const result = await serveFileOrFallback(ctx, TEST_FILE, () =>
			new Response("fallback"),
		);
		expect(result.status).toBe(206);
		expect(result.headers.get("Content-Range")).toBe("bytes 0-4/11");
		expect(await result.text()).toBe("hello");
	});

	it("returns 206 for open-ended range bytes=start-", async () => {
		const ctx = createMockContext({ Range: "bytes=6-" });
		const result = await serveFileOrFallback(ctx, TEST_FILE, () =>
			new Response("fallback"),
		);
		expect(result.status).toBe(206);
		expect(result.headers.get("Content-Range")).toBe("bytes 6-10/11");
		expect(await result.text()).toBe("world");
	});

	it("returns 206 for suffix range bytes=-N", async () => {
		const ctx = createMockContext({ Range: "bytes=-5" });
		const result = await serveFileOrFallback(ctx, TEST_FILE, () =>
			new Response("fallback"),
		);
		expect(result.status).toBe(206);
		expect(result.headers.get("Content-Range")).toBe("bytes 6-10/11");
		expect(await result.text()).toBe("world");
	});

	it("clamps end position beyond file size", async () => {
		const ctx = createMockContext({ Range: "bytes=0-9999" });
		const result = await serveFileOrFallback(ctx, TEST_FILE, () =>
			new Response("fallback"),
		);
		expect(result.status).toBe(206);
		expect(result.headers.get("Content-Range")).toBe("bytes 0-10/11");
		expect(await result.text()).toBe("hello world");
	});

	it("returns 416 for start beyond file size", async () => {
		const ctx = createMockContext({ Range: "bytes=11-" });
		const result = await serveFileOrFallback(ctx, TEST_FILE, () =>
			new Response("fallback"),
		);
		expect(result.status).toBe(416);
		expect(result.headers.get("Content-Range")).toBe("bytes */11");
	});

	it("returns 416 for empty suffix range (bytes=-0)", async () => {
		const ctx = createMockContext({ Range: "bytes=-0" });
		const result = await serveFileOrFallback(ctx, TEST_FILE, () =>
			new Response("fallback"),
		);
		expect(result.status).toBe(416);
		expect(result.headers.get("Content-Range")).toBe("bytes */11");
	});

	it("ignores multi-range requests and serves full content", async () => {
		const ctx = createMockContext({ Range: "bytes=0-1,3-4" });
		const result = await serveFileOrFallback(ctx, TEST_FILE, () =>
			new Response("fallback"),
		);
		expect(result.status).toBe(200);
		expect(await result.text()).toBe("hello world");
	});

	it("ignores invalid range syntax and serves full content", async () => {
		for (const range of ["bytes=abc", "bytes=5-2", "items=0-4", "bytes=-"]) {
			const ctx = createMockContext({ Range: range });
			const result = await serveFileOrFallback(ctx, TEST_FILE, () =>
				new Response("fallback"),
			);
			expect(result.status).toBe(200);
			expect(await result.text()).toBe("hello world");
		}
	});

	it("still returns fallback when file does not exist despite Range", async () => {
		const ctx = createMockContext({ Range: "bytes=0-4" });
		const result = await serveFileOrFallback(
			ctx,
			"/nonexistent/file.mp4",
			() => new Response("fallback"),
		);
		expect(result.status).toBe(200);
		expect(await result.text()).toBe("fallback");
	});
});

describe("file() (Elysia-style lazy file)", () => {
	const reqWith = (range?: string) =>
		new Request("http://localhost/", {
			headers: range ? { Range: range } : {},
		});

	it("is lazy: returns BuntokFile, not a Response", () => {
		const result = file(TEST_FILE);
		expect(result).toBeInstanceOf(BuntokFile);
		expect(result).not.toBeInstanceOf(Response);
		expect(result.path).toBe(TEST_FILE);
	});

	it("serves file with auto-detected content type via toResponse()", async () => {
		const result = file(TEST_FILE).toResponse();
		expect(result.status).toBe(200);
		expect(result.headers.get("Content-Type")).toContain("text/plain");
		expect(await result.text()).toBe("hello world");
	});

	it("detects video mime from extension", async () => {
		const mp4 = `${TEST_DIR}/clip.mp4`;
		writeFileSync(mp4, "fake-video-bytes");
		try {
			const result = file(mp4).toResponse();
			expect(result.headers.get("Content-Type")).toBe("video/mp4");
			expect(await result.text()).toBe("fake-video-bytes");
		} finally {
			unlinkSync(mp4);
		}
	});

	it("honors type override and extra headers", () => {
		const result = file(TEST_FILE, {
			type: "application/octet-stream",
			headers: { "Cache-Control": "no-store" },
		}).toResponse();
		expect(result.headers.get("Content-Type")).toBe("application/octet-stream");
		expect(result.headers.get("Cache-Control")).toBe("no-store");
	});

	it("exposes type/length/value/slice getters lazily", async () => {
		const f = file(TEST_FILE);
		expect(f.type).toContain("text/plain");
		expect(f.length).toBe(11);
		expect(f.value).toBeInstanceOf(Blob);
		expect(await new Response(f.slice(0, 5)).text()).toBe("hello");
	});

	describe("Range (Elysia parity)", () => {
		it("sends accept-ranges + content-range on full 200 without Range", () => {
			const r = file(TEST_FILE).toResponse(reqWith());
			expect(r.status).toBe(200);
			expect(r.headers.get("Accept-Ranges")).toBe("bytes");
			expect(r.headers.get("Content-Range")).toBe("bytes 0-10/11");
		});

		it("serves 206 for bytes=0-4", async () => {
			const r = file(TEST_FILE).toResponse(reqWith("bytes=0-4"));
			expect(r.status).toBe(206);
			expect(r.headers.get("Accept-Ranges")).toBe("bytes");
			expect(r.headers.get("Content-Range")).toBe("bytes 0-4/11");
			expect(await r.text()).toBe("hello");
		});

		it("serves 206 for open-ended range bytes=6-", async () => {
			const r = file(TEST_FILE).toResponse(reqWith("bytes=6-"));
			expect(r.status).toBe(206);
			expect(r.headers.get("Content-Range")).toBe("bytes 6-10/11");
			expect(await r.text()).toBe("world");
		});

		it("serves 206 for suffix range bytes=-5", async () => {
			const r = file(TEST_FILE).toResponse(reqWith("bytes=-5"));
			expect(r.status).toBe(206);
			expect(r.headers.get("Content-Range")).toBe("bytes 6-10/11");
			expect(await r.text()).toBe("world");
		});

		it("returns 416 without accept-ranges when start >= size (Elysia parity)", () => {
			const r = file(TEST_FILE).toResponse(reqWith("bytes=99-"));
			expect(r.status).toBe(416);
			expect(r.headers.get("Content-Range")).toBe("bytes */11");
			expect(r.headers.get("Accept-Ranges")).toBeNull();
		});

		it("ignores multi-range and invalid syntax → full 200", async () => {
			// Deliberate deviation from Elysia: multi-range does not serve its sub-ranges
			for (const range of ["bytes=0-1,5-6", "bytes=abc", "items=0-4", "bytes=-"]) {
				const r = file(TEST_FILE).toResponse(reqWith(range));
				expect(r.status).toBe(200);
				expect(await r.text()).toBe("hello world");
			}
		});
	});

	describe("through Buntok dispatch", () => {
		it("static AOT route: Range diproses di codegen fast path", async () => {
			const app = new Buntok();
			app.disable("logger");
			app.get("/video", () => file(TEST_FILE));
			const r = await app.request("/video", { headers: { Range: "bytes=0-4" } });
			expect(r.status).toBe(206);
			expect(r.headers.get("Content-Range")).toBe("bytes 0-4/11");
			expect(await r.text()).toBe("hello");
		});

		it("dynamic route (fallback path): Range diproses", async () => {
			const app = new Buntok();
			app.disable("logger");
			app.get("/files/:name", () => file(TEST_FILE));
			const r = await app.request("/files/test.txt", {
				headers: { Range: "bytes=-5" },
			});
			expect(r.status).toBe(206);
			expect(await r.text()).toBe("world");
		});

		it("async handler + full-200 headers di codegen powered/log path", async () => {
			const app = new Buntok();
			app.get("/f", async (c) => {
				c.set.headers["x-note"] = "yes";
				return file(TEST_FILE);
			});
			const r = await app.request("/f");
			expect(r.status).toBe(200);
			expect(r.headers.get("Content-Range")).toBe("bytes 0-10/11");
			expect(r.headers.get("x-note")).toBe("yes");
		});
	});
});
