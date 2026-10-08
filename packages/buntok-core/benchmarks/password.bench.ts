import { bench, run } from "mitata";
import { hashPassword, verifyPassword } from "../src/helpers/password";

// ──── Password hashing benchmarks ────
const testPassword = "mySecurePassword123!";

bench("Bun.password.hash (argon2id) - hashPassword", async () => {
	await hashPassword(testPassword);
});

bench("Bun.password.hash (argon2id) - verifyPassword", async () => {
	const hash = await hashPassword(testPassword);
	await verifyPassword(testPassword, hash);
});

// ──── Different password lengths ────
bench("hashPassword - short (8 chars)", async () => {
	await hashPassword("12345678");
});

bench("hashPassword - medium (16 chars)", async () => {
	await hashPassword("abcdefghijklmnop");
});

bench("hashPassword - long (64 chars)", async () => {
	await hashPassword("a".repeat(64));
});

// ──── Verification with wrong password ────
bench("verifyPassword - wrong password", async () => {
	const hash = await hashPassword(testPassword);
	await verifyPassword("wrongPassword", hash);
});

// ──── Legacy format verification ────
bench("verifyPassword - legacy scrypt format", async () => {
	// Simulate a legacy scrypt hash
	const salt = crypto.getRandomValues(new Uint8Array(16));
	const { scryptSync } = require("node:crypto");
	const hashBuf = scryptSync("testPassword", salt, 64, {
		N: 16384,
		r: 8,
		p: 1,
		maxmem: 16 * 1024 * 1024,
	});
	const legacyHash = `scrypt:${Buffer.from(salt).toString("hex")}:${Buffer.from(hashBuf).toString("hex")}`;
	await verifyPassword("testPassword", legacyHash);
});

run();
