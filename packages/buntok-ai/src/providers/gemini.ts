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

export interface GeminiProviderConfig {
  apiKey?: string
  baseUrl?: string
  model?: string
}

export class GeminiProvider extends BaseProvider {
  readonly name = "gemini"

  private getClient() {
    // Dynamic import - user must install `@google/genai`
    // biome-ignore lint: dynamic import
    const { GoogleGenAI } = require("@google/genai")
    return new GoogleGenAI({
      apiKey: this.resolveApiKey(),
      httpOptions: this.config.baseUrl ? { baseUrl: this.config.baseUrl } : undefined,
    })
  }

  async chat(options: ChatOptions): Promise<ChatResponse> {
    const client = this.getClient()
    const model = this.resolveModel(options)
    const { systemInstruction, contents } = toGeminiMessages(options.messages)

    const params: Record<string, any> = {
      model,
      contents,
      config: {
        temperature: options.temperature,
        maxOutputTokens: options.maxTokens,
        topP: options.topP,
        stopSequences: options.stop,
        ...(systemInstruction ? { systemInstruction } : {}),
      },
    }

    if (options.tools?.length) {
      params.config.tools = [{ functionDeclarations: options.tools.map(toGeminiTool) }]
    }

    const response = await client.models.generateContent(params)
    const text = response.text || ""
    const funcCalls = response.functionCalls || []
    const usageMetadata = response.usageMetadata

    return {
      content: text,
      finishReason: mapFinishReason(response.candidates?.[0]?.finishReason),
      toolCalls: funcCalls.map((fc: any) => ({
        id: `call_${Date.now()}`,
        name: fc.name,
        arguments: JSON.stringify(fc.args),
      })),
      usage: {
        promptTokens: usageMetadata?.promptTokenCount || 0,
        completionTokens: usageMetadata?.candidatesTokenCount || 0,
        totalTokens: usageMetadata?.totalTokenCount || 0,
      },
      model,
    }
  }

  async *stream(options: ChatOptions): AsyncIterable<StreamChunk> {
    const client = this.getClient()
    const model = this.resolveModel(options)
    const { systemInstruction, contents } = toGeminiMessages(options.messages)

    const params: Record<string, any> = {
      model,
      contents,
      config: {
        temperature: options.temperature,
        maxOutputTokens: options.maxTokens,
        topP: options.topP,
        stopSequences: options.stop,
        ...(systemInstruction ? { systemInstruction } : {}),
      },
    }

    if (options.tools?.length) {
      params.config.tools = [{ functionDeclarations: options.tools.map(toGeminiTool) }]
    }

    const stream = await client.models.generateContentStream(params)

    for await (const chunk of stream) {
      const text = chunk.text
      if (text) {
        yield { type: "text", content: text }
      }

      const funcCalls = chunk.functionCalls
      if (funcCalls?.length) {
        for (const fc of funcCalls) {
          yield {
            type: "tool_call",
            toolCall: {
              id: `call_${Date.now()}`,
              name: fc.name,
              arguments: JSON.stringify(fc.args),
            },
          }
        }
      }

      const finishReason = chunk.candidates?.[0]?.finishReason
      if (finishReason) {
        yield { type: "finish", finishReason: mapFinishReason(finishReason) }
      }
    }
  }

  async embed(options: EmbeddingOptions): Promise<EmbeddingResponse> {
    const client = this.getClient()
    const model = options.model || this.config.model || "text-embedding-004"
    const input = Array.isArray(options.input) ? options.input : [options.input]

    const response = await client.models.embedContent({
      model,
      contents: input.map((text) => ({ role: "user", parts: [{ text }] })),
      config: options.dimensions ? { outputDimensionality: options.dimensions } : undefined,
    })

    return {
      embeddings: response.embeddings?.map((e: any) => e.values) || [],
      usage: {
        promptTokens: response.usageMetadata?.tokenCount || 0,
        completionTokens: 0,
        totalTokens: response.usageMetadata?.tokenCount || 0,
      },
      model,
    }
  }
}

function toGeminiMessages(messages: Message[]) {
  let systemInstruction = ""
  const contents: any[] = []

  for (const msg of messages) {
    if (msg.role === "system") {
      systemInstruction += (systemInstruction ? "\n" : "") + msg.content
      continue
    }

    const role = msg.role === "assistant" ? "model" : "user"
    const parts: any[] = []

    if (msg.content) {
      parts.push({ text: msg.content })
    }

    if (msg.toolCalls) {
      for (const tc of msg.toolCalls) {
        parts.push({
          functionCall: {
            name: tc.name,
            args: JSON.parse(tc.arguments),
          },
        })
      }
    }

    if (msg.toolCallId) {
      parts.push({
        functionResponse: {
          name: "tool_response",
          response: { result: msg.content },
        },
      })
    }

    contents.push({ role, parts })
  }

  return { systemInstruction, contents }
}

function toGeminiTool(tool: Tool) {
  const schema = tool.parameters
    ? JSON.parse(JSON.stringify(tool.parameters))
    : { type: "object", properties: {} }

  return {
    name: tool.name,
    description: tool.description,
    parameters: schema,
  }
}

function mapFinishReason(reason: string | undefined): ChatResponse["finishReason"] {
  switch (reason) {
    case "STOP":
      return "stop"
    case "MAX_TOKENS":
      return "length"
    case "SAFETY":
    case "RECITATION":
      return "content_filter"
    default:
      return "unknown"
  }
}
