import type { QueueDriver, Job, JobHandler, QueueCapabilities, QueueOptions } from "../queue";

/**
 * Queue Driver using RabbitMQ (AMQP).
 * Requires `amqplib` as a peer dependency.
 *
 * @example
 * ```ts
 * import { Queue } from "@buntok/core";
 * import { RabbitmqQueueDriver } from "@buntok/core";
 *
 * const queue = new Queue<{ to: string }>("email", new RabbitmqQueueDriver({
 *   url: "amqp://guest:guest@localhost:5672",
 *   prefetch: 1,
 * }));
 * ```
 */
export interface RabbitmqQueueDriverOptions {
	/** AMQP connection URL */
	url: string;
	/** Queue name (default: uses queue name from Queue constructor) */
	queue?: string;
	/** Whether queue survives broker restart (default: true) */
	durable?: boolean;
	/** Max unacknowledged messages per consumer (default: 1) */
	prefetch?: number;
	/** Max retry attempts (default: 0) */
	maxRetries?: number;
	/** Base retry delay in ms (default: 1000) */
	retryDelay?: number;
	/** Backoff strategy (default: "fixed") */
	backoff?: "fixed" | "exponential";
}

export class RabbitmqQueueDriver<T> implements QueueDriver<T> {
	readonly capabilities: QueueCapabilities = {
		durability: "persistent",
		delivery: "at-least-once",
		acknowledgment: "driver",
		crashRecovery: true,
		deadLetter: false,
	};
	private connection: any = null;
	private channel: any = null;
	private queueName: string;
	private opts: Required<Omit<RabbitmqQueueDriverOptions, "url" | "queue">>;
	private handlers: JobHandler<T>[] = [];
	private isProcessing = false;
	private consumerTag?: string;
	private closed = false;

	constructor(public name: string, private options: RabbitmqQueueDriverOptions) {
		this.queueName = options.queue ?? name;
		this.opts = {
			durable: options.durable ?? true,
			prefetch: options.prefetch ?? 1,
			maxRetries: options.maxRetries ?? 0,
			retryDelay: options.retryDelay ?? 1000,
			backoff: options.backoff ?? "fixed",
		};
	}

	private async ensureConnected(): Promise<void> {
		if (this.closed) return;
		if (this.channel) return;

		try {
			const mod = "amqplib";
			const amqp = await import(mod);
			this.connection = await amqp.connect(this.options.url ?? "amqp://localhost");
			this.channel = await this.connection.createChannel();

			await this.channel.assertQueue(this.queueName, {
				durable: this.opts.durable,
			});

			await this.channel.prefetch(this.opts.prefetch);

			// Handle connection errors
			this.connection.on("error", (err: Error) => {
				console.error(`[Queue:${this.name}] RabbitMQ connection error:`, err);
			});

			this.connection.on("close", () => {
				console.warn(`[Queue:${this.name}] RabbitMQ connection closed, reconnecting...`);
				this.channel = null;
				this.connection = null;
				setTimeout(() => this.ensureConnected(), 5000);
			});
		} catch {
			throw new Error("amqplib is required for RabbitmqQueueDriver. Run 'bun add amqplib'");
		}
	}

	async add(
		data: T,
		opts: { priority?: number; delay?: number } = {},
	): Promise<void> {
		await this.ensureConnected();

		const job: Job<T> = {
			id: crypto.randomUUID(),
			data,
			priority: opts.priority ?? 0,
			delay: opts.delay ?? 0,
			attempt: 0,
			createdAt: Date.now(),
		};

		const message = Buffer.from(JSON.stringify(job));

		this.channel.sendToQueue(
			this.queueName,
			message,
			{
				persistent: this.opts.durable,
				messageId: job.id,
				timestamp: job.createdAt,
				priority: job.priority,
				deliveryMode: this.opts.durable ? 2 : undefined,
			},
		);
	}

	process(handler: JobHandler<T>): void {
		this.handlers.push(handler);
		this.startConsumer();
	}

	size(): number | null {
		return null;
	}

	async clear(): Promise<void> {
		if (this.channel) {
			await this.channel.deleteQueue(this.queueName);
			await this.channel.assertQueue(this.queueName, {
				durable: this.opts.durable,
			});
		}
	}

	private async startConsumer(): Promise<void> {
		await this.ensureConnected();

		this.channel.consume(this.queueName, async (msg: any) => {
			if (!msg) return;

			const job: Job<T> = JSON.parse(msg.content.toString());

			try {
				for (const handler of this.handlers) {
					await handler(job);
				}
				this.channel.ack(msg);
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

					// Requeue with incremented attempt
					setTimeout(() => {
						const retryJob = { ...job, attempt: nextAttempt };
						const message = Buffer.from(JSON.stringify(retryJob));
						this.channel.sendToQueue(this.queueName, message, {
							persistent: this.opts.durable,
							messageId: retryJob.id,
							timestamp: retryJob.createdAt,
							priority: retryJob.priority,
							deliveryMode: this.opts.durable ? 2 : undefined,
						});
					}, delay);

					this.channel.nack(msg, false, false);
				} else {
					console.error(
						`[Queue:${this.name}] Job ${job.id} permanently failed after ${nextAttempt} attempt(s):`,
						err,
					);
					// Dead letter
					this.channel.nack(msg, false, false);
				}
			}
		}).then((result: { consumerTag: string }) => {
			this.consumerTag = result.consumerTag;
		});
	}

	async close(): Promise<void> {
		if (this.closed) return;
		this.closed = true;
		if (this.channel && this.consumerTag) {
			await this.channel.cancel(this.consumerTag).catch(() => undefined);
		}
		await this.channel?.close().catch(() => undefined);
		await this.connection?.close().catch(() => undefined);
		this.channel = null;
		this.connection = null;
	}

	async drain(options?: { timeout?: number }): Promise<void> {
		if (!this.channel || this.closed) return;
		const deadline = options?.timeout ? Date.now() + options.timeout : Date.now() + 30_000;
		while (Date.now() < deadline) {
			const remaining = deadline - Date.now();
			if (remaining <= 0) break;
			const msg = await Promise.race([
				this.channel.get(this.queueName),
				new Promise<false>((resolve) => setTimeout(() => resolve(false), Math.min(remaining, 100))),
			]);
			if (!msg) break;
			this.channel.ack(msg);
		}
	}
}
