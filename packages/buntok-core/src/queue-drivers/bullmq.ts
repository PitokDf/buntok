import type { QueueDriver, Job, JobHandler, QueueCapabilities } from "../queue";

/**
 * Queue Driver using BullMQ (Redis-backed enterprise queue).
 * Requires `bullmq` as a peer dependency.
 *
 * @example
 * ```ts
 * import { Queue } from "@buntok/core";
 * import { BullmqQueueDriver } from "@buntok/core";
 *
 * const queue = new Queue<{ to: string }>("email", new BullmqQueueDriver({
 *   connection: { host: "localhost", port: 6379 },
 *   defaultJobOptions: {
 *     attempts: 3,
 *     backoff: { type: "exponential", delay: 1000 },
 *   },
 * }));
 * ```
 */
export interface BullmqQueueDriverOptions {
	/** BullMQ connection options */
	connection: {
		host?: string;
		port?: number;
		url?: string;
		[key: string]: unknown;
	};
	/** Queue namespace prefix (default: "buntok:queue") */
	prefix?: string;
	/** Default job options */
	defaultJobOptions?: {
		attempts?: number;
		backoff?: {
			type?: "fixed" | "exponential";
			delay?: number;
		};
		removeOnComplete?: boolean | { age?: number; count?: number };
		removeOnFail?: boolean | { age?: number; count?: number };
	};
}

export class BullmqQueueDriver<T> implements QueueDriver<T> {
	readonly capabilities: QueueCapabilities = {
		durability: "persistent",
		delivery: "at-least-once",
		acknowledgment: "driver",
		crashRecovery: true,
		deadLetter: false,
	};
	private queue: any;
	private worker: any;
	private prefix: string;
	private handlers: JobHandler<T>[] = [];

	constructor(public name: string, private options: BullmqQueueDriverOptions) {
		this.prefix = options.prefix ?? "buntok:queue";
	}

	private async ensureInitialized(): Promise<void> {
		if (this.queue) return;

		try {
			// @ts-ignore - optional peer dependency
			const mod = "bullmq";
			const { Queue: BullmqQueue } = await import(mod);

			const conn = this.options.connection ?? { host: "localhost", port: 6379 };
			const connection = conn.url
				? { connection: { url: conn.url } }
				: { connection: conn };

			this.queue = new BullmqQueue(`${this.prefix}:${this.name}`, {
				...connection,
				defaultJobOptions: {
					attempts: this.options.defaultJobOptions?.attempts ?? 0,
					backoff: this.options.defaultJobOptions?.backoff ?? {
						type: "fixed",
						delay: 1000,
					},
					removeOnComplete: this.options.defaultJobOptions?.removeOnComplete ?? false,
					removeOnFail: this.options.defaultJobOptions?.removeOnFail ?? false,
				},
			});

			if (this.handlers.length > 0) {
				this.startWorker();
			}
		} catch {
			throw new Error("bullmq is required for BullmqQueueDriver. Run 'bun add bullmq'");
		}
	}

	private async startWorker(): Promise<void> {
		if (this.worker) return;

		// @ts-ignore - optional peer dependency
		const mod = "bullmq";
		const { Worker: BullmqWorker } = await import(mod);
		const connection = this.options.connection.url
			? { connection: { url: this.options.connection.url } }
			: { connection: this.options.connection };

		this.worker = new BullmqWorker(`${this.prefix}:${this.name}`, async (job: any) => {
			const jobData: Job<T> = {
				id: job.id?.toString() ?? crypto.randomUUID(),
				data: job.data as T,
				priority: job.opts?.priority ?? 0,
				delay: job.opts?.delay ?? 0,
				attempt: job.attemptsMade ?? 0,
				createdAt: job.timestamp ?? Date.now(),
			};

			for (const handler of this.handlers) {
				await handler(jobData);
			}
		}, connection);
	}

	async add(
		data: T,
		opts: { priority?: number; delay?: number } = {},
	): Promise<void> {
		await this.ensureInitialized();

		await this.queue.add(
			"job",
			data,
			{
				priority: opts.priority,
				delay: opts.delay,
			},
		);
	}

	process(handler: JobHandler<T>): void {
		this.handlers.push(handler);
		this.ensureInitialized().then(() => this.startWorker());
	}

	size(): number | null {
		return null;
	}

	async clear(): Promise<void> {
		if (this.queue) {
			await this.queue.obliterate({ force: true });
		}
	}

	async close(): Promise<void> {
		await this.worker?.close();
		await this.queue?.close();
		this.worker = undefined;
		this.queue = undefined;
	}

	async drain(options?: { timeout?: number }): Promise<void> {
		if (!this.worker) return;
		await this.worker.close(options?.timeout ? { drainDelay: options.timeout / 1000 } : undefined);
	}
}
