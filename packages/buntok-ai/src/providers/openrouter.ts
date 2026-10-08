import { OpenAICompatibleProvider } from "./openai-compatible"

export interface OpenRouterProviderConfig {
  apiKey?: string
  baseUrl?: string
  model?: string
}

/**
 * OpenRouter provider - 300+ models through one API.
 * Get API key at: https://openrouter.ai
 */
export class OpenRouterProvider extends OpenAICompatibleProvider {
  readonly name = "openrouter"

  constructor(config: OpenRouterProviderConfig) {
    super({
      apiKey: config.apiKey || process.env.OPENROUTER_API_KEY,
      baseUrl: config.baseUrl || "https://openrouter.ai/api/v1",
      model: config.model || "openai/gpt-4o",
    })
  }
}
