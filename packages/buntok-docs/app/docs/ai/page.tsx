import { Heading } from "@/components/ui/Heading";
import { CodeBlock } from "@/components/ui/CodeBlock";
import { Callout } from "@/components/ui/Callout";

export const metadata = {
  title: "AI Module",
  description: "Stream AI responses with Vercel AI SDK integration and SSE.",
};

export default function AIPage() {
  return (
    <div>
      <Heading
        level={1}
        className="text-4xl font-bold mt-8 mb-4 text-text-primary"
      >
        AI Module
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Built-in AI integration with streaming support, response caching, and
        prompt injection. Works with OpenAI, Anthropic, and any
        OpenAI-compatible API.
      </p>

      {/* ──────────────── STREAM AI ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        streamAI
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Transform any AI stream into a Vercel AI SDK compatible response (Data
        Stream Protocol v1):
      </p>
      <CodeBlock
        code={`import { streamAI } from "@buntok/core";
import OpenAI from "openai";

const openai = new OpenAI();

app.post("/chat", async (ctx) => {
  const { message } = await ctx.body();

  const stream = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [{ role: "user", content: message }],
    stream: true,
  });

  return streamAI(ctx, stream, {
    onCompletion: (fullText) => {
      console.log("Full response:", fullText);
    },
  });
});`}
      />

      <Heading
        level={3}
        className="text-xl font-semibold mt-6 mb-2 text-text-primary"
      >
        streamAI API
      </Heading>
      <div className="my-4 overflow-x-auto">
        <table className="w-full text-sm text-text-secondary border border-border-primary rounded-lg overflow-hidden">
          <thead className="bg-bg-tertiary border-b border-border-primary">
            <tr>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Parameter
              </th>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Type
              </th>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Description
              </th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-border-primary">
              <td className="px-4 py-2 font-mono text-accent">ctx</td>
              <td className="px-4 py-2 font-mono">Context</td>
              <td className="px-4 py-2">Buntok request context</td>
            </tr>
            <tr className="border-b border-border-primary">
              <td className="px-4 py-2 font-mono text-accent">stream</td>
              <td className="px-4 py-2 font-mono">AsyncIterable</td>
              <td className="px-4 py-2">
                AI response stream (OpenAI, Anthropic, etc.)
              </td>
            </tr>
            <tr className="border-b border-border-primary">
              <td className="px-4 py-2 font-mono text-accent">options?</td>
              <td className="px-4 py-2 font-mono">object</td>
              <td className="px-4 py-2">
                <code>onCompletion</code> callback
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <Callout type="info">
        <strong>Supported chunk shapes:</strong>{" "}
        <code>chunk.choices[0].delta.content</code> (OpenAI),{" "}
        <code>chunk.message.content</code> (Anthropic), or plain{" "}
        <code>string</code>. If your AI provider uses a different chunk shape,
        content extraction may fail silently (empty chunks).
      </Callout>

      {/* ──────────────── INJECT SYSTEM PROMPT ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        injectSystemPrompt
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Safely inject a system prompt while removing any existing system
        messages from user input (prevents prompt injection):
      </p>
      <CodeBlock
        code={`import { injectSystemPrompt } from "@buntok/core";

const userMessages = [
  { role: "user", content: "Hello!" },
];

// Inject system prompt (prepends it, removes existing system messages)
const messages = injectSystemPrompt(
  userMessages,
  "You are a helpful assistant. Be concise."
);
// Result:
// [
//   { role: "system", content: "You are a helpful assistant. Be concise." },
//   { role: "user", content: "Hello!" }
// ]`}
      />

      <Callout type="warning">
        <code>injectSystemPrompt</code> removes any <code>role: "system"</code>{" "}
        messages from user input. This prevents users from overriding your
        system prompt.
      </Callout>

      {/* ──────────────── AI CACHE ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        AICache
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Cache AI responses to save costs. Hashes the last few messages to
        generate cache keys:
      </p>
      <CodeBlock
        code={`import { AICache } from "@buntok/core";
import { Cache } from "@buntok/core/cache";

const aiCache = new AICache(new Cache());

app.post("/chat", async (ctx) => {
  const { messages } = await ctx.body();

  // Check cache first
  const cached = await aiCache.get(messages);
  if (cached) {
    return ctx.json({ response: cached, cached: true });
  }

  // Call AI
  const response = await callAI(messages);

  // Cache result (default TTL: 3600s)
  await aiCache.set(messages, response, 3600);

  return ctx.json({ response, cached: false });
});`}
      />

      <Heading
        level={3}
        className="text-xl font-semibold mt-6 mb-2 text-text-primary"
      >
        AICache API
      </Heading>
      <div className="my-4 overflow-x-auto">
        <table className="w-full text-sm text-text-secondary border border-border-primary rounded-lg overflow-hidden">
          <thead className="bg-bg-tertiary border-b border-border-primary">
            <tr>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Method
              </th>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Description
              </th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-border-primary">
              <td className="px-4 py-2 font-mono text-accent">
                aiCache.get(messages)
              </td>
              <td className="px-4 py-2">
                Get cached response (returns null if miss)
              </td>
            </tr>
            <tr className="border-b border-border-primary">
              <td className="px-4 py-2 font-mono text-accent">
                aiCache.set(messages, response, ttl?)
              </td>
              <td className="px-4 py-2">Cache a response</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ──────────────── FULL EXAMPLE ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Full Example
      </Heading>
      <CodeBlock
        code={`import { App } from "@buntok/core";
import { streamAI, injectSystemPrompt, AICache } from "@buntok/core";
import { Cache } from "@buntok/core/cache";
import OpenAI from "openai";

const app = new App();
const openai = new OpenAI();
const aiCache = new AICache(new Cache());

const SYSTEM_PROMPT = "You are a helpful coding assistant. Be concise.";

app.post("/chat", async (ctx) => {
  const { messages } = await ctx.body();

  // Inject system prompt safely
  const safeMessages = injectSystemPrompt(messages, SYSTEM_PROMPT);

  // Check cache
  const cached = await aiCache.get(safeMessages);
  if (cached) {
    return ctx.json({ response: cached, cached: true });
  }

  // Stream response
  const stream = await openai.chat.completions.create({
    model: "gpt-4",
    messages: safeMessages,
    stream: true,
  });

  return streamAI(ctx, stream, {
    onCompletion: async (fullText) => {
      await aiCache.set(safeMessages, fullText);
    },
  });
});

app.listen(1212);`}
      />
    </div>
  );
}
