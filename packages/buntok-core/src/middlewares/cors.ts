import type { Middleware } from "../buntok";
import { toResponse } from "../helpers/response";
import { logger } from "../logger";

export interface CorsOptions {
	origin?: string | string[] | ((origin: string) => boolean);
	methods?: string[];
	headers?: string[];
	credentials?: boolean;
	maxAge?: number;
}

export function resolveOrigin(
	requestOrigin: string,
	options: CorsOptions,
): string | null {
	let allowedOrigin: string | null = null;

	if (typeof options.origin === "function") {
		allowedOrigin = options.origin(requestOrigin) ? requestOrigin : null;
	} else if (Array.isArray(options.origin)) {
		allowedOrigin = options.origin.includes(requestOrigin)
			? requestOrigin
			: null;
	} else if (options.origin === undefined || options.origin === "*") {
		allowedOrigin = "*";
	} else {
		allowedOrigin = options.origin === requestOrigin ? requestOrigin : null;
	}

	return allowedOrigin;
}

export function applyCorsHeaders(
	response: Response,
	requestOrigin: string,
	options: CorsOptions,
): void {
	const allowedOrigin = resolveOrigin(requestOrigin, options);

	// Origin not allowed: do not emit Access-Control-Allow-Origin at all
	// (an empty value is worse than no header).
	if (allowedOrigin !== null) {
		response.headers.set("Access-Control-Allow-Origin", allowedOrigin);

		// Reflected origin must vary on Origin so shared caches don't serve
		// one origin's response to another.
		if (allowedOrigin !== "*") {
			const vary = response.headers.get("Vary") ?? "";
			if (!vary.split(",").map((s) => s.trim()).includes("Origin")) {
				response.headers.set(
					"Vary",
					vary ? `${vary}, Origin` : "Origin",
				);
			}
		}

		if (options.credentials) {
			response.headers.set("Access-Control-Allow-Credentials", "true");
			if (allowedOrigin === "*") {
				logger.warn(
					"CORS: credentials:true with origin '*' is rejected by browsers; set an explicit origin",
				);
			}
		}

		if (options.maxAge !== undefined) {
			response.headers.set("Access-Control-Max-Age", String(options.maxAge));
		}
	}
}

export const cors = (options: CorsOptions = {}): Middleware => {
	return async (ctx, next) => {
		const requestOrigin = ctx.request.headers.get("Origin") || "*";
		const allowedOrigin = resolveOrigin(requestOrigin, options);

		if (ctx.request.method === "OPTIONS") {
			// Preflight for a disallowed origin is rejected outright.
			if (allowedOrigin === null) {
				return new Response(null, { status: 403 });
			}

			const res = new Response(null, { status: 204 });
			res.headers.set("Access-Control-Allow-Origin", allowedOrigin);
			if (allowedOrigin !== "*") {
				res.headers.set("Vary", "Origin");
			}
			res.headers.set(
				"Access-Control-Allow-Methods",
				(
					options.methods || [
						"GET",
						"POST",
						"PUT",
						"DELETE",
						"PATCH",
						"OPTIONS",
					]
				).join(","),
			);
			// Reflect the client's requested headers back instead of a fixed
			// allow-list, so preflight answers match what the client sent.
			const requestedHeaders =
				ctx.request.headers.get("access-control-request-headers");
			res.headers.set(
				"Access-Control-Allow-Headers",
				requestedHeaders ??
					(options.headers || [
						"Content-Type",
						"Authorization",
						"x-api-key",
					]).join(","),
			);
			if (options.credentials)
				res.headers.set("Access-Control-Allow-Credentials", "true");
			if (options.maxAge !== undefined)
				res.headers.set(
					"Access-Control-Max-Age",
					String(options.maxAge),
				);
			return res;
		}

		const response = toResponse(await next());

		applyCorsHeaders(response, requestOrigin, options);

		return response;
	};
};
