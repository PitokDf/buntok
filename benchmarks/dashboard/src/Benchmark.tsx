import {
  Activity, Cpu, Server, Zap, Clock, CheckCircle, Database, TrendingUp
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip,
  ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar,
  Legend, CartesianGrid, LineChart, Line
} from 'recharts';

const ACCENT = '#f97316';
const COLORS = ['#f97316', '#3b82f6', '#8b5cf6', '#10b981', '#f59e0b'];
const FW_COLOR = (fw: string, idx: number) => fw === 'buntok' ? ACCENT : COLORS[idx % COLORS.length];

export function BenchmarkSection({ data, isDark }: { data: any; isDark: boolean }) {
  if (!data) return (
    <div className="pt-16 flex flex-col items-center justify-center gap-4 text-text-secondary">
      <Zap className="w-8 h-8 animate-pulse text-[#f97316]" />
      <span className="text-sm">Loading benchmark data…</span>
    </div>
  );

  const { machine, frameworks } = data;
  const fwNames = Object.keys(frameworks);

  const overallData = fwNames.map((fw, i) => {
    const routes = Object.keys(frameworks[fw]).filter(k => k !== 'startupTime');
    const totalRps = routes.reduce((acc, r) => acc + (frameworks[fw][r]?.reqPerSec || 0), 0);
    const avgLatency = routes.reduce((acc, r) => acc + (frameworks[fw][r]?.latencyAvg || 0), 0) / routes.length;
    
    const p50Latency = routes.reduce((acc, r) => acc + (frameworks[fw][r]?.latencyP50 || frameworks[fw][r]?.latencyAvg || 0), 0) / routes.length;
    const p90Latency = routes.reduce((acc, r) => acc + (frameworks[fw][r]?.latencyP90 || frameworks[fw][r]?.latencyAvg || 0), 0) / routes.length;
    const p95Latency = routes.reduce((acc, r) => acc + (frameworks[fw][r]?.latencyP95 || frameworks[fw][r]?.latencyAvg || 0), 0) / routes.length;
    const p99Latency = routes.reduce((acc, r) => acc + (frameworks[fw][r]?.latencyP99 || frameworks[fw][r]?.latencyAvg || 0), 0) / routes.length;

    return {
      name: fw,
      score: totalRps,
      avgRps: Math.round(totalRps / routes.length),
      avgLatency: avgLatency / 1000,
      p50Latency: p50Latency / 1000,
      p90Latency: p90Latency / 1000,
      p95Latency: p95Latency / 1000,
      p99Latency: p99Latency / 1000,
      startupTime: Math.round(frameworks[fw].startupTime),
      color: FW_COLOR(fw, i),
    };
  }).sort((a, b) => b.score - a.score);

  const buntok = overallData.find(f => f.name === 'buntok')!;
  

  const gridColor  = isDark ? '#1f1f1f' : '#e4e4e7';
  const tickColor  = isDark ? '#52525b' : '#a1a1aa';

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-bg-secondary border border-border-primary rounded-lg p-3 text-xs shadow-lg">
        <p className="font-semibold text-text-primary mb-2">{label}</p>
        {payload.map((e: any, i: number) => (
          <div key={i} className="flex items-center gap-2 text-text-secondary">
            <span className="w-2 h-2 rounded-full" style={{ background: e.color }} />
            <span className="capitalize">{e.name}:</span>
            <span className="font-mono text-text-primary">
              {e.value.toLocaleString()} {e.dataKey?.includes?.('latency') ? 'ms' : 'req/s'}
            </span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="border-b border-border-primary pb-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#f97316] mb-2">Benchmarks</p>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Performance Report</h1>
        <p className="text-text-secondary text-sm">Real-world load testing on <code>/plaintext</code>, <code>/json</code>, and <code>/id/:id</code> endpoints.</p>
      </div>

      {/* ── Machine info ── */}
      <div className="flex flex-wrap gap-6 p-4 rounded-lg bg-bg-secondary border border-border-primary text-sm">
        {[
          { icon: <Cpu className="w-4 h-4" />, label: 'CPU', val: machine.cpu },
          { icon: <Database className="w-4 h-4" />, label: 'Memory', val: machine.memory },
          { icon: <Server className="w-4 h-4" />, label: 'Runtime', val: machine.runtime },
        ].map(s => (
          <div key={s.label} className="flex items-center gap-2 text-text-secondary">
            <span className="text-text-secondary">{s.icon}</span>
            <span className="text-text-secondary">{s.label}:</span>
            <span className="font-medium text-text-primary">{s.val}</span>
          </div>
        ))}
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {/* RPS Card */}
        <div className="bg-bg-secondary border border-border-primary rounded-2xl p-6 hover:border-[#f97316]/30 hover:bg-bg-tertiary transition-all duration-300 group">
          <h3 className="text-sm text-text-secondary font-medium mb-1 group-hover:text-text-primary transition-colors flex items-center justify-between">
            Requests Per Sec (Avg) <Zap className="w-4 h-4 text-[#f97316]" />
          </h3>
          <div className="text-3xl font-bold text-text-primary mb-6">{buntok?.avgRps.toLocaleString()} <span className="text-sm font-normal text-text-secondary">req/s</span></div>
          
          <div className="space-y-4">
            {overallData.slice(0, 3).map((fw) => (
              <div key={fw.name}>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className={`font-medium ${fw.name === 'buntok' ? 'text-[#f97316]' : 'text-text-secondary capitalize'}`}>{fw.name}</span>
                  <span className={fw.name === 'buntok' ? 'text-[#f97316] font-bold' : 'text-text-secondary'}>
                    {(fw.avgRps / 1000).toFixed(1)}k
                  </span>
                </div>
                <div className="h-2 w-full bg-border-primary rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${fw.name === 'buntok' ? 'bg-gradient-to-r from-[#f97316]/50 to-[#f97316]' : 'bg-text-secondary/50'}`} 
                    style={{ width: `${(fw.avgRps / overallData[0].avgRps) * 100}%` }} 
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Latency Table Card */}
        <div className="bg-bg-secondary border border-border-primary rounded-2xl p-6 hover:border-[#27c93f]/30 hover:bg-bg-tertiary transition-all duration-300 group">
          <h3 className="text-sm text-text-secondary font-medium mb-1 group-hover:text-text-primary transition-colors flex items-center justify-between">
            Tail Latency (p99) <Clock className="w-4 h-4 text-[#27c93f]" />
          </h3>
          <div className="text-3xl font-bold text-text-primary mb-4">{buntok?.p99Latency.toFixed(2)} <span className="text-sm font-normal text-text-secondary">ms</span></div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-text-secondary whitespace-nowrap">
              <thead>
                <tr className="border-b border-border-primary">
                  <th className="pb-1.5 font-medium text-text-primary">FW</th>
                  <th className="pb-1.5 font-medium text-right">p50</th>
                  <th className="pb-1.5 font-medium text-right">p90</th>
                  <th className="pb-1.5 font-medium text-right">p95</th>
                  <th className="pb-1.5 font-medium text-right text-[#27c93f]">p99</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-primary/50">
                {[...overallData].sort((a,b) => a.p99Latency - b.p99Latency).slice(0, 4).map((fw) => (
                  <tr key={fw.name} className="group/row hover:bg-bg-tertiary/50 transition-colors">
                    <td className={`py-2 font-medium capitalize ${fw.name === 'buntok' ? 'text-[#27c93f]' : 'text-text-primary'}`}>
                      {fw.name}
                    </td>
                    <td className={`py-2 text-right ${fw.name === 'buntok' ? 'text-text-primary font-medium' : ''}`}>
                      {fw.p50Latency.toFixed(1)}
                    </td>
                    <td className={`py-2 text-right ${fw.name === 'buntok' ? 'text-text-primary font-medium' : ''}`}>
                      {fw.p90Latency.toFixed(1)}
                    </td>
                    <td className={`py-2 text-right ${fw.name === 'buntok' ? 'text-text-primary font-medium' : ''}`}>
                      {fw.p95Latency.toFixed(1)}
                    </td>
                    <td className={`py-2 text-right ${fw.name === 'buntok' ? 'text-[#27c93f] font-bold' : 'font-medium text-text-primary'}`}>
                      {fw.p99Latency.toFixed(1)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Startup Time Card */}
        <div className="bg-bg-secondary border border-border-primary rounded-2xl p-6 hover:border-[#3b82f6]/30 hover:bg-bg-tertiary transition-all duration-300 group">
          <h3 className="text-sm text-text-secondary font-medium mb-1 group-hover:text-text-primary transition-colors flex items-center justify-between">
            Cold Startup Time <Activity className="w-4 h-4 text-[#3b82f6]" />
          </h3>
          <div className="text-3xl font-bold text-text-primary mb-6">{buntok?.startupTime} <span className="text-sm font-normal text-text-secondary">ms</span></div>
          
          <div className="space-y-4">
            {[...overallData].sort((a,b) => a.startupTime - b.startupTime).slice(0, 3).map((fw) => (
              <div key={fw.name}>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className={`font-medium ${fw.name === 'buntok' ? 'text-[#3b82f6]' : 'text-text-secondary capitalize'}`}>{fw.name}</span>
                  <span className={fw.name === 'buntok' ? 'text-[#3b82f6] font-bold' : 'text-text-secondary'}>
                    {fw.startupTime} ms
                  </span>
                </div>
                <div className="h-2 w-full bg-border-primary rounded-full overflow-hidden flex justify-start">
                  <div 
                    className={`h-full rounded-full ${fw.name === 'buntok' ? 'bg-gradient-to-r from-[#3b82f6]/50 to-[#3b82f6]' : 'bg-text-secondary/50'}`} 
                    style={{ width: `${(fw.startupTime / Math.max(...overallData.map(f => f.startupTime))) * 100}%` }} 
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── About Buntok ── */}
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="border border-border-primary rounded-lg p-5 bg-bg-secondary">
          <div className="flex items-center gap-2 mb-3">
            <span className="px-2 py-0.5 rounded text-xs font-mono font-semibold bg-bg-tertiary text-[#f97316] border border-border-primary">Philosophy</span>
            <h2 className="font-semibold text-text-primary">What is Buntok?</h2>
          </div>
          <p className="text-sm text-text-secondary leading-relaxed">
            Buntok is a decorator-first, high-performance web framework designed for Bun. It bridges elegant
            NestJS-like OOP developer experience with extreme raw throughput - no compromise.
          </p>
        </div>
        <div className="border border-border-primary rounded-lg p-5 bg-bg-secondary">
          <h2 className="font-semibold text-text-primary mb-3">Performance Context</h2>
          <p className="text-sm text-text-secondary leading-relaxed">
            Buntok uses an AOT-compiled switch-case router with static context allocation - the same
            approach as Elysia but wrapped in a clean class-based API.
            This places Buntok <strong className="text-text-primary">ahead of Hono and Fastify</strong> while remaining a formidable challenger to Elysia.
          </p>
        </div>
      </div>

      {/* ── Ranking + Radar ── */}
      <div className="grid lg:grid-cols-2 gap-4">

        {/* Ranking */}
        <div className="border border-border-primary rounded-lg p-5 bg-bg-secondary">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle className="w-4 h-4 text-[#f97316]" />
            <h2 className="font-semibold text-text-primary">Framework Ranking</h2>
          </div>
          <div className="space-y-2">
            {overallData.map((fw, idx) => {
              const pct = (fw.avgRps / overallData[0].avgRps) * 100;
              return (
                <div
                  key={fw.name}
                  className={`rounded-lg p-3 flex items-center gap-3 border transition-colors ${
                    fw.name === 'buntok'
                      ? 'border-[#f97316]/40 bg-[#f97316]/5'
                      : 'border-border-primary bg-bg-primary hover:border-border-hover'
                  }`}
                >
                  <span className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold shrink-0 ${
                    idx === 0 ? 'bg-yellow-500/20 text-yellow-500' :
                    idx === 1 ? 'bg-zinc-400/20 text-zinc-400' :
                    idx === 2 ? 'bg-orange-700/20 text-orange-600' :
                    'bg-bg-tertiary text-text-secondary'
                  }`}>
                    {idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-sm capitalize text-text-primary">{fw.name}</span>
                      <span className="text-xs font-mono text-text-secondary">{fw.avgRps.toLocaleString()} req/s</span>
                    </div>
                    <div className="h-1 rounded-full bg-bg-tertiary overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, background: fw.color }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Radar */}
        <div className="border border-border-primary rounded-lg p-5 bg-bg-secondary">
          <h2 className="font-semibold text-text-primary mb-4">Performance Radar</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="65%" data={overallData}>
                <PolarGrid stroke={gridColor} />
                <PolarAngleAxis dataKey="name" tick={{ fill: tickColor, fontSize: 11 }} />
                <Radar name="Avg req/s" dataKey="avgRps" stroke={ACCENT} fill={ACCENT} fillOpacity={0.2} strokeWidth={2} />
                <RechartsTooltip content={<CustomTooltip />} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── Bar chart ── */}
      <div className="border border-border-primary rounded-lg p-5 bg-bg-secondary">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-4 h-4 text-[#f97316]" />
          <h2 className="font-semibold text-text-primary">Route Performance Breakdown (req/s)</h2>
        </div>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={['/plaintext', '/json', '/id/123'].map(route => ({
                name: route,
                ...Object.fromEntries(fwNames.map(fw => [fw, frameworks[fw][route]?.reqPerSec || 0])),
              }))}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
              <XAxis dataKey="name" stroke={tickColor} tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
              <YAxis stroke={tickColor} tickLine={false} axisLine={false} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
              <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: isDark ? '#1f1f1f' : '#f4f4f5', opacity: 0.6 }} />
              <Legend wrapperStyle={{ paddingTop: 16, fontSize: 12 }} />
              {fwNames.map((fw, i) => (
                <Bar key={fw} dataKey={fw} fill={FW_COLOR(fw, i)} radius={[3, 3, 0, 0]} maxBarSize={32} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Line chart (time series) ── */}
      {data.timeSeries?.['buntok']?.length > 0 && (
        <div className="border border-border-primary rounded-lg p-5 bg-bg-secondary">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-4 h-4 text-[#f97316]" />
            <h2 className="font-semibold text-text-primary">Throughput Over Time - /plaintext</h2>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={data.timeSeries['buntok'].map((_: any, idx: number) => {
                  const row: any = { second: idx + 1 };
                  fwNames.forEach(fw => { row[fw] = data.timeSeries[fw]?.[idx]?.reqPerSec || 0; });
                  return row;
                })}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                <XAxis dataKey="second" stroke={tickColor} tickLine={false} axisLine={false} tickFormatter={v => `${v}s`} tick={{ fontSize: 11 }} />
                <YAxis stroke={tickColor} tickLine={false} axisLine={false} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                <RechartsTooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ paddingTop: 16, fontSize: 12 }} />
                {fwNames.map((fw, i) => (
                  <Line
                    key={fw} type="monotone" dataKey={fw}
                    stroke={FW_COLOR(fw, i)}
                    strokeWidth={fw === 'buntok' ? 2.5 : 1.5}
                    dot={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
