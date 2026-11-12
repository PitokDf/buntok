import { describe, it, expect } from "bun:test";
import {
	parseCookies,
	serializeCookie,
	setCookie,
	deleteCookie,
} from "../../src/helpers/cookie";

describe("parseCookies", () => {
	it("should parse single cookie", () => {
		expect(parseCookies("name=value")).toEqual({ name: "value" });
	});

	it("should parse multiple cookies", () => {
		expect(parseCookies("a=1; b=2; c=3")).toEqual({ a: "1", b: "2", c: "3" });
	});

	it("should handle empty string", () => {
		expect(parseCookies("")).toEqual({});
	});

	it("should handle URL-encoded values", () => {
		expect(parseCookies("name=hello%20world")).toEqual({
			name: "hello world",
		});
	});

	it("should handle values with equals signs", () => {
		expect(parseCookies("token=abc=def")).toEqual({ token: "abc=def" });
	});
});

describe("serializeCookie", () => {
	it("should serialize basic cookie", () => {
		const result = serializeCookie("name", "value");
		expect(result).toBe("name=value; Path=/; SameSite=Lax");
	});

	it("should include Max-Age", () => {
		const result = serializeCookie("name", "value", { maxAge: 3600 });
		expect(result).toContain("Max-Age=3600");
	});

	it("should include Secure flag", () => {
		const result = serializeCookie("name", "value", { secure: true });
		expect(result).toContain("; Secure");
	});

	it("should include HttpOnly flag", () => {
		const result = serializeCookie("name", "value", { httpOnly: true });
		expect(result).toContain("; HttpOnly");
	});

	it("should include SameSite", () => {
		const result = serializeCookie("name", "value", { sameSite: "strict" });
		expect(result).toContain("SameSite=Strict");
	});

	it("should include Domain", () => {
		const result = serializeCookie("name", "value", { domain: "example.com" });
		expect(result).toContain("Domain=example.com");
	});

	it("should include custom Path", () => {
		const result = serializeCookie("name", "value", { path: "/api" });
		expect(result).toContain("Path=/api");
	});

	it("should include Partitioned flag", () => {
		const result = serializeCookie("name", "value", { partitioned: true });
		expect(result).toContain("; Partitioned");
	});

	it("should default SameSite to Lax", () => {
		const result = serializeCookie("name", "value");
		expect(result).toContain("SameSite=Lax");
	});

	it("should require Secure when SameSite=None", () => {
		expect(() =>
			serializeCookie("name", "value", { sameSite: "none" }),
		).toThrow(/Secure/);
		expect(
			serializeCookie("name", "value", { sameSite: "none", secure: true }),
		).toContain("SameSite=None");
		expect(
			serializeCookie("name", "value", { sameSite: "none", secure: true }),
		).toContain("; Secure");
	});

	it("should reject invalid cookie names", () => {
		expect(() => serializeCookie("bad;name", "value")).toThrow(/name/);
		expect(() => serializeCookie("bad=name", "value")).toThrow(/name/);
		expect(() => serializeCookie("bad name", "value")).toThrow(/name/);
	});

	it("should reject invalid path and domain", () => {
		expect(() =>
			serializeCookie("name", "value", { path: "/api;evil" }),
		).toThrow(/path/);
		expect(() =>
			serializeCookie("name", "value", { domain: "evil.com;x" }),
		).toThrow(/domain/);
	});
});

describe("setCookie", () => {
	it("should add Set-Cookie header to response", () => {
		const original = new Response("ok");
		const result = setCookie(original, "session", "abc123");
		expect(result.headers.get("Set-Cookie")).toContain("session=abc123");
	});

	it("should preserve existing headers", () => {
		const original = new Response("ok", {
			headers: { "X-Custom": "test" },
		});
		const result = setCookie(original, "session", "abc123");
		expect(result.headers.get("X-Custom")).toBe("test");
	});
});

describe("deleteCookie", () => {
	it("should set cookie with maxAge=0", () => {
		const original = new Response("ok");
		const result = deleteCookie(original, "session");
		const cookie = result.headers.get("Set-Cookie");
		expect(cookie).toContain("session=");
		expect(cookie).toContain("Max-Age=0");
	});
});
