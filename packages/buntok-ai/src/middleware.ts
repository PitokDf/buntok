import type { ChatResponse, Middleware, MiddlewareContext, Usage } from "./types"

// ── Rate Limiter ───────────────────────────────────────────────────

export interface RateLimiterOptions {
  maxRequests: number
  windowMs: number
  keyFn?: (ctx: MiddlewareContext) => string
}

/**
 * Rate limiter middleware - limits requests per window per key.
 */
export function rateLimiter(options: RateLimiterOptions): Middleware {
  const requests = new Map<string, number[]>()

  return {
    name: "rate-limiter",
    before(ctx) {
      const key = options.keyFn ? options.keyFn(ctx) : "default"
      const now = Date.now()
      const windowStart = now - options.windowMs

      const timestamps = (requests.get(key) || []).filter((t) => t > windowStart)
      if (timestamps.length >= options.maxRequests) {
        throw new Error(
          `Rate limit exceeded: ${timestamps.length}/${options.maxRequests} requests in ${options.windowMs}ms`,
        )
      }
      timestamps.push(now)
      requests.set(key, timestamps)
    },
  }
}

// ── Usage Tracker ──────────────────────────────────────────────────

export interface UsageTrackerOptions {
  onUsage: (usage: Usage & { model: string; timestamp: number }) => void | Promise<void>
}

/**
 * Usage tracker middleware - tracks token usage per request.
 */
export function usageTracker(options: UsageTrackerOptions): Middleware {
  return {
    name: "usage-tracker",
    after: async (ctx, response) => {
      await options.onUsage({
        ...response.usage,
        model: response.model,
        timestamp: Date.now(),
      })
    },
  }
}

// ── Cost Estimator ─────────────────────────────────────────────────

export interface CostEstimatorOptions {
  pricing: Record<string, { input: number; output: number }>
  currency?: string
  onCost?: (cost: { input: number; output: number; total: number; currency: string }) => void | Promise<void>
}

/**
 * Cost estimator middleware - estimates cost based on token usage and pricing.
 * Pricing is in USD per 1M tokens by default.
 */
export function costEstimator(options: CostEstimatorOptions): Middleware {
  const currency = options.currency || "USD"

  return {
    name: "cost-estimator",
    after: async (ctx, response) => {
      const pricing = options.pricing[response.model]
      if (!pricing) return

      const inputCost = (response.usage.promptTokens / 1_000_000) * pricing.input
      const outputCost = (response.usage.completionTokens / 1_000_000) * pricing.output

      if (options.onCost) {
        await options.onCost({
          input: inputCost,
          output: outputCost,
          total: inputCost + outputCost,
          currency,
        })
      }
    },
  }
}

// ── Logger ─────────────────────────────────────────────────────────

export interface AILoggerOptions {
  log?: (message: string) => void
}

/**
 * Logger middleware - logs request/response details.
 */
export function aiLogger(options: AILoggerOptions = {}): Middleware {
  const log = options.log || console.log

  return {
    name: "logger",
    before(ctx) {
      log(`[AI] → ${ctx.model} | ${ctx.messages.length} messages`)
    },
    after: async (ctx, response) => {
      log(
        `[AI] ← ${response.model} | ${response.usage.totalTokens} tokens | ${response.finishReason}`,
      )
    },
    onError: async (ctx, error) => {
      log(`[AI] ✗ ${error.message}`)
    },
  }
}

// ── Cache ──────────────────────────────────────────────────────────

export interface AICacheOptions {
  get: (key: string) => Promise<string | null>
  set: (key: string, value: string, ttlSeconds: number) => Promise<void>
  ttlSeconds?: number
  keyFn?: (ctx: MiddlewareContext) => string
}

/**
 * Cache middleware - caches non-streaming responses.
 */
export function aiCache(options: AICacheOptions): Middleware {
  const ttl = options.ttlSeconds || 3600

  return {
    name: "cache",
    before: async (ctx) => {
      if (ctx.options.stream) return

      const keyFn = options.keyFn || defaultCacheKey
      const key = keyFn(ctx)
      const cached = await options.get(key)

      if (cached) {
        // Return cached response by attaching to context
        ctx._cachedResponse = cached
      }
    },
    after: async (ctx, response) => {
      if (ctx._cachedResponse) return

      const keyFn = options.keyFn || defaultCacheKey
      const key = keyFn(ctx)
      await options.set(key, response.content, ttl)
    },
  }
}

function defaultCacheKey(ctx: MiddlewareContext): string {
  const content = JSON.stringify(ctx.messages.slice(-3))
  let hash = 0
  for (let i = 0; i < content.length; i++) {
    hash = (hash << 5) - hash + content.charCodeAt(i)
    hash = hash & hash
  }
  return `ai_cache_${ctx.model}_${hash}`
}
