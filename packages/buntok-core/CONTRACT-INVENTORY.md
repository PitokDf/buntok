# Public API Inventory - @buntok/core

Generated: 2026-09-11
Scope: `packages/buntok-core/src/core-exports.ts` + all subpath exports

## Package Exports

| Subpath | Entry | CJS | Types |
|---------|-------|-----|-------|
| `.` | `.js` | `.cjs` | `.d.ts` / `.d.cts` |
| `./client` | `./client/index.js` | `./client/index.cjs` | `.d.ts` / `.d.cts` |
| `./dev` | `./dev/index.js` | - | `.d.ts` |
| `./plugins/graphql` | `./plugins/graphql/index.js` | `./plugins/graphql/index.cjs` | `.d.ts` / `.d.cts` |
| `./plugins/graphql/apollo` | `./plugins/graphql/apollo/index.js` | `./plugins/graphql/apollo/index.cjs` | `.d.ts` / `.d.cts` |
| `./plugins/graphql/yoga` | `./plugins/graphql/yoga/index.js` | `./plugins/graphql/yoga/index.cjs` | `.d.ts` / `.d.cts` |
| `./plugins/opentelemetry` | `./plugins/opentelemetry.js` | `./plugins/opentelemetry.cjs` | `.d.ts` / `.d.cts` |

## CLI Commands

| Command | Source | Status |
|---------|--------|--------|
| `buntok init` | `src/cli/commands/init.ts` | Verified |
| `buntok create` | `src/cli/commands/create.ts` | Verified |
| `buntok build` | `src/cli/commands/build.ts` | Verified |
| `buntok start` | `src/cli/commands/start.ts` | Verified |
| `buntok check` | `src/cli/commands/check.ts` | Verified |
| `buntok dev` | `src/cli/commands/dev.ts` | Verified |
| `buntok debug:routes` | `src/cli/commands/debug-routes.ts` | Verified |
| `buntok db` | `src/cli/commands/db.ts` | Verified |
| `buntok make:middleware` | `src/cli/commands/make-middleware.ts` | Verified |
| `buntok make:factory` | `src/cli/commands/make-factory.ts` | Verified |
| `buntok make:seeder` | `src/cli/commands/make-seeder.ts` | Verified |
| `buntok make:test` | `src/cli/commands/make-test.ts` | Verified |
| `buntok make:test:e2e` | `src/cli/commands/make-test-e2e.ts` | Verified |
| `buntok make:docs` | `src/cli/commands/make-docs.ts` | Verified |

## Core Exports (by category)

### App & Context
| Export | Kind | Source | Verified |
|--------|------|--------|----------|
| `App` | class | `app.ts` | ✅ |
| `Context` | class | `context.ts` | ✅ |
| `VERSION` | const | `core-exports.ts` | ✅ |
| `z` (from Zod) | re-export | `zod` | ✅ |

### AOT / Sucrose
| Export | Kind | Source | Verified |
|--------|------|--------|----------|
| `analyzeHandler` | function | `aot/sucrose.ts` | ✅ |
| `analyzeHandlerChain` | function | `aot/sucrose.ts` | ✅ |

### Auth
| Export | Kind | Source | Verified |
|--------|------|--------|----------|
| `JwtService` | class | `auth.ts` | ✅ |
| `requireAuth` | middleware | `auth.ts` | ✅ |

### Container / DI
| Export | Kind | Source | Verified |
|--------|------|--------|----------|
| `Container` | class | `container.ts` | ✅ |
| `Dependencies` | decorator | `container.ts` | ✅ |

### Decorators
| Export | Kind | Source | Verified |
|--------|------|--------|----------|
| `All` | decorator | `decorators.ts` | ⚠️ See MISMATCHES |
| `Controller` | decorator | `decorators.ts` | ✅ |
| `Delete` | decorator | `decorators.ts` | ✅ |
| `Get` | decorator | `decorators.ts` | ✅ |
| `Head` | decorator | `decorators.ts` | ✅ |
| `Options` | decorator | `decorators.ts` | ✅ |
| `Patch` | decorator | `decorators.ts` | ✅ |
| `Post` | decorator | `decorators.ts` | ✅ |
| `Put` | decorator | `decorators.ts` | ✅ |
| `Query` | decorator | `decorators.ts` | ✅ |
| `Use` | decorator | `decorators.ts` | ✅ |
| `UseGuard` | decorator | `decorators.ts` | ✅ |
| `UseGuards` | decorator (deprecated) | `decorators.ts` | ✅ |
| `SetMetadata` | decorator | `decorators.ts` | ✅ |
| `Public` | decorator | `decorators.ts` | ✅ |
| `HttpCode` | decorator | `decorators.ts` | ✅ |
| `SetHeader` | decorator | `decorators.ts` | ✅ |
| `Header` | decorator | `decorators.ts` | ✅ |
| `Redirect` | decorator | `decorators.ts` | ⚠️ See MISMATCHES |
| `Version` | decorator | `decorators.ts` | ✅ |
| `applyDecorators` | function | `decorators.ts` | ✅ |
| `getMetadata` | function | `decorators.ts` | ✅ |

### Helpers - Async
| Export | Kind | Source | Verified |
|--------|------|--------|----------|
| `delay` | function | `helpers/async.ts` | ✅ |
| `retry` | function | `helpers/async.ts` | ✅ |
| `asyncHandler` | function | `helpers/async-handler.ts` | ✅ |

### Helpers - Error Classes
| Export | Kind | Source | Verified |
|--------|------|--------|----------|
| `BadRequestError` | class | `helpers/async-handler.ts` | ✅ |
| `ConflictError` | class | `helpers/async-handler.ts` | ✅ |
| `ForbiddenError` | class | `helpers/async-handler.ts` | ✅ |
| `HttpError` | class | `helpers/async-handler.ts` | ✅ |
| `InternalServerError` | class | `helpers/async-handler.ts` | ✅ |
| `MethodNotAllowedError` | class | `helpers/async-handler.ts` | ✅ |
| `NotFoundError` | class | `helpers/async-handler.ts` | ✅ |
| `ServiceUnavailableError` | class | `helpers/async-handler.ts` | ✅ |
| `TooManyRequestsError` | class | `helpers/async-handler.ts` | ✅ |
| `UnauthorizedError` | class | `helpers/async-handler.ts` | ✅ |
| `UnprocessableEntityError` | class | `helpers/async-handler.ts` | ✅ |

### Helpers - Cookie
| Export | Kind | Source | Verified |
|--------|------|--------|----------|
| `deleteCookie` | function | `helpers/cookie.ts` | ✅ |
| `getCookie` | function | `helpers/cookie.ts` | ✅ |
| `getCookies` | function | `helpers/cookie.ts` | ✅ |
| `parseCookies` | function | `helpers/cookie.ts` | ✅ |
| `serializeCookie` | function | `helpers/cookie.ts` | ✅ |
| `setCookie` | function | `helpers/cookie.ts` | ✅ |

### Helpers - Crypto
| Export | Kind | Source | Verified |
|--------|------|--------|----------|
| `decrypt` | function | `helpers/crypto.ts` | ✅ |
| `encrypt` | function | `helpers/crypto.ts` | ✅ |
| `fastHash` | function | `helpers/crypto.ts` | ✅ |
| `hash` | function | `helpers/crypto.ts` | ✅ |
| `hashVerify` | function | `helpers/crypto.ts` | ✅ |
| `hmac` | function | `helpers/crypto.ts` | ✅ |
| `md5` | function | `helpers/crypto.ts` | ✅ |
| `randomAlphaNumeric` | function | `helpers/crypto.ts` | ✅ |
| `randomBytes` | function | `helpers/crypto.ts` | ✅ |
| `randomHex` | function | `helpers/crypto.ts` | ✅ |
| `randomToken` | function | `helpers/crypto.ts` | ✅ |
| `sha256` | function | `helpers/crypto.ts` | ✅ |
| `sha512` | function | `helpers/crypto.ts` | ✅ |

### Helpers - Date / Timezone
| Export | Kind | Source | Verified |
|--------|------|--------|----------|
| `addDays` | function | `helpers/date.ts` | ✅ |
| `daysBetween` | function | `helpers/date.ts` | ✅ |
| `endOfDay` | function | `helpers/date.ts` | ✅ |
| `formatDate` | function | `helpers/date.ts` | ✅ |
| `formatDuration` | function | `helpers/date.ts` | ✅ |
| `isAfter` | function | `helpers/date.ts` | ✅ |
| `isBefore` | function | `helpers/date.ts` | ✅ |
| `startOfDay` | function | `helpers/date.ts` | ✅ |
| `timeAgo` | function | `helpers/date.ts` | ✅ |
| `formatInTimezone` | function | `helpers/timezone.ts` | ✅ |
| `getTimezoneOffset` | function | `helpers/timezone.ts` | ✅ |
| `getTimezoneOffsetString` | function | `helpers/timezone.ts` | ✅ |
| `groupByTimezone` | function | `helpers/timezone.ts` | ✅ |
| `isValidTimezone` | function | `helpers/timezone.ts` | ✅ |
| `nowInTimezone` | function | `helpers/timezone.ts` | ✅ |
| `parseTime` | function | `helpers/timezone.ts` | ✅ |
| `toISOWithTimezone` | function | `helpers/timezone.ts` | ✅ |
| `toTimezoneParts` | function | `helpers/timezone.ts` | ✅ |

### Helpers - ID
| Export | Kind | Source | Verified |
|--------|------|--------|----------|
| `generateCode` | function | `helpers/id.ts` | ✅ |
| `nanoid` | function | `helpers/id.ts` | ✅ |
| `resetCounter` | function | `helpers/id.ts` | ✅ |
| `ulid` | function | `helpers/id.ts` | ✅ |

### Helpers - Network
| Export | Kind | Source | Verified |
|--------|------|--------|----------|
| `getClientIP` | function | `helpers/network.ts` | ✅ |
| `isPrivateIP` | function | `helpers/network.ts` | ✅ |
| `parseUserAgent` | function | `helpers/network.ts` | ✅ |

### Helpers - Number
| Export | Kind | Source | Verified |
|--------|------|--------|----------|
| `clamp` | function | `helpers/number.ts` | ✅ |
| `formatBytes` | function | `helpers/number.ts` | ✅ |
| `formatCurrency` | function | `helpers/number.ts` | ✅ |
| `formatNumber` | function | `helpers/number.ts` | ✅ |
| `random` | function | `helpers/number.ts` | ✅ |
| `randomFloat` | function | `helpers/number.ts` | ✅ |

### Helpers - Object
| Export | Kind | Source | Verified |
|--------|------|--------|----------|
| `chunk` | function | `helpers/object.ts` | ✅ |
| `deepMerge` | function | `helpers/object.ts` | ✅ |
| `flatten` | function | `helpers/object.ts` | ✅ |
| `flattenObject` | function | `helpers/object.ts` | ✅ |
| `groupBy` | function | `helpers/object.ts` | ✅ |
| `omit` | function | `helpers/object.ts` | ✅ |
| `pick` | function | `helpers/object.ts` | ✅ |
| `uniq` | function | `helpers/object.ts` | ✅ |

### Helpers - String
| Export | Kind | Source | Verified |
|--------|------|--------|----------|
| `camelCase` | function | `helpers/string.ts` | ✅ |
| `capitalize` | function | `helpers/string.ts` | ✅ |
| `kebabCase` | function | `helpers/string.ts` | ✅ |
| `slugify` | function | `helpers/string.ts` | ✅ |
| `snakeCase` | function | `helpers/string.ts` | ✅ |
| `truncate` | function | `helpers/string.ts` | ✅ |

### Helpers - Password
| Export | Kind | Source | Verified |
|--------|------|--------|----------|
| `hashPassword` | function | `helpers/password.ts` | ✅ |
| `verifyPassword` | function | `helpers/password.ts` | ✅ |

### Helpers - Avatar
| Export | Kind | Source | Verified |
|--------|------|--------|----------|
| `generateInitials` | function | `helpers/avatar.ts` | ✅ |
| `avatarColor` | function | `helpers/avatar.ts` | ✅ |
| `generateInitialAvatar` | function | `helpers/avatar.ts` | ✅ |

### Helpers - File / Download / Export / Archive
| Export | Kind | Source | Verified |
|--------|------|--------|----------|
| `serveFileOrFallback` | function | `helpers/file.ts` | ✅ |
| `downloadFile` | function | `helpers/download.ts` | ✅ |
| `downloadBuffer` | function | `helpers/download.ts` | ✅ |
| `exportCSV` | function | `helpers/export.ts` | ✅ |
| `exportJSON` | function | `helpers/export.ts` | ✅ |
| `createZIP` | function | `helpers/archive.ts` | ✅ |

### Response Helpers
| Export | Kind | Source | Verified |
|--------|------|--------|----------|
| `toResponse` | function | `helpers/response.ts` | ✅ |
| `toResponseMaybeAsync` | function | `helpers/response.ts` | ✅ |

### Logger
| Export | Kind | Source | Verified |
|--------|------|--------|----------|
| `Logger` | class | `logger.ts` | ✅ |
| `LogLevel` | enum | `logger.ts` | ✅ |
| `logger` | singleton | `logger.ts` | ✅ |
| `redactLogMeta` | function | `logger.ts` | ✅ |

### Factory
| Export | Kind | Source | Verified |
|--------|------|--------|----------|
| `Factory` | class | `factory.ts` | ✅ |

### Cache
| Export | Kind | Source | Verified |
|--------|------|--------|----------|
| `Cache` | class | `cache.ts` | ✅ |
| `MemoryCacheDriver` | class | `cache.ts` | ✅ |

### Emitter
| Export | Kind | Source | Verified |
|--------|------|--------|----------|
| `emitter` | singleton | `emitter.ts` | ✅ |
| `EventEmitter` | class | `emitter.ts` | ✅ |

### FFI
| Export | Kind | Source | Verified |
|--------|------|--------|----------|
| `getBackend` | function | `ffi.ts` | ✅ |
| `isNativeAvailable` | function | `ffi.ts` | ✅ |

### Base Classes
| Export | Kind | Source | Verified |
|--------|------|--------|----------|
| `BaseController` | class | `base-controller.ts` | ✅ |
| `BaseService` | class | `base-service.ts` | ✅ |

### OAuth
| Export | Kind | Source | Verified |
|--------|------|--------|----------|
| `BaseOAuthProvider` | class | `oauth/` | ✅ |
| `createOAuth` | function | `oauth/` | ✅ |
| `createOAuth2AuthorizationURL` | function | `oauth/` | ✅ |
| `decodeIdToken` | function | `oauth/` | ✅ |
| `generateCodeChallenge` | function | `oauth/` | ✅ |
| `generateCodeVerifier` | function | `oauth/` | ✅ |
| `generatePKCE` | function | `oauth/` | ✅ |
| `getCodeVerifier` | function | `oauth/` | ✅ |
| `OAuthError` | class | `oauth/` | ✅ |
| `OAuthProviderError` | class | `oauth/` | ✅ |
| `OAuthStateError` | class | `oauth/` | ✅ |
| `OAuthTokenError` | class | `oauth/` | ✅ |
| `storeOAuthState` | function | `oauth/` | ✅ |
| `validateOAuth2AuthorizationCode` | function | `oauth/` | ✅ |
| `verifyOAuthState` | function | `oauth/` | ✅ |
| `clearOAuthCookies` | function | `oauth/` | ✅ |
| `AppleProvider` | class | `oauth/` | ✅ |
| `GitHubProvider` | class | `oauth/` | ✅ |
| `GoogleProvider` | class | `oauth/` | ✅ |

### AI
| Export | Kind | Source | Verified |
|--------|------|--------|----------|
| `AICache` | class | `ai.ts` | ✅ |
| `injectSystemPrompt` | function | `ai.ts` | ✅ |
| `streamAI` | function | `ai.ts` | ✅ |

### Mailer
| Export | Kind | Source | Verified |
|--------|------|--------|----------|
| `Mailer` | class | `mailer.ts` | ✅ |

### Template
| Export | Kind | Source | Verified |
|--------|------|--------|----------|
| `TemplateEngine` | class | `template.ts` | ✅ |
| `render` | function | `template.ts` | ✅ |
| `registerHelper` | function | `template.ts` | ✅ |
| `registerPartial` | function | `template.ts` | ✅ |

### Router
| Export | Kind | Source | Verified |
|--------|------|--------|----------|
| `Router` | class | `router/index.ts` | ✅ |

### Metrics
| Export | Kind | Source | Verified |
|--------|------|--------|----------|
| `Metrics` | class | `metrics.ts` | ✅ |
| `metricsEndpoint` | function | `metrics.ts` | ✅ |
| `metricsMiddleware` | function | `metrics.ts` | ✅ |

### Payment
| Export | Kind | Source | Verified |
|--------|------|--------|----------|
| `PaymentConfigurationError` | class | `payment/` | ✅ |
| `PaymentError` | class | `payment/` | ✅ |
| `PaymentIdempotencyError` | class | `payment/` | ✅ |
| `PaymentProviderError` | class | `payment/` | ✅ |
| `PaymentVerificationError` | class | `payment/` | ✅ |
| `paymentWebhook` | function | `payment/` | ✅ |
| `createPayment` | function | `payment/` | ✅ |
| `generateIdempotencyKey` | function | `payment/` | ✅ |
| `normalizeCheckoutStatus` | function | `payment/` | ✅ |
| `normalizeRefundStatus` | function | `payment/` | ✅ |
| `normalizeSubscriptionStatus` | function | `payment/` | ✅ |
| `StripeDriver` | class | `payment/` | ✅ |
| `MidtransDriver` | class | `payment/` | ✅ |
| `XenditDriver` | class | `payment/` | ✅ |
| `PayPalDriver` | class | `payment/` | ✅ |

### Scheduler
| Export | Kind | Source | Verified |
|--------|------|--------|----------|
| `BunCronSchedulerDriver` | class | `schedule.ts` | ✅ |
| `CronJob` | class | `schedule.ts` | ✅ |
| `MemorySchedulerDriver` | class | `schedule.ts` | ✅ |
| `Scheduler` | class | `schedule.ts` | ✅ |
| `setDefaultSchedulerDriver` | function | `schedule.ts` | ✅ |

### SSE
| Export | Kind | Source | Verified |
|--------|------|--------|----------|
| `MemorySSEHistory` | class | `sse.ts` | ✅ |
| `MemorySSEPubSub` | class | `sse.ts` | ✅ |
| `SSE` | class | `sse.ts` | ✅ |
| `SSEBroadcaster` | class | `sse.ts` | ✅ |
| `createSSE` | function | `sse.ts` | ✅ |

### Upload
| Export | Kind | Source | Verified |
|--------|------|--------|----------|
| `deleteUploadedFile` | function | `upload.ts` | ✅ |
| `LocalDiskStorage` | class | `upload.ts` | ✅ |
| `MemoryStorage` | class | `upload.ts` | ✅ |
| `handleUploads` | function | `upload.ts` | ✅ |
| `uploader` | function | `upload.ts` | ✅ |

### WebSocket Helpers
| Export | Kind | Source | Verified |
|--------|------|--------|----------|
| `MemoryWSPubSub` | class | `ws-helpers.ts` | ✅ |
| `MemoryWSRateLimitStore` | class | `ws-helpers.ts` | ✅ |
| `Room` | class | `ws-helpers.ts` | ✅ |
| `validateWSMessage` | function | `ws-helpers.ts` | ✅ |
| `wsAuth` | function | `ws-helpers.ts` | ✅ |
| `wsHeartbeat` | function | `ws-helpers.ts` | ✅ |
| `wsHeartbeatPong` | function | `ws-helpers.ts` | ✅ |
| `wsRateLimit` | function | `ws-helpers.ts` | ✅ |

### Queue
| Export | Kind | Source | Verified |
|--------|------|--------|----------|
| `Queue` | class | `queue.ts` | ✅ |
| `MemoryQueueDriver` | class | `queue.ts` | ✅ |
| `RedisQueueDriver` | class | `queue-drivers/redis.ts` | ✅ |
| `BunRedisQueueDriver` | class | `queue-drivers/bun-redis.ts` | ✅ |
| `BullmqQueueDriver` | class | `queue-drivers/bullmq.ts` | ✅ |
| `RabbitmqQueueDriver` | class | `queue-drivers/rabbitmq.ts` | ✅ |

### Middlewares
| Export | Kind | Source | Verified |
|--------|------|--------|----------|
| `auditLog` | function | `middlewares/audit-log.ts` | ✅ |
| `bodySizeLimit` | function | `middlewares/body-size-limit.ts` | ✅ |
| `compress` | function | `middlewares/compress.ts` | ✅ |
| `cors` | function | `middlewares/cors.ts` | ✅ |
| `createDatabaseCheck` | function | `middlewares/health-check.ts` | ✅ |
| `createHealthCheck` | function | `middlewares/health-check.ts` | ✅ |
| `healthCheck` | function | `middlewares/health-check.ts` | ✅ |
| `livenessCheck` | function | `middlewares/health-check.ts` | ✅ |
| `readinessCheck` | function | `middlewares/health-check.ts` | ✅ |
| `runReadinessChecks` | function | `middlewares/health-check.ts` | ✅ |
| `helmet` | function | `middlewares/helmet.ts` | ✅ |
| `rateLimiter` | function | `middlewares/rate-limiter.ts` | ✅ |
| `slidingWindowRateLimiter` | function | `middlewares/rate-limiter.ts` | ✅ |
| `sqliteStore` | function | `middlewares/rate-limiter.ts` | ⚠️ See MISMATCHES |
| `requestId` | function | `middlewares/request-id.ts` | ✅ |
| `shortId` | function | `middlewares/request-id.ts` | ✅ |
| `uuid` | function | `middlewares/request-id.ts` | ✅ |
| `responseTime` | function | `middlewares/response-time.ts` | ✅ |
| `TimeoutError` | class | `middlewares/timeout.ts` | ✅ |
| `timeout` | function | `middlewares/timeout.ts` | ✅ |
| `requirePermission` | function | `middlewares/rbac.ts` | ✅ |
| `requireRole` | function | `middlewares/rbac.ts` | ✅ |
| `validate` | function | `middlewares/validator.ts` | ✅ |
| `validateBody` | function | `middlewares/validator.ts` | ✅ |
| `validateParams` | function | `middlewares/validator.ts` | ✅ |
| `zResponse` | function | `middlewares/validator.ts` | ✅ |
| `zValidator` | function | `middlewares/validator.ts` | ✅ |

### Plugin
| Export | Kind | Source | Verified |
|--------|------|--------|----------|
| `createPlugin` | function | `plugin.ts` | ✅ |

### Client
| Export | Kind | Source | Verified |
|--------|------|--------|----------|
| `createClient` | function | `client/index.ts` | ✅ |
| `ClientError` | class | `client/index.ts` | ✅ |
