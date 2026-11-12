const PRIVATE_IP_REGEX =
	/^(10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|127\.|0\.|localhost|::1|fc|fd)/i;

export interface TrustedProxyOptions {
	addresses?: string[];
	depth?: number;
}

/** Minimal structural shape of a Bun `Server` for peer IP resolution. */
export interface ServerLike {
	requestIP(req: Request): { address?: string; port?: number; family?: string } | null;
}

function normalizeIP(ip: string): string {
	return ip.replace(/^::ffff:/i, "").trim().toLowerCase();
}

function ipv4ToNumber(ip: string): number | undefined {
	const parts = ip.split(".");
	if (parts.length !== 4 || parts.some((part) => !/^\d+$/.test(part))) return undefined;
	const octets = parts.map(Number);
	if (octets.some((part) => part < 0 || part > 255)) return undefined;
	const [first, second, third, fourth] = octets;
	if (first === undefined || second === undefined || third === undefined || fourth === undefined) return undefined;
	return (((first * 256 + second) * 256 + third) * 256 + fourth) >>> 0;
}

function matchesProxy(ip: string, configured: string): boolean {
	const normalizedIP = normalizeIP(ip);
	const normalizedConfigured = normalizeIP(configured);
	if (!normalizedConfigured.includes("/")) return normalizedIP === normalizedConfigured;

	const [network, prefixText] = normalizedConfigured.split("/");
	if (!network || !prefixText) return false;
	const value = ipv4ToNumber(normalizedIP);
	const networkValue = ipv4ToNumber(network);
	const prefix = Number(prefixText);
	if (value === undefined || networkValue === undefined || !Number.isInteger(prefix) || prefix < 0 || prefix > 32) return false;
	const mask = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
	return (value & mask) === (networkValue & mask);
}

function getRemoteAddress(
	request: Request,
	server?: ServerLike,
): string | undefined {
	const raw = server?.requestIP(request);
	const fromServer =
		raw === null || raw === undefined
			? undefined
			: typeof raw === "string"
			? raw
			: (raw as { address?: string }).address;
	if (typeof fromServer === "string" && fromServer) return fromServer;
	// Bun exposes remoteAddress on the request.
	// biome-ignore lint/suspicious/noExplicitAny: Bun-specific property
	const remote = (request as any).remoteAddress;
	return typeof remote === "string" && remote ? remote : undefined;
}

/**
 * Get the client IP. Forwarding headers are ignored unless the direct peer is
 * explicitly trusted through addresses or a proxy depth.
 *
 * `depth` counts trusted hops from the right of `X-Forwarded-For`:
 * `depth: 1` means the last entry (appended by the immediate trusted proxy) is
 * the real client. Without `depth`, a trusted peer still trusts the header and
 * reads the last entry as the client.
 */
export function getClientIP(
	request: Request,
	trustedProxy?: TrustedProxyOptions,
	server?: ServerLike,
): string {
	const remote = getRemoteAddress(request, server);
	const addresses = trustedProxy?.addresses ?? [];
	const trustedPeer = remote ? addresses.some((address) => matchesProxy(remote, address)) : false;
	const depth = trustedProxy?.depth;
	const canTrustForwarding = trustedPeer || (depth !== undefined && depth > 0);

	if (canTrustForwarding) {
		const forwarded = request.headers.get("x-forwarded-for");
		const chain = forwarded?.split(",").map((ip) => ip.trim()).filter(Boolean) ?? [];
		if (chain.length) {
			let index: number;
			if (depth !== undefined) {
				index = Math.max(0, chain.length - depth);
			} else if (trustedPeer) {
				index = chain.length - 1;
			} else {
				index = 0;
			}
			const clientIP = chain[index] ?? chain[0];
			if (clientIP) return clientIP;
		}
		const realIP = request.headers.get("x-real-ip")?.trim();
		if (realIP) return realIP;
	}

	return remote ?? "unknown";
}

/**
 * Check if an IP address is a private/reserved address.
 */
export function isPrivateIP(ip: string): boolean {
	return PRIVATE_IP_REGEX.test(ip);
}

interface UserAgentInfo {
	browser: string;
	os: string;
	device: string;
}

const BROWSER_PATTERNS: [RegExp, string][] = [
	[/opr\//i, "Opera"],
	[/edg/i, "Edge"],
	[/chrome/i, "Chrome"],
	[/firefox/i, "Firefox"],
	[/safari/i, "Safari"],
	[/msie|trident/i, "IE"],
];

const OS_PATTERNS: [RegExp, string][] = [
	[/windows/i, "Windows"],
	[/mac os/i, "macOS"],
	[/linux/i, "Linux"],
	[/android/i, "Android"],
	[/iphone|ipad|ipod/i, "iOS"],
	[/cros/i, "Chrome OS"],
	[/winphone/i, "Windows Phone"],
];

const DEVICE_PATTERNS: [RegExp, string][] = [
	[/mobile|android.*mobile|iphone/i, "Mobile"],
	[/ipad|tablet|android(?!.*mobile)/i, "Tablet"],
];

/**
 * Parse the User-Agent header into a simple `{ browser, os, device }` object.
 */
export function parseUserAgent(request: Request): UserAgentInfo {
	const ua = request.headers.get("user-agent") ?? "";

	let browser = "Other";
	for (const [pattern, name] of BROWSER_PATTERNS) {
		if (pattern.test(ua)) {
			browser = name;
			break;
		}
	}

	let os = "Other";
	for (const [pattern, name] of OS_PATTERNS) {
		if (pattern.test(ua)) {
			os = name;
			break;
		}
	}

	let device = "Desktop";
	for (const [pattern, name] of DEVICE_PATTERNS) {
		if (pattern.test(ua)) {
			device = name;
			break;
		}
	}

	return { browser, os, device };
}
