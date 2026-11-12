import type { Context } from "../context";
import { toResponse } from "./response";

type RouteHandler<DI = Record<string, unknown>> = (
	ctx: Context<DI>,
) => Promise<Response>;

export function asyncHandler<DI = Record<string, unknown>>(
	// biome-ignore lint/suspicious/noExplicitAny: flexible return
	handler: (ctx: Context<DI>) => Promise<any>,
): RouteHandler<DI> {
	return async (ctx: Context<DI>): Promise<Response> => {
		try {
			const result = await handler(ctx);
			return toResponse(result);
		} catch (error: unknown) {
			const message =
				error instanceof Error ? error.message : "Internal Server Error";
			const status = error instanceof HttpError ? error.status : 500;

			const errorName =
				status === 400
					? "Bad Request"
					: status === 401
						? "Unauthorized"
						: status === 403
							? "Forbidden"
							: status === 404
								? "Not Found"
								: status === 405
									? "Method Not Allowed"
									: status === 409
										? "Conflict"
										: status === 413
											? "Payload Too Large"
											: status === 422
											? "Unprocessable Entity"
											: status === 429
												? "Too Many Requests"
												: status === 503
													? "Service Unavailable"
													: status === 504
														? "Gateway Timeout"
														: "Internal Server Error";

			return ctx.json({ success: false, error: errorName, message }, status);
		}
	};
}

export class HttpError extends Error {
	status: number;

	constructor(status: number, message: string) {
		super(message);
		this.status = status;
		this.name = "HttpError";
	}
}

export class NotFoundError extends HttpError {
	constructor(message = "Not Found") {
		super(404, message);
		this.name = "NotFoundError";
	}
}

export class BadRequestError extends HttpError {
	constructor(message = "Bad Request") {
		super(400, message);
		this.name = "BadRequestError";
	}
}

export class UnauthorizedError extends HttpError {
	constructor(message = "Unauthorized") {
		super(401, message);
		this.name = "UnauthorizedError";
	}
}

export class ForbiddenError extends HttpError {
	constructor(message = "Forbidden") {
		super(403, message);
		this.name = "ForbiddenError";
	}
}

export class MethodNotAllowedError extends HttpError {
	constructor(message = "Method Not Allowed") {
		super(405, message);
		this.name = "MethodNotAllowedError";
	}
}

export class ConflictError extends HttpError {
	constructor(message = "Conflict") {
		super(409, message);
		this.name = "ConflictError";
	}
}

export class PayloadTooLargeError extends HttpError {
	constructor(message = "Payload Too Large") {
		super(413, message);
		this.name = "PayloadTooLargeError";
	}
}

export class UnprocessableEntityError extends HttpError {
	constructor(message = "Unprocessable Entity") {
		super(422, message);
		this.name = "UnprocessableEntityError";
	}
}

export class TooManyRequestsError extends HttpError {
	constructor(message = "Too Many Requests") {
		super(429, message);
		this.name = "TooManyRequestsError";
	}
}

export class InternalServerError extends HttpError {
	constructor(message = "Internal Server Error") {
		super(500, message);
		this.name = "InternalServerError";
	}
}

export class ServiceUnavailableError extends HttpError {
	constructor(message = "Service Unavailable") {
		super(503, message);
		this.name = "ServiceUnavailableError";
	}
}
