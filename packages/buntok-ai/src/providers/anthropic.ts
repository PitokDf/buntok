import type {
  ChatOptions,
  ChatResponse,
  Message,
  StreamChunk,
  Tool,
  Usage,
} from "../types"
import { BaseProvider } from "./base"

export interface AnthropicProviderConfig {
  apiKey?: string
  baseUrl?: string
  model?: string
}

export class AnthropicProvider extends BaseProvider {
  readonly name = "anthropic"

  private getClient() {
    // Dynamic import - user must install `@anthropic-ai/sdk`
    // biome-ignore lint: dynamic import
    const Anthropic = require("@anthropic-ai/sdk").default || require("@anthropic-ai/sdk")
    return new Anthropic({
      apiKey: this.resolveApiKey(),
      baseURL: this.config.baseUrl,
    })
  }

  async chat(options: ChatOptions): Promise<ChatResponse> {
    const client = this.getClient()
    const model = this.resolveModel(options)
    const { system, messages } = splitSystemMessages(options.messages)

    const params: Record<string, any> = {
      model,
      max_tokens: options.maxTokens || 4096,
      messages: messages.map(toAnthropicMessage),
      temperature: options.temperature,
      top_p: options.topP,
      stop_sequences: options.stop,
    }

    if (system) params.system = system
    if (options.tools?.length) {
      params.tools = options.tools.map(toAnthropicTool)
      if (options.toolChoice) {
        params.tool_choice =
          options.toolChoice === "auto"
            ? { type: "auto" }
            : options.toolChoice === "none"
              ? { type: "none" }
              : options.toolChoice === "required"
                ? { type: "any" }
                : { type: "tool", name: options.toolChoice.name }
      }
    }

    const response = await client.messages.create(params)
    const textContent = response.content.find((b: any) => b.type === "text")
    const toolContent = response.content.filter((b: any) => b.type === "tool_use")

    return {
      content: textContent?.text || "",
      finishReason: mapFinishReason(response.stop_reason),
      toolCalls: toolContent.map((tc: any) => ({
        id: tc.id,
        name: tc.name,
        arguments: JSON.stringify(tc.input),
      })),
      usage: {
        promptTokens: response.usage?.input_tokens || 0,
        completionTokens: response.usage?.output_tokens || 0,
        totalTokens:
          (response.usage?.input_tokens || 0) + (response.usage?.output_tokens || 0),
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
      max_tokens: options.maxTokens || 4096,
      messages: messages.map(toAnthropicMessage),
      temperature: options.temperature,
      top_p: options.topP,
      stop_sequences: options.stop,
      stream: true,
    }

    if (system) params.system = system
    if (options.tools?.length) {
      params.tools = options.tools.map(toAnthropicTool)
    }

    const stream = await client.messages.create(params)
    let currentToolId = ""
    let currentToolName = ""
    let currentToolInput = ""

    for await (const event of stream) {
      switch (event.type) {
        case "content_block_start":
          if (event.content_block?.type === "tool_use") {
            currentToolId = event.content_block.id
            currentToolName = event.content_block.name
            currentToolInput = ""
          }
          break

        case "content_block_delta":
          if (event.delta?.type === "text_delta") {
            yield { type: "text", content: event.delta.text }
          } else if (event.delta?.type === "input_json_delta") {
            currentToolInput += event.delta.partial_json
          }
          break

        case "content_block_stop":
          if (currentToolId) {
            yield {
              type: "tool_call",
              toolCall: {
                id: currentToolId,
                name: currentToolName,
                arguments: currentToolInput,
              },
            }
            currentToolId = ""
            currentToolName = ""
            currentToolInput = ""
          }
          break

        case "message_delta":
          yield {
            type: "finish",
            finishReason: mapFinishReason(event.delta?.stop_reason),
            usage: event.usage
              ? {
                  promptTokens: 0,
                  completionTokens: event.usage.output_tokens || 0,
                  totalTokens: event.usage.output_tokens || 0,
                }
              : undefined,
          }
          break
      }
    }
  }
}

function splitSystemMessages(messages: Message[]) {
  const systemMsgs = messages.filter((m) => m.role === "system")
  const nonSystemMsgs = messages.filter((m) => m.role !== "system")
  const system = systemMsgs.map((m) => m.content).join("\n") || undefined
  return { system, messages: nonSystemMsgs }
}

function toAnthropicMessage(msg: Message) {
  const content: any[] = []

  if (msg.content) {
    content.push({ type: "text", text: msg.content })
  }

  if (msg.toolCalls) {
    for (const tc of msg.toolCalls) {
      content.push({
        type: "tool_use",
        id: tc.id,
        name: tc.name,
        input: JSON.parse(tc.arguments),
      })
    }
  }

  if (msg.toolCallId) {
    content.push({
      type: "tool_result",
      tool_use_id: msg.toolCallId,
      content: msg.content,
    })
  }

  return { role: msg.role === "tool" ? "user" : msg.role, content }
}

function toAnthropicTool(tool: Tool) {
  return {
    name: tool.name,
    description: tool.description,
    input_schema: tool.parameters
      ? JSON.parse(JSON.stringify(tool.parameters))
      : { type: "object", properties: {} },
  }
}

function mapFinishReason(reason: string | null): ChatResponse["finishReason"] {
  switch (reason) {
    case "end_turn":
    case "stop":
      return "stop"
    case "max_tokens":
      return "length"
    case "tool_use":
      return "tool_calls"
    default:
      return "unknown"
  }
}
