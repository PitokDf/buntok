// VERSION
export { VERSION } from "./version";

// NOTE: This is the SLIM root entry — it only re-exports lightweight core
// modules to keep cold start fast and work well on serverless platforms
// (Vercel, etc.). Heavy/feature modules live behind subpath exports:
//
//	import { CronJob }        from "@buntok/core/schedule"
//	import { Queue }          from "@buntok/core/queue"
//	import { SSE }            from "@buntok/core/sse"
//	import { uploader }       from "@buntok/core/upload"
//	import { Mailer }         from "@buntok/core/mailer"
//	import { TemplateEngine } from "@buntok/core/template"
//	import { Metrics }        from "@buntok/core/metrics"
//	import { createOAuth }    from "@buntok/core/oauth"
//	import { z, zValidator }  from "@buntok/core/middlewares/validator"
//	import { createPayment }  from "@buntok/core/payment"
//	import { Room, wsAuth }   from "@buntok/core/ws-helpers"
//
// Full backward-compatible namespace: import from "@buntok/core/all"

// AOT / Sucrose
export {
	analyzeHandler,
	analyzeHandlerChain,
} from "./aot/sucrose";
export type { HandlerAnalysis } from "./aot/sucrose";
// AI
export {
	AICache,
	injectSystemPrompt,
	streamAI,
} from "./ai";
export type {
	EnvValidationOptions,
	ErrorHandler,
	ExtractParams,
	Handler,
	HandlerReturn,
	Middleware,
	NotFoundHandler,
	RouteContext,
	WSData,
	WSHandler,
	ZodCtx,
} from "./app";
export { App, type ApiDocsOptions, type AppOptions, type DisposableResource, type StaticOptions, type WSOptions, type RouteDebugInfo } from "./app";
// Auth
export { JwtService, requireAuth, type JwtOptions } from "./auth";
export { redactLogMeta, type LoggerOptions } from "./logger";
// Factory
export { Factory } from "./factory";
// Base classes
export { BaseController } from "./base-controller";
export { BaseService } from "./base-service";
// Cache
export { Cache, type CacheDriver, MemoryCacheDriver } from "./cache";
export {
	type ClassProvider,
	Container,
	Dependencies,
	type FactoryProvider,
	type Provider,
	type Scope,
	type ValueProvider,
} from "./container";
export { Context } from "./context";
export type { ControllerMeta, RouteMeta } from "./decorators";
// Emitter
export { emitter, EventEmitter } from "./emitter";
export type { AppEvents, EmitOptions, EventEmitterOptions } from "./emitter";
// Decorators
export {
	All,
	Controller,
	Delete,
	Get,
	type GuardFn,
	Head,
	Options,
	Patch,
	Post,
	Put,
	Query,
	Use,
	UseGuard,
	UseGuards,
	SetMetadata,
	Public,
	HttpCode,
	SetHeader,
	Header,
	Redirect,
	Version,
	applyDecorators,
	getMetadata,
} from "./decorators";
// Native FFI (lazy-loaded, safe on serverless)
export { getBackend, isNativeAvailable } from "./ffi";
export type { RetryOptions } from "./helpers/async";
// Async helpers
export { delay, retry } from "./helpers/async";
// Response helpers
export { toResponse, toResponseMaybeAsync } from "./helpers/response";
// Error helpers
export {
	asyncHandler,
	BadRequestError,
	ConflictError,
	ForbiddenError,
	HttpError,
	InternalServerError,
	MethodNotAllowedError,
	NotFoundError,
	ServiceUnavailableError,
	TooManyRequestsError,
	UnauthorizedError,
	UnprocessableEntityError,
} from "./helpers/async-handler";
export type { CookieOptions } from "./helpers/cookie";
// Cookie helpers
export {
	deleteCookie,
	getCookie,
	getCookies,
	parseCookies,
	serializeCookie,
	setCookie,
} from "./helpers/cookie";
// Crypto helpers
export {
	decrypt,
	encrypt,
	fastHash,
	hash,
	hashVerify,
	hmac,
	md5,
	randomAlphaNumeric,
	randomBytes,
	randomHex,
	randomToken,
	sha256,
	sha512,
} from "./helpers/crypto";
// Date helpers
export {
	addDays,
	daysBetween,
	endOfDay,
	formatDate,
	formatDuration,
	isAfter,
	isBefore,
	startOfDay,
	timeAgo,
} from "./helpers/date";
// Timezone helpers
export {
	formatGroupLabel,
	formatInTimezone,
	getGroupLabels,
	getTimezoneOffset,
	getTimezoneOffsetString,
	groupByTimezone,
	isValidTimezone,
	nowInTimezone,
	parseTime,
	toISOWithTimezone,
	toTimezoneParts,
} from "./helpers/timezone";
export type { GroupByKey, GroupByTimezoneOptions } from "./helpers/timezone";
// ID helpers
export {
	generateCode,
	nanoid,
	resetCounter,
	ulid,
} from "./helpers/id";
// Network helpers
export { getClientIP, isPrivateIP, parseUserAgent, type TrustedProxyOptions } from "./helpers/network";
// Number helpers
export {
	clamp,
	formatBytes,
	formatCurrency,
	formatNumber,
	random,
	randomFloat,
} from "./helpers/number";
// Object helpers
export {
	chunk,
	deepMerge,
	flatten,
	flattenObject,
	groupBy,
	omit,
	pick,
	uniq,
} from "./helpers/object";
// Password helpers
export { hashPassword, verifyPassword } from "./helpers/password";
// Avatar helpers
export {
	generateInitials,
	avatarColor,
	generateInitialAvatar,
	type InitialAvatarOptions,
} from "./helpers/avatar";
// File helpers
export {
	serveFileOrFallback,
	type ServeFileOptions,
} from "./helpers/file";
// Download helpers
export {
	downloadFile,
	downloadBuffer,
	type DownloadOptions,
} from "./helpers/download";
// Export helpers
export {
	exportCSV,
	exportJSON,
	type CSVOptions,
} from "./helpers/export";
// Archive helpers
export {
	createZIP,
	type ZIPEntry,
	type ArchiveOptions,
} from "./helpers/archive";
// String helpers
export {
	camelCase,
	capitalize,
	kebabCase,
	slugify,
	snakeCase,
	truncate,
} from "./helpers/string";
// Logger
export { Logger, LogLevel, logger } from "./logger";
// Middlewares (lightweight, no zod)
export { auditLog, type AuditLogEntry, type AuditLogOptions } from "./middlewares/audit-log";
export type { BodySizeLimitOptions } from "./middlewares/body-size-limit";
export { bodySizeLimit } from "./middlewares/body-size-limit";
export type { CompressOptions } from "./middlewares/compress";
export { compress } from "./middlewares/compress";
export type { CorsOptions } from "./middlewares/cors";
export { cors } from "./middlewares/cors";
export type {
	HealthCheckOptions,
	HealthStatus,
	ReadinessCheck,
	ReadinessOptions,
} from "./middlewares/health-check";
export {
	createDatabaseCheck,
	createHealthCheck,
	healthCheck,
	livenessCheck,
	readinessCheck,
	runReadinessChecks,
} from "./middlewares/health-check";
export type { HelmetOptions } from "./middlewares/helmet";
export { helmet } from "./middlewares/helmet";
export type { RateLimiterOptions } from "./middlewares/rate-limiter";
export {
	rateLimiter,
	slidingWindowRateLimiter,
	sqliteStore,
} from "./middlewares/rate-limiter";
export type { RequestIdOptions } from "./middlewares/request-id";
export { requestId, shortId, uuid } from "./middlewares/request-id";
export type { ResponseTimeOptions } from "./middlewares/response-time";
export { responseTime } from "./middlewares/response-time";
// Timeout
export { TimeoutError, timeout } from "./middlewares/timeout";
// RBAC
export { requirePermission, requireRole } from "./middlewares/rbac";
export type { RequirePermissionOptions, RequireRoleOptions } from "./middlewares/rbac";
// Router
export { Router } from "./router";
// Plugin system
export { createPlugin } from "./plugin";
export type { Plugin } from "./plugin";
// Enhanced client
export { createClient, ClientError } from "./client";
export type {
	CreateClientOptions,
	RouteContract,
} from "./client";
// Circuit Breaker
export {
	CircuitBreaker,
	CircuitOpenError,
	type CircuitBreakerOptions,
	type CircuitBreakerMetrics,
	type CircuitEvent,
	type CircuitState,
	type CircuitBreakerFireOptions,
} from "./circuit-breaker";