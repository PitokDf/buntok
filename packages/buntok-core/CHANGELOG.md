# Changelog

All notable changes to `@buntok/core` will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **Bare object/array/scalar literal handlers promote to native** - `() => ({ message: "…" })`, `() => [1, "x", true]` (incl. nested), `() => 42`, `() => true`, `() => null`, and controller methods returning an object literal (the benchmark `/json` shape) are now baked into native `Bun.serve routes` at `listen()` - Bun answers them without entering JS. Sucrose `classifyConstExpr()` analyzes the *transpiled* source: bare `{…}`/`[…]` go through `JSON.parse` with a string-aware normalizer fallback (quotes identifier keys, converts single-quoted strings, folds `!0`/`!1`) because Bun's transpiler strips quotes and folds values; scalars fold to `text/plain; charset=utf-8` (`null` → `204 No Content`, matching `toResponse()`). `ctx.json` object-literal args (previously rejected - unquoted identifier keys fail `JSON.parse`) now normalize through the same parser and promote too. Conservative: closures/identifiers, template `${…}`, calls, spreads, backticks stay on the JS path. Benchmark: buntok `/json` 29.6k → ~40k req/s (+37%, at parity with `/plaintext` and with Elysia's `/json`). Tests: `tests/native-static.test.ts` (+8 → 35; native-vs-JS wire parity for obj/arr/nest/num/bool/nul, rejection cases, controller object literal).
- **`app.static(routePath, dir, { native: true })` - opt-in native directory serving** - serves the directory through Bun's native `{ dir }` route values (C++-side MIME, `ETag`, `Range`, `index.html`) instead of the JS handler. Documented deltas vs the JS handler: Bun does not send `Cache-Control`, and unknown files get an empty-body `404` (not the JSON `File Not Found`); `X-Powered-By`, global middleware, and request logging keep the JS handler so the wire stays identical. Tests: `tests/native-static.test.ts` (native wire signature, logging-on fallback, xpb-on fallback).
- **`app.icon(path)` favicon native promotion** - when the icon path resolves at boot (`app.icon()`/`app.favicon()` explicit path or the default file), `/favicon.ico` is registered as a native route value (`Bun.file`) so favicon hits skip JS entirely; gated like other opaque values (`X-Powered-By` keeps the JS handler - Bun cannot inject response headers on route values). Tests: `tests/native-static.test.ts` (native `Last-Modified` wire signature + bytes parity, xpb fallback).
- **`:param` handler routes promote to native (Bun matches in C++)** - a param-dependent handler like `app.get("/id/:id", ({ params }) => params.id)` is now registered as a native `Bun.serve` route *function*: Bun's C++ router matches the `:segments`, and the closure runs the exact JS the fallback dispatch runs (same pathname parsing, same sucrose `Context`/`ctxArg` decision, same `compiledGlobalPipeline` → `logNormalized`/`handleError` tail). Params are re-extracted **raw** (still percent-encoded) from the pathname - the FFI trie captures without decoding while Bun's `req.params` decodes, so bodies stay byte-identical (`/id/a%20b` → `"a%20b"`, not `"a b"`). A *constant* handler on a `:param` path (`() => ({…})`) is promoted as a plain static `Response` instead (zero JS). Splat (`*`) and `{}` patterns stay on `fetch()` - their match semantics can differ from the FFI trie. Unmatched methods/paths fall through to `fetch()` → `_dispatch()`, so 404 behavior is untouched. Same gates as static promotion (global middleware, request logging, non-standard methods, ws). The closure inlines the response tail (`normalizeReturn` + `logResponse` with logging off) instead of calling them, calls the handler directly (no global middleware → identity pipeline), and reads `request.params` on percent-free URLs (`decodeURIComponent` is the identity there - `%`-containing URLs take the raw re-split path). Offline profile: dispatch 3.18 → 1.19 µs/op (−63%); HTTP A/B: +3–4%; benchmark `/id/123`: 28.9k → 29.8k, now above Elysia (29.5k). Router gained a `dynamicRoutes` registry (path → method → handler) for the collect pass. Tests: `tests/native-dynamic.test.ts` (10 - promotion engagement/gates, byte parity for plain/encoded/malformed/nested/query params, HEAD, method miss, thrown errors, route middleware, constant-on-`:param`).
- **Static function handler routes promote to native (function-only apps)** - the native collect now engages when there are no static values *and no dynamic routes*, and a third pass promotes every static function handler (e. `app.post("/json", async (ctx) => ctx.json(await ctx.body()))`) as a native `Bun.serve` route *function* via `makeNativeStaticHandler()`. The closure bakes `needsFullContext`/`needsSetHeaders`/`X-Powered-By` at collect time, uses a shared frozen empty-params object, and inlines the same response tail (`normalizeReturn` + `logResponse`, logging off) and `parsePathname` error path as the dynamic handler - unmatched methods/paths still fall through to `fetch()` → `_dispatch()`. Route-middleware pipelines (fn-list handlers) are promoted as pipelines too, so middleware keeps running on the native path. Same gates as before (logging, global middleware, ws, non-standard methods). Targeted Body A/B (bombardier `--fasthttp -c 500 -d 10s`, POST `/json` echo, 2 alternating rounds): buntok 23,062 / 22,997 vs hono 18,824 / 18,804 req/s - **+22.5% best-of vs hono** (the POST `/json` route was previously the only benchmark route still forced through the JS dispatch). Tests: `tests/native-static.test.ts` (+10 → 45; engagement incl. function-only apps, logging-on gate, POST body-echo parity, 404/HEAD/thrown parity, `ctx.set.headers` & bare-ctx delegation, route-mw pipeline, `analyzeHandler().needsSetHeaders` units).
- **Sucrose `needsSetHeaders` - handlers that never touch `ctx.set` skip header merging in AOT codegen** - `HandlerAnalysis` gained a `needsSetHeaders` flag (default `true`, conservative) detected from the transpiled source: `set.headers`, `ctx.set`, a destructured `set` property, or **delegated ctx** (`helper(ctx)` - ctx passed as a call argument, the only construct that can reach `set` indirectly); a plain bare-ctx param (`(ctx) => …` without delegation) does *not* force it (it still forces `needsFullContext`). The AOT emit now has four variants - `set`/no-`set` × `X-Powered-By` on/off - where the no-`set` variants return `normalizeReturn(...)` directly instead of `applyCtxHeaders(...)`, dropping a per-response object walk/merge on the common path; dynamic native closures gate the tail the same way (`needsSetHeaders && needsFullContext`). Wire behavior for `ctx.set` handlers is unchanged (merged in all exit points as before). Result: benchmark body-echo handler analyzed `needsSetHeaders: false, needsFullContext: true`.
- **Note - no HTTP response compression** - candidate compression support was evaluated and dropped: `Bun.serve` has no `compress` option in 1.4.0 (compression options exist for WebSocket only), so there is no native lever to enable and shipping a JS-side compressor would tax the hot path. Revisit when Bun exposes it.

- **Auto const-literal detection - handler function literals promoted to native** - a handler whose body is exactly one string literal (`() => "Hi"`, `function () { return "Hi"; }`, `handler() { return "Hi"; }` - including controller methods via `_sucroseTarget`) is automatically promoted to native `Bun.serve routes`, just like literal handlers (`app.get('/', 'Hi')`). The analysis runs on the *transpiled* source, so Bun's constant folding is leveraged (`const x = 1; return x > 0 ? "Hi" : "no"` folded into `return "Hi"` also gets promoted - safe because what is checked is the code that actually executes). Conservative: async, closure/identifier returns, template `${…}`, unknown escapes, and response-decorator wrappers (`@HttpCode`/`@SetHeader`/`@Redirect`, flagged `_buntokResponseDecorated`) stay on the JS path - the wrapper must still execute. Other native gates (logging, global/route middleware, dynamic paths, non-standard methods) still apply; the original function is used as the JS-path fallback. Result: `() => "Hi"` 27.6k → 43.6k req/s (c500, native). Tests: `tests/native-static.test.ts`.
- **Constant `ctx.text` / `ctx.html` / `ctx.json` also go native** - a handler whose body is exactly one helper call with constant arguments (`return ctx.text("Hi")`, `ctx.text("Created", 201)`, `ctx.html("<p>…</p>")`, `ctx.json(["x"], 201)` - including param aliases `(c) => c.text(...)` and controller methods via `_sucroseTarget`) is now promoted to native `Bun.serve routes`. The bake in `materializeStatic()` exactly mirrors the `Context.text/html/json` branches per status (ct `text/plain; charset=utf-8` non-200 / no explicit ct on 200 / `text/html` / `Response.json`) plus `X-Powered-By` following the flag at collect time; a failed bake (e. status outside the `Response` range) → the route is skipped and the JS path handles it. Conservative without eval: the status must be a literal integer (closure/non-literal → JS), template `${…}`/closure/async/dynamic → JS, and `ctx.json` is validated with `JSON.parse` - object literals with identifier keys don't pass (Bun's transpiler strips quotes when transpiling) so they stay on the JS path; array/scalar literals promote. Tests: `tests/native-static.test.ts` (+4 → 27; native-vs-JS wire parity for status/ct/body/xpb, param alias, dynamic gates, conservative json, bake xpb, controller `ctx.text`).
- **Clear error for legacy decorator mode (`experimentalDecorators`)** - all decorators (`@Get`, `@Controller`, `@HttpCode`, `@Redirect`, etc.) now throw a message pointing at `"experimentalDecorators": true` in the tsconfig when invoked in legacy decorator mode - previously the confusing `@GET can only decorate methods` error.
- **Promotion to native `Bun.serve` `routes` (Elysia style) for static value handlers** - `app.get('/', 'Hi')` (string) and `app.get('/', new Response(...))` are now supported: the handler is wrapped in a function so every execution path (middleware pipeline, AOT codegen, fallback) keeps working unchanged, while the raw value is promoted to `serve().routes` at `listen()` - Bun answers the request directly without entering JS (no `Context`, no codegen, no per-request allocation). Byte-for-byte wire parity with Elysia (Bun-native etag identical, `Content-Type: text/plain;charset=utf-8`, `HEAD` & `If-None-Match` → `304` support). Benchmark ping c500: **31.9k → 44.8k req/s (+40.7%)**, now above Elysia (41.3k). Gates - promotion is skipped when: global middleware (`app.use`/`app.cors`) is active, `logger.logRequests` is active, dynamic path (`:`/`*`/`{}`), WebSocket path, method outside GET/POST/PUT/DELETE/PATCH/HEAD/OPTIONS, or route middleware is present - the route keeps running normally on the JS path (proven by tests). Static values are recorded per `METHOD:path` at registration (`_staticRouteValues`), recomputed on recompile.
- **Eager AOT invalidation for configuration flags** - `disable()`/`enable()`, `setTrustedProxy()`, and `use()` now recompile + `server.reload()` IMMEDIATELY when the server is already running (previously lazy on the next request - which would never fire for apps whose routes are all native). Post-listen `use()` now rebuilds the global pipeline directly so new middleware applies on the next request.
- 14 new tests in `tests/native-static.test.ts` (static value semantics on the fetch path: string/Response/route mw/global mw/dynamic path/re-registration; promotion at listen: etag signature, bake `X-Powered-By`, logging/global-mw/route-mw gates, eager reload on `enable`/`disable` logger & post-listen `use()`).

- **`ctx.set.headers` - mutable Elysia-style response headers** - `ctx.set.headers["x-powered-by"] = "benchmark"` is merged into the final response at every exit point (success, error/4xx-5xx, async handler, custom 404, per-route middleware, and dynamic route/fallback) **after** the built-in headers, so user values win over `X-Powered-By` and `x-request-id`. Applies in all three AOT codegen variants (fast path, powered-by path, log path), `handleError`, and `fallbackHandleRequest`; sucrose automatically flags handlers using `ctx.set` / `set.headers` / a destructured `set` param so they get the full `Context` (including the param alias `(c) => c.set.headers`).
- 18 new tests: `tests/ctx-headers.test.ts` (15 integration tests, including 2 `listen()` tests that activate the fast/powered codegen variants) + 3 sucrose detection unit tests in `tests/sucrose.test.ts`.
- **HTTP `Range` (206 Partial Content) in `serveFileOrFallback`** - `Accept-Ranges: bytes` is always sent; valid `bytes=start-end`, `bytes=start-`, and suffix `bytes=-N` are answered `206` + `Content-Range` (video/audio seek support); a start position beyond the file size or suffix `0` is answered `416` + `Content-Range: bytes */<size>`; multi-range (`bytes=0-1,5-6`) and invalid syntax are ignored → full `200`, per RFC 7233.
- **`detectMimeType` exported publicly** from `@buntok/core` and `@buntok/core/helpers`.
- 19 new tests: `tests/helpers/file.test.ts` (+14 - MIME & Range) and `tests/helpers/download.test.ts` (+5 - `downloadFile` & video MIME).
- **`app.disable("logger")` / `app.enable("logger")` - turn off all logger output** - kills request logs, error/warn logs, graceful-shutdown messages, and the startup banner (`Buntok vX ready in ...`) in one call; the `logger.enabled` & `logger.logRequests` flags are also set so the next `listen()` compiles the request-log-free fast path (call before `listen()` for maximum effect; after `listen()` it stays quiet at the runtime level). `logger.enabled`/`logger.logRequests` are now public getter+setter pairs.
- 3 new tests in `tests/logger.test.ts` (flag toggling, request logs silent while disabled & back when enabled, startup banner silence).
- **`file()` - lazy ElysiaFile-style file response (BREAKING: return type `Response` → `BuntokFile`)** - `file(path, { type?, headers? })` now returns a lazy `BuntokFile` object (no stat, no `Bun.file()`, no `Response` when the route is registered - same as Elysia's `ElysiaFile`); the framework converts it at response time via `toResponse(request)` so the original request's `Range` header is processed: `206` + `Content-Range` (single-range & suffix `bytes=-N`), `416` + `Content-Range: bytes */<n>` (start ≥ size / suffix `0`, no `Accept-Ranges` - Elysia parity), `Accept-Ranges: bytes` always sent, plus Elysia parity `Content-Range: bytes 0-<n-1>/<n>` on a full `200`; multi-range/invalid syntax ignored → `200` (RFC 7233). Performance optimization: `Bun.file()` + `size` cached per-path with a 1-second TTL (the sync stat ~6µs per request is avoided - `file()` response construction now matches the old eager `Response(Bun.file())`) and the legacy MIME map is extended (mp4/webm/mp3/woff2/etc → map lookup instead of `Bun.file().type`). No fallback when the file is missing - keep using `serveFileOrFallback` for that. `BuntokFile` is exported from `@buntok/core` and `@buntok/core/helpers` (API `path`/`value`/`type`/`length`/`slice()`/`toResponse()`); the AOT dispatch paths (3 codegen variants), dynamic-route fallback, decorator wrappers, `normalizeReturn`, and `toResponse` now recognize `BuntokFile`.
- 11 new/updated tests in `tests/helpers/file.test.ts` (laziness of `file()`, `type`/`length`/`value`/`slice` getters, auto-MIME & override, 5 Range parity scenarios, dispatch integration: static AOT route + dynamic route + async handler powered/log path).
- **Real-world developer-usage test suite** - `tests/realworld.test.ts` (13 tests) proves the whole surface the way an app developer would wire it: a Task API (CRUD incl. `:param` `PUT`/`PATCH`/`DELETE`/`HEAD`) with native-vs-JS wire parity and promotion engagement, global-middleware gating, custom `onError`/`notFound` pair parity, CORS + preflight + helmet + `responseTime` with logging off (regression for the pipeline `instanceof Response` contract), rate limiter (`200/200/429` + `X-RateLimit-*`), `app.static` + `file()` + `Range` (`206` + `Content-Range`), multipart upload via `handleUploads` (`200` + required-field `400`), decorated controller (`@HttpCode` 201 / `@SetHeader` / `@Redirect` 302 with `redirect: "manual"`), route-middleware `ctx.store` + `Container` DI on the native path, default `X-Powered-By` value promotion (Response baked with the header) with JS-path parity, and post-listen `use()` middleware.

### Changed

- **BREAKING - class `App` renamed to `Buntok`** - `new App()` → `new Buntok()`, `App.validateEnv(...)` → `Buntok.validateEnv(...)`, type `AppOptions` → `BuntokOptions`, subpath `@buntok/core/app` → `@buntok/core/buntok`, and source file `src/app.ts` → `src/buntok.ts`. **No backward-compat alias** - update all imports & instantiations. The `buntok` CLI still recognizes legacy `new App(...)` projects for instance detection (new scaffolds use `Buntok`); the `init`/`create-buntok` templates generate `Buntok` code. Tests: `tests/package-exports.test.ts` (ESM/CJS `mod.Buntok` + `./buntok` subpath) + 2 new legacy `new App(` detection cases in `tests/cli/project.test.ts`.
- **Headerless string responses (ct-less)** - AOT codegen for plain string handlers now builds `new Response(string)` without a header object; Bun.serve sets `Content-Type: text/plain;charset=utf-8` automatically, just like hono & elysia (both also return CT-less responses in-process). Saves one headers-object allocation per request on string routes, with no wire header changes.
- **`fetch()` / `request()` / `listen()` share a single `_dispatch` trampoline** - snapshots of the `logger`/`x-powered-by` flags (previously set at `listen()`) are now baked at the start of `compileAOTRouter()`, making all three dispatch paths consistent; `listen()` no longer captures a `fetch` reference that can go stale (post-start `setTrustedProxy`/configuration overrides now take effect; per-request gateway IP resolution runs on all paths).

### Fixed

- **Middleware now always receives a `Response` from downstream handlers** - both compiled pipelines (`compilePipeline` for route middleware, `compileGlobalPipeline` for `app.use`) passed the handler's raw return value (`"ok"`, `{ … }`, `null`) straight back up the chain, so every built-in middleware guarding mutations with `result instanceof Response` (`requestId`, `responseTime`, `rateLimiter`, `compress`, `auditLog`) silently skipped non-`Response` returns. The `x-request-id` case was masked in development by `logResponse`'s header echo (gated on `logger.logRequests`) - with request logging **off** (production default) + a string handler, `requestId()`'s response header disappeared entirely. Both pipelines now normalize the final handler result (`normalizeReturn`) before it flows through the middleware chain; the AOT/fallback tails normalize again idempotently (`instanceof Response` pass-through). Behavior change: middleware sees a `Response` instead of the raw value - enables response-header mutation for all handler return types in every mode. Tests: `tests/middlewares/request-id.test.ts` (+3 integration - global mw with string/object handlers at logging off, route mw, inbound id passthrough) + `tests/realworld.test.ts` (4 - realistic Task API suite with native/JS wire parity, global-mw gating, default config).
- **HEAD requests now fall back to the GET route** - previously `router.find("HEAD", …)` returned nothing unless a HEAD route was registered, so `HEAD /users` 404'd while `GET /users` answered; Bun.serve (native route values) and every major framework (Elysia, Hono, Express) serve HEAD from the GET route with the body stripped. `Router.find()` now retries with `GET` on a HEAD miss - the JS path and native path agree (`200`, empty body), and paths without a GET route still 404. Behavior change: `HEAD` on a GET-only route moves from `404` → `200`. Tests: `tests/native-dynamic.test.ts` (HEAD→GET present/absent) + native/JS parity cases.
- **`return null` no longer serializes as `200` with body `null`** - the AOT codegen branches used `typeof raw === "object"` (which is `"object"` for `null` in JS) and fed it to `Response.json(null)` → `200 application/json` with body `null`, contradicting `toResponse()`'s documented `204 No Content`. All three codegen variants (fast/powered-by/log, sync + async) now exclude `null`, so `return null` → `204` on the JS path - byte-identical with the native `empty` promotion.
- **`static()` with an absolute `directory`** - `join(process.cwd(), directory)` mangles absolute paths (`join("/cwd", "/tmp/x")` → `/cwd/tmp/x`) → `ENOENT` when a native `{ dir }` route boots, `404` on the JS handler. Now resolved with `path.resolve(directory)` (identical behavior for relative paths).
- **Boot crash for promoted static values on paths without a leading `/`** - `app.get("somePath", "Hi")` put `somePath` into `Bun.serve` `routes`, throwing `ERR_INVALID_ARG_TYPE` at `listen()`. The native collect now skips such paths; the JS handler serves them as before.
- **`disable()`/`enable()` after `listen()` now applies to live traffic** - previously compiled codegen paths froze the flags at bake time; both methods now invalidate the AOT cache so routes recompile with the latest flags (new regression test: toggling `x-powered-by` & `logger` on a listening app).
- **`serveFileOrFallback`/`downloadFile`/`downloadBuffer` wrong MIME for video/audio/font** - the internal extension map only held ±19 types, so `mp4`, `webm`, `mp3`, `woff2`, etc. fell through to `application/octet-stream` → browsers download instead of playing. Now falls back to Bun's native MIME DB (`Bun.file().type`) after the legacy extension map (legacy behavior for known extensions stays exactly the same).
- **`fallbackHandleRequest` now provides the full `Context` when global middleware is present** - previously only the AOT codegen checked `hasGlobalMiddleware`; the fallback (dynamic route) path could pass a plain `{ request }` object to global middleware using `ctx.json`/`ctx.store`.

## [2.2.2]

### Fixed

- **Route decorators without middleware now always receive the full `Context`** - previously `ctx.success()`/`ctx.json()`/etc. threw `ctx.success is not a function` because the handler was called with a plain `{ request }` object. Especially on the `RouterGroup.registerController()` path, which forgot to attach the sucrose analysis target (`_sucroseTarget`).
- **`RouterGroup.registerController()` now applies `@HttpCode`, `@SetHeader`, and `@Redirect`** - previously these decorators were silently ignored when a controller was registered via a group (the wrapper logic only existed in `App.registerController`); they are now applied through the shared `applyRouteResponseDecorators()` helper.
- **Sucrose now conservatively detects `ctx` usage** - delegation patterns (`this.ok(ctx, data)`, `respond(ctx, ...)`) as well as `ctx.paginate()`/`ctx.cursorPaginate()` (previously missing from the literal list) now pass analysis → `needsFullContext: false` → the same error. Handlers that never touch `ctx` still get the `{ request }` fast path.
- **AOT codegen**: removed the dead `needsParamsOnly` branch that referenced an undeclared `routeParams` in generated code (latent `ReferenceError` if the invariant changed).

### Added

- 23 regression/unit tests: `tests/decorators-no-middleware.test.ts` (14 - `ctx.success`/`ctx.params`/delegation/`BaseController`/`@HttpCode`/`@SetHeader`/`@Redirect` via group, `ctx.cursorPaginate`, `ctx.paginate`, all without middleware) and `tests/sucrose.test.ts` (9 `analyzeHandler` unit tests - sucrose previously had zero coverage).

## [2.2.1]

### Added

- **Granular subpath exports** - heavy features are now available via subpath imports (e. `@buntok/core/schedule`, `@buntok/core/queue`, `@buntok/core/upload`, `@buntok/core/mailer`, `@buntok/core/template`, `@buntok/core/metrics`, `@buntok/core/oauth`, `@buntok/core/helpers`, `@buntok/core/middlewares`, `@buntok/core/auth`, `@buntok/core/app`, etc.).
- `@buntok/core/all` - full namespace for backward compatibility (legacy barrel behavior).
- The root `@buntok/core` is now **slim** (lightweight core without zod/croner) for faster cold starts and Vercel Serverless friendliness.
- `zod`, `croner`, `@asteasolutions/zod-to-openapi` are externalized (still in `dependencies`, auto-installed) so consumer bundlers can tree-shake & dedupe.
- Granular import documentation + Vercel deploy example (Bun runtime, `export default app`) in the README.
- Package export smoke tests (`tests/package-exports.test.ts`) cover the new subpaths & assert the root does not export heavy modules.

### Changed

- **BREAKING**: `Queue`, `Scheduler`/`CronJob`, `SSE`, `Upload` (`uploader`, `LocalDiskStorage`), `Mailer`, `TemplateEngine`, `Metrics`, `OAuth` are no longer exported from the root `@buntok/core` - moved to subpaths (see README). Use `@buntok/core/all` for the old set.
- dist bundle size dropped from ±4.1MB → ±617KB; root cold import ±261ms → ±36ms (measured).

### Deprecated

- `src/exports.ts` & `src/index.ts` (root aliases) are kept for backward compatibility.

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
