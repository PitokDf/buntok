import { Heading } from "@/components/ui/Heading";
import { CodeBlock } from "@/components/ui/CodeBlock";
import { Callout } from "@/components/ui/Callout";

export const metadata = {
  title: "Repository Pattern",
  description: "CRUD operations with Prisma, Drizzle, or TypeORM repositories.",
};

export default function RepositoryPage() {
  return (
    <div>
      <Heading
        level={1}
        className="text-4xl font-bold mt-8 mb-4 text-text-primary"
      >
        Repository
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        <code>BaseRepository</code> provides a standard CRUD interface with
        lifecycle hooks for any supported ORM. Available as separate packages:
      </p>

      <div className="my-4 overflow-x-auto">
        <table className="w-full text-sm text-text-secondary border border-border-primary rounded-lg overflow-hidden">
          <thead className="bg-bg-tertiary border-b border-border-primary">
            <tr>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Package
              </th>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Install
              </th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-border-primary">
              <td className="px-4 py-2 font-mono text-accent">
                @buntok/prisma
              </td>
              <td className="px-4 py-2 font-mono text-xs">
                bun add @buntok/prisma
              </td>
            </tr>
            <tr className="border-b border-border-primary">
              <td className="px-4 py-2 font-mono text-accent">
                @buntok/drizzle
              </td>
              <td className="px-4 py-2 font-mono text-xs">
                bun add @buntok/drizzle
              </td>
            </tr>
            <tr className="border-b border-border-primary">
              <td className="px-4 py-2 font-mono text-accent">
                @buntok/typeorm
              </td>
              <td className="px-4 py-2 font-mono text-xs">
                bun add @buntok/typeorm
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ──────────────── CRUD METHODS ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        CRUD Methods
      </Heading>
      <div className="my-4 overflow-x-auto">
        <table className="w-full text-sm text-text-secondary border border-border-primary rounded-lg overflow-hidden">
          <thead className="bg-bg-tertiary border-b border-border-primary">
            <tr>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Method
              </th>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Description
              </th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-border-primary">
              <td className="px-4 py-2 font-mono text-accent">findAll()</td>
              <td className="px-4 py-2">Get all records</td>
            </tr>
            <tr className="border-b border-border-primary">
              <td className="px-4 py-2 font-mono text-accent">findById(id)</td>
              <td className="px-4 py-2">Find by primary key</td>
            </tr>
            <tr className="border-b border-border-primary">
              <td className="px-4 py-2 font-mono text-accent">
                findOne(where)
              </td>
              <td className="px-4 py-2">Find first matching record</td>
            </tr>
            <tr className="border-b border-border-primary">
              <td className="px-4 py-2 font-mono text-accent">create(data)</td>
              <td className="px-4 py-2">Create a new record</td>
            </tr>
            <tr className="border-b border-border-primary">
              <td className="px-4 py-2 font-mono text-accent">
                createMany(data[])
              </td>
              <td className="px-4 py-2">Bulk create</td>
            </tr>
            <tr className="border-b border-border-primary">
              <td className="px-4 py-2 font-mono text-accent">
                update(id, data)
              </td>
              <td className="px-4 py-2">Update by primary key</td>
            </tr>
            <tr className="border-b border-border-primary">
              <td className="px-4 py-2 font-mono text-accent">delete(id)</td>
              <td className="px-4 py-2">Delete by primary key</td>
            </tr>
            <tr className="border-b border-border-primary">
              <td className="px-4 py-2 font-mono text-accent">count()</td>
              <td className="px-4 py-2">Count all records</td>
            </tr>
            <tr className="border-b border-border-primary">
              <td className="px-4 py-2 font-mono text-accent">exists(where)</td>
              <td className="px-4 py-2">Check if record exists</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ──────────────── HOOKS ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Lifecycle Hooks
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Prisma-based repos support hooks that run before/after each operation.
        Override them in your subclass:
      </p>
      <div className="my-4 overflow-x-auto">
        <table className="w-full text-sm text-text-secondary border border-border-primary rounded-lg overflow-hidden">
          <thead className="bg-bg-tertiary border-b border-border-primary">
            <tr>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Hook
              </th>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Description
              </th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-border-primary">
              <td className="px-4 py-2 font-mono text-accent">
                beforeCreate(data)
              </td>
              <td className="px-4 py-2">
                Modify or validate data before insert. Return modified data or
                throw to abort.
              </td>
            </tr>
            <tr className="border-b border-border-primary">
              <td className="px-4 py-2 font-mono text-accent">
                afterCreate(result)
              </td>
              <td className="px-4 py-2">
                Run side effects after insert (logging, notifications, etc.)
              </td>
            </tr>
            <tr className="border-b border-border-primary">
              <td className="px-4 py-2 font-mono text-accent">
                beforeUpdate(id, data)
              </td>
              <td className="px-4 py-2">
                Modify data before update. Return modified data or throw.
              </td>
            </tr>
            <tr className="border-b border-border-primary">
              <td className="px-4 py-2 font-mono text-accent">
                afterUpdate(id, result)
              </td>
              <td className="px-4 py-2">Run side effects after update.</td>
            </tr>
            <tr className="border-b border-border-primary">
              <td className="px-4 py-2 font-mono text-accent">
                beforeDelete(id)
              </td>
              <td className="px-4 py-2">
                Validate before delete. Throw to abort.
              </td>
            </tr>
            <tr className="border-b border-border-primary">
              <td className="px-4 py-2 font-mono text-accent">
                afterDelete(id)
              </td>
              <td className="px-4 py-2">Run side effects after delete.</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ──────────────── FIELD SANITIZATION ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Field Sanitization
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Automatically exclude or include specific fields from all CRUD
        responses. Configure once in your repository — every{" "}
        <code>findAll()</code>, <code>findById()</code>, <code>create()</code>,
        etc. will apply the rules automatically.
      </p>

      <Heading
        level={3}
        className="text-xl font-semibold mt-6 mb-2 text-text-primary"
      >
        <code>$hidden</code> (Blacklist)
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Exclude sensitive fields like passwords, tokens, or internal data from
        all responses:
      </p>
      <CodeBlock
        code={`interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  resetToken: string | null;
  createdAt: Date;
}

// Prisma
class UserRepository extends BaseRepository<User, PrismaClient> {
  protected override $hidden = ["passwordHash", "resetToken"] as const;

  constructor(prisma: PrismaClient) {
    super(prisma, "user");
  }
}

// Drizzle
class UserRepository extends BaseRepository<typeof users, CreateInput, UpdateInput> {
  protected override $hidden = ["passwordHash", "resetToken"] as const;
}

// TypeORM
class UserRepository extends BaseRepository<User, CreateInput, UpdateInput> {
  protected override $hidden = ["passwordHash", "resetToken"] as const;
}

// Now ALL responses automatically exclude passwordHash and resetToken:
await userRepo.findAll();       // no passwordHash, no resetToken
await userRepo.findById("1");   // same
await userRepo.create(data);    // same
await userRepo.update(id, data);// same`}
      />

      <Heading
        level={3}
        className="text-xl font-semibold mt-6 mb-2 text-text-primary"
      >
        <code>$visible</code> (Whitelist)
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Only return specific fields. Takes precedence over{" "}
        <code>$hidden</code>:
      </p>
      <CodeBlock
        code={`class UserRepository extends BaseRepository<User, PrismaClient> {
  // Only return id, name, email — everything else is excluded
  protected override $visible = ["id", "name", "email"] as const;

  constructor(prisma: PrismaClient) {
    super(prisma, "user");
  }
}

// Response: { id: "1", name: "Budi", email: "budi@test.com" }
// passwordHash, resetToken, createdAt are all excluded`}
      />

      <Callout type="warning">
        <code>$visible</code> takes precedence over <code>$hidden</code>. If
        both are set, only <code>$visible</code> rules are applied.
      </Callout>

      <Heading
        level={3}
        className="text-xl font-semibold mt-6 mb-2 text-text-primary"
      >
        Type Safety
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Both <code>$hidden</code> and <code>$visible</code> are type-safe —
        TypeScript will catch typos and non-existent fields at compile time:
      </p>
      <CodeBlock
        code={`class UserRepository extends BaseRepository<User, PrismaClient> {
  // ✅ Correct
  protected $hidden = ["passwordHash"] as const;

  // ❌ Compile error: "passwordHaash" is not assignable to keyof User
  //    Did you mean "passwordHash"?
  protected $hidden = ["passwordHaash"] as const;

  // ❌ Compile error: "typo_field" is not assignable to keyof User
  protected $visible = ["id", "typo_field"] as const;
}`}
      />

      <Callout type="info">
        The <code>as const</code> assertion is required to preserve literal
        types. Without it, TypeScript infers <code>string[]</code> which is not
        assignable to <code>readonly (keyof T)[]</code>.
      </Callout>

      {/* ──────────────── PRISMA ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Prisma
      </Heading>
      <CodeBlock
        code={`import type { PrismaClient } from "../prisma/generated/client";
import type { Prisma } from "../prisma/generated/client";
import { BaseRepository } from "@buntok/prisma";

interface User {
  id: number;
  name: string;
  email: string;
}

// Simple usage
class UserRepository extends BaseRepository<User, PrismaClient> {
  constructor(prisma: PrismaClient) {
    super(prisma, "user");
  }

  async findByEmail(email: string) {
    return this.delegate.findUnique({ where: { email } });
  }
}

// With hooks
class UserRepository extends BaseRepository<User, PrismaClient, Prisma.UserCreateInput, Prisma.UserUpdateInput> {
  constructor(prisma: PrismaClient) {
    super(prisma, "user");
  }

  protected override async beforeCreate(data: Prisma.UserCreateInput) {
    data.email = data.email.toLowerCase();
    return data;
  }

  protected override async afterCreate(user: User) {
    console.log("User created:", user.id);
  }
}`}
      />

      {/* ──────────────── DRIZZLE ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Drizzle
      </Heading>
      <CodeBlock
        code={`import { drizzle } from "drizzle-orm/bun-sqlite";
import { BaseRepository } from "@buntok/drizzle";
import { users } from "./db/schema";
import type { DrizzleDB } from "./db";

interface CreateUserInput {
  name: string;
  email: string;
}

interface UpdateUserInput {
  name?: string;
  email?: string;
}

class UserRepository extends BaseRepository<typeof users, CreateUserInput, UpdateUserInput, DrizzleDB> {
  constructor(db: DrizzleDB) {
    super(db, users);
  }

  async findWithPosts() {
    return this.db.query.users.findMany({
      with: { posts: true }
    });
  }
}`}
      />

      {/* ──────────────── TYPEORM ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        TypeORM
      </Heading>
      <CodeBlock
        code={`import { DataSource } from "typeorm";
import { BaseRepository } from "@buntok/typeorm";
import { User } from "./entities/user";
import { Post } from "./entities/post";

interface CreateUserInput {
  name: string;
  email: string;
}

interface UpdateUserInput {
  name?: string;
  email?: string;
}

class UserRepository extends BaseRepository<User, CreateUserInput, UpdateUserInput> {
  constructor(dataSource: DataSource) {
    super(dataSource, User);
  }

  async findWithPosts() {
    return this.dataSource.getRepository(User).find({
      relations: ["posts"]
    });
  }
}`}
      />

      {/* ──────────────── FULL STACK ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Full Stack: Auto CRUD
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Combine <code>BaseRepository</code> with <code>BaseController</code> to
        get a complete CRUD API with zero boilerplate.{" "}
        <code>BaseController</code> auto-registers 5 routes:
        <code>GET /</code>, <code>GET /:id</code>, <code>POST /</code>,{" "}
        <code>PUT /:id</code>, <code>DELETE /:id</code>.
      </p>

      <Heading
        level={3}
        className="text-xl font-semibold mt-6 mb-2 text-text-primary"
      >
        Service Layer
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Use <code>BaseService</code> to avoid writing boilerplate. It adapts
        repository method names to match <code>BaseController</code>&apos;s
        expected interface:
      </p>
      <CodeBlock
        code={`import { BaseService } from "@buntok/core/base";
import { UserRepository } from "@/repositories/user.repository";
import type { User } from "@prisma/client";

export class UserService extends BaseService<User> {
  constructor(private readonly userRepository: UserRepository) {
    super(userRepository);
  }
}

// BaseService provides these methods automatically:
// getAll()     → repository.findAll()
// getById(id)  → repository.findById(id) + NotFoundError
// create(data) → repository.create(data)
// update(id, data) → repository.update(id, data)
// delete(id)   → repository.delete(id)
// count()      → repository.count()`}
      />

      <Heading
        level={3}
        className="text-xl font-semibold mt-6 mb-2 text-text-primary"
      >
        Overriding Service Methods
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Override any method to add custom business logic:
      </p>
      <CodeBlock
        code={`import { BaseService } from "@buntok/core/base";
import { NotFoundError } from "@buntok/core/helpers";
import { UserRepository } from "@/repositories/user.repository";
import type { User } from "@prisma/client";

export class UserService extends BaseService<User> {
  constructor(private readonly userRepository: UserRepository) {
    super(userRepository);
  }

  // Override getAll — add filtering, sorting, etc.
  async getAll(): Promise<User[]> {
    const users = await this.userRepository.findAll();
    return users.filter((u) => u.active);
  }

  // Override getById — custom error message
  async getById(id: string | number): Promise<User> {
    const user = await this.userRepository.findById(id);
    if (!user) throw new NotFoundError("User not found");
    return user;
  }

  // Override create — add validation or side effects
  async create(data: any): Promise<User> {
    const existing = await this.userRepository.findByEmail(data.email);
    if (existing) throw new Error("Email already taken");
    return super.create(data);
  }

  // Override delete — soft delete instead of hard delete
  async delete(id: string | number): Promise<User> {
    return this.userRepository.update(id, { deletedAt: new Date() });
  }
}`}
      />

      <Heading
        level={3}
        className="text-xl font-semibold mt-6 mb-2 text-text-primary"
      >
        Controller
      </Heading>
      <CodeBlock
        code={`import { Controller } from "@buntok/core";
import { BaseController } from "@buntok/core/base";

@Controller("/users")
class UserController extends BaseController<User> {
  constructor(private userService: UserService) {
    super(userService);
  }
}

// That's it! These routes are automatically registered:
// GET    /users        → userService.getAll()
// GET    /users/:id    → userService.getById(id)
// POST   /users        → userService.create(body)
// PUT    /users/:id    → userService.update(id, body)
// DELETE /users/:id    → userService.delete(id)`}
      />

      <Heading
        level={3}
        className="text-xl font-semibold mt-6 mb-2 text-text-primary"
      >
        Complete Example (Prisma)
      </Heading>
      <CodeBlock
        code={`import { App } from "@buntok/core";
import { BaseController, BaseService } from "@buntok/core/base";
import { BaseRepository } from "@buntok/prisma";
import { prisma } from "@/lib/prisma";
import type { User, PrismaClient, Prisma } from "@prisma/client";

// 1. Repository - data access
class UserRepository extends BaseRepository<
  User, PrismaClient, Prisma.UserCreateInput, Prisma.UserUpdateInput
> {
  constructor() {
    super(prisma, "user");
  }
}

// 2. Service - business logic
class UserService extends BaseService<User> {
  constructor(private readonly userRepository: UserRepository) {
    super(userRepository);
  }
}

// 3. Controller - auto CRUD routes
@Controller("/users")
class UserController extends BaseController<User> {
  constructor(private readonly userService: UserService) {
    super(userService);
  }
}

// 4. Register
const app = new App();
const userRepository = new UserRepository();
const userService = new UserService(userRepository);
app.registerController(new UserController(userService));
app.listen(1212);`}
      />

      <Callout type="info">
        For complex business logic, skip <code>BaseController</code> and write
        custom controller methods with validation, auth, etc.
      </Callout>

      {/* ──────────────── COMPARISON ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Comparison
      </Heading>
      <div className="my-4 overflow-x-auto">
        <table className="w-full text-sm text-text-secondary border border-border-primary rounded-lg overflow-hidden">
          <thead className="bg-bg-tertiary border-b border-border-primary">
            <tr>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Feature
              </th>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Prisma
              </th>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Drizzle
              </th>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                TypeORM
              </th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-border-primary">
              <td className="px-4 py-2">CRUD methods</td>
              <td className="px-4 py-2 text-center">✅</td>
              <td className="px-4 py-2 text-center">✅</td>
              <td className="px-4 py-2 text-center">✅</td>
            </tr>
            <tr className="border-b border-border-primary">
              <td className="px-4 py-2">Lifecycle hooks</td>
              <td className="px-4 py-2 text-center">✅</td>
              <td className="px-4 py-2 text-center">❌</td>
              <td className="px-4 py-2 text-center">❌</td>
            </tr>
            <tr className="border-b border-border-primary">
              <td className="px-4 py-2">
                <code>$hidden</code> / <code>$visible</code>
              </td>
              <td className="px-4 py-2 text-center">✅</td>
              <td className="px-4 py-2 text-center">✅</td>
              <td className="px-4 py-2 text-center">✅</td>
            </tr>
            <tr className="border-b border-border-primary">
              <td className="px-4 py-2">ORM accessor</td>
              <td className="px-4 py-2 font-mono text-xs">this.delegate</td>
              <td className="px-4 py-2 font-mono text-xs">this.db</td>
              <td className="px-4 py-2 font-mono text-xs">this.dataSource</td>
            </tr>
            <tr className="border-b border-border-primary">
              <td className="px-4 py-2">Multi-table queries</td>
              <td className="px-4 py-2">Via delegate</td>
              <td className="px-4 py-2">Via this.db.query</td>
              <td className="px-4 py-2">Via dataSource.getRepository</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
