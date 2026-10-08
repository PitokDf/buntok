# Contract Mismatches - @buntok/core

Tracking file for known contract mismatches between documentation, exports, and runtime behavior.

## Active Mismatches

### 1. `@All` decorator route support

- **Severity:** release-blocking
- **Category:** code-required
- **Description:** `@All` decorator exists in `decorators.ts` and is exported, but it must match `app.all()` behavior. If `app.all()` supports multiple HTTP methods, `@All` must register the route for all methods. If not, it should be removed from supported claims.
- **Action:** Verify `@All` decorator registers routes for all HTTP methods. If it only registers one method, either fix or remove.
- **Status:** pending

### 2. `@Redirect` behavior

- **Severity:** docs-required
- **Category:** docs-required
- **Description:** `@Redirect` decorator exists in `decorators.ts` and is exported. The behavior must either:
  a) Skip executing the handler and return a redirect response, OR
  b) Be documented as "handler executes, redirect overrides response"
- **Action:** Verify actual behavior and document accordingly.
- **Status:** pending

### 3. Binary return types in `HandlerReturn`

- **Severity:** docs-required
- **Category:** code-required
- **Description:** `HandlerReturn` type in `app.ts` should include binary return types (Buffer, Uint8Array, ArrayBuffer, Blob) if the framework supports them. Currently `toResponse()` handles binary, but `HandlerReturn` type may not reflect this.
- **Action:** Verify `HandlerReturn` includes binary types or remove binary examples from docs.
- **Status:** pending

### 4. `sqliteStore` export location

- **Severity:** docs-required
- **Category:** docs-required
- **Description:** `sqliteStore` is exported from `@buntok/core` via `core-exports.ts` (from `middlewares/rate-limiter.ts`). Verify that main-package examples import it from `@buntok/core` and not from a subpath.
- **Action:** Verify examples use `import { sqliteStore } from "@buntok/core"`.
- **Status:** pending

### 5. `Factory.ref()` eagerness

- **Severity:** docs-required
- **Category:** docs-required
- **Description:** `Factory.ref()` may be eager (resolves immediately) or lazy (resolves on first use). The behavior must be documented.
- **Action:** Verify actual behavior and document.
- **Status:** pending

### 6. Deprecated aliases

- **Severity:** docs-required
- **Category:** docs-required
- **Description:** `UseGuards` is marked as deprecated alias for `UseGuard`. All deprecated aliases must identify the correct current API in docs and code comments.
- **Action:** Audit all deprecated aliases for correct documentation.
- **Status:** pending

## Resolved Mismatches

(Add resolved mismatches here as they are fixed)

- None yet.
