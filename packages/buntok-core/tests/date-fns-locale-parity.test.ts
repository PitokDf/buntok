import { describe, expect, it } from "bun:test";
import * as theirs from "date-fns";
import * as theirsLocale from "date-fns/locale";
import * as ours from "../src/date";
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

const LOCALES = Object.keys(oursLocale) as (keyof typeof oursLocale)[];

function ourLocale(name: string) {
	return oursLocale[name as keyof typeof oursLocale];
}

function theirLocale(name: string) {
	return theirsLocale[name as keyof typeof theirsLocale];
}

const REF = new Date(2024, 9, 1, 14, 30, 45);
const ALT = new Date(2019, 5, 15, 8, 5, 9);

const FORMAT_TOKENS = [
	"P",
	"PP",
	"PPP",
	"PPPP",
	"p",
	"pp",
	"ppp",
	"pppp",
	"EEEE d LLLL yyyy",
	"ccc yyyy",
	"QQQ yyyy",
	"do MMMM",
	"wo ww",
	"h:mm:ss a",
	"HH:mm XXX",
	"G",
	"GGGG",
];

describe("date-fns locale parity: objects", () => {
	it("every locale object deep-matches date-fns (95 total)", () => {
		for (const name of LOCALES) {
			const label = `locale ${name}`;
			expect({ label, got: norm(ourLocale(name)) }).toEqual({
				label,
				got: norm(theirLocale(name)),
			});
		}
	});
});

describe("date-fns locale parity: format", () => {
	it("format with every locale matches date-fns", () => {
		for (const name of LOCALES) {
			const ourL = ourLocale(name);
			const theirL = theirLocale(name);
			for (const [i, date] of [REF, ALT].entries()) {
				for (const token of FORMAT_TOKENS) {
					both(`format ${name} ${token} @${i}`, () => {
						return ours.format(date, token, { locale: ourL });
					}, () => {
						return theirs.format(date, token, { locale: theirL });
					});
				}
			}
		}
	});
});

const FORMAT_DISTANCE_PAIRS: [Date, Date][] = [
	[new Date(2024, 9, 1, 14, 30, 46), REF],
	[REF, new Date(2024, 9, 1, 14, 31, 45)],
	[new Date(2024, 9, 1, 15, 30, 45), REF],
	[new Date(2024, 8, 30, 14, 30, 45), REF],
	[new Date(2024, 9, 4, 14, 30, 45), REF],
	[new Date(2025, 0, 5, 14, 30, 45), REF],
	[new Date(2023, 2, 10, 14, 30, 45), REF],
];

const FORMAT_DISTANCE_OPTS: {
	addSuffix?: boolean;
	includeSeconds?: boolean;
}[] = [{}, { addSuffix: true }, { includeSeconds: true }];

describe("date-fns locale parity: formatDistance", () => {
	it("formatDistance with every locale matches date-fns", () => {
		for (const name of LOCALES) {
			const ourL = ourLocale(name);
			const theirL = theirLocale(name);
			for (const [i, pair] of FORMAT_DISTANCE_PAIRS.entries()) {
				for (const [j, opts] of FORMAT_DISTANCE_OPTS.entries()) {
					both(`formatDistance ${name} pair${i} opt${j}`, () => {
						return ours.formatDistance(pair[0], pair[1], { ...opts, locale: ourL });
					}, () => {
						return theirs.formatDistance(pair[0], pair[1], { ...opts, locale: theirL });
					});
				}
			}
		}
	});
});

const STRICT_PAIRS: [Date, Date][] = [
	[REF, new Date(2024, 9, 1, 14, 29, 15)],
	[REF, new Date(2024, 9, 2, 14, 30, 45)],
	[REF, new Date(2023, 9, 1, 14, 30, 45)],
];

const STRICT_OPTS: {
	addSuffix?: boolean;
	roundingMethod?: "ceil";
	unit?: "second" | "minute" | "hour" | "day" | "month" | "year";
}[] = [
	{},
	{ addSuffix: true },
	{ unit: "minute" },
	{ unit: "day" },
	{ unit: "year", addSuffix: true },
	{ roundingMethod: "ceil" },
];

describe("date-fns locale parity: formatDistanceStrict", () => {
	it("formatDistanceStrict with every locale matches date-fns", () => {
		for (const name of LOCALES) {
			const ourL = ourLocale(name);
			const theirL = theirLocale(name);
			for (const [i, pair] of STRICT_PAIRS.entries()) {
				for (const [j, opts] of STRICT_OPTS.entries()) {
					both(`formatDistanceStrict ${name} pair${i} opt${j}`, () => {
						return ours.formatDistanceStrict(pair[0], pair[1], { ...opts, locale: ourL });
					}, () => {
						return theirs.formatDistanceStrict(pair[0], pair[1], { ...opts, locale: theirL });
					});
				}
			}
		}
	});
});

const RELATIVE_DATES = [
	REF,
	new Date(2024, 9, 2, 14, 30, 45),
	new Date(2024, 8, 30, 14, 30, 45),
	new Date(2024, 9, 4, 14, 30, 45),
	new Date(2024, 8, 27, 14, 30, 45),
	new Date(2024, 9, 11, 14, 30, 45),
	new Date(2024, 8, 11, 14, 30, 45),
	new Date(2024, 10, 11, 14, 30, 45),
	new Date(2023, 7, 27, 14, 30, 45),
];

describe("date-fns locale parity: formatRelative", () => {
	it("formatRelative with every locale matches date-fns", () => {
		for (const name of LOCALES) {
			const ourL = ourLocale(name);
			const theirL = theirLocale(name);
			for (const [i, date] of RELATIVE_DATES.entries()) {
				both(`formatRelative ${name} @${i}`, () => {
					return ours.formatRelative(date, REF, { locale: ourL });
				}, () => {
					return theirs.formatRelative(date, REF, { locale: theirL });
				});
			}
		}
	});
});

const LONG_FNS = ["date", "time", "dateTime"] as const;
const LONG_WIDTHS = ["full", "long", "medium", "short", "any"] as const;

describe("date-fns locale parity: formatLong", () => {
	it("formatLong with every locale matches date-fns", () => {
		for (const name of LOCALES) {
			const ourL = ourLocale(name);
			const theirL = theirLocale(name);
			for (const fn of LONG_FNS) {
				for (const width of LONG_WIDTHS) {
					both(`formatLong ${name} ${fn} ${width}`, () => {
						return ourL.formatLong[fn]({ width });
					}, () => {
						return theirL.formatLong[fn]({ width });
					});
				}
			}
		}
	});
});

const ERAS = [0, 1] as const;
const ERA_WIDTHS = ["abbreviated", "wide", "narrow"] as const;
const QUARTERS = [1, 2, 3, 4] as const;
const QUARTER_WIDTHS = ["abbreviated", "narrow"] as const;
const MONTHS = [0, 3, 11] as const;
const DAYS = [0, 3, 6] as const;
const DAY_WIDTHS = ["abbreviated", "wide", "narrow"] as const;
const DAY_PERIODS = ["am", "pm", "midnight", "noon", "morning", "night"] as const;
const PERIOD_WIDTHS = ["abbreviated", "narrow"] as const;
const ORDINAL_NUMBERS = [0, 1, 2, 3, 11, 21, 100, 101] as const;
const ORDINAL_UNITS = ["day", "year", "minute"] as const;

describe("date-fns locale parity: localize", () => {
	it("localize fns with every locale match date-fns", () => {
		for (const name of LOCALES) {
			const ourL = ourLocale(name);
			const theirL = theirLocale(name);
			for (const value of ERAS) {
				for (const width of ERA_WIDTHS) {
					both(`localize.era ${name} ${value} ${width}`, () => {
						return ourL.localize.era(value, { width });
					}, () => {
						return theirL.localize.era(value, { width });
					});
				}
			}
			for (const value of QUARTERS) {
				for (const width of QUARTER_WIDTHS) {
					both(`localize.quarter ${name} ${value} ${width}`, () => {
						return ourL.localize.quarter(value, { width });
					}, () => {
						return theirL.localize.quarter(value, { width });
					});
				}
			}
			for (const value of MONTHS) {
				for (const width of DAY_WIDTHS) {
					both(`localize.month ${name} ${value} ${width}`, () => {
						return ourL.localize.month(value, { width });
					}, () => {
						return theirL.localize.month(value, { width });
					});
				}
			}
			for (const value of DAYS) {
				for (const width of DAY_WIDTHS) {
					both(`localize.day ${name} ${value} ${width}`, () => {
						return ourL.localize.day(value, { width });
					}, () => {
						return theirL.localize.day(value, { width });
					});
				}
			}
			for (const value of DAY_PERIODS) {
				for (const width of PERIOD_WIDTHS) {
					both(`localize.dayPeriod ${name} ${value} ${width}`, () => {
						return ourL.localize.dayPeriod(value, { width });
					}, () => {
						return theirL.localize.dayPeriod(value, { width });
					});
				}
			}
			for (const value of ORDINAL_NUMBERS) {
				for (const unit of ORDINAL_UNITS) {
					both(`localize.ordinalNumber ${name} ${value} ${unit}`, () => {
						return ourL.localize.ordinalNumber(value, { unit });
					}, () => {
						return theirL.localize.ordinalNumber(value, { unit });
					});
				}
			}
		}
	});
});

const MATCH_ERA = ["BC", "AD"] as const;
const MATCH_QUARTER = ["Q1", "Q4", "1"] as const;
const MATCH_MONTH = ["Jan", "Jun", "Dec"] as const;
const MATCH_DAY = ["Mon", "Fri", "Sun"] as const;
const MATCH_PERIOD = ["AM", "PM", "noon", "morning"] as const;
const MATCH_ORDINAL: [string, "day" | "year" | "hour"][] = [
	["1st", "day"],
	["2nd", "day"],
	["11th", "hour"],
	["21st", "day"],
	["2024", "year"],
];

describe("date-fns locale parity: match", () => {
	it("match fns with every locale match date-fns", () => {
		for (const name of LOCALES) {
			const ourL = ourLocale(name);
			const theirL = theirLocale(name);
			for (const value of MATCH_ERA) {
				for (const width of ["abbreviated", "narrow"] as const) {
					both(`match.era ${name} ${value} ${width}`, () => {
						return ourL.match.era(value, { width });
					}, () => {
						return theirL.match.era(value, { width });
					});
				}
			}
			for (const value of MATCH_QUARTER) {
				for (const width of ["abbreviated", "narrow"] as const) {
					both(`match.quarter ${name} ${value} ${width}`, () => {
						return ourL.match.quarter(value, { width });
					}, () => {
						return theirL.match.quarter(value, { width });
					});
				}
			}
			for (const value of MATCH_MONTH) {
				both(`match.month ${name} ${value}`, () => {
					return ourL.match.month(value, { width: "abbreviated" });
				}, () => {
					return theirL.match.month(value, { width: "abbreviated" });
				});
			}
			for (const value of MATCH_DAY) {
				both(`match.day ${name} ${value}`, () => {
					return ourL.match.day(value, { width: "abbreviated" });
				}, () => {
					return theirL.match.day(value, { width: "abbreviated" });
				});
			}
			for (const value of MATCH_PERIOD) {
				both(`match.dayPeriod ${name} ${value}`, () => {
					return ourL.match.dayPeriod(value, { width: "abbreviated" });
				}, () => {
					return theirL.match.dayPeriod(value, { width: "abbreviated" });
				});
			}
			for (const [value, unit] of MATCH_ORDINAL) {
				both(`match.ordinalNumber ${name} ${value} ${unit}`, () => {
					return ourL.match.ordinalNumber(value, { unit });
				}, () => {
					return theirL.match.ordinalNumber(value, { unit });
				});
			}
		}
	});
});

const PARSE_FMTS = ["PPpp", "EEEE d LLLL yyyy", "h:mm a", "yyyy-MM-dd"];

describe("date-fns locale parity: parse roundtrip", () => {
	it("parse and isMatch with every locale match date-fns", () => {
		for (const name of LOCALES) {
			const ourL = ourLocale(name);
			const theirL = theirLocale(name);
			for (const fmt of PARSE_FMTS) {
				const str = theirs.format(REF, fmt, { locale: theirL });
				both(`parse ${name} ${fmt}`, () => {
					return ours.parse(str, fmt, REF, { locale: ourL });
				}, () => {
					return theirs.parse(str, fmt, REF, { locale: theirL });
				});
				both(`isMatch ${name} ${fmt}`, () => {
					return ours.isMatch(str, fmt, { locale: ourL });
				}, () => {
					return theirs.isMatch(str, fmt, { locale: theirL });
				});
			}
		}
	});
});

const WEEK_OPTS: { weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6 }[] = [
	{},
	{ weekStartsOn: 0 },
	{ weekStartsOn: 3 },
	{ weekStartsOn: 6 },
];

describe("date-fns locale parity: getWeek", () => {
	it("getWeek and getWeekYear with every locale match date-fns", () => {
		for (const name of LOCALES) {
			const ourL = ourLocale(name);
			const theirL = theirLocale(name);
			for (const [i, opts] of WEEK_OPTS.entries()) {
				both(`getWeek ${name} opt${i}`, () => {
					return ours.getWeek(REF, { ...opts, locale: ourL });
				}, () => {
					return theirs.getWeek(REF, { ...opts, locale: theirL });
				});
				both(`getWeekYear ${name} opt${i}`, () => {
					return ours.getWeekYear(REF, { ...opts, locale: ourL });
				}, () => {
					return theirs.getWeekYear(REF, { ...opts, locale: theirL });
				});
			}
		}
	});
});

const DURATIONS: Record<string, number>[] = [
	{ days: 1, hours: 2, minutes: 30 },
	{ seconds: 45 },
	{ months: 2, weeks: 1 },
];

describe("date-fns locale parity: formatDuration", () => {
	it("formatDuration with every locale matches date-fns", () => {
		for (const name of LOCALES) {
			const ourL = ourLocale(name);
			const theirL = theirLocale(name);
			for (const [i, duration] of DURATIONS.entries()) {
				both(`formatDuration ${name} #${i}`, () => {
					return ours.formatDuration(duration, { locale: ourL });
				}, () => {
					return theirs.formatDuration(duration, { locale: theirL });
				});
			}
		}
	});
});
