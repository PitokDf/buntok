# Changelog

All notable changes to `@buntok/core` will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [2.2.1]

### Added

- **Granular subpath exports** — fitur berat kini tersedia lewat subpath import (`.e.g` `@buntok/core/schedule`, `@buntok/core/queue`, `@buntok/core/upload`, `@buntok/core/mailer`, `@buntok/core/template`, `@buntok/core/metrics`, `@buntok/core/oauth`, `@buntok/core/helpers`, `@buntok/core/middlewares`, `@buntok/core/auth`, `@buntok/core/app`, dll).
- `@buntok/core/all` — namespace penuh untuk backward compatibility (perilaku barrel lama).
- Root `@buntok/core` kini **slim** (hanya core ringan tanpa zod/croner) untuk mempercepat cold start dan ramah Vercel Serverless.
- `zod`, `croner`, `@asteasolutions/zod-to-openapi` di-external-kan (tetap di `dependencies`, auto-install) agar bundler consumer men-tree-shake & mendedupe.
- Dokumentasi import granular + contoh deploy Vercel (runtime Bun, `export default app`) di README.
- Smoke test ekspor package (`tests/package-exports.test.ts`) meliputi subpath baru & memastikan root tidak mengekspor modul berat.

### Changed

- **BREAKING**: `Queue`, `Scheduler`/`CronJob`, `SSE`, `Upload` (`uploader`, `LocalDiskStorage`), `Mailer`, `TemplateEngine`, `Metrics`, `OAuth` tidak lagi diekspor dari root `@buntok/core` — pindah ke subpath (lihat README). Gunakan `@buntok/core/all` untuk set lama.
- Ukuran bundle dist turun dari ±4.1MB → ±617KB; cold import root ±261ms → ±36ms (terukur).

### Deprecated

- `src/exports.ts` & `src/index.ts` (alias root) tetap dipertahankan untuk kompatibilitas lama.

### Added

- **Phase 0:** Public API inventory (`CONTRACT-INVENTORY.md`) and contract mismatch tracking (`CONTRACT-MISMATCHES.md`).
- **Phase 1:** SIGINT/SIGTERM integration tests, shutdown timeout tests, in-flight request drain tests, multiple app instance signal isolation tests.
- **Phase 2:** Configurable log redaction via `redactPatterns` and `redactReplacement` options in `LoggerOptions`.
- **Phase 4:** `drain()` method on all queue drivers (Redis, Bun Redis, BullMQ, RabbitMQ).
- **Phase 5:** `--dry-run` flag for `make:middleware`, `make:seeder`, `make:test` CLI commands.
- **Phase 5:** Database CLI `--dry-run` flag and confirmation prompt for destructive commands (`reset`).
- **Phase 5:** Docs contract checker script (`scripts/check-docs-contract.ts`).
- **Phase 6:** CI matrix workflow (typecheck, unit, integration, package validation, docs contract).
- **Phase 6:** ESM/CJS export validation test.
- **Phase 6:** `publishConfig` in `package.json` for npm publishing.

### Changed

- `db` CLI now requires confirmation before running destructive `reset` command.
- Logger `redactLogMeta` now accepts optional custom patterns and replacement text.

### Security

- Added documentation for CSRF boundary (cookie auth requires application-level CSRF layer).
- Added documentation that x-forwarded-for is not trusted by default.

## [2.1.14] - 2026-09-10

### Fixed

- Performance optimization: inline string and Response fast-paths in AOT codegen.
- `toResponse()` restructured with fast-paths for string and binary types.
- `create-buntok` package build script updated to use `buntok build`.

### Added

- Factory feature (`Factory.define()`, `Factory.build()`, `Factory.ref()`).
- Visual Route Debugger (`buntok debug:routes`).
- Local Tunneling (`buntok dev --expose`).
- `buntok check` improved with `--json`, `--plain` flags and error summary.

## [2.1.13] - 2026-09-08

### Fixed

- CORS middleware: wraps `await next()` with `toResponse()` to handle Response objects.
- `RouterGroup.registerController()`: uses `container.has()` check before resolving.

### Added

- `registerController()` array support for `App` and `RouterGroup`.
- API docs trailing slash route for `GET ${basePath}/`.
- Logger `logFileLevel` option for independent file logging level.
- Logger lazy `getLogDir()` that reads `process.env.LOG_DIR` on first flush.

## [2.1.12] - 2026-09-05

### Added

- CLI commands: `make:middleware`, `make:factory`, `make:seeder`, `make:test`, `make:test:e2e`.
- CLI `create` command with module structure, auto-detect ORM, barrel export.
- CLI `check` command with JSON output support.
- Smart registration: merges into existing arrays without creating duplicates.
- `container.scan()` for recursive dependency resolution.
- `@Dependencies` decorator for constructor injection.

## [2.1.11] - 2026-09-01

### Added

- AOT-compiled pipelines via `new Function()` for middleware/route handling.
- WebSocket helpers: `Room`, `wsAuth`, `wsHeartbeat`, `wsRateLimit`.
- SSE: `SSEBroadcaster`, `MemorySSEPubSub`, `MemorySSEHistory`.
- Payment: Stripe, Midtrans, Xendit, PayPal drivers.
- Scheduler: `CronJob`, `BunCronSchedulerDriver`, `MemorySchedulerDriver`.
- Template engine: `TemplateEngine`, `render`, `registerHelper`, `registerPartial`.

## [2.1.10] - 2026-08-28

### Added

- Zod validation for body, query, params, multipart, form-urlencoded, text, XML, binary.
- Rate limiting: `rateLimiter`, `slidingWindowRateLimiter`, `sqliteStore`.
- Health checks: `livenessCheck`, `readinessCheck`, `healthCheck`.
- CORS middleware with full configuration.
- Compression middleware.
- Request ID middleware.
- Response time middleware.
- Helmet security headers.
- Audit log middleware.
- Body size limit middleware.

## [2.1.9] - 2026-08-25

### Added

- IoC Container with dependency injection.
- Constructor factories and controller registration.
- JWT authentication and OAuth helpers.
- File uploads with local disk and memory storage.
- Static file serving.
- Cache with memory driver.

## [2.1.8] - 2026-08-20

### Added

- Initial public release.
- AOT routing with static and dynamic routes.
- Functional routing and controller/decorator APIs.
- Middleware, groups, and guards.
- Context with request/response helpers.
- CLI initialization and build commands.
