import { addDays } from "./add";
import { subISOWeekYears } from "./sub";
import { compareAsc } from "./math";
import { getISOWeekYear, getQuarter } from "./get";
import { isLastDayOfMonth, isValid, isWeekend, isSameDay } from "./is";
import { normalizeDates } from "./_lib/normalize-dates";
import { getRoundingMethod } from "./_lib/rounding";
import { getTimezoneOffsetInMilliseconds } from "./_lib/timezone";
import { toDate } from "./_lib/to-date";
import {
	millisecondsInDay,
	millisecondsInHour,
	millisecondsInMinute,
	millisecondsInWeek,
} from "./_lib/constants";
import type {
	ContextOptions,
	DateArg,
	LocalizedOptions,
	RoundingOptions,
	WeekOptions,
} from "./_lib/types";
import { startOfDay, startOfISOWeek, startOfWeek } from "./start-end";

function compareLocalAsc(laterDate: Date, earlierDate: Date): number {
	const diff =
		laterDate.getFullYear() - earlierDate.getFullYear() ||
		laterDate.getMonth() - earlierDate.getMonth() ||
		laterDate.getDate() - earlierDate.getDate() ||
		laterDate.getHours() - earlierDate.getHours() ||
		laterDate.getMinutes() - earlierDate.getMinutes() ||
		laterDate.getSeconds() - earlierDate.getSeconds() ||
		laterDate.getMilliseconds() - earlierDate.getMilliseconds();

	if (diff < 0) return -1;
	if (diff > 0) return 1;

	return diff;
}

export interface DifferenceInBusinessDaysOptions extends ContextOptions<Date> {}

export function differenceInBusinessDays(
	laterDate: DateArg<Date> & {},
	earlierDate: DateArg<Date> & {},
	options?: DifferenceInBusinessDaysOptions | undefined,
): number {
	const [laterDate_, earlierDate_] = normalizeDates(
		options?.in,
		laterDate,
		earlierDate,
	);

	if (!isValid(laterDate_) || !isValid(earlierDate_)) return Number.NaN;

	const diff = differenceInCalendarDays(laterDate_, earlierDate_);
	const sign = diff < 0 ? -1 : 1;
	const weeks = Math.trunc(diff / 7);

	let result = weeks * 5;
	let movingDate = addDays(earlierDate_, weeks * 7);

	while (!isSameDay(laterDate_, movingDate)) {
		result += isWeekend(movingDate, options) ? 0 : sign;
		movingDate = addDays(movingDate, sign);
	}

	return result === 0 ? 0 : result;
}

export interface DifferenceInCalendarDaysOptions
	extends ContextOptions<Date> {}

export function differenceInCalendarDays(
	laterDate: DateArg<Date> & {},
	earlierDate: DateArg<Date> & {},
	options?: DifferenceInCalendarDaysOptions | undefined,
): number {
	const [laterDate_, earlierDate_] = normalizeDates(
		options?.in,
		laterDate,
		earlierDate,
	);

	const laterStartOfDay = startOfDay(laterDate_);
	const earlierStartOfDay = startOfDay(earlierDate_);

	const laterTimestamp =
		+laterStartOfDay - getTimezoneOffsetInMilliseconds(laterStartOfDay);
	const earlierTimestamp =
		+earlierStartOfDay - getTimezoneOffsetInMilliseconds(earlierStartOfDay);

	return Math.round((laterTimestamp - earlierTimestamp) / millisecondsInDay);
}

export interface DifferenceInCalendarISOWeekYearsOptions
	extends ContextOptions<Date> {}

export function differenceInCalendarISOWeekYears(
	laterDate: DateArg<Date> & {},
	earlierDate: DateArg<Date> & {},
	options?: DifferenceInCalendarISOWeekYearsOptions | undefined,
): number {
	const [laterDate_, earlierDate_] = normalizeDates(
		options?.in,
		laterDate,
		earlierDate,
	);
	return (
		getISOWeekYear(laterDate_, options) - getISOWeekYear(earlierDate_, options)
	);
}

export interface DifferenceInCalendarISOWeeksOptions
	extends ContextOptions<Date> {}

export function differenceInCalendarISOWeeks(
	laterDate: DateArg<Date> & {},
	earlierDate: DateArg<Date> & {},
	options?: DifferenceInCalendarISOWeeksOptions | undefined,
): number {
	const [laterDate_, earlierDate_] = normalizeDates(
		options?.in,
		laterDate,
		earlierDate,
	);

	const startOfISOWeekLeft = startOfISOWeek(laterDate_);
	const startOfISOWeekRight = startOfISOWeek(earlierDate_);

	const timestampLeft =
		+startOfISOWeekLeft - getTimezoneOffsetInMilliseconds(startOfISOWeekLeft);
	const timestampRight =
		+startOfISOWeekRight - getTimezoneOffsetInMilliseconds(startOfISOWeekRight);

	return Math.round((timestampLeft - timestampRight) / millisecondsInWeek);
}

export interface DifferenceInCalendarMonthsOptions
	extends ContextOptions<Date> {}

export function differenceInCalendarMonths(
	laterDate: DateArg<Date> & {},
	earlierDate: DateArg<Date> & {},
	options?: DifferenceInCalendarMonthsOptions | undefined,
): number {
	const [laterDate_, earlierDate_] = normalizeDates(
		options?.in,
		laterDate,
		earlierDate,
	);

	const yearsDiff = laterDate_.getFullYear() - earlierDate_.getFullYear();
	const monthsDiff = laterDate_.getMonth() - earlierDate_.getMonth();

	return yearsDiff * 12 + monthsDiff;
}

export interface DifferenceInCalendarQuartersOptions
	extends ContextOptions<Date> {}

export function differenceInCalendarQuarters(
	laterDate: DateArg<Date> & {},
	earlierDate: DateArg<Date> & {},
	options?: DifferenceInCalendarQuartersOptions | undefined,
): number {
	const [laterDate_, earlierDate_] = normalizeDates(
		options?.in,
		laterDate,
		earlierDate,
	);

	const yearsDiff = laterDate_.getFullYear() - earlierDate_.getFullYear();
	const quartersDiff = getQuarter(laterDate_) - getQuarter(earlierDate_);

	return yearsDiff * 4 + quartersDiff;
}

export interface DifferenceInCalendarWeeksOptions
	extends LocalizedOptions<"options">,
		WeekOptions,
		ContextOptions<Date> {}

export function differenceInCalendarWeeks(
	laterDate: DateArg<Date> & {},
	earlierDate: DateArg<Date> & {},
	options?: DifferenceInCalendarWeeksOptions | undefined,
): number {
	const [laterDate_, earlierDate_] = normalizeDates(
		options?.in,
		laterDate,
		earlierDate,
	);

	const laterStartOfWeek = startOfWeek(laterDate_, options);
	const earlierStartOfWeek = startOfWeek(earlierDate_, options);

	const laterTimestamp =
		+laterStartOfWeek - getTimezoneOffsetInMilliseconds(laterStartOfWeek);
	const earlierTimestamp =
		+earlierStartOfWeek - getTimezoneOffsetInMilliseconds(earlierStartOfWeek);

	return Math.round((laterTimestamp - earlierTimestamp) / millisecondsInWeek);
}

export interface DifferenceInCalendarYearsOptions extends ContextOptions<Date> {}

export function differenceInCalendarYears(
	laterDate: DateArg<Date> & {},
	earlierDate: DateArg<Date> & {},
	options?: DifferenceInCalendarYearsOptions | undefined,
): number {
	const [laterDate_, earlierDate_] = normalizeDates(
		options?.in,
		laterDate,
		earlierDate,
	);
	return laterDate_.getFullYear() - earlierDate_.getFullYear();
}

export interface DifferenceInDaysOptions extends ContextOptions<Date> {}

export function differenceInDays(
	laterDate: DateArg<Date> & {},
	earlierDate: DateArg<Date> & {},
	options?: DifferenceInDaysOptions | undefined,
): number {
	const [laterDate_, earlierDate_] = normalizeDates(
		options?.in,
		laterDate,
		earlierDate,
	);

	const sign = compareLocalAsc(laterDate_, earlierDate_);
	const difference = Math.abs(
		differenceInCalendarDays(laterDate_, earlierDate_),
	);

	laterDate_.setDate(laterDate_.getDate() - sign * difference);

	const isLastDayNotFull = Number(
		compareLocalAsc(laterDate_, earlierDate_) === -sign,
	);

	const result = sign * (difference - isLastDayNotFull);
	return result === 0 ? 0 : result;
}

export interface DifferenceInHoursOptions
	extends RoundingOptions,
		ContextOptions<Date> {}

export function differenceInHours(
	laterDate: DateArg<Date> & {},
	earlierDate: DateArg<Date> & {},
	options?: DifferenceInHoursOptions | undefined,
): number {
	const [laterDate_, earlierDate_] = normalizeDates(
		options?.in,
		laterDate,
		earlierDate,
	);
	const diff = (+laterDate_ - +earlierDate_) / millisecondsInHour;
	return getRoundingMethod(options?.roundingMethod)(diff);
}

export interface DifferenceInISOWeekYearsOptions extends ContextOptions<Date> {}

export function differenceInISOWeekYears(
	laterDate: DateArg<Date> & {},
	earlierDate: DateArg<Date> & {},
	options?: DifferenceInISOWeekYearsOptions | undefined,
): number {
	const [laterDate_, earlierDate_] = normalizeDates(
		options?.in,
		laterDate,
		earlierDate,
	);

	const sign = compareAsc(laterDate_, earlierDate_);
	const diff = Math.abs(
		differenceInCalendarISOWeekYears(laterDate_, earlierDate_, options),
	);

	const adjustedDate = subISOWeekYears(laterDate_, sign * diff, options);

	const isLastISOWeekYearNotFull = Number(
		compareAsc(adjustedDate, earlierDate_) === -sign,
	);
	const result = sign * (diff - isLastISOWeekYearNotFull);

	return result === 0 ? 0 : result;
}

export function differenceInMilliseconds(
	laterDate: DateArg<Date> & {},
	earlierDate: DateArg<Date> & {},
): number {
	return +toDate(laterDate) - +toDate(earlierDate);
}

export interface DifferenceInMinutesOptions extends RoundingOptions {}

export function differenceInMinutes(
	dateLeft: DateArg<Date> & {},
	dateRight: DateArg<Date> & {},
	options?: DifferenceInMinutesOptions | undefined,
): number {
	const diff =
		differenceInMilliseconds(dateLeft, dateRight) / millisecondsInMinute;
	return getRoundingMethod(options?.roundingMethod)(diff);
}

export interface DifferenceInMonthsOptions extends ContextOptions<Date> {}

export function differenceInMonths(
	laterDate: DateArg<Date> & {},
	earlierDate: DateArg<Date> & {},
	options?: DifferenceInMonthsOptions | undefined,
): number {
	const [laterDate_, workingLaterDate, earlierDate_] = normalizeDates(
		options?.in,
		laterDate,
		laterDate,
		earlierDate,
	);

	const sign = compareAsc(workingLaterDate, earlierDate_);
	const difference = Math.abs(
		differenceInCalendarMonths(workingLaterDate, earlierDate_),
	);

	if (difference < 1) return 0;

	if (workingLaterDate.getMonth() === 1 && workingLaterDate.getDate() > 27)
		workingLaterDate.setDate(30);

	workingLaterDate.setMonth(workingLaterDate.getMonth() - sign * difference);

	let isLastMonthNotFull = compareAsc(workingLaterDate, earlierDate_) === -sign;

	if (
		isLastDayOfMonth(laterDate_) &&
		difference === 1 &&
		compareAsc(laterDate_, earlierDate_) === 1
	) {
		isLastMonthNotFull = false;
	}

	const result = sign * (difference - Number(isLastMonthNotFull));
	return result === 0 ? 0 : result;
}

export interface DifferenceInQuartersOptions
	extends RoundingOptions,
		ContextOptions<Date> {}

export function differenceInQuarters(
	laterDate: DateArg<Date> & {},
	earlierDate: DateArg<Date> & {},
	options?: DifferenceInQuartersOptions | undefined,
): number {
	const diff = differenceInMonths(laterDate, earlierDate, options) / 3;
	return getRoundingMethod(options?.roundingMethod)(diff);
}

export interface DifferenceInSecondsOptions extends RoundingOptions {}

export function differenceInSeconds(
	laterDate: DateArg<Date> & {},
	earlierDate: DateArg<Date> & {},
	options?: DifferenceInSecondsOptions | undefined,
): number {
	const diff = differenceInMilliseconds(laterDate, earlierDate) / 1000;
	return getRoundingMethod(options?.roundingMethod)(diff);
}

export interface DifferenceInWeeksOptions
	extends RoundingOptions,
		ContextOptions<Date> {}

export function differenceInWeeks(
	laterDate: DateArg<Date> & {},
	earlierDate: DateArg<Date> & {},
	options?: DifferenceInWeeksOptions | undefined,
): number {
	const diff = differenceInDays(laterDate, earlierDate, options) / 7;
	return getRoundingMethod(options?.roundingMethod)(diff);
}

export interface DifferenceInYearsOptions extends ContextOptions<Date> {}

export function differenceInYears(
	laterDate: DateArg<Date> & {},
	earlierDate: DateArg<Date> & {},
	options?: DifferenceInYearsOptions | undefined,
): number {
	const [laterDate_, earlierDate_] = normalizeDates(
		options?.in,
		laterDate,
		earlierDate,
	);

	const sign = compareAsc(laterDate_, earlierDate_);

	const diff = Math.abs(differenceInCalendarYears(laterDate_, earlierDate_));

	laterDate_.setFullYear(1584);
	earlierDate_.setFullYear(1584);

	const partial = compareAsc(laterDate_, earlierDate_) === -sign;

	const result = sign * (diff - Number(partial));

	return result === 0 ? 0 : result;
}
