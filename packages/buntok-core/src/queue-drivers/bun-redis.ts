import type { QueueDriver, Job, JobHandler, QueueCapabilities, QueueOptions } from "../queue";

/**
 * Queue Driver using Bun's native Redis client (built-in, zero dependencies).
 * Requires Bun >= 1.3.0.
 *
 * @example
 * ```ts
 * import { Queue } from "@buntok/core";
 * import { BunRedisQueueDriver } from "@buntok/core";
 *
 * const queue = new Queue<{ to: string }>("email", new BunRedisQueueDriver({
 *   url: "redis://localhost:6379",
 * }));
 * ```
 */
export interface BunRedisQueueDriverOptions {
	/** Bun.RedisClient instance */
	client?: any;
	/** Redis connection URL (used if client not provided) */
	url?: string;
	/** Queue namespace prefix (default: "buntok:queue") */
	prefix?: string;
	/** Max retry attempts (default: 0) */
	maxRetries?: number;
	/** Base retry delay in ms (default: 1000) */
	retryDelay?: number;
	/** Backoff strategy (default: "fixed") */
	backoff?: "fixed" | "exponential";
}

export class BunRedisQueueDriver<T> implements QueueDriver<T> {
	readonly capabilities: QueueCapabilities = {
		durability: "persistent",
		delivery: "at-least-once",
		acknowledgment: "driver",
		crashRecovery: false,
		deadLetter: false,
	};
	private redis: any;
	private prefix: string;
	private opts: Required<Omit<BunRedisQueueDriverOptions, "client" | "url" | "prefix"> & { prefix: string }>;
	private handlers: JobHandler<T>[] = [];
	private isProcessing = false;
	private pollTimer: ReturnType<typeof setInterval> | null = null;
	private closed = false;

	constructor(public name: string, options: BunRedisQueueDriverOptions = {}) {
		this.prefix = options.prefix ?? "buntok:queue";
		this.opts = {
			maxRetries: options.maxRetries ?? 0,
			retryDelay: options.retryDelay ?? 1000,
			backoff: options.backoff ?? "fixed",
			prefix: this.prefix,
		};

		if (options.client) {
			this.redis = options.client;
		} else if (options.url) {
			const BunRedis = (globalThis as any).Bun?.RedisClient;
			if (BunRedis) {
				this.redis = new BunRedis(options.url);
			} else {
				throw new Error("Bun.RedisClient is not available. Requires Bun >= 1.3.0");
			}
		} else {
			throw new Error("BunRedisQueueDriver requires either 'client' or 'url' option");
		}
	}

	private get queueKey(): string {
		return `${this.prefix}:${this.name}:ready`;
	}

	private get delayedKey(): string {
		return `${this.prefix}:${this.name}:delayed`;
	}

	private get processingKey(): string {
		return `${this.prefix}:${this.name}:processing`;
	}

	async add(
		data: T,
		opts: { priority?: number; delay?: number } = {},
	): Promise<void> {
		if (this.closed) throw new Error(`Queue ${this.name} is closed`);
		const job: Job<T> = {
			id: crypto.randomUUID(),
			data,
			priority: opts.priority ?? 0,
			delay: opts.delay ?? 0,
			attempt: 0,
			createdAt: Date.now(),
		};

		const jobJson = JSON.stringify(job);

		if (job.delay > 0) {
			const processAt = Date.now() + job.delay;
			await this.redis.send("ZADD", [this.delayedKey, processAt.toString(), jobJson]);
		} else {
			const score = job.createdAt - job.priority * 1000000;
			await this.redis.send("ZADD", [this.queueKey, score.toString(), jobJson]);
		}

		this.pump();
	}

	process(handler: JobHandler<T>): void {
		this.handlers.push(handler);
		this.startPolling();
	}

	size(): number | null {
		return null;
	}

	clear(): void {
		this.redis.send("DEL", [this.queueKey, this.delayedKey, this.processingKey]);
	}

	private startPolling(): void {
		if (this.pollTimer) return;
		this.pollTimer = setInterval(() => this.moveToReady(), 1000);
	}

	async close(): Promise<void> {
		if (this.closed) return;
		this.closed = true;
		if (this.pollTimer) {
			clearInterval(this.pollTimer);
			this.pollTimer = null;
		}
		await this.redis?.close?.().catch(() => undefined);
	}

	async drain(options?: { timeout?: number }): Promise<void> {
		if (!this.redis || this.closed) return;
		const deadline = options?.timeout ? Date.now() + options.timeout : Date.now() + 30_000;
		while (Date.now() < deadline) {
			const remaining = deadline - Date.now();
			if (remaining <= 0) break;
			const result = await Promise.race([
				this.redis.send("ZPOPMIN", [this.queueKey, "1"]),
				new Promise<never>((_, reject) => setTimeout(() => reject(new Error("drain timeout")), remaining)),
			]).catch(() => null);
			if (!result || result.length === 0) break;
			await new Promise((r) => setTimeout(r, 0));
		}
	}

	private async moveToReady(): Promise<void> {
		const now = Date.now();
		const jobs = await this.redis.send("ZRANGEBYSCORE", [
			this.delayedKey,
			"-inf",
			now.toString(),
			"LIMIT",
			"0",
			"50",
		]);

		if (!jobs || jobs.length === 0) return;

		const pipeline = this.redis.pipeline();
		for (const jobJson of jobs) {
			const job = JSON.parse(jobJson) as Job<T>;
			const score = job.createdAt - job.priority * 1000000;
			pipeline.send("ZADD", [this.queueKey, score.toString(), jobJson]);
			pipeline.send("ZREM", [this.delayedKey, jobJson]);
		}
		await pipeline.exec();
	}

	private async pump(): Promise<void> {
		if (this.isProcessing || this.handlers.length === 0) return;
		this.isProcessing = true;

		while (true) {
			const result = await this.redis.send("ZPOPMIN", [this.queueKey, "1"]);
			if (!result || result.length === 0) break;

			const [jobJson] = result;
			const job = JSON.parse(jobJson) as Job<T>;

			await this.redis.send("SADD", [this.processingKey, jobJson]);

			for (const handler of this.handlers) {
				try {
					await handler(job);
				} catch (err) {
					const nextAttempt = job.attempt + 1;
					if (nextAttempt <= this.opts.maxRetries) {
						const delay =
							this.opts.backoff === "exponential"
								? this.opts.retryDelay * 2 ** job.attempt
								: this.opts.retryDelay;

						console.warn(
							`[Queue:${this.name}] Job ${job.id} failed (attempt ${nextAttempt}/${this.opts.maxRetries + 1}), retrying in ${delay}ms…`,
							err,
						);

						const processAt = Date.now() + delay;
						await this.redis.send("ZADD", [
							this.delayedKey,
							processAt.toString(),
							JSON.stringify({ ...job, attempt: nextAttempt }),
						]);
					} else {
						console.error(
							`[Queue:${this.name}] Job ${job.id} permanently failed after ${nextAttempt} attempt(s):`,
							err,
						);
					}
				}
			}

			await this.redis.send("SREM", [this.processingKey, jobJson]);
			await new Promise((resolve) => setTimeout(resolve, 0));
		}

		this.isProcessing = false;
	}
}
