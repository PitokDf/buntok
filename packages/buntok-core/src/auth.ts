import type { Middleware } from "./buntok";
import type { Context } from "./context";

const textEncoder = new TextEncoder();

function base64UrlEncode(buffer: ArrayBuffer | Uint8Array) {
	return btoa(String.fromCharCode(...new Uint8Array(buffer)))
		.replace(/\+/g, "-")
		.replace(/\//g, "_")
		.replace(/=+$/, "");
}

function base64UrlDecode(str: string) {
	str = str.replace(/-/g, "+").replace(/_/g, "/");
	const pad = str.length % 4;
	if (pad) str += "=".repeat(4 - pad);
	return Uint8Array.from(atob(str), (c) => c.charCodeAt(0));
}

/**
 * Zero-dependency, ultra-fast JWT implementation using WebCrypto API
 */
export interface JwtOptions {
	/** Algorithms accepted during verification. Defaults to HS256 only. */
	algorithms?: ["HS256"];
	/** Expected issuer claim. */
	issuer?: string;
	/** Expected audience claim. */
	audience?: string;
	/** Clock tolerance for exp and nbf, in seconds. */
	clockToleranceSeconds?: number;
}

export class JwtService {
	constructor(
		private secret: string,
		private options: JwtOptions = {},
	) { }

	async sign(
		payload: Record<string, unknown>,
		expiresInSeconds?: number,
	): Promise<string> {
		const header = base64UrlEncode(
			textEncoder.encode(JSON.stringify({ alg: "HS256", typ: "JWT" })),
		);

		const exp = expiresInSeconds
			? Math.floor(Date.now() / 1000) + expiresInSeconds
			: undefined;
		const claims: Record<string, unknown> = {
			...payload,
			...(exp !== undefined ? { exp } : {}),
		};
		if (this.options.issuer && claims.iss === undefined) claims.iss = this.options.issuer;
		if (this.options.audience && claims.aud === undefined) claims.aud = this.options.audience;
		const data = base64UrlEncode(textEncoder.encode(JSON.stringify(claims)));

		const key = await crypto.subtle.importKey(
			"raw",
			textEncoder.encode(this.secret),
			{ name: "HMAC", hash: "SHA-256" },
			false,
			["sign"],
		);

		const signature = await crypto.subtle.sign(
			"HMAC",
			key,
			textEncoder.encode(`${header}.${data}`),
		);
		return `${header}.${data}.${base64UrlEncode(signature)}`;
	}

	async verify<T = Record<string, unknown>>(token: string): Promise<T | null> {
		const parts = token.split(".");
		if (parts.length !== 3) return null;

		try {
			const header = JSON.parse(
				new TextDecoder().decode(base64UrlDecode(parts[0]!)),
			) as { alg?: string; typ?: string };
			if (!this.options.algorithms?.includes(header.alg as "HS256") && header.alg !== "HS256") return null;
			if (header.typ && header.typ !== "JWT") return null;

			const key = await crypto.subtle.importKey(
				"raw",
				textEncoder.encode(this.secret),
				{ name: "HMAC", hash: "SHA-256" },
				false,
				["verify"],
			);

			const signature = base64UrlDecode(parts[2]!);
			const valid = await crypto.subtle.verify(
				"HMAC",
				key,
				signature,
				textEncoder.encode(`${parts[0]}.${parts[1]}`),
			);

			if (!valid) return null;

			const payload = JSON.parse(
				new TextDecoder().decode(base64UrlDecode(parts[1]!)),
			);

			const now = Math.floor(Date.now() / 1000);
			const tolerance = this.options.clockToleranceSeconds ?? 0;
			if (typeof payload.exp === "number" && now >= payload.exp + tolerance) {
				return null;
			}
			if (typeof payload.nbf === "number" && now + tolerance < payload.nbf) return null;
			if (this.options.issuer && payload.iss !== this.options.issuer) return null;
			if (this.options.audience) {
				const audiences = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
				if (!audiences.includes(this.options.audience)) return null;
			}

			return payload as T;
		} catch (_e) {
			return null;
		}
	}
}

/**
 * Middleware that extracts JWT, verifies it, and injects user payload into `ctx.user`.
 * Returns 401 if unauthorized.
 *
 * Auth source is configured via environment variables:
 * - `AUTH_STORE=header` (default): Read from Authorization: Bearer <token> header
 * - `AUTH_STORE=cookie`: Read from HttpOnly cookie (name from AUTH_COOKIE env var)
 * - Falls back to header if cookie not found
 */
export function requireAuth(
	secret: string,
	options?: JwtOptions,
): Middleware<Record<string, unknown>> {
	const jwt = new JwtService(secret, options);

	return async (
		ctx: Context<Record<string, unknown>>,
		next: () => Promise<Response> | Response,
	) => {
		let token: string | undefined;
		const authStore = process.env.AUTH_STORE ?? "header";

		// Cookie-based auth
		if (authStore === "cookie") {
			const cookieName = process.env.AUTH_COOKIE;
			if (cookieName) {
				token = ctx.getCookie(cookieName);
			}
		}

		// Fallback to Authorization header (always try, even if AUTH_STORE=cookie)
		if (!token) {
			const authHeader = ctx.request.headers.get("Authorization");
			if (authHeader?.startsWith("Bearer ")) {
				token = authHeader.split(" ")[1];
			}
		}

		if (!token) {
			return ctx.json(
				{ error: "Unauthorized", message: "Missing or invalid authentication token" },
				401,
			);
		}

		const user = await jwt.verify(token);

		if (!user) {
			return ctx.json(
				{ error: "Unauthorized", message: "Token is invalid or expired" },
				401,
			);
		}

		// Inject user into context (buntok style)
		ctx.user = user;

		return next();
	};
}
