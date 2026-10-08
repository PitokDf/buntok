/**
 * Sucrose-style static code analysis for handler optimization.
 *
 * Analyzes handler function source code at boot time to determine which
 * context properties are actually used, then generates optimized handlers
 * that only parse/query/validate the properties that are needed.
 *
 * This eliminates unnecessary work per request - if a handler doesn't use
 * `ctx.body`, we skip body parsing entirely.
 */

export interface HandlerAnalysis {
	/** Whether handler uses ctx.body() or ctx.request (requires body parsing) */
	needsBody: boolean;
	/** Whether handler uses ctx.query (requires query parsing) */
	needsQuery: boolean;
	/** Whether handler uses ctx.params (requires params) */
	needsParams: boolean;
	/** Whether handler uses ctx.valid() (requires validation) */
	needsValidation: boolean;
	/** Whether handler uses ctx.formData() (requires FormData parsing) */
	needsFormData: boolean;
	/** Whether handler uses ctx.request.text() (requires text parsing) */
	needsText: boolean;
	/** Whether handler uses ctx.request.arrayBuffer() (requires binary parsing) */
	needsBinary: boolean;
	/** Whether handler uses Context methods that require full Context instance */
	needsFullContext: boolean;
	/**
	 * Whether the handler (or anything it delegates the ctx to) may write
	 * `ctx.set.headers`. Response tails skip the `applyCtxHeaders` merge when
	 * false - no source means nothing to merge. Conservative on bare `ctx`
	 * delegation: a callee may set headers on the ctx it receives.
	 */
	needsSetHeaders: boolean;
}

/**
 * Analyze a handler function to determine which context properties it uses.
 * Uses string analysis on the function source (like Elysia's Sucrose).
 *
 * @example
 * ```ts
 * const handler = (ctx) => {
 *   const data = ctx.valid("body", schema);
 *   return ctx.json(data);
 * };
 *
 * const analysis = analyzeHandler(handler);
 * // { needsBody: true, needsQuery: false, needsParams: false, needsValidation: true, ... }
 * ```
 */
export function analyzeHandler(
	handler: (...args: any[]) => any,
): HandlerAnalysis {
	// Default: assume all properties are needed (conservative)
	const analysis: HandlerAnalysis = {
		needsBody: true,
		needsQuery: true,
		needsParams: true,
		needsValidation: true,
		needsFormData: true,
		needsText: true,
		needsBinary: true,
		needsFullContext: true,
		needsSetHeaders: true,
	};

	try {
		// Use _sucroseTarget if available (closure wrappers hide toString)
		const target = (handler as any)._sucroseTarget ?? handler;
		// Get function source code
		const source = target.toString();

		// Quick check: if source is too short or is a native function, return defaults
		if (source.length < 10 || source.includes("[native code]")) {
			return analysis;
		}

		// If handler uses destructuring in params (e.g. `handler({ params })`),
		// we can't safely skip Context - the destructured props come from ctx
		const hasDestructuredParams = /\(\s*\{[^}]*\b(params|query|body|valid|request|headers|store|cookies|ip|set)\b/.test(source) ||
			/function\s*\w*\s*\(\s*\{[^}]+\}/.test(source) ||
			/\)\s*=>\s*\{[^}]*\bparams\b/.test(source);

		if (hasDestructuredParams) {
			// Whether the handler may write `ctx.set.headers`. Deliberately
			// narrower than the bare-`ctx` full-context check below: a `ctx`
			// *parameter* is not delegation - only ctx passed as a call
			// argument (or stored) can hide a set from this source scan.
			const usesSet =
				source.includes("set.headers") ||
				source.includes("onAfterResponse") ||
				/\bctx\.set\b/.test(source) ||
				/\w+\(\s*ctx\s*[,)]/.test(source) ||
				/(^|[^\w$.])ctx\s*[;,]/.test(source);
			// Destructured ctx props - detect WHICH props are destructured
			const destrMatch = source.match(/\(\s*\{([^}]+)\}/);
			if (destrMatch) {
				const destrProps = destrMatch[1];
				analysis.needsBody = /body|request|raw|arrayBuffer/.test(destrProps);
				analysis.needsQuery = /query/.test(destrProps);
				analysis.needsParams = /params/.test(destrProps);
				analysis.needsValidation = /valid/.test(destrProps);
				analysis.needsFormData = /formData/.test(destrProps);
				analysis.needsText = /request\.text/.test(destrProps);
				analysis.needsBinary = /request\.arrayBuffer/.test(destrProps);
				analysis.needsSetHeaders = usesSet || /\bset\b/.test(destrProps);
			}
			return analysis;
		}

		// Analyze which properties are accessed
		analysis.needsBody =
			source.includes("ctx.body") ||
			source.includes("ctx.request") ||
			source.includes("ctx.raw") ||
			source.includes(".body(") ||
			source.includes(".arrayBuffer(");

		analysis.needsQuery =
			source.includes("ctx.query") ||
			source.includes(".query(");

		analysis.needsParams =
			source.includes("ctx.params") ||
			source.includes(".params(");

		analysis.needsValidation =
			source.includes("ctx.valid") ||
			source.includes(".valid(");

		analysis.needsFormData =
			source.includes("ctx.formData") ||
			source.includes(".formData(");

		analysis.needsText =
			source.includes("ctx.request.text()") ||
			source.includes(".text(");

		analysis.needsBinary =
			source.includes("ctx.request.arrayBuffer()") ||
			source.includes(".arrayBuffer(");

		// Detect any bare `ctx` identifier usage. This catches delegation
		// patterns where ctx is passed to another function (e.g. `this.ok(ctx, data)`)
		// - the literal ctx.* property checks above would miss them.
		const usesBareCtx = /(^|[^\w$.])ctx(?![\w])/.test(source);

		// Whether the handler may write `ctx.set.headers` (Elysia-style mutable
		// response headers) - kept narrower than the bare-`ctx` full-context
		// check: a `ctx` parameter alone proves nothing about set usage; only
		// ctx passed into another function (or stored) can hide a set from
		// this source scan, and those stay conservative.
		analysis.needsSetHeaders =
			source.includes("set.headers") ||
			source.includes("onAfterResponse") ||
			/\bctx\.set\b/.test(source) ||
			/\w+\(\s*ctx\s*[,)]/.test(source) ||
			/(^|[^\w$.])ctx\s*[;,]/.test(source);

		// Detect Context methods that require full Context instance
		analysis.needsFullContext =
			analysis.needsBody ||
			analysis.needsQuery ||
			analysis.needsParams ||
			analysis.needsValidation ||
			analysis.needsFormData ||
			analysis.needsText ||
			analysis.needsBinary ||
			usesBareCtx ||
			source.includes("ctx.getCookie") ||
			source.includes("ctx.getCookies") ||
			source.includes("ctx.cookies") ||
			source.includes("ctx.json") ||
			source.includes("ctx.success") ||
			source.includes("ctx.error") ||
			source.includes("ctx.created") ||
			source.includes("ctx.noContent") ||
			source.includes("ctx.status") ||
			source.includes("ctx.headers") ||
			source.includes("ctx.store") ||
			source.includes("ctx.ip") ||
			source.includes("ctx.request.headers") ||
			// ctx.set / c.set.headers - mutable response headers (Elysia-style).
			// `set.headers` also covers aliased params (`(c) => c.set.headers`)
			// where the bare `ctx` detection above doesn't apply.
			source.includes("set.headers") ||
			source.includes("onAfterResponse") ||
			/\bctx\.set\b/.test(source) ||
			source.includes(".getCookie(") ||
			source.includes(".getCookies(") ||
			source.includes(".json(") ||
			source.includes(".success(") ||
			source.includes(".error(") ||
			source.includes(".created(") ||
			source.includes(".noContent(");

		// If handler is passed to another function, conservatively assume all properties needed
		if (
			source.includes("handler(") ||
			source.includes("fn(") ||
			source.includes("next()")
		) {
			return {
				needsBody: true,
				needsQuery: true,
				needsParams: true,
				needsValidation: true,
				needsFormData: true,
				needsText: true,
				needsBinary: true,
				needsFullContext: true,
				needsSetHeaders: true,
			};
		}
	} catch {
		// If analysis fails, return conservative defaults
	}

	return analysis;
}

/**
 * Analyze a middleware chain to determine which context properties are needed.
 * Combines analysis of all handlers in the chain.
 *
 * @example
 * ```ts
 * const middlewares = [authMiddleware, validatorMiddleware, handler];
 * const analysis = analyzeHandlerChain(middlewares);
 * // Combined analysis of all handlers
 * ```
 */
export function analyzeHandlerChain(
	handlers: ((...args: any[]) => any)[],
): HandlerAnalysis {
	const combined: HandlerAnalysis = {
		needsBody: false,
		needsQuery: false,
		needsParams: false,
		needsValidation: false,
		needsFormData: false,
		needsText: false,
		needsBinary: false,
		needsFullContext: false,
		needsSetHeaders: false,
	};

	for (const handler of handlers) {
		const analysis = analyzeHandler(handler);
		combined.needsBody = combined.needsBody || analysis.needsBody;
		combined.needsQuery = combined.needsQuery || analysis.needsQuery;
		combined.needsParams = combined.needsParams || analysis.needsParams;
		combined.needsValidation =
			combined.needsValidation || analysis.needsValidation;
		combined.needsFormData =
			combined.needsFormData || analysis.needsFormData;
		combined.needsText = combined.needsText || analysis.needsText;
		combined.needsBinary = combined.needsBinary || analysis.needsBinary;
		combined.needsFullContext = combined.needsFullContext || analysis.needsFullContext;
		combined.needsSetHeaders = combined.needsSetHeaders || analysis.needsSetHeaders;
	}

	return combined;
}

/**
 * Constant response opcode - extracted from a handler whose body is exactly
 * one expression whose value does not depend on the request or any state:
 *
 * - `string`          - `return "lit";` / `() => "lit"`
 * - `text` / `html`   - `return ctx.text("lit"[, 201]);` (ctx.html similar)
 * - `json`            - `return ctx.json(<data-JSON-literal>[, 201]);`
 *                       - bare object/array literals: `return {…};` / `() => ({…})`
 * - `scalar`          - `return 42;` / `return true;` (text/plain, toResponse parity)
 * - `empty`           - `return null;` (204 No Content)
 *
 * Used by `registerRoute` to promote the route to native Bun.serve `routes`
 * (hot path without JS). All other forms (async, closure, template `${…}`,
 * dynamic arguments, response-decorator wrappers) produce `undefined` and
 * keep running on the JS path.
 */
export type ConstResponseOp =
	| { kind: "string"; body: string }
	| { kind: "text"; body: string; status: number }
	| { kind: "html"; body: string; status: number }
	| { kind: "json"; data: unknown; status: number }
	| { kind: "scalar"; body: string }
	| { kind: "empty" };

/**
 * Extract the constant response opcode from a handler. Conservative -
 * failure → `undefined` (JS path). Safe because accepted expressions are pure
 * literals: no side effects, no state reads.
 *
 * `_sucroseTarget` is honored (controller dispatch wrappers hide the original
 * toString); response-decorator wrappers (`_buntokResponseDecorated`) are
 * rejected because they must still be executed.
 */
export function extractConstResponseOp(
	handler: unknown,
): ConstResponseOp | undefined {
	if (typeof handler !== "function") return undefined;
	// Response-decorator wrappers (@HttpCode/@SetHeader/@Redirect) add
	// behavior - sucrose analysis may look at their _sucroseTarget, but not
	// for promotion (the wrapper must still be executed).
	if ((handler as any)._buntokResponseDecorated) return undefined;
	const target = (handler as any)._sucroseTarget ?? handler;
	if (typeof target !== "function") return undefined;
	let source: string;
	try {
		source = Function.prototype.toString.call(target);
	} catch {
		return undefined;
	}
	if (source.includes("[native code]")) return undefined;
	// Async returns a Promise - other forms (async arrow) are already
	// rejected by the regex; explicit guard for consistency.
	if (/^\s*async\b/.test(source)) return undefined;

	const expr = source.match(CONST_FN_BLOCK)?.[1] ??
		source.match(CONST_ARROW_EXPR)?.[1];
	if (expr === undefined) return undefined;
	return classifyConstExpr(expr, source);
}

/**
 * Function/method block with exactly one statement `return <expr>;` -
 * `handler(ctx) { return …; }`, `function () { return …; }`,
 * `() => { return …; }`. `return[ \t]*` (without a newline) guards against
 * ASI: `return\n"Hi"` returns undefined in JS, not the literal.
 */
const CONST_FN_BLOCK =
	/^\s*(?:function\s*)?(?:[A-Za-z_$][\w$]*\s*)?(?:\([^)]*\)|[A-Za-z_$][\w$]*)\s*(?:=>\s*)?\{\s*return[ \t]*([\s\S]*?)\s*;?\s*\}$/;
/** Arrow with an expression body: `(…) => <expr>`. */
const CONST_ARROW_EXPR =
	/^\s*(?:\([^)]*\)|[A-Za-z_$][\w$]*)\s*=>\s*([\s\S]*?)\s*$/;
/** String literal (no capture) for full-expression validation. */
const LITERAL_RE = /"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`/;

function classifyConstExpr(
	expr: string,
	source: string,
): ConstResponseOp | undefined {
	// Single string literal (no other operators)
	if (new RegExp(`^(?:${LITERAL_RE.source})$`).test(expr)) {
		const body = decodeStringLiteral(expr);
		return body !== undefined ? { kind: "string", body } : undefined;
	}

	const trimmed = expr.trim();
	// Arrow bodies may wrap the value in parens - `() => ({…})`, `() => (42)`.
	// Unwrap when they enclose the whole expression.
	const unparen = stripOuterParens(trimmed);

	// Bare scalar literal - mirrors toResponse exactly:
	// - number/boolean → text/plain; charset=utf-8 (`kind: "scalar"` keeps the
	//   spaced content-type byte-identical to the JS path; `String(Number())`
	//   reproduces runtime stringification, e.g. `4.50` → "4.5").
	// - null → 204 No Content (`kind: "empty"`).
	// JSON number grammar only - scientific notation / leading zeros / `n`
	// suffix are rejected and stay on the JS path.
	// Bun's transpiler folds `true` → `!0` and `false` → `!1` in toString()
	// output - both forms are runtime-identical to the boolean literal.
	if (unparen === "true" || unparen === "!0") {
		return { kind: "scalar", body: "true" };
	}
	if (unparen === "false" || unparen === "!1") {
		return { kind: "scalar", body: "false" };
	}
	if (unparen === "null") {
		return { kind: "empty" };
	}
	if (/^-?(?:0|[1-9]\d*)(?:\.\d+)?$/.test(unparen)) {
		return { kind: "scalar", body: String(Number(unparen)) };
	}

	// Bare object/array literal → JSON (native promotion). Parse failure
	// (dynamic values, templates, spread, …) → `undefined` keeps the JS path.
	if (unparen.startsWith("{") || unparen.startsWith("[")) {
		const data = parseJsonLiteral(unparen);
		return data !== undefined ? { kind: "json", data, status: 200 } : undefined;
	}

	// Call-expression needs a valid first parameter name
	const param = extractParamName(source);
	if (param === null) return undefined;
	const esc = param.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

	// <param>.text("lit"[, 201]) / <param>.html("lit"[, 201])
	for (const method of ["text", "html"] as const) {
		const prefix = `${param}.${method}(`;
		if (!expr.startsWith(prefix) || !expr.endsWith(")")) continue;
		const args = expr.slice(prefix.length, -1);
		const m = args.match(
			new RegExp(`^\\s*(${LITERAL_RE.source})\\s*(?:,\\s*(\\d+)\\s*)?$`),
		);
		if (m === null) return undefined;
		const lit = m[1];
		const st = m[2];
		if (lit === undefined) return undefined;
		const body = decodeStringLiteral(lit);
		if (body === undefined) return undefined;
		return {
			kind: method,
			body,
			status: st !== undefined ? Number(st) : 200,
		};
	}

	// <param>.json(<data-JSON-literal>[, 201]) - parse (with unquoted-key
	// normalization) as a validity check without eval; failure → not constant.
	const jprefix = `${param}.json(`;
	if (expr.startsWith(jprefix) && expr.endsWith(")")) {
		const inner = expr.slice(jprefix.length, -1);
		let data = parseJsonLiteral(inner);
		let status = 200;
		if (data === undefined) {
			// Status separator: last comma + a pure integer at the tail
			const sm = inner.match(/^([\s\S]*),\s*(\d+)$/);
			const payload = sm?.[1];
			const st = sm?.[2];
			if (payload === undefined || st === undefined) return undefined;
			data = parseJsonLiteral(payload);
			if (data === undefined) return undefined;
			status = Number(st);
		}
		return { kind: "json", data, status };
	}

	return undefined;
}

/** First parameter name of the handler source - `ctx`, `c`, etc. */
function extractParamName(source: string): string | null {
	const parens = source.match(
		/^\s*(?:function\s*)?(?:[A-Za-z_$][\w$]*\s*)?\(([^)]*)\)/,
	);
	if (parens) {
		const raw = parens[1] ?? "";
		const first = (raw.split(",")[0] ?? "").split("=")[0]?.trim() ?? "";
		return /^[A-Za-z_$][\w$]*$/.test(first) ? first : null;
	}
	return source.match(/^\s*([A-Za-z_$][\w$]*)\s*=>/)?.[1] ?? null;
}

/**
 * Strip one level of wrapping parens when they enclose the whole expression
 * (arrow body pattern `() => ({…})`). String-aware so parens inside literals
 * don't confuse the balance. Non-wrapping input is returned unchanged.
 */
function stripOuterParens(expr: string): string {
	if (!expr.startsWith("(") || !expr.endsWith(")")) return expr;
	let depth = 0;
	let quote: string | null = null;
	for (let i = 0; i < expr.length; i++) {
		const c = expr[i];
		if (quote !== null) {
			if (c === "\\") {
				i++;
				continue;
			}
			if (c === quote) quote = null;
			continue;
		}
		if (c === '"' || c === "'" || c === "`") {
			quote = c;
			continue;
		}
		if (c === "(") depth++;
		else if (c === ")") {
			depth--;
			if (depth === 0 && i < expr.length - 1) return expr;
		}
	}
	if (depth !== 0 || quote !== null) return expr;
	return expr.slice(1, -1).trim();
}

/**
 * Parse a JSON-ish literal (object/array) without eval - `undefined` on any
 * doubt. Tries strict `JSON.parse` first; on failure normalizes unquoted
 * keys / single-quoted strings (see `toJsonLiteralSrc`) and retries. Used for
 * bare `return {…}` returns and `ctx.json({…})` arguments: Bun's transpiler
 * may print object keys unquoted, which strict JSON rejects.
 */
function parseJsonLiteral(raw: string): unknown | undefined {
	try {
		const direct = JSON.parse(raw);
		return direct === undefined ? undefined : direct;
	} catch {
		// fall through to normalized parsing
	}
	const src = toJsonLiteralSrc(raw);
	if (src === undefined) return undefined;
	try {
		const data = JSON.parse(src);
		return data === undefined ? undefined : data;
	} catch {
		return undefined;
	}
}

/**
 * Normalize a JS object/array literal to strict JSON text, string-aware:
 *
 * - unquoted identifier/number keys before `:` → quoted keys
 * - single-quoted strings → double-quoted
 * - backticks (templates), comments, spread, operators, identifiers used as
 *   values → `undefined` (conservative: caller keeps the JS path)
 * - syntax JSON rejects (trailing commas, …) is left for `JSON.parse` to
 *   reject
 */
function toJsonLiteralSrc(raw: string): string | undefined {
	let out = "";
	let quote: '"' | "'" | "`" | null = null;
	for (let i = 0; i < raw.length; i++) {
		const c = raw[i];
		if (quote !== null) {
			if (c === "\\") {
				const n = raw[i + 1];
				if (n === undefined) return undefined;
				// `\'` inside single quotes → plain `'` (valid JSON char)
				if (quote === "'" && n === "'") {
					out += "'";
					i++;
					continue;
				}
				out += c + n;
				i++;
				continue;
			}
			if (c === quote) {
				out += quote === "'" ? '"' : quote;
				quote = null;
				continue;
			}
			out += c;
			continue;
		}
		if (c === '"' || c === "'") {
			quote = c;
			out += c === "'" ? '"' : c;
			continue;
		}
		if (c === "`") return undefined;
		if (c === "/" && (raw[i + 1] === "/" || raw[i + 1] === "*")) return undefined;
		if (c === " " || c === "\t" || c === "\n" || c === "\r") {
			out += c;
			continue;
		}
		// Unquoted key: identifier or number immediately followed by `:`
		const rest = raw.slice(i);
		const key = /^([A-Za-z_$][\w$]*|\d+)\s*:/.exec(rest);
		if (key) {
			out += JSON.stringify(key[1]) + ":";
			i += key[0].length - 1;
			continue;
		}
		// Transpiler-folded booleans: `true` → `!0`, `false` → `!1`
		if (c === "!") {
			const n = raw[i + 1];
			if (n === "0" || n === "1") {
				out += n === "0" ? "true" : "false";
				i++;
				continue;
			}
		}
		// Allowed bare values: true / false / null
		const kw = /^(true|false|null)(?![\w$])/.exec(rest)?.[1];
		if (kw !== undefined) {
			out += kw;
			i += kw.length - 1;
			continue;
		}
		// Number literal (JSON grammar) - reject when glued to other token
		// chars (`0x…`, `1abc`, `1.2.3`).
		const num = /^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/.exec(rest);
		if (num) {
			const after = rest[num[0].length];
			if (after === undefined || !/[\w$.]/.test(after)) {
				out += num[0];
				i += num[0].length - 1;
				continue;
			}
			return undefined;
		}
		// Structural tokens
		if (c === "{" || c === "}" || c === "[" || c === "]" || c === "," || c === ":") {
			out += c;
			continue;
		}
		// Anything else - operators, spread, identifiers as values, regexps…
		return undefined;
	}
	return quote === null ? out : undefined;
}

/** Decode a string literal's contents (no eval) - failure → `undefined` (conservative). */
function decodeStringLiteral(raw: string): string | undefined {
	const quote = raw[0];
	const body = raw.slice(1, -1);
	if (quote === "`" && body.includes("${")) return undefined;
	let out = "";
	for (let i = 0; i < body.length; i++) {
		const c = body[i];
		if (c !== "\\") {
			out += c;
			continue;
		}
		i++;
		if (i >= body.length) return undefined;
		const n = body[i];
		switch (n) {
			case "n": out += "\n"; break;
			case "t": out += "\t"; break;
			case "r": out += "\r"; break;
			case "b": out += "\b"; break;
			case "f": out += "\f"; break;
			case "v": out += "\v"; break;
			case "0": out += "\0"; break;
			case "\\": case "'": case '"': case "`": case "/": out += n; break;
			case "x": {
				const hex = body.slice(i + 1, i + 3);
				if (!/^[0-9a-fA-F]{2}$/.test(hex)) return undefined;
				out += String.fromCharCode(parseInt(hex, 16));
				i += 2;
				break;
			}
			case "u": {
				const hex = body.slice(i + 1, i + 5);
				if (!/^[0-9a-fA-F]{4}$/.test(hex)) return undefined;
				out += String.fromCharCode(parseInt(hex, 16));
				i += 4;
				break;
			}
			default:
				return undefined;
		}
	}
	return out;
}
