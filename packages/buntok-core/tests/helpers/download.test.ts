import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { downloadBuffer, downloadFile } from "../../src/helpers/download";
import { existsSync, mkdirSync, writeFileSync, unlinkSync } from "node:fs";

const TEST_DIR = "/tmp/buntok-download-test";
const TEST_FILE = `${TEST_DIR}/report.pdf`;

function createMockContext(): any {
	return {
		json: (data: any, status = 200) =>
			new Response(JSON.stringify(data), { status }),
	};
}

describe("downloadBuffer", () => {
	it("should return attachment response", () => {
		const ctx = createMockContext();
		const data = new Uint8Array([1, 2, 3]);

		const result = downloadBuffer(ctx, data, "file.bin");
		expect(result).toBeInstanceOf(Response);
		expect(result.headers.get("Content-Disposition")).toContain("file.bin");
		expect(result.headers.get("Content-Disposition")).toContain("attachment");
	});

	it("should detect content type from extension", () => {
		const ctx = createMockContext();
		const data = new Uint8Array([1, 2, 3]);

		const result = downloadBuffer(ctx, data, "image.png");
		expect(result.headers.get("Content-Type")).toBe("image/png");
	});

	it("should use custom content type", () => {
		const ctx = createMockContext();
		const data = new Uint8Array([1, 2, 3]);

		const result = downloadBuffer(ctx, data, "file.bin", {
			contentType: "application/custom",
		});
		expect(result.headers.get("Content-Type")).toBe("application/custom");
	});

	it("should handle ArrayBuffer", () => {
		const ctx = createMockContext();
		const data = new ArrayBuffer(3);

		const result = downloadBuffer(ctx, data, "file.bin");
		expect(result).toBeInstanceOf(Response);
	});

	it("should handle Blob", () => {
		const ctx = createMockContext();
		const data = new Blob(["content"]);

		const result = downloadBuffer(ctx, data, "file.txt");
		expect(result).toBeInstanceOf(Response);
		expect(result.headers.get("Content-Type")).toBe("text/plain");
	});

	it("should use custom cache control", () => {
		const ctx = createMockContext();
		const data = new Uint8Array([1]);

		const result = downloadBuffer(ctx, data, "file.bin", {
			cacheControl: "max-age=3600",
		});
		expect(result.headers.get("Cache-Control")).toBe("max-age=3600");
	});

	it("should default to no-cache", () => {
		const ctx = createMockContext();
		const data = new Uint8Array([1]);

		const result = downloadBuffer(ctx, data, "file.bin");
		expect(result.headers.get("Cache-Control")).toBe("no-cache");
	});

	it("should detect video MIME types (mp4)", () => {
		const ctx = createMockContext();
		const result = downloadBuffer(ctx, new Uint8Array([1]), "clip.mp4");
		expect(result.headers.get("Content-Type")).toBe("video/mp4");
	});
});

describe("downloadFile", () => {
	beforeEach(() => {
		if (!existsSync(TEST_DIR)) mkdirSync(TEST_DIR, { recursive: true });
		writeFileSync(TEST_FILE, "%PDF-1.4 fake");
	});

	afterEach(() => {
		if (existsSync(TEST_FILE)) unlinkSync(TEST_FILE);
		try {
			require("node:fs").rmdirSync(TEST_DIR);
		} catch {}
	});

	it("should serve existing file as attachment", async () => {
		const ctx = createMockContext();
		const result = await downloadFile(ctx, TEST_FILE, "laporan.pdf");
		expect(result.status).toBe(200);
		expect(result.headers.get("Content-Disposition")).toContain(
			'filename="laporan.pdf"',
		);
		expect(result.headers.get("Content-Type")).toBe("application/pdf");
		expect(await result.text()).toBe("%PDF-1.4 fake");
	});

	it("should fall back to filename from path", async () => {
		const ctx = createMockContext();
		const result = await downloadFile(ctx, TEST_FILE);
		expect(result.headers.get("Content-Disposition")).toContain(
			'filename="report.pdf"',
		);
	});

	it("should detect video MIME types for served files", async () => {
		const mp4File = `${TEST_DIR}/clip.mp4`;
		writeFileSync(mp4File, "fake-video");
		try {
			const ctx = createMockContext();
			const result = await downloadFile(ctx, mp4File);
			expect(result.headers.get("Content-Type")).toBe("video/mp4");
		} finally {
			unlinkSync(mp4File);
		}
	});

	it("should return 404 when file does not exist", async () => {
		const ctx = createMockContext();
		const result = await downloadFile(ctx, "/nonexistent/file.pdf");
		expect(result.status).toBe(404);
	});
});
