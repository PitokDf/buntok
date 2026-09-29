/**
 * Sucrose-style static code analysis for handler optimization.
 *
 * Analyzes handler function source code at boot time to determine which
 * context properties are actually used, then generates optimized handlers
 * that only parse/query/validate the properties that are needed.
 *
 * This eliminates unnecessary work per request — if a handler doesn't use
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
		// we can't safely skip Context — the destructured props come from ctx
		const hasDestructuredParams = /\(\s*\{[^}]*\b(params|query|body|valid|request|headers|store|cookies|ip)\b/.test(source) ||
			/function\s*\w*\s*\(\s*\{[^}]+\}/.test(source) ||
			/\)\s*=>\s*\{[^}]*\bparams\b/.test(source);

		if (hasDestructuredParams) {
			// Destructured ctx props — detect WHICH props are destructured
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
		// — the literal ctx.* property checks above would miss them.
		const usesBareCtx = /(^|[^\w$.])ctx(?![\w])/.test(source);

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
	}

	return combined;
}
