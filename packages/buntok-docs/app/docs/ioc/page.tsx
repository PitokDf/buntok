import { Heading } from "@/components/ui/Heading";
import { CodeBlock } from "@/components/ui/CodeBlock";
import { Callout } from "@/components/ui/Callout";

export const metadata = {
  title: "IoC Container",
  description: "Manage dependencies with inversion of control and circular dependency detection.",
};


export default function IoCPage() {
  return (
    <div>
      <Heading
        level={1}
        className="text-4xl font-bold mt-8 mb-4 text-text-primary"
      >
        IoC Container
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Built-in dependency injection container with singleton/transient scopes,
        multiple provider types, and circular dependency detection.
      </p>

      {/* ──────────────── QUICK START ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Quick Start
      </Heading>
      <CodeBlock
        code={`import { Buntok, Container, Dependencies, Controller, Get } from "@buntok/core";
import type { Context } from "@buntok/core";

// 1. Define services with @Dependencies
class UserRepository {
  findAll() { return [{ id: 1, name: "John" }]; }
}

@Dependencies(UserRepository)
class UserService {
  constructor(private repo: UserRepository) {}
  getUsers() { return this.repo.findAll(); }
}

// 2. Controller with @Dependencies
@Dependencies(UserService)
@Controller("/users")
class UserController {
  constructor(private service: UserService) {}
  @Get("/")
  list(ctx: Context) { return ctx.json(this.service.getUsers()); }
}

// 3. One line resolves the entire tree
const app = new Buntok();
const container = new Container();
container.scan([UserController]);  // auto-registers all 3
app.setContainer(container);
app.registerController(UserController);
app.listen(1212);`}
      />

      <Callout type="info">
        <code>container.scan()</code> reads tokens from <code>@Dependencies()</code> and registers
        factory providers bottom-up. Controllers without <code>@Dependencies</code> don't need
        to be in <code>scan()</code> - <code>registerController()</code> creates them directly.
      </Callout>

      {/* ──────────────── PROVIDERS ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Providers
      </Heading>
      <div className="my-4 overflow-x-auto">
        <table className="w-full text-sm text-text-secondary border border-border-primary rounded-lg overflow-hidden">
          <thead className="bg-bg-tertiary border-b border-border-primary">
            <tr>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Provider
              </th>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Description
              </th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-border-primary">
              <td className="px-4 py-2 font-mono text-accent">useClass</td>
              <td className="px-4 py-2">Create instance from class constructor</td>
            </tr>
            <tr className="border-b border-border-primary">
              <td className="px-4 py-2 font-mono text-accent">useValue</td>
              <td className="px-4 py-2">Return a static value (always singleton)</td>
            </tr>
            <tr className="border-b border-border-primary">
              <td className="px-4 py-2 font-mono text-accent">useFactory</td>
              <td className="px-4 py-2">
                Create instance from a function (receives container)
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <Heading
        level={3}
        className="text-xl font-semibold mt-6 mb-2 text-text-primary"
      >
        ClassProvider
      </Heading>
      <CodeBlock
        code={`container.register(UserService, {
  useClass: UserService,
  scope: "singleton", // default
});

// Or auto-register by class constructor
container.registerClass(UserService);`}
      />

      <Heading
        level={3}
        className="text-xl font-semibold mt-6 mb-2 text-text-primary"
      >
        ValueProvider
      </Heading>
      <CodeBlock
        code={`container.register("DATABASE_URL", {
  useValue: process.env.DATABASE_URL,
});

// Use string tokens for config values
const url = container.resolve<string>("DATABASE_URL");`}
      />

      <Heading
        level={3}
        className="text-xl font-semibold mt-6 mb-2 text-text-primary"
      >
        FactoryProvider
      </Heading>
      <CodeBlock
        code={`container.register("CacheDriver", {
  useFactory: (container) => {
    const config = container.resolve("Config");
    return new RedisCache(config.redisUrl);
  },
  scope: "singleton",
});`}
      />

      {/* ──────────────── @Dependencies DECORATOR ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        @Dependencies Decorator
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Declare constructor dependencies explicitly for <code>container.scan()</code>.
        Works with TC39 decorators - no <code>emitDecoratorMetadata</code> or <code>reflect-metadata</code> needed.
      </p>
      <CodeBlock
        code={`import { Dependencies } from "@buntok/core";

@Dependencies(UserRepository)
class UserService {
  constructor(private repo: UserRepository) {}
}

@Dependencies(UserService, Logger)
class UserController {
  constructor(private service: UserService, private logger: Logger) {}
}

// Empty @Dependencies = no constructor params
@Dependencies()
class HealthController {
  health() { return { ok: true }; }
}`}
      />

      {/* ──────────────── AUTO-SCAN ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Auto-scan (Recommended)
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Use <code>container.scan()</code> to auto-resolve the full dependency tree.
        Only classes with <code>@Dependencies</code> need to be passed to <code>scan()</code>.
      </p>
      <CodeBlock
        code={`const container = new Container();

// scan() auto-registers all dependencies transitively
container.scan([OrderController]);
// Resolves: OrderController → OrderService → OrderRepo + PaymentGateway

app.setContainer(container);

// Controllers WITHOUT @Dependencies don't need scan()
// registerController() creates them directly
app.registerController(OrderController);
app.registerController(HealthController);  // no DI, works fine`}
      />

      <Callout type="info">
        <code>container.scan()</code> is synchronous. Only controllers with <code>@Dependencies()</code> need
        to be in the scan list. Controllers without constructor dependencies are created directly by <code>registerController()</code>.
      </Callout>

      {/* ──────────────── SCOPES ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Scopes
      </Heading>
      <div className="my-4 overflow-x-auto">
        <table className="w-full text-sm text-text-secondary border border-border-primary rounded-lg overflow-hidden">
          <thead className="bg-bg-tertiary border-b border-border-primary">
            <tr>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Scope
              </th>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Behavior
              </th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-border-primary">
              <td className="px-4 py-2 font-mono text-accent">singleton</td>
              <td className="px-4 py-2">
                One instance, cached and reused (default)
              </td>
            </tr>
            <tr className="border-b border-border-primary">
              <td className="px-4 py-2 font-mono text-accent">transient</td>
              <td className="px-4 py-2">New instance every time it's resolved</td>
            </tr>
          </tbody>
        </table>
      </div>

      <CodeBlock
        code={`// Singleton - same instance returned every time
container.register(UserService, { useClass: UserService, scope: "singleton" });

// Transient - new instance each time
container.register(RequestLogger, { useClass: RequestLogger, scope: "transient" });`}
      />

      {/* ──────────────── DEPRECATED DECORATORS ──────────────── */}
      <Callout type="warning">
        <code>@Injectable</code> &amp; <code>@Inject</code> have been removed.
        Use <code>@Dependencies</code> + <code>container.scan()</code> instead
        (see Quick Start above). Field decorators are no longer supported.
      </Callout>

      {/* ──────────────── CONTAINER API ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Container API
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
            {[
              [
                "container.register(token, provider)",
                "Register a provider for a token",
              ],
              [
                "container.registerClass(cls, scope?)",
                "Auto-register class by constructor",
              ],
              [
                "container.scan(classes[], scope?)",
                "Auto-scan classes via @Dependencies() and register with dependency resolution",
              ],
              [
                "container.resolve<T>(token)",
                "Resolve and return instance (throws if not found)",
              ],
              [
                "container.get<T>(token)",
                "Resolve or return undefined",
              ],
              ["container.has(token)", "Check if token is registered"],
              [
                "container.hasResolved(token)",
                "Check if token is already cached",
              ],
              ["container.clear()", "Clear all providers and cache"],
            ].map(([method, desc]) => (
              <tr
                key={method}
                className="border-b border-border-primary/50 hover:bg-bg-tertiary/50 transition-colors"
              >
                <td className="px-4 py-2 font-mono text-accent text-xs">
                  {method}
                </td>
                <td className="px-4 py-2">{desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ──────────────── CIRCULAR DEPENDENCY ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Circular Dependency Detection
      </Heading>
      <Callout type="warning">
        The container detects circular dependencies and throws an error with the
        class name to help you debug.
      </Callout>

      {/* ──────────────── FULL EXAMPLE ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Full Example: Controller with DI
      </Heading>
      <CodeBlock
        code={`import { Buntok, Container, Dependencies, Controller, Get } from "@buntok/core";
import type { Context } from "@buntok/core";

class UserRepository {
  async findAll() {
    return await db.user.findMany();
  }
  async findById(id: string) {
    return await db.user.findUnique({ where: { id } });
  }
}

@Dependencies(UserRepository)
class UserService {
  constructor(private repo: UserRepository) {}
  getUsers() { return this.repo.findAll(); }
  getUser(id: string) { return this.repo.findById(id); }
}

@Dependencies(UserService)
@Controller("/users")
class UserController {
  constructor(private service: UserService) {}
  @Get("/")
  async list(ctx: Context) {
    const users = await this.service.getUsers();
    return ctx.json(users);
  }
}

// One line resolves everything
const app = new Buntok();
const container = new Container();
container.scan([UserController]);  // auto-registers UserRepository → UserService → UserController
app.setContainer(container);
app.registerController(UserController);
app.listen(1212);`}
      />
    </div>
  );
}
