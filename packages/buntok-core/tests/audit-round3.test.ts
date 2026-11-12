import { afterEach, describe, expect, it } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { Buntok } from "../src/buntok";
import { slidingWindowRateLimiter } from "../src/middlewares/rate-limiter";
import { getClientIP } from "../src/helpers/network";
import { StripeDriver } from "../src/payment/drivers/stripe";
import { XenditDriver } from "../src/payment/drivers/xendit";
import { MidtransDriver } from "../src/payment/drivers/midtrans";
import { PayPalDriver } from "../src/payment/drivers/paypal";

function tempDir(): string {
	return mkdtempSync(join(tmpdir(), "buntok-audit-"));
}

const origFetch = globalThis.fetch;
afterEach(() => {
	globalThis.fetch = origFetch;
});

async function hmacSha256(message: string, secret: string): Promise<string> {
	const encoder = new TextEncoder();
	const key = await crypto.subtle.importKey(
		"raw",
		encoder.encode(secret),
		{ name: "HMAC", hash: "SHA-256" },
		false,
		["sign"],
	);
	const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(message));
	return Array.from(new Uint8Array(sig))
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("");
}

describe("BT-023: ctx.ip via server.requestIP", () => {
	it("returns the real peer IP instead of 'unknown' when listening", async () => {
		const app = new Buntok({ handleSignals: false });
		app.get("/ip", (c) => c.json({ ip: c.ip }));
		app.listen(0);
		try {
			const port = app.server?.port;
			expect(port).toBeDefined();
			const res = await fetch(`http://localhost:${port}/ip`);
			const body = (await res.json()) as { ip: string };
			expect(body.ip).not.toBe("unknown");
		} finally {
			app.server?.stop();
		}
	});

	it("returns 'unknown' when there is no server (app.request path)", async () => {
		const app = new Buntok({ handleSignals: false });
		app.get("/ip", (c) => c.json({ ip: c.ip }));
		const res = await app.request("/ip");
		const body = (await res.json()) as { ip: string };
		expect(body.ip).toBe("unknown");
	});
});

describe("BT-024: getClientIP trusted-proxy depth semantics", () => {
	it("trusts the last XFF entry when a trusted peer is set (no depth)", () => {
		const ip = getClientIP(
			new Request("http://x/", {
				headers: { "x-forwarded-for": "6.6.6.6, 203.0.113.9" },
			}),
			{ addresses: ["10.0.0.1"] },
			{ requestIP: () => "10.0.0.1" },
		);
		expect(ip).toBe("203.0.113.9");
	});

	it("depth: 1 reads the last XFF entry", () => {
		const ip = getClientIP(
			new Request("http://x/", {
				headers: { "x-forwarded-for": "6.6.6.6, 203.0.113.9" },
			}),
			{ depth: 1 },
			{ requestIP: () => "1.2.3.4" },
		);
		expect(ip).toBe("203.0.113.9");
	});

	it("depth: 2 reads the second-to-last XFF entry", () => {
		const ip = getClientIP(
			new Request("http://x/", {
				headers: {
					"x-forwarded-for": "6.6.6.6, 203.0.113.9, 10.9.9.9",
				},
			}),
			{ depth: 2 },
			{ requestIP: () => "1.2.3.4" },
		);
		expect(ip).toBe("203.0.113.9");
	});

	it("does not trust XFF from an untrusted peer", () => {
		const ip = getClientIP(
			new Request("http://x/", {
				headers: { "x-forwarded-for": "6.6.6.6" },
			}),
			undefined,
			{ requestIP: () => "1.2.3.4" },
		);
		expect(ip).toBe("1.2.3.4");
	});
});

describe("BT-025: slidingWindowRateLimiter keys on ctx.ip", () => {
	it("shares one bucket per peer IP even with different XFF values", async () => {
		const app = new Buntok({ handleSignals: false });
		app.get("/", slidingWindowRateLimiter({ max: 2 }), () => "ok");
		app.listen(0);
		try {
			const port = app.server?.port;
			const base = `http://localhost:${port}`;
			const r1 = await fetch(base, {
				headers: { "x-forwarded-for": "1.1.1.1" },
			});
			const r2 = await fetch(base, {
				headers: { "x-forwarded-for": "1.1.1.2" },
			});
			const r3 = await fetch(base, {
				headers: { "x-forwarded-for": "1.1.1.3" },
			});
			expect(r1.status).toBe(200);
			expect(r2.status).toBe(200);
			expect(r3.status).toBe(429);
		} finally {
			app.server?.stop();
		}
	});
});

describe("reportB #4: AOT codegen path escaping", () => {
	it("registers and serves routes containing quotes and backslashes without crashing codegen", async () => {
		const app = new Buntok({ handleSignals: false });
		app.get('/x"y', () => "quote-ok");
		app.get("/a\\b", () => "backslash-ok");
		// Before the fix, `listen()` crashed with a SyntaxError compiling the
		// route path into the AOT `case` label. Registering and listening must
		// not throw.
		app.listen(0);
		try {
			const port = app.server?.port;
			const base = `http://localhost:${port}`;
			// Clients percent-encode special characters, and Buntok matches on
			// the raw pathname, so these paths are not reachable over HTTP -
			// the important guarantee is that they no longer crash boot.
			const r1 = await fetch(`${base}/x%22y`);
			expect(r1.status).not.toBe(500);
			const r2 = await fetch(`${base}/a%5Cb`);
			expect(r2.status).not.toBe(500);
		} finally {
			app.server?.stop();
		}
	});
});

describe("BT-027: static dotfiles are blocked by default", () => {
	it("refuses dotfiles and dot-directories", async () => {
		const dir = tempDir();
		try {
			writeFileSync(join(dir, ".env"), "SECRET=1");
			mkdirSync(join(dir, ".git"), { recursive: true });
			writeFileSync(join(dir, ".git", "config"), "git-config");
			writeFileSync(join(dir, "open.txt"), "public");

			const app = new Buntok({ handleSignals: false });
			app.static("/files", dir);
			app.listen(0);
			try {
				const port = app.server?.port;
				const base = `http://localhost:${port}`;
				const dotenv = await fetch(`${base}/files/.env`);
				expect(dotenv.status).toBe(403);
				const git = await fetch(`${base}/files/.git/config`);
				expect(git.status).toBe(403);
				const trav = await fetch(`${base}/files/../.env`);
				expect([403, 404]).toContain(trav.status);
				expect(await trav.text()).not.toContain("SECRET");
				const open = await fetch(`${base}/files/open.txt`);
				expect(open.status).toBe(200);
				expect(await open.text()).toBe("public");
			} finally {
				app.server?.stop();
			}
		} finally {
			rmSync(dir, { recursive: true, force: true });
		}
	});

	it("serves dotfiles when dotfiles: 'allow'", async () => {
		const dir = tempDir();
		try {
			writeFileSync(join(dir, ".env"), "SECRET=1");
			const app = new Buntok({ handleSignals: false });
			app.static("/pub", dir, { dotfiles: "allow" });
			app.listen(0);
			try {
				const port = app.server?.port;
				const res = await fetch(`http://localhost:${port}/pub/.env`);
				expect(res.status).toBe(200);
				expect(await res.text()).toBe("SECRET=1");
			} finally {
				app.server?.stop();
			}
		} finally {
			rmSync(dir, { recursive: true, force: true });
		}
	});
});

describe("BT-026: analyzeHandler falls back to full context for alias delegation", () => {
	it("passes a real Context when the handler forwards its parameter to another function", async () => {
		const app = new Buntok({ handleSignals: false });
		const h = (x: any) => ({ q: x.query });
		app.get("/a4", (c) => h(c));
		app.listen(0);
		try {
			const port = app.server?.port;
			const res = await fetch(`http://localhost:${port}/a4?z=1`);
			expect(await res.json()).toEqual({ q: { z: "1" } });
		} finally {
			app.server?.stop();
		}
	});
});

describe("payment webhook verification (reportB #2)", () => {
	it("Stripe accepts any valid v1 during rotation and rejects bad signatures", async () => {
		const stripe = new StripeDriver({
			secretKey: "sk_test",
			webhookSecret: "whsec_test",
		});
		const payload = JSON.stringify({ type: "payment_intent.succeeded" });
		const timestamp = Math.floor(Date.now() / 1000);
		const good = await hmacSha256(`${timestamp}.${payload}`, "whsec_test");

		expect(
			await stripe.verifyWebhookSignature(
				payload,
				`t=${timestamp},v1=bad,v1=${good}`,
				"whsec_test",
			),
		).toBe(true);
		expect(
			await stripe.verifyWebhookSignature(
				payload,
				`t=${timestamp},v1=bad`,
				"whsec_test",
			),
		).toBe(false);
		expect(
			await stripe.verifyWebhookSignature(
				payload,
				`t=${timestamp},v1=${good}`,
				"wrong",
			),
		).toBe(false);
	});

	it("Xendit compares the callback token in constant time", async () => {
		const xendit = new XenditDriver({ secretKey: "xnd_test" });
		const payload = JSON.stringify({ id: "inv_1" });
		expect(
			await xendit.verifyWebhookSignature(
				payload,
				"callback-token",
				"callback-token",
			),
		).toBe(true);
		expect(
			await xendit.verifyWebhookSignature(
				payload,
				"wrong-token",
				"callback-token",
			),
		).toBe(false);
	});

	it("Midtrans verifies SHA-512 signatures in constant time", async () => {
		const serverKey = "server-key-123";
		const mid = new MidtransDriver({ serverKey });
		const body = {
			order_id: "ord-1",
			status_code: "200",
			gross_amount: "10000.00",
		};
		const raw = `${body.order_id}${body.status_code}${body.gross_amount}${serverKey}`;
		const encoder = new TextEncoder();
		const hash = await crypto.subtle.digest("SHA-512", encoder.encode(raw));
		const signature = Array.from(new Uint8Array(hash))
			.map((b) => b.toString(16).padStart(2, "0"))
			.join("");

		expect(
			await mid.verifyWebhookSignature(
				JSON.stringify({ ...body, signature_key: signature }),
				"x-signature",
				serverKey,
			),
		).toBe(true);
		expect(
			await mid.verifyWebhookSignature(
				JSON.stringify({ ...body, signature_key: "tampered" }),
				"x-signature",
				serverKey,
			),
		).toBe(false);
	});

	it("Midtrans rejects an empty server key", () => {
		expect(() => new MidtransDriver({ serverKey: "" })).toThrow();
	});

	it("PayPal verifies via API and fails closed", async () => {
		let verificationStatus = "SUCCESS";
		let fetchError = false;
		globalThis.fetch = async (input: RequestInfo | URL) => {
			const url = String(input);
			if (url.includes("/v1/oauth2/token")) {
				return new Response(
					JSON.stringify({ access_token: "tok", expires_in: 3600 }),
					{ status: 200 },
				);
			}
			if (fetchError) throw new Error("down");
			return new Response(
				JSON.stringify({ verification_status: verificationStatus }),
				{ status: 200 },
			);
		};

		const pp = new PayPalDriver({
			clientId: "id",
			clientSecret: "secret",
			webhookId: "wh_123",
		});
		expect(await pp.verifyWebhookSignature("{}", "sig", "wh_123")).toBe(true);

		verificationStatus = "FAILURE";
		expect(await pp.verifyWebhookSignature("{}", "sig", "wh_123")).toBe(false);

		fetchError = true;
		expect(await pp.verifyWebhookSignature("{}", "sig", "wh_123")).toBe(false);

		expect(await pp.verifyWebhookSignature("{not json", "sig", "wh_123")).toBe(
			false,
		);

		expect(
			await new PayPalDriver({ clientId: "id", clientSecret: "secret" }).verifyWebhookSignature(
				"{}",
				"sig",
				"",
			),
		).toBe(false);
	});
});
