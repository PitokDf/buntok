export interface DocRoute {
  href: string;
  title: string;
  section: string;
  description: string;
}

export const DOC_ROUTES: DocRoute[] = [
  { href: "/docs", title: "Getting Started", section: "Getting Started", description: "Installation, quick start, project structure, and first controller." },

  { href: "/docs/routing", title: "Routing", section: "Fundamentals", description: "Route decorators @Get, @Post, @Put, @Delete, dynamic routes, route groups." },
  { href: "/docs/controllers", title: "Controllers", section: "Fundamentals", description: "Controller class pattern, base controller, CRUD operations, lifecycle hooks." },
  { href: "/docs/decorators", title: "Decorators", section: "Fundamentals", description: "Available decorators: @Controller, @Get, @Post, @Put, @Delete, @Patch, @Use, @RateLimit." },
  { href: "/docs/context", title: "Context", section: "Fundamentals", description: "Request context, accessing body, params, query, headers, response helpers." },
  { href: "/docs/validation", title: "Validation", section: "Fundamentals", description: "Zod validation with zValidator, schema definitions, request body validation." },
  { href: "/docs/middleware", title: "Middleware", section: "Fundamentals", description: "Middleware pattern, before/after hooks, global vs route-level middleware." },
  { href: "/docs/error-handling", title: "Error Handling", section: "Fundamentals", description: "Error handling, custom error classes, global error handler, HTTP exceptions." },
  { href: "/docs/upload", title: "File Upload", section: "Fundamentals", description: "File upload with Bun.file, multipart form data, image processing with Bun.Image." },

  { href: "/docs/auth", title: "JWT Authentication", section: "Authentication", description: "JWT authentication, token generation, login/register flow, AuthStore, cookie mode." },
  { href: "/docs/oauth", title: "OAuth Social Login", section: "Authentication", description: "OAuth social login, Google/GitHub providers, authorization URL, token exchange." },
  { href: "/docs/rbac", title: "RBAC", section: "Authentication", description: "Role-based access control, permission system, admin routes, middleware guards." },

  { href: "/docs/app-config", title: "App Configuration", section: "Advanced", description: "App configuration, environment variables, validateEnv, CORS, helmet, rate limiting." },
  { href: "/docs/app-api", title: "App API", section: "Advanced", description: "App method reference: get, post, request, fetch, static, listen, ws, plugin, registerController." },
  { href: "/docs/ioc", title: "IoC Container", section: "Advanced", description: "Inversion of Control container, dependency injection, service registration." },
  { href: "/docs/plugins", title: "Plugins", section: "Advanced", description: "Plugin system, createPlugin, app.plugin(), install hooks." },
  { href: "/docs/dev-server", title: "Dev Server", section: "Advanced", description: "Development server with HMR, Bun.serve() wrapper." },
  { href: "/docs/logger", title: "Logger", section: "Advanced", description: "Logger, LogLevel, text/json formats, LOG_DIR file output, flushSync." },
  { href: "/docs/sse", title: "SSE", section: "Advanced", description: "Server-Sent Events, real-time streaming, event emitter integration." },
  { href: "/docs/websocket", title: "WebSocket", section: "Advanced", description: "WebSocket support, real-time bidirectional communication, connection handling." },
  { href: "/docs/static-files", title: "Static Files", section: "Advanced", description: "Static file serving, public directory, asset configuration." },
  { href: "/docs/emitter", title: "Event Emitter", section: "Advanced", description: "Event emitter pattern, publish/subscribe, decoupled architecture." },
  { href: "/docs/testing", title: "Testing", section: "Advanced", description: "Unit testing, integration testing, test utilities, mocking." },
  { href: "/docs/factory", title: "Factory", section: "Advanced", description: "Type-safe data factories for generating test and seed data with @faker-js/faker." },

  { href: "/docs/cache", title: "Cache", section: "Integrations", description: "Caching layer, MemoryCacheDriver, Redis driver, cache strategies, TTL." },
  { href: "/docs/graphql", title: "GraphQL", section: "Integrations", description: "GraphQL integration with Apollo Server and Yoga, schema, resolvers." },
  { href: "/docs/opentelemetry", title: "OpenTelemetry", section: "Integrations", description: "Distributed tracing with OpenTelemetry, per-request spans, OTLP exporter." },
  { href: "/docs/mailer", title: "Mailer", section: "Integrations", description: "Email sending, templates, Mailable classes, provider-side templates, attachments." },
  { href: "/docs/circuit-breaker", title: "Circuit Breaker", section: "Integrations", description: "Fail-fast resilience pattern, sliding windows, fallbacks, events, health checks." },
  { href: "/docs/payment", title: "Payment", section: "Integrations", description: "Payment gateway integration, Stripe, Midtrans, Xendit, PayPal, checkout, refunds, webhooks." },
  { href: "/docs/template", title: "Template Engine", section: "Integrations", description: "Template engine integration, HTML rendering, dynamic content." },
  { href: "/docs/queue", title: "Queue", section: "Integrations", description: "Background job processing with built-in drivers: Memory, Redis, Bun Redis, BullMQ, and RabbitMQ." },
  { href: "/docs/scheduler", title: "Scheduler", section: "Integrations", description: "Task scheduling, cron jobs, interval tasks, MemorySchedulerDriver, Bun cron." },

  { href: "/docs/metrics", title: "Metrics", section: "Utilities", description: "Request metrics collector, Prometheus export, per-route stats, in-flight tracking." },

  { href: "/docs/helpers", title: "Helpers", section: "Utilities", description: "Utility functions: hash, compare, slug, random, formatDate, paginate." },
  { href: "/docs/download", title: "Download / Export", section: "Utilities", description: "File downloads, data export (CSV/JSON), and archive creation with Bun.Archive." },
  { href: "/docs/client", title: "Client SDK", section: "Utilities", description: "Type-safe RPC client with retry, timeout, interceptors, contracts." },
  { href: "/docs/timezone", title: "Timezone", section: "Utilities", description: "Timezone utilities, date conversion, Temporal API integration." },
  { href: "/docs/ai", title: "AI Module", section: "Utilities", description: "AI module integration, streaming responses, LLM providers, embeddings." },
  { href: "/docs/vector-search", title: "Vector Search", section: "Utilities", description: "Semantic search with pgvector, AI embeddings, cosine similarity, hybrid search." },
  { href: "/docs/api-docs", title: "API Docs", section: "Utilities", description: "Auto-generated API documentation, Swagger/OpenAPI integration." },
  { href: "/docs/repository", title: "Repository", section: "Utilities", description: "BaseRepository pattern, CRUD operations, $hidden/$visible field sanitization." },
  { href: "/docs/audit-log", title: "Audit Log", section: "Utilities", description: "Audit logging, tracking changes, who-did-what-when." },
  { href: "/docs/health-check", title: "Health Check", section: "Utilities", description: "Health check endpoints, readiness probes, liveness checks." },
  { href: "/docs/ffi", title: "FFI / Native", section: "Utilities", description: "Foreign Function Interface, Bun native FFI, calling C/Zig libraries." },
  { href: "/docs/vercel", title: "Vercel Deploy", section: "Utilities", description: "Deploy to Vercel with Bun runtime, clean entry point, app.fetch()." },
  { href: "/docs/cli", title: "CLI", section: "Utilities", description: "CLI commands, project scaffolding, init command, generators." },
];

export function getAdjacentRoutes(pathname: string) {
  const idx = DOC_ROUTES.findIndex((r) => r.href === pathname);
  const prev = idx > 0 ? DOC_ROUTES[idx - 1] : null;
  const next = idx >= 0 && idx < DOC_ROUTES.length - 1 ? DOC_ROUTES[idx + 1] : null;
  return { prev, next };
}

export function getBreadcrumbs(pathname: string) {
  const route = DOC_ROUTES.find((r) => r.href === pathname);
  if (!route) return [];

  const crumbs: { label: string; href?: string }[] = [
    { label: "Docs", href: "/docs" },
  ];

  if (route.href !== "/docs") {
    if (route.section !== "Getting Started") {
      crumbs.push({ label: route.section });
    }
    crumbs.push({ label: route.title });
  }

  return crumbs;
}
