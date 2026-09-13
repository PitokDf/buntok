"use client";

import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import {
  vscDarkPlus,
  vs,
} from "react-syntax-highlighter/dist/esm/styles/prism";
import {
  ArrowRight,
  Terminal,
  Zap,
  Clock,
  Code2,
  CheckCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import Link from "next/link";

const EMPTY_DATA = {
  frameworks: {
    buntok: {
      "/plaintext": { reqPerSec: 0, latencyP50: 0 },
    },
  },
};

export function HomeSection() {
  const [data, setData] = useState(EMPTY_DATA);
  const [npmVersion, setNpmVersion] = useState<string | null>(null);

  useEffect(() => {
    const base = process.env.NEXT_PUBLIC_BASE_URL || "";
    fetch(`${base}/dashboard-data.json`)
      .then((res) => (res.ok ? res.json() : null))
      .then((d) => {
        if (d?.frameworks?.buntok) setData(d);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch("https://registry.npmjs.org/@buntok%2Fcore/latest", {
      cache: "no-store",
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((d) => {
        if (d?.version) setNpmVersion(d.version);
      })
      .catch(() => {});
  }, []);
  const [copied, setCopied] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const copyCmd = () => {
    navigator.clipboard.writeText("bun add @buntok/core");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative animate-fade-up overflow-x-hidden">
      {/* Background effects — full-bleed beyond max-w-6xl parent */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-screen h-full pointer-events-none z-0"
        style={{ marginLeft: "calc(-50vw + 50%)" }}
      >
        <div
          className="absolute inset-0 transition-opacity duration-300"
          style={{
            background: `radial-gradient(600px circle at ${mousePos.x}px ${mousePos.y}px, rgba(249, 115, 22, 0.04), transparent 40%)`,
          }}
        />
        <div className="absolute inset-0 w-full mask-[linear-gradient(to_bottom,white_5%,transparent_85%)]">
          <div
            className="absolute inset-0 bg-[linear-gradient(to_right,#8080801a_1px,transparent_1px),linear-gradient(to_bottom,#8080801a_1px,transparent_1px)] bg-size-[4rem_4rem]"
            style={{ backgroundPosition: "center top" }}
          />
          <svg className="hidden sm:block absolute top-0 left-0 w-full h-full pointer-events-none" viewBox="0 0 1000 1000" preserveAspectRatio="none">
            <defs>
              <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <g filter="url(#glow)">
              {/* === Vertical lines === */}
              <path d="M 120 0 V 1000" stroke="#f97316" strokeWidth="1.2" fill="none" strokeLinecap="round" strokeDasharray="80 4000" opacity="0.4">
                <animate attributeName="stroke-dashoffset" from="4080" to="-80" dur="12s" repeatCount="indefinite" />
              </path>
              <path d="M 300 0 V 1000" stroke="#f97316" strokeWidth="0.8" fill="none" strokeLinecap="round" strokeDasharray="60 4000" opacity="0.25">
                <animate attributeName="stroke-dashoffset" from="4060" to="-60" dur="15s" begin="2s" repeatCount="indefinite" />
              </path>
              <path d="M 500 0 V 1000" stroke="#f97316" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeDasharray="100 4000" opacity="0.5">
                <animate attributeName="stroke-dashoffset" from="4100" to="-100" dur="10s" begin="1s" repeatCount="indefinite" />
              </path>
              <path d="M 700 0 V 1000" stroke="#f97316" strokeWidth="0.8" fill="none" strokeLinecap="round" strokeDasharray="60 4000" opacity="0.25">
                <animate attributeName="stroke-dashoffset" from="4060" to="-60" dur="14s" begin="3s" repeatCount="indefinite" />
              </path>
              <path d="M 880 0 V 1000" stroke="#f97316" strokeWidth="1.2" fill="none" strokeLinecap="round" strokeDasharray="80 4000" opacity="0.35">
                <animate attributeName="stroke-dashoffset" from="4080" to="-80" dur="11s" begin="4s" repeatCount="indefinite" />
              </path>

              {/* === Horizontal lines === */}
              <path d="M 0 150 H 1000" stroke="#f97316" strokeWidth="1" fill="none" strokeLinecap="round" strokeDasharray="70 4000" opacity="0.3">
                <animate attributeName="stroke-dashoffset" from="4070" to="-70" dur="13s" begin="1.5s" repeatCount="indefinite" />
              </path>
              <path d="M 0 350 H 1000" stroke="#f97316" strokeWidth="1.3" fill="none" strokeLinecap="round" strokeDasharray="90 4000" opacity="0.45">
                <animate attributeName="stroke-dashoffset" from="4090" to="-90" dur="9s" begin="0.5s" repeatCount="indefinite" />
              </path>
              <path d="M 0 550 H 1000" stroke="#f97316" strokeWidth="0.8" fill="none" strokeLinecap="round" strokeDasharray="50 4000" opacity="0.2">
                <animate attributeName="stroke-dashoffset" from="4050" to="-50" dur="16s" begin="5s" repeatCount="indefinite" />
              </path>
              <path d="M 0 750 H 1000" stroke="#f97316" strokeWidth="1.1" fill="none" strokeLinecap="round" strokeDasharray="75 4000" opacity="0.35">
                <animate attributeName="stroke-dashoffset" from="4075" to="-75" dur="11s" begin="2.5s" repeatCount="indefinite" />
              </path>

              {/* === Diagonal lines === */}
              <path d="M 0 0 L 1000 1000" stroke="#f97316" strokeWidth="0.8" fill="none" strokeLinecap="round" strokeDasharray="50 5000" opacity="0.2">
                <animate attributeName="stroke-dashoffset" from="5050" to="-50" dur="18s" begin="3s" repeatCount="indefinite" />
              </path>
              <path d="M 1000 0 L 0 1000" stroke="#f97316" strokeWidth="0.8" fill="none" strokeLinecap="round" strokeDasharray="50 5000" opacity="0.2">
                <animate attributeName="stroke-dashoffset" from="5050" to="-50" dur="20s" begin="6s" repeatCount="indefinite" />
              </path>
              <path d="M 200 0 L 1000 800" stroke="#f97316" strokeWidth="0.6" fill="none" strokeLinecap="round" strokeDasharray="40 4500" opacity="0.15">
                <animate attributeName="stroke-dashoffset" from="4540" to="-40" dur="22s" begin="4s" repeatCount="indefinite" />
              </path>
              <path d="M 800 0 L 0 800" stroke="#f97316" strokeWidth="0.6" fill="none" strokeLinecap="round" strokeDasharray="40 4500" opacity="0.15">
                <animate attributeName="stroke-dashoffset" from="4540" to="-40" dur="19s" begin="7s" repeatCount="indefinite" />
              </path>

              {/* === Random short lines === */}
              <path d="M 100 200 L 250 180" stroke="#f97316" strokeWidth="1" fill="none" strokeLinecap="round" strokeDasharray="30 2000" opacity="0.3">
                <animate attributeName="stroke-dashoffset" from="2030" to="-30" dur="8s" begin="1s" repeatCount="indefinite" />
              </path>
              <path d="M 600 100 L 750 130" stroke="#f97316" strokeWidth="0.8" fill="none" strokeLinecap="round" strokeDasharray="25 2000" opacity="0.25">
                <animate attributeName="stroke-dashoffset" from="2025" to="-25" dur="10s" begin="3s" repeatCount="indefinite" />
              </path>
              <path d="M 300 400 L 420 380" stroke="#f97316" strokeWidth="0.7" fill="none" strokeLinecap="round" strokeDasharray="20 2000" opacity="0.2">
                <animate attributeName="stroke-dashoffset" from="2020" to="-20" dur="9s" begin="5s" repeatCount="indefinite" />
              </path>
              <path d="M 700 500 L 850 520" stroke="#f97316" strokeWidth="0.9" fill="none" strokeLinecap="round" strokeDasharray="35 2000" opacity="0.28">
                <animate attributeName="stroke-dashoffset" from="2035" to="-35" dur="11s" begin="2s" repeatCount="indefinite" />
              </path>
              <path d="M 150 650 L 300 630" stroke="#f97316" strokeWidth="0.7" fill="none" strokeLinecap="round" strokeDasharray="22 2000" opacity="0.22">
                <animate attributeName="stroke-dashoffset" from="2022" to="-22" dur="7s" begin="4s" repeatCount="indefinite" />
              </path>
              <path d="M 500 700 L 650 720" stroke="#f97316" strokeWidth="0.8" fill="none" strokeLinecap="round" strokeDasharray="28 2000" opacity="0.24">
                <animate attributeName="stroke-dashoffset" from="2028" to="-28" dur="12s" begin="6s" repeatCount="indefinite" />
              </path>
              <path d="M 800 300 L 920 280" stroke="#f97316" strokeWidth="0.6" fill="none" strokeLinecap="round" strokeDasharray="18 2000" opacity="0.18">
                <animate attributeName="stroke-dashoffset" from="2018" to="-18" dur="10s" begin="8s" repeatCount="indefinite" />
              </path>
              <path d="M 400 850 L 550 870" stroke="#f97316" strokeWidth="0.7" fill="none" strokeLinecap="round" strokeDasharray="24 2000" opacity="0.2">
                <animate attributeName="stroke-dashoffset" from="2024" to="-24" dur="9s" begin="7s" repeatCount="indefinite" />
              </path>
            </g>
          </svg>
        </div>
      </div>

      {/* ── Hero ── */}
      <section className="relative z-10 flex flex-col items-center text-center pt-28 pb-16 sm:pb-24 px-4 sm:px-0">
        {/* Badge - dynamic npm version as text */}
        <a
          href="https://www.npmjs.com/package/@buntok/core"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#f97316]/20 bg-[#f97316]/5 backdrop-blur-sm text-xs text-text-secondary mb-8 hover:border-[#f97316]/40 hover:bg-[#f97316]/10 transition-all group"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#f97316] animate-pulse group-hover:scale-125 transition-transform" />
          <span className="font-bold tracking-tight">@buntok/core</span>
          <span className="w-px h-3 bg-[#f97316]/20" />
          {npmVersion ? (
            <span className="font-bold text-[#f97316]">v{npmVersion}</span>
          ) : (
            <span
              className="inline-block h-3 w-10 rounded bg-[#f97316]/20 animate-pulse"
              aria-hidden
            />
          )}
        </a>

        {/* Headline */}
        <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black tracking-tighter leading-[1.08] mb-6 max-w-4xl relative px-2 sm:px-0">
          Decorator-Powered, Zero-Config <br className="hidden sm:block" />
          <span className="relative inline-block bg-linear-to-r from-[#f97316] via-[#fb923c] to-[#f97316] bg-clip-text text-transparent hover:scale-105 transition-transform duration-300 cursor-default">
            API Framework
            <span className="absolute -bottom-2 left-0 w-full h-1 bg-linear-to-r from-[#f97316]/40 to-[#f97316]/10 rounded-full blur-sm" />
          </span>{" "}
          for Bun
        </h1>

        <p className="text-sm sm:text-lg text-text-secondary max-w-xl mb-10 sm:mb-12 leading-relaxed px-2 sm:px-0">
          Zero-config, zero overhead. Built for developers who want
          decorator-powered architecture without the complexity.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <Link
            href="/docs"
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-full bg-[#f97316] text-white text-sm font-semibold hover:bg-[#ea580c] hover:shadow-[0_0_24px_rgba(249,115,22,0.3)] transition-all duration-300 active:scale-95"
          >
            Get Started <ArrowRight className="w-4 h-4" />
          </Link>
          <button
            onClick={copyCmd}
            className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-5 py-2.5 rounded-full border border-border-primary bg-bg-secondary hover:bg-bg-tertiary text-sm font-mono text-text-secondary hover:border-[#f97316]/30 transition-all duration-300 active:scale-95 group"
          >
            <Terminal className="w-3.5 h-3.5 shrink-0 text-[#f97316] group-hover:animate-bounce" />
            bun add @buntok/core
            <span className="ml-1 text-xs opacity-60 group-hover:opacity-100 transition-opacity">
              {copied ? "✓" : "⌘C"}
            </span>
          </button>
        </div>

        {/* Stats bar */}
        <div className="mt-12 sm:mt-16 flex flex-wrap items-center justify-center gap-x-6 sm:gap-x-10 gap-y-3 text-xs sm:text-sm text-text-secondary">
          {[
            {
              val: data?.frameworks?.buntok
                ? `${Math.round(data.frameworks.buntok["/plaintext"].reqPerSec / 1000)}k+`
                : "30k+",
              label: "req/s on Bun",
            },
            { val: "AOT", label: "Compiled Router" },
            { val: "100%", label: "TypeScript" },
            { val: "MIT", label: "Open Source" },
          ].map((s, i) => (
            <div
              key={s.label}
              className="flex items-center gap-2 hover:-translate-y-0.5 transition-transform duration-300 cursor-default"
              style={{ transitionDelay: `${i * 50}ms` }}
            >
              <span className="font-bold text-text-primary">{s.val}</span>
              <span>{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Code preview ── */}
      <section className="relative z-10 border-t border-border-primary py-16 sm:py-24 px-4 sm:px-0">
        <div className="md:max-w-4xl lg:max-w-6xl mx-auto grid lg:grid-cols-2 gap-10 sm:gap-16 items-center">
          <div className="order-2 lg:order-1">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#f97316] mb-3 flex items-center gap-2">
              <span className="w-8 h-px bg-[#f97316]/50" />
              Why Buntok?
            </p>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight mb-5">
              Clean. Fast. Typed.
            </h2>
            <p className="text-text-secondary leading-relaxed mb-6 sm:mb-8 text-base sm:text-lg">
              Write your API the way it should be written - with classes,
              decorators, and automatic type inference. Buntok compiles
              everything ahead of time so the runtime has zero overhead.
            </p>
            <ul className="space-y-3 text-xs sm:text-sm text-text-secondary">
              {[
                "Decorator-based Controllers with @Get, @Post, @Put, @Delete, etc.",
                "ZodCtx for 100% type-safe validation with auto-inferred types",
                "AOT router compilation - static routes O(1), dynamic via trie",
                "Built-in zValidator, CORS, Rate Limiter, SSE, WebSockets",
              ].map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-3 p-3 rounded-lg hover:bg-bg-secondary/50 border border-transparent hover:border-border-primary transition-all duration-300"
                >
                  <CheckCircle className="w-4 h-4 text-[#f97316] mt-0.5 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="order-1 lg:order-2 group max-w-full">
            <div className="rounded-xl overflow-hidden border border-border-primary shadow-2xl shadow-black/20 transition-all duration-500 group-hover:shadow-[0_0_40px_rgba(249,115,22,0.12)] group-hover:-translate-y-1">
              <div className="bg-bg-secondary border-b border-border-primary px-4 py-2.5 flex items-center gap-2">
                <div className="flex gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]" />
                  <span className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
                  <span className="w-2.5 h-2.5 rounded-full bg-[#27c93f]" />
                </div>
                <span className="ml-3 text-[11px] font-mono text-text-secondary">
                  user.controller.ts
                </span>
              </div>
              <div className="overflow-x-auto">
                <SyntaxHighlighter
                  language="typescript"
                  style={mounted && theme === "dark" ? vscDarkPlus : vs}
                  customStyle={{
                    margin: 0,
                    padding: "0.75rem 1rem",
                    fontSize: "0.7rem",
                    lineHeight: "1.55",
                    minWidth: "300px",
                  }}
                >{`import { Controller, Get, Post } from '@buntok/core';
import { Use, zValidator, ZodCtx, z } from '@buntok/core/middlewares/validator';
import type { Context } from '@buntok/core';

const UserSchema = z.object({
  name: z.string().min(2),
  email: z.string().email()
});

@Controller('/users')
export class UserController {

  @Get('/')
  async list() {
    return [{ id: 1, name: 'Alice' }];
  }

  @Post('/')
  @Use(zValidator('body', UserSchema))
  async create(ctx: ZodCtx<{ body: typeof UserSchema }>) {
    const data = ctx.valid('body'); // Fully typed!
    return ctx.json({ success: true, data });
  }
}`}</SyntaxHighlighter>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Performance Highlight ── */}
      <section className="relative z-10 border-t border-border-primary py-16 sm:py-24 bg-bg-secondary/30">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#f97316] mb-3 flex items-center justify-center gap-2">
            <span className="w-8 h-px bg-[#f97316]/50" />
            Raw Performance
            <span className="w-8 h-px bg-[#f97316]/50" />
          </p>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight mb-5">
            Faster than Hono. <br className="sm:hidden" /> Neck-and-neck with
            Elysia.
          </h2>
          <p className="text-text-secondary leading-relaxed mb-10 sm:mb-14 text-base sm:text-lg max-w-2xl mx-auto">
            Buntok wasn&apos;t just built for developer experience - it was
            built for raw throughput. By compiling your decorators Ahead-of-Time
            (AOT), Buntok bypasses the heavy runtime routing overhead found in
            Express and NestJS.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
            <div className="bg-bg-primary rounded-xl p-5 border border-border-primary hover:border-[#f97316]/30 transition-all duration-300 shadow-lg shadow-black/5 hover:-translate-y-0.5">
              <Zap className="w-5 h-5 text-[#f97316] mx-auto mb-3" />
              <h3 className="text-2xl font-black text-text-primary mb-1">
                {data?.frameworks?.buntok
                  ? `${Math.round(data.frameworks.buntok["/plaintext"].reqPerSec).toLocaleString()}`
                  : "30k+"}
              </h3>
              <p className="text-xs text-text-secondary">Requests per second</p>
            </div>
            <div className="bg-bg-primary rounded-xl p-5 border border-border-primary hover:border-[#27c93f]/30 transition-all duration-300 shadow-lg shadow-black/5 hover:-translate-y-0.5">
              <Clock className="w-5 h-5 text-[#27c93f] mx-auto mb-3" />
              <h3 className="text-2xl font-black text-text-primary mb-1">
                {data?.frameworks?.buntok
                  ? `< ${(data.frameworks.buntok["/plaintext"].latencyP50 / 1000).toFixed(1)}ms`
                  : "< 0.1ms"}
              </h3>
              <p className="text-xs text-text-secondary">P50 Latency</p>
            </div>
            <div className="bg-bg-primary rounded-xl p-5 border border-border-primary hover:border-[#3b82f6]/30 transition-all duration-300 shadow-lg shadow-black/5 hover:-translate-y-0.5">
              <Code2 className="w-5 h-5 text-[#3b82f6] mx-auto mb-3" />
              <h3 className="text-2xl font-black text-text-primary mb-1">
                Full
              </h3>
              <p className="text-xs text-text-secondary">TypeScript</p>
            </div>
          </div>

          <div className="mt-10 sm:mt-14 text-xs sm:text-sm text-text-secondary px-2 sm:px-0">
            <p>
              In our independent benchmarks, Buntok consistently outperforms{" "}
              <strong className="text-text-primary">Hono</strong> and stays
              highly competitive with{" "}
              <strong className="text-text-primary">Elysia</strong>, while
              providing a clean decorator-powered API.
            </p>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="relative z-10 border-t border-border-primary py-8 px-4">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-text-secondary">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-text-primary">Buntok</span>
            <span>&copy; {new Date().getFullYear()}</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/docs" className="hover:text-accent transition-colors">
              Docs
            </Link>
            <Link
              href="/benchmarks"
              className="hover:text-accent transition-colors"
            >
              Benchmarks
            </Link>
            <a
              href="https://github.com/PitokDf/buntok"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-accent transition-colors"
            >
              GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
