const _ALPHANUMERIC =
	"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
const urlAlphabet =
	"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";

/**
 * Generate a sequential code with prefix and auto-incrementing counter.
 *
 * **Warning:** the counter is kept in a module-level `Map`, so it resets on
 * process restart and is not shared across multiple processes/instances. Do
 * not use `generateCode` for values that must be globally unique (e.g.
 * invoice numbers, order IDs) - prefer `nanoid()`/`ulid()`/`crypto.randomUUID()`
 * for those.
 *
 * @example
 * generateCode("T");        // "T0001"
 * generateCode("T");        // "T0002"
 * generateCode("INV");      // "INV0001"
 * generateCode("ORD", 42);  // "ORD0042"
 * generateCode("ORD", 42, 6); // "ORD000042"
 */
export function generateCode(prefix: string, counter?: number, length = 4): string {
	if (counter === undefined) {
		// Use module-level counter per prefix
		const current = counters.get(prefix) ?? 0;
		counter = current + 1;
		counters.set(prefix, counter);
	}
	return `${prefix}${counter.toString().padStart(length, "0")}`;
}

const counters = new Map<string, number>();

/**
 * Reset the auto-increment counter for a prefix.
 *
 * @example
 * resetCounter("T"); // next generateCode("T") will be "T0001"
 */
export function resetCounter(prefix: string): void {
	counters.delete(prefix);
}

/**
 * Generate a URL-safe unique ID (nanoid-style).
 *
 * @example
 * nanoid();     // "V1StGXR8_Z5jdHi6B-myT"  (21 chars)
 * nanoid(10);   // "V1StGXR8_Z5"             (10 chars)
 */
export function nanoid(size = 21): string {
	const bytes = crypto.getRandomValues(new Uint8Array(size));
	return Array.from(bytes, (b) => urlAlphabet[b % 64]).join("");
}

/**
 * Generate a ULID (Time-Ordered Unique Identifier).
 * Format: 26 chars, sortable by creation time.
 *
 * @example
 * ulid(); // "01ARZ3NDEKTSV4RRFFQ69G5FAV"
 */
export function ulid(): string {
	const time = Date.now();
	const timeStr = encodeTime(time, 10);
	const randomStr = encodeRandom(16);
	return timeStr + randomStr;
}

const ENCODING = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

function encodeTime(time: number, length: number): string {
	let result = "";
	for (let i = length - 1; i >= 0; i--) {
		result = ENCODING[time % 32] + result;
		time = Math.floor(time / 32);
	}
	return result;
}

function encodeRandom(length: number): string {
	const bytes = crypto.getRandomValues(new Uint8Array(length));
	return Array.from(bytes, (b) => ENCODING[b % 32]).join("");
}
