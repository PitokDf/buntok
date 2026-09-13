import { describe, it, expect, beforeEach } from "bun:test";
import {
	generateCodeVerifier,
	generateCodeChallenge,
	generatePKCE,
} from "../src/oauth/pkce";
import {
	storeOAuthState,
	verifyOAuthState,
	getCodeVerifier,
	clearOAuthCookies,
} from "../src/oauth/state";
import {
	createOAuth2AuthorizationURL,
	validateOAuth2AuthorizationCode,
	decodeIdToken,
} from "../src/oauth/helpers";
import {
	OAuthError,
	OAuthStateError,
	OAuthTokenError,
	OAuthProviderError,
} from "../src/oauth/types";

// ─── PKCE ──────────────────────────────────────────────────────────────────────

describe("PKCE", () => {
	describe("generateCodeVerifier", () => {
		it("should generate a verifier with default length 43", () => {
			const verifier = generateCodeVerifier();
			expect(verifier.length).toBe(43);
		});

		it("should generate a verifier with custom length", () => {
			const verifier = generateCodeVerifier(128);
			expect(verifier.length).toBe(128);
		});

		it("should only contain unreserved characters", () => {
			const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
			const verifier = generateCodeVerifier();
			for (const char of verifier) {
				expect(charset).toContain(char);
			}
		});

		it("should throw RangeError for length < 43", () => {
			expect(() => generateCodeVerifier(42)).toThrow(RangeError);
		});

		it("should throw RangeError for length > 128", () => {
			expect(() => generateCodeVerifier(129)).toThrow(RangeError);
		});

		it("should generate unique verifiers", () => {
			const v1 = generateCodeVerifier();
			const v2 = generateCodeVerifier();
			expect(v1).not.toBe(v2);
		});
	});

	describe("generateCodeChallenge", () => {
		it("should generate a base64url-encoded SHA256 hash", async () => {
			const challenge = await generateCodeChallenge("test-verifier");
			expect(challenge).toBeTruthy();
			expect(challenge).not.toContain("+");
			expect(challenge).not.toContain("/");
			expect(challenge).not.toContain("=");
		});

		it("should be deterministic for the same input", async () => {
			const c1 = await generateCodeChallenge("same-input");
			const c2 = await generateCodeChallenge("same-input");
			expect(c1).toBe(c2);
		});

		it("should produce different challenges for different inputs", async () => {
			const c1 = await generateCodeChallenge("input-a");
			const c2 = await generateCodeChallenge("input-b");
			expect(c1).not.toBe(c2);
		});
	});

	describe("generatePKCE", () => {
		it("should return both verifier and challenge", async () => {
			const pkce = await generatePKCE();
			expect(pkce.codeVerifier).toBeTruthy();
			expect(pkce.codeChallenge).toBeTruthy();
		});

		it("should have verifier of length 43", async () => {
			const pkce = await generatePKCE();
			expect(pkce.codeVerifier.length).toBe(43);
		});

		it("challenge should match SHA256 of verifier", async () => {
			const pkce = await generatePKCE();
			const expectedChallenge = await generateCodeChallenge(pkce.codeVerifier);
			expect(pkce.codeChallenge).toBe(expectedChallenge);
		});
	});
});

// ─── State Management ───────────────────────────────────────────────────────────

describe("OAuth State Management", () => {
	const createResponse = (headers?: HeadersInit): Response => {
		return new Response(null, { status: 200, headers });
	};

	const createRequest = (cookies: Record<string, string>): Request => {
		const cookieHeader = Object.entries(cookies)
			.map(([k, v]) => `${k}=${v}`)
			.join("; ");
		return new Request("http://localhost/callback", {
			headers: { Cookie: cookieHeader },
		});
	};

	describe("storeOAuthState", () => {
		it("should set state and verifier cookies", () => {
			const res = storeOAuthState(createResponse(), "test-state", "test-verifier");
			const setCookie = res.headers.getSetCookie();
			expect(setCookie.some((c) => c.includes("__buntok_oauth_state=test-state"))).toBe(true);
			expect(setCookie.some((c) => c.includes("__buntok_oauth_verifier=test-verifier"))).toBe(true);
		});

		it("should set cookies as HttpOnly and Secure", () => {
			const res = storeOAuthState(createResponse(), "state", "verifier");
			const setCookie = res.headers.getSetCookie();
			for (const cookie of setCookie) {
				expect(cookie).toContain("HttpOnly");
				expect(cookie).toContain("Secure");
				expect(cookie).toContain("SameSite=Lax");
			}
		});
	});

	describe("verifyOAuthState", () => {
		it("should return true when state matches", () => {
			const req = createRequest({ __buntok_oauth_state: "correct-state" });
			expect(verifyOAuthState(req, "correct-state")).toBe(true);
		});

		it("should return false when state does not match", () => {
			const req = createRequest({ __buntok_oauth_state: "wrong-state" });
			expect(verifyOAuthState(req, "correct-state")).toBe(false);
		});

		it("should return false when cookie is missing", () => {
			const req = createRequest({});
			expect(verifyOAuthState(req, "any-state")).toBe(false);
		});
	});

	describe("getCodeVerifier", () => {
		it("should return the verifier from cookie", () => {
			const req = createRequest({ __buntok_oauth_verifier: "my-verifier" });
			expect(getCodeVerifier(req)).toBe("my-verifier");
		});

		it("should return undefined when cookie is missing", () => {
			const req = createRequest({});
			expect(getCodeVerifier(req)).toBeUndefined();
		});
	});

	describe("clearOAuthCookies", () => {
		it("should clear both cookies", () => {
			const res = clearOAuthCookies(createResponse());
			const setCookie = res.headers.getSetCookie();
			expect(setCookie.some((c) => c.includes("__buntok_oauth_state"))).toBe(true);
			expect(setCookie.some((c) => c.includes("__buntok_oauth_verifier"))).toBe(true);
			for (const cookie of setCookie) {
				expect(cookie).toContain("Max-Age=0");
			}
		});
	});
});

// ─── Helpers ────────────────────────────────────────────────────────────────────

describe("OAuth Helpers", () => {
	describe("createOAuth2AuthorizationURL", () => {
		it("should build a basic authorization URL", () => {
			const url = createOAuth2AuthorizationURL("https://provider.com/auth", {
				clientId: "my-client",
				redirectURI: "http://localhost/callback",
				state: "random-state",
			});

			expect(url).toContain("response_type=code");
			expect(url).toContain("client_id=my-client");
			expect(url).toContain("redirect_uri=http%3A%2F%2Flocalhost%2Fcallback");
			expect(url).toContain("state=random-state");
		});

		it("should include scopes when provided", () => {
			const url = createOAuth2AuthorizationURL("https://provider.com/auth", {
				clientId: "id",
				redirectURI: "http://localhost/cb",
				state: "s",
				scopes: ["openid", "email", "profile"],
			});

			expect(url).toContain("scope=openid+email+profile");
		});

		it("should include PKCE parameters when provided", () => {
			const url = createOAuth2AuthorizationURL("https://provider.com/auth", {
				clientId: "id",
				redirectURI: "http://localhost/cb",
				state: "s",
				codeChallenge: "test-challenge",
			});

			expect(url).toContain("code_challenge=test-challenge");
			expect(url).toContain("code_challenge_method=S256");
		});

		it("should include additional params when provided", () => {
			const url = createOAuth2AuthorizationURL("https://provider.com/auth", {
				clientId: "id",
				redirectURI: "http://localhost/cb",
				state: "s",
				additionalParams: { prompt: "consent", access_type: "offline" },
			});

			expect(url).toContain("prompt=consent");
			expect(url).toContain("access_type=offline");
		});
	});

	describe("decodeIdToken", () => {
		it("should decode a valid JWT payload", () => {
			const payload = { sub: "123", name: "Test User", email: "test@example.com" };
			const header = btoa(JSON.stringify({ alg: "RS256", typ: "JWT" }));
			const body = btoa(JSON.stringify(payload));
			const token = `${header}.${body}.signature`;

			const decoded = decodeIdToken(token);
			expect(decoded.sub).toBe("123");
			expect(decoded.name).toBe("Test User");
			expect(decoded.email).toBe("test@example.com");
		});

		it("should throw for invalid token format", () => {
			expect(() => decodeIdToken("only.two")).toThrow("Invalid ID token format");
		});

		it("should handle base64url-encoded characters", () => {
			const payload = { test: "value+with/special=chars" };
			const header = btoa(JSON.stringify({ alg: "RS256" }));
			// Manually create base64url encoding
			const body = btoa(JSON.stringify(payload))
				.replace(/\+/g, "-")
				.replace(/\//g, "_");
			const token = `${header}.${body}.sig`;

			const decoded = decodeIdToken(token);
			expect(decoded.test).toBe("value+with/special=chars");
		});
	});
});

// ─── Error Classes ──────────────────────────────────────────────────────────────

describe("OAuth Error Classes", () => {
	it("OAuthError should have code and provider", () => {
		const err = new OAuthError("test", "TEST_CODE", "google");
		expect(err.message).toBe("test");
		expect(err.code).toBe("TEST_CODE");
		expect(err.provider).toBe("google");
		expect(err.name).toBe("OAuthError");
		expect(err).toBeInstanceOf(Error);
	});

	it("OAuthStateError should have STATE_MISMATCH code", () => {
		const err = new OAuthStateError("github");
		expect(err.code).toBe("STATE_MISMATCH");
		expect(err.provider).toBe("github");
		expect(err.name).toBe("OAuthStateError");
		expect(err.message).toContain("CSRF");
	});

	it("OAuthTokenError should have TOKEN_ERROR code", () => {
		const err = new OAuthTokenError("token expired", "apple");
		expect(err.code).toBe("TOKEN_ERROR");
		expect(err.provider).toBe("apple");
		expect(err.name).toBe("OAuthTokenError");
	});

	it("OAuthProviderError should have provider error details", () => {
		const err = new OAuthProviderError(
			"Token exchange failed",
			"google",
			"invalid_grant",
			"Code expired",
		);
		expect(err.code).toBe("PROVIDER_ERROR");
		expect(err.providerError).toBe("invalid_grant");
		expect(err.providerErrorDescription).toBe("Code expired");
		expect(err.name).toBe("OAuthProviderError");
	});
});
