import type { Context } from "../context";
import { detectMimeType } from "./file";

export interface DownloadOptions {
	contentType?: string;
	cacheControl?: string;
}

/**
 * Serve a file for download (Content-Disposition: attachment).
 *
 * @example
 * downloadFile(ctx, "./reports/report.pdf", "report-2026.pdf")
 */
export async function downloadFile(
	// biome-ignore lint/suspicious/noExplicitAny: helper works with any app DI shape
	ctx: Context<any, any>,
	filePath: string,
	filename?: string,
	options?: DownloadOptions,
): Promise<Response> {
	const file = Bun.file(filePath);
	if (!(await file.exists())) {
		return ctx.json({ error: "File not found" }, 404);
	}

	const downloadName = filename || filePath.split("/").pop() || "download";
	const contentType = options?.contentType ?? detectMimeType(filePath);

	return new Response(file, {
		headers: {
			"Content-Type": contentType,
			"Content-Disposition": `attachment; filename="${downloadName}"`,
			"Cache-Control": options?.cacheControl ?? "no-cache",
		},
	});
}

/**
 * Download a buffer/bytes as a file.
 *
 * @example
 * downloadBuffer(ctx, pdfBytes, "document.pdf")
 */
export function downloadBuffer(
	// biome-ignore lint/suspicious/noExplicitAny: helper works with any app DI shape
	ctx: Context<any, any>,
	data: ArrayBuffer | Uint8Array | Blob,
	filename: string,
	options?: DownloadOptions,
): Response {
	const contentType = options?.contentType ?? detectMimeType(filename);

	return new Response(data, {
		headers: {
			"Content-Type": contentType,
			"Content-Disposition": `attachment; filename="${filename}"`,
			"Cache-Control": options?.cacheControl ?? "no-cache",
		},
	});
}
