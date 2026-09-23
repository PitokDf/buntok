import { Heading } from "@/components/ui/Heading";
import { CodeBlock } from "@/components/ui/CodeBlock";
import { Callout } from "@/components/ui/Callout";

export const metadata = {
  title: "Template Engine",
  description: "Handlebars-like template engine for emails and more. Supports variables, conditionals, loops, partials, and helpers.",
};


export default function TemplatePage() {
  return (
    <div>
      <Heading
        level={1}
        className="text-4xl font-bold mt-8 mb-4 text-text-primary"
      >
        Template Engine
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Built-in Handlebars-like template engine with zero dependencies.
        Perfect for email templates, HTML generation, and more.
      </p>

      {/* ──────────────── QUICK START ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Quick Start
      </Heading>
      <CodeBlock
        code={`import { render } from "@buntok/core";

const html = render("Hello {{ name }}!", { name: "World" });
// → "Hello World!"`}
      />

      {/* ──────────────── VARIABLES ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Variables
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Use <code>{"{{ variable }}"}</code> to interpolate values. Supports
        dot notation for nested objects.
      </p>
      <CodeBlock
        code={`render("Hello {{ name }}!", { name: "Budi" });
// → "Hello Budi!"

render("{{ user.email }}", { user: { email: "budi@example.com" } });
// → "budi@example.com"`}
      />

      <Callout type="info">
        Variables are HTML-escaped by default. Use <code>{"{{{ rawHtml }}}"}</code> for
        unescaped output.
      </Callout>

      {/* ──────────────── RAW HTML ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Raw HTML (Triple Braces)
      </Heading>
      <CodeBlock
        code={`const html = "<b>Bold text</b>";
render("{{{ html }}}", { html });
// → "<b>Bold text</b>" (not escaped)`}
      />

      {/* ──────────────── CONDITIONALS ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Conditionals
      </Heading>
      <CodeBlock
        code={`// Basic if
render("{{#if active}}Active{{/if}}", { active: true });
// → "Active"

// If/else
render("{{#if active}}Yes{{else}}No{{/if}}", { active: false });
// → "No"

// Unless (negative if)
render("{{#unless verified}}Please verify{{/unless}}", { verified: false });
// → "Please verify"`}
      />

      {/* ──────────────── LOOPS ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Loops
      </Heading>
      <CodeBlock
        code={`const items = [{ name: "A" }, { name: "B" }, { name: "C" }];

render("{{#each items}}{{name}} {{/each}}", { items });
// → "A B C "`}
      />

      <Callout type="info">
        Special variables in loops: <code>@index</code> (0-based), <code>@first</code> (boolean), <code>@last</code> (boolean)
      </Callout>

      <CodeBlock
        code={`render("{{#each items}}{{@index}}: {{name}}{{/each}}", {
  items: [{ name: "X" }, { name: "Y" }],
});
// → "0: X1: Y"

render("{{#each items}}{{#if @first}}FIRST{{/if}} {{/each}}", {
  items: ["a", "b", "c"],
});
// → "FIRST   "`}
      />

      {/* ──────────────── PARTIALS ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Partials
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Reusable template fragments. Register once, use anywhere.
      </p>
      <CodeBlock
        code={`import { TemplateEngine } from "@buntok/core";

const engine = new TemplateEngine();

// Register partials
engine.registerPartial("header", "<h1>{{ title }}</h1>");
engine.registerPartial("footer", "<p>© 2024 Company</p>");

// Use in templates
const html = engine.render(\`
  {{> header }}
  <p>Main content</p>
  {{> footer }}
\`, { title: "Welcome" });`}
      />

      {/* ──────────────── HELPERS ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Helpers
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Custom functions for data transformation.
      </p>
      <CodeBlock
        code={`const engine = new TemplateEngine();

engine.registerHelper("formatDate", (date: unknown) => {
  return new Date(date as string).toLocaleDateString("id-ID");
});

engine.registerHelper("uppercase", (str: unknown) => {
  return String(str).toUpperCase();
});

const html = engine.render(
  "{{ uppercase name }} - {{ formatDate date }}",
  { name: "budi", date: "2024-01-15" }
);
// → "BUDI - 15/1/2024"`}
      />

      {/* ──────────────── COMMENTS ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Comments
      </Heading>
      <CodeBlock
        code={`render("Hello {{! this is a comment }}World", {});
// → "Hello World"`}
      />

      {/* ──────────────── STRICT MODE ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Strict Mode & Error Detection
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        By default, missing variables throw an error with helpful suggestions.
      </p>
      <CodeBlock
        code={`render("Hello {{ usre.name }}", { user: { name: "Budi" } });
// → Error: Variable 'usre.name' not found in context.
//   Available keys: user
//   Did you mean: 'user.name'?`}
      />

      <CodeBlock
        code={`// Lenient mode - missing variables become empty string
const engine = new TemplateEngine({ strict: false });
engine.render("Hello {{ missing }}", {});
// → "Hello "`}
      />

      {/* ──────────────── COMPILE ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Compile & Reuse
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Pre-compile templates for better performance when rendering multiple
        times.
      </p>
      <CodeBlock
        code={`const engine = new TemplateEngine();
const compiled = engine.compile("Hello {{ name }}!");

// Reuse without re-parsing
compiled({ name: "A" }); // → "Hello A!"
compiled({ name: "B" }); // → "Hello B!"`}
      />

      {/* ──────────────── EMAIL TEMPLATE EXAMPLE ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Full Email Template Example
      </Heading>
      <CodeBlock
        code={`import { render, TemplateEngine } from "@buntok/core";

const engine = new TemplateEngine();
engine.registerPartial("header", '<div class="header"><h1>{{ company }}</h1></div>');
engine.registerHelper("formatCurrency", (val: unknown) => \`Rp \${Number(val).toLocaleString()}\`);

const template = \`
  {{> header }}
  
  <h1>Invoice #{{ invoice.number }}</h1>
  
  {{#if invoice.paid}}
    <p style="color: green;">✓ Paid</p>
  {{else}}
    <p style="color: red;">Please pay by {{ invoice.dueDate }}</p>
  {{/if}}
  
  {{#each invoice.items}}
    <div>{{ name }} - {{ formatCurrency price }}</div>
  {{/each}}
  
  <p>Total: {{ formatCurrency invoice.total }}</p>
\`;

const html = engine.render(template, {
  company: "My Company",
  invoice: {
    number: "INV-001",
    paid: false,
    dueDate: "2024-02-01",
    items: [
      { name: "Product A", price: 150000 },
      { name: "Product B", price: 250000 },
    ],
    total: 400000,
  },
});`}
      />

      {/* ──────────────── API REFERENCE ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        API Reference
      </Heading>
      <div className="my-4 overflow-x-auto">
        <table className="w-full text-sm text-text-secondary border border-border-primary rounded-lg overflow-hidden">
          <thead className="bg-bg-tertiary border-b border-border-primary">
            <tr>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Function
              </th>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Description
              </th>
            </tr>
          </thead>
          <tbody>
            {[
              ["render(template, context)", "Render a template with context data"],
              ["registerPartial(name, template)", "Register a reusable partial"],
              ["registerHelper(name, fn)", "Register a helper function"],
              ["new TemplateEngine(options)", "Create engine instance with options"],
              ["engine.compile(template)", "Pre-compile template for reuse"],
            ].map(([fn, desc]) => (
              <tr
                key={fn}
                className="border-b border-border-primary/50 hover:bg-bg-tertiary/50 transition-colors"
              >
                <td className="px-4 py-2 font-mono text-accent">{fn}</td>
                <td className="px-4 py-2">{desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
