import type {
  ChatOptions,
  ChatResponse,
  EmbeddingOptions,
  EmbeddingResponse,
  Message,
  StreamChunk,
  Tool,
  Usage,
} from "../types"
import { BaseProvider } from "./base"

export interface MistralProviderConfig {
  apiKey?: string
  baseUrl?: string
  model?: string
}

export class MistralProvider extends BaseProvider {
  readonly name = "mistral"

  private getClient() {
    // Dynamic import - user must install `@mistralai/mistralai`
    // biome-ignore lint: dynamic import
    const MistralAI = require("@mistralai/mistralai").default || require("@mistralai/mistralai")
    return new MistralAI({
      apiKey: this.resolveApiKey(),
      ...(this.config.baseUrl ? { baseURL: this.config.baseUrl } : {}),
    })
  }

  async chat(options: ChatOptions): Promise<ChatResponse> {
    const client = this.getClient()
    const model = this.resolveModel(options)
    const { system, messages } = splitSystemMessages(options.messages)

    const params: Record<string, any> = {
      model,
      messages: messages.map(toMistralMessage),
      temperature: options.temperature,
      maxTokens: options.maxTokens,
      topP: options.topP,
    }

    if (system) params.messages.unshift({ role: "system", content: system })
    if (options.tools?.length) {
      params.tools = options.tools.map(toMistralTool)
    }

    const response = await client.chat.complete(params)
    const choice = response.choices[0]

    return {
      content: choice.message?.content || "",
      finishReason: mapFinishReason(choice.finishReason),
      toolCalls: choice.message?.toolCalls?.map((tc: any) => ({
        id: tc.id || `call_${Date.now()}`,
        name: tc.function.name,
        arguments: tc.function.arguments,
      })),
      usage: {
        promptTokens: response.usage?.promptTokens || 0,
        completionTokens: response.usage?.completionTokens || 0,
        totalTokens: response.usage?.totalTokens || 0,
      },
      model: response.model,
      id: response.id,
    }
  }

  async *stream(options: ChatOptions): AsyncIterable<StreamChunk> {
    const client = this.getClient()
    const model = this.resolveModel(options)
    const { system, messages } = splitSystemMessages(options.messages)

    const params: Record<string, any> = {
      model,
      messages: messages.map(toMistralMessage),
      temperature: options.temperature,
      maxTokens: options.maxTokens,
      topP: options.topP,
    }

    if (system) params.messages.unshift({ role: "system", content: system })
    if (options.tools?.length) {
      params.tools = options.tools.map(toMistralTool)
    }

    const stream = await client.chat.stream(params)

    for await (const chunk of stream) {
      const choice = chunk.choices[0]

      if (choice?.delta?.content) {
        yield { type: "text", content: choice.delta.content }
      }

      if (choice?.delta?.toolCalls) {
        for (const tc of choice.delta.toolCalls) {
          yield {
            type: "tool_call",
            toolCall: {
              id: tc.id || `call_${Date.now()}`,
              name: tc.function?.name,
              arguments: tc.function?.arguments,
            },
          }
        }
      }

      if (choice?.finishReason) {
        yield {
          type: "finish",
          finishReason: mapFinishReason(choice.finishReason),
        }
      }
    }
  }

  async embed(options: EmbeddingOptions): Promise<EmbeddingResponse> {
    const client = this.getClient()
    const model = options.model || this.config.model || "mistral-embed"
    const input = Array.isArray(options.input) ? options.input : [options.input]

    const response = await client.embeddings.create({
      model,
      input,
    })

    return {
      embeddings: response.data.map((d: any) => d.embedding),
      usage: {
        promptTokens: response.usage?.promptTokens || 0,
        completionTokens: 0,
        totalTokens: response.usage?.totalTokens || 0,
      },
      model: response.model,
    }
  }
}

function splitSystemMessages(messages: Message[]) {
  const systemMsgs = messages.filter((m) => m.role === "system")
  const nonSystemMsgs = messages.filter((m) => m.role !== "system")
  return {
    system: systemMsgs.map((m) => m.content).join("\n") || undefined,
    messages: nonSystemMsgs,
  }
}

function toMistralMessage(msg: Message) {
  const m: Record<string, any> = { role: msg.role, content: msg.content }
  if (msg.toolCalls) m.toolCalls = msg.toolCalls
  if (msg.toolCallId) m.toolCallId = msg.toolCallId
  return m
}

function toMistralTool(tool: Tool) {
  return {
    type: "function",
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters ? JSON.parse(JSON.stringify(tool.parameters)) : { type: "object", properties: {} },
    },
  }
}

function mapFinishReason(reason: string | undefined): ChatResponse["finishReason"] {
  switch (reason) {
    case "stop":
      return "stop"
    case "length":
      return "length"
    case "tool_calls":
      return "tool_calls"
    default:
      return "unknown"
  }
}
