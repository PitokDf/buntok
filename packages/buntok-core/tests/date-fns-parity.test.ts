import { describe, expect, it } from "bun:test";
import * as theirs from "date-fns";
import * as theirsFp from "date-fns/fp";
import * as ours from "../src/date";
import { enUS as oursEnUS } from "../src/helpers/date-fns/locale/index";
import { enUS as theirsEnUS } from "date-fns/locale";
import * as oursFp from "../src/date-fp";

function norm(value: unknown): unknown {
	if (value instanceof Date) {
		const time = value.getTime();
		return Number.isNaN(time) ? "Invalid Date" : time;
	}
	if (typeof value === "number" && Number.isNaN(value)) return "NaN";
	if (typeof value === "function") return "[Function]";
	if (Array.isArray(value)) return value.map(norm);
	if (typeof value === "object" && value !== null) {
		const obj = value as Record<string, unknown>;
		const out: Record<string, unknown> = {};
		for (const key of Object.keys(obj).sort()) out[key] = norm(obj[key]);
		return out;
	}
	return value;
}

function parity(
	fn: keyof typeof ours,
	...args: unknown[]
): void {
	const ourFn = ours[fn] as (...a: unknown[]) => unknown;
	const theirFn = theirs[fn] as (...a: unknown[]) => unknown;
	expect({ fn, got: norm(ourFn(...args)) }).toEqual({
		fn,
		got: norm(theirFn(...args)),
	});
}

function fpParity(
	fn: keyof typeof oursFp,
	...args: unknown[]
): void {
	const ourFn = oursFp[fn] as (...a: unknown[]) => unknown;
	const theirFn = theirsFp[fn] as (...a: unknown[]) => unknown;
	expect({ fn, got: norm(ourFn(...args)) }).toEqual({
		fn,
		got: norm(theirFn(...args)),
	});
}

function parityThrows(
	fn: keyof typeof ours,
	...args: unknown[]
): void {
	const ourFn = ours[fn] as (...a: unknown[]) => unknown;
	const theirFn = theirs[fn] as (...a: unknown[]) => unknown;
	const capture = (f: (...a: unknown[]) => unknown): string => {
		try {
			return `no-throw: ${JSON.stringify(norm(f(...args)))}`;
		} catch (e) {
			const err = e as Error;
			return `ERR ${err.constructor.name}: ${err.message}`;
		}
	};
	const oursResult = capture(ourFn);
	const theirsResult = capture(theirFn);
	expect({ fn, got: oursResult }).toEqual({ fn, got: theirsResult });
	expect(oursResult.startsWith("ERR")).toBe(true);
}


function parityAny(
	fn: keyof typeof ours,
	...args: unknown[]
): void {
	const ourFn = ours[fn] as (...a: unknown[]) => unknown;
	const theirFn = theirs[fn] as (...a: unknown[]) => unknown;
	const capture = (f: (...a: unknown[]) => unknown): string => {
		try {
			return `ok: ${JSON.stringify(norm(f(...args)))}`;
		} catch (e) {
			const err = e as Error;
			return `ERR ${err.constructor.name}: ${err.message}`;
		}
	};
	const oursResult = capture(ourFn);
	const theirsResult = capture(theirFn);
	expect({ fn, got: oursResult }).toEqual({ fn, got: theirsResult });
}

function parityObject(
	fn: keyof typeof ours,
): void {
	expect({ fn, got: norm(ours[fn]) }).toEqual({ fn, got: norm(theirs[fn]) });
}

describe("date-fns parity: toDate family", () => {
	it("toDate clones Date, converts timestamp, maps garbage to Invalid Date", () => {
		parity("toDate", new Date(2014, 1, 11, 11, 30, 30));
		parity("toDate", 1392098430000);
		parity("toDate", "2014-02-11T11:30:30.000Z");
		parity("toDate", "not a date");
		parity("toDate", null);
		parity("toDate", undefined);
	});

	it("toDate returns a distinct instance (clone semantics)", () => {
		const source = new Date(2014, 1, 11);
		const copy = ours.toDate(source);
		expect(copy).not.toBe(source);
		expect(copy.getTime()).toBe(source.getTime());
	});

	it("constructFrom mirrors constructor semantics", () => {
		parity("constructFrom", new Date(2020, 0, 1), 1392098430000);
		parity("constructFrom", (value: number) => new Date(value), 123);
		parity("constructFrom", {}, 123);
		parity("constructFrom", undefined, 123);
	});

	it("constructNow yields a current date using the reference constructor", () => {
		const ourResult = ours.constructNow(new Date(2020, 0, 1));
		const theirResult = theirs.constructNow(new Date(2020, 0, 1));
		expect(ourResult).toBeInstanceOf(Date);
		expect(theirResult).toBeInstanceOf(Date);
		expect(Math.abs(ourResult.getTime() - theirResult.getTime())).toBeLessThan(
			1000,
		);
	});
});

describe("date-fns parity: is/valid", () => {
	it("isDate", () => {
		parity("isDate", new Date());
		parity("isDate", new Date(NaN));
		parity("isDate", {});
		parity("isDate", null);
		parity("isDate", "2024-01-01");
		parity("isDate", 1704067200000);
	});

	it("isValid (strings are NOT valid)", () => {
		parity("isValid", new Date(2014, 0, 31));
		parity("isValid", new Date(""));
		parity("isValid", 1393804800000);
		parity("isValid", "2014-01-31");
		parity("isValid", NaN);
		parity("isValid", null);
	});
});

describe("date-fns parity: timestamps & comparison", () => {
	it("getTime", () => {
		parity("getTime", new Date(2012, 1, 29, 11, 45, 5, 123));
		parity("getTime", 1330515905123);
		parity("getTime", "2012-02-29T11:45:05.123Z");
	});

	it("compareAsc / compareDesc incl. NaN propagation", () => {
		parity("compareAsc", new Date(2014, 0, 1), new Date(2015, 0, 1));
		parity("compareAsc", new Date(2015, 0, 1), new Date(2014, 0, 1));
		parity("compareAsc", new Date(2014, 0, 1), new Date(2014, 0, 1));
		parity("compareAsc", new Date(NaN), new Date(2015, 0, 1));
		parity("compareDesc", new Date(2014, 0, 1), new Date(2015, 0, 1));
		parity("compareDesc", new Date(NaN), new Date(2015, 0, 1));
	});
});

describe("date-fns parity: milliseconds", () => {
	it("duration to milliseconds", () => {
		parity("milliseconds", { years: 1 });
		parity("milliseconds", { months: 3 });
		parity("milliseconds", { weeks: 2 });
		parity("milliseconds", { days: 1 });
		parity("milliseconds", { hours: 1, minutes: 30, seconds: 15 });
		parity("milliseconds", {});
	});
});

describe("date-fns parity: default options", () => {
	it("get/set behave like date-fns (module-global, undefined clears)", () => {
		expect(norm(ours.getDefaultOptions())).toEqual(
			norm(theirs.getDefaultOptions()),
		);

		ours.setDefaultOptions({ weekStartsOn: 1 });
		theirs.setDefaultOptions({ weekStartsOn: 1 });
		expect(ours.getDefaultOptions().weekStartsOn).toBe(
			theirs.getDefaultOptions().weekStartsOn,
		);

		ours.setDefaultOptions({ firstWeekContainsDate: 4 });
		theirs.setDefaultOptions({ firstWeekContainsDate: 4 });
		expect(ours.getDefaultOptions()).toEqual(theirs.getDefaultOptions());

		ours.setDefaultOptions({ weekStartsOn: undefined });
		theirs.setDefaultOptions({ weekStartsOn: undefined });
		ours.setDefaultOptions({ firstWeekContainsDate: undefined });
		theirs.setDefaultOptions({ firstWeekContainsDate: undefined });
		expect(norm(ours.getDefaultOptions())).toEqual(
			norm(theirs.getDefaultOptions()),
		);
	});

	it("getDefaultOptions returns a copy (mutating it does not leak)", () => {
		const snapshot = ours.getDefaultOptions();
		snapshot.weekStartsOn = 3;
		expect(ours.getDefaultOptions().weekStartsOn).toBeUndefined();
	});
});

describe("date-fns parity: fp layer", () => {
	it("direct calls match date-fns/fp", () => {
		fpParity("toDate", new Date(2014, 1, 1));
		fpParity("toDate", undefined, new Date(2014, 1, 1));
		fpParity("getTime", new Date(2014, 1, 1));
		fpParity("isDate", new Date());
		fpParity("isValid", new Date(""));
		fpParity("milliseconds", { years: 1 });
	});

	it("curried and multi-arg forms match (reversed order)", () => {
		const left = new Date(2015, 0, 1);
		const right = new Date(2014, 0, 1);

		expect({
			got: norm(oursFp.compareAsc(left, right)),
		}).toEqual({ got: norm(theirsFp.compareAsc(left, right)) });

		expect({
			got: norm(oursFp.compareAsc(left)(right)),
		}).toEqual({ got: norm(theirsFp.compareAsc(left)(right)) });

		expect({
			got: norm(oursFp.constructFrom(left, right)),
		}).toEqual({ got: norm(theirsFp.constructFrom(left, right)) });

		// zero-arg call returns the curried function itself
		const ourCurried = oursFp.compareAsc();
		const theirCurried = theirsFp.compareAsc();
		expect({
			got: norm(ourCurried(left, right)),
		}).toEqual({ got: norm(theirCurried(left, right)) });
	});

	it("toDate has the same arity shape as date-fns/fp (2)", () => {
		expect(typeof oursFp.toDate(new Date())).toBe(
			typeof theirsFp.toDate(new Date()),
		);
	});
});

describe("date-fns parity: start/end/get/set/add/sub", () => {
	it("start/end across week, leap and ISO boundaries", () => {
		const sundayWeek = new Date(2024, 0, 14, 15, 45, 30, 500);
		parity("startOfWeek", sundayWeek, { weekStartsOn: 1 });
		parity("startOfWeek", sundayWeek, { weekStartsOn: 6 });
		parity("endOfWeek", sundayWeek, { weekStartsOn: 1 });
		parity("startOfISOWeek", new Date(2024, 0, 14));
		parity("endOfMonth", new Date(2024, 1, 15));
		parity("endOfMonth", new Date(2023, 1, 15));
		parity("startOfISOWeekYear", new Date(2021, 0, 1));
		parity("startOfISOWeekYear", new Date(2020, 11, 31));
		parity("lastDayOfISOWeekYear", new Date(2021, 0, 1));
		parity("lastDayOfYear", new Date(2024, 5, 1));
		parity("lastDayOfDecade", new Date(2024, 5, 1));
	});

	it("getters at year boundaries", () => {
		parity("getWeek", new Date(2021, 0, 1), { weekStartsOn: 1 });
		parity("getWeek", new Date(2020, 11, 31), { weekStartsOn: 1, firstWeekContainsDate: 4 });
		parity("getWeekYear", new Date(2021, 0, 3));
		parity("getISOWeek", new Date(2021, 0, 1));
		parity("getISOWeeksInYear", new Date(2020, 0, 1));
		parity("getDayOfYear", new Date(2024, 2, 1));
		parity("getDaysInYear", new Date(2024, 0, 1));
		parity("getDaysInYear", new Date(1900, 0, 1));
		parity("getDaysInMonth", new Date(2024, 1, 1));
		parity("getQuarter", new Date(2024, 10, 15));
		parity("getUnixTime", new Date(2024, 0, 15));
	});

	it("set overflows", () => {
		parity("setDate", new Date(2024, 0, 15), 32);
		parity("setMonth", new Date(2024, 0, 15), 12);
		parity("setDay", new Date(2024, 0, 15), 7, { weekStartsOn: 1 });
		parity("setISOWeek", new Date(2024, 0, 15), 53);
		parity("setISODay", new Date(2024, 0, 15), 7);
		parity("setYear", new Date(2024, 1, 29), 2023);
		parity("set", new Date(2024, 0, 15), { year: 2020, month: 5, date: 30 });
	});

	it("add/sub month-end and business days", () => {
		parity("addMonths", new Date(2024, 0, 31), 1);
		parity("addMonths", new Date(2023, 0, 31), 1);
		parity("subMonths", new Date(2024, 1, 29), 1);
		parity("addBusinessDays", new Date(2024, 0, 5), 5);
		parity("subBusinessDays", new Date(2024, 0, 8), 5);
		parity("addISOWeekYears", new Date(2021, 0, 1), 1);
		parity("addQuarters", new Date(2024, 10, 15), 2);
		parity("addDays", new Date(2024, 2, 1), -10);
	});
});

describe("date-fns parity: difference", () => {
	it("differenceInCalendar* boundaries", () => {
		parity("differenceInCalendarDays", new Date(2024, 0, 1), new Date(2023, 11, 31));
		parity("differenceInCalendarDays", new Date(2024, 0, 1), new Date(NaN));
		parity("differenceInCalendarMonths", new Date(2024, 2, 31), new Date(2024, 0, 31));
		parity("differenceInCalendarQuarters", new Date(2024, 10, 1), new Date(2024, 0, 1));
		parity("differenceInCalendarYears", new Date(2024, 5, 15), new Date(2014, 6, 1));
		parity("differenceInCalendarISOWeeks", new Date(2021, 0, 4), new Date(2020, 11, 28));
		parity("differenceInCalendarWeeks", new Date(2024, 0, 15), new Date(2024, 0, 8), { weekStartsOn: 1 });
		parity("differenceInCalendarISOWeekYears", new Date(2021, 0, 1), new Date(2020, 11, 31));
	});

	it("differenceInBusinessDays across weekends", () => {
		parity("differenceInBusinessDays", new Date(2024, 0, 5), new Date(2024, 0, 1));
		parity("differenceInBusinessDays", new Date(2024, 0, 1), new Date(2024, 0, 5));
		parity("differenceInBusinessDays", new Date(2024, 0, 8), new Date(2024, 0, 5));
		parity("differenceInBusinessDays", new Date(2024, 0, 6), new Date(2024, 0, 7));
		parity("differenceInBusinessDays", new Date(2024, 0, 1), new Date(NaN));
	});

	it("differenceInDays partial-day logic", () => {
		parity("differenceInDays", new Date(2024, 0, 16, 9), new Date(2024, 0, 15, 10));
		parity("differenceInDays", new Date(2024, 0, 15, 10), new Date(2024, 0, 16, 9));
		parity("differenceInDays", new Date(2024, 0, 15, 23), new Date(2024, 0, 15, 1));
		parity("differenceInDays", new Date(2024, 0, 15), new Date(2024, 0, 15));
	});

	it("differenceInMonths month-end + years at 1584 baseline", () => {
		parity("differenceInMonths", new Date(2024, 1, 29), new Date(2024, 0, 31));
		parity("differenceInMonths", new Date(2024, 0, 31), new Date(2024, 1, 29));
		parity("differenceInMonths", new Date(2024, 2, 31), new Date(2024, 2, 30));
		parity("differenceInMonths", new Date(2024, 0, 31), new Date(2023, 0, 31));
		parity("differenceInMonths", new Date(2024, 0, 31), new Date(2024, 1, 1));
		parity("differenceInYears", new Date(2024, 5, 15), new Date(2014, 6, 1));
		parity("differenceInYears", new Date(2024, 5, 15), new Date(2024, 6, 1));
	});

	it("rounding methods on hours/minutes/seconds/weeks/quarters", () => {
		const later = new Date(2024, 0, 15, 12, 50);
		const earlier = new Date(2024, 0, 15, 11, 20);
		for (const roundingMethod of ["round", "ceil", "floor", "trunc"] as const) {
			parity("differenceInHours", later, earlier, { roundingMethod });
			parity("differenceInHours", earlier, later, { roundingMethod });
			parity("differenceInMinutes", later, earlier, { roundingMethod });
			parity("differenceInSeconds", later, earlier, { roundingMethod });
			parity("differenceInWeeks", new Date(2024, 0, 24), new Date(2024, 0, 1), { roundingMethod });
			parity("differenceInQuarters", new Date(2024, 5, 1), new Date(2024, 0, 1), { roundingMethod });
			parity("differenceInISOWeekYears", new Date(2021, 0, 4), new Date(2020, 11, 28), { roundingMethod });
		}
	});
});

describe("date-fns parity: is", () => {
	it("isValid / isEqual / isAfter / isBefore", () => {
		parity("isValid", "2014-01-31");
		parity("isValid", "not a date");
		parity("isValid", 1392098430000);
		parity("isValid", new Date(NaN));
		parity("isEqual", new Date(2024, 0, 1), new Date(2024, 0, 1));
		parity("isEqual", new Date(NaN), new Date(NaN));
		parity("isAfter", new Date(2024, 0, 2), new Date(2024, 0, 1));
		parity("isAfter", new Date(2024, 0, 1), new Date(2024, 0, 1));
		parity("isBefore", new Date(2024, 0, 1), new Date(2024, 0, 2));
	});

	it("month/leap/weekend edges", () => {
		parity("isLastDayOfMonth", new Date(2024, 1, 29));
		parity("isLastDayOfMonth", new Date(2024, 1, 28));
		parity("isLastDayOfMonth", new Date(2024, 0, 30));
		parity("isFirstDayOfMonth", new Date(2024, 5, 1));
		parity("isLeapYear", new Date(2024, 0, 1));
		parity("isLeapYear", new Date(1900, 0, 1));
		parity("isLeapYear", new Date(2000, 0, 1));
		parity("isWeekend", new Date(2024, 0, 13));
		parity("isWeekend", new Date(2024, 0, 15));
		parity("isMonday", new Date(2024, 0, 15));
		parity("isSunday", new Date(2024, 0, 14));
	});

	it("isSame* with options", () => {
		const a = new Date(2024, 0, 14, 10);
		const b = new Date(2024, 0, 15, 10);
		parity("isSameDay", a, b);
		parity("isSameWeek", a, b, { weekStartsOn: 1 });
		parity("isSameWeek", a, b, { weekStartsOn: 0 });
		parity("isSameISOWeek", new Date(2021, 0, 3), new Date(2021, 0, 4));
		parity("isSameISOWeekYear", new Date(2021, 0, 3), new Date(2020, 11, 28));
		parity("isSameMonth", a, b);
		parity("isSameHour", new Date(2024, 0, 15, 10, 1), new Date(2024, 0, 15, 10, 59));
		parity("isSameMinute", new Date(2024, 0, 15, 10, 1, 5), new Date(2024, 0, 15, 10, 1, 55));
	});

	it("isWithinInterval boundaries (inclusive endpoints)", () => {
		const interval = { start: new Date(2024, 0, 1), end: new Date(2024, 0, 31) };
		parity("isWithinInterval", new Date(2024, 0, 1), interval);
		parity("isWithinInterval", new Date(2024, 0, 31), interval);
		parity("isWithinInterval", new Date(2023, 11, 31, 23, 59), interval);
		parity("isWithinInterval", new Date(2024, 1, 1, 0, 0, 1), interval);
		parity("isWithinInterval", new Date(NaN), interval);
	});

	it("isToday/isFuture/isPast", () => {
		parity("isToday", new Date(2014, 1, 11));
		parity("isFuture", new Date(2099, 0, 1));
		parity("isFuture", new Date(1999, 0, 1));
		parity("isPast", new Date(1999, 0, 1));
	});
});

describe("date-fns parity: interval & each", () => {
	it("interval construction & validation throws", () => {
		parity("interval", new Date(2024, 0, 1), new Date(2024, 5, 1));
		parity("interval", new Date(2024, 5, 1), new Date(2024, 0, 1), { assertPositive: false });
		parityThrows("interval", new Date(NaN), new Date(1));
		parityThrows("interval", new Date(1), new Date(NaN));
		parityThrows("interval", new Date(2024, 5, 1), new Date(2024, 0, 1), { assertPositive: true });
	});

	it("intervalToDuration (forward & reversed)", () => {
		parity("intervalToDuration", { start: new Date(2024, 0, 1), end: new Date(2024, 5, 30) });
		parity("intervalToDuration", { start: new Date(2024, 5, 30), end: new Date(2024, 0, 1) });
		parity("intervalToDuration", { start: new Date(2014, 1, 11, 11, 30), end: new Date(2024, 1, 11, 11, 30) });
	});

	it("overlap helpers", () => {
		const a = { start: new Date(2024, 0, 1), end: new Date(2024, 5, 30) };
		const b = { start: new Date(2024, 3, 10), end: new Date(2025, 0, 2) };
		const touch = { start: new Date(2024, 5, 30), end: new Date(2025, 0, 2) };
		const apart = { start: new Date(2030, 0, 1), end: new Date(2031, 0, 1) };
		parity("areIntervalsOverlapping", a, b);
		parity("areIntervalsOverlapping", a, b, { inclusive: true });
		parity("areIntervalsOverlapping", a, touch);
		parity("areIntervalsOverlapping", a, touch, { inclusive: true });
		parity("areIntervalsOverlapping", a, apart);
		parity("getOverlappingDaysInIntervals", a, b);
		parity("getOverlappingDaysInIntervals", a, apart);
		parity("getOverlappingDaysInIntervals", { start: new Date(2024, 0, 1), end: new Date(2024, 0, 2) }, { start: new Date(2024, 0, 1, 12), end: new Date(2024, 0, 3) });
	});

	it("each*OfInterval: steps, reversed, degenerate", () => {
		const iv = { start: new Date(2024, 0, 1), end: new Date(2024, 0, 7) };
		const rev = { start: new Date(2024, 0, 7), end: new Date(2024, 0, 1) };
		const one = { start: new Date(2024, 0, 1), end: new Date(2024, 0, 1) };
		parity("eachDayOfInterval", iv);
		parity("eachDayOfInterval", rev);
		parity("eachDayOfInterval", one);
		parity("eachDayOfInterval", iv, { step: 2 });
		parity("eachDayOfInterval", iv, { step: 0 });
		parity("eachDayOfInterval", iv, { step: -2 });
		parity("eachHourOfInterval", { start: new Date(2024, 0, 1, 0), end: new Date(2024, 0, 1, 5) });
		parity("eachMinuteOfInterval", { start: new Date(2024, 0, 1, 0, 0), end: new Date(2024, 0, 1, 0, 5) });
		parity("eachMonthOfInterval", { start: new Date(2023, 10, 15), end: new Date(2024, 1, 15) });
		parity("eachQuarterOfInterval", { start: new Date(2023, 10, 15), end: new Date(2024, 5, 15) });
		parity("eachWeekOfInterval", { start: new Date(2024, 0, 1), end: new Date(2024, 1, 1) }, { weekStartsOn: 1 });
		parity("eachYearOfInterval", { start: new Date(2022, 5, 15), end: new Date(2024, 5, 15) });
		parity("eachDayOfInterval", { start: new Date(NaN), end: new Date(2024, 0, 5) });
	});

	it("eachWeekend*", () => {
		parity("eachWeekendOfInterval", { start: new Date(2024, 0, 1), end: new Date(2024, 0, 21) });
		parity("eachWeekendOfMonth", new Date(2024, 1, 15));
		parity("eachWeekendOfMonth", new Date(2024, 0, 15));
		parity("eachWeekendOfYear", new Date(2024, 6, 1));
	});
});

describe("date-fns parity: math & convert", () => {
	it("min/max NaN & empty", () => {
		parity("min", [new Date(2024, 0, 5), new Date(2023, 0, 5), new Date(2025, 0, 5)]);
		parity("max", [new Date(2024, 0, 5), new Date(2023, 0, 5), new Date(2025, 0, 5)]);
		parity("min", [new Date(NaN), new Date(2024, 0, 5)]);
		parity("max", [new Date(2024, 0, 5), new Date(NaN)]);
		parity("min", []);
		parity("max", []);
	});

	it("clamp", () => {
		const iv = { start: new Date(2024, 0, 1), end: new Date(2024, 5, 30) };
		parity("clamp", new Date(2024, 2, 15), iv);
		parity("clamp", new Date(2023, 0, 1), iv);
		parity("clamp", new Date(2025, 0, 1), iv);
		parity("clamp", new Date(NaN), iv);
	});

	it("closestTo / closestIndexTo ties, NaN, empty", () => {
		const target = new Date(2024, 0, 10);
		const dates = [new Date(2024, 0, 5), new Date(2024, 0, 15)];
		parity("closestTo", target, dates);
		parity("closestTo", target, []);
		parity("closestTo", new Date(NaN), dates);
		parity("closestTo", target, [new Date(NaN), new Date(2024, 0, 11)]);
		parity("closestIndexTo", target, dates);
		parity("closestIndexTo", target, [new Date(2024, 0, 5), new Date(2024, 0, 15)]);
		parity("closestIndexTo", target, []);
		parity("closestIndexTo", new Date(NaN), dates);
	});

	it("unit conversions truncate toward zero", () => {
		parity("daysToWeeks", 13);
		parity("daysToWeeks", -13);
		parity("daysToWeeks", -6);
		parity("weeksToDays", 52.9);
		parity("hoursToMinutes", 1.5);
		parity("minutesToHours", -90);
		parity("secondsToMinutes", 119.9);
		parity("secondsToMilliseconds", 2.5);
		parity("millisecondsToSeconds", 2500);
		parity("monthsToYears", -13);
		parity("quartersToYears", 9);
		parity("yearsToDays", 1);
		parity("yearsToQuarters", 1);
		parity("fromUnixTime", 1392098430);
	});

	it("transpose across constructors", () => {
		class MyDate extends Date {}
		parity("transpose", new Date(2024, 5, 15, 10, 30, 45, 123), Date);
		parity("transpose", new Date(2024, 5, 15, 10, 30, 45, 123), MyDate);
		parity("transpose", new Date(2024, 5, 15, 10, 30, 45, 123), (value: number) => new Date(value));
	});
});

describe("date-fns parity: weeks, round, misc", () => {
	it("next/previousDay + weekday shortcuts", () => {
		const monday = new Date(2024, 0, 15);
		const sunday = new Date(2024, 0, 14);
		parity("nextDay", monday, 3);
		parity("nextDay", monday, 1);
		parity("nextDay", sunday, 0);
		parity("previousDay", monday, 3);
		parity("previousDay", monday, 1);
		parity("previousDay", sunday, 0);
		parity("nextMonday", monday);
		parity("previousMonday", monday);
		parity("nextSunday", monday);
		parity("previousSunday", sunday);
		parity("nextSaturday", monday);
		parity("previousFriday", monday);
	});

	it("roundToNearest* incl. invalid nearestTo", () => {
		const at = new Date(2024, 0, 15, 10, 47, 30, 250);
		parity("roundToNearestHours", at, { nearestTo: 4 });
		parity("roundToNearestHours", at, { nearestTo: 1, roundingMethod: "floor" });
		parity("roundToNearestHours", at, { nearestTo: 0 });
		parity("roundToNearestHours", at, { nearestTo: 13 });
		parity("roundToNearestMinutes", at, { nearestTo: 15 });
		parity("roundToNearestMinutes", at, { nearestTo: 30 });
		parity("roundToNearestMinutes", at, { nearestTo: 31 });
		parity("roundToNearestMinutes", at, { nearestTo: 5, roundingMethod: "ceil" });
	});

	it("isExists calendar validation", () => {
		parity("isExists", 2024, 1, 29);
		parity("isExists", 2023, 1, 29);
		parity("isExists", 2024, -1, 32);
		parity("isExists", 0, 0, 1);
	});
});

describe("date-fns parity: format family", () => {
	const dates: unknown[] = [
		new Date(1727745600123),
		new Date(0),
		new Date(2023, 11, 31, 23, 59, 59, 999),
		new Date(2024, 0, 1),
		new Date(2024, 1, 29),
		new Date(1999, 11, 31, 12, 30),
		new Date(1582, 9, 15),
		"2014-01-31",
		1704067200000,
		new Date(NaN),
		new Date(100, 0, 1),
		new Date(-1, 0, 1),
		new Date(2024, 5, 15, 10, 30, 45, 123),
	];
	const patterns = [
		"yyyy-MM-dd",
		"yyyy-MM-dd HH:mm:ss",
		"EEE, MMM d yyyy",
		"do 'day' of LLLL yyyy",
		"Qo yyyy",
		"ww-ii",
		"GGGG w eee",
		"yyyy-MM-dd'T'HH:mm:ss.SSSXXX",
		"P",
		"PPpp",
		"ppppp",
		"''",
		"'escaped' yyyy",
		"h:mm:ss a",
		"kk:mm:ss",
		"MMMM do, yyyy",
		"cccccc",
		"iiii io",
		"D RRRR",
		"d/M/yy",
		"yy YY YYYY D DD",
		"z",
		"",
	];

	it("format across dates and patterns", () => {
		for (const d of dates)
			for (const f of patterns) parityAny("format", d, f);
	});

	it("format with options (week rules, in, tokens)", () => {
		const base = new Date(2024, 2, 10, 5, 5, 5, 5);
		const optsList: unknown[] = [
			{
				weekStartsOn: 1,
				firstWeekContainsDate: 4,
				roundingMethod: "ceil",
				nearestTo: 5,
				step: 2,
				inclusive: true,
				assertPositive: false,
			},
			{ in: (v: unknown) => new Date(v as string | number | Date) },
			{ weekStartsOn: 1 },
			{ firstWeekContainsDate: 4 },
			{ useAdditionalWeekYearTokens: true },
			{ useAdditionalDayOfYearTokens: true },
			{ locale: undefined },
		];
		for (const o of optsList)
			for (const f of patterns.slice(0, 8)) parityAny("format", base, f, o);
	});

	it("formatDate is an alias of format", () => {
		const d = new Date(2024, 5, 15, 10, 30, 45, 123);
		for (const f of patterns) parityAny("formatDate", d, f);
	});

	it("format with empty or bad patterns throws like date-fns", () => {
		const d = new Date(2024, 2, 10, 5, 5, 5, 5);
		parityThrows("format", d, "");
		parityThrows("format", d, "f");
		parityAny("format", new Date(NaN), "yyyy");
	});

	it("lightFormat", () => {
		const lfs = [
			"yyyy-MM-dd",
			"yyyy-MM-dd HH:mm:ss",
			"yyyy-MM-dd'T'HH:mm:ss.SSS",
			"d MMM yyyy",
			"''",
			"'x' yyyy",
			"z",
		];
		for (const d of dates)
			for (const f of lfs) parityAny("lightFormat", d, f);
	});

	it("formatters / longFormatters / lightFormatters / parsers objects", () => {
		parityObject("formatters");
		parityObject("longFormatters");
		parityObject("lightFormatters");
		parityObject("parsers");
	});
});

describe("date-fns parity: parse family", () => {
	const ref = new Date(2019, 5, 15);
	const pairs: [string, string][] = [
		["2016-02-12", "yyyy-MM-dd"],
		["2016-02-12", "yy-MM-dd"],
		["02/12/2016", "MM/dd/yyyy"],
		["12 Feb 2016", "dd MMM yyyy"],
		["12 Febr 2016", "dd MMMM yyyy"],
		["14th", "do"],
		["Q1 2016", "QQQ yyyy"],
		["2013.Febr.21", "yyyy.MMMM.dd"],
		["16:49", "HH:mm"],
		["16:49:59,999", "HH:mm:ss,SSS"],
		["Feb", "MMM"],
		["12", "d"],
		["12 2015", "dd yyyy"],
		["12 2015", "d yyyy"],
		["12 AM", "HH a"],
		["2016-02-12T16:49:59.123Z", "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'"],
		["2016", "Y"],
		["2016", "R"],
		["2016-06", "yyyy-MM"],
		["6:30 PM", "h:mm a"],
		["12:00 pm", "hh:mm a"],
		["2016-02-12", "yyyy-MM-dd e"],
		["Sunday", "eeee"],
		["Sun", "EEE"],
		["2", "i"],
		["3", "c"],
		["Anno Domini 2016", "GGGG yyyy"],
		["2016 AD", "yyyy G"],
		["", ""],
		["2016-02-12xyz", "yyyy-MM-dd"],
		["  2016  ", "yyyy"],
		["it's", "'it''s'"],
		["4 Q3 2015", "d QQQQ yyyy"],
		["2016-02-12T16:49:59+07:00", "yyyy-MM-dd'T'HH:mm:ssXXX"],
		["1000", "yyyy"],
		["99999", "yyyyy"],
		["-5", "yyyy"],
		["17:00:00 2016", "HH:mm:ss yyyy"],
		["2016 12:00 AM", "yyyy hh:mm a"],
	];

	it("parse across formats", () => {
		for (const [str, fmt] of pairs) parityAny("parse", str, fmt, ref);
	});

	it("parse with a second reference date", () => {
		const ref2 = new Date(2024, 0, 1);
		for (const [str, fmt] of pairs.slice(0, 12)) parityAny("parse", str, fmt, ref2);
	});

	it("parse with options", () => {
		const optsList: unknown[] = [
			{ weekStartsOn: 1, firstWeekContainsDate: 4 },
			{ in: (v: unknown) => new Date(v as string | number | Date) },
			{ locale: undefined },
		];
		for (const o of optsList)
			for (const [str, fmt] of pairs.slice(0, 12)) parityAny("parse", str, fmt, ref, o);
		parityAny("parse", "2016", "Y", ref, { weekStartsOn: 1, firstWeekContainsDate: 4 });
		parityAny("parse", "3", "e", ref, { weekStartsOn: 1 });
		parityAny("parse", "3", "c", ref, { weekStartsOn: 3 });
		parityAny("parse", "53", "w", ref, { weekStartsOn: 1 });
	});

	it("parse incompatible / protected / edge inputs", () => {
		parityThrows("parse", "12 AM", "HH a", ref);
		parityAny("parse", "16", "yy", ref);
		parityAny("parse", "16", "YYYY", ref);
		parityAny("parse", "2016-02-12", "D", ref);
		parityAny("parse", "x", "", ref);
		parityAny("parse", "", "", new Date(NaN));
		parityAny("parse", "2016", "yyyy", new Date(NaN));
	});

	it("isMatch", () => {
		const pairsM: [string, string][] = [
			["2016-02-12", "yyyy-MM-dd"],
			["2016-2-12", "yyyy-MM-dd"],
			["foo", "yyyy"],
			["", ""],
			["2016", "yyyy"],
			["12 AM", "HH a"],
			["Sun", "EEE"],
			["2016-02-12", "yyyy-MM-dd HH"],
		];
		for (const [str, fmt] of pairsM) parityAny("isMatch", str, fmt);
		parityThrows("isMatch", "12 AM", "HH a");
		parity("isMatch", "2016-02-12", "yyyy-MM-dd", {
			weekStartsOn: 1,
			firstWeekContainsDate: 4,
		});
	});
});

describe("date-fns parity: ISO & RFC", () => {
	const isoStrings = [
		"2019-06-11T05:46:54.472Z",
		"2019-06-11",
		"2019",
		"2019-06",
		"2019-161",
		"2019-W24-3",
		"2019-06-11T05:46:54",
		"2019-06-11T05:46:54.472+07:00",
		"2019-06-11T05:46:54-05:30",
		"2019-06-11T05:46",
		"2019-06-11 05:46:54",
		"invalid",
		"",
		"1000-01-01",
		"1970-01-01T00:00:00.000Z",
		"+002019-06-11",
		"2019-06-11T24:00:00",
		"2019-06-11T05:46:60",
		"2019-02-30",
		"2019-W54-1",
		"05:46:54",
	];

	it("parseISO", () => {
		for (const s of isoStrings) parity("parseISO", s);
		for (const digits of [0, 1, 2])
			for (const s of isoStrings.slice(0, 8))
				parity("parseISO", s, { additionalDigits: digits });
		for (const s of isoStrings.slice(0, 6))
			parity("parseISO", s, { in: (v: unknown) => new Date(v as string | number | Date) });
	});

	it("parseJSON", () => {
		const jsonStrings = [
			"2019-06-11T05:46:54.472Z",
			"2019-06-11T05:46:54",
			"2019-06-11 05:46:54.472Z",
			"2019-06-11T05:46:54.472",
			"2019-06-11T05:46:54+02:00",
			"2019-06-11T05:46:54-0200",
			"2019-06-11T05:46:54.",
			"invalid",
			"",
			"2019-06-11T05:46:54.4729999Z",
		];
		for (const s of jsonStrings) parity("parseJSON", s);
		parity("parseJSON", jsonStrings[0] as string, {
			in: (v: unknown) => new Date(v as string | number | Date),
		});
	});

	const dates: unknown[] = [
		new Date(1727745600123),
		new Date(0),
		new Date(2023, 11, 31, 23, 59, 59, 999),
		new Date(2024, 0, 1),
		new Date(NaN),
		new Date(-1, 0, 1),
		new Date(2024, 5, 15, 10, 30, 45, 123),
	];

	it("formatISO / formatISO9075", () => {
		const optsList: unknown[] = [
			undefined,
			{ format: "extended" },
			{ format: "basic" },
			{ representation: "date" },
			{ representation: "time" },
			{ format: "basic", representation: "date" },
			{ format: "basic", representation: "time" },
		];
		for (const fn of ["formatISO", "formatISO9075"] as const) {
			for (const d of dates) {
				parityAny(fn, d);
				for (const o of optsList) parityAny(fn, d, o);
			}
		}
	});

	it("formatRFC3339", () => {
		for (const d of dates) {
			parityAny("formatRFC3339", d);
			for (const fractionDigits of [0, 1, 2, 3])
				parityAny("formatRFC3339", d, { fractionDigits });
		}
	});

	it("formatRFC7231", () => {
		for (const d of dates) parityAny("formatRFC7231", d);
	});

	it("formatISODuration", () => {
		const durations: unknown[] = [
			{},
			{ years: 1, months: 2, days: 3, hours: 4, minutes: 5, seconds: 6 },
			{ years: -1, months: 0, days: 0 },
			{ hours: 24, minutes: 0, seconds: 0 },
			{ milliseconds: 5 },
		];
		for (const dur of durations) parity("formatISODuration", dur);
	});
});

describe("date-fns parity: enUS locale", () => {
	it("enUS locale object matches date-fns/locale enUS", () => {
		expect({ enUS: norm(oursEnUS) }).toEqual({ enUS: norm(theirsEnUS) });
	});
});

describe("date-fns parity: formatDistance family", () => {
	const dates: unknown[] = [
		new Date(2024, 0, 1),
		new Date(2024, 0, 1, 0, 0, 30),
		new Date(2024, 0, 1, 0, 0, 45),
		new Date(2024, 0, 1, 0, 3),
		new Date(2024, 0, 1, 1),
		new Date(2024, 0, 2),
		new Date(2024, 0, 10),
		new Date(2024, 3, 1),
		new Date(2025, 0, 1),
		new Date(2030, 0, 1),
		new Date(NaN),
		"2024-06-15",
	];

	it("formatDistance across pairs and options", () => {
		const opts: unknown[] = [
			undefined,
			{ includeSeconds: true, addSuffix: true },
			{ addSuffix: true },
		];
		for (const a of dates)
			for (const b of dates)
				for (const o of opts)
					parityAny("formatDistance", a, b, ...(o === undefined ? [] : [o]));
	});

	it("formatDistanceStrict with units and rounding", () => {
		const units = ["second", "minute", "hour", "day", "month", "year"];
		const roundings = ["ceil", "floor", "trunc", "round"];
		for (const u of units)
			for (const r of roundings)
				parityAny("formatDistanceStrict", dates[7], dates[1], { unit: u, roundingMethod: r, addSuffix: true });
		parityAny("formatDistanceStrict", new Date(2024, 0, 1), new Date(2024, 0, 1, 0, 0, 30));
		parityAny("formatDistanceStrict", new Date(NaN), new Date(2024, 0, 1));
		parityAny("formatDistanceStrict", "2024-06-15", new Date(2025, 0, 1), { includeSeconds: true } as never);
		parityAny("formatDistance", new Date(2024, 0, 1), new Date(2030, 0, 1));
	});

	it("formatDistanceToNow / formatDistanceToNowStrict (far dates)", () => {
		parity("formatDistanceToNow", new Date(2020, 0, 1));
		parity("formatDistanceToNow", new Date(2035, 6, 15), { addSuffix: true });
		parity("formatDistanceToNowStrict", new Date(2020, 0, 1), { addSuffix: true });
		parity("formatDistanceToNowStrict", new Date(2035, 6, 15), {
			unit: "day",
			roundingMethod: "floor",
		});
	});
});

describe("date-fns parity: formatDuration & formatRelative", () => {
	it("formatDuration with options", () => {
		const durs: unknown[] = [
			{},
			{ years: 1, months: 2, weeks: 3, days: 4, hours: 5, minutes: 6, seconds: 7 },
			{ years: 0, months: 0, days: 0 },
			{ hours: 24 },
			{ minutes: 90, seconds: 30 },
			{ years: -1 },
			{ seconds: 0 },
		];
		const opts: unknown[] = [
			undefined,
			{ zero: true },
			{ delimiter: ", " },
			{ format: ["years", "months"] },
			{ format: ["hours", "minutes", "seconds"], zero: true },
			{ format: ["days"], delimiter: "/" },
			{ zero: true, delimiter: "" },
		];
		for (const d of durs)
			for (const o of opts)
				parityAny("formatDuration", d, ...(o === undefined ? [] : [o]));
	});

	it("formatRelative across day offsets", () => {
		const base = new Date(2024, 5, 15, 12);
		const offsets = [-400, -7, -6, -2, -1, 0, 1, 6, 7, 20];
		for (const d of offsets) {
			const date = new Date(2024, 5, 15 + d, 12);
			parity("formatRelative", date, base);
			parity("formatRelative", date, base, { weekStartsOn: 1 });
			parity("formatRelative", date, base, { weekStartsOn: 3 });
		}
		parityAny("formatRelative", new Date(NaN), base);
		parity("formatRelative", new Date(2024, 5, 15, 11), new Date(2024, 5, 15, 13));
	});
});

describe("date-fns parity: intlFormat & intlFormatDistance", () => {
	it("intlFormat overloads", () => {
		const d = new Date(2024, 5, 15, 10, 30, 45);
		parity("intlFormat", d);
		parity("intlFormat", d, { year: "numeric" });
		parity("intlFormat", d, { dateStyle: "full", timeStyle: "short" });
		parity("intlFormat", d, { timeZone: "UTC", year: "numeric", month: "2-digit" });
		parity("intlFormat", d, { locale: "en-US" });
		parity("intlFormat", d, { locale: ["en-US", "id"] });
		parity("intlFormat", new Date(0), { timeZone: "UTC" }, { locale: "en-US" });
		parityAny("intlFormat", new Date(NaN));
	});

	it("intlFormatDistance with unit option", () => {
		const units = [
			undefined,
			"second",
			"minute",
			"hour",
			"day",
			"week",
			"month",
			"quarter",
			"year",
		];
		const pairs: [unknown, unknown][] = [
			[new Date(2024, 5, 15), new Date(2024, 5, 15)],
			[new Date(2024, 5, 15), new Date(2024, 5, 15, 0, 0, 30)],
			[new Date(2024, 5, 15), new Date(2024, 5, 15, 0, 5)],
			[new Date(2024, 5, 15), new Date(2024, 5, 14)],
			[new Date(2024, 5, 15), new Date(2024, 4, 15)],
			[new Date(2024, 5, 15), new Date(2023, 5, 15)],
			[new Date(2024, 5, 15), new Date(2020, 5, 15)],
			[new Date(NaN), new Date(2024, 5, 15)],
		];
		for (const [a, b] of pairs)
			for (const u of units)
				parityAny("intlFormatDistance", a, b, ...(u === undefined ? [] : [{ unit: u }]));
		parity("intlFormatDistance", new Date(2024, 5, 15), new Date(2024, 5, 8), {
			locale: "en-US",
			numeric: "always",
		});
		parityAny("intlFormatDistance", new Date(2024, 5, 15), new Date(2024, 5, 8), {
			style: "long",
			numeric: "never",
		});
	});
});
