import { describe, expect, it } from "bun:test";
import { Buntok } from "../src/buntok";
import { requestId } from "../src/middlewares/request-id";

describe("trusted proxy", () => {
	it("ignores forwarding headers by default", async () => {
		const app = new Buntok({ handleSignals: false });
		app.get("/ip", (ctx) => ctx.ip);

		const response = await app.request("/ip", {
			headers: { "x-forwarded-for": "198.51.100.10" },
		});
		expect(await response.text()).toBe("unknown");
	});

	it("uses forwarded client IP when proxy depth is configured", async () => {
		const app = new Buntok({ handleSignals: false });
		app.setTrustedProxy({ depth: 1 });
		app.get("/ip", (ctx) => ctx.ip);

		const response = await app.request("/ip", {
			headers: { "x-forwarded-for": "198.51.100.10, 10.0.0.2" },
		});
		expect(await response.text()).toBe("198.51.100.10");
	});

	it("correlates the request ID through the Buntok pipeline", async () => {
		const app = new Buntok({ handleSignals: false });
		app.use(requestId({ generator: () => "correlation-123" }));
		app.get("/status", (ctx) => ctx.store.requestId as string);

		const response = await app.request("/status");
		expect(response.headers.get("x-request-id")).toBe("correlation-123");
		expect(await response.text()).toBe("correlation-123");
	});
});