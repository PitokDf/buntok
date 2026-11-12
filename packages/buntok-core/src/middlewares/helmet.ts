import type { Middleware } from "../buntok";

export interface HelmetOptions {
	/** X-Content-Type-Options (default: "nosniff") */
	contentTypeOptions?: string;
	/** X-Frame-Options (default: "DENY") */
	frameOptions?: string;
	/** X-XSS-Protection (default: "0") */
	xssProtection?: string;
	/** Referrer-Policy (default: "no-referrer") */
	referrerPolicy?: string;
	/** Strict-Transport-Security (default: "max-age=31536000; includeSubDomains") */
	hsts?: string;
	/** X-DNS-Prefetch-Control (default: "on") */
	dnsPrefetch?: string;
	/** Permissions-Policy (default: "camera=(), microphone=(), geolocation=()") */
	permissionsPolicy?: string;
	/** Custom headers to add */
	additionalHeaders?: Record<string, string>;
	/**
	 * Remove the `X-Powered-By: buntok` header (default: `true`).
	 * Set to `false` if you deliberately want to keep it.
	 */
	hidePoweredBy?: boolean;
}

const DEFAULT_HEADERS: Record<string, string> = {
	"X-Content-Type-Options": "nosniff",
	"X-Frame-Options": "DENY",
	"X-XSS-Protection": "0",
	"Referrer-Policy": "no-referrer",
	"Strict-Transport-Security": "max-age=31536000; includeSubDomains",
	"X-DNS-Prefetch-Control": "on",
	"Permissions-Policy": "camera=(), microphone=(), geolocation=()",
};

/**
 * Security headers middleware - adds common security headers to all responses.
 *
 * @example
 * import { helmet } from "@buntok/core";
 *
 * // Default - all standard headers
 * app.use(helmet());
 *
 * // Custom options
 * app.use(helmet({
 *   frameOptions: "SAMEORIGIN",
 *   hsts: "max-age=63072000",
 * }));
 */
export function helmet(options?: HelmetOptions): Middleware {
	const headers: Record<string, string> = { ...DEFAULT_HEADERS };

	if (options?.contentTypeOptions)
		headers["X-Content-Type-Options"] = options.contentTypeOptions;
	if (options?.frameOptions) headers["X-Frame-Options"] = options.frameOptions;
	if (options?.xssProtection)
		headers["X-XSS-Protection"] = options.xssProtection;
	if (options?.referrerPolicy)
		headers["Referrer-Policy"] = options.referrerPolicy;
	if (options?.hsts) headers["Strict-Transport-Security"] = options.hsts;
	if (options?.dnsPrefetch)
		headers["X-DNS-Prefetch-Control"] = options.dnsPrefetch;
	if (options?.permissionsPolicy)
		headers["Permissions-Policy"] = options.permissionsPolicy;
	if (options?.additionalHeaders)
		Object.assign(headers, options.additionalHeaders);

	// Pre-compute entries to avoid Object.entries() per request
	const headerEntries = Object.entries(headers);
	const hidePoweredBy = options?.hidePoweredBy ?? true;

	return async (ctx, next) => {
		const response = await next();
		// Set headers directly on the response - avoids copying Headers + creating new Response
		for (const [key, value] of headerEntries) {
			if (!response.headers.has(key)) {
				response.headers.set(key, value);
			}
		}
		if (hidePoweredBy) {
			response.headers.delete("X-Powered-By");
			// The framework adds X-Powered-By after middleware returns, so a
			// `null` entry tells applyCtxHeaders to delete it from the final
			// response (works on every pipeline/AOT exit path). Mock contexts
			// used in unit tests may not implement `set`.
			const headers = ctx.set?.headers;
			if (headers) headers["X-Powered-By"] = null;
		}
		return response;
	};
}
