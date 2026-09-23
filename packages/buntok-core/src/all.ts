// Full backward-compatible namespace.
// Re-exports everything from the slim root PLUS feature modules that moved to
// subpath-only imports. Use `@buntok/core/all` when you want the old single
// barrel behavior (slower cold start).

export * from "./core-exports";

// Queue
export {
	type Job,
	type JobHandler,
	MemoryQueueDriver,
	Queue,
	type QueueDriver,
	type QueueCapabilities,
	type QueueDriverOptions,
	type QueueOptions,
	type RedisDriverOptions,
	type BunRedisDriverOptions,
	type BullmqDriverOptions,
	type RabbitmqDriverOptions,
} from "./queue";
export {
	RedisQueueDriver,
	type RedisQueueDriverOptions,
	BunRedisQueueDriver,
	type BunRedisQueueDriverOptions,
	BullmqQueueDriver,
	type BullmqQueueDriverOptions,
	RabbitmqQueueDriver,
	type RabbitmqQueueDriverOptions,
} from "./queue-drivers";
// Scheduler / CronJob
export {
	BunCronSchedulerDriver,
	CronJob,
	MemorySchedulerDriver,
	Scheduler,
	type SchedulerDriver,
	setDefaultSchedulerDriver,
} from "./schedule";
// SSE
export type { SSEBroadcasterOptions, SSEHistoryStore, SSEMessage, SSEOptions, SSEPubSub } from "./sse";
export { MemorySSEHistory, MemorySSEPubSub, SSE, SSEBroadcaster, createSSE } from "./sse";
// Upload
export type {
	ImageUploadedFile,
	ParseUploadResult,
	StorageDriver,
	UploadedFile,
	UploadFieldConfig,
	UploadOptions,
} from "./upload";
export {
	deleteUploadedFile,
	LocalDiskStorage,
	MemoryStorage,
	handleUploads,
	uploader,
} from "./upload";
// Mailer
export { Mailer, type MailerConfig, type MailOptions, type MailAttachment } from "./mailer";
// Template Engine
export {
	TemplateEngine,
	render,
	registerHelper,
	registerPartial,
	type TemplateOptions,
	type HelperFn,
} from "./template";
// Metrics
export { Metrics, metricsEndpoint, metricsMiddleware, type MetricSnapshot } from "./metrics";