import type { Metadata } from "next";
import { readFile } from "node:fs/promises";
import path from "node:path";
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Cpu,
  Database,
  Layers,
  Server,
  Timer,
  TrendingUp,
  Trophy,
  Zap,
} from "lucide-react";
import { BenchmarkChartsLoader } from "@/components/landing/BenchmarkChartsLoader";
import { Header } from "@/components/layout/Header";

export const metadata: Metadata = {
  title: "Benchmarks | Buntok Framework Performance",
  description:
    "Hasil benchmark real-time Buntok vs Express vs Hono vs Elysia vs Fastify: throughput, latency, cold startup time.",
  openGraph: {
    title: "Buntok Framework Benchmarks",
    description:
      "Performance comparison: Buntok, Hono, Elysia, Express, Fastify on Bun runtime.",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Buntok Framework Benchmarks",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Buntok Framework Benchmarks",
    description:
      "Performance comparison: Buntok, Hono, Elysia, Express, Fastify on Bun runtime.",
    images: [
      {
        url: "/twitter-image",
        width: 1200,
        height: 630,
        alt: "Buntok Framework Benchmarks",
      },
    ],
  },
};

const ACCENT = "#f97316";
const COLORS = ["#64748b", "#3b82f6", "#8b5cf6", "#10b981", "#f59e0b"];
const FW_COLOR = (fw: string, idx: number) =>
  fw === "buntok" ? ACCENT : COLORS[idx % COLORS.length];

const ALL_ROUTES = ["/", "/id/1?name=bun", "POST /json", "/video"] as const;

const ROUTE_META: Record<string, { name: string; desc: string }> = {
  "/": { name: "Ping", desc: "static 2-byte body - routing + write path" },
  "/id/1?name=bun": {
    name: "Query",
    desc: 'dynamic params + query parsing, must echo "1 bun"',
  },
  "POST /json": {
    name: "Body",
    desc: 'JSON parse + mirror of {"hello":"world"}',
  },
  "/video": {
    name: "Video",
    desc: "14.1 MB mp4 stream at 10 connections, no buffering",
  },
};

const MEDALS = ["#f59e0b", "#a1a1aa", "#b45309"];

const median = (values: number[]) => {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
};

const fmtInt = (v?: number | null) =>
  v === undefined || v === null || Number.isNaN(v)
    ? "-"
    : Math.round(v).toLocaleString("en-US");

const fmtMs = (us?: number | null) =>
  us === undefined || us === null || Number.isNaN(us)
    ? "-"
    : (us / 1000).toFixed(1);

const fmtScore = (v?: number | null) =>
  v === undefined || v === null || Number.isNaN(v) ? "-" : fmtInt(v);

const formatMB = (bytes?: number | null) =>
  bytes === undefined || bytes === null
    ? "n/a"
    : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

const formatKB = (bytes?: number | null) =>
  bytes === undefined || bytes === null
    ? "n/a"
    : bytes < 1024 * 1024
      ? `${(bytes / 1024).toFixed(1)} KB`
      : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

const barPct = (v: number, max: number) =>
  max > 0 ? Math.max(1.5, (v / max) * 100) : 0;

const EMPTY_DATA = {
  machine: {
    cpu: "",
    cores: 0,
    memory: "",
    os: "",
    runtime: "",
    date: new Date().toISOString(),
  },
  methodology: null,
  frameworks: {},
  timeSeries: {},
};

async function getBenchmarkData() {
  const base = process.env.BASE_URL;
  console.log("Fetching benchmark data from", base ?? "local file");
  try {
    if (base === "/" || base === undefined) {
      const file = await readFile(
        path.join(process.cwd(), "public", "dashboard-data.json"),
        "utf8",
      );
      return JSON.parse(file);
    } else {
      const res = await fetch(`${base}/dashboard-data.json`, {
        next: { revalidate: 3600 },
      });
      if (res.ok) return res.json();
    }
  } catch (e) {
    console.error("Failed to load benchmark data", e);
    return EMPTY_DATA;
  }
}

type BenchmarkData =
  ReturnType<typeof getBenchmarkData> extends Promise<infer T> ? T : never;

function SectionHeading({
  index,
  title,
  hint,
  icon,
}: {
  index: string;
  title: string;
  hint?: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-4">
      <span className="flex items-center gap-2">
        <span className="text-[#f97316]">{icon}</span>
        <span className="text-xs font-semibold uppercase tracking-widest text-[#f97316]">
          {index}
        </span>
        <h2 className="text-lg font-semibold text-text-primary">{title}</h2>
      </span>
      {hint ? (
        <span className="text-xs text-text-secondary">{hint}</span>
      ) : null}
    </div>
  );
}

function BenchmarkPage({ data }: { data: BenchmarkData }) {
  const { machine, methodology, frameworks, timeSeries } = data;
  const fwNames = Object.keys(frameworks) as string[];
  const hasData = fwNames.length > 0;

  const routes = ALL_ROUTES.filter((r) =>
    fwNames.some((fw) => frameworks[fw]?.[r]?.reqPerSec !== undefined),
  ) as string[];
  const routeCount = routes.length || 1;

  const overallData = fwNames
    .map((fw, i) => {
      const fwData = frameworks[fw];
      const rpsValues = routes.map((r) => fwData[r]?.reqPerSec || 0);
      const avgRps = rpsValues.reduce((acc, r) => acc + r, 0) / routeCount;
      const p50Us = median(routes.map((r) => fwData[r]?.latencyP50 || 0));
      const p99Us = Math.max(
        0,
        ...routes.map((r) => fwData[r]?.latencyP99 || 0),
      );
      const memBefore = fwData.memoryBefore as number | undefined;
      const memAfter = fwData.memoryAfter as number | undefined;
      const requests = routes.reduce(
        (acc, r) => acc + (fwData[r]?.requests || 0),
        0,
      );
      const errors = routes.reduce(
        (acc, r) => acc + (fwData[r]?.errors || 0),
        0,
      );

      return {
        name: fw as string,
        score: avgRps,
        avgRps: Math.round(avgRps),
        p50Us,
        p99Us,
        p50Ms: p50Us / 1000,
        p99Ms: p99Us / 1000,
        startupTimeMs: Math.round(fwData.startupTime),
        bundleSize: fwData.bundleSize as number | undefined,
        memoryBefore: memBefore,
        memoryAfter: memAfter,
        memoryGrowth:
          memBefore !== undefined && memAfter !== undefined
            ? memAfter - memBefore
            : undefined,
        runtime: fwData.runtime as string | undefined,
        requests,
        errors,
        color: FW_COLOR(fw as string, i),
      };
    })
    .sort((a, b) => b.score - a.score);

  const fastest = overallData[0];
  const second = overallData[1];
  const star = overallData.find((f) => f.name === "buntok") || fastest;
  const rank = overallData.findIndex((f) => f.name === star?.name) + 1;

  const totalRequests = overallData.reduce((acc, f) => acc + f.requests, 0);
  const totalErrors = overallData.reduce((acc, f) => acc + f.errors, 0);

  const fastestStartup = [...overallData].sort(
    (a, b) => a.startupTimeMs - b.startupTimeMs,
  )[0];
  const maxStartup = Math.max(1, ...overallData.map((f) => f.startupTimeMs));

  const leadPct =
    fastest && second && second.score > 0
      ? ((fastest.score - second.score) / second.score) * 100
      : 0;

  const perRoute = routes.map((route) => {
    const rows = overallData
      .map((fw) => {
        const rd = frameworks[fw.name]?.[route];
        return {
          ...fw,
          rps: rd?.reqPerSec as number | undefined,
          routeP50Us: rd?.latencyP50 as number | undefined,
          routeP99Us: rd?.latencyP99 as number | undefined,
          routeRequests: (rd?.requests as number | undefined) || 0,
          routeErrors: (rd?.errors as number | undefined) || 0,
          rounds: rd?.rounds as number[] | undefined,
        };
      })
      .filter((r) => r.rps !== undefined)
      .sort((a, b) => (b.rps || 0) - (a.rps || 0));
    return { route, meta: ROUTE_META[route], rows };
  });

  const warmupCount = methodology?.warmupRounds ?? 1;

  const bestP50 = Math.min(Infinity, ...overallData.map((f) => f.p50Ms));
  const bestP99 = Math.min(Infinity, ...overallData.map((f) => f.p99Ms));
  const bestStartup = Math.min(
    Infinity,
    ...overallData.map((f) => f.startupTimeMs),
  );
  const bestBundle = Math.min(
    Infinity,
    ...overallData.map((f) => f.bundleSize ?? Infinity),
  );
  const bestGrowth = Math.min(
    Infinity,
    ...overallData.map((f) => f.memoryGrowth ?? Infinity),
  );

  const machineChips = [
    { icon: <Cpu className="w-3.5 h-3.5" />, label: machine.cpu },
    {
      icon: <Database className="w-3.5 h-3.5" />,
      label: `${machine.cores} cores · ${machine.memory} RAM`,
    },
    { icon: <Server className="w-3.5 h-3.5" />, label: machine.os },
    { icon: <Activity className="w-3.5 h-3.5" />, label: machine.runtime },
    {
      icon: <Timer className="w-3.5 h-3.5" />,
      label: new Date(machine.date).toLocaleDateString("en-US", {
        dateStyle: "full",
      }),
    },
  ];

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary">
      <Header />
      <div className="max-w-6xl space-y-10 mx-auto px-4 pt-14 pb-12">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              name: "Buntok",
              applicationCategory: "WebFramework",
              operatingSystem: "Cross-platform",
              offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
            }),
          }}
        />

        {/* ── Report Header ── */}
        <header className="border-b border-border-primary pb-8">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="text-xs font-semibold uppercase tracking-widest text-[#f97316]">
              Benchmark Report
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-[#27c93f]/40 bg-[#27c93f]/10 text-[11px] font-medium text-[#27c93f]">
              <CheckCircle className="w-3 h-3" /> spec verified pre-load
            </span>
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-medium ${
                totalErrors === 0
                  ? "border-[#27c93f]/40 bg-[#27c93f]/10 text-[#27c93f]"
                  : "border-red-500/40 bg-red-500/10 text-red-400"
              }`}
            >
              {fmtInt(totalErrors)} errors / {fmtInt(totalRequests)} requests
            </span>
            {methodology ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-border-primary bg-bg-tertiary text-[11px] font-medium text-text-secondary">
                {methodology.client} · best of {methodology.rounds} rounds
              </span>
            ) : null}
          </div>

          {/* <h1 className="text-3xl sm:text-5xl font-bold tracking-tight mb-3">
            Four routes. 500 connections.
            <br />
            <span className="text-text-secondary">
              Best of three rounds, no errors.
            </span>
          </h1> */}

          <p className="text-text-secondary text-sm max-w-3xl">
            Every server implements the exact same spec - <code>GET /</code>{" "}
            (Ping), <code>GET /id/1?name=bun</code> (Query),{" "}
            <code>POST /json</code> (Body), and <code>GET /video</code> (Video)
            - and is byte-checked against the expected responses before a single
            request is fired. Load is generated with{" "}
            <strong>bombardier --fasthttp</strong> against build artifacts, not
            dev servers.
          </p>

          <div className="flex flex-wrap gap-x-5 gap-y-2 mt-5 text-xs text-text-secondary">
            {machineChips.map((chip, i) => (
              <span key={i} className="inline-flex items-center gap-1.5">
                <span className="text-text-secondary">{chip.icon}</span>
                <span>{chip.label}</span>
              </span>
            ))}
          </div>
        </header>

        {!hasData ? (
          <section className="border border-border-primary rounded-2xl p-10 bg-bg-secondary text-center">
            <AlertTriangle className="w-6 h-6 text-yellow-500 mx-auto mb-3" />
            <h2 className="font-semibold mb-1">No benchmark data yet</h2>
            <p className="text-sm text-text-secondary">
              Run <code>bun run bench:all</code> to generate{" "}
              <code>dashboard-data.json</code>.
            </p>
          </section>
        ) : (
          <>
            {/* ── Verdict ── */}
            <section
              aria-label="Verdict"
              className="grid grid-cols-2 lg:grid-cols-4 gap-3"
            >
              <div className="bg-bg-secondary border border-[#f97316]/40 rounded-2xl p-5">
                <p className="text-xs text-text-secondary mb-2">
                  Mean score · {star?.name}
                </p>
                <p className="text-3xl font-bold text-[#f97316] leading-none mb-2">
                  {fmtScore(star?.avgRps)}
                  <span className="text-sm font-normal text-text-secondary ml-1">
                    req/s
                  </span>
                </p>
                <p className="text-xs text-text-secondary">
                  #{rank} of {overallData.length}
                  {fastest?.name === star?.name && second
                    ? ` · +${leadPct.toFixed(1)}% vs ${second.name}`
                    : ` · leader: ${fastest?.name}`}
                </p>
              </div>

              <div className="bg-bg-secondary border border-border-primary rounded-2xl p-5">
                <p className="text-xs text-text-secondary mb-2">Correctness</p>
                <p
                  className={`text-3xl font-bold leading-none mb-2 ${
                    totalErrors === 0 ? "text-[#27c93f]" : "text-red-400"
                  }`}
                >
                  {fmtInt(totalErrors)}
                  <span className="text-sm font-normal text-text-secondary ml-1">
                    errors
                  </span>
                </p>
                <p className="text-xs text-text-secondary">
                  {fmtInt(totalRequests)} requests across {overallData.length}{" "}
                  frameworks × {routes.length} routes
                </p>
              </div>

              <div className="bg-bg-secondary border border-border-primary rounded-2xl p-5">
                <p className="text-xs text-text-secondary mb-2">
                  Cold start · {star?.name}
                </p>
                <p className="text-3xl font-bold text-text-primary leading-none mb-2">
                  {fmtInt(star?.startupTimeMs)}
                  <span className="text-sm font-normal text-text-secondary ml-1">
                    ms
                  </span>
                </p>
                <p className="text-xs text-text-secondary">
                  rank{" "}
                  {[...overallData]
                    .sort((a, b) => a.startupTimeMs - b.startupTimeMs)
                    .findIndex((f) => f.name === star?.name) + 1}
                  /{overallData.length} · fastest: {fastestStartup?.name}{" "}
                  {fastestStartup?.startupTimeMs} ms
                </p>
              </div>

              <div className="bg-bg-secondary border border-border-primary rounded-2xl p-5">
                <p className="text-xs text-text-secondary mb-2">
                  RSS growth · {star?.name}
                </p>
                <p className="text-3xl font-bold text-text-primary leading-none mb-2">
                  +
                  {star?.memoryGrowth !== undefined
                    ? Math.round(star.memoryGrowth / (1024 * 1024))
                    : "-"}
                  <span className="text-sm font-normal text-text-secondary ml-1">
                    MB
                  </span>
                </p>
                <p className="text-xs text-text-secondary">
                  {formatMB(star?.memoryBefore)} → {formatMB(star?.memoryAfter)}{" "}
                  under sustained load
                </p>
              </div>
            </section>

            {/* ── 01 · Scoreboard ── */}
            <section aria-label="Final scoreboard">
              <SectionHeading
                index="01"
                title="Final Scoreboard"
                hint="score = mean of per-route req/s · green = best in column · lower is better for everything except score"
                icon={<Trophy className="w-4 h-4" />}
              />
              <div className="border border-border-primary rounded-xl bg-bg-secondary overflow-x-auto">
                <table className="w-full text-sm min-w-[820px]">
                  <thead>
                    <tr className="border-b border-border-primary text-xs uppercase tracking-wider text-text-secondary">
                      <th className="text-left px-4 py-3 font-medium">#</th>
                      <th className="text-left px-2 py-3 font-medium">
                        Framework
                      </th>
                      <th className="text-left px-2 py-3 font-medium">
                        Runtime
                      </th>
                      <th className="text-left px-2 py-3 font-medium">
                        Score (req/s)
                      </th>
                      <th className="text-right px-2 py-3 font-medium">
                        P50 ms
                      </th>
                      <th className="text-right px-2 py-3 font-medium">
                        P99 ms
                      </th>
                      <th className="text-right px-2 py-3 font-medium">
                        Cold start
                      </th>
                      <th className="text-right px-2 py-3 font-medium">
                        Bundle
                      </th>
                      <th className="text-right px-4 py-3 font-medium">
                        RSS Δ
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {overallData.map((fw, idx) => {
                      const isStar = fw.name === star?.name;
                      return (
                        <tr
                          key={fw.name}
                          className={`border-b border-border-primary/50 last:border-0 transition-colors ${
                            isStar
                              ? "bg-[#f97316]/5"
                              : "hover:bg-bg-tertiary/60"
                          }`}
                        >
                          <td className="px-4 py-3">
                            <span
                              className="inline-flex w-6 h-6 rounded-md items-center justify-center text-xs font-bold"
                              style={{
                                background: `${MEDALS[idx] || "#3f3f46"}33`,
                                color: MEDALS[idx] || "#a1a1aa",
                              }}
                            >
                              {idx + 1}
                            </span>
                          </td>
                          <td className="px-2 py-3">
                            <span className="flex items-center gap-2">
                              <span
                                className="w-2 h-2 rounded-full shrink-0"
                                style={{ background: fw.color }}
                              />
                              <span
                                className={`font-semibold capitalize ${
                                  isStar ? "text-[#f97316]" : ""
                                }`}
                              >
                                {fw.name}
                              </span>
                            </span>
                          </td>
                          <td className="px-2 py-3">
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium uppercase bg-bg-tertiary border border-border-primary text-text-secondary">
                              {fw.runtime || "-"}
                            </span>
                          </td>
                          <td className="px-2 py-3">
                            <span className="flex items-center gap-3">
                              <span className="flex-1 min-w-24 h-2 rounded-full bg-bg-tertiary overflow-hidden">
                                <span
                                  className="block h-full rounded-full"
                                  style={{
                                    width: `${barPct(fw.score, fastest?.score || 0)}%`,
                                    background: fw.color,
                                  }}
                                />
                              </span>
                              <span className="font-semibold w-16 text-right">
                                {fmtScore(fw.avgRps)}
                              </span>
                            </span>
                          </td>
                          <td
                            className={`px-2 py-3 text-right ${
                              fw.p50Ms === bestP50
                                ? "text-[#27c93f] font-semibold"
                                : ""
                            }`}
                          >
                            {fw.p50Ms.toFixed(1)}
                          </td>
                          <td
                            className={`px-2 py-3 text-right ${
                              fw.p99Ms === bestP99
                                ? "text-[#27c93f] font-semibold"
                                : ""
                            }`}
                          >
                            {fw.p99Ms.toFixed(1)}
                          </td>
                          <td
                            className={`px-2 py-3 text-right ${
                              fw.startupTimeMs === bestStartup
                                ? "text-[#27c93f] font-semibold"
                                : ""
                            }`}
                          >
                            {fw.startupTimeMs} ms
                          </td>
                          <td
                            className={`px-2 py-3 text-right ${
                              (fw.bundleSize ?? Infinity) === bestBundle
                                ? "text-[#27c93f] font-semibold"
                                : ""
                            }`}
                          >
                            {formatKB(fw.bundleSize)}
                          </td>
                          <td
                            className={`px-4 py-3 text-right ${
                              (fw.memoryGrowth ?? Infinity) === bestGrowth
                                ? "text-[#27c93f] font-semibold"
                                : ""
                            }`}
                          >
                            {fw.memoryGrowth !== undefined
                              ? `+${Math.round(fw.memoryGrowth / (1024 * 1024))} MB`
                              : "-"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-text-secondary mt-2">
                P50 = median across routes · P99 = worst route · cold start =
                spawn → first successful <code>GET /</code> · RSS Δ measured
                after 2 × 10 s of load · bundle = minified{" "}
                <code>Bun.build</code> artifact.
              </p>
            </section>

            {/* ── 02 · Head-to-Head ── */}
            <section aria-label="Head to head by route">
              <SectionHeading
                index="02"
                title="Head-to-Head by Route"
                hint="bars scaled to the route winner · W = warmup round (discarded) · P50/P99 in ms"
                icon={<TrendingUp className="w-4 h-4" />}
              />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {perRoute.map(({ route, meta, rows }) => {
                  const routeBest = rows[0];
                  const routeMax = routeBest?.rps || 0;
                  const routeRequests = rows.reduce(
                    (acc, r) => acc + r.routeRequests,
                    0,
                  );
                  const routeErrors = rows.reduce(
                    (acc, r) => acc + r.routeErrors,
                    0,
                  );
                  return (
                    <article
                      key={route}
                      className="border border-border-primary rounded-xl bg-bg-secondary p-5"
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2 min-w-0">
                          <code className="truncate">{route}</code>
                          <span className="text-sm font-semibold shrink-0">
                            {meta?.name || route}
                          </span>
                        </div>
                        {routeBest ? (
                          <span
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold shrink-0"
                            style={{
                              color: routeBest.color,
                              border: `1px solid ${routeBest.color}66`,
                              background: `${routeBest.color}14`,
                            }}
                          >
                            <Trophy className="w-3 h-3" /> {routeBest.name}
                          </span>
                        ) : null}
                      </div>
                      <p className="text-xs text-text-secondary mb-3">
                        {meta?.desc}
                      </p>

                      <div className="space-y-3">
                        {rows.map((fw, idx) => {
                          const measured = fw.rounds?.slice(warmupCount) || [];
                          const bestRound = Math.max(
                            0,
                            ...measured.map((v) => v || 0),
                          );
                          return (
                            <div key={fw.name}>
                              <div className="flex items-center gap-2.5">
                                <span
                                  className="w-4 text-[10px] font-bold text-text-secondary text-right shrink-0"
                                  aria-hidden="true"
                                >
                                  {idx + 1}
                                </span>
                                <span
                                  className={`w-16 text-xs font-medium capitalize shrink-0 ${
                                    fw.name === "buntok"
                                      ? "text-[#f97316] font-semibold"
                                      : "text-text-primary"
                                  }`}
                                >
                                  {fw.name}
                                </span>
                                <span className="flex-1 h-2.5 rounded-full bg-bg-tertiary overflow-hidden">
                                  <span
                                    className="block h-full rounded-full"
                                    style={{
                                      width: `${barPct(fw.rps || 0, routeMax)}%`,
                                      background: fw.color,
                                    }}
                                  />
                                </span>
                                <span className="w-24 text-right text-xs font-semibold shrink-0">
                                  {fmtScore(fw.rps)}
                                  <span className="font-normal text-text-secondary ml-1">
                                    req/s
                                  </span>
                                </span>
                              </div>
                              <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 pl-[26px] mt-0.5 text-[11px] text-text-secondary">
                                {fw.rounds?.length ? (
                                  <span className="inline-flex items-center gap-1.5">
                                    {fw.rounds.map((v, i) => (
                                      <span
                                        key={i}
                                        className={
                                          i < warmupCount
                                            ? "opacity-50"
                                            : v === bestRound
                                              ? "text-text-primary font-semibold"
                                              : ""
                                        }
                                      >
                                        {i < warmupCount ? "W " : ""}
                                        {v >= 1000
                                          ? `${(v / 1000).toFixed(1)}k`
                                          : Math.round(v)}
                                      </span>
                                    ))}
                                  </span>
                                ) : null}
                                <span>
                                  P50 {fmtMs(fw.routeP50Us)} · P99{" "}
                                  {fmtMs(fw.routeP99Us)} ms
                                </span>
                                <span>{fmtInt(fw.routeRequests)} req</span>
                                <span
                                  className={
                                    fw.routeErrors === 0
                                      ? "text-[#27c93f]"
                                      : "text-red-400 font-semibold"
                                  }
                                >
                                  {fw.routeErrors} err
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="mt-4 pt-3 border-t border-border-primary/60 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-text-secondary">
                        <span>{fmtInt(routeRequests)} requests total</span>
                        <span
                          className={
                            routeErrors === 0
                              ? "text-[#27c93f]"
                              : "text-red-400 font-semibold"
                          }
                        >
                          {routeErrors} errors
                        </span>
                        <span>
                          {methodology
                            ? `${methodology.duration} × ${methodology.measuredRounds} rounds @ ${methodology.connections} conns`
                            : "10s × 2 rounds @ 500 conns"}
                        </span>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>

            {/* ── 03 · Latency Distribution ── */}
            <section aria-label="Latency distribution">
              <SectionHeading
                index="03"
                title="Latency Distribution"
                hint="milliseconds · lower is better · grouped by route"
                icon={<Clock className="w-4 h-4" />}
              />
              <div className="border border-border-primary rounded-xl bg-bg-secondary overflow-x-auto">
                <table className="w-full text-sm min-w-[640px]">
                  <thead>
                    <tr className="border-b border-border-primary text-xs uppercase tracking-wider text-text-secondary">
                      <th className="text-left px-4 py-2.5 font-medium">
                        Framework
                      </th>
                      <th className="text-right px-3 py-2.5 font-medium">
                        P50
                      </th>
                      <th className="text-right px-3 py-2.5 font-medium">
                        P90
                      </th>
                      <th className="text-right px-3 py-2.5 font-medium">
                        P95
                      </th>
                      <th className="text-right px-3 py-2.5 font-medium">
                        P99
                      </th>
                      <th className="text-right px-4 py-2.5 font-medium">
                        Max
                      </th>
                    </tr>
                  </thead>
                  {routes.map((route) => (
                    <tbody key={route}>
                      <tr className="bg-bg-tertiary/60">
                        <td
                          colSpan={6}
                          className="px-4 py-1.5 text-[11px] font-semibold tracking-wider text-text-secondary"
                        >
                          <span className="font-mono">{route}</span> -{" "}
                          <span className="uppercase">
                            {ROUTE_META[route]?.name}
                          </span>
                        </td>
                      </tr>
                      {overallData.map((fw) => {
                        const rd = frameworks[fw.name]?.[route];
                        if (!rd) return null;
                        const isStar = fw.name === star?.name;
                        return (
                          <tr
                            key={fw.name}
                            className="border-b border-border-primary/40 hover:bg-bg-tertiary/50 transition-colors"
                          >
                            <td className="px-4 py-2">
                              <span className="flex items-center gap-2">
                                <span
                                  className="w-2 h-2 rounded-full"
                                  style={{ background: fw.color }}
                                />
                                <span
                                  className={`capitalize ${
                                    isStar
                                      ? "text-[#f97316] font-semibold"
                                      : "text-text-primary"
                                  }`}
                                >
                                  {fw.name}
                                </span>
                              </span>
                            </td>
                            <td className="px-3 py-2 text-right">
                              {fmtMs(rd.latencyP50)}
                            </td>
                            <td className="px-3 py-2 text-right">
                              {fmtMs(rd.latencyP90)}
                            </td>
                            <td className="px-3 py-2 text-right">
                              {fmtMs(rd.latencyP95)}
                            </td>
                            <td className="px-3 py-2 text-right">
                              {fmtMs(rd.latencyP99)}
                            </td>
                            <td className="px-4 py-2 text-right text-text-secondary">
                              {fmtMs(rd.latencyMax)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  ))}
                </table>
              </div>
            </section>

            {/* ── 04 · Footprint ── */}
            <section aria-label="Resource footprint">
              <SectionHeading
                index="04"
                title="Resource Footprint"
                hint="measured on the built artifact under the same load"
                icon={<Layers className="w-4 h-4" />}
              />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Cold start */}
                <div className="border border-border-primary rounded-xl bg-bg-secondary p-5">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-sm font-semibold">Cold Start</h3>
                    <span className="text-[10px] uppercase tracking-wider text-text-secondary">
                      lower = better
                    </span>
                  </div>
                  <p className="text-xs text-text-secondary mb-4">
                    spawn → first successful <code>GET /</code>
                  </p>
                  <div className="space-y-3">
                    {[...overallData]
                      .sort((a, b) => a.startupTimeMs - b.startupTimeMs)
                      .map((fw) => (
                        <div key={fw.name}>
                          <div className="flex justify-between text-xs mb-1">
                            <span
                              className={`font-medium capitalize ${
                                fw.name === "buntok"
                                  ? "text-[#f97316]"
                                  : "text-text-secondary"
                              }`}
                            >
                              {fw.name}
                            </span>
                            <span className="font-semibold">
                              {fw.startupTimeMs} ms
                            </span>
                          </div>
                          <div className="h-2 w-full bg-bg-tertiary rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${barPct(fw.startupTimeMs, maxStartup)}%`,
                                background: fw.color,
                              }}
                            />
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Bundle */}
                <div className="border border-border-primary rounded-xl bg-bg-secondary p-5">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-sm font-semibold">Bundle Size</h3>
                    <span className="text-[10px] uppercase tracking-wider text-text-secondary">
                      lower = better
                    </span>
                  </div>
                  <p className="text-xs text-text-secondary mb-4">
                    minified <code>Bun.build</code> artifact on disk
                  </p>
                  <div className="space-y-3">
                    {[...overallData]
                      .sort((a, b) => (a.bundleSize || 0) - (b.bundleSize || 0))
                      .map((fw) => {
                        const maxBundle = Math.max(
                          ...overallData.map((f) => f.bundleSize || 0),
                        );
                        return (
                          <div key={fw.name}>
                            <div className="flex justify-between text-xs mb-1">
                              <span
                                className={`font-medium capitalize ${
                                  fw.name === "buntok"
                                    ? "text-[#f97316]"
                                    : "text-text-secondary"
                                }`}
                              >
                                {fw.name}
                              </span>
                              <span className="font-semibold">
                                {formatKB(fw.bundleSize)}
                              </span>
                            </div>
                            <div className="h-2 w-full bg-bg-tertiary rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full"
                                style={{
                                  width: `${barPct(fw.bundleSize || 0, maxBundle)}%`,
                                  background: fw.color,
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>

                {/* Memory */}
                <div className="border border-border-primary rounded-xl bg-bg-secondary p-5">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-sm font-semibold">Memory (RSS)</h3>
                    <span className="text-[10px] uppercase tracking-wider text-text-secondary">
                      lower growth = better
                    </span>
                  </div>
                  <p className="text-xs text-text-secondary mb-4">
                    idle → after 2 × 10 s of sustained load
                  </p>
                  <div className="space-y-3">
                    {[...overallData]
                      .sort(
                        (a, b) =>
                          (a.memoryGrowth ?? Infinity) -
                          (b.memoryGrowth ?? Infinity),
                      )
                      .map((fw) => {
                        const maxGrowth = Math.max(
                          1,
                          ...overallData.map((f) => f.memoryGrowth || 0),
                        );
                        return (
                          <div key={fw.name}>
                            <div className="flex justify-between text-xs mb-1">
                              <span
                                className={`font-medium capitalize ${
                                  fw.name === "buntok"
                                    ? "text-[#f97316]"
                                    : "text-text-secondary"
                                }`}
                              >
                                {fw.name}
                              </span>
                              <span className="font-semibold">
                                {formatMB(fw.memoryBefore)} →{" "}
                                {formatMB(fw.memoryAfter)}
                                <span className="text-text-secondary font-normal">
                                  {" "}
                                  (+
                                  {fw.memoryGrowth !== undefined
                                    ? Math.round(
                                        fw.memoryGrowth / (1024 * 1024),
                                      )
                                    : "-"}
                                  MB)
                                </span>
                              </span>
                            </div>
                            <div className="h-2 w-full bg-bg-tertiary rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full"
                                style={{
                                  width: `${barPct(fw.memoryGrowth || 0, maxGrowth)}%`,
                                  background: fw.color,
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>
            </section>

            {/* ── 05 · Trends ── */}
            <section aria-label="Interactive charts">
              <SectionHeading
                index="05"
                title="Trends & Comparisons"
                hint="interactive charts - hover for exact values"
                icon={<Activity className="w-4 h-4" />}
              />
              <BenchmarkChartsLoader
                frameworks={frameworks}
                timeSeries={timeSeries}
              />
            </section>

            {/* ── 06 · Methodology ── */}
            {methodology && (
              <section aria-label="Benchmark methodology">
                <SectionHeading
                  index="06"
                  title="Methodology"
                  hint="everything a skeptical reader needs to reproduce this"
                  icon={<CheckCircle className="w-4 h-4" />}
                />
                <div className="border border-border-primary rounded-xl p-5 bg-bg-secondary">
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 text-sm">
                    {[
                      {
                        label: "Routes",
                        value:
                          "Ping (GET /), Query (GET /id/1?name=bun), Body (POST /json mirror), Video (GET /video, 14.1 MB mp4 stream)",
                      },
                      {
                        label: "Client",
                        value: `${methodology.client}, ${methodology.duration} per route, ${methodology.connections} connections (Video: ${methodology.videoConnections})`,
                      },
                      {
                        label: "Rounds",
                        value: `${methodology.rounds} total - ${methodology.warmupRounds} warmup (discarded) + ${methodology.measuredRounds} measured; ${methodology.aggregation}`,
                      },
                      {
                        label: "Framework order",
                        value: "rotated every round (alternating fairness)",
                      },
                      { label: "Scoring", value: methodology.scoring },
                      {
                        label: "Latency",
                        value: `P50 = ${methodology.p50}, P99 = ${methodology.p99}`,
                      },
                      {
                        label: "Runtimes",
                        value: Object.entries(methodology.runtimes)
                          .map(([fw, rt]) => `${fw}: ${rt}`)
                          .join(", "),
                      },
                      { label: "Build", value: methodology.build },
                      { label: "Core pinning", value: methodology.corePinning },
                      {
                        label: "Route table",
                        value: `${methodology.backgroundRoutes} ${methodology.backgroundNote}`,
                      },
                      {
                        label: "Verification",
                        value: methodology.verification,
                      },
                      { label: "Environment", value: machine.runtime },
                    ].map((row) => (
                      <div
                        key={row.label}
                        className="flex gap-3 border-b border-border-primary/50 py-1.5"
                      >
                        <dt className="w-32 shrink-0 text-text-secondary">
                          {row.label}
                        </dt>
                        <dd className="text-text-primary">{row.value}</dd>
                      </div>
                    ))}
                  </dl>
                  <p className="text-xs text-text-secondary mt-4">
                    The four-route spec matches{" "}
                    <a
                      href="https://github.com/SaltyAom/bun-http-framework-benchmark"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#f97316] hover:underline"
                    >
                      bun-http-framework-benchmark
                    </a>{" "}
                    so results are directly comparable there; the alternating
                    rounds + best-of protocol comes from this project&apos;s A/B
                    methodology for lower run-to-run noise.
                  </p>
                </div>
              </section>
            )}

            {/* ── About ── */}
            <section
              aria-label="About Buntok"
              className="grid lg:grid-cols-2 gap-4"
            >
              <article className="border border-border-primary rounded-xl p-5 bg-bg-secondary">
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-2 py-0.5 rounded text-xs font-mono font-semibold bg-bg-tertiary text-[#f97316] border border-border-primary">
                    Philosophy
                  </span>
                  <h2 className="font-semibold text-text-primary">
                    What is Buntok?
                  </h2>
                </div>
                <p className="text-sm text-text-secondary leading-relaxed">
                  Buntok is a decorator-first, zero-config API framework for
                  Bun. Applications are built as class-based controllers whose
                  routes and middleware are declared with Stage 3 decorators -{" "}
                  <code>@Controller</code>, <code>@Get</code>,{" "}
                  <code>@Post</code>, <code>@Use</code> - that run without the{" "}
                  <code>experimentalDecorators</code> flag. Constructor
                  dependencies are resolved by an IoC container with circular
                  dependency detection, so services are assembled once at boot
                  and injected where they are used.
                </p>
                <p className="text-sm text-text-secondary leading-relaxed mt-3">
                  Performance is a build-time concern rather than a tuning one:
                  the middleware pipeline is compiled once at boot (AOT), static
                  routes resolve in constant time, and dynamic segments match
                  through a trie with an optional native Zig resolver over FFI.
                  TypeScript support runs from route handler to validator - Zod
                  validators via <code>zValidator</code> cover body, query, and
                  params - and middleware such as CORS, compression, rate
                  limiting, and request IDs ships in the core package rather
                  than as a plugin ecosystem.
                </p>
              </article>
              <article className="border border-border-primary rounded-xl p-5 bg-bg-secondary">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-4 h-4 text-yellow-500" />
                  <h2 className="font-semibold text-text-primary">
                    About These Results
                  </h2>
                </div>
                <p className="text-sm text-text-secondary leading-relaxed">
                  These benchmarks were run on a{" "}
                  <strong className="text-text-primary">{machine.cpu}</strong>{" "}
                  with{" "}
                  <strong className="text-text-primary">
                    {machine.memory}
                  </strong>{" "}
                  RAM - a modest 4-core laptop, not a beefy CI runner, so the
                  numbers are reproducible on real developer hardware. Every
                  framework implements the same four spec routes and is verified
                  against the expected responses before any load is applied.
                  Load is generated with{" "}
                  <a
                    href="https://github.com/codesenberg/bombardier"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#f97316] hover:underline"
                  >
                    bombardier
                  </a>{" "}
                  in fasthttp mode (500 connections, 10 s per route; Video uses
                  10). Frameworks run in alternating rounds - one warmup pass is
                  discarded and the best of the measured rounds wins per route.
                  Scores shown are exact means of the four route results, and
                  the raw per-round numbers are printed for every route so
                  outliers are visible, not hidden. Buntok is still in active
                  development - the AOT router and middleware pipeline are being
                  optimized. Results may vary across different hardware and
                  configurations.
                </p>
                <p className="text-xs text-text-secondary mt-3">
                  Source code:{" "}
                  <a
                    href="https://github.com/PitokDf/buntok/blob/master/benchmarks/runner.ts"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#f97316] hover:underline font-mono"
                  >
                    benchmarks/runner.ts
                  </a>
                </p>
              </article>
            </section>

            {/* ── CTA ── */}
            <div className="mt-4 text-center">
              <a
                href="/docs/routing"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#f97316] text-white font-semibold hover:bg-[#ea580c] transition-colors"
              >
                Start using Buntok now <Zap className="w-4 h-4" />
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default async function BenchmarksPage() {
  const data = await getBenchmarkData();
  return <BenchmarkPage data={data} />;
}
