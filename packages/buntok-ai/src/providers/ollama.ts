import { OpenAICompatibleProvider } from "./openai-compatible"

export interface OllamaProviderConfig {
  baseUrl?: string
  model?: string
}

/**
 * Ollama provider - local LLM inference via OpenAI-compatible API.
 * Requires Ollama running locally (default: http://localhost:11434)
 */
export class OllamaProvider extends OpenAICompatibleProvider {
  readonly name = "ollama"

  constructor(config: OllamaProviderConfig = {}) {
    super({
      apiKey: "ollama",
      baseUrl: config.baseUrl || "http://localhost:11434/v1",
      model: config.model || "llama3.2",
    })
  }

  protected override resolveApiKey(): string {
    return "ollama"
  }
}
