# @buntok/ai

Provider-agnostic AI SDK for [Buntok](https://www.npmjs.com/package/@buntok/core) - streaming, tool calling, chat history, RAG, and middleware.

## Features

- **10 Providers** - OpenAI, Anthropic, Gemini, Mistral, Cohere, Groq, Ollama, xAI, OpenRouter, Llama
- **Streaming** - Vercel AI SDK Data Stream Protocol v1
- **Tool Calling** - automatic tool execution with multi-round conversations
- **Chat History** - in-memory session management
- **Embeddings** - vector search for RAG
- **Middleware** - rate limiter, usage tracker, cost estimator, logger, cache
- **Zero core deps** - provider SDKs are optional peer dependencies

## Install

```bash
bun add @buntok/ai @buntok/core
# Install only the providers you need:
bun add openai
bun add @anthropic-ai/sdk
bun add @google/genai
```

## Quick Start

```ts
import { AI, OpenAIProvider, streamResponse } from "@buntok/ai"

const ai = new AI({
  provider: new OpenAIProvider({ apiKey: process.env.OPENAI_API_KEY }),
  model: "gpt-4o",
})

// Simple chat
const response = await ai.chat({
  messages: [{ role: "user", content: "Hello!" }],
})
console.log(response.content)

// Streaming
const stream = ai.stream({
  messages: [{ role: "user", content: "Tell me a story" }],
})
return streamResponse(ctx, stream)
```

## Providers

| Provider | Package | Config |
|----------|---------|--------|
| OpenAI | `openai` | `OPENAI_API_KEY` |
| Anthropic | `@anthropic-ai/sdk` | `ANTHROPIC_API_KEY` |
| Gemini | `@google/genai` | `GEMINI_API_KEY` |
| Mistral | `@mistralai/mistralai` | `MISTRAL_API_KEY` |
| Cohere | `@cohere-ai/sdk` | `COHERE_API_KEY` |
| Groq | *(built-in)* | `GROQ_API_KEY` |
| Ollama | *(built-in)* | - (localhost:11434) |
| xAI | *(built-in)* | `XAI_API_KEY` |
| OpenRouter | *(built-in)* | `OPENROUTER_API_KEY` |
| Llama | *(built-in)* | `LLAMA_API_KEY` |

Providers marked *(built-in)* use the OpenAI-compatible API format - no SDK needed.

### Using Groq (fast inference)

```ts
import { AI, GroqProvider } from "@buntok/ai"

const ai = new AI({
  provider: new GroqProvider({ apiKey: process.env.GROQ_API_KEY }),
  model: "llama-3.3-70b-versatile",
})
```

### Using Ollama (local)

```ts
import { AI, OllamaProvider } from "@buntok/ai"

const ai = new AI({
  provider: new OllamaProvider({ model: "llama3.2" }),
})
```

## Tool Calling

```ts
import { z } from "zod"
import { AI, OpenAIProvider } from "@buntok/ai"

const ai = new AI({
  provider: new OpenAIProvider({ apiKey: "..." }),
  model: "gpt-4o",
})

ai.registerTools({
  name: "get_weather",
  description: "Get weather for a city",
  parameters: z.object({ city: z.string() }),
  execute: async ({ city }) => {
    return { temp: 25, condition: "sunny" }
  },
})

// Auto-executes tools and continues until done
const response = await ai.chatWithTools({
  messages: [{ role: "user", content: "What's the weather in Jakarta?" }],
})
```

## Streaming

```ts
import { AI, OpenAIProvider, streamResponse, collectStream } from "@buntok/ai"

// Return as SSE Response
const stream = ai.stream({ messages })
return streamResponse(ctx, stream)

// Or collect all text
const { content, toolCalls } = await collectStream(ai.stream({ messages }))
```

## Chat History

```ts
const history = ai.getHistory()

// Add messages
history.add("user-123", "user", "Hello!")
history.add("user-123", "assistant", "Hi! How can I help?")

// Get messages for AI
const messages = history.toAIMessages("user-123", "You are a helpful assistant")

// Trim old messages
history.trim("user-123", 20) // keep last 20

// Clear session
history.clear("user-123")
```

## Middleware

```ts
import { AI, OpenAIProvider, rateLimiter, usageTracker, costEstimator, aiLogger } from "@buntok/ai"

const ai = new AI({
  provider: new OpenAIProvider({ apiKey: "..." }),
  model: "gpt-4o",
  middleware: [
    // Rate limit: 100 requests per minute
    rateLimiter({ maxRequests: 100, windowMs: 60_000 }),

    // Track usage
    usageTracker({
      onUsage: async (usage) => {
        await db.insert("ai_usage").values(usage)
      },
    }),

    // Estimate cost
    costEstimator({
      pricing: {
        "gpt-4o": { input: 2.5, output: 10 }, // USD per 1M tokens
        "claude-3-opus": { input: 15, output: 75 },
      },
      onCost: async (cost) => {
        console.log(`Request cost: $${cost.total.toFixed(4)}`)
      },
    }),

    // Log requests
    aiLogger(),
  ],
})
```

## Embeddings (RAG)

```ts
const ai = new AI({
  provider: new OpenAIProvider({ apiKey: "..." }),
  model: "text-embedding-3-small",
})

const { embeddings } = await ai.embed({
  input: ["Hello world", "How are you?"],
})

// Use with your vector store
```

## Custom Provider

Implement the `Provider` interface:

```ts
import type { Provider, ChatOptions, ChatResponse, StreamChunk } from "@buntok/ai"

class MyProvider implements Provider {
  readonly name = "my-provider"

  async chat(options: ChatOptions): Promise<ChatResponse> {
    // Your implementation
  }

  async *stream(options: ChatOptions): AsyncIterable<StreamChunk> {
    // Your implementation
  }
}
```

## API Reference

### `AI`

| Method | Description |
|--------|-------------|
| `chat(options)` | Send chat request |
| `stream(options)` | Stream chat response |
| `streamResponse(ctx, options)` | Stream as SSE Response |
| `chatWithTools(options)` | Auto-execute tools |
| `embed(options)` | Generate embeddings |
| `registerTools(...tools)` | Register tools |
| `use(middleware)` | Add middleware |
| `getHistory()` | Get history manager |

### Types

- `Message` - chat message
- `Tool` - tool definition
- `ChatOptions` - chat request options
- `ChatResponse` - chat response
- `StreamChunk` - streaming chunk
- `Middleware` - middleware interface
- `Provider` - provider interface

## License

MIT
