// VERSION
export { VERSION } from "./version";

// AOT / Sucrose
export {
	analyzeHandler,
	analyzeHandlerChain,
} from "./aot/sucrose";
export type { HandlerAnalysis } from "./aot/sucrose";

// App (core framework types + class)
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

// Logger
export { Logger, LogLevel, logger, redactLogMeta, type LoggerOptions } from "./logger";

// Context
export { Context } from "./context";

// Router
export { Router } from "./router";

// Container (IoC)
export {
	type ClassProvider,
	Container,
	Dependencies,
	type FactoryProvider,
	type Provider,
	type Scope,
	type ValueProvider,
} from "./container";

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
export type { ControllerMeta, RouteMeta } from "./decorators";

// Native FFI
export { getBackend, isNativeAvailable } from "./ffi";

// SSE (used by context.ts)
export type { SSEBroadcasterOptions, SSEHistoryStore, SSEMessage, SSEOptions, SSEPubSub } from "./sse";
export { MemorySSEHistory, MemorySSEPubSub, SSE, SSEBroadcaster, createSSE } from "./sse";

// Plugin system
export { createPlugin } from "./plugin";
export type { Plugin } from "./plugin";

// CORS middleware (used by app.cors())
export type { CorsOptions } from "./middlewares/cors";
export { cors } from "./middlewares/cors";

// Core helpers (only those used by framework internals)
export { asyncHandler, HttpError, NotFoundError, BadRequestError } from "./helpers/async-handler";
export { toResponse, toResponseMaybeAsync } from "./helpers/response";
export { getClientIP, type TrustedProxyOptions } from "./helpers/network";

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
