export interface CookieOptions {
	/** Domain to set the cookie on */
	domain?: string;
	/** Expiration time in seconds */
	maxAge?: number;
	/** Absolute expiration date */
	expires?: Date;
	/** Cookie path (default: /) */
	path?: string;
	/** Secure flag (HTTPS only) */
	secure?: boolean;
	/** HttpOnly flag (not accessible via JavaScript) */
	httpOnly?: boolean;
	/** SameSite policy */
	sameSite?: "strict" | "lax" | "none";
	/** Cookie partition key (for partitioned cookies) */
	partitioned?: boolean;
}

/**
 * Parse cookies from Cookie header string
 */
export function parseCookies(cookieHeader: string): Record<string, string> {
	const cookies: Record<string, string> = {};

	if (!cookieHeader) return cookies;

	const pairs = cookieHeader.split(";");

	for (const pair of pairs) {
		const [name, ...valueParts] = pair.split("=");
		if (name === undefined) continue;
		const trimmedName = name.trim();
		const value = valueParts.join("=").trim();

		if (trimmedName) {
			try {
				cookies[trimmedName] = decodeURIComponent(value);
			} catch {
				cookies[trimmedName] = value;
			}
		}
	}

	return cookies;
}

/**
 * Serialize a cookie to a string
 */
export function serializeCookie(
	name: string,
	value: string,
	options: CookieOptions = {},
): string {
	if (!/^[^;=\s,\x00-\x1f\x7f]+$/.test(name)) {
		throw new Error(`Invalid cookie name: ${JSON.stringify(name)}`);
	}
	if (
		options.path !== undefined &&
		/[;,\n\r\x00-\x1f\x7f]/.test(options.path)
	) {
		throw new Error(`Invalid cookie path: ${JSON.stringify(options.path)}`);
	}
	if (options.domain && /[;=,\s\x00-\x1f\x7f]/.test(options.domain)) {
		throw new Error(`Invalid cookie domain: ${JSON.stringify(options.domain)}`);
	}

	// SameSite defaults to Lax; None requires Secure (prevents silent downgrade).
	const sameSite = options.sameSite ?? "lax";
	if (sameSite === "none" && !options.secure) {
		throw new Error("SameSite=None requires the Secure attribute");
	}

	let cookie = `${name}=${encodeURIComponent(value)}`;

	if (options.domain) {
		cookie += `; Domain=${options.domain}`;
	}

	if (options.maxAge !== undefined) {
		cookie += `; Max-Age=${options.maxAge}`;
	}

	if (options.expires) {
		cookie += `; Expires=${options.expires.toUTCString()}`;
	}

	cookie += `; Path=${options.path || "/"}`;

	if (options.secure) {
		cookie += "; Secure";
	}

	if (options.httpOnly) {
		cookie += "; HttpOnly";
	}

	if (sameSite) {
		cookie += `; SameSite=${sameSite.charAt(0).toUpperCase() + sameSite.slice(1)}`;
	}

	if (options.partitioned) {
		cookie += "; Partitioned";
	}

	return cookie;
}

/**
 * Get a cookie value from request
 */
export function getCookie(request: Request, name: string): string | undefined {
	const cookieHeader = request.headers.get("Cookie");
	if (!cookieHeader) return undefined;

	const cookies = parseCookies(cookieHeader);
	return cookies[name];
}

/**
 * Get all cookies from request
 */
export function getCookies(request: Request): Record<string, string> {
	const cookieHeader = request.headers.get("Cookie");
	return parseCookies(cookieHeader || "");
}

/**
 * Set a cookie on Response
 */
export function setCookie(
	response: Response,
	name: string,
	value: string,
	options: CookieOptions = {},
): Response {
	const cookie = serializeCookie(name, value, options);

	// Clone response headers into a new Headers object to avoid
	// the body-stream being consumed by the Response constructor
	// when the original response's body is already locked.
	const newHeaders = new Headers();
	response.headers.forEach((value, key) => {
		newHeaders.set(key, value);
	});
	newHeaders.append("Set-Cookie", cookie);

	return new Response(response.body, {
		status: response.status,
		statusText: response.statusText,
		headers: newHeaders,
	});
}

/**
 * Delete a cookie (set expired)
 */
export function deleteCookie(
	response: Response,
	name: string,
	options: Omit<CookieOptions, "maxAge" | "expires"> = {},
): Response {
	return setCookie(response, name, "", {
		...options,
		maxAge: 0,
		expires: new Date(0),
	});
}
