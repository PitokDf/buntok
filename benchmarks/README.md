# benchmark-suite

Throughput benchmark for **Buntok** vs **Express**, **Fastify**, **Hono**, and **Elysia**.

## Methodology

- **Four spec routes** (same contract as
  [bun-http-framework-benchmark](https://github.com/SaltyAom/bun-http-framework-benchmark)
  so results are directly comparable):
  1. **Ping** - `GET /` → `Hi` (`text/plain`)
  2. **Query** - `GET /id/1?name=bun` → `1 bun`, dynamic query extraction,
     `x-powered-by: benchmark`
  3. **Body** - `POST /json` with `{"hello":"world"}` → mirrored JSON
  4. **Video** - `GET /video` streams `public/kyuukurarin.mp4` (14.1 MB)
     without buffering, full `200` even with a non-matching `If-None-Match`
- **Background routes**: 112 `GET` + 112 `POST` routes from
  `extra-routes.mjs` are registered by every framework but never requested -
  the route table matches a small real-world service.
- **Load generator**: `bombardier --fasthttp`, 10 s per route,
  500 connections (Video: 10).
- **Rounds**: `BENCH_ROUNDS` (default 3) - round 0 is a warmup pass
  (spec verification, memory sampling, time series), rounds 1..N-1 are
  measured; the **best measured req/s per route wins** (best-of). Framework
  order is rotated every round so no framework always runs hot or cold.
- **Runtimes**: every framework (Express, Fastify, Hono, Elysia, Buntok)
  runs on **bun**.
- **Build**: every app is minified with `Bun.build` and the built artifact
  is what gets measured (bundle size column).
- **Verification**: the four-route spec (dynamic-query edge cases and an
  extra-route parity check too) is asserted before any load test - a
  mismatch aborts the run.
- **Pinning** (Linux): server processes on cores `0..N/2-1`, load generator
  on cores `N/2..N-1` (`taskset`).
- **Scoring**: average = mean of per-route req/s; P50 = median across
  routes; P99 = worst route.

## Run

```bash
# spec verification only (build + spawn + assert responses)
bun run benchmarks/runner.ts --verify

# full run (~12 minutes) → dashboard-data.json
bun run bench:all
```

Environment knobs: `BENCH_ROUNDS` (≥2), `BENCH_CONNS`, `BENCH_DURATION`
(e.g. `10s`).

The runner writes `dashboard-data.json` to the repo root,
`benchmarks/dashboard/public/`, and `packages/buntok-docs/public/` (the
docs benchmarks page).

Output data shape:

- `machine` - CPU, cores, memory, OS, runtimes, date
- `methodology` - everything above, machine-readable (rendered by the docs
  page)
- `frameworks.<name>` - `runtime`, `startupTime`, `bundleSize`,
  `memoryBefore`/`memoryAfter`, and one entry per route
  (`reqPerSec` best-of, `rounds[]` raw values, latency percentiles)
- `timeSeries.<name>` - per-second req/s on `GET /` (autocannon, 100
  connections, 10 s, warmup round only)
