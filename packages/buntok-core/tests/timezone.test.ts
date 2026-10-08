import { describe, expect, test } from "bun:test";
import {
	formatGroupLabel,
	formatInTimezone,
	getGroupLabels,
	getTimezoneOffset,
	getTimezoneOffsetString,
	groupByTimezone,
	isValidTimezone,
	nowInTimezone,
	parseTime,
	toISOWithTimezone,
	toTimezoneParts,
} from "../src/helpers/timezone";

describe("getTimezoneOffset", () => {
	test("returns offset for Asia/Jakarta (UTC+7)", () => {
		const offset = getTimezoneOffset("Asia/Jakarta");
		expect(offset).toBe(-420); // -7 hours in minutes
	});

	test("returns offset for UTC", () => {
		const offset = getTimezoneOffset("UTC");
		expect(offset).toBe(0);
	});

	test("returns offset for America/New_York", () => {
		const offset = getTimezoneOffset("America/New_York");
		// EST = 300 (5h), EDT = 240 (4h) - positive means timezone is behind UTC
		expect(offset === 300 || offset === 240).toBe(true);
	});
});

describe("getTimezoneOffsetString", () => {
	test("returns +07:00 for Asia/Jakarta", () => {
		const offset = getTimezoneOffsetString("Asia/Jakarta");
		expect(offset).toBe("+07:00");
	});

	test("returns +00:00 for UTC", () => {
		const offset = getTimezoneOffsetString("UTC");
		expect(offset).toBe("+00:00");
	});

	test("returns -05:00 or -04:00 for New York", () => {
		const offset = getTimezoneOffsetString("America/New_York");
		expect(offset === "-05:00" || offset === "-04:00").toBe(true);
	});
});

describe("toTimezoneParts", () => {
	test("converts UTC date to Jakarta time", () => {
		// 2026-08-23T22:00:00Z = 2026-08-24T05:00:00+07:00
		const date = new Date("2026-08-23T22:00:00Z");
		const parts = toTimezoneParts(date, "Asia/Jakarta");

		expect(parts.year).toBe(2026);
		expect(parts.month).toBe(8);
		expect(parts.day).toBe(24);
		expect(parts.hour).toBe(5);
		expect(parts.minute).toBe(0);
		expect(parts.second).toBe(0);
	});

	test("converts UTC date to New York time", () => {
		// 2026-08-24T12:00:00Z = 2026-08-24T08:00:00-04:00 (EDT)
		const date = new Date("2026-08-24T12:00:00Z");
		const parts = toTimezoneParts(date, "America/New_York");

		expect(parts.hour).toBe(8);
	});
});

describe("formatInTimezone", () => {
	test("formats date in Jakarta timezone (default)", () => {
		const date = new Date("2026-08-23T22:00:00Z");
		const result = formatInTimezone(date, "Asia/Jakarta");

		expect(result).toBe("2026-08-24 05:00:00");
	});

	test("formats date in short format", () => {
		const date = new Date("2026-08-23T22:00:00Z");
		const result = formatInTimezone(date, "Asia/Jakarta", "short");

		expect(result).toBe("2026-08-24 05:00");
	});

	test("formats date in full format", () => {
		const date = new Date("2026-08-23T22:00:00Z");
		const result = formatInTimezone(date, "Asia/Jakarta", "full");

		expect(result).toBe("2026-08-24 05:00:00.000");
	});
});

describe("parseTime", () => {
	test("parses time string in Jakarta timezone", () => {
		const date = parseTime("2026-08-24 05:00", "Asia/Jakarta");

		// Should be 2026-08-23T22:00:00Z in UTC
		expect(date.toISOString()).toBe("2026-08-23T22:00:00.000Z");
	});

	test("parses ISO string with timezone info", () => {
		const date = parseTime("2026-08-24T05:00:00+07:00", "Asia/Jakarta");

		expect(date.toISOString()).toBe("2026-08-23T22:00:00.000Z");
	});

	test("parses ISO string with Z suffix", () => {
		const date = parseTime("2026-08-23T22:00:00Z", "Asia/Jakarta");

		expect(date.toISOString()).toBe("2026-08-23T22:00:00.000Z");
	});

	test("throws on invalid date string", () => {
		expect(() => parseTime("not-a-date", "Asia/Jakarta")).toThrow('Invalid date string: "not-a-date"');
	});
});

describe("toISOWithTimezone", () => {
	test("converts UTC to Jakarta ISO string", () => {
		const date = new Date("2026-08-23T22:00:00Z");
		const result = toISOWithTimezone(date, "Asia/Jakarta");

		expect(result).toBe("2026-08-24T05:00:00+07:00");
	});

	test("converts UTC to New York ISO string", () => {
		const date = new Date("2026-08-24T12:00:00Z");
		const result = toISOWithTimezone(date, "America/New_York");

		// EDT in August
		expect(result).toMatch(/2026-08-24T08:00:00-04:00/);
	});
});

describe("nowInTimezone", () => {
	test("returns a Date", () => {
		const now = nowInTimezone("Asia/Jakarta");
		expect(now).toBeInstanceOf(Date);
		expect(Number.isNaN(now.getTime())).toBe(false);
	});
});

describe("isValidTimezone", () => {
	test("valid timezone returns true", () => {
		expect(isValidTimezone("Asia/Jakarta")).toBe(true);
		expect(isValidTimezone("UTC")).toBe(true);
		expect(isValidTimezone("America/New_York")).toBe(true);
	});

	test("invalid timezone returns false", () => {
		expect(isValidTimezone("Invalid/Zone")).toBe(false);
		expect(isValidTimezone("NotATimezone")).toBe(false);
	});
});

describe("groupByTimezone", () => {
	const transactions = [
		{ id: 1, createdAt: "2026-08-24T05:00:00+07:00", amount: 100 },
		{ id: 2, createdAt: "2026-08-24T05:30:00+07:00", amount: 200 },
		{ id: 3, createdAt: "2026-08-24T08:30:00+07:00", amount: 150 },
		{ id: 4, createdAt: "2026-08-24T14:00:00+07:00", amount: 300 },
		{ id: 5, createdAt: "2026-08-25T05:00:00+07:00", amount: 250 },
	];

	test("groups by hour", () => {
		const hourly = groupByTimezone(transactions, "createdAt", "Asia/Jakarta", "hour");

		expect(hourly.size).toBe(3);
		expect(hourly.get("05")?.length).toBe(3); // id 1, 2, 5 (5am both days)
		expect(hourly.get("08")?.length).toBe(1); // id 3
		expect(hourly.get("14")?.length).toBe(1); // id 4
	});

	test("groups by day", () => {
		const daily = groupByTimezone(transactions, "createdAt", "Asia/Jakarta", "day");

		expect(daily.size).toBe(2);
		expect(daily.get("2026-08-24")?.length).toBe(4);
		expect(daily.get("2026-08-25")?.length).toBe(1);
	});

	test("groups by month", () => {
		const monthly = groupByTimezone(transactions, "createdAt", "Asia/Jakarta", "month");

		expect(monthly.size).toBe(1);
		expect(monthly.get("2026-08")?.length).toBe(5);
	});

	test("groups by year", () => {
		const yearly = groupByTimezone(transactions, "createdAt", "Asia/Jakarta", "year");

		expect(yearly.size).toBe(1);
		expect(yearly.get("2026")?.length).toBe(5);
	});

	test("empty array returns empty map", () => {
		const result = groupByTimezone([], "createdAt", "Asia/Jakarta", "day");

		expect(result.size).toBe(0);
	});

	test("handles Date objects", () => {
		// 22:00 UTC = 05:00+07 (day 24), 02:00 UTC = 09:00+07 (day 24)
		// Both are same day in Jakarta
		const items = [
			{ id: 1, date: new Date("2026-08-23T22:00:00Z") },
			{ id: 2, date: new Date("2026-08-24T02:00:00Z") },
		];

		const result = groupByTimezone(items, "date", "Asia/Jakarta", "day");

		expect(result.size).toBe(1);
		expect(result.get("2026-08-24")?.length).toBe(2);
	});
});

describe("use case: dashboard chart grouping", () => {
	test("transactions at 5 AM UTC+7 should appear under hour 05, not 22", () => {
		// User transaksi jam 5 pagi di Jakarta
		const transaction = {
			id: 1,
			createdAt: "2026-08-24T05:00:00+07:00",
			amount: 100000,
		};

		const hourly = groupByTimezone([transaction], "createdAt", "Asia/Jakarta", "hour");

		// Should be grouped under "05" (5 AM Jakarta time)
		expect(hourly.has("05")).toBe(true);
		expect(hourly.get("05")?.[0].id).toBe(1);

		// Should NOT be under "22" (10 PM UTC)
		expect(hourly.has("22")).toBe(false);
	});

	test("formatInTimezone shows correct time for dashboard display", () => {
		const date = new Date("2026-08-23T22:00:00Z");
		const display = formatInTimezone(date, "Asia/Jakarta");

		// Should show 05:00:00, not 22:00:00
		expect(display).toBe("2026-08-24 05:00:00");
	});
});

describe("formatGroupLabel", () => {
	test("formats day key in English", () => {
		const label = formatGroupLabel("2026-08-24", "day", "en-US");
		expect(label).toBe("Monday, August 24, 2026");
	});

	test("formats day key in Indonesian", () => {
		const label = formatGroupLabel("2026-08-24", "day", "id");
		expect(label).toBe("Senin, 24 Agustus 2026");
	});

	test("formats month key in English", () => {
		const label = formatGroupLabel("2026-08", "month", "en-US");
		expect(label).toBe("August 2026");
	});

	test("formats month key in Indonesian", () => {
		const label = formatGroupLabel("2026-08", "month", "id");
		expect(label).toBe("Agustus 2026");
	});

	test("formats year key", () => {
		const label = formatGroupLabel("2026", "year", "en-US");
		expect(label).toBe("2026");
	});

	test("formats hour key", () => {
		const label = formatGroupLabel("05", "hour", "en-US");
		expect(label).toBe("05");
	});
});

describe("getGroupLabels", () => {
	test("returns labels for day groups", () => {
		const groups = new Map([
			["2026-08-24", [1, 2]],
			["2026-08-25", [3]],
		]);

		const labels = getGroupLabels(groups, "day", "id");

		expect(labels.get("2026-08-24")).toBe("Senin, 24 Agustus 2026");
		expect(labels.get("2026-08-25")).toBe("Selasa, 25 Agustus 2026");
	});

	test("returns labels for hour groups", () => {
		const groups = new Map([
			["05", [1]],
			["14", [2]],
		]);

		const labels = getGroupLabels(groups, "hour", "en-US");

		expect(labels.get("05")).toBe("05");
		expect(labels.get("14")).toBe("14");
	});
});
