"use client";

import { Activity, Clock, TrendingUp } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
  CartesianGrid,
  LineChart,
  Line,
} from "recharts";
import { useTheme } from "next-themes";

export type RouteStats = {
  reqPerSec?: number;
  latencyAvg?: number;
  latencyP50?: number;
  latencyP90?: number;
  latencyP95?: number;
  latencyP99?: number;
  latencyMax?: number;
  requests?: number;
  errors?: number;
  rounds?: number[];
};

export type FrameworkEntry = {
  startupTime?: number;
  runtime?: string;
  bundleSize?: number;
  memoryBefore?: number;
  memoryAfter?: number;
  [key: string]: RouteStats | number | string | undefined;
};

export type BenchFrameworks = Record<string, FrameworkEntry>;

export type BenchTimeSeries = Record<
  string,
  { reqPerSec?: number }[] | undefined
>;

const ACCENT = "#f97316";
const COLORS = ["#64748b", "#3b82f6", "#8b5cf6", "#10b981", "#f59e0b"];
const FW_COLOR = (fw: string, idx: number) =>
  fw === "buntok" ? ACCENT : COLORS[idx % COLORS.length];

const ROUTE_KEYS = ["/", "/id/1?name=bun", "POST /json", "/video"];

const isRouteStats = (v: RouteStats | number | string | undefined): v is RouteStats =>
  typeof v === "object" && v !== null && "reqPerSec" in v;

const asStats = (
  v: RouteStats | number | string | undefined,
): RouteStats | undefined => (isRouteStats(v) ? v : undefined);

const median = (values: number[]) => {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
};

type TooltipPayloadItem = {
  color?: string;
  name?: unknown;
  value?: unknown;
  dataKey?: unknown;
};

function CustomTooltip({
  active,
  payload,
  label,
  unit = "req/s",
}: {
  active?: boolean;
  payload?: ReadonlyArray<TooltipPayloadItem>;
  label?: unknown;
  unit?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-bg-secondary border border-border-primary rounded-lg p-3 text-xs shadow-lg">
      <p className="font-semibold text-text-primary mb-2">{String(label ?? "")}</p>
      {payload.map((e, i) => (
        <div key={i} className="flex items-center gap-2 text-text-secondary">
          <span
            className="w-2 h-2 rounded-full"
            style={{ background: e.color }}
          />
          <span className="capitalize">{String(e.name ?? "")}:</span>
          <span className="font-mono text-text-primary">
            {typeof e.value === "number" ? e.value.toLocaleString() : String(e.value ?? "")}{" "}
            {unit}
          </span>
        </div>
      ))}
    </div>
  );
}

export function BenchmarkCharts({
  frameworks,
  timeSeries,
}: {
  frameworks: BenchFrameworks;
  timeSeries?: BenchTimeSeries;
}) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const fwNames = Object.keys(frameworks);

  const overallData = fwNames
    .map((fw, i) => {
      const entry = frameworks[fw];
      const routes = Object.keys(entry).filter((k) => isRouteStats(entry[k]));
      const rpsValues = routes.map((r) => asStats(entry[r])?.reqPerSec || 0);
      const avgRps =
        rpsValues.reduce((acc, r) => acc + r, 0) / (routes.length || 1);
      const p50Us = median(
        routes.map((r) => asStats(entry[r])?.latencyP50 || 0),
      );
      const p99Us = Math.max(
        0,
        ...routes.map((r) => asStats(entry[r])?.latencyP99 || 0),
      );
      const startup = entry.startupTime;

      return {
        name: fw,
        avgRps: Math.round(avgRps),
        p50Ms: p50Us / 1000,
        p99Ms: p99Us / 1000,
        startupTime: typeof startup === "number" ? Math.round(startup) : 0,
        color: FW_COLOR(fw, i),
      };
    })
    .sort((a, b) => b.avgRps - a.avgRps);

  const gridColor = isDark ? "#1f1f1f" : "#e4e4e7";
  const tickColor = isDark ? "#52525b" : "#a1a1aa";

  const primarySeries = timeSeries?.[fwNames[0]];
  const hasSeries =
    primarySeries !== undefined &&
    primarySeries.some((t) => (t.reqPerSec || 0) > 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* ── Route Breakdown (full width) ── */}
      <div className="md:col-span-2 border border-border-primary rounded-xl p-5 bg-bg-secondary">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-4 h-4 text-[#f97316]" />
          <h2 className="font-semibold text-text-primary">
            Requests/sec by Route
          </h2>
          <span className="text-xs text-text-secondary">
            best of measured rounds per framework
          </span>
        </div>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={ROUTE_KEYS.map((route) => ({
                name: route,
                ...Object.fromEntries(
                  fwNames.map((fw) => [
                    fw,
                    asStats(frameworks[fw][route])?.reqPerSec || 0,
                  ]),
                ),
              }))}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={gridColor}
                vertical={false}
              />
              <XAxis
                dataKey="name"
                stroke={tickColor}
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 12 }}
              />
              <YAxis
                stroke={tickColor}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                tick={{ fontSize: 11 }}
              />
              <RechartsTooltip
                content={<CustomTooltip />}
                cursor={{
                  fill: isDark ? "#1f1f1f" : "#f4f4f5",
                  opacity: 0.6,
                }}
              />
              <Legend wrapperStyle={{ paddingTop: 16, fontSize: 12 }} />
              {fwNames.map((fw, i) => (
                <Bar
                  key={fw}
                  dataKey={fw}
                  fill={FW_COLOR(fw, i)}
                  radius={[3, 3, 0, 0]}
                  maxBarSize={32}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Latency Comparison (Bar) ── */}
      <div className="border border-border-primary rounded-xl p-5 bg-bg-secondary">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-4 h-4 text-[#27c93f]" />
          <h2 className="font-semibold text-text-primary">
            Latency Comparison (ms)
          </h2>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={overallData.map((fw) => ({
                name: fw.name,
                P50: Number(fw.p50Ms.toFixed(1)),
                P99: Number(fw.p99Ms.toFixed(0)),
              }))}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={gridColor}
                vertical={false}
              />
              <XAxis
                dataKey="name"
                stroke={tickColor}
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11 }}
              />
              <YAxis
                stroke={tickColor}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `${v}ms`}
                tick={{ fontSize: 11 }}
              />
              <RechartsTooltip content={<CustomTooltip unit="ms" />} />
              <Legend wrapperStyle={{ paddingTop: 16, fontSize: 12 }} />
              <Bar
                dataKey="P50"
                fill="#10b981"
                radius={[2, 2, 0, 0]}
                maxBarSize={28}
              />
              <Bar
                dataKey="P99"
                fill="#ef4444"
                radius={[2, 2, 0, 0]}
                maxBarSize={28}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Line Chart (time series) ── */}
      {hasSeries && primarySeries ? (
        <div className="border border-border-primary rounded-xl p-5 bg-bg-secondary">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-4 h-4 text-[#f97316]" />
            <h2 className="font-semibold text-text-primary">
              Throughput Over Time - GET / (Ping)
            </h2>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={primarySeries.map((_, idx) => {
                  const row: Record<string, number> = { second: idx + 1 };
                  fwNames.forEach((fw) => {
                    row[fw] = timeSeries?.[fw]?.[idx]?.reqPerSec || 0;
                  });
                  return row;
                })}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={gridColor}
                  vertical={false}
                />
                <XAxis
                  dataKey="second"
                  stroke={tickColor}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `${v}s`}
                  tick={{ fontSize: 11 }}
                />
                <YAxis
                  stroke={tickColor}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                  tick={{ fontSize: 11 }}
                />
                <RechartsTooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ paddingTop: 16, fontSize: 12 }} />
                {fwNames.map((fw, i) => (
                  <Line
                    key={fw}
                    type="monotone"
                    dataKey={fw}
                    stroke={FW_COLOR(fw, i)}
                    strokeWidth={fw === "buntok" ? 2.5 : 1.5}
                    dot={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : null}
    </div>
  );
}
