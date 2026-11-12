import { Heading } from "@/components/ui/Heading";
import { CodeBlock } from "@/components/ui/CodeBlock";
import { Callout } from "@/components/ui/Callout";

export const metadata = {
  title: "Upgrading to 3.0",
  description: "Migration guide for the breaking changes in @buntok/core 3.0.",
};

export default function UpgradingPage() {
  return (
    <div>
      <Heading
        level={1}
        className="text-4xl font-bold mt-8 mb-4 text-text-primary"
      >
        Upgrading to 3.0
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        3.0 is a security and correctness release. The API surface is mostly
        additive, but several defaults changed to safer values. Work through the
        items below before deploying.
      </p>

      <Callout type="info">
        Upgrade with <code>bun add @buntok/core@3</code>. Buntok now requires
        Bun <code>&gt;=1.2.0</code>.
      </Callout>

      {/* ──────────────── ENCRYPTION ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Encryption no longer takes an IV
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        <code>encrypt()</code> now generates the AES-GCM IV internally. Passing
        a caller-controlled IV made nonce reuse possible, which breaks the
        cipher. Use <code>deriveKey()</code> instead of passing a raw password.
      </p>
      <CodeBlock
        code={`// Before
await encrypt(data, key, iv);

// After
const { ciphertext, iv } = await encrypt(data, key);
const plaintext = await decrypt(ciphertext, key, iv);

// Derive a key from a password (preferred)
const { key, salt, iterations } = await deriveKey(password);`}
      />

      {/* ──────────────── COOKIES ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Cookies default to SameSite=Lax
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        <code>setCookie()</code> now adds <code>SameSite=Lax</code> when no
        policy is provided. If cross-site cookies are required, set
        <code>sameSite: "none"</code> together with <code>secure: true</code> -
        the combination is validated and throws when insecure.
      </p>
      <CodeBlock
        code={`// Cross-site (third-party) cookie
ctx.setCookie("session", token, {
  sameSite: "none",
  secure: true,
  httpOnly: true,
});

// Session cookie for same-site navigation (default)
ctx.setCookie("session", token, { httpOnly: true });`}
      />

      {/* ──────────────── PROXY / IP ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        ctx.ip is the real peer address
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        <code>ctx.ip</code> now comes from <code>server.requestIP()</code>.
        Forwarding headers are ignored unless the peer is trusted.{" "}
        <code>trustedProxy.depth</code> counts trusted hops from the{" "}
        <strong>right</strong> of <code>X-Forwarded-For</code>.
      </p>
      <CodeBlock
        code={`// Behind one trusted reverse proxy
app.setTrustedProxy({ depth: 1 });

// Or trust specific proxy addresses
app.setTrustedProxy({ addresses: ["10.0.0.0/8"] });`}
      />
      <Callout type="warning">
        If you previously relied on <code>ctx.ip</code> reading{" "}
        <code>X-Forwarded-For</code> directly, configure{" "}
        <code>setTrustedProxy()</code> or the value will be the proxy address.
      </Callout>

      {/* ──────────────── TIMEOUT ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Timeouts return 504
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        <code>TimeoutError</code> (from the timeout middleware) is now mapped to{" "}
        <code>504 Gateway Timeout</code> instead of <code>500</code>. Update
        clients or tests that assert on <code>500</code>.
      </p>

      {/* ──────────────── CORS ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        CORS rejects disallowed origins explicitly
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Disallowed origins no longer receive an{" "}
        <code>Access-Control-Allow-Origin</code> header, and preflight requests
        from them return <code>403</code>. <code>credentials: true</code> with a
        wildcard origin logs a warning because browsers reject it.
      </p>
      <CodeBlock
        code={`app.use(cors({
  origin: ["https://app.example.com"],
  credentials: true, // never combine with origin: "*"
}));`}
      />

      {/* ──────────────── API DOCS ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        API docs are disabled in production by default
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        <code>apiDocs.safeOnProduction</code> now defaults to{" "}
        <code>true</code>. To expose docs in production, opt out explicitly.
      </p>
      <CodeBlock
        code={`app.apiDocs({
  path: "/docs",
  title: "My API",
  safeOnProduction: false, // only if you really want public docs
});`}
      />

      {/* ──────────────── STATIC / BODY ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Static dotfiles and body limits
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Static routes deny dotfiles by default, and request bodies are capped at
        4 MB. Enable dotfiles only for directories that need them, and raise the
        body limit when accepting large uploads through route handlers.
      </p>
      <CodeBlock
        code={`app.static("/assets", "./public", { dotfiles: "allow" });

// Default is 4 MB
app.bodyLimit(20 * 1024 * 1024);`}
      />
      <Callout type="info">
        Multipart uploads handled by <code>uploader()</code> keep their own
        per-field limits; the body limit applies to the raw request body.
      </Callout>

      {/* ──────────────── MISC ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Smaller changes
      </Heading>
      <ul className="my-3 list-disc pl-6 space-y-2 text-text-secondary leading-relaxed">
        <li>
          Unsupported methods on a known path return <code>405</code> with an{" "}
          <code>Allow</code> header instead of <code>404</code>.
        </li>
        <li>
          <code>ctx.html()</code> sends <code>text/html; charset=utf-8</code>.
        </li>
        <li>
          The published package ships <code>dist</code>, <code>README.md</code>,
          and <code>scripts/buntok-skill</code> only.
        </li>
        <li>
          Container <code>scan()</code> no longer guesses dependencies for
          classes with constructor parameters but no <code>@Dependencies()</code>.
        </li>
      </ul>

      <Callout type="info">
        Full details are in <code>CHANGELOG.md</code> inside the package.
      </Callout>
    </div>
  );
}
