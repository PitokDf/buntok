import type { Middleware } from "../buntok";
import { BadRequestError } from "../helpers/async-handler";

export interface BodySizeLimitOptions {
	/**
	 * Maximum allowed request body size in bytes.
	 * Defaults to 10MB (10 * 1024 * 1024).
	 */
	maxSize?: number;

	/**
	 * Custom error message when body size exceeds limit.
	 * Defaults to: "Request body too large. Maximum size is {maxSize} bytes."
	 */
	message?: string;

	/**
	 * HTTP status code for oversized requests.
	 * Defaults to 413 (Payload Too Large).
	 */
	statusCode?: number;
}

/**
 * Middleware to limit incoming request body size.
 *
 * Checks the Content-Length header before the body is parsed.
 * Returns 413 (Payload Too Large) if the body exceeds the configured limit.
 *
 * @example
 * // Global: limit all requests to 1MB
 * app.use(bodySizeLimit({ maxSize: 1024 * 1024 }));
 *
 * @example
 * // Per-route: limit file upload endpoint to 50MB
 * app.post("/upload", bodySizeLimit({ maxSize: 50 * 1024 * 1024 }), handler);
 *
 * @example
 * // Custom error message
 * app.use(bodySizeLimit({
 *   maxSize: 1024 * 1024,
 *   message: "File too large. Max 1MB allowed.",
 * }));
 */
export function bodySizeLimit(options?: BodySizeLimitOptions): Middleware {
	const maxSize = options?.maxSize ?? 10 * 1024 * 1024; // 10MB default
	const statusCode = options?.statusCode ?? 413;

	return async (ctx, next) => {
		const contentLength = ctx.request.headers.get("content-length");

		if (contentLength) {
			const size = Number.parseInt(contentLength, 10);

			if (!Number.isNaN(size) && size > maxSize) {
				const message =
					options?.message ??
					`Request body too large. Maximum size is ${maxSize} bytes.`;

				return ctx.json(
					{
						success: false,
						message,
					},
					statusCode,
				);
			}
		}

		return next();
	};
}
