import { bench, run } from "mitata";
import {
	fastHash,
	sha256,
	sha512,
	md5,
} from "../src/helpers/crypto";

// ──── Hashing benchmarks ────
const testData = "Hello, World! This is a test string for hashing benchmarks.";
const testDataObj = {
	userId: 123,
	action: "view",
	endpoint: "/api/users",
	params: { id: 42, page: 1 },
	timestamp: Date.now(),
};

bench("fastHash - string (Bun.hash)", () => {
	fastHash(testData);
});

bench("fastHash - object (Bun.hash)", () => {
	fastHash(testDataObj);
});

bench("sha256 - string", () => {
	sha256(testData);
});

bench("sha512 - string", () => {
	sha512(testData);
});

bench("md5 - string", async () => {
	await md5(testData);
});

// ──── Different data sizes ────
const smallData = "test";
const mediumData = "a".repeat(1000);
const largeData = "b".repeat(100000);

bench("fastHash - small (4 bytes)", () => {
	fastHash(smallData);
});

bench("fastHash - medium (1KB)", () => {
	fastHash(mediumData);
});

bench("fastHash - large (100KB)", () => {
	fastHash(largeData);
});

bench("sha256 - small (4 bytes)", () => {
	sha256(smallData);
});

bench("sha256 - medium (1KB)", () => {
	sha256(mediumData);
});

bench("sha256 - large (100KB)", () => {
	sha256(largeData);
});

// ──── Comparison: Bun.hash vs crypto ────
bench("Bun.hash (non-crypto) - 1KB", () => {
	Bun.hash(mediumData);
});

bench("crypto.subtle SHA-256 - 1KB", async () => {
	const encoder = new TextEncoder();
	const data = encoder.encode(mediumData);
	await crypto.subtle.digest("SHA-256", data);
});

run();
