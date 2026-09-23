# @buntok/core

> Core HTTP framework untuk Bun — minimalis, cepat, type-safe, dan fleksibel.

[![npm](https://img.shields.io/npm/v/@buntok/core)](https://www.npmjs.com/package/@buntok/core)
[![license](https://img.shields.io/npm/l/@buntok/core)](./LICENSE)
[![bun](https://img.shields.io/badge/runtime-bun-%23F472B6)](https://bun.sh)

---

## Features

- **AOT-compiled routing** — pipeline middleware di-compile sekali saat boot, zero overhead per-request
- **Trie-based router** — static routes di-resolve O(1), dynamic routes lewat trie (optional native Zig via FFI)
- **Type-safe** — full TypeScript support dari route handler sampai validator
- **Stage 3 decorators** — `@Controller`, `@Get`, `@Post`, `@Use`, dll. tanpa `experimentalDecorators`
- **IoC Container** — dependency injection dengan circular dependency detection
- **Built-in middleware** — CORS, compress (gzip/brotli), rate limiter, request ID, response time, helmet (security headers), timeout
- **File upload** — multipart/form-data parser, per-field validation, custom filename, storage drivers (disk, memory, custom S3/GCS/R2), file deletion
- **Zod validation** — `zValidator` untuk body, query, dan params
- **SSE & WebSocket** — native Bun WebSocket, built-in SSE stream
- **Utility functions** — crypto, password, string, object, number, date, ID generators, network, async helpers

---

## Install

```bash
bun add @buntok/core
# atau
npm install @buntok/core
```

**Requirement:** Bun >= 1.0.0

---

## Quick Start

```ts
import { App } from "@buntok/core";

const app = new App();

app.get("/", (ctx) => {
  return ctx.json({ message: "Hello, Buntok!" });
});

app.listen(3000);
```

Port default: `3000`, atau dari `process.env.PORT`.

---

## Import & Cold Start (Serverless)

Root `@buntok/core` hanya berisi core ringan (App, decorators, Context, errors, helpers, middleware dasar) — tanpa `zod`/`croner` yang berat. Fitur berat di-*external*-kan dan di-load hanya saat dipakai, jadi cold start cepat dan cocok dijalankan di **Vercel Serverless**.

Masukin fitur sesuai kebutuhan lewat subpath:

```ts
import { App, Controller, Get } from "@buntok/core"; // core ringan saja
import { z, zValidator } from "@buntok/core/middlewares/validator";
import { CronJob }        from "@buntok/core/schedule";
import { Queue }          from "@buntok/core/queue";
import { RedisQueueDriver } from "@buntok/core/queue-drivers";
import { SSE }            from "@buntok/core/sse";
import { uploader }       from "@buntok/core/upload";
import { Mailer }         from "@buntok/core/mailer";
import { TemplateEngine } from "@buntok/core/template";
import { Metrics }        from "@buntok/core/metrics";
import { createOAuth }    from "@buntok/core/oauth";
import { createPayment }  from "@buntok/core/payment";
import { Room, wsAuth }   from "@buntok/core/ws-helpers";
import { createPlugin }   from "@buntok/core/plugin";
import { JwtService }     from "@buntok/core/auth";
```

Daftar subpath umum: `app`, `auth`, `base-controller`, `base-service`, `cache`, `circuit-breaker`, `client`, `container`, `context`, `decorators`, `emitter`, `factory`, `helpers`, `logger`, `mailer`, `metrics`, `middlewares`, `middlewares/validator`, `oauth`, `payment`, `plugin`, `queue`, `queue-drivers`, `router`, `schedule`, `sse`, `template`, `upload`, `ws-helpers`, `dev`, `plugins/graphql*`, `plugins/opentelemetry`.

> Butuh semua sekaligus (backward compat)? Import dari `@buntok/core/all`.

#### Deploy ke Vercel

Buntok menyediakan handler standar `fetch` untuk serverless — ekspor instance app sebagai default export:

```ts
import { App } from "@buntok/core";

const app = new App();

app.get("/", (ctx) => ctx.json({ hello: "world" }));

export default app; // → App.fetch(request) otomatis
```

Jalankan Vercel Functions dengan runtime **Bun** via `vercel.json`:

```json
{
  "functions": {
    "api/**/*.ts": { "runtime": "@vercel/functions-bun" }
  }
}
```

---

## Table of Contents

- [App](#app)
- [Context](#context)
- [Routing](#routing)
- [Group Routing](#group-routing)
- [Middleware](#middleware)
- [Built-in Middleware](#built-in-middleware)
- [Validation (zValidator)](#validation-zvalidator)
- [Decorators](#decorators)
- [Error Handling](#error-handling)
- [TypeScript Types](#typescript-types)
- [IoC Container](#ioc-container)
- [Layered Architecture (Repository, Service, Controller)](#layered-architecture)
- [SSE (Server-Sent Events)](#sse-server-sent-events)
- [WebSocket](#websocket)
- [Cookie Helpers](#cookie-helpers)
- [Logger](#logger)
- [Health Check](#health-check)
- [Queue](#queue)
- [File Upload](#file-upload)
- [Crypto Helpers](#crypto-helpers)
- [Password Helpers](#password-helpers)
- [String Helpers](#string-helpers)
- [Object Helpers](#object-helpers)
- [Number Helpers](#number-helpers)
- [Date Helpers](#date-helpers)
- [ID & Code Generators](#id--code-generators)
- [Network Helpers](#network-helpers)
- [Async Helpers](#async-helpers)
- [Security Headers (Helmet)](#security-headers-helmet)
- [Request Timeout](#request-timeout)
- [Testing](#testing)

---

## App

### Membuat Instance

```ts
import { App } from "@buntok/core";

const app = new App();
```

### API

| Method | Signature | Deskripsi |
|--------|-----------|-----------|
| `app.get` | `(path, ...handlers)` | Register route GET |
| `app.post` | `(path, ...handlers)` | Register route POST |
| `app.put` | `(path, ...handlers)` | Register route PUT |
| `app.patch` | `(path, ...handlers)` | Register route PATCH |
| `app.delete` | `(path, ...handlers)` | Register route DELETE |
| `app.options` | `(path, ...handlers)` | Register route OPTIONS |
| `app.all` | `(path, ...handlers)` | Register route semua method |
| `app.use` | `(middleware)` | Tambah global middleware |
| `app.group` | `(prefix)` | Buat route group |
| `app.static` | `(routePath, directory)` | Serve static files |
| `app.ws` | `(path, handler)` | Register WebSocket endpoint |
| `app.listen` | `(port?, callback?)` | Mulai server |
| `app.request` | `(input, init?)` | Dispatch request (untuk testing) |
| `app.onError` | `(handler)` | Override global error handler |
| `app.notFound` | `(handler)` | Override 404 handler |
| `app.set` | `(key, value)` | Simpan value di DI store |
| `app.setContainer` | `(container)` | Attach IoC Container |
| `app.registerController` | `(ControllerClass)` | Register controller dengan decorator |
| `app.validateEnv` | `(schema)` | Validasi env vars dengan Zod schema |
| `app.disable` | `("x-powered-by")` | Nonaktifkan fitur built-in |
| `app.enableReusePort` | `(enabled?)` | SO_REUSEPORT untuk multi-process (Linux) |

### Listen

```ts
// Port dari argumen
app.listen(3000);

// Port dari env (PORT) atau default 1212
app.listen();

// Dengan callback
app.listen(3000, () => {
  console.log("Server ready");
});
```

### Validate Environment Variables

```ts
import { z } from "@buntok/core";

const env = app.validateEnv({
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  PORT: z.coerce.number().default(3000),
});

// env.DATABASE_URL, env.JWT_SECRET — fully typed
// Gagal validasi = server tidak jalan + error detail ke console
```

---

## Context

`ctx` adalah satu-satunya argument yang di-pass ke setiap handler. Berisi semua yang dibutuhkan untuk membaca request dan menulis response.

### Request

| Property / Method | Tipe | Deskripsi |
|-------------------|------|-----------|
| `ctx.request` | `Request` | Raw Bun `Request` object |
| `ctx.params` | `Record<string, string>` | Route parameters (`:id`, `*`) |
| `ctx.query` | `Record<string, string>` | Parsed query string (lazy, cached) |
| `ctx.ip` | `string` | Client IP — respects `x-forwarded-for` |
| `ctx.store` | `Record<string, any>` | Key-value store antar middleware |
| `await ctx.body<T>()` | `Promise<T>` | Parse JSON body (cached) |
| `await ctx.formData()` | `Promise<FormData>` | Parse multipart form data (cached) |
| `ctx.getCookie(name)` | `string \| undefined` | Ambil satu cookie |
| `ctx.getCookies()` | `Record<string, string>` | Ambil semua cookies |
| `ctx.valid<T>(target)` | `T` | Ambil data yang sudah divalidasi oleh `zValidator` |

### Response

| Method | Return | Deskripsi |
|--------|--------|-----------|
| `ctx.json(data, status?)` | `Response` | JSON response |
| `ctx.text(text, status?)` | `Response` | Plain text response |
| `ctx.html(html, status?)` | `Response` | HTML response |
| `ctx.redirect(url, status?)` | `Response` | Redirect (default 302) |
| `ctx.status(code)` | `Response` | Empty response dengan status code |
| `ctx.success(data?, message?, status?)` | `Response` | Standard success envelope |
| `ctx.error(message, status?, details?)` | `Response` | Standard error envelope |
| `ctx.paginate(data, total, page, limit)` | `Response` | Offset pagination |
| `ctx.cursorPaginate(data, nextCursor)` | `Response` | Cursor/infinite scroll pagination |
| `ctx.sse(callback, options?)` | `Response` | Server-Sent Events stream |

#### Standard Envelope

`ctx.success` dan `ctx.error` menggunakan format envelope yang konsisten:

```ts
// ctx.success(data, message?, status?)
{ success: true, message: "Success", data: { ... } }

// ctx.error(message, status?, details?)
{ success: false, message: "Not found", details: [...] }

// ctx.paginate(data, total, page, limit)
{
  success: true,
  message: "Success",
  data: [...],
  meta: { currentPage: 1, perPage: 20, total: 100, lastPage: 5, hasMore: true }
}

// ctx.cursorPaginate(data, nextCursor)
{
  success: true,
  message: "Success",
  data: [...],
  meta: { nextCursor: "abc123", hasMore: true }
}
```

### Contoh Penggunaan Context

```ts
// Baca params dan query
app.get("/users/:id", (ctx) => {
  const { id } = ctx.params;
  const { fields } = ctx.query;  // ?fields=name,email
  return ctx.json({ id, fields });
});

// Parse JSON body
app.post("/users", async (ctx) => {
  const body = await ctx.body<{ name: string; email: string }>();
  return ctx.success(body, "User created", 201);
});

// Pagination
app.get("/posts", async (ctx) => {
  const page = Number(ctx.query.page) || 1;
  const posts = await getPosts(page);
  const total = await countPosts();
  return ctx.paginate(posts, total, page, 20);
});
```

---

## Routing

### Route Parameters

```ts
// Named param
app.get("/users/:id", (ctx) => {
  return ctx.json({ id: ctx.params.id });
});

// Catch-all wildcard
app.get("/files/*", (ctx) => {
  return ctx.text(`File: ${ctx.params["*"]}`);
});
```

### Route Group

Group mewarisi prefix dan bisa punya middleware sendiri.

```ts
const api = app.group("/api/v1");

api.get("/users", listUsers);
api.post("/users", createUser);

// Nested group dengan middleware
const admin = api.group("/admin");
admin.use(adminGuard);
admin.get("/stats", getStats);
```

### Static Files

```ts
// GET /assets/logo.png -> ./public/logo.png
app.static("/assets", "./public");
```

- Path traversal protection built-in (403 jika path escape directory)
- ETag support untuk conditional requests (304)
- `Cache-Control: public, max-age=3600`

### HTTP Methods

```ts
app.get("/users", listUsers);       // GET
app.post("/users", createUser);     // POST
app.put("/users/:id", updateUser);  // PUT
app.delete("/users/:id", deleteUser); // DELETE
app.patch("/users/:id", patchUser); // PATCH
app.head("/users", headUsers);      // HEAD
app.options("/users", optionsUser); // OPTIONS
app.query("/users", queryUsers);    // QUERY (RFC 10008 — safe + idempotent + body)

// Register handler for ALL standard methods at once
app.all("/users", allHandler);      // GET, HEAD, POST, PUT, PATCH, DELETE, OPTIONS
```

---

## Group Routing

`app.group()` mengembalikan `RouterGroup` yang punya method-method routing yang sama dengan `App`.

### Dasar

```ts
const api = app.group("/api/v1");

// Semua HTTP methods tersedia
api.get("/users", listUsers);
api.post("/users", createUser);
api.put("/users/:id", updateUser);
api.delete("/users/:id", deleteUser);
api.patch("/users/:id", patchUser);
api.head("/users", headUsers);
api.options("/users", optionsUser);
api.query("/users", queryUsers);    // QUERY (RFC 10008)

// Register untuk semua method sekaligus
api.all("/health", healthCheck);
```

### Nested Groups

```ts
const admin = api.group("/admin");
admin.use(adminGuard);
admin.get("/stats", getStats);
admin.delete("/users/:id", forceDelete);
```

### WebSocket & Static Files

```ts
const ws = app.group("/ws");

ws.ws("/chat", {
  open: (ws) => { ws.send("Welcome!"); },
  message: (ws, msg) => { ws.send(`Echo: ${msg}`); },
});

ws.static("/assets", "./public");
```

### Controller Injection

```ts
import { App, Controller, Get, Post } from "@buntok/core";

@Controller("/users")
class UserController {
  @Get()
  list() { return { users: [] }; }

  @Post()
  create() { return { created: true }; }
}

const api = app.group("/api/v1");
api.registerController(UserController);

// Terdaftar sebagai:
//   GET  /api/v1/users
//   POST /api/v1/users
```

Group prefix digabung dengan controller prefix. Jika controller prefix udah include group prefix (misalnya `/api/v1/users`), framework otomatis deduplicate.

```ts
@Controller("/api/v1/users")  // prefix duplikat — otomatis di-handle
class UserController { ... }

const api = app.group("/api/v1");
api.registerController(UserController);  // → /api/v1/users ✅
```

## Middleware

Signature: `(ctx, next) => Response | Promise<Response>`

**Wajib `return next()`** untuk meneruskan ke handler berikutnya.

```ts
// Global middleware
app.use(async (ctx, next) => {
  const start = performance.now();
  const res = await next();
  console.log(`${ctx.request.method} - ${(performance.now() - start).toFixed(2)}ms`);
  return res;
});

// Per-route middleware
app.get("/protected", authMiddleware, (ctx) => {
  return ctx.json({ data: "secret" });
});

// Group middleware
const api = app.group("/api");
api.use(rateLimiter({ max: 100, windowMs: 60_000 }));
api.get("/users", listUsers);
```

---

## Built-in Middleware

### CORS

```ts
// Recommended — ensures CORS headers on ALL responses including errors (4xx, 5xx)
app.cors({
  origin: ["http://localhost:3000", "https://myapp.com"],
  methods: ["GET", "POST", "PUT", "DELETE"],
  headers: ["Content-Type", "Authorization"],
  credentials: true,
});
```

> **⚠️ Gunakan `app.cors()` bukan `app.use(cors(...))`.** Method `app.cors()` memastikan CORS headers diterapkan ke **semua** response, termasuk error response (400, 422, 500, 404, dll). Menggunakan `app.use(cors(...))` hanya menerapkan CORS headers ke response sukses — error yang di-throw melewati middleware chain dan return tanpa CORS headers.

| Option | Tipe | Default |
|--------|------|---------|
| `origin` | `string \| string[] \| (origin: string) => boolean` | `"*"` |
| `methods` | `string[]` | `["GET","POST","PUT","DELETE","PATCH","OPTIONS"]` |
| `headers` | `string[]` | `["Content-Type","Authorization","x-api-key"]` |
| `credentials` | `boolean` | `false` |

### Compress

```ts
import { compress } from "@buntok/core";

app.use(compress({
  threshold: 1024,  // minimum bytes untuk di-compress (default: 1024)
  brotliLevel: 4,   // brotli quality 1-11 (default: 4)
}));
```

- Brotli via `node:zlib`, Gzip via `Bun.gzipSync` (native)
- Otomatis deteksi `Accept-Encoding` dari client
- Hanya compress `text/*`, `application/json`, `application/javascript`, `application/xml`, `image/svg+xml`

### Rate Limiter

```ts
import { rateLimiter, slidingWindowRateLimiter } from "@buntok/core";

// Fixed window
app.use(rateLimiter({
  max: 100,           // max requests per window (default: 100)
  windowMs: 60_000,  // window 1 menit (default: 60000)
  message: "Too many requests",
  statusCode: 429,   // default: 429
  headers: true,     // inject X-RateLimit-* headers (default: true)
}));

// Sliding window (lebih akurat, tidak ada burst di boundary)
app.use(slidingWindowRateLimiter({ max: 100, windowMs: 60_000 }));
```

| Option | Tipe | Default |
|--------|------|---------|
| `max` | `number` | `100` |
| `windowMs` | `number` | `60000` |
| `message` | `string` | `"Too many requests, please try again later"` |
| `statusCode` | `number` | `429` |
| `headers` | `boolean` | `true` |
| `keyGenerator` | `(ctx) => string` | IP dari `x-forwarded-for` / `x-real-ip` |
| `skip` | `(ctx) => boolean` | — |
| `store` | `Map` | In-memory |

### Request ID

```ts
import { requestId, shortId } from "@buntok/core";

app.use(requestId({
  header: "x-request-id",  // nama header (default: "x-request-id")
  storeKey: "requestId",   // key di ctx.store (default: "requestId")
}));

app.get("/", (ctx) => {
  const id = ctx.store.requestId;
  return ctx.json({ requestId: id });
});
```

Re-use ID dari incoming header jika sudah ada.

### shortId

Generate short unique ID (8 karakter, URL-safe). Berguna untuk ID ringan tanpa dependency:

```ts
import { shortId } from "@buntok/core";

const id = shortId(); // "a3xK9mZp"
```

### Response Time

```ts
import { responseTime } from "@buntok/core";

app.use(responseTime({
  header: "x-response-time",  // default: "x-response-time"
  format: "ms",               // "ms" atau "s" (default: "ms")
}));
```

---

## Validation (zValidator)

`zValidator` adalah middleware yang memvalidasi request menggunakan Zod schema. Data hasil validasi dibaca via `ctx.valid(target)`.

```ts
import { zValidator } from "@buntok/core";
import { z } from "zod";
```

### Validasi Body (JSON)

```ts
const createUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  age: z.number().int().min(17),
});

app.post("/users", zValidator("body", createUserSchema), (ctx) => {
  const data = ctx.valid<z.infer<typeof createUserSchema>>("body");
  return ctx.json(data, 201);
});
```

### Validasi Query

```ts
const paginationSchema = z.object({
  page: z.coerce.number().default(1),
  limit: z.coerce.number().default(10),
});

app.get("/users", zValidator("query", paginationSchema), (ctx) => {
  const { page, limit } = ctx.valid("query");
  return ctx.json({ page, limit });
});
```

### Validasi Params

```ts
const idSchema = z.object({
  id: z.string().uuid(),
});

app.get("/users/:id", zValidator("params", idSchema), (ctx) => {
  const { id } = ctx.valid("params");
  return ctx.json({ id });
});
```

### Content-Type Lain

```ts
// multipart/form-data (file upload)
zValidator("body", schema, { contentType: "multipart/form-data" })

// application/x-www-form-urlencoded
zValidator("body", schema, { contentType: "application/x-www-form-urlencoded" })

// text/plain
zValidator("body", schema, { contentType: "text/plain" })

// application/octet-stream (binary)
zValidator("body", schema, { contentType: "application/octet-stream" })
```

Error response saat validasi gagal:

```json
{
  "success": false,
  "message": "Validation Failed",
  "details": ["body.email: Invalid email"]
}
```

### Validation Shortcuts

Untuk kasus sederhana yang hanya perlu validasi satu target, gunakan shorthand:

```ts
import { validateBody, validateParams } from "@buntok/core";

// Sama dengan zValidator("body", schema)
app.post("/users", validateBody(createUserSchema), (ctx) => {
  const data = ctx.valid("body");
  return ctx.json(data, 201);
});

// Sama dengan zValidator("params", schema)
app.get("/users/:id", validateParams(idSchema), (ctx) => {
  const { id } = ctx.valid("params");
  return ctx.json({ id });
});
```

### zResponse (OpenAPI Metadata)

`zResponse` adalah middleware no-op yang menyisipkan metadata response ke dalam OpenAPI docs (diekspos via `app.openApiDocs`):

```ts
import { zResponse } from "@buntok/core";

app.get("/users",
  zResponse(200, z.array(UserSchema), "List of users"),
  listUsers
);
```

---

## Decorators

Stage 3 TC39 decorators — **tidak perlu** `experimentalDecorators` di tsconfig.

### Route Decorators

| Decorator | Method |
|-----------|--------|
| `@Get(path)` | GET |
| `@Post(path)` | POST |
| `@Put(path)` | PUT |
| `@Patch(path)` | PATCH |
| `@Delete(path)` | DELETE |
| `@Options(path)` | OPTIONS |
| `@Head(path)` | HEAD |
| `@All(path)` | Semua method |

### Middleware & Guard Decorators

```ts
import { Use, UseGuard } from "@buntok/core";

// @Use — attach middleware ke route method
@Use(authMiddleware)
@Get("/profile")
async getProfile(ctx: Context) { ... }

// @UseGuard — guard function yang return boolean; false = 403 Forbidden
@UseGuard(async (ctx) => {
  return ctx.request.headers.has("x-api-key");
})
@Get("/secret")
async secret(ctx: Context) { ... }
```

### DI with Container

```ts
import { Container } from "@buntok/core";

const container = new Container();

// Auto-scan: resolve all dependencies transitively
container.scan([UserController]);

// Or manual registration:
container.registerClass(UserRepository);
container.register(UserService, {
  useFactory: (c) => new UserService(c.resolve(UserRepository)),
});
```

### Contoh Controller Lengkap

```ts
import { Controller, Get, Post, Put, Delete, Use } from "@buntok/core";
import type { Context } from "@buntok/core";
import { zValidator } from "@buntok/core";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
});

@Controller("/users")
export class UserController {
  @Get("/")
  async list(ctx: Context) {
    return ctx.json([]);
  }

  @Get("/:id")
  async getById(ctx: Context) {
    return ctx.json({ id: ctx.params.id });
  }

  @Post("/")
  @Use(zValidator("body", createSchema))
  async create(ctx: Context) {
    const data = ctx.valid("body");
    return ctx.json(data, 201);
  }

  @Put("/:id")
  async update(ctx: Context) {
    return ctx.json({ updated: true });
  }

  @Delete("/:id")
  async remove(ctx: Context) {
    return ctx.status(204);
  }
}

// Register ke app
app.registerController(UserController);
```

---

## Error Handling

### Built-in Error Classes

Throw langsung dari handler — framework auto-catch dan kirim response yang sesuai.

| Class | Status | Deskripsi |
|-------|--------|-----------|
| `HttpError` | base | Base class untuk semua error |
| `BadRequestError` | 400 | Request tidak valid |
| `UnauthorizedError` | 401 | Tidak ada/mode authentication |
| `ForbiddenError` | 403 | Tidak punya akses |
| `NotFoundError` | 404 | Resource tidak ditemukan |
| `MethodNotAllowedError` | 405 | HTTP method tidak diizinkan |
| `ConflictError` | 409 | Konflik data (unique constraint, dll) |
| `UnprocessableEntityError` | 422 | Validasi gagal (business logic) |
| `TooManyRequestsError` | 429 | Rate limit terlampaui |
| `InternalServerError` | 500 | Error server |
| `ServiceUnavailableError` | 503 | Service tidak tersedia |

```ts
import {
  NotFoundError, BadRequestError, UnauthorizedError, ForbiddenError,
  ConflictError, UnprocessableEntityError, TooManyRequestsError,
  MethodNotAllowedError, InternalServerError, ServiceUnavailableError,
} from "@buntok/core";

app.get("/users/:id", async (ctx) => {
  const user = await findUser(ctx.params.id);
  if (!user) throw new NotFoundError("User tidak ditemukan");
  return ctx.json(user);
});

app.post("/users", async (ctx) => {
  const exists = await findUserByEmail(ctx.body.email);
  if (exists) throw new ConflictError("Email sudah terdaftar");
  // ...
});

app.get("/rate-limited", async (ctx) => {
  if (isRateLimited(ctx)) throw new TooManyRequestsError("Coba lagi nanti");
  // ...
});
```

### Override Error Handler

```ts
import { HttpError } from "@buntok/core";

app.onError((err, ctx) => {
  if (err instanceof HttpError) {
    return ctx.json({ error: err.message }, err.status);
  }
  console.error(err);
  return ctx.json({ error: "Internal Server Error" }, 500);
});
```

### Override 404 Handler

```ts
app.notFound((ctx) => {
  return ctx.json({
    error: "Route not found",
    path: new URL(ctx.request.url).pathname,
  }, 404);
});
```

### asyncHandler

Wrapper yang auto-catch error dan return response yang proper. Berguna untuk handler yang tidak throw HttpError:

```ts
import { asyncHandler } from "@buntok/core";

app.get("/users/:id", asyncHandler(async (ctx) => {
  const user = await findUser(ctx.params.id);
  // undefined/null -> 204, HttpError -> status sesuai, Error lain -> 500
  return ctx.json(user);
}));
```

---

## TypeScript Types

Semua type yang dibutuhkan untuk typed development sudah di-export.

```ts
import type {
  // Handler types
  Handler,
  Middleware,
  ErrorHandler,
  NotFoundHandler,

  // Context
  RouteContext,

  // Decorator metadata
  RouteMeta,
  ControllerMeta,

  // Upload
  UploadedFile,
  StorageDriver,
  UploadOptions,
  UploadFieldConfig,
  ParseUploadResult,

  // Config
  CorsOptions,
  HelmetOptions,
  CompressOptions,
  RateLimiterOptions,

  // Utility
  ExtractParams,
  ZodCtx,
} from "@buntok/core";
```

### Contoh Penggunaan

```ts
// Typed error handler
const errorHandler: ErrorHandler = (err, ctx) => {
  if (err instanceof HttpError) {
    return ctx.json({ error: err.message }, err.status);
  }
  return ctx.json({ error: "Internal Server Error" }, 500);
};
app.onError(errorHandler);

// Typed upload config
const uploadConfig: UploadOptions = {
  storage: new LocalDiskStorage("./uploads"),
  fields: {
    avatar: {
      required: true,
      maxFileSize: 2 * 1024 * 1024,
      allowedMimeTypes: ["image/png", "image/jpeg"],
    } satisfies UploadFieldConfig,
  },
};

// Extract route params type
type UserParams = ExtractParams<"/users/:id">;
// { id: string }

// Typed CORS config
const corsConfig: CorsOptions = {
  origin: ["https://myapp.com"],
  methods: ["GET", "POST"],
};
```

---

## IoC Container

### Auto-scan (recommended)

```ts
import { App, Container, Dependencies, Controller, Get } from "@buntok/core";

// Repository — no deps
class UserRepository {
  findAll() { return [{ id: 1 }]; }
}

// Service — declare deps with @Dependencies
@Dependencies(UserRepository)
class UserService {
  constructor(private repo: UserRepository) {}
  getAll() { return this.repo.findAll(); }
}

// Controller — declare deps with @Dependencies
@Dependencies(UserService)
@Controller("/users")
class UserController {
  constructor(private service: UserService) {}
  @Get("/")
  list() { return this.service.getAll(); }
}

// One line resolves entire dependency tree
const app = new App();
const container = new Container();
container.scan([UserController]);  // auto-registers UserRepository → UserService → UserController
app.setContainer(container);
app.registerController(UserController);
```

No `reflect-metadata` needed. `@Dependencies()` explicitly declares what each class needs.

### Manual registration

```ts
const container = new Container();
container.registerClass(UserRepository);
container.register(UserService, {
  useFactory: (c) => new UserService(c.resolve(UserRepository)),
});
app.setContainer(container);
```

### Container API

| Method | Deskripsi |
|--------|-----------|
| `container.register(token, provider)` | Register provider manual |
| `container.registerClass(cls, scope?)` | Auto-register class provider |
| `container.scan(classes[], scope?)` | Auto-scan classes dan resolve dependencies via `emitDecoratorMetadata` |
| `container.resolve(token)` | Resolve instance (dengan DI) |
| `container.get(token)` | Resolve atau `undefined` jika tidak ada |
| `container.has(token)` | Cek apakah token terdaftar |
| `container.hasResolved(token)` | Cek apakah sudah pernah di-resolve |
| `container.clear()` | Reset semua providers (berguna di test) |

### Provider Types

```ts
// Class provider
container.register(MyService, { useClass: MyService, scope: "singleton" });

// Value provider (tidak perlu resolve)
container.register("DB_URL", { useValue: process.env.DATABASE_URL });

// Factory provider
container.register(Database, {
  useFactory: (c) => new Database(c.resolve("DB_URL")),
  scope: "singleton",
});
```

### Scope

| Scope | Deskripsi |
|-------|-----------|
| `"singleton"` | Satu instance untuk seluruh app (default) |
| `"transient"` | Instance baru setiap kali di-resolve |

> Circular dependency detection built-in — throw `Error: Circular dependency detected: ClassName`.

---

## Layered Architecture

`@buntok/core` menyediakan abstract base classes untuk arsitektur bertingkat (**Repository → Service → Controller**).

### Flow Arsitektur

```
BaseRepository (@buntok/prisma | @buntok/drizzle | @buntok/typeorm | custom)
    ↓ extends / inject
BaseService (@buntok/core)
    ↓ extends / inject
BaseController (@buntok/core)
```

`@buntok/core` tidak mengikat developer ke satu ORM saja. Tersedia package BaseRepository resmi untuk berbagai ORM populer, atau developer bisa membuat repositori mandiri.

### Supported ORM Packages

| Package | ORM | Install | Inisialisasi BaseRepository |
|---------|-----|---------|----------------------------|
| [`@buntok/prisma`](https://www.npmjs.com/package/@buntok/prisma) | **Prisma** | `bun add @buntok/prisma @prisma/client` | `super(prisma, "user")` |
| [`@buntok/drizzle`](https://www.npmjs.com/package/@buntok/drizzle) | **Drizzle** | `bun add @buntok/drizzle drizzle-orm` | `super(db, users)` |
| [`@buntok/typeorm`](https://www.npmjs.com/package/@buntok/typeorm) | **TypeORM** | `bun add @buntok/typeorm typeorm` | `super(dataSource, User)` |

---

### Contoh BaseRepository Tiap ORM

#### 1. Prisma (`@buntok/prisma`)

```ts
import { PrismaClient } from "@prisma/client";
import { BaseRepository } from "@buntok/prisma";

export class UserRepository extends BaseRepository<User, CreateUserInput, UpdateUserInput> {
  constructor(prisma: PrismaClient) {
    super(prisma, "user"); // "user" = model name di Prisma schema
  }

  // Method custom jika perlu
  async findByEmail(email: string) {
    return this.delegate.findUnique({ where: { email } });
  }
}
```

#### 2. Drizzle (`@buntok/drizzle`)

```ts
import { drizzle } from "drizzle-orm/bun-sqlite"; // atau drizzle-orm/node-postgres dll
import { BaseRepository } from "@buntok/drizzle";
import { users } from "./db/schema";

export class UserRepository extends BaseRepository<typeof users, CreateUserInput, UpdateUserInput> {
  constructor(db: ReturnType<typeof drizzle>) {
    super(db, users); // schema table Drizzle
  }

  // Method custom jika perlu
  async findByEmail(email: string) {
    return this.findOne({ email });
  }
}
```

#### 3. TypeORM (`@buntok/typeorm`)

```ts
import { DataSource } from "typeorm";
import { BaseRepository } from "@buntok/typeorm";
import { User } from "./entities/user";

export class UserRepository extends BaseRepository<User, CreateUserInput, UpdateUserInput> {
  constructor(dataSource: DataSource) {
    super(dataSource, User); // Entity class TypeORM
  }

  // Method custom jika perlu
  async findByEmail(email: string) {
    return this.findOne({ email });
  }
}
```

---

### Contoh Flow Lengkap (End-to-End dengan Prisma)

#### 1. Install Packages

```bash
bun add @buntok/core @buntok/prisma @prisma/client
# atau
npm install @buntok/core @buntok/prisma @prisma/client
```

#### 2. Repository Layer (`repositories/user.repository.ts`)

```ts
import { PrismaClient } from "@prisma/client";
import { BaseRepository } from "@buntok/prisma";

export interface User {
  id: number;
  name: string;
  email: string;
}

export interface CreateUserInput {
  name: string;
  email: string;
}

export interface UpdateUserInput {
  name?: string;
  email?: string;
}

export class UserRepository extends BaseRepository<User, CreateUserInput, UpdateUserInput> {
  constructor(prisma: PrismaClient) {
    super(prisma, "user");
  }

  async findByEmail(email: string) {
    return this.delegate.findUnique({ where: { email } });
  }
}
```

> **Catatan:** `BaseRepository` otomatis menyediakan method CRUD: `findAll()`, `findById(id)`, `findOne(where)`, `create(data)`, `update(id, data)`, `delete(id)`, `count()`, dan `exists(where)`.

#### 3. Service Layer (`services/user.service.ts`)

```ts
import { BaseService, BadRequestError } from "@buntok/core";
import type { User, CreateUserInput, UpdateUserInput, UserRepository } from "../repositories/user.repository";

export class UserService extends BaseService<User, CreateUserInput, UpdateUserInput> {
  constructor(private userRepo: UserRepository) {
    super(userRepo);
  }

  // Override untuk menambah validasi / custom business logic
  override async create(data: CreateUserInput): Promise<User> {
    const exists = await this.userRepo.findByEmail(data.email);
    if (exists) throw new BadRequestError("Email sudah terdaftar");
    return this.userRepo.create(data);
  }
}
```

> **Catatan:** `BaseService` dari `@buntok/core` otomatis menyediakan: `getAll()`, `getById(id)` *(auto-throw NotFoundError jika null)*, `create(data)`, `update(id, data)`, `delete(id)`, dan `count()`.

#### 4. Controller Layer (`controllers/user.controller.ts`)

```ts
import { BaseController, Controller, Get, Post, Put, Delete } from "@buntok/core";
import type { Context } from "@buntok/core";
import type { User, CreateUserInput, UpdateUserInput } from "../repositories/user.repository";
import type { UserService } from "../services/user.service";

@Controller("/users")
export class UserController extends BaseController<User, CreateUserInput, UpdateUserInput> {
  constructor(private userService: UserService) {
    super(userService);
  }

  // Handler CRUD bawaan otomatis terhubung ke UserService:
  // - GET    /users     -> this.getAll
  // - GET    /users/:id -> this.getById
  // - POST   /users     -> this.create
  // - PUT    /users/:id -> this.update
  // - DELETE /users/:id -> this.delete

  // Override method jika perlu custom logic
  // Method yang di-override tetap menggunakan decorator yang sama (@Delete("/:id"))
  override delete(ctx: Context) {
    return this.userService.getById(Number(ctx.params.id)).then((user) => {
      if (user.email === "admin@example.com") {
        return ctx.error("Admin tidak dapat dihapus", 403);
      }
      return this.userService.delete(Number(ctx.params.id)).then(() => ctx.status(204));
    });
  }
}
```

#### 5. Register ke App

```ts
import { App } from "@buntok/core";
import { PrismaClient } from "@prisma/client";
import { UserRepository } from "./repositories/user.repository";
import { UserService } from "./services/user.service";
import { UserController } from "./controllers/user.controller";

const app = new App();
const prisma = new PrismaClient();

const userRepo = new UserRepository(prisma);
const userService = new UserService(userRepo);
const userController = new UserController(userService);

// Register controller (semua routes otomatis terdaftar)
app.registerController(userController);

app.listen(3000);
```

> **Route otomatis terdaftar:**
> - `GET    /users`     → `getAll`
> - `GET    /users/:id` → `getById`
> - `POST   /users`     → `create`
> - `PUT    /users/:id` → `update`
> - `DELETE /users/:id` → `delete`

---

## Database Connection

`@buntok/core` **tidak menyediakan** database client. Developer mengelola koneksi sendiri dan pass ke Repository.

### Pattern: Manual Setup

```ts
import { App } from "@buntok/core";
import { PrismaClient } from "@prisma/client";
import { UserRepository } from "./repositories/user.repository";
import { UserService } from "./services/user.service";
import { UserController } from "./controllers/user.controller";

// 1. Create database client
const prisma = new PrismaClient();

// 2. Pass ke Repository
const userRepo = new UserRepository(prisma);

// 3. Repository → Service → Controller
const userService = new UserService(userRepo);
const userController = new UserController(userService);

// 4. Register
const app = new App();
app.registerController(userController);
app.listen(3000);
```

### Pattern: Factory Function

```ts
// db.ts
export function createRepositories() {
  const prisma = new PrismaClient();
  return {
    userRepo: new UserRepository(prisma),
    postRepo: new PostRepository(prisma),
  };
}

// index.ts
const { userRepo, postRepo } = createRepositories();
const app = new App();
app.registerController(new UserController(new UserService(userRepo)));
app.registerController(new PostController(new PostService(postRepo)));
```

### Package ORM

| ORM | Package |
|-----|---------|
| Prisma | `@buntok/prisma` |
| Drizzle | `@buntok/drizzle` |
| TypeORM | `@buntok/typeorm` |

---

### Implementasi Repository Mandiri (Custom ORM / Raw SQL)

Jika developer menggunakan ORM lain atau query SQL langsung, cukup buat class repository yang mengimplementasikan kontrak interface `IRepository`:

```ts
interface IRepository<T, CreateInput, UpdateInput> {
  findAll(): Promise<T[]>;
  findById(id: number | string): Promise<T | null>;
  create(data: CreateInput): Promise<T>;
  update(id: number | string, data: UpdateInput): Promise<T>;
  delete(id: number | string): Promise<void | T>;
  count(): Promise<number>;
}
```

---

## SSE (Server-Sent Events)

```ts
app.get("/events", (ctx) => {
  return ctx.sse(async (sse) => {
    // Kirim event
    sse.send({ event: "message", data: "Hello!" });

    // Kirim data object (auto JSON.stringify)
    sse.sendEvent("update", { count: 42 });

    // Dengan ID (untuk client resumption via Last-Event-ID)
    sse.sendWithId("msg-001", "payload");

    // Callback saat client disconnect
    sse.onClose(() => {
      clearInterval(timer);
    });

    // Cek status koneksi
    if (sse.isConnected) { ... }

    // Tutup stream manual
    // sse.close();
  });
});
```

### SSE Options

| Option | Tipe | Default | Deskripsi |
|--------|------|---------|-----------|
| `heartbeatInterval` | `number` | `30000` | Interval heartbeat dalam ms |
| `sendInitial` | `boolean` | `true` | Kirim event "connected" saat pertama |
| `initialEvent` | `string` | `"connected"` | Nama event pertama |
| `retry` | `number` | — | Reconnect interval yang dikirim ke client (ms) |

### createSSE (Alternatif)

`createSSE` adalah helper untuk membuat SSE stream secara manual tanpa `ctx.sse()`:

```ts
import { createSSE } from "@buntok/core";

app.get("/events", (ctx) => {
  const sse = createSSE(ctx.request, {
    heartbeatInterval: 30000,
    retry: 5000,
  });

  // Kirim event
  sse.send({ event: "message", data: "Hello!" });

  // Tutup stream
  sse.close();

  return sse.response();
});
```

---

## WebSocket

Native Bun WebSocket — tanpa polyfill, tanpa abstraction layer.

```ts
app.ws("/chat", {
  open(ws) {
    ws.subscribe("room-general");
    ws.send("Welcome!");
  },
  message(ws, message) {
    ws.publish("room-general", message);
  },
  close(ws, code, reason) {
    console.log("Disconnected", code, reason);
  },
  drain(ws) {
    // Buffer siap ditulis lagi
  },
});

// Broadcast dari luar handler
app.server?.publish("room-general", JSON.stringify({ type: "announcement" }));
```

`app.server` adalah Bun `Server` instance, tersedia setelah `app.listen()` dipanggil.

---

## Cookie Helpers

```ts
import { getCookie, getCookies, setCookie, deleteCookie, parseCookies, serializeCookie } from "@buntok/core";

// Via ctx (paling praktis)
const token = ctx.getCookie("token");
const all = ctx.getCookies();

// Set cookie — returns new Response dengan Set-Cookie header
const response = setCookie(ctx.json({ ok: true }), "token", "abc123", {
  httpOnly: true,
  secure: true,
  sameSite: "lax",
  maxAge: 86_400,
  path: "/",
});

// Delete cookie
const response = deleteCookie(ctx.json({ ok: true }), "token");

// Parse manual dari header string
const cookies = parseCookies(request.headers.get("Cookie") ?? "");

// Serialize manual
const header = serializeCookie("session", "xyz", { httpOnly: true, maxAge: 3600 });
```

### Cookie Options

| Option | Tipe | Deskripsi |
|--------|------|-----------|
| `httpOnly` | `boolean` | Blokir akses dari JavaScript |
| `secure` | `boolean` | Hanya via HTTPS |
| `sameSite` | `"lax" \| "strict" \| "none"` | CSRF protection |
| `maxAge` | `number` | Umur dalam detik |
| `expires` | `Date` | Tanggal kedaluwarsa absolut |
| `path` | `string` | Path scope (default: `"/"`) |
| `domain` | `string` | Domain scope |
| `partitioned` | `boolean` | Partitioned cookie (CHIPS) |

---

## Logger

```ts
import { logger, Logger, LogLevel } from "@buntok/core";

// logger adalah singleton default
logger.info("Server started", { port: 3000 });
logger.warn("High memory usage", { mb: 512 });
logger.error("DB connection failed", { host: "localhost" });
logger.debug("Query executed", { sql: "SELECT ..." });
```

### Konfigurasi

```ts
const myLogger = new Logger({
  level: LogLevel.DEBUG,  // filter level minimum
  format: "json",         // "text" (dev) atau "json" (prod)
  logRequests: true,      // log setiap incoming request (default: true)
});
```

Default behavior:
- **Development** (`NODE_ENV` != `"production"`): format `text`, level `INFO`
- **Production**: format `json`, level `WARN`

### Log ke File

```bash
LOG_DIR=./logs bun run app.ts
# Menulis ke ./logs/app-YYYY-MM-DD.log
```

### Log Levels

| Level | Nilai | Termasuk |
|-------|-------|---------|
| `LogLevel.DEBUG` | 0 | Debug, info, warn, error |
| `LogLevel.INFO` | 1 | Info, warn, error |
| `LogLevel.WARN` | 2 | Warn, error |
| `LogLevel.ERROR` | 3 | Error saja |

### Env Variables

| Var | Efek |
|-----|------|
| `NODE_ENV=production` | format JSON, level WARN |
| `LOG_DIR=./logs` | tulis log ke file |
| `LOG_REQUESTS=false` | nonaktifkan request logging |

---

## Health Check

```ts
import { healthCheck, createDatabaseCheck, createHealthCheck } from "@buntok/core";

// Simple
healthCheck(app, {
  path: "/health",      // default: "/health"
  version: "1.0.0",    // opsional
  includeUptime: true, // default: true
});
// GET /health -> { status: "healthy", uptime: 123, version: "1.0.0", timestamp: "..." }

// Dengan database check
healthCheck(app, {
  check: createDatabaseCheck(async () => {
    await db.query("SELECT 1");
    return true; // false = unhealthy
  }),
});

// Multiple service checks
healthCheck(app, {
  check: createHealthCheck([
    { name: "database", check: () => db.ping() },
    { name: "redis",    check: () => redis.ping() },
    { name: "storage",  check: () => s3.headBucket() },
  ]),
});
// Response 200 jika semua sehat, 503 jika ada yang unhealthy
```

---

## Queue

```ts
import { Queue } from "@buntok/core";

const queue = new Queue<{ email: string }>("emails");
queue.process(async (job) => {
  await sendEmail(job.data.email);
});

await queue.add({ email: "user@example.com" });
await queue.drain({ timeout: 5000 });
await queue.close();
```

`Queue` exposes `add`, `process`, `size`, `drain`, `close`, `pause`, and `resume`.
Call `app.registerResource(queue)` when the queue belongs to an `App`, so
`app.close()` releases its worker and connection resources.

### Driver capabilities

| Driver | Durability | Delivery | Crash recovery | Dead letter | `size()` |
|--------|------------|----------|----------------|-------------|----------|
| Memory | Process-local | Best effort | No | No | Exact count |
| Redis / Bun Redis | Persistent storage | At least once | Not guaranteed | No | `null` |
| BullMQ | Persistent storage | At least once | Yes | No | `null` |
| RabbitMQ | Persistent when configured durable | At least once | Yes | No | `null` |

The memory driver does not recover jobs after a process crash. External drivers
do not claim dead-letter support unless their driver configuration provides it.
`size()` returns `null` when a driver cannot determine the queue size without
making an unsupported guarantee.

---

## File Upload

Buntok menyediakan upload handler untuk `multipart/form-data` — mendukung validasi per-field, custom filename, storage driver, dan file deletion.

```ts
import {
  uploader, parseUploads, deleteUploadedFile,
  LocalDiskStorage, MemoryStorage,
} from "@buntok/core";
```

### Upload Options

| Option | Tipe | Default | Deskripsi |
|--------|------|---------|-----------|
| `storage` | `StorageDriver` | — | **wajib** — `LocalDiskStorage`, `MemoryStorage`, atau custom driver |
| `filename` | `(original, file) => string` | `original-uuid.ext` | Global default filename generator |
| `fields` | `Record<string, UploadFieldConfig>` | — | Whitelist & validasi per-field |

> **Note:** `maxFileSize` dan `allowedMimeTypes` sekarang di level per-field, bukan global.

### Upload Field Config

| Option | Tipe | Default | Deskripsi |
|--------|------|---------|-----------|
| `required` | `boolean` | `false` | Wajib ada atau tidak |
| `maxFileSize` | `number` | — | Maksimal ukuran file (bytes) |
| `allowedMimeTypes` | `string[]` | — | MIME types yang diizinkan |
| `filename` | `(original, file) => string` | — | Custom filename generator untuk field ini |

### Built-in Storage Drivers

| Driver | Penjelasan |
|--------|-----------|
| `LocalDiskStorage(dir)` | Simpan file ke direktori di disk, auto-create folder |
| `MemoryStorage` | Simpan file di memory sebagai `ArrayBuffer` |

### Middleware Approach (Recommended)

`uploader()` adalah middleware yang auto-parse dan validasi. Jika gagal, langsung return 400.

```ts
app.post("/upload",
  uploader({
    storage: new LocalDiskStorage("./uploads"),
    fields: {
      avatar: {
        required: true,
        maxFileSize: 2 * 1024 * 1024,  // 2MB
        allowedMimeTypes: ["image/png", "image/jpeg"],
      },
      document: {
        required: true,
        maxFileSize: 10 * 1024 * 1024,  // 10MB
        allowedMimeTypes: ["application/pdf"],
      },
    },
  }),
  async (ctx) => {
    const files = ctx.store.files;        // UploadedFile[]
    const fileMap = ctx.store.fileMap;     // Record<string, UploadedFile | UploadedFile[]>
    const fields = ctx.store.fields;      // Record<string, string> (text fields)

    return ctx.json({ uploaded: files.length });
  }
);
```

### Manual Approach

Panggil `parseUploads()` langsung untuk kontrol penuh. Jika validasi gagal, otomatis **throw `BadRequestError`** (400).

```ts
app.post("/upload", asyncHandler(async (ctx) => {
  // throw BadRequestError jika validasi gagal (size, mime, required)
  const result = await parseUploads(ctx, {
    storage: new LocalDiskStorage("./uploads"),
    filename: (_, file) => `avatar-${Date.now()}.${file.type}`,
    fields: {
      avatar: {
        required: true,
        maxFileSize: 2 * 1024 * 1024,
        allowedMimeTypes: ["image/png", "image/jpeg"],
      },
    },
  });

  // result hanya berisi data sukses — error sudah throw di atas
  return ctx.json({ files: result.files });
}));
```

### Custom Filename

```ts
// Global default
const result = await parseUploads(ctx, {
  storage: new LocalDiskStorage("./uploads"),
  filename: (originalName, file) => {
    const ext = originalName.split(".").pop();
    return `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  },
  fields: { avatar: { required: true } },
});

// Per-field override
const result = await parseUploads(ctx, {
  storage: new LocalDiskStorage("./uploads"),
  fields: {
    avatar: {
      required: true,
      filename: (name) => `avatars/${Date.now()}-${name}`,
    },
    document: {
      required: true,
      filename: (name) => `docs/${crypto.randomUUID()}-${name}`,
    },
  },
});
```

> **Auto-extension:** Jika filename callback tidak return extension, framework otomatis tambah dari file asli.

### Multi-Upload (Same Field Name)

Jika field name sama untuk beberapa file, `fileMap` otomatis jadi array:

```ts
// Client: <input type="file" name="photos" multiple>

app.post("/gallery",
  uploader({
    storage: new LocalDiskStorage("./gallery"),
    fields: {
      photos: { maxFileSize: 10 * 1024 * 1024 },
    },
  }),
  async (ctx) => {
    const photos = ctx.store.fileMap["photos"]; // UploadedFile[]
    return ctx.json({ count: photos.length });
  }
);
```

### UploadedFile Object

```ts
{
  originalName: string;   // nama file asli dari client
  filename: string;       // nama file setelah di-generate
  size: number;           // ukuran dalam bytes
  type: string;           // MIME type (e.g. "image/png")
  buffer?: ArrayBuffer;   // ada jika MemoryStorage
  path?: string;          // ada jika LocalDiskStorage (absolute path)
}
```

### Custom Storage Driver

Untuk connect ke provider lain (AWS S3, Google Cloud Storage, Cloudflare R2, dll), implement `StorageDriver` interface:

```ts
import type { StorageDriver, UploadedFile } from "@buntok/core";

class S3Storage implements StorageDriver {
  constructor(private bucket: string, private region: string) {}

  async handleFile(file: File, filename: string): Promise<UploadedFile> {
    const buffer = await file.arrayBuffer();

    // Upload ke S3 (contoh pakai AWS SDK)
    await s3.send(new PutObjectCommand({
      Bucket: this.bucket,
      Key: filename,
      Body: new Uint8Array(buffer),
      ContentType: file.type,
    }));

    return {
      originalName: file.name,
      filename,
      size: file.size,
      type: file.type,
    };
  }

  async deleteFile(filename: string): Promise<boolean> {
    try {
      await s3.send(new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: filename,
      }));
      return true;
    } catch {
      return false;
    }
  }
}

// Gunakan
app.post("/upload", asyncHandler(async (ctx) => {
  const result = await parseUploads(ctx, {
    storage: new S3Storage("my-bucket", "us-east-1"),
    fields: {
      avatar: { required: true, maxFileSize: 2 * 1024 * 1024 },
    },
  });
  return ctx.json({ files: result.files });
}));
```

#### Cloudflare R2

```ts
class R2Storage implements StorageDriver {
  constructor(private bucket: R2Bucket) {}

  async handleFile(file: File, filename: string): Promise<UploadedFile> {
    await this.bucket.put(filename, file, {
      httpMetadata: { contentType: file.type },
    });
    return {
      originalName: file.name,
      filename,
      size: file.size,
      type: file.type,
    };
  }

  async deleteFile(filename: string): Promise<boolean> {
    await this.bucket.delete(filename);
    return true;
  }
}
```

### File Deletion

Hapus file yang sudah di-upload menggunakan `deleteUploadedFile`:

```ts
import { deleteUploadedFile, LocalDiskStorage } from "@buntok/core";

const storage = new LocalDiskStorage("./uploads");

// Upload
const result = await parseUploads(ctx, {
  storage,
  fields: { avatar: { required: true } },
});

const avatar = result.fileMap.avatar;

// Hapus file
const deleted = await deleteUploadedFile(storage, avatar);
// deleted = true jika berhasil, false jika gagal
```

Atau langsung akses `storage.deleteFile()`:

```ts
// Hapus berdasarkan path
await storage.deleteFile("/absolute/path/to/file.jpg");

// Hapus dari UploadedFile
if (storage.deleteFile && avatar.path) {
  await storage.deleteFile(avatar.path);
}
```

> **Note:** `deleteFile()` adalah method **optional** pada `StorageDriver`. Jika storage tidak implement (misal MemoryStorage), return `false`.

---

## Crypto Helpers

Hash, random, dan encryption — semua tanpa dependency, berbasis WebCrypto API.

```ts
import {
  hash, sha256, sha512, md5, hmac, hashVerify,
  randomBytes, randomHex, randomAlphaNumeric, randomToken,
  encrypt, decrypt,
} from "@buntok/core";
```

### Hashing

```ts
// Hash dengan algoritma pilihan (default: SHA-256)
const digest = await hash("password", "SHA-256");
// => "5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8"

const d2 = await sha256("password");  // shorthand
const d3 = await sha512("password");

// MD5 — untuk legacy/cache keys, BUKAN untuk keamanan
const m = await md5("hello");
// => "5d41402abc4b2a76b9719d911017c592"

// HMAC
const signature = await hmac("message", "secret-key", "SHA-256");

// Timing-safe verify
const valid = await hashVerify("password", digest); // true/false
```

### Random

```ts
randomBytes(16);            // Uint8Array(16)
randomHex(32);              // "a1b2c3..." (32 hex chars)
randomAlphaNumeric(16);     // "Kx7Gm2pL9qR4nB8w"
randomToken(32);            // URL-safe base64 token
```

### Encrypt / Decrypt (AES-256-GCM)

```ts
const { ciphertext, iv } = await encrypt("secret data", "my-key");
const plain = await decrypt(ciphertext, "my-key", iv);
// => "secret data"

// Dengan custom IV (opsional)
const iv = crypto.getRandomValues(new Uint8Array(12));
const { ciphertext } = await encrypt("data", "key", iv);
```

---

## Password Helpers

Password hashing menggunakan **Bun.password** dengan argon2id — 2-10x lebih cepat dari scrypt.

```ts
import { hashPassword, verifyPassword } from "@buntok/core";
```

```ts
// Hash password (argon2id via Bun.password)
const hashed = await hashPassword("mypassword");

// Verify password
const valid = await verifyPassword("mypassword", hashed);  // true
const invalid = await verifyPassword("wrong", hashed);      // false

// Backward compatible dengan hash lama scrypt/PBKDF2
const legacyHash = "scrypt:a1b2c3d4...";
await verifyPassword("password", legacyHash); // masih works
```

---

## String Helpers

```ts
import { slugify, truncate, capitalize, camelCase, snakeCase, kebabCase } from "@buntok/core";
```

```ts
slugify("Hello World!");       // "hello-world"
truncate("Lorem ipsum dolor", 10); // "Lorem ipsu..."
capitalize("hello");           // "Hello"
camelCase("hello-world");     // "helloWorld"
snakeCase("helloWorld");      // "hello_world"
kebabCase("helloWorld");      // "hello-world"
```

---

## Object Helpers

```ts
import {
  pick, omit, groupBy, uniq, flatten, chunk,
  deepMerge, flattenObject,
} from "@buntok/core";
```

```ts
// Pick & Omit
pick({ a: 1, b: 2, c: 3 }, ["a", "c"]);   // { a: 1, c: 3 }
omit({ a: 1, b: 2, c: 3 }, ["b"]);        // { a: 1, c: 3 }

// Group & Unique
groupBy([{ type: "a" }, { type: "b" }, { type: "a" }], "type");
// => { a: [{ type: "a" }, ...], b: [{ type: "b" }] }

uniq([1, 2, 2, 3]);  // [1, 2, 3]

// Flatten & Chunk
flatten([[1, 2], [3, [4, 5]]]);  // [1, 2, 3, 4, 5]
chunk([1, 2, 3, 4, 5], 2);      // [[1, 2], [3, 4], [5]]

// Deep Merge
deepMerge({ a: 1, b: { c: 2 } }, { b: { d: 3 } });
// => { a: 1, b: { c: 2, d: 3 } }

// Flatten Object (dot notation)
flattenObject({ a: { b: { c: 1 } } });
// => { "a.b.c": 1 }
```

---

## Number Helpers

```ts
import { clamp, random, randomFloat, formatNumber, formatBytes, formatCurrency } from "@buntok/core";
```

```ts
clamp(15, 0, 10);          // 10
clamp(-5, 0, 10);          // 0

random(1, 100);            // 42 (integer)
randomFloat(1.5, 3.5);     // 2.731

formatNumber(1000000);     // "1,000,000"
formatBytes(1536);         // "1.5 KB"
formatBytes(1048576);      // "1 MB"
formatCurrency(1000);      // "$1,000.00"
formatCurrency(1000, "EUR", "id-ID"); // "€1.000"
```

---

## Date Helpers

```ts
import { formatDate, timeAgo } from "@buntok/core";
```

```ts
formatDate(new Date());                         // "2024-01-15T10:30:00.000Z"
timeAgo(new Date(Date.now() - 180000));         // "3 minutes ago"
timeAgo(new Date(Date.now() - 7200000));        // "2 hours ago"
timeAgo(new Date(Date.now() - 86400000));       // "1 day ago"
```

---

## ID & Code Generators

```ts
import { generateCode, nanoid, ulid, resetCounter } from "@buntok/core";
```

```ts
// Sequential code dengan prefix
generateCode("T");       // "T0001"
generateCode("T");       // "T0002"
generateCode("INV");     // "INV0001"
generateCode("ORD", 42); // "ORD0042"

// Reset counter
resetCounter("T");
generateCode("T");       // "T0001" (back to start)

// Nanoid (URL-safe unique ID)
nanoid();     // "V1StGXR8_Z5jdHi6B-myT" (21 chars)
nanoid(10);   // "V1StGXR8_Z5" (10 chars)

// ULID (time-ordered, sortable by creation time)
ulid();       // "01ARZ3NDEKTSV4RRFFQ69G5FAV"
```

---

## Network Helpers

```ts
import { getClientIP, isPrivateIP, parseUserAgent } from "@buntok/core";
```

```ts
// Client IP (respects X-Forwarded-For, X-Real-IP)
const ip = getClientIP(request);

// Check private/reserved IP
isPrivateIP("192.168.1.1");  // true
isPrivateIP("8.8.8.8");      // false

// Parse User-Agent
const ua = parseUserAgent(request);
// => { browser: "Chrome", os: "Windows", device: "Desktop" }
```

---

## Async Helpers

```ts
import { delay, retry } from "@buntok/core";
```

```ts
// Delay / sleep
await delay(1000); // tunggu 1 detik

// Retry dengan backoff
const data = await retry(
  () => fetch("https://api.example.com/data").then(r => r.json()),
  {
    retries: 3,        // maksimal 3 retry (total 4 attempts)
    delay: 1000,       // mulai dari 1 detik
    backoff: "exponential", // 1s → 2s → 4s
  }
);

// Retry dengan custom error filter
await retry(
  () => riskyOperation(),
  {
    retries: 5,
    delay: 500,
    onError: (err, attempt) => {
      // return false untuk stop retry
      return !(err instanceof RateLimitError);
    },
  }
);
```

---

## Security Headers (Helmet)

```ts
import { helmet } from "@buntok/core";
```

Menambahkan security headers standar ke semua response:

| Header | Default |
|--------|---------|
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `DENY` |
| `X-XSS-Protection` | `0` |
| `Referrer-Policy` | `no-referrer` |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` |
| `X-DNS-Prefetch-Control` | `on` |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` |

```ts
// Default — semua standard headers
app.use(helmet());

// Custom options
app.use(helmet({
  frameOptions: "SAMEORIGIN",
  hsts: "max-age=63072000",
  additionalHeaders: { "X-Custom-Header": "value" },
}));
```

---

## Request Timeout

```ts
import { timeout } from "@buntok/core";
```

```ts
// Auto-return 408 jika handler lebih dari 5 detik
app.get("/slow", timeout(5000), async (ctx) => {
  await longOperation();
  return ctx.json({ ok: true });
});

// Custom timeout dan pesan error
app.post("/upload", timeout(30000, "Upload timed out"), async (ctx) => {
  // ...
});
```

`TimeoutError` bisa di-catch untuk logging:

```ts
import { timeout, TimeoutError } from "@buntok/core";

app.get("/data", timeout(5000), async (ctx) => {
  try {
    const data = await fetchData();
    return ctx.json(data);
  } catch (err) {
    if (err instanceof TimeoutError) {
      console.log(`Request timed out after ${err.timeoutMs}ms`);
    }
    throw err;
  }
});
```

---

## Testing

`app.request()` mendispatch request tanpa membuka port nyata:

```ts
import { App } from "@buntok/core";

const app = new App();
app.get("/ping", (ctx) => ctx.json({ pong: true }));

// Test tanpa server
const res = await app.request("/ping");
const data = await res.json();

console.assert(res.status === 200);
console.assert(data.pong === true);

// Dengan method dan body
const res2 = await app.request("/users", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ name: "Budi", email: "budi@example.com" }),
});
```

Kompatibel dengan Bun test runner:

```ts
import { describe, test, expect, beforeAll } from "bun:test";
import { App } from "@buntok/core";

const app = new App();
app.get("/users", (ctx) => ctx.json([]));

describe("Users API", () => {
  test("GET /users returns 200", async () => {
    const res = await app.request("/users");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([]);
  });
});
```

---

## License

MIT
