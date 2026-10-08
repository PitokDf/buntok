const ENCODER = new TextEncoder();
const DECODER = new TextDecoder();

function toBuffer(
	data: string | ArrayBuffer | Uint8Array,
): Uint8Array<ArrayBuffer> {
	if (typeof data === "string") return ENCODER.encode(data);
	if (data instanceof ArrayBuffer) return new Uint8Array(data);
	return new Uint8Array(
		data.buffer as ArrayBuffer,
		data.byteOffset,
		data.byteLength,
	);
}

function toHex(buffer: Uint8Array): string {
	return [...buffer].map((b) => b.toString(16).padStart(2, "0")).join("");
}

// ── Hash ─────────────────────────────────────────────────────────────

export function hash(
	data: string | ArrayBuffer | Uint8Array,
	algorithm: "SHA-1" | "SHA-256" | "SHA-384" | "SHA-512" = "SHA-256",
): string {
	const algo = algorithm.toLowerCase().replace("-", "") as
		| "sha1"
		| "sha256"
		| "sha384"
		| "sha512";
	const hasher = new Bun.CryptoHasher(algo);
	hasher.update(toBuffer(data));
	return hasher.digest("hex");
}

/**
 * Fast non-cryptographic hash using Bun's native wyhash.
 * Intended for cache keys, deduplication, hash maps - NOT for security.
 * Much faster than SHA/MD5 for non-security use cases.
 *
 * @example
 * ```ts
 * const cacheKey = fastHash("user:123");
 * const dedupKey = fastHash({ endpoint: "/api/users", params: { id: 1 } });
 * ```
 */
export function fastHash(
	data: string | ArrayBuffer | Uint8Array | object,
): string {
	const input =
		typeof data === "object" && !(data instanceof ArrayBuffer) && !(data instanceof Uint8Array)
			? JSON.stringify(data)
			: data;
	return Bun.hash(toBuffer(input as string | ArrayBuffer | Uint8Array)).toString(16);
}

export function sha256(data: string | ArrayBuffer | Uint8Array): string {
	return hash(data, "SHA-256");
}

export function sha512(data: string | ArrayBuffer | Uint8Array): string {
	return hash(data, "SHA-512");
}

/**
 * MD5 hash - uses a pure JS implementation since WebCrypto doesn't support MD5.
 * Intended for legacy compatibility and cache keys, NOT for security.
 */
export async function md5(
	data: string | ArrayBuffer | Uint8Array,
): Promise<string> {
	const buf = toBuffer(data);
	const T = [
		0xd76aa478, 0xe8c7b756, 0x242070db, 0xc1bdceee, 0xf57c0faf, 0x4787c62a,
		0xa8304613, 0xfd469501, 0x698098d8, 0x8b44f7af, 0xffff5bb1, 0x895cd7be,
		0x6b901122, 0xfd987193, 0xa679438e, 0x49b40821, 0xf61e2562, 0xc040b340,
		0x265e5a51, 0xe9b6c7aa, 0xd62f105d, 0x02441453, 0xd8a1e681, 0xe7d3fbc8,
		0x21e1cde6, 0xc33707d6, 0xf4d50d87, 0x455a14ed, 0xa9e3e905, 0xfcefa3f8,
		0x676f02d9, 0x8d2a4c8a, 0xfffa3942, 0x8771f681, 0x6d9d6122, 0xfde5380c,
		0xa4beea44, 0x4bdecfa9, 0xf6bb4b60, 0xbebfbc70, 0x289b7ec6, 0xeaa127fa,
		0xd4ef3085, 0x04881d05, 0xd9d4d039, 0xe6db99e5, 0x1fa27cf8, 0xc4ac5665,
		0xf4292244, 0x432aff97, 0xab9423a7, 0xfc93a039, 0x655b59c3, 0x8f0ccc92,
		0xffeff47d, 0x85845dd1, 0x6fa87e4f, 0xfe2ce6e0, 0xa3014314, 0x4e0811a1,
		0xf7537e82, 0xbd3af235, 0x2ad7d2bb, 0xeb86d391,
	];
	const S = [
		7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 5, 9, 14, 20, 5,
		9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11,
		16, 23, 4, 11, 16, 23, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10,
		15, 21,
	];

	const msg = new Uint8Array((((buf.length + 8) >>> 6) + 1) << 6);
	msg.set(buf);
	msg[buf.length] = 0x80;
	const msgBuffer = msg.buffer as ArrayBuffer;
	const view = new DataView(msgBuffer);
	view.setUint32(msg.length - 8, buf.length * 8, true);
	view.setUint32(msg.length - 4, 0, true);

	let [a0, b0, c0, d0] = [0x67452301, 0xefcdab89, 0x98badcfe, 0x10325476];

	for (let i = 0; i < msg.length; i += 64) {
		const M = new Array<number>(16).fill(0);
		for (let j = 0; j < 16; j++) M[j] = view.getUint32(i + j * 4, true);

		let [A, B, C, D] = [a0, b0, c0, d0];
		let g = 0;

		for (let j = 0; j < 64; j++) {
			let F: number;
			if (j < 16) {
				F = (B & C) | (~B & D);
				g = j;
			} else if (j < 32) {
				F = (D & B) | (~D & C);
				g = (5 * j + 1) % 16;
			} else if (j < 48) {
				F = B ^ C ^ D;
				g = (3 * j + 5) % 16;
			} else {
				F = C ^ (B | ~D);
				g = (7 * j) % 16;
			}
			F = (F + A + T[j]! + M[g]!) | 0;
			A = D;
			D = C;
			C = B;
			B = (B + ((F << S[j]!) | (F >>> (32 - S[j]!)))) | 0;
		}

		a0 = (a0 + A) | 0;
		b0 = (b0 + B) | 0;
		c0 = (c0 + C) | 0;
		d0 = (d0 + D) | 0;
	}

	const result = new Uint8Array(16);
	const rView = new DataView(result.buffer as ArrayBuffer);
	rView.setUint32(0, a0, true);
	rView.setUint32(4, b0, true);
	rView.setUint32(8, c0, true);
	rView.setUint32(12, d0, true);
	return toHex(result);
}

// ── HMAC ─────────────────────────────────────────────────────────────

export async function hmac(
	data: string | ArrayBuffer | Uint8Array,
	key: string | ArrayBuffer | Uint8Array,
	algorithm: "SHA-1" | "SHA-256" | "SHA-384" | "SHA-512" = "SHA-256",
): Promise<string> {
	const cryptoKey = await crypto.subtle.importKey(
		"raw",
		toBuffer(key),
		{ name: "HMAC", hash: algorithm },
		false,
		["sign"],
	);
	const signature = await crypto.subtle.sign("HMAC", cryptoKey, toBuffer(data));
	return toHex(new Uint8Array(signature));
}

export async function hashVerify(
	data: string | ArrayBuffer | Uint8Array,
	expected: string,
	algorithm: "SHA-1" | "SHA-256" | "SHA-384" | "SHA-512" = "SHA-256",
): Promise<boolean> {
	const actual = hash(data, algorithm);
	if (actual.length !== expected.length) return false;
	let result = 0;
	for (let i = 0; i < actual.length; i++) {
		result |= actual.charCodeAt(i) ^ expected.charCodeAt(i);
	}
	return result === 0;
}

// ── Random ───────────────────────────────────────────────────────────

export function randomBytes(length: number): Uint8Array {
	return crypto.getRandomValues(new Uint8Array(length));
}

export function randomHex(length: number): string {
	return toHex(randomBytes(Math.ceil(length / 2))).slice(0, length);
}

const ALPHA_NUM =
	"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

export function randomAlphaNumeric(length: number): string {
	const bytes = randomBytes(length);
	return Array.from(bytes, (b) => ALPHA_NUM[b % ALPHA_NUM.length]).join("");
}

export function randomToken(length = 32): string {
	const bytes = randomBytes(length);
	return btoa(String.fromCharCode(...bytes))
		.replace(/\+/g, "-")
		.replace(/\//g, "_")
		.replace(/=+$/, "");
}

// ── Encrypt / Decrypt (AES-256-GCM) ─────────────────────────────────

async function importAesKey(
	key: string | ArrayBuffer | Uint8Array,
): Promise<CryptoKey> {
	const keyData = typeof key === "string" ? ENCODER.encode(key) : toBuffer(key);
	const rawKey =
		keyData.length === 32
			? keyData
			: new Uint8Array(await crypto.subtle.digest("SHA-256", keyData));
	return crypto.subtle.importKey("raw", rawKey, "AES-GCM", false, [
		"encrypt",
		"decrypt",
	]);
}

export async function encrypt(
	data: string | ArrayBuffer | Uint8Array,
	key: string | ArrayBuffer | Uint8Array,
	iv?: Uint8Array,
): Promise<{ ciphertext: string; iv: string }> {
	const cryptoKey = await importAesKey(key);
	const ivBytes = (iv ??
		crypto.getRandomValues(new Uint8Array(12))) as Uint8Array<ArrayBuffer>;
	const encrypted = await crypto.subtle.encrypt(
		{ name: "AES-GCM", iv: ivBytes },
		cryptoKey,
		toBuffer(data),
	);
	return {
		ciphertext: toHex(new Uint8Array(encrypted)),
		iv: toHex(ivBytes),
	};
}

export async function decrypt(
	ciphertext: string,
	key: string | ArrayBuffer | Uint8Array,
	iv: string,
): Promise<string> {
	const cryptoKey = await importAesKey(key);
	const ivBytes = new Uint8Array(
		iv.match(/.{1,2}/g)?.map((h) => Number.parseInt(h, 16)) ?? [],
	);
	const data = new Uint8Array(
		ciphertext.match(/.{1,2}/g)?.map((h) => Number.parseInt(h, 16)) ?? [],
	);
	const decrypted = await crypto.subtle.decrypt(
		{ name: "AES-GCM", iv: ivBytes },
		cryptoKey,
		data,
	);
	return DECODER.decode(decrypted);
}
