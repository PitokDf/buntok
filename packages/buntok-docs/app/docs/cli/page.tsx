import { Heading } from "@/components/ui/Heading";
import { CodeBlock } from "@/components/ui/CodeBlock";
import { Callout } from "@/components/ui/Callout";

export const metadata = {
  title: "CLI Commands",
  description:
    "Scaffold projects, generate code, and manage databases with the CLI.",
};

export default function CLIPage() {
  return (
    <div>
      <Heading
        level={1}
        className="text-4xl font-bold mt-8 mb-4 text-text-primary"
      >
        CLI
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Buntok provides a CLI for scaffolding and managing projects.
      </p>

      {/* ──────────────── INIT ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        init
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Initialize a new Buntok project with optimal configuration.
      </p>
      <CodeBlock code={`bunx buntok init`} />

      <Heading
        level={3}
        className="text-xl font-semibold mt-6 mb-2 text-text-primary"
      >
        Interactive Prompts
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        During initialization, you'll be asked:
      </p>
      <CodeBlock
        code={`? Do you want to deploy to Vercel? (y/N):
? Do you want to add Docker support? (Y/n):`}
      />
      <p className="my-3 text-text-secondary leading-relaxed">
        If you answer <code>y</code>, a <code>vercel.json</code> file will be
        created with the recommended configuration for Bun projects.
      </p>

      <Heading
        level={3}
        className="text-xl font-semibold mt-6 mb-2 text-text-primary"
      >
        What Gets Created
      </Heading>
      <CodeBlock
        code={`$ bunx buntok init

✓ Created .agents/skills/buntok-skill/SKILL.md
✓ Updated package.json (added 6 scripts)
✓ Created tsconfig.json
✓ Installed @biomejs/biome
✓ Created biome.json
✓ Created .vscode/settings.json
✓ Created src/env.ts
✓ Created src/index.ts
✓ Created .env
✓ Created .env.example
✓ Created .gitignore

? Do you want to deploy to Vercel? (y/N): y
✓ Created vercel.json
✓ Created server.ts
✓ Updated dev script to: bun --watch server.ts

? Do you want to add Docker support? (Y/n): y
✓ Created Dockerfile
✓ Created .dockerignore`}
      />

      <Heading
        level={3}
        className="text-xl font-semibold mt-6 mb-2 text-text-primary"
      >
        Generated <code>env.ts</code>
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        The <code>src/env.ts</code> file contains a type-safe environment schema
        using <code>validateEnv()</code>. All variables have sensible defaults
        and are validated at startup.
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
      <p className="my-3 text-text-secondary leading-relaxed">
        Add more variables as needed (e.g., <code>DATABASE_URL</code>,{" "}
        <code>JWT_SECRET</code>). The server will exit with a clear error if any
        required variable is missing or invalid.
      </p>

      {/* ──────────────── BUILD ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        build
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Build project for production. Compiles TypeScript to JavaScript and
        outputs to <code>.buntok/</code>.
      </p>
      <CodeBlock code={`bunx buntok build`} />

      <Heading
        level={3}
        className="text-xl font-semibold mt-6 mb-2 text-text-primary"
      >
        What It Does
      </Heading>
      <ul className="my-3 ml-6 list-disc text-text-secondary space-y-1">
        <li>
          Compiles the root <code>server.ts</code> entry point using{" "}
          <code>Bun.build()</code>
        </li>
        <li>
          Resolves path aliases (e.g., <code>@/*</code>) from{" "}
          <code>tsconfig.json</code>
        </li>
        <li>Marks all packages as external (not bundled)</li>
        <li>
          Outputs to <code>.buntok/server.js</code>
        </li>
      </ul>

      <Heading
        level={3}
        className="text-xl font-semibold mt-6 mb-2 text-text-primary"
      >
        Output
      </Heading>
      <CodeBlock
        code={`$ bunx buntok build

🔨 Building project...
✅ Build successful → .buntok/server.js
  Deploy: copy .buntok/ + node_modules/ + package.json to server`}
      />

      <Heading
        level={3}
        className="text-xl font-semibold mt-6 mb-2 text-text-primary"
      >
        Deploying
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        After building, deploy these files to your server:
      </p>
      <CodeBlock
        code={`# Files needed for production
.buntok/server.js    # Compiled application
node_modules/       # Dependencies
package.json        # Package manifest`}
      />

      <Heading
        level={3}
        className="text-xl font-semibold mt-6 mb-2 text-text-primary"
      >
        Development vs Production
      </Heading>
      <CodeBlock
        code={`# Development (hot reload)
bun run dev

# Build for production
bun run build

# Run production build
bun run start`}
      />

      {/* ──────────────── CHECK ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        check
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Run TypeScript type checking without emitting files. Displays all errors
        with file locations and a summary.
      </p>
      <CodeBlock code={`bunx buntok check`} />
      <CodeBlock
        code={`$ bunx buntok check

  Running type check...

src/index.ts(1,7): error TS2322: Type 'string' is not assignable to type 'number'.
src/index.ts(2,7): error TS2322: Type 'number' is not assignable to type 'string'.

  ✗ 2 errors in 2 files`}
      />

      <Heading
        level={3}
        className="text-xl font-semibold mt-6 mb-2 text-text-primary"
      >
        Options
      </Heading>
      <div className="overflow-x-auto my-4">
        <table className="min-w-full border border-border-primary text-sm">
          <thead>
            <tr className="bg-bg-secondary">
              <th className="border border-border-primary px-4 py-2 text-left text-text-primary">
                Flag
              </th>
              <th className="border border-border-primary px-4 py-2 text-left text-text-primary">
                Description
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-border-primary px-4 py-2 text-text-secondary">
                <code>--json</code>
              </td>
              <td className="border border-border-primary px-4 py-2 text-text-secondary">
                Output results as JSON for CI/CD
              </td>
            </tr>
            <tr>
              <td className="border border-border-primary px-4 py-2 text-text-secondary">
                <code>--plain</code>
              </td>
              <td className="border border-border-primary px-4 py-2 text-text-secondary">
                Plain text output without colors
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <Heading
        level={3}
        className="text-xl font-semibold mt-6 mb-2 text-text-primary"
      >
        JSON Output
      </Heading>
      <CodeBlock
        code={`$ bunx buntok check --json

{
  "success": false,
  "errors": [
    {
      "file": "src/index.ts",
      "line": 1,
      "col": 7,
      "code": "TS2322",
      "message": "Type 'string' is not assignable to type 'number'."
    }
  ],
  "errorCount": 1,
  "fileCount": 1
}`}
      />

      {/* ──────────────── CREATE ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        create
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Generate repository, service, controller, and schema files for an entity
        using a modular structure.
      </p>
      <CodeBlock code={`bunx buntok create <entity>`} />

      <Heading
        level={3}
        className="text-xl font-semibold mt-6 mb-2 text-text-primary"
      >
        Example Output
      </Heading>
      <CodeBlock
        code={`$ bunx buntok create user

Creating User entity (orm: prisma)...

✓ Created src/modules/user/user.repository.ts
✓ Created src/modules/user/user.service.ts
✓ Created src/modules/user/user.controller.ts
✓ Created src/modules/user/user.schema.ts
✓ Created src/modules/user/index.ts`}
      />

      <Heading
        level={3}
        className="text-xl font-semibold mt-6 mb-2 text-text-primary"
      >
        Generated Files
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        By default, <code>create</code> generates all files using the modular
        structure with <code>@Dependencies</code> for auto DI:
      </p>

      <Heading
        level={4}
        className="text-lg font-medium mt-4 mb-2 text-text-primary"
      >
        Controller
      </Heading>
      <CodeBlock
        code={`// src/modules/user/user.controller.ts
import { Dependencies, Controller } from "@buntok/core";
import { BaseController } from "@buntok/core";
import { UserService } from "./user.service";
import type { User } from "@prisma/client";

@Dependencies(UserService)
@Controller("/users")
export class UserController extends BaseController<User> {
  constructor(private readonly userService: UserService) {
    super(userService);
  }
}`}
      />

      <Heading
        level={4}
        className="text-lg font-medium mt-4 mb-2 text-text-primary"
      >
        Service
      </Heading>
      <CodeBlock
        code={`// src/modules/user/user.service.ts
import { Dependencies } from "@buntok/core";
import { BaseService } from "@buntok/core";
import { UserRepository } from "./user.repository";
import type { User } from "@prisma/client";

@Dependencies(UserRepository)
export class UserService extends BaseService<User> {
  constructor(private readonly userRepository: UserRepository) {
    super(userRepository);
  }
}`}
      />

      <Heading
        level={4}
        className="text-lg font-medium mt-4 mb-2 text-text-primary"
      >
        Repository
      </Heading>
      <CodeBlock
        code={`// src/modules/user/user.repository.ts
import { BaseRepository } from "@buntok/prisma";
import { prisma } from "@/lib/prisma";
import type { User, Prisma } from "@prisma/client";

export class UserRepository extends BaseRepository<
  User,
  Prisma.UserCreateInput,
  Prisma.UserUpdateInput
> {
  constructor() {
    super(prisma, "user");
  }
}`}
      />

      <Heading
        level={4}
        className="text-lg font-medium mt-4 mb-2 text-text-primary"
      >
        Schema (Zod)
      </Heading>
      <CodeBlock
        code={`// src/modules/user/user.schema.ts
import { z } from "@buntok/core/middlewares/validator";

export const CreateUserSchema = z.object({
  name: z.string().min(1).max(100),
  // TODO: Add more fields
});

export const UpdateUserSchema = CreateUserSchema.partial();

export type CreateUserInput = z.infer<typeof CreateUserSchema>;
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;`}
      />

      <Heading
        level={4}
        className="text-lg font-medium mt-4 mb-2 text-text-primary"
      >
        Barrel Export
      </Heading>
      <CodeBlock
        code={`// src/modules/user/index.ts
export { UserRepository } from "./user.repository";
export { UserService } from "./user.service";
export { UserController } from "./user.controller";
export { CreateUserSchema, UpdateUserSchema } from "./user.schema";
export type { CreateUserInput, UpdateUserInput } from "./user.schema";`}
      />

      <Heading
        level={3}
        className="text-xl font-semibold mt-6 mb-2 text-text-primary"
      >
        Partial Generation
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Use flags to generate only specific files. Flags can be{" "}
        <strong>combined</strong>:
      </p>
      <CodeBlock
        code={`# Generate only the repository
bunx buntok create user --repo

# Generate only the service
bunx buntok create user --service

# Generate only the controller
bunx buntok create user --controller

# Generate only the schema
bunx buntok create user --schema

# Combined (repo + service)
bunx buntok create user --repo --service`}
      />

      <Heading
        level={3}
        className="text-xl font-semibold mt-6 mb-2 text-text-primary"
      >
        ORM Selection
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        By default, the CLI auto-detects your ORM from <code>package.json</code>{" "}
        dependencies. You can also specify it explicitly:
      </p>
      <CodeBlock
        code={`# Auto-detect ORM (default)
bunx buntok create user

# Force Prisma
bunx buntok create user --prisma

# Force Drizzle
bunx buntok create user --drizzle

# Force TypeORM
bunx buntok create user --typeorm`}
      />

      <Heading
        level={3}
        className="text-xl font-semibold mt-6 mb-2 text-text-primary"
      >
        Dry Run
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Preview what would be generated without writing files:
      </p>
      <CodeBlock code={`bunx buntok create user --dry-run`} />

      {/* ──────────────── DB ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        db
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Database management commands.
      </p>
      <CodeBlock
        code={`# Run pending migrations (optional name)
bunx buntok db migrate
bunx buntok db migrate add-users-table

# Reset database (drop all tables)
bunx buntok db reset

# Seed database with initial data
bunx buntok db seed

# Generate migration from schema changes
bunx buntok db generate

# Open studio (Prisma Studio / Drizzle Studio)
bunx buntok db studio

# Show migration status
bunx buntok db status`}
      />
      <Callout type="info">
        Auto-detects ORM (<code>@buntok/prisma</code>,{" "}
        <code>@buntok/drizzle</code>, <code>@buntok/typeorm</code>) via{" "}
        <code>detectOrm()</code>. <code>migrate [name]</code> accepts optional
        migration name.
      </Callout>

      {/* ──────────────── MAKE:TEST ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        make:test
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Generate a unit test file for an entity.
      </p>
      <CodeBlock code={`bunx buntok make:test <entity> [--dry-run]`} />
      <CodeBlock
        code={`$ bunx buntok make:test user

✓ Created tests/user.test.ts

# Preview without writing
$ bunx buntok make:test user --dry-run`}
      />

      {/* ──────────────── MAKE:TEST:E2E ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        make:test:e2e
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Generate an E2E test file for an entity's API endpoints.
      </p>
      <CodeBlock code={`bunx buntok make:test:e2e <entity> [--dry-run]`} />
      <CodeBlock
        code={`$ bunx buntok make:test:e2e user

✓ Created tests/e2e/user.e2e.test.ts

# Preview without writing
$ bunx buntok make:test:e2e user --dry-run`}
      />

      {/* ──────────────── MAKE:SEEDER ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        make:seeder
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Generate a database seeder file for an entity. Works with any ORM
        (Prisma, Drizzle, TypeORM).
      </p>
      <CodeBlock code={`bunx buntok make:seeder <entity> [--factory] [--dry-run]`} />
      <CodeBlock
        code={`$ bunx buntok make:seeder user

✓ Created src/db/seeders/user.seeder.ts

# With factory pattern
$ bunx buntok make:seeder user --factory

# Preview without writing
$ bunx buntok make:seeder user --dry-run`}
      />

      <Heading
        level={3}
        className="text-xl font-semibold mt-6 mb-2 text-text-primary"
      >
        Factory Pattern
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Use the <code>--factory</code> flag to generate a seeder that uses the
        Factory pattern for data generation:
      </p>
      <CodeBlock code={`bunx buntok make:seeder user --factory`} />
      <CodeBlock
        code={`// src/db/seeders/user.seeder.ts
import { prisma } from "@/lib/prisma";
import { UserFactory } from "@/factories/user.factory";

export async function seedUser() {
  console.log("Seeding User...");

  const items = UserFactory.buildMany(100);
  await prisma.user.createMany({ data: items });

  console.log("✓ User seeded successfully (100 records)");
}`}
      />
      <Callout type="info">
        Requires a factory file at{" "}
        <code>src/factories/&lt;entity&gt;.factory.ts</code>. Run{" "}
        <code>buntok make:factory &lt;entity&gt;</code> first.
      </Callout>

      {/* ──────────────── MAKE:FACTORY ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        make:factory
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Generate a factory scaffold for an entity. Add the required fields to
        the generated definition before using it in tests or seeders.
      </p>
      <CodeBlock code={`bunx buntok make:factory <entity>`} />
      <CodeBlock
        code={`$ bunx buntok make:factory user

Created: src/factories/user.factory.ts

Usage:
  import { UserFactory } from "@/factories/user.factory";

  const user = await UserFactory.create();
  const users = await UserFactory.createMany(10);
  const admin = await UserFactory.create({ role: "admin" });`}
      />

      <Heading
        level={3}
        className="text-xl font-semibold mt-6 mb-2 text-text-primary"
      >
        Generated Factory
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        The generated file is a Prisma-oriented scaffold with a TODO definition.
        It is not ready to compile until you replace the placeholder with fields
        required by your <code>User</code> type.
      </p>
      <CodeBlock
        code={`// src/factories/user.factory.ts
import { Factory } from "@buntok/core";
import { faker } from "@faker-js/faker";
import type { User } from "@prisma/client";

export const UserFactory = Factory.define<User>(() => ({
  // TODO: Define your factory fields here
  // Example:
  // id: faker.number.int({ max: 10000 }),
  // name: faker.person.fullName(),
  // email: faker.internet.email(),
  // role: faker.helpers.arrayElement(["user", "admin"]),
}));`}
      />

      <Heading
        level={3}
        className="text-xl font-semibold mt-6 mb-2 text-text-primary"
      >
        Factory API
      </Heading>
      <div className="overflow-x-auto my-4">
        <table className="min-w-full border border-border-primary text-sm">
          <thead>
            <tr className="bg-bg-secondary">
              <th className="border border-border-primary px-4 py-2 text-left text-text-primary">
                Method
              </th>
              <th className="border border-border-primary px-4 py-2 text-left text-text-primary">
                Description
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-border-primary px-4 py-2 text-text-secondary">
                <code>Factory.define&lt;T&gt;(fn)</code>
              </td>
              <td className="border border-border-primary px-4 py-2 text-text-secondary">
                Create a new factory with type T
              </td>
            </tr>
            <tr>
              <td className="border border-border-primary px-4 py-2 text-text-secondary">
                <code>.create(overrides?)</code>
              </td>
              <td className="border border-border-primary px-4 py-2 text-text-secondary">
                Create one item (async, runs afterCreate)
              </td>
            </tr>
            <tr>
              <td className="border border-border-primary px-4 py-2 text-text-secondary">
                <code>.createMany(count, overrides?)</code>
              </td>
              <td className="border border-border-primary px-4 py-2 text-text-secondary">
                Create multiple items
              </td>
            </tr>
            <tr>
              <td className="border border-border-primary px-4 py-2 text-text-secondary">
                <code>.build(overrides?)</code>
              </td>
              <td className="border border-border-primary px-4 py-2 text-text-secondary">
                Generate one item synchronously
              </td>
            </tr>
            <tr>
              <td className="border border-border-primary px-4 py-2 text-text-secondary">
                <code>.buildMany(count, overrides?)</code>
              </td>
              <td className="border border-border-primary px-4 py-2 text-text-secondary">
                Generate multiple items synchronously
              </td>
            </tr>
            <tr>
              <td className="border border-border-primary px-4 py-2 text-text-secondary">
                <code>.withDefaults(defaults)</code>
              </td>
              <td className="border border-border-primary px-4 py-2 text-text-secondary">
                Set default overrides
              </td>
            </tr>
            <tr>
              <td className="border border-border-primary px-4 py-2 text-text-secondary">
                <code>.afterCreate(callback)</code>
              </td>
              <td className="border border-border-primary px-4 py-2 text-text-secondary">
                Register post-creation hook
              </td>
            </tr>
            <tr>
              <td className="border border-border-primary px-4 py-2 text-text-secondary">
                <code>Factory.ref(fn)</code>
              </td>
              <td className="border border-border-primary px-4 py-2 text-text-secondary">
                Lazy reference for relations
              </td>
            </tr>
            <tr>
              <td className="border border-border-primary px-4 py-2 text-text-secondary">
                <code>Factory.pick(arr, count?)</code>
              </td>
              <td className="border border-border-primary px-4 py-2 text-text-secondary">
                Random item(s) from array
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <Callout type="info">
        Requires <code>@faker-js/faker</code> as a peer dependency. Install
        with: <code>bun add -d @faker-js/faker</code>
      </Callout>

      {/* ──────────────── DEBUG:ROUTES ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        debug:routes
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Show all registered routes with their middleware chains. Useful for
        debugging route registration and middleware ordering.
      </p>
      <CodeBlock code={`bunx buntok debug:routes`} />
      <CodeBlock
        code={`$ bunx buntok debug:routes

Method │ Path               │ Middlewares                    │ Handler
───────┼────────────────────┼────────────────────────────────┼──────────
GET    │ /                  │ —                              │ (index)
GET    │ /users             │ cors, compress                 │ getAll
GET    │ /users/:id         │ cors, compress, auth           │ getById
POST   │ /users             │ cors, compress, validation     │ create

4 routes registered

By source:
  UserController: 3 routes
  direct: 1 routes`}
      />

      <Heading
        level={3}
        className="text-xl font-semibold mt-6 mb-2 text-text-primary"
      >
        JSON Output
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Use <code>--json</code> flag for programmatic access:
      </p>
      <CodeBlock code={`bunx buntok debug:routes --json`} />

      {/* ──────────────── DEV ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        dev
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Start the development server with hot reload. Optionally expose it
        publicly for testing webhooks or sharing.
      </p>
      <CodeBlock code={`bunx buntok dev`} />
      <CodeBlock
        code={`$ bunx buntok dev

Starting development server...

  Server running at http://localhost:1212

  Press Ctrl+C to stop`}
      />

      <Heading
        level={3}
        className="text-xl font-semibold mt-6 mb-2 text-text-primary"
      >
        Public Tunnel
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Use <code>--expose</code> to create a public URL via localtunnel. Useful
        for webhook testing, mobile testing, or sharing with others:
      </p>
      <CodeBlock code={`bunx buntok dev --expose`} />
      <CodeBlock
        code={`$ bunx buntok dev --expose

Starting development server with tunnel...

  Server running at http://localhost:1212
  Tunnel: https://buntok-1234.loca.lt → http://localhost:1212

  Press Ctrl+C to stop`}
      />
      <Callout type="warning">
        Requires <code>localtunnel</code> as a dev dependency. Install with:{" "}
        <code>bun add -d localtunnel</code>
      </Callout>

      <Heading
        level={3}
        className="text-xl font-semibold mt-6 mb-2 text-text-primary"
      >
        Options
      </Heading>
      <div className="overflow-x-auto my-4">
        <table className="min-w-full border border-border-primary text-sm">
          <thead>
            <tr className="bg-bg-secondary">
              <th className="border border-border-primary px-4 py-2 text-left text-text-primary">
                Flag
              </th>
              <th className="border border-border-primary px-4 py-2 text-left text-text-primary">
                Description
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-border-primary px-4 py-2 text-text-secondary">
                <code>--expose</code>
              </td>
              <td className="border border-border-primary px-4 py-2 text-text-secondary">
                Create public tunnel URL via localtunnel
              </td>
            </tr>
            <tr>
              <td className="border border-border-primary px-4 py-2 text-text-secondary">
                <code>--port=PORT</code>
              </td>
              <td className="border border-border-primary px-4 py-2 text-text-secondary">
                Port number (default: 1212)
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ──────────────── MAKE:MIDDLEWARE ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        make:middleware
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Generate a middleware file.
      </p>
      <CodeBlock code={`bunx buntok make:middleware <name> [--dry-run]`} />
      <CodeBlock
        code={`$ bunx buntok make:middleware auth

✓ Created src/middlewares/auth.ts

# Preview without writing
$ bunx buntok make:middleware auth --dry-run`}
      />

      {/* ──────────────── MAKE:DOCS ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        make:docs
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Manually regenerate OpenAPI documentation. <strong>Optional</strong> —{" "}
        <code>swagger.json</code> is auto-generated on <code>app.listen()</code>
        .
      </p>
      <CodeBlock code={`bunx buntok make:docs`} />
      <Callout type="info">
        Use this for CI/CD pipelines or when you need to regenerate{" "}
        <code>swagger.json</code> without starting the server.
      </Callout>

      {/* ──────────────── ALIASES ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Aliases
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        The <code>create</code> command has shorter aliases:
      </p>
      <CodeBlock
        code={`# These are all equivalent:
bunx buntok create user
bunx buntok g user
bunx buntok gen user
bunx buntok generate user`}
      />

      {/* ──────────────── PROJECT STRUCTURE ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Project Structure
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        After using <code>buntok init</code> and <code>buntok create user</code>
        :
      </p>
      <CodeBlock
        code={`my-app/
├── src/
│   ├── index.ts
│   ├── env.ts
│   └── modules/
│       └── user/
│           ├── index.ts              # barrel export
│           ├── user.controller.ts    # @Dependencies + BaseController
│           ├── user.service.ts       # @Dependencies + BaseService
│           ├── user.repository.ts    # BaseRepository (Prisma)
│           └── user.schema.ts        # Zod schemas
├── .agents/
│   └── skills/
│       └── buntok-skill/
│           └── SKILL.md
├── .env
├── .env.example
├── .gitignore
├── .vscode/
│   └── settings.json
├── biome.json
├── tsconfig.json
├── Dockerfile?          # buntok init (optional)
├── .dockerignore?       # buntok init (optional)
└── package.json`}
      />

      <Callout type="info">
        Each entity lives in its own module directory under{" "}
        <code>src/modules/</code>. The <code>@Dependencies</code> decorator
        enables automatic dependency injection — just register your controllers
        with <code>app.registerController()</code> and the container resolves
        the entire dependency tree.
      </Callout>

      {/* ──────────────── FLAGS REFERENCE ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Flags Reference
      </Heading>
      <div className="overflow-x-auto my-4">
        <table className="min-w-full border border-border-primary text-sm">
          <thead>
            <tr className="bg-bg-secondary">
              <th className="border border-border-primary px-4 py-2 text-left text-text-primary">
                Flag
              </th>
              <th className="border border-border-primary px-4 py-2 text-left text-text-primary">
                Description
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-border-primary px-4 py-2 text-text-secondary">
                <code>--repo</code>
              </td>
              <td className="border border-border-primary px-4 py-2 text-text-secondary">
                Generate only repository
              </td>
            </tr>
            <tr>
              <td className="border border-border-primary px-4 py-2 text-text-secondary">
                <code>--service</code>
              </td>
              <td className="border border-border-primary px-4 py-2 text-text-secondary">
                Generate only service
              </td>
            </tr>
            <tr>
              <td className="border border-border-primary px-4 py-2 text-text-secondary">
                <code>--controller</code>
              </td>
              <td className="border border-border-primary px-4 py-2 text-text-secondary">
                Generate only controller
              </td>
            </tr>
            <tr>
              <td className="border border-border-primary px-4 py-2 text-text-secondary">
                <code>--schema</code>
              </td>
              <td className="border border-border-primary px-4 py-2 text-text-secondary">
                Generate only Zod schema
              </td>
            </tr>
            <tr>
              <td className="border border-border-primary px-4 py-2 text-text-secondary">
                <code>--prisma</code>
              </td>
              <td className="border border-border-primary px-4 py-2 text-text-secondary">
                Use Prisma ORM (default: auto-detect)
              </td>
            </tr>
            <tr>
              <td className="border border-border-primary px-4 py-2 text-text-secondary">
                <code>--drizzle</code>
              </td>
              <td className="border border-border-primary px-4 py-2 text-text-secondary">
                Use Drizzle ORM
              </td>
            </tr>
            <tr>
              <td className="border border-border-primary px-4 py-2 text-text-secondary">
                <code>--typeorm</code>
              </td>
              <td className="border border-border-primary px-4 py-2 text-text-secondary">
                Use TypeORM
              </td>
            </tr>
            <tr>
              <td className="border border-border-primary px-4 py-2 text-text-secondary">
                <code>--dry-run</code>
              </td>
              <td className="border border-border-primary px-4 py-2 text-text-secondary">
                Preview files without writing
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
