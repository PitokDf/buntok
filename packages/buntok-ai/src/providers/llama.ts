import { OpenAICompatibleProvider } from "./openai-compatible"

export interface LlamaProviderConfig {
  apiKey?: string
  baseUrl?: string
  model?: string
}

/**
 * Meta Llama provider - via Meta's Model API (OpenAI-compatible).
 * Uses OpenAI SDK format pointed at api.meta.ai
 */
export class LlamaProvider extends OpenAICompatibleProvider {
  readonly name = "llama"

  constructor(config: LlamaProviderConfig) {
    super({
      apiKey: config.apiKey || process.env.LLAMA_API_KEY,
      baseUrl: config.baseUrl || "https://api.meta.ai/v1",
      model: config.model || "llama-3.3-70b",
    })
  }
}
