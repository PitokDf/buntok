import { Heading } from "@/components/ui/Heading";
import { CodeBlock } from "@/components/ui/CodeBlock";
import { Callout } from "@/components/ui/Callout";

export const metadata = {
  title: "Mailer",
  description: "Send emails with Resend, SendGrid, Mailgun, or SMTP providers. Templates, Mailable classes, provider-side templates, attachments, CC/BCC, and inline images.",
};


export default function MailerPage() {
  return (
    <div>
      <Heading
        level={1}
        className="text-4xl font-bold mt-8 mb-4 text-text-primary"
      >
        Mailer
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Email sending with built-in support for Resend, SendGrid, and Mailgun
        (zero-deps HTTP). SMTP via optional <code>nodemailer</code> import.
        Supports attachments, CC/BCC, reply-to, inline images, template-based
        sending, provider-side templates, and Laravel-style Mailable classes.
      </p>

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
                Requires
              </th>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Notes
              </th>
            </tr>
          </thead>
          <tbody>
            {[
              ["resend", "apiKey", "Zero-deps, HTTP-based"],
              ["sendgrid", "apiKey", "Zero-deps, HTTP-based"],
              ["mailgun", "apiKey + domain", "Zero-deps, HTTP-based"],
              ["smtp", "smtp config", "Requires nodemailer (bun add nodemailer)"],
            ].map(([provider, req, notes]) => (
              <tr
                key={provider}
                className="border-b border-border-primary/50 hover:bg-bg-tertiary/50 transition-colors"
              >
                <td className="px-4 py-2 font-mono text-accent">{provider}</td>
                <td className="px-4 py-2 font-mono text-text-secondary">
                  {req}
                </td>
                <td className="px-4 py-2">{notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ──────────────── RESEND EXAMPLE ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Resend
      </Heading>
      <CodeBlock
        code={`import { Mailer } from "@buntok/core";

const mailer = new Mailer({
  provider: "resend",
  apiKey: process.env.RESEND_API_KEY,
});

const result = await mailer.send({
  from: "noreply@example.com",
  to: "user@example.com",
  subject: "Welcome!",
  html: "<h1>Welcome to our platform</h1>",
});

console.log(result); // { success: true, id: "..." }`}
      />

      {/* ──────────────── SENDGRID EXAMPLE ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        SendGrid
      </Heading>
      <CodeBlock
        code={`const mailer = new Mailer({
  provider: "sendgrid",
  apiKey: process.env.SENDGRID_API_KEY,
});

await mailer.send({
  from: "noreply@example.com",
  to: ["user1@example.com", "user2@example.com"],
  subject: "Newsletter",
  text: "Plain text version",
  html: "<p>HTML version</p>",
});`}
      />

      {/* ──────────────── MAILGUN EXAMPLE ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Mailgun
      </Heading>
      <CodeBlock
        code={`const mailer = new Mailer({
  provider: "mailgun",
  apiKey: process.env.MAILGUN_API_KEY,
  domain: "mg.example.com",
});

await mailer.send({
  from: "noreply@mg.example.com",
  to: "user@example.com",
  subject: "Hello",
  html: "<h1>Hello World</h1>",
});`}
      />

      {/* ──────────────── SMTP EXAMPLE ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        SMTP (nodemailer)
      </Heading>
      <Callout type="warning">
        SMTP requires <code>nodemailer</code>:{" "}
        <code>bun add nodemailer</code>
      </Callout>
      <CodeBlock
        code={`const mailer = new Mailer({
  provider: "smtp",
  smtp: {
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  },
});

await mailer.send({
  from: "user@gmail.com",
  to: "recipient@example.com",
  subject: "Hello via SMTP",
  html: "<p>Sent via SMTP</p>",
});`}
      />

      {/* ──────────────── CC & BCC ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        CC & BCC
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Send copies to additional recipients. CC recipients are visible to all;
        BCC recipients are hidden.
      </p>
      <CodeBlock
        code={`await mailer.send({
  from: "noreply@example.com",
  to: "user@example.com",
  cc: "manager@example.com",
  bcc: ["audit@example.com", "logs@example.com"],
  subject: "Invoice #123",
  html: "<p>See attached invoice</p>",
});`}
      />

      {/* ──────────────── REPLY-TO ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Reply-To
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Set a different reply-to address when the sender address is
        no-reply.
      </p>
      <CodeBlock
        code={`await mailer.send({
  from: "noreply@example.com",
  replyTo: "support@example.com",
  to: "user@example.com",
  subject: "Your account",
  html: "<p>Reply to our support team</p>",
});`}
      />

      {/* ──────────────── ATTACHMENTS ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Attachments
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Attach files using Buffer, base64 string, or remote URL (Resend only).
      </p>
      <CodeBlock
        code={`import { readFileSync } from "fs";

// From buffer
const pdfBuffer = readFileSync("./invoice.pdf");
await mailer.send({
  from: "noreply@example.com",
  to: "user@example.com",
  subject: "Your Invoice",
  html: "<p>See attached invoice</p>",
  attachments: [
    {
      filename: "invoice.pdf",
      content: pdfBuffer,
      contentType: "application/pdf",
    },
  ],
});

// From base64 string
await mailer.send({
  from: "noreply@example.com",
  to: "user@example.com",
  subject: "Report",
  html: "<p>See attached report</p>",
  attachments: [
    {
      filename: "report.xlsx",
      content: base64EncodedData,
      contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    },
  ],
});

// From remote URL (Resend only)
await mailer.send({
  from: "noreply@example.com",
  to: "user@example.com",
  subject: "Download",
  html: "<p>Download attached</p>",
  attachments: [
    {
      filename: "document.pdf",
      path: "https://example.com/document.pdf",
    },
  ],
});`}
      />

      {/* ──────────────── INLINE IMAGES ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Inline Images (CID)
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Embed images directly in HTML emails using Content-ID (CID). Reference
        the image in HTML with <code>cid:your-id</code>.
      </p>
      <CodeBlock
        code={`const logoBase64 = readFileSync("./logo.png").toString("base64");

await mailer.send({
  from: "noreply@example.com",
  to: "user@example.com",
  subject: "Welcome!",
  html: \`
    <h1>Welcome!</h1>
    <img src="cid:company-logo" alt="Company Logo" />
    <p>Thank you for joining us.</p>
  \`,
  attachments: [
    {
      filename: "logo.png",
      content: logoBase64,
      contentType: "image/png",
      cid: "company-logo",  // Matches cid: in HTML
    },
  ],
});`}
      />

      {/* ──────────────── TEMPLATE INTEGRATION ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Template Integration
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Use the built-in TemplateEngine to register, render, and send
        Handlebars-like email templates. Templates support variables, conditionals,
        loops, partials, and custom helpers.
      </p>
      <CodeBlock
        code={`import { Mailer } from "@buntok/core";

const mailer = new Mailer({
  provider: "resend",
  apiKey: process.env.RESEND_API_KEY,
});

// Register a template (Handlebars-like syntax)
mailer.registerTemplate("welcome", \`
  <h1>Selamat datang, {{name}}!</h1>
  <p>Email: {{email}}</p>
  <p>Gunakan kode <strong>{{code}}</strong> untuk verifikasi.</p>
\`);

// Register a partial (layout)
mailer.registerPartial("email-layout", \`
  <div style="max-width:600px;margin:0 auto;">
    {{{body}}}
    <hr>
    <p style="font-size:12px;color:#999;">BunTok Framework</p>
  </div>
\`);

// Register a custom helper
mailer.registerHelper("upper", (text) => text.toUpperCase());

// Send with template
await mailer.sendTemplate({
  from: "noreply@example.com",
  to: "user@example.com",
  subject: "Welcome!",
  template: "welcome",
  context: { name: "Tok", email: "tok@example.com", code: "ABC123" },
});`}
      />

      <Heading
        level={3}
        className="text-lg font-semibold mt-6 mb-2 text-text-primary"
      >
        Template Syntax
      </Heading>
      <div className="my-4 overflow-x-auto">
        <table className="w-full text-sm text-text-secondary border border-border-primary rounded-lg overflow-hidden">
          <thead className="bg-bg-tertiary border-b border-border-primary">
            <tr>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Syntax
              </th>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Description
              </th>
            </tr>
          </thead>
          <tbody>
            {[
              ["{{var}}", "Variable (HTML-escaped)"],
              ["{{{var}}}", "Variable (unescaped HTML)"],
              ["{{#if condition}}...{{/if}}", "Conditional block"],
              ["{{#if}}...{{else}}...{{/if}}", "Conditional with else"],
              ["{{#unless condition}}...{{/unless}}", "Inverse conditional"],
              ["{{#each items}}...{{/each}}", "Loop over array"],
              ["{{> partialName}}", "Include a partial"],
              ["{{! comment }}", "Comment (not rendered)"],
            ].map(([syntax, desc]) => (
              <tr
                key={syntax}
                className="border-b border-border-primary/50 hover:bg-bg-tertiary/50 transition-colors"
              >
                <td className="px-4 py-2 font-mono text-accent">{syntax}</td>
                <td className="px-4 py-2">{desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ──────────────── PROVIDER-SIDE TEMPLATES ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Provider-Side Templates
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Use Resend or SendGrid native template systems. Templates are managed
        in the provider&apos;s dashboard and referenced by ID.
      </p>
      <CodeBlock
        code={`// Resend — template UUID from Resend dashboard
await mailer.sendProviderTemplate({
  from: "noreply@example.com",
  to: "user@example.com",
  subject: "Welcome!",
  templateId: "template-uuid-123",
  templateData: {
    name: "Tok",
    action_url: "https://example.com/verify",
  },
});

// SendGrid — template_id from SendGrid dashboard
await mailer.sendProviderTemplate({
  from: "noreply@example.com",
  to: "user@example.com",
  subject: "Welcome!",
  templateId: "d-abc123",
  templateData: {
    name: "Tok",
    action_url: "https://example.com/verify",
  },
});`}
      />
      <Callout type="info">
        Provider-side templates are only supported for Resend and SendGrid.
        Mailgun and SMTP use local template rendering.
      </Callout>

      {/* ──────────────── MAILABLE CLASSES ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Mailable Classes
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Laravel-style class-based email definitions. Extend{" "}
        <code>Mailable</code>, define template/subject, and build context in{" "}
        <code>build()</code>.
      </p>
      <CodeBlock
        code={`import { Mailer, Mailable } from "@buntok/core";

class WelcomeEmail extends Mailable {
  template = "welcome";
  subject = "Welcome to BunTok!";

  constructor(private name: string, private email: string) {
    super();
  }

  build() {
    return { context: { name: this.name, email: this.email } };
  }
}

class PasswordResetEmail extends Mailable {
  template = "password-reset";
  subject = "Reset your password";
  from = "security@example.com";

  constructor(private token: string) {
    super();
  }

  build() {
    return { context: { token: this.token, expires: "30 minutes" } };
  }
}

// Usage
const mailer = new Mailer({ provider: "resend", apiKey: process.env.RESEND_API_KEY });

// Register templates first
mailer.registerTemplate("welcome", "<h1>Halo, {{name}}!</h1><p>{{email}}</p>");
mailer.registerTemplate("password-reset", "<p>Reset link: {{token}}</p>");

await mailer.sendMailable(new WelcomeEmail("Tok", "tok@example.com"));
await mailer.sendMailable(new PasswordResetEmail("abc123"));`}
      />

      <Heading
        level={3}
        className="text-lg font-semibold mt-6 mb-2 text-text-primary"
      >
        Mailable Properties
      </Heading>
      <div className="my-4 overflow-x-auto">
        <table className="w-full text-sm text-text-secondary border border-border-primary rounded-lg overflow-hidden">
          <thead className="bg-bg-tertiary border-b border-border-primary">
            <tr>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Property
              </th>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Description
              </th>
            </tr>
          </thead>
          <tbody>
            {[
              ["template", "Template name (registered via registerTemplate)"],
              ["subject", "Email subject line"],
              ["from", "Override sender address"],
              ["to", "Override recipient"],
              ["cc", "CC recipients"],
              ["bcc", "BCC recipients"],
              ["replyTo", "Reply-To address"],
              ["build()", "Returns { context?, from?, to? }"],
            ].map(([prop, desc]) => (
              <tr
                key={prop}
                className="border-b border-border-primary/50 hover:bg-bg-tertiary/50 transition-colors"
              >
                <td className="px-4 py-2 font-mono text-accent">{prop}</td>
                <td className="px-4 py-2">{desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ──────────────── MAIL OPTIONS ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        MailOptions
      </Heading>
      <div className="my-4 overflow-x-auto">
        <table className="w-full text-sm text-text-secondary border border-border-primary rounded-lg overflow-hidden">
          <thead className="bg-bg-tertiary border-b border-border-primary">
            <tr>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Field
              </th>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Type
              </th>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Required
              </th>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Description
              </th>
            </tr>
          </thead>
          <tbody>
            {[
              ["from", "string", "Yes", "Sender email address"],
              ["to", "string | string[]", "Yes", "Recipient(s)"],
              ["cc", "string | string[]", "No", "Carbon copy recipients"],
              ["bcc", "string | string[]", "No", "Blind carbon copy recipients"],
              ["replyTo", "string | string[]", "No", "Reply-to address"],
              ["subject", "string", "Yes", "Email subject"],
              ["text", "string", "No", "Plain text body"],
              ["html", "string", "No", "HTML body"],
              ["attachments", "MailAttachment[]", "No", "File attachments"],
            ].map(([field, type, req, desc]) => (
              <tr
                key={field}
                className="border-b border-border-primary/50 hover:bg-bg-tertiary/50 transition-colors"
              >
                <td className="px-4 py-2 font-mono text-accent">{field}</td>
                <td className="px-4 py-2 font-mono text-text-secondary">
                  {type}
                </td>
                <td className="px-4 py-2">{req}</td>
                <td className="px-4 py-2">{desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ──────────────── ATTACHMENT OPTIONS ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        MailAttachment
      </Heading>
      <div className="my-4 overflow-x-auto">
        <table className="w-full text-sm text-text-secondary border border-border-primary rounded-lg overflow-hidden">
          <thead className="bg-bg-tertiary border-b border-border-primary">
            <tr>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Field
              </th>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Type
              </th>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Required
              </th>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Description
              </th>
            </tr>
          </thead>
          <tbody>
            {[
              ["filename", "string", "Yes", "Display name for the file"],
              ["content", "Buffer | string", "No*", "File content (Buffer or base64)"],
              ["path", "string", "No*", "Remote URL (Resend only)"],
              ["contentType", "string", "No", "MIME type (auto-inferred if omitted)"],
              ["cid", "string", "No", "Content-ID for inline images"],
            ].map(([field, type, req, desc]) => (
              <tr
                key={field}
                className="border-b border-border-primary/50 hover:bg-bg-tertiary/50 transition-colors"
              >
                <td className="px-4 py-2 font-mono text-accent">{field}</td>
                <td className="px-4 py-2 font-mono text-text-secondary">
                  {type}
                </td>
                <td className="px-4 py-2">{req}</td>
                <td className="px-4 py-2">{desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-sm text-text-secondary">
        * Either <code>content</code> or <code>path</code> is required.
      </p>

      {/* ──────────────── FIRE AND FORGET ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Fire-and-Forget
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Don&apos;t await for non-critical emails - they&apos;ll send in the background:
      </p>
      <CodeBlock
        code={`// Don't await - runs in background
mailer.send({
  from: "noreply@example.com",
  to: user.email,
  subject: "Welcome!",
  html: welcomeTemplate,
});

// Response is instant
return ctx.json({ message: "Account created" });`}
      />
    </div>
  );
}
