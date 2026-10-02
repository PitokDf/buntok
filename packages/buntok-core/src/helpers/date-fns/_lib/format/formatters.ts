import {
	getDayOfYear,
	getISOWeek,
	getISOWeekYear,
	getWeek,
	getWeekYear,
} from "../../get";
import type { Day, FirstWeekContainsDate, Month, Quarter } from "../types";
import type { Locale, LocaleDayPeriod, Localize } from "../../locale/types";
import { addLeadingZeros } from "../add-leading-zeros";
import { lightFormatters } from "./light-formatters";

const dayPeriodEnum = {
	am: "am",
	pm: "pm",
	midnight: "midnight",
	noon: "noon",
	morning: "morning",
	afternoon: "afternoon",
	evening: "evening",
	night: "night",
} as const;

export interface FormatterOptions {
	firstWeekContainsDate: FirstWeekContainsDate;
	weekStartsOn: Day;
	locale: Pick<Locale, "options">;
}

export type FormatterFn = (
	date: Date,
	token: string,
	localize: Localize,
	options: FormatterOptions,
) => string;

export const formatters: Record<string, FormatterFn> = {
	G: function (date, token, localize) {
		const era = date.getFullYear() > 0 ? 1 : 0;
		switch (token) {
			case "G":
			case "GG":
			case "GGG":
				return localize.era(era, { width: "abbreviated" });
			case "GGGGG":
				return localize.era(era, { width: "narrow" });
			case "GGGG":
			default:
				return localize.era(era, { width: "wide" });
		}
	},

	y: function (date, token, localize) {
		if (token === "yo") {
			const signedYear = date.getFullYear();
			const year = signedYear > 0 ? signedYear : 1 - signedYear;
			return localize.ordinalNumber(year, { unit: "year" });
		}

		return lightFormatters.y(date, token);
	},

	Y: function (date, token, localize, options) {
		const signedWeekYear = getWeekYear(date, options);
		const weekYear = signedWeekYear > 0 ? signedWeekYear : 1 - signedWeekYear;

		if (token === "YY") {
			const twoDigitYear = weekYear % 100;
			return addLeadingZeros(twoDigitYear, 2);
		}

		if (token === "Yo") {
			return localize.ordinalNumber(weekYear, { unit: "year" });
		}

		return addLeadingZeros(weekYear, token.length);
	},

	R: function (date, token) {
		const isoWeekYear = getISOWeekYear(date);
		return addLeadingZeros(isoWeekYear, token.length);
	},

	u: function (date, token) {
		const year = date.getFullYear();
		return addLeadingZeros(year, token.length);
	},

	Q: function (date, token, localize) {
		const quarter = Math.ceil((date.getMonth() + 1) / 3) as Quarter;
		switch (token) {
			case "Q":
				return String(quarter);
			case "QQ":
				return addLeadingZeros(quarter, 2);
			case "Qo":
				return localize.ordinalNumber(quarter, { unit: "quarter" });
			case "QQQ":
				return localize.quarter(quarter, {
					width: "abbreviated",
					context: "formatting",
				});
			case "QQQQQ":
				return localize.quarter(quarter, {
					width: "narrow",
					context: "formatting",
				});
			case "QQQQ":
			default:
				return localize.quarter(quarter, {
					width: "wide",
					context: "formatting",
				});
		}
	},

	q: function (date, token, localize) {
		const quarter = Math.ceil((date.getMonth() + 1) / 3) as Quarter;
		switch (token) {
			case "q":
				return String(quarter);
			case "qq":
				return addLeadingZeros(quarter, 2);
			case "qo":
				return localize.ordinalNumber(quarter, { unit: "quarter" });
			case "qqq":
				return localize.quarter(quarter, {
					width: "abbreviated",
					context: "standalone",
				});
			case "qqqqq":
				return localize.quarter(quarter, {
					width: "narrow",
					context: "standalone",
				});
			case "qqqq":
			default:
				return localize.quarter(quarter, {
					width: "wide",
					context: "standalone",
				});
		}
	},

	M: function (date, token, localize) {
		const month = date.getMonth() as Month;
		switch (token) {
			case "M":
			case "MM":
				return lightFormatters.M(date, token);
			case "Mo":
				return localize.ordinalNumber(month + 1, { unit: "month" });
			case "MMM":
				return localize.month(month, {
					width: "abbreviated",
					context: "formatting",
				});
			case "MMMMM":
				return localize.month(month, {
					width: "narrow",
					context: "formatting",
				});
			case "MMMM":
			default:
				return localize.month(month, { width: "wide", context: "formatting" });
		}
	},

	L: function (date, token, localize) {
		const month = date.getMonth() as Month;
		switch (token) {
			case "L":
				return String(month + 1);
			case "LL":
				return addLeadingZeros(month + 1, 2);
			case "Lo":
				return localize.ordinalNumber(month + 1, { unit: "month" });
			case "LLL":
				return localize.month(month, {
					width: "abbreviated",
					context: "standalone",
				});
			case "LLLLL":
				return localize.month(month, {
					width: "narrow",
					context: "standalone",
				});
			case "LLLL":
			default:
				return localize.month(month, { width: "wide", context: "standalone" });
		}
	},

	w: function (date, token, localize, options) {
		const week = getWeek(date, options);

		if (token === "wo") {
			return localize.ordinalNumber(week, { unit: "week" });
		}

		return addLeadingZeros(week, token.length);
	},

	I: function (date, token, localize) {
		const isoWeek = getISOWeek(date);

		if (token === "Io") {
			return localize.ordinalNumber(isoWeek, { unit: "week" });
		}

		return addLeadingZeros(isoWeek, token.length);
	},

	d: function (date, token, localize) {
		if (token === "do") {
			return localize.ordinalNumber(date.getDate(), { unit: "date" });
		}

		return lightFormatters.d(date, token);
	},

	D: function (date, token, localize) {
		const dayOfYear = getDayOfYear(date);

		if (token === "Do") {
			return localize.ordinalNumber(dayOfYear, { unit: "dayOfYear" });
		}

		return addLeadingZeros(dayOfYear, token.length);
	},

	E: function (date, token, localize) {
		const dayOfWeek = date.getDay() as Day;
		switch (token) {
			case "E":
			case "EE":
			case "EEE":
				return localize.day(dayOfWeek, {
					width: "abbreviated",
					context: "formatting",
				});
			case "EEEEE":
				return localize.day(dayOfWeek, {
					width: "narrow",
					context: "formatting",
				});
			case "EEEEEE":
				return localize.day(dayOfWeek, {
					width: "short",
					context: "formatting",
				});
			case "EEEE":
			default:
				return localize.day(dayOfWeek, {
					width: "wide",
					context: "formatting",
				});
		}
	},

	e: function (date, token, localize, options) {
		const dayOfWeek = date.getDay() as Day;
		const localDayOfWeek = (dayOfWeek - options.weekStartsOn + 8) % 7 || 7;
		switch (token) {
			case "e":
				return String(localDayOfWeek);
			case "ee":
				return addLeadingZeros(localDayOfWeek, 2);
			case "eo":
				return localize.ordinalNumber(localDayOfWeek, { unit: "day" });
			case "eee":
				return localize.day(dayOfWeek, {
					width: "abbreviated",
					context: "formatting",
				});
			case "eeeee":
				return localize.day(dayOfWeek, {
					width: "narrow",
					context: "formatting",
				});
			case "eeeeee":
				return localize.day(dayOfWeek, {
					width: "short",
					context: "formatting",
				});
			case "eeee":
			default:
				return localize.day(dayOfWeek, {
					width: "wide",
					context: "formatting",
				});
		}
	},

	c: function (date, token, localize, options) {
		const dayOfWeek = date.getDay() as Day;
		const localDayOfWeek = (dayOfWeek - options.weekStartsOn + 8) % 7 || 7;
		switch (token) {
			case "c":
				return String(localDayOfWeek);
			case "cc":
				return addLeadingZeros(localDayOfWeek, token.length);
			case "co":
				return localize.ordinalNumber(localDayOfWeek, { unit: "day" });
			case "ccc":
				return localize.day(dayOfWeek, {
					width: "abbreviated",
					context: "standalone",
				});
			case "ccccc":
				return localize.day(dayOfWeek, {
					width: "narrow",
					context: "standalone",
				});
			case "cccccc":
				return localize.day(dayOfWeek, {
					width: "short",
					context: "standalone",
				});
			case "cccc":
			default:
				return localize.day(dayOfWeek, {
					width: "wide",
					context: "standalone",
				});
		}
	},

	i: function (date, token, localize) {
		const dayOfWeek = date.getDay() as Day;
		const isoDayOfWeek = dayOfWeek === 0 ? 7 : dayOfWeek;
		switch (token) {
			case "i":
				return String(isoDayOfWeek);
			case "ii":
				return addLeadingZeros(isoDayOfWeek, token.length);
			case "io":
				return localize.ordinalNumber(isoDayOfWeek, { unit: "day" });
			case "iii":
				return localize.day(dayOfWeek, {
					width: "abbreviated",
					context: "formatting",
				});
			case "iiiii":
				return localize.day(dayOfWeek, {
					width: "narrow",
					context: "formatting",
				});
			case "iiiiii":
				return localize.day(dayOfWeek, {
					width: "short",
					context: "formatting",
				});
			case "iiii":
			default:
				return localize.day(dayOfWeek, {
					width: "wide",
					context: "formatting",
				});
		}
	},

	a: function (date, token, localize) {
		const hours = date.getHours();
		const dayPeriodEnumValue = hours / 12 >= 1 ? "pm" : "am";

		switch (token) {
			case "a":
			case "aa":
				return localize.dayPeriod(dayPeriodEnumValue, {
					width: "abbreviated",
					context: "formatting",
				});
			case "aaa":
				return localize
					.dayPeriod(dayPeriodEnumValue, {
						width: "abbreviated",
						context: "formatting",
					})
					.toLowerCase();
			case "aaaaa":
				return localize.dayPeriod(dayPeriodEnumValue, {
					width: "narrow",
					context: "formatting",
				});
			case "aaaa":
			default:
				return localize.dayPeriod(dayPeriodEnumValue, {
					width: "wide",
					context: "formatting",
				});
		}
	},

	b: function (date, token, localize) {
		const hours = date.getHours();
		let dayPeriodEnumValue: LocaleDayPeriod;
		if (hours === 12) {
			dayPeriodEnumValue = dayPeriodEnum.noon;
		} else if (hours === 0) {
			dayPeriodEnumValue = dayPeriodEnum.midnight;
		} else {
			dayPeriodEnumValue = hours / 12 >= 1 ? "pm" : "am";
		}

		switch (token) {
			case "b":
			case "bb":
				return localize.dayPeriod(dayPeriodEnumValue, {
					width: "abbreviated",
					context: "formatting",
				});
			case "bbb":
				return localize
					.dayPeriod(dayPeriodEnumValue, {
						width: "abbreviated",
						context: "formatting",
					})
					.toLowerCase();
			case "bbbbb":
				return localize.dayPeriod(dayPeriodEnumValue, {
					width: "narrow",
					context: "formatting",
				});
			case "bbbb":
			default:
				return localize.dayPeriod(dayPeriodEnumValue, {
					width: "wide",
					context: "formatting",
				});
		}
	},

	B: function (date, token, localize) {
		const hours = date.getHours();
		let dayPeriodEnumValue: LocaleDayPeriod;
		if (hours >= 17) {
			dayPeriodEnumValue = dayPeriodEnum.evening;
		} else if (hours >= 12) {
			dayPeriodEnumValue = dayPeriodEnum.afternoon;
		} else if (hours >= 4) {
			dayPeriodEnumValue = dayPeriodEnum.morning;
		} else {
			dayPeriodEnumValue = dayPeriodEnum.night;
		}

		switch (token) {
			case "B":
			case "BB":
			case "BBB":
				return localize.dayPeriod(dayPeriodEnumValue, {
					width: "abbreviated",
					context: "formatting",
				});
			case "BBBBB":
				return localize.dayPeriod(dayPeriodEnumValue, {
					width: "narrow",
					context: "formatting",
				});
			case "BBBB":
			default:
				return localize.dayPeriod(dayPeriodEnumValue, {
					width: "wide",
					context: "formatting",
				});
		}
	},

	h: function (date, token, localize) {
		if (token === "ho") {
			let hours = date.getHours() % 12;
			if (hours === 0) hours = 12;
			return localize.ordinalNumber(hours, { unit: "hour" });
		}

		return lightFormatters.h(date, token);
	},

	H: function (date, token, localize) {
		if (token === "Ho") {
			return localize.ordinalNumber(date.getHours(), { unit: "hour" });
		}

		return lightFormatters.H(date, token);
	},

	K: function (date, token, localize) {
		const hours = date.getHours() % 12;

		if (token === "Ko") {
			return localize.ordinalNumber(hours, { unit: "hour" });
		}

		return addLeadingZeros(hours, token.length);
	},

	k: function (date, token, localize) {
		let hours = date.getHours();
		if (hours === 0) hours = 24;

		if (token === "ko") {
			return localize.ordinalNumber(hours, { unit: "hour" });
		}

		return addLeadingZeros(hours, token.length);
	},

	m: function (date, token, localize) {
		if (token === "mo") {
			return localize.ordinalNumber(date.getMinutes(), { unit: "minute" });
		}

		return lightFormatters.m(date, token);
	},

	s: function (date, token, localize) {
		if (token === "so") {
			return localize.ordinalNumber(date.getSeconds(), { unit: "second" });
		}

		return lightFormatters.s(date, token);
	},

	S: function (date, token) {
		return lightFormatters.S(date, token);
	},

	X: function (date, token) {
		const timezoneOffset = date.getTimezoneOffset();

		if (timezoneOffset === 0) {
			return "Z";
		}

		switch (token) {
			case "X":
				return formatTimezoneWithOptionalMinutes(timezoneOffset);
			case "XXXX":
			case "XX":
				return formatTimezone(timezoneOffset);
			case "XXXXX":
			case "XXX":
			default:
				return formatTimezone(timezoneOffset, ":");
		}
	},

	x: function (date, token) {
		const timezoneOffset = date.getTimezoneOffset();

		switch (token) {
			case "x":
				return formatTimezoneWithOptionalMinutes(timezoneOffset);
			case "xxxx":
			case "xx":
				return formatTimezone(timezoneOffset);
			case "xxxxx":
			case "xxx":
			default:
				return formatTimezone(timezoneOffset, ":");
		}
	},

	O: function (date, token) {
		const timezoneOffset = date.getTimezoneOffset();

		switch (token) {
			case "O":
			case "OO":
			case "OOO":
				return "GMT" + formatTimezoneShort(timezoneOffset, ":");
			case "OOOO":
			default:
				return "GMT" + formatTimezone(timezoneOffset, ":");
		}
	},

	z: function (date, token) {
		const timezoneOffset = date.getTimezoneOffset();

		switch (token) {
			case "z":
			case "zz":
			case "zzz":
				return "GMT" + formatTimezoneShort(timezoneOffset, ":");
			case "zzzz":
			default:
				return "GMT" + formatTimezone(timezoneOffset, ":");
		}
	},

	t: function (date, token) {
		const timestamp = Math.trunc(+date / 1000);
		return addLeadingZeros(timestamp, token.length);
	},

	T: function (date, token) {
		return addLeadingZeros(+date, token.length);
	},
} as const;

function formatTimezoneShort(offset: number, delimiter = ""): string {
	const sign = offset > 0 ? "-" : "+";
	const absOffset = Math.abs(offset);
	const hours = Math.trunc(absOffset / 60);
	const minutes = absOffset % 60;
	if (minutes === 0) {
		return sign + String(hours);
	}
	return sign + String(hours) + delimiter + addLeadingZeros(minutes, 2);
}

function formatTimezoneWithOptionalMinutes(
	offset: number,
	delimiter?: string,
): string {
	if (offset % 60 === 0) {
		const sign = offset > 0 ? "-" : "+";
		return sign + addLeadingZeros(Math.abs(offset) / 60, 2);
	}
	return formatTimezone(offset, delimiter);
}

function formatTimezone(offset: number, delimiter = ""): string {
	const sign = offset > 0 ? "-" : "+";
	const absOffset = Math.abs(offset);
	const hours = addLeadingZeros(Math.trunc(absOffset / 60), 2);
	const minutes = addLeadingZeros(absOffset % 60, 2);
	return sign + hours + delimiter + minutes;
}
