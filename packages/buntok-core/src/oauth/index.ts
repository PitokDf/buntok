// ─── Types ────────────────────────────────────────────────────────────────────
export type {
  OAuth2Tokens,
  OAuthUser,
  OAuthProviderConfig,
  OAuthProvider,
  CreateAuthorizationURLOptions,
  ValidateAuthorizationCodeOptions,
  AppleProviderConfig,
} from "./types";

export {
  OAuthError,
  OAuthStateError,
  OAuthTokenError,
  OAuthProviderError,
} from "./types";

// ─── PKCE ─────────────────────────────────────────────────────────────────────
export {
  generateCodeVerifier,
  generateCodeChallenge,
  generatePKCE,
} from "./pkce";

// ─── State Management ─────────────────────────────────────────────────────────
export {
  storeOAuthState,
  verifyOAuthState,
  getCodeVerifier,
  clearOAuthCookies,
} from "./state";

// ─── Base Provider ────────────────────────────────────────────────────────────
export { BaseOAuthProvider } from "./provider";

// ─── Generic Helpers ──────────────────────────────────────────────────────────
export {
  createOAuth2AuthorizationURL,
  validateOAuth2AuthorizationCode,
  decodeIdToken,
} from "./helpers";

// ─── Built-in Providers ───────────────────────────────────────────────────────
export { GoogleProvider, type GoogleUser } from "./providers/google";
export { GitHubProvider, type GitHubUser } from "./providers/github";
export { AppleProvider, type AppleUser } from "./providers/apple";

// ─── Convenience Factory ──────────────────────────────────────────────────────
import type { OAuthProviderConfig, AppleProviderConfig } from "./types";
import { GoogleProvider } from "./providers/google";
import { GitHubProvider } from "./providers/github";
import { AppleProvider } from "./providers/apple";

/**
 * Create OAuth providers with a simple factory API
 *
 * @example
 * ```ts
 * import { createOAuth } from "@buntok/core";
 *
 * const google = createOAuth.google({
 *   clientId: process.env.GOOGLE_CLIENT_ID!,
 *   clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
 *   redirectURI: "http://localhost:1212/auth/google/callback",
 * });
 * ```
 */
export const createOAuth = {
  google: (config: OAuthProviderConfig) => new GoogleProvider(config),
  github: (config: OAuthProviderConfig) => new GitHubProvider(config),
  apple: (config: AppleProviderConfig) => new AppleProvider(config),
};
