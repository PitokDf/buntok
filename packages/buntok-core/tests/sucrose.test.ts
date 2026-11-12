import { describe, it, expect } from "bun:test";
import { analyzeHandler, normalizeFunctionSource } from "../src/aot/sucrose";

// NOTE: test functions are intentionally NOT named "handler" - the source
// containing a literal "handler(" triggers analyzeHandler's conservative
// all-true fallback, which would mask the detection logic under test.

describe("analyzeHandler (sucrose)", () => {
	it("keeps fast path for endpoints that never mention ctx", () => {
		const endpoint = () => ({ ok: true });
		const analysis = analyzeHandler(endpoint);
		expect(analysis.needsFullContext).toBe(false);
	});

	it("detects ctx.success usage", () => {
		function endpoint(ctx: any) {
			return ctx.success({ ok: true });
		}
		expect(analyzeHandler(endpoint).needsFullContext).toBe(true);
	});

	it("detects ctx.json usage", () => {
		function endpoint(ctx: any) {
			return ctx.json({ ok: true });
		}
		expect(analyzeHandler(endpoint).needsFullContext).toBe(true);
	});

	it("detects ctx passed as argument (delegation pattern)", () => {
		function helper(ctx: any, data: unknown) {
			return ctx.success(data);
		}
		function endpoint(ctx: any) {
			return helper(ctx, { ok: true });
		}
		expect(analyzeHandler(endpoint).needsFullContext).toBe(true);
	});

	it("detects ctx.cursorPaginate usage (not in literal list)", () => {
		function endpoint(ctx: any) {
			return ctx.cursorPaginate([1, 2, 3], "cursor-1");
		}
		expect(analyzeHandler(endpoint).needsFullContext).toBe(true);
	});

	it("detects ctx.paginate usage (not in literal list)", () => {
		function endpoint(ctx: any) {
			return ctx.paginate([1, 2], 25, 1, 10);
		}
		expect(analyzeHandler(endpoint).needsFullContext).toBe(true);
	});

	it("detects method source where ctx is the receiver only in signature", () => {
		const controller = {
			list(ctx: any) {
				return this.respond(ctx);
			},
			respond(ctx: any) {
				return ctx.success({});
			},
		};
		expect(analyzeHandler(controller.list).needsFullContext).toBe(true);
	});

	it("uses _sucroseTarget when wrapper hides the real source", () => {
		function real(ctx: any) {
			return ctx.success({});
		}
		const wrapper = (...args: any[]) => real(...args);
		(wrapper as any)._sucroseTarget = real;
		expect(analyzeHandler(wrapper as any).needsFullContext).toBe(true);
	});

	it("wrapper without _sucroseTarget stays on fast path if no ctx usage", () => {
		const wrapper = (..._args: any[]) => 42;
		expect(analyzeHandler(wrapper as any).needsFullContext).toBe(false);
	});

	it("destructured params force full context", () => {
		const endpoint = ({ params }: any) => ({ id: params.id });
		const analysis = analyzeHandler(endpoint);
		expect(analysis.needsFullContext).toBe(true);
		expect(analysis.needsParams).toBe(true);
	});

	it("detects ctx.params usage", () => {
		function endpoint(ctx: any) {
			return { id: ctx.params.id };
		}
		const analysis = analyzeHandler(endpoint);
		expect(analysis.needsFullContext).toBe(true);
		expect(analysis.needsParams).toBe(true);
	});

	it("returns conservative defaults for tiny/native sources", () => {
		const endpoint = () => 1;
		const analysis = analyzeHandler(endpoint);
		expect(analysis.needsFullContext).toBe(true);
	});

	it("detects ctx.set usage (mutable response headers)", () => {
		function endpoint(ctx: any) {
			ctx.set.headers["x-a"] = "1";
			return "ok";
		}
		expect(analyzeHandler(endpoint).needsFullContext).toBe(true);
	});

	it("detects set.headers on aliased param (c.set.headers)", () => {
		function endpoint(c: any) {
			c.set.headers["x-a"] = "1";
			return "ok";
		}
		expect(analyzeHandler(endpoint).needsFullContext).toBe(true);
	});

	it("detects destructured set param", () => {
		const endpoint = ({ set }: any) => {
			set.headers["x-a"] = "1";
			return "ok";
		};
		expect(analyzeHandler(endpoint).needsFullContext).toBe(true);
	});
});

describe("normalizeFunctionSource", () => {
	it("strips Bun 1.4.4+ decorator wrapper from method source", () => {
		const source = `[(_dec$3 = [
    Get("/lit")
  ], "lit")]() {
    return "Hi";
  }`;
		expect(normalizeFunctionSource(source)).toBe(`() {
    return "Hi";
  }`);
	});

	it("leaves ordinary functions untouched", () => {
		const source = `function endpoint(ctx) { return ctx.text("Hi"); }`;
		expect(normalizeFunctionSource(source)).toBe(source);
	});

	it("leaves computed methods that are not decorator wrappers untouched", () => {
		const source = `["not-a-decorator"]() { return "Hi"; }`;
		expect(normalizeFunctionSource(source)).toBe(source);
	});
});
