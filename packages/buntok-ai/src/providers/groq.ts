import { OpenAICompatibleProvider } from "./openai-compatible"

export interface GroqProviderConfig {
  apiKey?: string
  baseUrl?: string
  model?: string
}

/**
 * Groq provider - ultra-fast inference via OpenAI-compatible API.
 * Get API key at: https://console.groq.com
 */
export class GroqProvider extends OpenAICompatibleProvider {
  readonly name = "groq"

  constructor(config: GroqProviderConfig) {
    super({
      apiKey: config.apiKey || process.env.GROQ_API_KEY,
      baseUrl: config.baseUrl || "https://api.groq.com/openai/v1",
      model: config.model || "llama-3.3-70b-versatile",
    })
  }
}
