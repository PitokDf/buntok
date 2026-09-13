// ─── OAuth System ──────────────────────────────────────────────────────────────
// Import via: import { ... } from "@buntok/core/oauth"

export {
	BaseOAuthProvider,
	clearOAuthCookies,
	createOAuth,
	createOAuth2AuthorizationURL,
	decodeIdToken,
	generateCodeChallenge,
	generateCodeVerifier,
	generatePKCE,
	getCodeVerifier,
	OAuthError,
	OAuthProviderError,
	OAuthStateError,
	OAuthTokenError,
	storeOAuthState,
	validateOAuth2AuthorizationCode,
	verifyOAuthState,
} from "./oauth";
export type {
	AppleProviderConfig,
	CreateAuthorizationURLOptions,
	OAuth2Tokens,
	OAuthProvider,
	OAuthProviderConfig,
	OAuthUser,
	ValidateAuthorizationCodeOptions,
} from "./oauth";
export { AppleProvider, type AppleUser } from "./oauth";
export { GitHubProvider, type GitHubUser } from "./oauth";
export { GoogleProvider, type GoogleUser } from "./oauth";
