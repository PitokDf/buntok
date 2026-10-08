/**
 * Central response normalizer - Elysia-style flexible return.
 *
 * Allows handlers to return string | number | boolean | object | array | null | void
 * in addition to Response, and automatically serializes to correct Response.
 *
 * - Response -> passthrough
 * - BuntokFile (lazy file()) -> toResponse(request) - Range processed if the request has one
 * - null/undefined/void -> 204 No Content
 * - string -> text/plain; charset=utf-8
 * - number/boolean/bigint -> text/plain via String(value)
 * - Blob/ArrayBuffer/Uint8Array/ReadableStream -> BodyInit passthrough
 * - object/array -> application/json via Response.json
 */

import { BuntokFile } from "./file";

const TEXT_CT = { "Content-Type": "text/plain; charset=utf-8" };

export function toResponse(value: unknown, request?: Request): Response {
	if (value instanceof Response) return value;
	// Lazy file (BuntokFile) - convert at response time so Range can be read
	if (value instanceof BuntokFile) return value.toResponse(request);
	if (value === null || value === undefined) {
		return new Response(null, { status: 204 });
	}
	// Fast path: string (most common return type)
	if (typeof value === "string") {
		return new Response(value, { headers: TEXT_CT });
	}
	const t = typeof value;
	if (t === "number" || t === "boolean" || t === "bigint") {
		return new Response(String(value), { headers: TEXT_CT });
	}
	// Binary / stream - only reachable for objects
	if (
		t === "object" &&
		(value instanceof Blob ||
			value instanceof ArrayBuffer ||
			value instanceof Uint8Array ||
			value instanceof ReadableStream)
	) {
		// biome-ignore lint/suspicious/noExplicitAny: BodyInit union is DOM-specific
		return new Response(value as any);
	}
	// Array, plain object, etc. -> JSON
	return Response.json(value);
}

export function toResponseMaybeAsync(
	value: unknown,
): Response | Promise<Response> {
	if (value instanceof Promise) {
		return value.then(toResponse);
	}
	return toResponse(value);
}
