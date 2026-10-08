/**
 * Secure password hashing using Bun's native Zig-based implementations.
 * Supports argon2id and bcrypt - memory-hard algorithms designed to resist
 * brute-force and rainbow table attacks.
 *
 * Uses `Bun.password` for 2-10x faster hashing than `node:crypto`,
 * while maintaining the same security level.
 *
 * New hashes use argon2id (recommended). Legacy scrypt and PBKDF2 formats
 * are still supported for verification.
 */

/**
 * Hash a password using argon2id (memory-hard algorithm).
 * Returns a string in the format `$argon2id$v=19$m=...`.
 *
 * @example
 * ```ts
 * const hashed = await hashPassword("mypassword");
 * // "$argon2id$v=19$m=65536,t=2,p=1$..."
 * ```
 */
export async function hashPassword(password: string): Promise<string> {
	return Bun.password.hash(password, {
		algorithm: "argon2id",
	});
}

/**
 * Verify a password against a stored hash string.
 * Supports argon2id, bcrypt, legacy scrypt, and legacy PBKDF2 formats.
 * Uses timing-safe comparison.
 *
 * @example
 * ```ts
 * const valid = await verifyPassword("mypassword", hashed);  // true
 * const wrong = await verifyPassword("wrong", hashed);        // false
 * ```
 */
export async function verifyPassword(
	password: string,
	stored: string,
): Promise<boolean> {
	// Argon2id format: $argon2id$v=19$m=...
	// Bcrypt format: $2b$10$...
	// Bun.password.verify handles both natively
	if (stored.startsWith("$argon2id$") || stored.startsWith("$2b$")) {
		return Bun.password.verify(password, stored);
	}

	// Legacy scrypt format: scrypt:<salt>:<hash>
	if (stored.startsWith("scrypt:")) {
		return verifyScryptLegacy(password, stored);
	}

	// Legacy PBKDF2 format: iterations:salt:hash
	return verifyPBKDF2Legacy(password, stored);
}

// ─── Scrypt Legacy Support ────────────────────────────────────────────

const SCRYPT_OPTIONS = {
	N: 16384, // 2^14 - memory cost (16 MB)
	r: 8, // block size
	p: 1, // parallelization
};
const KEY_LENGTH = 64;

async function verifyScryptLegacy(
	password: string,
	stored: string,
): Promise<boolean> {
	const parts = stored.split(":");
	if (parts.length !== 3) return false;

	const { scryptSync, timingSafeEqual } = await import("node:crypto");
	const saltHex = parts[1] as string;
	const expectedHash = parts[2] as string;
	const salt = Buffer.from(saltHex, "hex");
	const test = scryptSync(password, salt, KEY_LENGTH, SCRYPT_OPTIONS);

	return timingSafeEqual(
		Buffer.from(expectedHash, "hex"),
		test,
	);
}

// ─── PBKDF2 Legacy Support ─────────────────────────────────────────────

const PBKDF2_ITERATIONS = 100_000;
const PBKDF2_KEY_LENGTH = 64;
const PBKDF2_DIGEST = "SHA-256";

function toHex(buffer: Uint8Array): string {
	return [...buffer].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function fromHex(hex: string): Uint8Array {
	return new Uint8Array(
		hex.match(/.{1,2}/g)?.map((h) => Number.parseInt(h, 16)) ?? [],
	);
}

async function verifyPBKDF2Legacy(
	password: string,
	stored: string,
): Promise<boolean> {
	const parts = stored.split(":");
	if (parts.length < 3) return false;

	const iterations = Number(parts[0]);
	const saltHex = parts[1] as string;
	const expectedHash = parts[2] as string;
	const salt = fromHex(saltHex) as Uint8Array<ArrayBuffer>;

	const key = await crypto.subtle.importKey(
		"raw",
		new TextEncoder().encode(password),
		"PBKDF2",
		false,
		["deriveBits"],
	);
	const derived = await crypto.subtle.deriveBits(
		{ name: "PBKDF2", salt, iterations, hash: PBKDF2_DIGEST },
		key,
		PBKDF2_KEY_LENGTH * 8,
	);
	const actual = toHex(new Uint8Array(derived));

	if (actual.length !== expectedHash.length) return false;
	let result = 0;
	for (let i = 0; i < actual.length; i++) {
		result |= actual.charCodeAt(i) ^ expectedHash.charCodeAt(i);
	}
	return result === 0;
}
