import type { Middleware } from "../buntok";
import { toResponse } from "../helpers/response";

export interface CorsOptions {
	origin?: string | string[] | ((origin: string) => boolean);
	methods?: string[];
	headers?: string[];
	credentials?: boolean;
}

export function resolveOrigin(
	requestOrigin: string,
	options: CorsOptions,
): string {
	let allowedOrigin = "*";

	if (typeof options.origin === "function") {
		allowedOrigin = options.origin(requestOrigin) ? requestOrigin : "";
	} else if (Array.isArray(options.origin)) {
		allowedOrigin = options.origin.includes(requestOrigin)
			? requestOrigin
			: "";
	} else if (options.origin) {
		allowedOrigin = options.origin;
	}

	return allowedOrigin;
}

export function applyCorsHeaders(
	response: Response,
	requestOrigin: string,
	options: CorsOptions,
): void {
	const allowedOrigin = resolveOrigin(requestOrigin, options);
	response.headers.set("Access-Control-Allow-Origin", allowedOrigin);
	if (options.credentials)
		response.headers.set("Access-Control-Allow-Credentials", "true");
}

export const cors = (options: CorsOptions = {}): Middleware => {
	return async (ctx, next) => {
		const requestOrigin = ctx.request.headers.get("Origin") || "*";
		const allowedOrigin = resolveOrigin(requestOrigin, options);

		if (ctx.request.method === "OPTIONS") {
			const res = new Response(null, { status: 204 });
			res.headers.set("Access-Control-Allow-Origin", allowedOrigin);
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
			res.headers.set(
				"Access-Control-Allow-Headers",
				(
					options.headers || ["Content-Type", "Authorization", "x-api-key"]
				).join(","),
			);
			if (options.credentials)
				res.headers.set("Access-Control-Allow-Credentials", "true");
			return res;
		}

		const response = toResponse(await next());

		applyCorsHeaders(response, requestOrigin, options);

		return response;
	};
};
