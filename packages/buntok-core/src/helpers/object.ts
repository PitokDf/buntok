/**
 * Pick specified keys from an object.
 * `pick({ a: 1, b: 2, c: 3 }, ["a", "c"])` → `{ a: 1, c: 3 }`
 */
export function pick<T extends Record<string, unknown>, K extends keyof T>(
	obj: T,
	keys: K[],
): Pick<T, K> {
	const result = {} as Pick<T, K>;
	for (const key of keys) {
		if (key in obj) result[key] = obj[key];
	}
	return result;
}

/**
 * Omit specified keys from an object.
 * `omit({ a: 1, b: 2, c: 3 }, ["b"])` → `{ a: 1, c: 3 }`
 */
export function omit<T extends Record<string, unknown>, K extends keyof T>(
	obj: T,
	keys: K[],
): Omit<T, K> {
	const result = { ...obj };
	for (const key of keys) {
		delete result[key];
	}
	return result as Omit<T, K>;
}

/**
 * Group an array of objects by a key or field function.
 * `groupBy([{ type: "a" }, { type: "b" }, { type: "a" }], "type")`
 * → `{ a: [{ type: "a" }, { type: "a" }], b: [{ type: "b" }] }`
 */
export function groupBy<T>(
	arr: T[],
	key: keyof T | ((item: T) => string),
): Record<string, T[]> {
	const result: Record<string, T[]> = Object.create(null);
	for (const item of arr) {
		const k = typeof key === "function" ? key(item) : String(item[key]);
		if (!result[k]) {
			result[k] = [];
		}
		result[k].push(item);
	}
	return result;
}

/**
 * Return unique values from an array.
 * `uniq([1, 2, 2, 3])` → `[1, 2, 3]`
 */
export function uniq<T>(arr: T[]): T[] {
	return [...new Set(arr)];
}

/**
 * Flatten a nested array.
 * `flatten([[1, 2], [3, [4, 5]]])` → `[1, 2, 3, 4, 5]`
 */
export function flatten<T>(arr: unknown[], depth = Infinity): T[] {
	return arr.flat(depth) as T[];
}

/**
 * Split an array into chunks of a given size.
 * `chunk([1, 2, 3, 4, 5], 2)` → `[[1, 2], [3, 4], [5]]`
 */
export function chunk<T>(arr: T[], size: number): T[][] {
	if (size <= 0) throw new Error("chunk size must be > 0");
	const chunks: T[][] = [];
	for (let i = 0; i < arr.length; i += size) {
		chunks.push(arr.slice(i, i + size));
	}
	return chunks;
}

/**
 * Deep merge two objects. Arrays are replaced, not merged.
 *
 * @example
 * deepMerge({ a: 1, b: { c: 2 } }, { b: { d: 3 } });
 * // => { a: 1, b: { c: 2, d: 3 } }
 */
export function deepMerge<T extends Record<string, unknown>>(
	target: T,
	...sources: Partial<T>[]
): T {
	const result = { ...target };
	for (const source of sources) {
		for (const key of Object.keys(source) as (keyof T)[]) {
			const targetVal = result[key];
			const sourceVal = source[key];
			if (isPlainObject(targetVal) && isPlainObject(sourceVal)) {
				(result[key] as Record<string, unknown>) = deepMerge(
					targetVal as Record<string, unknown>,
					sourceVal as Record<string, unknown>,
				);
			} else if (sourceVal !== undefined) {
				result[key] = sourceVal as T[typeof key];
			}
		}
	}
	return result;
}

function isPlainObject(val: unknown): val is Record<string, unknown> {
	return typeof val === "object" && val !== null && !Array.isArray(val);
}

/**
 * Flatten a nested object into a single-depth object with dot-notation keys.
 *
 * @example
 * flattenObject({ a: { b: { c: 1 } } });
 * // => { "a.b.c": 1 }
 *
 * flattenObject({ a: { b: 1 }, c: 2 }, "-");
 * // => { "a-b": 1, c: 2 }
 */
export function flattenObject(
	obj: Record<string, unknown>,
	sep = ".",
): Record<string, unknown> {
	const result: Record<string, unknown> = {};

	function recurse(current: Record<string, unknown>, prefix: string) {
		for (const key of Object.keys(current)) {
			const value = current[key];
			const newKey = prefix ? `${prefix}${sep}${key}` : key;

			if (isPlainObject(value)) {
				recurse(value as Record<string, unknown>, newKey);
			} else {
				result[newKey] = value;
			}
		}
	}

	recurse(obj, "");
	return result;
}
