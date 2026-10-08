"use client";

import dynamic from "next/dynamic";
import type { BenchFrameworks, BenchTimeSeries } from "./BenchmarkCharts";

const BenchmarkCharts = dynamic(
  () => import("@/components/landing/BenchmarkCharts").then((m) => m.BenchmarkCharts),
  {
    ssr: false,
    loading: () => (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2 border border-border-primary rounded-xl p-5 bg-bg-secondary">
          <div className="h-6 w-64 bg-bg-tertiary rounded animate-pulse mb-4" />
          <div className="h-80 bg-bg-tertiary/50 rounded-lg animate-pulse" />
        </div>
        {[1, 2].map((i) => (
          <div
            key={i}
            className="border border-border-primary rounded-xl p-5 bg-bg-secondary"
          >
            <div className="h-6 w-48 bg-bg-tertiary rounded animate-pulse mb-4" />
            <div className="h-72 bg-bg-tertiary/50 rounded-lg animate-pulse" />
          </div>
        ))}
      </div>
    ),
  }
);

export function BenchmarkChartsLoader({
  frameworks,
  timeSeries,
}: {
  frameworks: BenchFrameworks;
  timeSeries?: BenchTimeSeries;
}) {
  return <BenchmarkCharts frameworks={frameworks} timeSeries={timeSeries} />;
}
