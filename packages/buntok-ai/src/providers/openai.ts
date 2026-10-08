import type {
  ChatOptions,
  ChatResponse,
  EmbeddingOptions,
  EmbeddingResponse,
  Message,
  StreamChunk,
  Tool,
  ToolCall,
  Usage,
} from "../types"
import { BaseProvider } from "./base"

export interface OpenAIProviderConfig {
  apiKey?: string
  baseUrl?: string
  model?: string
}

export class OpenAIProvider extends BaseProvider {
  readonly name = "openai"

  private getClient() {
    // Dynamic import - user must install `openai`
    // biome-ignore lint: dynamic import
    const OpenAI = require("openai").default || require("openai")
    return new OpenAI({
      apiKey: this.resolveApiKey(),
      baseURL: this.config.baseUrl,
    })
  }

  async chat(options: ChatOptions): Promise<ChatResponse> {
    const client = this.getClient()
    const model = this.resolveModel(options)

    const params: Record<string, any> = {
      model,
      messages: options.messages.map(toOpenAIMessage),
      temperature: options.temperature,
      max_tokens: options.maxTokens,
      top_p: options.topP,
      stop: options.stop,
      frequency_penalty: options.frequencyPenalty,
      presence_penalty: options.presencePenalty,
      seed: options.seed,
      user: options.user,
    }

    if (options.tools?.length) {
      params.tools = options.tools.map(toOpenAITool)
      if (options.toolChoice) {
        params.tool_choice = options.toolChoice === "auto"
          ? "auto"
          : options.toolChoice === "none"
            ? "none"
            : options.toolChoice === "required"
              ? "required"
              : { type: "function", function: { name: options.toolChoice.name } }
      }
    }

    const response = await client.chat.completions.create(params)
    const choice = response.choices[0]

    return {
      content: choice.message?.content || "",
      finishReason: mapFinishReason(choice.finish_reason),
      toolCalls: choice.message?.tool_calls?.map((tc: any) => ({
        id: tc.id,
        name: tc.function.name,
        arguments: tc.function.arguments,
      })),
      usage: {
        promptTokens: response.usage?.prompt_tokens || 0,
        completionTokens: response.usage?.completion_tokens || 0,
        totalTokens: response.usage?.total_tokens || 0,
      },
      model: response.model,
      id: response.id,
    }
  }

  async *stream(options: ChatOptions): AsyncIterable<StreamChunk> {
    const client = this.getClient()
    const model = this.resolveModel(options)

    const params: Record<string, any> = {
      model,
      messages: options.messages.map(toOpenAIMessage),
      temperature: options.temperature,
      max_tokens: options.maxTokens,
      top_p: options.topP,
      stop: options.stop,
      stream: true,
    }

    if (options.tools?.length) {
      params.tools = options.tools.map(toOpenAITool)
      if (options.toolChoice) {
        params.tool_choice = options.toolChoice
      }
    }

    const stream = await client.chat.completions.create(params)

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta
      const finishReason = chunk.choices[0]?.finish_reason

      if (delta?.content) {
        yield { type: "text", content: delta.content }
      }

      if (delta?.tool_calls) {
        for (const tc of delta.tool_calls) {
          yield {
            type: "tool_call",
            toolCall: {
              id: tc.id,
              name: tc.function?.name,
              arguments: tc.function?.arguments,
            },
          }
        }
      }

      if (finishReason) {
        yield {
          type: "finish",
          finishReason: mapFinishReason(finishReason),
          usage: chunk.usage
            ? {
                promptTokens: chunk.usage.prompt_tokens || 0,
                completionTokens: chunk.usage.completion_tokens || 0,
                totalTokens: chunk.usage.total_tokens || 0,
              }
            : undefined,
        }
      }
    }
  }

  async embed(options: EmbeddingOptions): Promise<EmbeddingResponse> {
    const client = this.getClient()
    const model = options.model || this.config.model || "text-embedding-3-small"

    const input = Array.isArray(options.input) ? options.input : [options.input]
    const response = await client.embeddings.create({
      model,
      input,
      dimensions: options.dimensions,
    })

    return {
      embeddings: response.data.map((d: any) => d.embedding),
      usage: {
        promptTokens: response.usage?.prompt_tokens || 0,
        completionTokens: 0,
        totalTokens: response.usage?.total_tokens || 0,
      },
      model: response.model,
    }
  }
}

function toOpenAIMessage(msg: Message) {
  const m: Record<string, any> = { role: msg.role, content: msg.content }
  if (msg.name) m.name = msg.name
  if (msg.toolCalls) m.tool_calls = msg.toolCalls
  if (msg.toolCallId) m.tool_call_id = msg.toolCallId
  return m
}

function toOpenAITool(tool: Tool) {
  return {
    type: "function",
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters ? JSON.parse(JSON.stringify(tool.parameters)) : undefined,
    },
  }
}

function mapFinishReason(reason: string | null): ChatResponse["finishReason"] {
  switch (reason) {
    case "stop":
      return "stop"
    case "length":
      return "length"
    case "tool_calls":
      return "tool_calls"
    case "content_filter":
      return "content_filter"
    default:
      return "unknown"
  }
}
