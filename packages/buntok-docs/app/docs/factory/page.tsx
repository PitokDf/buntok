import { Heading } from "@/components/ui/Heading";
import { CodeBlock } from "@/components/ui/CodeBlock";
import { Callout } from "@/components/ui/Callout";

export const metadata = {
  title: "Factory",
  description:
    "Type-safe data factories for generating test and seed data with @faker-js/faker.",
};

export default function FactoryPage() {
  return (
    <div>
      <Heading
        level={1}
        className="text-4xl font-bold mt-8 mb-4 text-text-primary"
      >
        Factory
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Type-safe data factories for generating test and seed data. Factories
        provide a clean, reusable way to create test data with sensible defaults
        and easy overrides.
      </p>

      {/* ──────────────── INSTALLATION ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Installation
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        <code>@faker-js/faker</code> is an optional peer dependency for
        generating realistic fake data:
      </p>
      <CodeBlock code={`bun add -d @faker-js/faker`} />

      {/* ──────────────── QUICK START ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Quick Start
      </Heading>
      <CodeBlock code={`bunx buntok make:factory user`} />
      <p className="my-3 text-text-secondary leading-relaxed">
        The CLI creates a Prisma-oriented scaffold. Replace its placeholder
        definition with the fields required by your model before compiling it.
      </p>
      <CodeBlock
        code={`// src/factories/user.factory.ts
import { Factory } from "@buntok/core";
import { faker } from "@faker-js/faker";
import type { User } from "@prisma/client";

export const UserFactory = Factory.define<User>(() => ({
  id: faker.number.int({ max: 10000 }),
  name: faker.person.fullName(),
  email: faker.internet.email(),
  role: faker.helpers.arrayElement(["user", "admin"]),
}));`}
      />

      {/* ──────────────── BASIC USAGE ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Basic Usage
      </Heading>
      <CodeBlock
        code={`import { UserFactory } from "@/factories/user.factory";

// Create one item
const user = await UserFactory.create();
// → { id: 1234, name: "John Doe", email: "john@example.com", role: "user" }

// Create many items
const users = await UserFactory.createMany(10);
// → array of 10 users

// Override fields per-call
const admin = await UserFactory.create({ role: "admin" });
// → { id: 5678, name: "Jane Smith", email: "jane@example.com", role: "admin" }`}
      />

      {/* ──────────────── SYNC BUILD ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Sync Build
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Use <code>build()</code> for synchronous generation without the{" "}
        <code>afterCreate</code> hook:
      </p>
      <CodeBlock
        code={`// Synchronous (no afterCreate hook)
const user = UserFactory.build({ name: "John" });
const users = UserFactory.buildMany(5);`}
      />

      {/* ──────────────── DEFAULTS ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Default Overrides
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Set defaults that apply to all created items:
      </p>
      <CodeBlock
        code={`const UserFactory = Factory.define<User>(() => ({
  id: faker.number.int({ max: 10000 }),
  name: faker.person.fullName(),
  email: faker.internet.email(),
  role: faker.helpers.arrayElement(["user", "admin"]),
})).withDefaults({ role: "user" });

// All created items will have role: "user" unless overridden
const user = await UserFactory.create();  // role: "user"
const admin = await UserFactory.create({ role: "admin" });  // role: "admin"`}
      />

      {/* ──────────────── AFTER CREATE ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        After Create Hook
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Run custom logic after each item is created (useful for database
        inserts, audit logs, etc.):
      </p>
      <CodeBlock
        code={`const UserFactory = Factory.define<User>(() => ({
  id: faker.number.int({ max: 10000 }),
  name: faker.person.fullName(),
  email: faker.internet.email(),
  role: faker.helpers.arrayElement(["user", "admin"]),
})).afterCreate(async (user) => {
  await db.auditLog.create({
    data: { userId: user.id, action: "created" }
  });
});`}
      />

      {/* ──────────────── RELATIONS ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Relations
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Use <code>Factory.ref()</code> for lazy references to other factories:
      </p>
      <CodeBlock
        code={`const UserFactory = Factory.define<User>(() => ({
  id: faker.number.int(),
  name: faker.person.fullName(),
}));

const PostFactory = Factory.define(() => ({
  id: faker.number.int(),
  title: faker.lorem.sentence(),
  userId: Factory.ref(() => UserFactory.build().id),
}));

// Each post gets a fresh user ID
const posts = await PostFactory.createMany(5);`}
      />

      {/* ──────────────── RANDOM PICK ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Random Pick
      </Heading>
      <CodeBlock
        code={`// Pick one random item
const status = Factory.pick(["draft", "published", "archived"]);
// → "published"

// Pick multiple random items
const tags = Factory.pick(["typescript", "bun", "api", "testing"], 2);
// → ["api", "typescript"]`}
      />

      {/* ──────────────── WITH SEEDERS ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Using with Seeders
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Generate seeders that use factories with the <code>--factory</code>{" "}
        flag:
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

      {/* ──────────────── API REFERENCE ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        API Reference
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
                Generate one item synchronously (no afterCreate)
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
                Set default overrides for all created items
              </td>
            </tr>
            <tr>
              <td className="border border-border-primary px-4 py-2 text-text-secondary">
                <code>.afterCreate(callback)</code>
              </td>
              <td className="border border-border-primary px-4 py-2 text-text-secondary">
                Register post-creation hook (async supported)
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
        Factories are designed for test and seed data generation. For production
        data, use your ORM's create methods directly.
      </Callout>
    </div>
  );
}
