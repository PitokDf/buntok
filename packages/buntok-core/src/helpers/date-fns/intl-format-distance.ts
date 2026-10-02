import {
	differenceInCalendarDays,
	differenceInCalendarMonths,
	differenceInCalendarQuarters,
	differenceInCalendarWeeks,
	differenceInCalendarYears,
	differenceInHours,
	differenceInMinutes,
	differenceInSeconds,
} from "./difference";
import {
	secondsInDay,
	secondsInHour,
	secondsInMinute,
	secondsInMonth,
	secondsInQuarter,
	secondsInWeek,
	secondsInYear,
} from "./_lib/constants";
import { normalizeDates } from "./_lib/normalize-dates";
import type { ContextOptions, DateArg, MaybeArray } from "./_lib/types";

export interface IntlFormatDistanceOptions
	extends Intl.RelativeTimeFormatOptions,
		ContextOptions<Date> {
	unit?: IntlFormatDistanceUnit;
	locale?: MaybeArray<Intl.ResolvedDateTimeFormatOptions["locale"]>;
}

export type IntlFormatDistanceUnit =
	| "year"
	| "quarter"
	| "month"
	| "week"
	| "day"
	| "hour"
	| "minute"
	| "second";

export function intlFormatDistance(
	laterDate: DateArg<Date> & {},
	earlierDate: DateArg<Date> & {},
	options?: IntlFormatDistanceOptions,
): string {
	let value = 0;
	let unit: IntlFormatDistanceUnit;
	const [laterDate_, earlierDate_] = normalizeDates(
		options?.in,
		laterDate,
		earlierDate,
	);
	if (!options?.unit) {
		const diffInSeconds = differenceInSeconds(laterDate_, earlierDate_);
		if (Math.abs(diffInSeconds) < secondsInMinute) {
			value = differenceInSeconds(laterDate_, earlierDate_);
			unit = "second";
		} else if (Math.abs(diffInSeconds) < secondsInHour) {
			value = differenceInMinutes(laterDate_, earlierDate_);
			unit = "minute";
		} else if (
			Math.abs(diffInSeconds) < secondsInDay &&
			Math.abs(differenceInCalendarDays(laterDate_, earlierDate_)) < 1
		) {
			value = differenceInHours(laterDate_, earlierDate_);
			unit = "hour";
		} else if (
			Math.abs(diffInSeconds) < secondsInWeek &&
			(value = differenceInCalendarDays(laterDate_, earlierDate_)) &&
			Math.abs(value) < 7
		) {
			unit = "day";
		} else if (Math.abs(diffInSeconds) < secondsInMonth) {
			value = differenceInCalendarWeeks(laterDate_, earlierDate_);
			unit = "week";
		} else if (Math.abs(diffInSeconds) < secondsInQuarter) {
			value = differenceInCalendarMonths(laterDate_, earlierDate_);
			unit = "month";
		} else if (Math.abs(diffInSeconds) < secondsInYear) {
			if (differenceInCalendarQuarters(laterDate_, earlierDate_) < 4) {
				value = differenceInCalendarQuarters(laterDate_, earlierDate_);
				unit = "quarter";
			} else {
				value = differenceInCalendarYears(laterDate_, earlierDate_);
				unit = "year";
			}
		} else {
			value = differenceInCalendarYears(laterDate_, earlierDate_);
			unit = "year";
		}
	} else {
		unit = options.unit;
		if (unit === "second") {
			value = differenceInSeconds(laterDate_, earlierDate_);
		} else if (unit === "minute") {
			value = differenceInMinutes(laterDate_, earlierDate_);
		} else if (unit === "hour") {
			value = differenceInHours(laterDate_, earlierDate_);
		} else if (unit === "day") {
			value = differenceInCalendarDays(laterDate_, earlierDate_);
		} else if (unit === "week") {
			value = differenceInCalendarWeeks(laterDate_, earlierDate_);
		} else if (unit === "month") {
			value = differenceInCalendarMonths(laterDate_, earlierDate_);
		} else if (unit === "quarter") {
			value = differenceInCalendarQuarters(laterDate_, earlierDate_);
		} else if (unit === "year") {
			value = differenceInCalendarYears(laterDate_, earlierDate_);
		}
	}
	const rtf = new Intl.RelativeTimeFormat(options?.locale, {
		numeric: "auto",
		...options,
	});
	return rtf.format(value, unit);
}
