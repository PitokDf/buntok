// ─── Built-in Middlewares ─────────────────────────────────────────────────────
// Import via: import { ... } from "@buntok/core/middlewares"
//
// NOTE: cors is NOT here — it stays in core-exports because app.cors() depends on it.

export { auditLog, type AuditLogEntry, type AuditLogOptions } from "./middlewares/audit-log";
export type { BodySizeLimitOptions } from "./middlewares/body-size-limit";
export { bodySizeLimit } from "./middlewares/body-size-limit";
export type { CompressOptions } from "./middlewares/compress";
export { compress } from "./middlewares/compress";
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
export { TimeoutError, timeout } from "./middlewares/timeout";
export { requirePermission, requireRole } from "./middlewares/rbac";
export type { RequirePermissionOptions, RequireRoleOptions } from "./middlewares/rbac";
export {
	circuitBreaker,
	getCircuitBreakers,
	type CircuitBreakerMiddlewareOptions,
} from "./middlewares/circuit-breaker";
