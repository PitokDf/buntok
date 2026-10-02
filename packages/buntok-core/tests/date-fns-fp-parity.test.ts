import { describe, expect, it } from "bun:test";
import * as theirsFp from "date-fns/fp";
import * as theirsLocale from "date-fns/locale";
import * as ours from "../src/date-fp";
import * as oursLocale from "../src/helpers/date-fns/locale/index";

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

function both(label: string, a: () => unknown, b: () => unknown): void {
	const cap = (f: () => unknown): string => {
		try {
			const json = JSON.stringify(norm(f()));
			return `ok: ${json === undefined ? "undefined" : json}`;
		} catch (e) {
			const err = e as Error;
			return `ERR ${err.constructor.name}: ${err.message}`;
		}
	};
	expect({ label, got: cap(a) }).toEqual({ label, got: cap(b) });
}

const loose = (f: unknown): ((...args: unknown[]) => unknown) =>
	f as (...args: unknown[]) => unknown;

function arityOf(fn: (...args: unknown[]) => unknown): number {
	for (let n = 1; n <= 6; n++) {
		try {
			const result = fn(...Array(n).fill(undefined));
			if (typeof result !== "function") return n;
		} catch {
			return n;
		}
	}
	return -1;
}

const oursRecord = ours as unknown as Record<string, unknown>;
const theirsRecord = theirsFp as unknown as Record<string, unknown>;

describe("date-fns fp parity: wiring (396 total)", () => {
	it("every fp export matches date-fns/fp across curry states", () => {
		const names = Object.keys(theirsRecord).filter((name) => {
			return typeof theirsRecord[name] === "function";
		});
		for (const name of names) {
			expect({ name, type: typeof oursRecord[name] }).toEqual({
				name,
				type: "function",
			});
			const ourFn = loose(oursRecord[name]);
			const theirFn = loose(theirsRecord[name]);
			const arity = arityOf(theirFn);
			expect({ name, arity: arity >= 1 }).toEqual({ name, arity: true });
			for (let k = 0; k <= arity; k++) {
				both(`fp ${name} arity${k}`, () => {
					return ourFn(...Array(k).fill(undefined));
				}, () => {
					return theirFn(...Array(k).fill(undefined));
				});
			}
		}
	});
});

const REF = new Date(2024, 9, 1, 14, 30, 45);
const ALT = new Date(2019, 5, 15, 8, 5, 9);

describe("date-fns fp parity: curry mechanics", () => {
	it("partial, empty and over-application behave like date-fns", () => {
		both("fp addDays full", () => loose(ours.addDays)(2, ALT), () => {
			return loose(theirsFp.addDays)(2, ALT);
		});
		both("fp addDays partial", () => loose(ours.addDays)(2)(ALT), () => {
			return loose(theirsFp.addDays)(2)(ALT);
		});
		both("fp addDays empty chain", () => {
			return loose(ours.addDays)()(2)(ALT);
		}, () => loose(theirsFp.addDays)()(2)(ALT));
		both("fp addDays over-apply", () => {
			return loose(ours.addDays)(2, ALT, "extra");
		}, () => loose(theirsFp.addDays)(2, ALT, "extra"));
		both("fp getTime full", () => loose(ours.getTime)(REF), () => {
			return loose(theirsFp.getTime)(REF);
		});
		both("fp getTime partial", () => loose(ours.getTime)()(REF), () => {
			return loose(theirsFp.getTime)()(REF);
		});
		both("fp toDate", () => loose(ours.toDate)(1392098430000), () => {
			return loose(theirsFp.toDate)(1392098430000);
		});
		both("fp constructFrom", () => {
			return loose(ours.constructFrom)(REF, 1392098430000);
		}, () => loose(theirsFp.constructFrom)(REF, 1392098430000));
		both("fp compareAsc", () => loose(ours.compareAsc)(REF, ALT), () => {
			return loose(theirsFp.compareAsc)(REF, ALT);
		});
		both("fp milliseconds", () => loose(ours.milliseconds)(REF), () => {
			return loose(theirsFp.milliseconds)(REF);
		});
	});
});

describe("date-fns fp parity: realistic samples", () => {
	it("fp functions with options and locales match date-fns", () => {
		const ourL = oursLocale.enUS;
		const theirL = theirsLocale.enUS;
		both("fp differenceInCalendarDays", () => {
			return loose(ours.differenceInCalendarDays)(REF, ALT);
		}, () => loose(theirsFp.differenceInCalendarDays)(REF, ALT));
		both("fp addBusinessDays", () => loose(ours.addBusinessDays)(3, ALT), () => {
			return loose(theirsFp.addBusinessDays)(3, ALT);
		});
		both("fp min", () => loose(ours.min)([REF, ALT]), () => {
			return loose(theirsFp.min)([REF, ALT]);
		});
		both("fp isLeapYear", () => loose(ours.isLeapYear)(ALT), () => {
			return loose(theirsFp.isLeapYear)(ALT);
		});
		both("fp formatWithOptions", () => {
			return loose(ours.formatWithOptions)({ locale: ourL }, "PPPP p", REF);
		}, () => loose(theirsFp.formatWithOptions)({ locale: theirL }, "PPPP p", REF));
		both("fp formatRelativeWithOptions", () => {
			return loose(ours.formatRelativeWithOptions)({ locale: ourL }, REF, new Date(2024, 9, 2, 14, 30, 45));
		}, () => loose(theirsFp.formatRelativeWithOptions)({ locale: theirL }, REF, new Date(2024, 9, 2, 14, 30, 45)));
		both("fp formatDistanceWithOptions", () => {
			return loose(ours.formatDistanceWithOptions)({ addSuffix: true }, ALT, REF);
		}, () => loose(theirsFp.formatDistanceWithOptions)({ addSuffix: true }, ALT, REF));
		both("fp formatDistanceStrictWithOptions", () => {
			return loose(ours.formatDistanceStrictWithOptions)({ unit: "minute", addSuffix: true }, REF, ALT);
		}, () => loose(theirsFp.formatDistanceStrictWithOptions)({ unit: "minute", addSuffix: true }, REF, ALT));
		both("fp getWeekWithOptions", () => {
			return loose(ours.getWeekWithOptions)({ weekStartsOn: 1, locale: ourL }, REF);
		}, () => loose(theirsFp.getWeekWithOptions)({ weekStartsOn: 1, locale: theirL }, REF));
		both("fp isSameDayWithOptions", () => {
			return loose(ours.isSameDayWithOptions)({ weekStartsOn: 1 }, ALT, REF);
		}, () => loose(theirsFp.isSameDayWithOptions)({ weekStartsOn: 1 }, ALT, REF));
		both("fp parseWithOptions", () => {
			return loose(ours.parseWithOptions)(
				{ locale: ourL },
				REF,
				"yyyy-MM-dd",
				"2024-10-01",
			);
		}, () => loose(theirsFp.parseWithOptions)(
			{ locale: theirL },
			REF,
			"yyyy-MM-dd",
			"2024-10-01",
		));
		both("fp lightFormat partial", () => loose(ours.lightFormat)("yyyyMMdd")(REF), () => {
			return loose(theirsFp.lightFormat)("yyyyMMdd")(REF);
		});
		both("fp roundToNearestMinutesWithOptions", () => {
			return loose(ours.roundToNearestMinutesWithOptions)({ nearestTo: 15 }, REF);
		}, () => loose(theirsFp.roundToNearestMinutesWithOptions)({ nearestTo: 15 }, REF));
		both("fp eachDayOfIntervalWithOptions", () => {
			return loose(ours.eachDayOfIntervalWithOptions)(
				{ weekStartsOn: 1 },
				{ start: ALT, end: new Date(2019, 5, 18, 8, 5, 9) },
			);
		}, () => loose(theirsFp.eachDayOfIntervalWithOptions)(
			{ weekStartsOn: 1 },
			{ start: ALT, end: new Date(2019, 5, 18, 8, 5, 9) },
		));
		both("fp setWithOptions", () => {
			return loose(ours.setWithOptions)({ locale: ourL }, { years: 2030 }, REF);
		}, () => loose(theirsFp.setWithOptions)({ locale: theirL }, { years: 2030 }, REF));
		both("fp intervalToDuration", () => {
			return loose(ours.intervalToDuration)({ start: ALT, end: REF });
		}, () => loose(theirsFp.intervalToDuration)({ start: ALT, end: REF }));
		both("fp intlFormat", () => loose(ours.intlFormat)(REF, { dateStyle: "full" }), () => {
			return loose(theirsFp.intlFormat)(REF, { dateStyle: "full" });
		});
		both("fp nextMonday", () => loose(ours.nextMonday)(ALT), () => {
			return loose(theirsFp.nextMonday)(ALT);
		});
		both("fp getDayOfYear", () => loose(ours.getDayOfYear)(REF), () => {
			return loose(theirsFp.getDayOfYear)(REF);
		});
		both("fp exists", () => loose(ours.isExists)(2024, 9, 1), () => {
			return loose(theirsFp.isExists)(2024, 9, 1);
		});
	});
});
