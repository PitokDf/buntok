/**
 * Timezone helper utilities for handling time conversions between server and client.
 *
 * Common use case:
 * - Server stores times in ISO +7 (Asia/Jakarta)
 * - Dashboard needs to display/group data by client's local timezone
 */

function toDate(date: Date | string | number): Date {
	return date instanceof Date ? date : new Date(date);
}

/**
 * Get the timezone offset in minutes for a given IANA timezone.
 *
 * @example
 * getTimezoneOffset("Asia/Jakarta"); // -420 (UTC+7)
 * getTimezoneOffset("America/New_York"); // varies (DST aware)
 */
export function getTimezoneOffset(timezone: string, date?: Date): number {
	const d = date ?? new Date();
	const utcStr = d.toLocaleString("en-US", { timeZone: "UTC" });
	const tzStr = d.toLocaleString("en-US", { timeZone: timezone });
	const utc = new Date(utcStr);
	const tz = new Date(tzStr);
	return (utc.getTime() - tz.getTime()) / 60000;
}

/**
 * Parse a time string and interpret it in a specific timezone.
 *
 * If the string has no timezone info (no Z, no +07:00), it will be
 * interpreted as being in the specified timezone.
 *
 * @example
 * // Server receives "2026-08-24 05:00" from client in UTC+7
 * const date = parseTime("2026-08-24 05:00", "Asia/Jakarta");
 * date.toISOString(); // "2026-08-23T22:00:00.000Z" (correct UTC)
 */
export function parseTime(timeStr: string, timezone: string): Date {
	// If already has timezone info (Z or ±HH:MM), use native parsing
	if (/[Zz]$|[+-]\d{2}:\d{2}$/.test(timeStr.trim())) {
		return new Date(timeStr);
	}

	// Parse as local time in target timezone
	const d = new Date(timeStr);
	if (Number.isNaN(d.getTime())) {
		throw new Error(`Invalid date string: "${timeStr}"`);
	}

	// Get what this date looks like in the target timezone
	const offset = getTimezoneOffset(timezone, d);
	const utcOffset = d.getTimezoneOffset(); // local offset in minutes (negative for east)

	// Adjust: move from local interpretation to target timezone.
	// d was parsed in the machine's zone, so subtract the machine offset and
	// add the target offset - result is correct on any machine timezone.
	const adjusted = new Date(d.getTime() + (offset - utcOffset) * 60000);
	return adjusted;
}

/**
 * Convert a Date to a specific timezone and return parts.
 *
 * @example
 * const parts = toTimezoneParts(new Date("2026-08-23T22:00:00Z"), "Asia/Jakarta");
 * // { year: 2026, month: 8, day: 24, hour: 5, minute: 0, second: 0 }
 */
export function toTimezoneParts(date: Date, timezone: string) {
	const d = toDate(date);
	const parts = new Intl.DateTimeFormat("en-US", {
		timeZone: timezone,
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit",
		hour12: false,
	}).formatToParts(d);

	const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);

	return {
		year: get("year"),
		month: get("month"),
		day: get("day"),
		hour: get("hour"),
		minute: get("minute"),
		second: get("second"),
	};
}

/**
 * Format a Date in a specific timezone.
 *
 * @example
 * const date = new Date("2026-08-23T22:00:00Z");
 * formatInTimezone(date, "Asia/Jakarta"); // "2026-08-24 05:00:00"
 * formatInTimezone(date, "Asia/Jakarta", "short"); // "2026-08-24 05:00"
 * formatInTimezone(date, "Asia/Jakarta", "full"); // "2026-08-24 05:00:00.000"
 */
export function formatInTimezone(
	date: Date | string | number,
	timezone: string,
	format: "short" | "default" | "full" = "default",
): string {
	const d = toDate(date);
	const parts = toTimezoneParts(d, timezone);

	const pad = (n: number) => String(n).padStart(2, "0");
	const y = parts.year;
	const m = pad(parts.month);
	const day = pad(parts.day);
	const h = pad(parts.hour);
	const min = pad(parts.minute);
	const sec = pad(parts.second);

	switch (format) {
		case "short":
			return `${y}-${m}-${day} ${h}:${min}`;
		case "full":
			return `${y}-${m}-${day} ${h}:${min}:${sec}.000`;
		default:
			return `${y}-${m}-${day} ${h}:${min}:${sec}`;
	}
}

/**
 * Get current time in a specific timezone.
 *
 * @example
 * const now = nowInTimezone("Asia/Jakarta");
 * // Date object representing current time, displayable in Jakarta timezone
 */
export function nowInTimezone(timezone: string): Date {
	const now = new Date();
	const parts = toTimezoneParts(now, timezone);
	const reconstructed = new Date(
		Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second),
	);
	const tzOffset = getTimezoneOffset(timezone, now);
	return new Date(reconstructed.getTime() + tzOffset * 60000);
}

/**
 * Get the timezone offset string (e.g., "+07:00", "-05:00") for a timezone.
 *
 * @example
 * getTimezoneOffsetString("Asia/Jakarta"); // "+07:00"
 * getTimezoneOffsetString("America/New_York"); // "-04:00" or "-05:00" (DST)
 */
export function getTimezoneOffsetString(timezone: string, date?: Date): string {
	const offset = getTimezoneOffset(timezone, date);
	const sign = offset <= 0 ? "+" : "-";
	const absOffset = Math.abs(offset);
	const hours = Math.floor(absOffset / 60);
	const minutes = absOffset % 60;
	return `${sign}${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

/**
 * Convert a Date to ISO string with a specific timezone offset.
 *
 * @example
 * const date = new Date("2026-08-23T22:00:00Z");
 * toISOWithTimezone(date, "Asia/Jakarta");
 * // "2026-08-24T05:00:00+07:00"
 */
export function toISOWithTimezone(date: Date | string | number, timezone: string): string {
	const d = toDate(date);
	const parts = toTimezoneParts(d, timezone);
	const offset = getTimezoneOffsetString(timezone, d);

	const pad = (n: number) => String(n).padStart(2, "0");
	return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}T${pad(parts.hour)}:${pad(parts.minute)}:${pad(parts.second)}${offset}`;
}

export type GroupByKey = "hour" | "day" | "month" | "year";

export interface GroupByTimezoneOptions {
	locale?: string;
	labelFormatter?: (key: string, groupBy: GroupByKey) => string;
}

function defaultLabelFormatter(key: string, groupBy: GroupByKey, locale: string): string {
	// If key looks like a date (YYYY-MM-DD)
	if (/^\d{4}-\d{2}-\d{2}$/.test(key)) {
		const [y, m, d] = key.split("-").map(Number) as [number, number, number];
		const date = new Date(y, m - 1, d);
		return new Intl.DateTimeFormat(locale, {
			weekday: "long",
			year: "numeric",
			month: "long",
			day: "numeric",
		}).format(date);
	}

	// If key looks like YYYY-MM
	if (/^\d{4}-\d{2}$/.test(key)) {
		const [y, m] = key.split("-").map(Number) as [number, number];
		const date = new Date(y, m - 1, 1);
		return new Intl.DateTimeFormat(locale, {
			year: "numeric",
			month: "long",
		}).format(date);
	}

	// If key is just a year
	if (/^\d{4}$/.test(key)) {
		return key;
	}

	// If key is hour (00-23)
	if (/^\d{2}$/.test(key)) {
		const hour = Number(key);
		const date = new Date(2000, 0, 1, hour);
		return new Intl.DateTimeFormat(locale, {
			hour: "numeric",
			hour12: false,
		}).format(date);
	}

	return key;
}

/**
 * Format a group key into a human-readable label.
 *
 * @example
 * formatGroupLabel("2026-08-24", "day", "id");
 * // "Rabu, 24 Agustus 2026"
 *
 * formatGroupLabel("2026-08-24", "day", "en");
 * // "Wednesday, August 24, 2026"
 *
 * formatGroupLabel("05", "hour", "id");
 * // "05.00"
 */
export function formatGroupLabel(
	key: string,
	groupBy: GroupByKey,
	locale = "en-US",
): string {
	return defaultLabelFormatter(key, groupBy, locale);
}

/**
 * Group items by their date value in a specific timezone.
 *
 * @example
 * const transactions = [
 *   { id: 1, createdAt: "2026-08-24T05:00:00+07:00", amount: 100 },
 *   { id: 2, createdAt: "2026-08-24T08:30:00+07:00", amount: 200 },
 *   { id: 3, createdAt: "2026-08-24T14:00:00+07:00", amount: 150 },
 * ];
 *
 * // Group by hour in Jakarta timezone
 * const hourly = groupByTimezone(transactions, "createdAt", "Asia/Jakarta", "hour");
 * // Map {
 * //   "05" => [{ id: 1, ... }],
 * //   "08" => [{ id: 2, ... }],
 * //   "14" => [{ id: 3, ... }],
 * // }
 *
 * // Group by day
 * const daily = groupByTimezone(transactions, "createdAt", "Asia/Jakarta", "day");
 * // Map {
 * //   "2026-08-24" => [all 3 transactions],
 * // }
 *
 * // With human-readable labels
 * const dailyWithLabels = groupByTimezone(
 *   transactions, "createdAt", "Asia/Jakarta", "day",
 *   { locale: "id" }
 * );
 * // Labels: "Rabu, 24 Agustus 2026"
 */
export function groupByTimezone<T>(
	items: T[],
	dateField: keyof T,
	timezone: string,
	groupBy: GroupByKey = "day",
	options?: GroupByTimezoneOptions,
): Map<string, T[]> {
	const groups = new Map<string, T[]>();
	const locale = options?.locale ?? "en-US";

	for (const item of items) {
		const dateVal = item[dateField];
		if (!dateVal) continue;

		const d = toDate(dateVal as Date | string | number);
		const parts = toTimezoneParts(d, timezone);
		const pad = (n: number) => String(n).padStart(2, "0");

		let key: string;
		switch (groupBy) {
			case "hour":
				key = `${pad(parts.hour)}`;
				break;
			case "month":
				key = `${parts.year}-${pad(parts.month)}`;
				break;
			case "year":
				key = `${parts.year}`;
				break;
			default:
				key = `${parts.year}-${pad(parts.month)}-${pad(parts.day)}`;
		}

		const group = groups.get(key) ?? [];
		group.push(item);
		groups.set(key, group);
	}

	return groups;
}

/**
 * Get labels for groupByTimezone keys.
 *
 * @example
 * const hourly = groupByTimezone(transactions, "createdAt", "Asia/Jakarta", "hour");
 * const labels = getGroupLabels(hourly, "hour", "id");
 * // Map { "05" => "05.00", "08" => "08.00", ... }
 *
 * const daily = groupByTimezone(transactions, "createdAt", "Asia/Jakarta", "day");
 * const labels = getGroupLabels(daily, "day", "id");
 * // Map { "2026-08-24" => "Rabu, 24 Agustus 2026", ... }
 */
export function getGroupLabels(
	groups: Map<string, unknown[]>,
	groupBy: GroupByKey,
	locale = "en-US",
): Map<string, string> {
	const labels = new Map<string, string>();
	for (const key of groups.keys()) {
		labels.set(key, formatGroupLabel(key, groupBy, locale));
	}
	return labels;
}

/**
 * Check if a timezone string is valid.
 *
 * @example
 * isValidTimezone("Asia/Jakarta"); // true
 * isValidTimezone("Invalid/Zone"); // false
 */
export function isValidTimezone(timezone: string): boolean {
	try {
		new Intl.DateTimeFormat("en-US", { timeZone: timezone });
		return true;
	} catch {
		return false;
	}
}
