import { describe, it, expect, beforeEach } from "bun:test";
import { streamAI, injectSystemPrompt, AICache } from "../src/ai";
import { MemoryCacheDriver } from "../src/cache";

// ─── streamAI ───────────────────────────────────────────────────────────────────

describe("streamAI", () => {
	const mockCtx = {} as any;

	it("should return a Response with correct headers", async () => {
		const stream = (async function* () {
			yield { choices: [{ delta: { content: "Hello" } }] };
		})();

		const response = streamAI(mockCtx, stream);
		expect(response).toBeInstanceOf(Response);
		expect(response.headers.get("x-vercel-ai-data-stream")).toBe("v1");
		expect(response.headers.get("Cache-Control")).toBe("no-cache, no-transform");
	});

	it("should transform OpenAI chunks to data stream protocol", async () => {
		const chunks = [
			{ choices: [{ delta: { content: "Hello" } }] },
			{ choices: [{ delta: { content: " " } }] },
			{ choices: [{ delta: { content: "world" } }] },
		];

		const stream = (async function* () {
			for (const chunk of chunks) yield chunk;
		})();

		const response = streamAI(mockCtx, stream);
		const text = await response.text();

		expect(text).toContain('0:"Hello"');
		expect(text).toContain('0:" "');
		expect(text).toContain('0:"world"');
		expect(text).toContain('d:{"finishReason":"stop"}');
	});

	it("should handle string chunks", async () => {
		const stream = (async function* () {
			yield "Hello";
			yield " ";
			yield "world";
		})();

		const response = streamAI(mockCtx, stream);
		const text = await response.text();

		expect(text).toContain('0:"Hello"');
		expect(text).toContain('0:"world"');
	});

	it("should call onCompletion callback", async () => {
		let completedText = "";
		const stream = (async function* () {
			yield { choices: [{ delta: { content: "Hi" } }] };
		})();

		const response = streamAI(mockCtx, stream, {
			onCompletion: (text) => {
				completedText = text;
			},
		});

		await response.text();
		expect(completedText).toBe("Hi");
	});

	it("should handle empty stream", async () => {
		const stream = (async function* () {})();
		const response = streamAI(mockCtx, stream);
		const text = await response.text();

		expect(text).toContain('d:{"finishReason":"stop"}');
	});

	it("should handle errors gracefully", async () => {
		const stream = (async function* () {
			throw new Error("Stream error");
		})();

		const response = streamAI(mockCtx, stream);
		const text = await response.text();

		expect(text).toContain("e:");
		expect(text).toContain("Stream error");
	});

	it("should throw for non-AsyncIterable", async () => {
		const response = streamAI(mockCtx, "not an iterable" as any);
		const text = await response.text();

		expect(text).toContain("e:");
	});
});

// ─── injectSystemPrompt ─────────────────────────────────────────────────────────

describe("injectSystemPrompt", () => {
	it("should inject system prompt at the top", () => {
		const messages = [
			{ role: "user", content: "Hello" },
			{ role: "assistant", content: "Hi there" },
		];

		const result = injectSystemPrompt(messages, "You are a helpful assistant");
		expect(result[0]).toEqual({ role: "system", content: "You are a helpful assistant" });
		expect(result.length).toBe(3);
	});

	it("should remove existing system messages", () => {
		const messages = [
			{ role: "system", content: "Malicious prompt" },
			{ role: "user", content: "Hello" },
		];

		const result = injectSystemPrompt(messages, "Safe system prompt");
		expect(result[0]).toEqual({ role: "system", content: "Safe system prompt" });
		expect(result.length).toBe(2);
	});

	it("should handle empty messages", () => {
		const result = injectSystemPrompt([], "System prompt");
		expect(result).toEqual([{ role: "system", content: "System prompt" }]);
	});

	it("should handle multiple system messages", () => {
		const messages = [
			{ role: "system", content: "Old prompt 1" },
			{ role: "system", content: "Old prompt 2" },
			{ role: "user", content: "Hello" },
		];

		const result = injectSystemPrompt(messages, "New prompt");
		const systemMessages = result.filter((m: any) => m.role === "system");
		expect(systemMessages.length).toBe(1);
		expect(systemMessages[0].content).toBe("New prompt");
	});
});

// ─── AICache ────────────────────────────────────────────────────────────────────

describe("AICache", () => {
	let cache: AICache;
	let driver: MemoryCacheDriver;

	beforeEach(() => {
		driver = new MemoryCacheDriver();
		cache = new AICache(driver);
	});

	it("should return null for cache miss", async () => {
		const result = await cache.get([
			{ role: "user", content: "Hello" },
		]);
		expect(result).toBeNull();
	});

	it("should cache and retrieve AI responses", async () => {
		const messages = [
			{ role: "user", content: "What is 2+2?" },
		];

		await cache.set(messages, "4");
		const result = await cache.get(messages);
		expect(result).toBe("4");
	});

	it("should use custom TTL", async () => {
		const messages = [{ role: "user", content: "test" }];
		await cache.set(messages, "response", -1); // already expired
		const result = await cache.get(messages);
		expect(result).toBeNull();
	});

	it("should only consider last 3 user/assistant messages for key", async () => {
		const messages1 = [
			{ role: "system", content: "different system" },
			{ role: "user", content: "Hello" },
			{ role: "assistant", content: "Hi" },
			{ role: "user", content: "Bye" },
		];
		const messages2 = [
			{ role: "system", content: "other system" },
			{ role: "user", content: "Hello" },
			{ role: "assistant", content: "Hi" },
			{ role: "user", content: "Bye" },
		];

		await cache.set(messages1, "response1");
		const result = await cache.get(messages2);
		// Same last 3 user/assistant messages + system messages ignored = same key
		expect(result).toBe("response1");
	});

	it("should ignore system messages in cache key", async () => {
		const messages1 = [
			{ role: "system", content: "Different system prompt" },
			{ role: "user", content: "Hello" },
		];
		const messages2 = [
			{ role: "system", content: "Another system prompt" },
			{ role: "user", content: "Hello" },
		];

		await cache.set(messages1, "cached response");
		const result = await cache.get(messages2);
		expect(result).toBe("cached response");
	});
});
