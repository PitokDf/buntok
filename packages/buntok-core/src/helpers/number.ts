/**
 * Clamp a number between min and max (inclusive).
 *
 * @example
 * clamp(15, 0, 10);  // 10
 * clamp(-5, 0, 10);  // 0
 * clamp(5, 0, 10);   // 5
 */
export function clamp(value: number, min: number, max: number): number {
	return Math.min(Math.max(value, min), max);
}

/**
 * Random integer between min and max (inclusive).
 *
 * @example
 * random(1, 100); // 42
 */
export function random(min: number, max: number): number {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Random float between min and max.
 *
 * @example
 * randomFloat(1.5, 3.5); // 2.731
 */
export function randomFloat(min: number, max: number): number {
	return Math.random() * (max - min) + min;
}

/**
 * Format a number with locale-aware separators.
 *
 * @example
 * formatNumber(1000000);       // "1,000,000"
 * formatNumber(1000000, "de"); // "1.000.000"
 */
export function formatNumber(n: number, locale = "en-US"): string {
	return n.toLocaleString(locale);
}

/**
 * Format bytes to human-readable string.
 *
 * @example
 * formatBytes(0);          // "0 B"
 * formatBytes(1024);       // "1 KB"
 * formatBytes(1536);       // "1.5 KB"
 * formatBytes(1048576);    // "1 MB"
 */
export function formatBytes(bytes: number): string {
	if (!Number.isFinite(bytes) || bytes === 0) return "0 B";
	const abs = Math.abs(bytes);
	const units = ["B", "KB", "MB", "GB", "TB", "PB"];
	let i = Math.floor(Math.log(abs) / Math.log(1024));
	if (i < 0) i = 0;
	if (i >= units.length) i = units.length - 1;
	let size = abs / 1024 ** i;
	// Round up a unit when rounding pushes the value to 1024.
	const formatted = size.toFixed(size >= 100 ? 0 : size >= 10 ? 1 : 2);
	if (Number(formatted) >= 1024 && i < units.length - 1) {
		i += 1;
		size = abs / 1024 ** i;
	}
	return `${bytes < 0 ? "-" : ""}${formatted} ${units[i]}`;
}

/**
 * Format a number as currency.
 *
 * @example
 * formatCurrency(1000);          // "$1,000.00"
 * formatCurrency(1000, "EUR");   // "€1,000.00"
 * formatCurrency(1000, "IDR", "id-ID"); // "Rp1.000"
 */
export function formatCurrency(
	amount: number,
	currency = "USD",
	locale = "en-US",
): string {
	return amount.toLocaleString(locale, {
		style: "currency",
		currency,
	});
}
