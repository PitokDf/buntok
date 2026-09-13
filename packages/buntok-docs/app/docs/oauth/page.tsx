import type { Metadata } from "next";
import { Heading } from "@/components/ui/Heading";
import { CodeBlock } from "@/components/ui/CodeBlock";
import { Callout } from "@/components/ui/Callout";

export const metadata: Metadata = {
  title: "OAuth Social Login - Buntok Docs",
  description:
    "OAuth 2.0 social login with Google, GitHub, Apple, and custom providers using PKCE and state management.",
};

export default function OAuthPage() {
  return (
    <div>
      <Heading level={1}>OAuth Social Login</Heading>
      <p className="text-text-secondary mb-4">
        Buntok provides built-in OAuth 2.0 support for social login with
        Google, GitHub, and Apple. It handles PKCE, state management, and cookie
        cleanup automatically.
      </p>

      <Callout type="info">
        All providers use the Authorization Code Flow with PKCE (RFC 7636) - the
        recommended flow for 2026+.
      </Callout>

      <Heading level={2} className="mt-8 mb-3">
        Quick Start
      </Heading>

      <CodeBlock
        code={`import { createOAuth } from "@buntok/core/oauth";

const google = createOAuth.google({
  clientId: process.env.GOOGLE_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  redirectURI: "http://localhost:1212/auth/google/callback",
});`}
      />

      <Heading level={2} className="mt-8 mb-3">
        Start OAuth Flow
      </Heading>
      <p className="text-text-secondary mb-4">
        Generate a state + PKCE code verifier, store them in cookies, and
        redirect the user to the provider.
      </p>

      <CodeBlock
        code={`import { createOAuth, generateCodeVerifier, generateCodeChallenge,
  storeOAuthState } from "@buntok/core/oauth";

const google = createOAuth.google({ ... });

app.get("/auth/google", async (ctx) => {
  const state = crypto.randomUUID();
  const codeVerifier = generateCodeVerifier();
  const url = await google.createAuthorizationURL(state, codeVerifier);

  // Framework handles state + codeVerifier storage in HttpOnly cookies
  let response = ctx.redirect(url);
  response = storeOAuthState(response, state, codeVerifier);
  return response;
});`}
      />

      <Heading level={2} className="mt-8 mb-3">
        Handle Callback
      </Heading>
      <p className="text-text-secondary mb-4">
        Verify the state, exchange the code for tokens, and get user info.
        Cookies are cleaned up automatically.
      </p>

      <CodeBlock
        code={`import { createOAuth, verifyOAuthState, getCodeVerifier,
  clearOAuthCookies } from "@buntok/core/oauth";

app.get("/auth/google/callback", async (ctx) => {
  const code = ctx.query.code;
  const state = ctx.query.state;

  // Verify state (CSRF protection)
  if (!verifyOAuthState(ctx.request, state)) {
    return ctx.json({ error: "Invalid state" }, 400);
  }

  // Get code verifier from cookie
  const codeVerifier = getCodeVerifier(ctx.request)!;

  // Exchange code for tokens
  const tokens = await google.validateAuthorizationCode(
    code, "http://localhost:1212/auth/google/callback", codeVerifier
  );

  // Get user info
  const user = await google.getUserInfo(tokens);

  // Create/find user in your database, issue JWT, etc.

  // Clean up OAuth cookies (automatic)
  let response = ctx.json({ user });
  response = clearOAuthCookies(response);
  return response;
});`}
      />

      <Heading level={2} className="mt-8 mb-3">
        Built-in Providers
      </Heading>

      <div className="my-4 overflow-x-auto">
        <table className="w-full text-sm text-text-secondary border border-border-primary rounded-lg overflow-hidden">
          <thead className="bg-bg-tertiary border-b border-border-primary">
            <tr>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Provider
              </th>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Type
              </th>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                PKCE
              </th>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                User ID
              </th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-border-primary">
              <td className="px-4 py-2">Google</td>
              <td className="px-4 py-2">OIDC</td>
              <td className="px-4 py-2">✅</td>
              <td className="px-4 py-2">
                <code>sub</code>
              </td>
            </tr>
            <tr className="border-b border-border-primary">
              <td className="px-4 py-2">GitHub</td>
              <td className="px-4 py-2">OAuth2</td>
              <td className="px-4 py-2">❌</td>
              <td className="px-4 py-2">
                <code>id</code>
              </td>
            </tr>
            <tr>
              <td className="px-4 py-2">Apple</td>
              <td className="px-4 py-2">OIDC</td>
              <td className="px-4 py-2">✅</td>
              <td className="px-4 py-2">
                <code>sub</code>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <Heading level={3} className="mt-6 mb-2">
        Google Setup
      </Heading>
      <ol className="my-3 ml-6 list-decimal text-text-secondary space-y-2">
        <li>
          Go to{" "}
          <a
            href="https://console.cloud.google.com/apis/credentials"
            className="text-accent hover:underline"
          >
            Google Cloud Console
          </a>
        </li>
        <li>Create OAuth 2.0 Client ID (Web application type)</li>
        <li>
          Add authorized redirect URI:{" "}
          <code>http://localhost:1212/auth/google/callback</code>
        </li>
        <li>Copy Client ID and Client Secret</li>
      </ol>

      <CodeBlock
        code={`# .env
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret`}
      />

      <Heading level={3} className="mt-6 mb-2">
        GitHub Setup
      </Heading>
      <ol className="my-3 ml-6 list-decimal text-text-secondary space-y-2">
        <li>
          Go to{" "}
          <a
            href="https://github.com/settings/developers"
            className="text-accent hover:underline"
          >
            GitHub Developer Settings
          </a>
        </li>
        <li>Create new OAuth App</li>
        <li>
          Set Authorization callback URL:{" "}
          <code>http://localhost:1212/auth/github/callback</code>
        </li>
        <li>Copy Client ID and Client Secret</li>
      </ol>

      <CodeBlock
        code={`# .env
GITHUB_CLIENT_ID=your_client_id
GITHUB_CLIENT_SECRET=your_client_secret`}
      />

      <Callout type="warning">
        GitHub does not guarantee email in the basic profile scope. Use the
        <code>user:email</code> scope and the provider will automatically fetch
        emails from the <code>/user/emails</code> endpoint.
      </Callout>

      <Heading level={3} className="mt-6 mb-2">
        Apple Setup
      </Heading>
      <ol className="my-3 ml-6 list-decimal text-text-secondary space-y-2">
        <li>
          Go to{" "}
          <a
            href="https://developer.apple.com/account/resources/identifiers/list"
            className="text-accent hover:underline"
          >
            Apple Developer Console
          </a>
        </li>
        <li>Create an App ID with Sign in with Apple enabled</li>
        <li>Create a Services ID and configure Sign in with Apple</li>
        <li>Create a key with Sign in with Apple enabled</li>
        <li>Download the private key (.p8 file)</li>
        <li>
          Set authorized redirect URI:{" "}
          <code>http://localhost:1212/auth/apple/callback</code>
        </li>
      </ol>

      <CodeBlock
        code={`# .env
APPLE_CLIENT_ID=your_services_id
APPLE_TEAM_ID=your_team_id
APPLE_KEY_ID=your_key_id
APPLE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----`}
      />

      <Callout type="warning">
        Apple only sends the user&apos;s name on the <strong>first</strong>
        authentication. Store it if you receive it - you won&apos;t get it again
        unless the user revokes and re-authorizes.
      </Callout>

      <Heading level={2} className="mt-8 mb-3">
        Error Handling
      </Heading>
      <p className="text-text-secondary mb-4">
        Buntok provides specific error classes for OAuth failures:
      </p>

      <div className="my-4 overflow-x-auto">
        <table className="w-full text-sm text-text-secondary border border-border-primary rounded-lg overflow-hidden">
          <thead className="bg-bg-tertiary border-b border-border-primary">
            <tr>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Error
              </th>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Cause
              </th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-border-primary">
              <td className="px-4 py-2">
                <code>OAuthStateError</code>
              </td>
              <td className="px-4 py-2">
                State mismatch - possible CSRF attack
              </td>
            </tr>
            <tr className="border-b border-border-primary">
              <td className="px-4 py-2">
                <code>OAuthTokenError</code>
              </td>
              <td className="px-4 py-2">
                Token exchange failed (code expired, invalid, etc.)
              </td>
            </tr>
            <tr>
              <td className="px-4 py-2">
                <code>OAuthProviderError</code>
              </td>
              <td className="px-4 py-2">
                Provider returned an error (invalid_client, access_denied, etc.)
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <CodeBlock
        code={`import { OAuthStateError, OAuthTokenError, OAuthProviderError } from "@buntok/core/oauth";

try {
  const tokens = await google.validateAuthorizationCode(code, redirectURI, codeVerifier);
  const user = await google.getUserInfo(tokens);
} catch (error) {
  if (error instanceof OAuthStateError) {
    return ctx.json({ error: "Invalid state" }, 400);
  }
  if (error instanceof OAuthTokenError) {
    return ctx.json({ error: "Token exchange failed" }, 400);
  }
  if (error instanceof OAuthProviderError) {
    return ctx.json({ error: error.providerErrorDescription }, 400);
  }
  throw error;
}`}
      />

      <Heading level={2} className="mt-8 mb-3">
        Custom Providers
      </Heading>
      <p className="text-text-secondary mb-4">
        For providers not built-in, use the generic OAuth helpers:
      </p>

      <CodeBlock
        code={`import { createOAuth2AuthorizationURL, validateOAuth2AuthorizationCode,
  generateCodeVerifier, generateCodeChallenge, storeOAuthState,
  verifyOAuthState, getCodeVerifier, clearOAuthCookies } from "@buntok/core/oauth";

// Discord (not OIDC - uses OAuth2)
const DISCORD_AUTH = "https://discord.com/api/oauth2/authorize";
const DISCORD_TOKEN = "https://discord.com/api/oauth2/token";
const DISCORD_USER = "https://discord.com/api/users/@me";

app.get("/auth/discord", async (ctx) => {
  const state = crypto.randomUUID();
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);

  const url = await createOAuth2AuthorizationURL(DISCORD_AUTH, {
    clientId: process.env.DISCORD_CLIENT_ID!,
    redirectURI: "http://localhost:1212/auth/discord/callback",
    scopes: ["identify", "email"],
    state,
    codeChallenge,
  });

  let response = ctx.redirect(url);
  response = storeOAuthState(response, state, codeVerifier);
  return response;
});

app.get("/auth/discord/callback", async (ctx) => {
  const code = ctx.query.code;
  const state = ctx.query.state;

  if (!verifyOAuthState(ctx.request, state)) {
    return ctx.json({ error: "Invalid state" }, 400);
  }

  const codeVerifier = getCodeVerifier(ctx.request)!;

  const tokens = await validateOAuth2AuthorizationCode({
    code,
    redirectURI: "http://localhost:1212/auth/discord/callback",
    clientId: process.env.DISCORD_CLIENT_ID!,
    clientSecret: process.env.DISCORD_CLIENT_SECRET!,
    codeVerifier,
    tokenEndpoint: DISCORD_TOKEN,
  });

  // Fetch user from provider API
  const userRes = await fetch(DISCORD_USER, {
    headers: { Authorization: \`Bearer \${tokens.accessToken}\` },
  });
  const discordUser = await userRes.json();

  let response = ctx.json({ user: discordUser });
  response = clearOAuthCookies(response);
  return response;
});`}
      />

      <Heading level={2} className="mt-8 mb-3">
        User Info Interface
      </Heading>
      <p className="text-text-secondary mb-4">
        All providers return a flexible <code>OAuthUser</code> object:
      </p>

      <CodeBlock
        code={`interface OAuthUser {
  id: string;           // Unique, stable identifier (sub claim)
  name?: string;
  email?: string;
  emailVerified?: boolean;
  image?: string;
  [key: string]: unknown;  // Provider-specific fields
}`}
      />

      <p className="text-text-secondary mb-4">
        Always use <code>id</code> (the <code>sub</code> claim) as the primary
        user identifier - not email, which can change.
      </p>

      <Heading level={2} className="mt-8 mb-3">
        Extend a Provider
      </Heading>
      <p className="text-text-secondary mb-4">
        Extend <code>BaseOAuthProvider</code> to add custom providers:
      </p>

      <CodeBlock
        code={`import { BaseOAuthProvider, createOAuth2AuthorizationURL,
  generateCodeChallenge } from "@buntok/core/oauth";
import type { OAuth2Tokens, OAuthUser } from "@buntok/core/oauth";

class SpotifyProvider extends BaseOAuthProvider {
  override readonly id = "spotify";

  override async createAuthorizationURL(state: string, codeVerifier: string): Promise<string> {
    const codeChallenge = await generateCodeChallenge(codeVerifier);
    return createOAuth2AuthorizationURL(
      "https://accounts.spotify.com/authorize",
      {
        clientId: this.config.clientId,
        redirectURI: this.config.redirectURI,
        scopes: this.config.scopes,
        state,
        codeChallenge,
      }
    );
  }

  override async validateAuthorizationCode(
    code: string, redirectURI: string, codeVerifier?: string
  ): Promise<OAuth2Tokens> {
    // ... implement token exchange
  }

  override async getUserInfo(tokens: OAuth2Tokens): Promise<OAuthUser> {
    // ... implement user info fetch
  }
}`}
      />

      <Heading level={2} className="mt-8 mb-3">
        Security Best Practices
      </Heading>
      <ul className="my-3 ml-6 list-disc text-text-secondary space-y-1">
        <li>Always use PKCE (S256 method)</li>
        <li>Validate state parameter to prevent CSRF</li>
        <li>
          Use <code>sub</code> claim as user ID (not email)
        </li>
        <li>Store tokens encrypted if needed for API access</li>
        <li>Use exact redirect URI matching</li>
        <li>Never expose tokens in URLs</li>
        <li>Verify ID tokens server-side</li>
      </ul>
    </div>
  );
}
