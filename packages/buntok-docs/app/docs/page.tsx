"use client";

import { Heading } from "@/components/ui/Heading";
import { CodeBlock } from "@/components/ui/CodeBlock";
import { Callout } from "@/components/ui/Callout";

export default function GettingStartedPage() {
  return (
    <div>
      <Heading level={1} className="text-4xl font-bold mb-4 text-text-primary">
        Getting Started
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        A comprehensive guide to get started building web applications with the
        Buntok Framework.
      </p>

      {/* ──────────────── PREREQUISITES ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Prerequisites
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Before getting started, make sure you have installed:
      </p>
      <ul className="my-3 ml-6 list-disc text-text-secondary space-y-1">
        <li>
          <strong>Bun</strong> &gt;= 1.2.0 -{" "}
          <a
            href="https://bun.sh"
            target="_blank"
            className="text-accent hover:underline"
          >
            https://bun.sh
          </a>
        </li>
        <li>
          <strong>TypeScript</strong> &gt;= 5.0
        </li>
        <li>
          <strong>Node.js</strong> (optional, for npm package compatibility)
        </li>
      </ul>

      <Callout type="info">
        <strong>OS Notes:</strong> Some features like{" "}
        <code>enableReusePort()</code> (SO_REUSEPORT) are Linux-only. On other
        platforms, this feature is disabled with a warning in development mode.
      </Callout>

      {/* ──────────────── QUICK SETUP ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Quick Setup
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        The fastest way to get started is by using <code>buntok init</code>:
      </p>

      <CodeBlock
        code={`# 1. Create a new project
mkdir my-app && cd my-app
bun init -y

# 2. Install buntok
bun add @buntok/core

# 3. Run the init command
bunx buntok init`}
      />

      <Callout type="info">
        <code>buntok init</code> will automatically set up your project with an
        optimal configuration. You'll be asked if you want to deploy to Vercel —
        if yes, a <code>vercel.json</code> will be created for you.
      </Callout>

      <Heading
        level={3}
        className="text-xl font-semibold mt-6 mb-2 text-text-primary"
      >
        Generated <code>src/index.ts</code>
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Clean app setup — same for both Vercel and non-Vercel:
      </p>
      <CodeBlock
        code={`import { App } from "@buntok/core";

export const app = new App();

app.get("/", (ctx) => {
  return ctx.json({ message: "Hello from Buntok!" });
});

export default app;`}
      />

      <Heading
        level={3}
        className="text-xl font-semibold mt-6 mb-2 text-text-primary"
      >
        Generated <code>server.ts</code>
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Local server entry point used by the development script:
      </p>
      <CodeBlock
        code={`import { app } from "./src/index";
import { env } from "./src/env";

app.listen(env.PORT);`}
      />

      <Heading
        level={3}
        className="text-xl font-semibold mt-6 mb-2 text-text-primary"
      >
        Generated <code>src/env.ts</code>
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Type-safe environment schema with sensible defaults:
      </p>
      <CodeBlock
        code={`import { App } from "@buntok/core";
import { z } from "@buntok/core/middlewares/validator";

export const env = App.validateEnv({
  PORT: z.coerce.number().default(1212),
  AUTH_STORE: z.enum(["header", "cookie"]).default("header"),
  AUTH_COOKIE: z.string().default("session"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});`}
      />

      {/* ──────────────── WHAT DOES INIT DO ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        What does <code>buntok init</code> do?
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        This command will create and configure:
      </p>

      <div className="my-4 overflow-x-auto">
        <table className="w-full text-sm text-text-secondary border border-border-primary rounded-lg overflow-hidden">
          <thead className="bg-bg-tertiary border-b border-border-primary">
            <tr>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                File
              </th>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Description
              </th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-border-primary">
              <td className="px-4 py-2">
                <code>src/index.ts</code>
              </td>
              <td className="px-4 py-2">
                Application entry point — exports the app instance
              </td>
            </tr>
            <tr className="border-b border-border-primary">
              <td className="px-4 py-2">
                <code>tsconfig.json</code>
              </td>
              <td className="px-4 py-2">TypeScript configuration</td>
            </tr>
            <tr className="border-b border-border-primary">
              <td className="px-4 py-2">
                <code>src/env.ts</code>
              </td>
              <td className="px-4 py-2">Type-safe environment schema</td>
            </tr>
            <tr className="border-b border-border-primary">
              <td className="px-4 py-2">
                <code>biome.json</code>
              </td>
              <td className="px-4 py-2">Biome linter configuration</td>
            </tr>
            <tr className="border-b border-border-primary">
              <td className="px-4 py-2">
                <code>.env</code>
              </td>
              <td className="px-4 py-2">Environment variables</td>
            </tr>
            <tr className="border-b border-border-primary">
              <td className="px-4 py-2">
                <code>.env.example</code>
              </td>
              <td className="px-4 py-2">Environment variables template</td>
            </tr>
            <tr className="border-b border-border-primary">
              <td className="px-4 py-2">
                <code>.vscode/settings.json</code>
              </td>
              <td className="px-4 py-2">VS Code settings for this project</td>
            </tr>
            <tr className="border-b border-border-primary">
              <td className="px-4 py-2">
                <code>.gitignore</code>
              </td>
              <td className="px-4 py-2">Git ignore rules</td>
            </tr>
            <tr className="border-b border-border-primary">
              <td className="px-4 py-2">
                <code>.agents/skills/buntok-skill/SKILL.md</code>
              </td>
              <td className="px-4 py-2">Skill guide for AI assistants</td>
            </tr>
            <tr className="border-b border-border-primary">
              <td className="px-4 py-2">
                <code>vercel.json</code>{" "}
                <span className="text-xs text-text-secondary">(optional)</span>
              </td>
              <td className="px-4 py-2">
                Vercel deployment config — includes{" "}
                <code>framework: "bun"</code>
              </td>
            </tr>
            <tr className="border-b border-border-primary">
              <td className="px-4 py-2">
                <code>server.ts</code>
              </td>
              <td className="px-4 py-2">
                Local server entry point — calls{" "}
                <code>app.listen(env.PORT)</code>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <Callout type="tip">
        <code>.agents/skills/buntok-skill/SKILL.md</code> contains the complete
        framework documentation that can be read by AI assistants such as
        Cursor, Copilot, or Claude.
      </Callout>

      {/* ──────────────── ENVIRONMENT CONFIGURATION ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Environment Configuration
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Buntok uses environment variables for configuration. The{" "}
        <code>buntok init</code> command creates a type-safe{" "}
        <code>src/env.ts</code> file and a <code>.env</code> file automatically.
      </p>

      <Heading
        level={3}
        className="text-xl font-semibold mt-6 mb-2 text-text-primary"
      >
        Default Schema
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        The generated <code>src/env.ts</code> validates your environment at
        startup with sensible defaults:
      </p>
      <CodeBlock
        code={`import { App } from "@buntok/core";
import { z } from "@buntok/core/middlewares/validator";

export const env = App.validateEnv({
  PORT: z.coerce.number().default(1212),
  AUTH_STORE: z.enum(["header", "cookie"]).default("header"),
  AUTH_COOKIE: z.string().default("session"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});`}
      />

      <Heading
        level={3}
        className="text-xl font-semibold mt-6 mb-2 text-text-primary"
      >
        Adding More Variables
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Extend the schema as needed. The server will exit with a clear error if
        any required variable is missing or invalid:
      </p>
      <CodeBlock
        code={`export const env = App.validateEnv({
  PORT: z.coerce.number().default(1212),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});`}
      />

      <Callout type="warning">
        If validation fails, the server prints a formatted error and calls{" "}
        <code>process.exit(1)</code>. The app will not start.
      </Callout>

      <Callout type="info">
        Learn more in{" "}
        <a href="/docs/app-config" className="text-accent hover:underline">
          App Configuration
        </a>
        .
      </Callout>

      {/* ──────────────── PROJECT STRUCTURE ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Project Structure
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Project structure after <code>buntok init</code> (with Vercel selected):
      </p>

      <CodeBlock
        code={`my-app/
├── src/
│   ├── index.ts              # export const app = new App()
│   ├── env.ts                # Type-safe env schema
│   └── modules/              # Feature-based modules
│       └── user/
│           ├── index.ts      # barrel export
│           ├── user.schema.ts
│           ├── user.repository.ts
│           ├── user.service.ts
│           └── user.controller.ts
├── server.ts                 # app.listen(env.PORT) — local server entry point
├── vercel.json               # Vercel config (framework: "bun")
├── .agents/
│   └── skills/
│       └── buntok-skill/
│           └── SKILL.md      # AI skill guide
├── .vscode/
│   └── settings.json         # VS Code settings
├── .env                      # Environment variables
├── .env.example              # Environment variables template
├── .gitignore                # Git ignore rules
├── biome.json                # Linter config
├── tsconfig.json             # TypeScript config
└── package.json`}
      />

      <Callout type="info">
        Without Vercel, <code>vercel.json</code> is not created.{" "}
        <code>server.ts</code> is always created for local development. A
        serverless deployment uses <code>app.fetch</code> through its deployment
        adapter.
      </Callout>

      {/* ──────────────── DATABASE SETUP ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Database Setup
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Buntok supports multiple database drivers through official packages:
      </p>

      <div className="my-4 overflow-x-auto">
        <table className="w-full text-sm text-text-secondary border border-border-primary rounded-lg overflow-hidden">
          <thead className="bg-bg-tertiary border-b border-border-primary">
            <tr>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Package
              </th>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Description
              </th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-border-primary">
              <td className="px-4 py-2">
                <code>@buntok/prisma</code>
              </td>
              <td className="px-4 py-2">Prisma ORM integration</td>
            </tr>
            <tr className="border-b border-border-primary">
              <td className="px-4 py-2">
                <code>@buntok/drizzle</code>
              </td>
              <td className="px-4 py-2">Drizzle ORM integration</td>
            </tr>
            <tr className="border-b border-border-primary">
              <td className="px-4 py-2">
                <code>@buntok/typeorm</code>
              </td>
              <td className="px-4 py-2">TypeORM integration</td>
            </tr>
          </tbody>
        </table>
      </div>

      <Heading
        level={3}
        className="text-xl font-semibold mt-6 mb-2 text-text-primary"
      >
        Prisma v7 (Recommended)
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        We recommend using Prisma v7 for better stability and performance with
        Bun. Prisma v7 includes native Bun support and improved query
        performance.
      </p>

      <CodeBlock
        code={`# Install Prisma v7 with Buntok integration
bun add @buntok/prisma prisma@7 @prisma/client@7

# Initialize Prisma schema
bunx prisma init

# Generate Prisma client
bunx prisma generate`}
      />

      <Callout type="info">
        <strong>Why Prisma v7?</strong>
        <ul className="mt-2 ml-4 list-disc space-y-1">
          <li>Native Bun runtime support (no Node.js polyfills needed)</li>
          <li>Faster query performance with optimized SQL generation</li>
          <li>Smaller bundle size compared to v6</li>
          <li>Better TypeScript inference and type safety</li>
        </ul>
      </Callout>

      <CodeBlock
        code={`// src/lib/prisma.ts
import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();`}
      />

      <CodeBlock
        code={`// src/repositories/user.repository.ts
import { BaseRepository } from "@buntok/prisma";
import { prisma } from "@/lib/prisma";
import type { User, PrismaClient, Prisma } from "@prisma/client";

export class UserRepository extends BaseRepository<
  User,
  PrismaClient,
  Prisma.UserCreateInput,
  Prisma.UserUpdateInput
> {
  constructor() {
    super(prisma, "user");
  }
}`}
      />

      <CodeBlock
        code={`// src/services/user.service.ts
import { BaseService } from "@buntok/core";
import { UserRepository } from "@/repositories/user.repository";
import type { User } from "@prisma/client";

export class UserService extends BaseService<User> {
  constructor(private userRepository: UserRepository) {
    super(userRepository);
  }
}`}
      />

      <Callout type="info">
        Use <code>buntok db migrate</code> to run migrations and{" "}
        <code>buntok db seed</code> to seed your database.
      </Callout>

      {/* ──────────────── ARCHITECTURE OVERVIEW ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Architecture Overview
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Buntok follows a <strong>layered architecture</strong> pattern for
        organized, maintainable code. Base classes auto-generate CRUD operations
        so you don't have to write boilerplate.
      </p>

      <Heading
        level={3}
        className="text-xl font-semibold mt-6 mb-2 text-text-primary"
      >
        Request Flow
      </Heading>
      <CodeBlock
        code={`Request
  │
  ▼
Route (decorator-based or manual)
  │
  ▼
Controller (handles HTTP, validates input)
  │
  ▼
Service (business logic)
  │
  ▼
Repository (data access)
  │
  ▼
Database`}
      />

      <Heading
        level={3}
        className="text-xl font-semibold mt-6 mb-2 text-text-primary"
      >
        Layer Descriptions
      </Heading>
      <div className="my-4 overflow-x-auto">
        <table className="w-full text-sm text-text-secondary border border-border-primary rounded-lg overflow-hidden">
          <thead className="bg-bg-tertiary border-b border-border-primary">
            <tr>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Layer
              </th>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Base Class
              </th>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Responsibility
              </th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-border-primary">
              <td className="px-4 py-2 font-mono text-accent">Controller</td>
              <td className="px-4 py-2 font-mono text-text-secondary">
                <code>BaseController</code>
              </td>
              <td className="px-4 py-2">
                Handles HTTP requests/responses, auto-registers CRUD routes
              </td>
            </tr>
            <tr className="border-b border-border-primary">
              <td className="px-4 py-2 font-mono text-accent">Service</td>
              <td className="px-4 py-2 font-mono text-text-secondary">
                <code>BaseService</code>
              </td>
              <td className="px-4 py-2">
                Business logic, data transformation, NotFoundError handling
              </td>
            </tr>
            <tr className="border-b border-border-primary">
              <td className="px-4 py-2 font-mono text-accent">Repository</td>
              <td className="px-4 py-2 font-mono text-text-secondary">
                <code>BaseRepository</code>
              </td>
              <td className="px-4 py-2">
                Data access layer, database queries, lifecycle hooks
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <Heading
        level={3}
        className="text-xl font-semibold mt-6 mb-2 text-text-primary"
      >
        Auto-Generated CRUD
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Extend the base classes to get a full CRUD API without writing
        boilerplate:
      </p>

      <CodeBlock
        code={`// 1. Repository - extends BaseRepository from your ORM
import { BaseRepository } from "@buntok/prisma"; // or @buntok/drizzle, @buntok/typeorm

export class UserRepository extends BaseRepository<User, PrismaClient> {
  constructor(prisma: PrismaClient) {
    super(prisma, "user");
  }
}

// 2. Service - extends BaseService
import { BaseService } from "@buntok/core";

export class UserService extends BaseService<User, CreateUser, UpdateUser> {
  constructor(private repo: UserRepository) {
    super(repo);
  }
}

// 3. Controller - extends BaseController (auto-registers 5 CRUD routes!)
import { Controller } from "@buntok/core";
import { BaseController } from "@buntok/core";

@Controller("/users")
export class UserController extends BaseController<User, CreateUser, UpdateUser> {
  constructor(private service: UserService) {
    super(service);
  }
}

// This automatically creates:
// GET    /       → service.getAll()
// GET    /:id    → service.getById(id)
// POST   /       → service.create(body)
// PUT    /:id    → service.update(id, body)
// DELETE /:id    → service.delete(id)`}
      />

      <Callout type="info">
        Each ORM has its own <code>BaseRepository</code>:{" "}
        <code>@buntok/prisma</code>, <code>@buntok/drizzle</code>, or{" "}
        <code>@buntok/typeorm</code>. Choose the one that matches your stack.
      </Callout>

      <Heading
        level={3}
        className="text-xl font-semibold mt-6 mb-2 text-text-primary"
      >
        Routing Approaches
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Buntok supports two routing approaches:
      </p>

      <Heading
        level={4}
        className="text-lg font-semibold mt-4 mb-2 text-text-primary"
      >
        1. Decorator-based (Recommended)
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Routes are automatically registered using decorators:
      </p>
      <CodeBlock
        code={`import { Controller, Get, Post } from "@buntok/core";

@Controller("/users")
export class UserController {
  @Get("/")
  findAll(ctx) {
    return ctx.json({ users: [] });
  }

  @Post("/")
  create(ctx) {
    return ctx.json({ message: "User created" }, 201);
  }
}`}
      />

      <Heading
        level={4}
        className="text-lg font-semibold mt-4 mb-2 text-text-primary"
      >
        2. Manual Routing (Optional)
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        For simple cases, you can define routes directly on the app:
      </p>
      <CodeBlock
        code={`import { App } from "@buntok/core";

const app = new App();

app.get("/", (ctx) => {
  return ctx.json({ message: "Hello, Buntok!" });
});

app.post("/users", (ctx) => {
  return ctx.json({ message: "User created" }, 201);
});`}
      />

      {/* ──────────────── CLI COMMANDS ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        CLI Commands
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Buntok provides several commands to help with development:
      </p>

      <div className="my-4 overflow-x-auto">
        <table className="w-full text-sm text-text-secondary border border-border-primary rounded-lg overflow-hidden">
          <thead className="bg-bg-tertiary border-b border-border-primary">
            <tr>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Command
              </th>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Description
              </th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-border-primary">
              <td className="px-4 py-2">
                <code>buntok init</code>
              </td>
              <td className="px-4 py-2">
                Set up project with optimal configuration
              </td>
            </tr>
            <tr className="border-b border-border-primary">
              <td className="px-4 py-2">
                <code>buntok build</code>
              </td>
              <td className="px-4 py-2">
                Build project for production (output to <code>.buntok/</code>)
              </td>
            </tr>
            <tr className="border-b border-border-primary">
              <td className="px-4 py-2">
                <code>buntok create &lt;entity&gt;</code>
              </td>
              <td className="px-4 py-2">
                Generate repository, service, and controller in{" "}
                <code>src/modules/&lt;entity&gt;/</code>
              </td>
            </tr>
            <tr className="border-b border-border-primary">
              <td className="px-4 py-2">
                <code>buntok db migrate</code>
              </td>
              <td className="px-4 py-2">Run pending database migrations</td>
            </tr>
            <tr className="border-b border-border-primary">
              <td className="px-4 py-2">
                <code>buntok db seed</code>
              </td>
              <td className="px-4 py-2">Seed database with initial data</td>
            </tr>
            <tr className="border-b border-border-primary">
              <td className="px-4 py-2">
                <code>buntok make:test &lt;name&gt;</code>
              </td>
              <td className="px-4 py-2">Generate unit test file</td>
            </tr>
            <tr className="border-b border-border-primary">
              <td className="px-4 py-2">
                <code>buntok make:test:e2e &lt;name&gt;</code>
              </td>
              <td className="px-4 py-2">Generate E2E test file</td>
            </tr>
            <tr className="border-b border-border-primary">
              <td className="px-4 py-2">
                <code>buntok make:middleware &lt;name&gt;</code>
              </td>
              <td className="px-4 py-2">Generate middleware file</td>
            </tr>
            <tr className="border-b border-border-primary">
              <td className="px-4 py-2">
                <code>buntok make:seeder &lt;name&gt;</code>
              </td>
              <td className="px-4 py-2">Generate database seeder</td>
            </tr>
            <tr className="border-b border-border-primary">
              <td className="px-4 py-2">
                <code>buntok make:docs</code>
              </td>
              <td className="px-4 py-2">
                Manual OpenAPI docs regeneration (auto-generated on startup)
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <Heading
        level={3}
        className="text-xl font-semibold mt-6 mb-2 text-text-primary"
      >
        Code Generation Example
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Running <code>buntok create user</code> generates:
      </p>

      <CodeBlock
        code={`$ bunx buntok create user

Creating User entity (orm: prisma)...

✓ Repository: src/modules/user/user.repository.ts
✓ Service: src/modules/user/user.service.ts
✓ Controller: src/modules/user/user.controller.ts
✓ Schema: src/modules/user/user.schema.ts
✓ Barrel: src/modules/user/index.ts`}
      />

      <CodeBlock
        code={`// src/modules/user/user.controller.ts
import { Controller, Get, Post, Put, Delete } from "@buntok/core";
import { Dependencies } from "@buntok/core";
import { UserService } from "./user.service";

@Dependencies(UserService)
@Controller("/users")
export class UserController {
  constructor(private service: UserService) {}

  @Get("/")
  async findAll(ctx) {
    const users = await this.service.findAll();
    return ctx.json({ data: users });
  }

  @Get("/:id")
  async findById(ctx) {
    const user = await this.service.findById(ctx.params.id);
    if (!user) {
      return ctx.json({ message: "User not found" }, 404);
    }
    return ctx.json({ data: user });
  }

  @Post("/")
  async create(ctx) {
    const body = await ctx.body();
    const user = await this.service.create(body);
    return ctx.json({ data: user }, 201);
  }
}`}
      />

      <Callout type="info">
        Use <code>buntok create user --repo</code>, <code>--service</code>, or{" "}
        <code>--controller</code> for partial generation. Add{" "}
        <code>--prisma</code>, <code>--drizzle</code>, or <code>--typeorm</code>{" "}
        to specify ORM.
      </Callout>

      {/* ──────────────── PACKAGE SCRIPTS ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Package Scripts
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        <code>buntok init</code> will also add scripts to{" "}
        <code>package.json</code>:
      </p>

      <CodeBlock
        code={`{
  "scripts": {
    "dev": "bun --watch server.ts",
    "build": "bunx buntok build",
    "start": "bun .buntok/server.js",
    "check": "bunx @biomejs/biome check --write .",
    "format": "bunx @biomejs/biome format --write .",
    "lint": "bunx @biomejs/biome lint ."
  }
}`}
      />

      {/* ──────────────── RUN THE SERVER ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Run the Server
      </Heading>

      <Heading
        level={3}
        className="text-xl font-semibold mt-6 mb-2 text-text-primary"
      >
        Development Mode
      </Heading>
      <CodeBlock
        code={`# Hot reload with file watching
bun run dev

# Or directly
bun run server.ts`}
      />

      <Heading
        level={3}
        className="text-xl font-semibold mt-6 mb-2 text-text-primary"
      >
        Production Mode
      </Heading>
      <CodeBlock
        code={`# Build for production
bun run build

# Run the built output
bun run start`}
      />

      <Heading
        level={3}
        className="text-xl font-semibold mt-6 mb-2 text-text-primary"
      >
        Deploy to Vercel
      </Heading>
      <CodeBlock
        code={`# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Production deploy
vercel --prod`}
      />

      <p className="my-3 text-text-secondary leading-relaxed">
        Open <code>http://localhost:1212</code> in your browser. You will see:
      </p>

      <CodeBlock code={`{ "message": "Hello, Buntok!" }`} />

      <Heading
        level={3}
        className="text-xl font-semibold mt-6 mb-2 text-text-primary"
      >
        Port Auto-Increment
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        If the specified port is already in use, Buntok will automatically try
        the next available port:
      </p>

      <CodeBlock
        code={`⚠ Port 3000 is already in use, using port 3001 instead
Server listening at http://localhost:3001`}
      />

      <Callout type="info">
        This prevents crashes when running multiple instances or when another
        service is using the same port. The server will try up to 10 ports
        before failing.
      </Callout>

      {/* ──────────────── TROUBLESHOOTING ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Troubleshooting
      </Heading>

      <Heading
        level={3}
        className="text-xl font-semibold mt-6 mb-2 text-text-primary"
      >
        Port Already in Use
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        If you see a port conflict warning, Buntok will automatically use the
        next available port. You can also specify a different port:
      </p>
      <CodeBlock
        code={`app.listen(3000); // Try port 3000
// Or via environment variable
PORT=3000 bun run dev`}
      />

      <Heading
        level={3}
        className="text-xl font-semibold mt-6 mb-2 text-text-primary"
      >
        Error During <code>bunx buntok init</code>
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        If the init command fails, try these steps:
      </p>
      <ul className="my-3 ml-6 list-disc text-text-secondary space-y-1">
        <li>
          Make sure you're in the correct directory with a{" "}
          <code>package.json</code>
        </li>
        <li>
          Ensure Bun is installed and up to date: <code>bun --version</code>
        </li>
        <li>Check if you have write permissions in the current directory</li>
      </ul>

      <Heading
        level={3}
        className="text-xl font-semibold mt-6 mb-2 text-text-primary"
      >
        Environment Variables Not Read
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        If your environment variables aren't being read:
      </p>
      <ul className="my-3 ml-6 list-disc text-text-secondary space-y-1">
        <li>
          Make sure <code>.env</code> is in your project root (same level as{" "}
          <code>package.json</code>)
        </li>
        <li>
          Use <code>validateEnv()</code> to catch missing/invalid variables
          early
        </li>
        <li>
          Restart the server after changing <code>.env</code> files
        </li>
      </ul>

      <Heading
        level={3}
        className="text-xl font-semibold mt-6 mb-2 text-text-primary"
      >
        Database Connection Refused
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        If you can't connect to your database:
      </p>
      <ul className="my-3 ml-6 list-disc text-text-secondary space-y-1">
        <li>
          Verify <code>DATABASE_URL</code> is set correctly in <code>.env</code>
        </li>
        <li>Ensure your database server is running</li>
        <li>
          Run migrations: <code>buntok db migrate</code>
        </li>
        <li>
          For Prisma, regenerate the client: <code>bunx prisma generate</code>
        </li>
      </ul>

      <Heading
        level={3}
        className="text-xl font-semibold mt-6 mb-2 text-text-primary"
      >
        Vercel Build Error: `readFile` undefined
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        If you see{" "}
        <code>cannot read properties of undefined (reading 'readFile')</code> on
        Vercel:
      </p>
      <ul className="my-3 ml-6 list-disc text-text-secondary space-y-1">
        <li>
          Remove <code>typescript</code> from <code>peerDependencies</code> in{" "}
          <code>package.json</code>
        </li>
        <li>
          Keep it only as <code>devDependency</code> if needed
        </li>
        <li>
          TypeScript is already included via <code>tsup</code> and other build
          tools
        </li>
      </ul>
      <Callout type="info">
        See{" "}
        <a href="/docs/vercel" className="text-accent hover:underline">
          Vercel Deployment
        </a>{" "}
        for more details.
      </Callout>

      {/* ──────────────── NEXT STEPS ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Next Steps
      </Heading>
      <ul className="my-3 ml-6 list-disc text-text-secondary space-y-1">
        <li>
          <a href="/docs/routing" className="text-accent hover:underline">
            Routing
          </a>{" "}
          - Learn how to define routes
        </li>
        <li>
          <a href="/docs/controllers" className="text-accent hover:underline">
            Controllers
          </a>{" "}
          - Organize routes with controllers and <code>BaseController</code>
        </li>
        <li>
          <a href="/docs/repository" className="text-accent hover:underline">
            Repository
          </a>{" "}
          - CRUD operations with <code>BaseRepository</code>
        </li>
        <li>
          <a href="/docs/context" className="text-accent hover:underline">
            Context
          </a>{" "}
          - Access request and response
        </li>
        <li>
          <a href="/docs/plugins" className="text-accent hover:underline">
            Plugins
          </a>{" "}
          - Extend apps with the plugin system
        </li>
        <li>
          <a href="/docs/graphql" className="text-accent hover:underline">
            GraphQL
          </a>{" "}
          - Apollo Server and Yoga integration
        </li>
        <li>
          <a href="/docs/opentelemetry" className="text-accent hover:underline">
            OpenTelemetry
          </a>{" "}
          - Distributed tracing with per-request spans
        </li>
        <li>
          <a href="/docs/client" className="text-accent hover:underline">
            Client SDK
          </a>{" "}
          - Type-safe RPC client with retry and interceptors
        </li>
        <li>
          <a href="/docs/vercel" className="text-accent hover:underline">
            Vercel Deploy
          </a>{" "}
          - Deploy to Vercel with Bun runtime
        </li>
        <li>
          <a href="/docs/validation" className="text-accent hover:underline">
            Validation
          </a>{" "}
          - Validate input data
        </li>
        <li>
          <a href="/docs/app-config" className="text-accent hover:underline">
            App Configuration
          </a>{" "}
          - Environment validation and settings
        </li>
      </ul>
    </div>
  );
}
