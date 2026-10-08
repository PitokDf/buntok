import { OpenAICompatibleProvider } from "./openai-compatible"

export interface XAIProviderConfig {
  apiKey?: string
  baseUrl?: string
  model?: string
}

/**
 * xAI (Grok) provider - via OpenAI-compatible API.
 * Get API key at: https://console.x.ai
 */
export class XAIProvider extends OpenAICompatibleProvider {
  readonly name = "xai"

  constructor(config: XAIProviderConfig) {
    super({
      apiKey: config.apiKey || process.env.XAI_API_KEY,
      baseUrl: config.baseUrl || "https://api.x.ai/v1",
      model: config.model || "grok-2",
    })
  }
}
