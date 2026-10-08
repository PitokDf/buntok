# Buntok Framework Benchmarks

Performance benchmarks for Buntok framework optimizations.

## What's Benchmarked

### 1. Router & Query String
- JSTrie insert/match operations
- Query string parsing (URLSearchParams vs FFI vs JS fallback)
- Cookie parsing

### 2. Zod Validation
- Raw `safeParse()` vs compiled `z.compile()`
- Simple schemas, invalid data, complex nested objects

### 3. Password Hashing
- `Bun.password.hash()` (argon2id) vs legacy formats
- Different password lengths
- Verification speed

### 4. Crypto Hashing
- `fastHash()` (Bun.hash) vs SHA-256/SHA-512/MD5
- Different data sizes
- Bun.hash vs crypto.subtle

## Usage

```bash
# Run all benchmarks
bun run benchmarks/run-all.sh

# Run individual benchmarks
bun run benchmarks/router.bench.ts
bun run benchmarks/validation.bench.ts
bun run benchmarks/password.bench.ts
bun run benchmarks/crypto.bench.ts
```

## Dependencies

- `mitata` - Benchmarking library
- All other imports are from `@buntok/core` source

## Notes

- Benchmarks use `mitata` for accurate measurements
- Results may vary based on hardware and system load
- Password hashing benchmarks include async operations
- FFI benchmarks gracefully fallback to JS if native FFI unavailable
