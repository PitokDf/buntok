import type { Context } from "@buntok/core"
import { ChatHistory } from "./history"
import { executeTools, toolResultsToMessages } from "./tools"
import { collectStream, streamResponse } from "./streaming"
import type {
  AIConfig,
  ChatOptions,
  ChatResponse,
  EmbeddingOptions,
  EmbeddingResponse,
  Message,
  Middleware,
  MiddlewareContext,
  Provider,
  StreamChunk,
  Tool,
  ToolCall,
} from "./types"

/**
 * Main AI class - unified interface for all providers.
 *
 * @example
 * ```ts
 * import { AI } from "@buntok/ai"
 * import { OpenAIProvider } from "@buntok/ai/providers/openai"
 *
 * const ai = new AI({
 *   provider: new OpenAIProvider({ apiKey: "..." }),
 *   model: "gpt-4o"
 * })
 *
 * // Simple chat
 * const res = await ai.chat({
 *   messages: [{ role: "user", content: "Hello!" }]
 * })
 *
 * // Streaming
 * const stream = ai.stream({ messages: [...], stream: true })
 * return streamResponse(ctx, stream)
 * ```
 */
export class AI {
  private provider: Provider
  private defaultModel?: string
  private middlewareList: Middleware[]
  private maxToolRounds: number
  private tools: Tool[] = []
  private history = new ChatHistory()

  constructor(config: AIConfig) {
    this.provider = config.provider
    this.defaultModel = config.model
    this.middlewareList = config.middleware || []
    this.maxToolRounds = config.maxToolRounds || 5
  }

  /**
   * Chat with the AI provider.
   */
  async chat(options: ChatOptions): Promise<ChatResponse> {
    const model = options.model || this.defaultModel
    const opts = { ...options, model, tools: options.tools || this.tools }

    const ctx: MiddlewareContext = {
      messages: opts.messages,
      model: model || "",
      options: opts,
      startTime: Date.now(),
    }

    // Run before middleware
    let modifiedCtx: MiddlewareContext | void = ctx
    for (const mw of this.middlewareList) {
      if (mw.before) {
        modifiedCtx = await mw.before(modifiedCtx || ctx)
        if (modifiedCtx) Object.assign(ctx, modifiedCtx)
      }
    }

    try {
      let response = await this.provider.chat(opts)

      // Run after middleware
      for (const mw of this.middlewareList) {
        if (mw.after) {
          const result = await mw.after(ctx, response)
          if (result) response = result
        }
      }

      return response
    } catch (e: any) {
      // Run error middleware
      for (const mw of this.middlewareList) {
        if (mw.onError) await mw.onError(ctx, e)
      }
      throw e
    }
  }

  /**
   * Stream chat with the AI provider.
   */
  async *stream(options: ChatOptions): AsyncIterable<StreamChunk> {
    const model = options.model || this.defaultModel
    const opts = { ...options, model, stream: true, tools: options.tools || this.tools }

    yield* this.provider.stream(opts)
  }

  /**
   * Stream chat and return as Response (SSE).
   */
  streamResponse(ctx: Context, options: ChatOptions) {
    const stream = this.stream(options)
    return streamResponse(ctx, stream)
  }

  /**
   * Chat with automatic tool execution.
   * Executes tools and continues conversation until no more tool calls.
   */
  async chatWithTools(options: ChatOptions, maxRounds?: number): Promise<ChatResponse> {
    const rounds = maxRounds || this.maxToolRounds
    const tools = options.tools || this.tools
    const messages = [...options.messages]

    for (let round = 0; round < rounds; round++) {
      const response = await this.chat({ ...options, messages, tools })

      if (!response.toolCalls?.length || response.finishReason !== "tool_calls") {
        return response
      }

      // Add assistant message with tool calls
      messages.push({
        role: "assistant",
        content: response.content,
        toolCalls: response.toolCalls,
      })

      // Execute tools
      const results = await executeTools(tools, response.toolCalls)

      // Add tool results
      messages.push(...toolResultsToMessages(results))
    }

    // Max rounds reached
    return this.chat({ ...options, messages, tools })
  }

  /**
   * Generate embeddings.
   */
  async embed(options: EmbeddingOptions): Promise<EmbeddingResponse> {
    if (!this.provider.embed) {
      throw new Error(`${this.provider.name} does not support embeddings`)
    }
    return this.provider.embed(options)
  }

  /**
   * Register tools for automatic inclusion in chat calls.
   */
  registerTools(...tools: Tool[]): this {
    this.tools.push(...tools)
    return this
  }

  /**
   * Add middleware.
   */
  use(middleware: Middleware): this {
    this.middlewareList.push(middleware)
    return this
  }

  /**
   * Get the chat history manager.
   */
  getHistory(): ChatHistory {
    return this.history
  }

  /**
   * Get the underlying provider.
   */
  getProvider(): Provider {
    return this.provider
  }
}
