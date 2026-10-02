import { describe, it, expect } from "bun:test";
import {
	formatInTimezone,
	toTimezoneParts,
	getTimezoneOffset,
	getTimezoneOffsetString,
	parseTime,
	nowInTimezone,
	isValidTimezone,
	formatGroupLabel,
	groupByTimezone,
	getGroupLabels,
} from "../../src/helpers/timezone";

describe("getTimezoneOffset", () => {
	it("should return offset for UTC+7", () => {
		const offset = getTimezoneOffset("Asia/Jakarta");
		expect(offset).toBe(-420); // UTC+7 → offset is -420 minutes
	});

	it("should return 0 for UTC", () => {
		const offset = getTimezoneOffset("UTC");
		expect(offset).toBe(0);
	});
});

describe("getTimezoneOffsetString", () => {
	it("should return +07:00 for Jakarta", () => {
		const str = getTimezoneOffsetString("Asia/Jakarta");
		expect(str).toBe("+07:00");
	});

	it("should return +00:00 for UTC", () => {
		const str = getTimezoneOffsetString("UTC");
		expect(str).toBe("+00:00");
	});
});

describe("toTimezoneParts", () => {
	it("should return date parts in timezone", () => {
		const date = new Date("2026-08-23T22:00:00Z");
		const parts = toTimezoneParts(date, "Asia/Jakarta");
		expect(parts.year).toBe(2026);
		expect(parts.month).toBe(8);
		expect(parts.day).toBe(24);
		expect(parts.hour).toBe(5);
		expect(parts.minute).toBe(0);
	});
});

describe("formatInTimezone", () => {
	it("should format default", () => {
		const date = new Date("2026-08-23T22:00:00Z");
		const result = formatInTimezone(date, "Asia/Jakarta");
		expect(result).toBe("2026-08-24 05:00:00");
	});

	it("should format short", () => {
		const date = new Date("2026-08-23T22:00:00Z");
		const result = formatInTimezone(date, "Asia/Jakarta", "short");
		expect(result).toBe("2026-08-24 05:00");
	});

	it("should format full", () => {
		const date = new Date("2026-08-23T22:00:00Z");
		const result = formatInTimezone(date, "Asia/Jakarta", "full");
		expect(result).toBe("2026-08-24 05:00:00.000");
	});
});

describe("parseTime", () => {
	it("should parse string with timezone info", () => {
		const date = parseTime("2026-08-24T05:00:00+07:00", "Asia/Jakarta");
		expect(date.toISOString()).toBe("2026-08-23T22:00:00.000Z");
	});

	it("should parse string without timezone info", () => {
		const date = parseTime("2026-08-24 05:00", "Asia/Jakarta");
		// Wall-clock 05:00 in Jakarta = 2026-08-23T22:00:00Z, on any machine TZ
		expect(date.toISOString()).toBe("2026-08-23T22:00:00.000Z");
	});

	it("should throw on invalid date", () => {
		expect(() => parseTime("not-a-date", "Asia/Jakarta")).toThrow(
			"Invalid date string",
		);
	});
});

describe("nowInTimezone", () => {
	it("should return a Date", () => {
		const now = nowInTimezone("Asia/Jakarta");
		expect(now).toBeInstanceOf(Date);
	});
});

describe("isValidTimezone", () => {
	it("should return true for valid timezone", () => {
		expect(isValidTimezone("Asia/Jakarta")).toBe(true);
	});

	it("should return false for invalid timezone", () => {
		expect(isValidTimezone("Invalid/Zone")).toBe(false);
	});
});

describe("formatGroupLabel", () => {
	it("should format date keys", () => {
		const label = formatGroupLabel("2026-08-24", "day", "en-US");
		expect(label).toContain("August");
		expect(label).toContain("24");
	});

	it("should format month keys", () => {
		const label = formatGroupLabel("2026-08", "month", "en-US");
		expect(label).toContain("August");
		expect(label).toContain("2026");
	});

	it("should format year keys", () => {
		const label = formatGroupLabel("2026", "year");
		expect(label).toBe("2026");
	});

	it("should format hour keys", () => {
		const label = formatGroupLabel("05", "hour", "en-US");
		expect(label).toBeDefined();
	});
});

describe("groupByTimezone", () => {
	it("should group items by day", () => {
		const items = [
			{ id: 1, date: "2026-08-24T05:00:00+07:00" },
			{ id: 2, date: "2026-08-24T08:00:00+07:00" },
			{ id: 3, date: "2026-08-25T10:00:00+07:00" },
		];
		const groups = groupByTimezone(items, "date", "Asia/Jakarta", "day");
		expect(groups.size).toBe(2);
	});

	it("should group items by hour", () => {
		const items = [
			{ id: 1, date: "2026-08-24T05:00:00+07:00" },
			{ id: 2, date: "2026-08-24T05:30:00+07:00" },
			{ id: 3, date: "2026-08-24T08:00:00+07:00" },
		];
		const groups = groupByTimezone(items, "date", "Asia/Jakarta", "hour");
		expect(groups.size).toBe(2);
	});

	it("should group items by month", () => {
		const items = [
			{ id: 1, date: "2026-08-24T05:00:00+07:00" },
			{ id: 2, date: "2026-09-01T05:00:00+07:00" },
		];
		const groups = groupByTimezone(items, "date", "Asia/Jakarta", "month");
		expect(groups.size).toBe(2);
	});
});

describe("getGroupLabels", () => {
	it("should return labels for groups", () => {
		const groups = new Map([
			["2026-08-24", []],
			["2026-08-25", []],
		]);
		const labels = getGroupLabels(groups, "day", "en-US");
		expect(labels.size).toBe(2);
		expect(labels.get("2026-08-24")).toContain("August");
	});
});
