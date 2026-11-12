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

/**
 * How `ctx.json()` (and other JSON responses) handle `BigInt` values.
 *
 * - `"string"` (default) - serialize as a decimal string, matching the
 *   common Express `JSON.stringify` replacer workaround.
 * - `"throw"` - throw a descriptive error instead of the opaque native
 *   `TypeError: Do not know how to serialize a BigInt`.
 */
export type BigIntMode = "string" | "throw";

export interface JsonConfig {
	bigint?: BigIntMode;
}

const BIGINT_REPLACER = (_key: string, value: unknown): unknown =>
	typeof value === "bigint" ? value.toString() : value;

/**
 * Serialize JSON with BigInt support. Uses the native `Response.json()` fast
 * path whenever possible and only falls back to a custom replacer when the
 * payload actually contains a `BigInt`, so non-BigInt responses keep the
 * exact same behavior (and content-type) as before.
 */
export function jsonResponse(
	value: unknown,
	status = 200,
	bigint: BigIntMode = "string",
): Response {
	const init = status === 200 ? undefined : { status };
	try {
		return Response.json(value, init);
	} catch (err) {
		if (err instanceof TypeError && /BigInt/i.test(err.message)) {
			if (bigint === "string") {
				return new Response(JSON.stringify(value, BIGINT_REPLACER), {
					...(init ?? {}),
					headers: { "Content-Type": "application/json; charset=utf-8" },
				});
			}
			throw new TypeError(
				'BigInt tidak bisa diserialisasi - aktifkan app.json({ bigint: "string" })',
			);
		}
		throw err;
	}
}

export function toResponse(
	value: unknown,
	request?: Request,
	bigint: BigIntMode = "string",
): Response {
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
	return jsonResponse(value, 200, bigint);
}

export function toResponseMaybeAsync(
	value: unknown,
): Response | Promise<Response> {
	if (value instanceof Promise) {
		return value.then(toResponse);
	}
	return toResponse(value);
}
