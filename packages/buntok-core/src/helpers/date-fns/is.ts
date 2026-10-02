import { addDays } from "./add";
import { subDays } from "./sub";
import {
	endOfDay,
	endOfMonth,
	startOfDay,
	startOfHour,
	startOfISOWeekYear,
	startOfMinute,
	startOfMonth,
	startOfQuarter,
	startOfSecond,
	startOfWeek,
} from "./start-end";
import { normalizeDates } from "./_lib/normalize-dates";
import { constructFrom, constructNow, toDate } from "./_lib/to-date";
import type { ContextOptions, DateArg, Interval, LocalizedOptions, WeekOptions } from "./_lib/types";

export function isDate(value: unknown): value is Date {
	return (
		value instanceof Date ||
		(typeof value === "object" &&
			Object.prototype.toString.call(value) === "[object Date]")
	);
}

export function isValid(date: unknown): boolean {
	return !((!isDate(date) && typeof date !== "number") || isNaN(+toDate(date)));
}

export function isAfter(
	date: DateArg<Date> & {},
	dateToCompare: DateArg<Date> & {},
): boolean {
	return +toDate(date) > +toDate(dateToCompare);
}

export function isBefore(
	date: DateArg<Date> & {},
	dateToCompare: DateArg<Date> & {},
): boolean {
	return +toDate(date) < +toDate(dateToCompare);
}

export interface IsSameDayOptions extends ContextOptions<Date> {}

export function isSameDay(
	laterDate: DateArg<Date> & {},
	earlierDate: DateArg<Date> & {},
	options?: IsSameDayOptions,
): boolean {
	const [dateLeft_, dateRight_] = normalizeDates(
		options?.in,
		laterDate,
		earlierDate,
	);
	return +startOfDay(dateLeft_) === +startOfDay(dateRight_);
}

export interface IsSameHourOptions extends ContextOptions<Date> {}

export function isSameHour(
	dateLeft: DateArg<Date> & {},
	dateRight: DateArg<Date> & {},
	options?: IsSameHourOptions,
): boolean {
	const [dateLeft_, dateRight_] = normalizeDates(
		options?.in,
		dateLeft,
		dateRight,
	);
	return +startOfHour(dateLeft_) === +startOfHour(dateRight_);
}

export function isSameMinute(
	laterDate: DateArg<Date> & {},
	earlierDate: DateArg<Date> & {},
): boolean {
	return +startOfMinute(laterDate) === +startOfMinute(earlierDate);
}

export interface IsSameMonthOptions extends ContextOptions<Date> {}

export function isSameMonth(
	laterDate: DateArg<Date> & {},
	earlierDate: DateArg<Date> & {},
	options?: IsSameMonthOptions,
): boolean {
	const [laterDate_, earlierDate_] = normalizeDates(
		options?.in,
		laterDate,
		earlierDate,
	);
	return (
		laterDate_.getFullYear() === earlierDate_.getFullYear() &&
		laterDate_.getMonth() === earlierDate_.getMonth()
	);
}

export interface IsSameQuarterOptions extends ContextOptions<Date> {}

export function isSameQuarter(
	laterDate: DateArg<Date> & {},
	earlierDate: DateArg<Date> & {},
	options?: IsSameQuarterOptions,
): boolean {
	const [dateLeft_, dateRight_] = normalizeDates(
		options?.in,
		laterDate,
		earlierDate,
	);
	return +startOfQuarter(dateLeft_) === +startOfQuarter(dateRight_);
}

export function isSameSecond(
	laterDate: DateArg<Date> & {},
	earlierDate: DateArg<Date> & {},
): boolean {
	return +startOfSecond(laterDate) === +startOfSecond(earlierDate);
}

export interface IsSameISOWeekOptions extends ContextOptions<Date> {}

export function isSameISOWeek(
	laterDate: DateArg<Date> & {},
	earlierDate: DateArg<Date> & {},
	options?: IsSameISOWeekOptions,
): boolean {
	return isSameWeek(laterDate, earlierDate, { ...options, weekStartsOn: 1 });
}

export interface IsSameISOWeekYearOptions extends ContextOptions<Date> {}

export function isSameISOWeekYear(
	laterDate: DateArg<Date> & {},
	earlierDate: DateArg<Date> & {},
	options?: IsSameISOWeekYearOptions,
): boolean {
	const [laterDate_, earlierDate_] = normalizeDates(
		options?.in,
		laterDate,
		earlierDate,
	);
	return +startOfISOWeekYear(laterDate_) === +startOfISOWeekYear(earlierDate_);
}

export interface IsSameWeekOptions
	extends WeekOptions,
		LocalizedOptions<"options">,
		ContextOptions<Date> {}

export function isSameWeek(
	laterDate: DateArg<Date> & {},
	earlierDate: DateArg<Date> & {},
	options?: IsSameWeekOptions,
): boolean {
	const [laterDate_, earlierDate_] = normalizeDates(
		options?.in,
		laterDate,
		earlierDate,
	);
	return (
		+startOfWeek(laterDate_, options) === +startOfWeek(earlierDate_, options)
	);
}

export interface IsSameYearOptions extends ContextOptions<Date> {}

export function isSameYear(
	laterDate: DateArg<Date> & {},
	earlierDate: DateArg<Date> & {},
	options?: IsSameYearOptions,
): boolean {
	const [laterDate_, earlierDate_] = normalizeDates(
		options?.in,
		laterDate,
		earlierDate,
	);
	return laterDate_.getFullYear() === earlierDate_.getFullYear();
}

export interface IsThisHourOptions extends ContextOptions<Date> {}

export function isThisHour(
	date: DateArg<Date> & {},
	options?: IsThisHourOptions,
): boolean {
	return isSameHour(toDate(date, options?.in), constructNow(options?.in || date));
}

export interface IsThisISOWeekOptions extends ContextOptions<Date> {}

export function isThisISOWeek(
	date: DateArg<Date> & {},
	options?: IsThisISOWeekOptions,
): boolean {
	return isSameISOWeek(
		constructFrom(options?.in || date, date),
		constructNow(options?.in || date),
	);
}

export function isThisMinute(date: DateArg<Date> & {}): boolean {
	return isSameMinute(date, constructNow(date));
}

export interface IsThisMonthOptions extends ContextOptions<Date> {}

export function isThisMonth(
	date: DateArg<Date> & {},
	options?: IsThisMonthOptions,
): boolean {
	return isSameMonth(
		constructFrom(options?.in || date, date),
		constructNow(options?.in || date),
	);
}

export interface IsThisQuarterOptions extends ContextOptions<Date> {}

export function isThisQuarter(
	date: DateArg<Date> & {},
	options?: IsThisQuarterOptions,
): boolean {
	return isSameQuarter(
		constructFrom(options?.in || date, date),
		constructNow(options?.in || date),
	);
}

export function isThisSecond(date: DateArg<Date> & {}): boolean {
	return isSameSecond(date, constructNow(date));
}

export interface IsThisWeekOptions
	extends WeekOptions,
		LocalizedOptions<"options">,
		ContextOptions<Date> {}

export function isThisWeek(
	date: DateArg<Date> & {},
	options?: IsThisWeekOptions,
): boolean {
	return isSameWeek(
		constructFrom(options?.in || date, date),
		constructNow(options?.in || date),
		options,
	);
}

export interface IsThisYearOptions extends ContextOptions<Date> {}

export function isThisYear(
	date: DateArg<Date> & {},
	options?: IsThisYearOptions,
): boolean {
	return isSameYear(
		constructFrom(options?.in || date, date),
		constructNow(options?.in || date),
	);
}

export interface IsTodayOptions extends ContextOptions<Date> {}

export function isToday(
	date: DateArg<Date> & {},
	options?: IsTodayOptions,
): boolean {
	return isSameDay(
		constructFrom(options?.in || date, date),
		constructNow(options?.in || date),
	);
}

export interface IsTomorrowOptions extends ContextOptions<Date> {}

export function isTomorrow(
	date: DateArg<Date> & {},
	options?: IsTomorrowOptions,
): boolean {
	return isSameDay(date, addDays(constructNow(options?.in || date), 1), options);
}

export interface IsYesterdayOptions extends ContextOptions<Date> {}

export function isYesterday(
	date: DateArg<Date> & {},
	options?: IsYesterdayOptions,
): boolean {
	return isSameDay(
		constructFrom(options?.in || date, date),
		subDays(constructNow(options?.in || date), 1),
	);
}

export function isFuture(date: DateArg<Date> & {}): boolean {
	return +toDate(date) > Date.now();
}

export function isPast(date: DateArg<Date> & {}): boolean {
	return +toDate(date) < Date.now();
}

export interface IsFirstDayOfMonthOptions extends ContextOptions<Date> {}

export function isFirstDayOfMonth(
	date: DateArg<Date> & {},
	options?: IsFirstDayOfMonthOptions,
): boolean {
	return toDate(date, options?.in).getDate() === 1;
}

export interface IsLastDayOfMonthOptions extends ContextOptions<Date> {}

export function isLastDayOfMonth(
	date: DateArg<Date> & {},
	options?: IsLastDayOfMonthOptions,
): boolean {
	const _date = toDate(date, options?.in);
	return +endOfDay(_date, options) === +endOfMonth(_date, options);
}

export interface IsLeapYearOptions extends ContextOptions<Date> {}

export function isLeapYear(
	date: DateArg<Date> & {},
	options?: IsLeapYearOptions,
): boolean {
	const _date = toDate(date, options?.in);
	const year = _date.getFullYear();
	return year % 400 === 0 || (year % 4 === 0 && year % 100 !== 0);
}

export interface IsWeekendOptions extends ContextOptions<Date> {}

export function isWeekend(
	date: DateArg<Date> & {},
	options?: IsWeekendOptions,
): boolean {
	const day = toDate(date, options?.in).getDay();
	return day === 0 || day === 6;
}

export interface IsWithinIntervalOptions extends ContextOptions<Date> {}

export function isWithinInterval(
	date: DateArg<Date> & {},
	interval: Interval,
	options?: IsWithinIntervalOptions,
): boolean {
	const time = +toDate(date, options?.in);
	const sortedTimes = [
		+toDate(interval.start, options?.in),
		+toDate(interval.end, options?.in),
	].sort((a, b) => a - b);
	const startTime = sortedTimes[0] as number;
	const endTime = sortedTimes[1] as number;

	return time >= startTime && time <= endTime;
}

export interface IsMondayOptions extends ContextOptions<Date> {}

export function isMonday(
	date: DateArg<Date> & {},
	options?: IsMondayOptions,
): boolean {
	return toDate(date, options?.in).getDay() === 1;
}

export interface IsTuesdayOptions extends ContextOptions<Date> {}

export function isTuesday(
	date: DateArg<Date> & {},
	options?: IsTuesdayOptions,
): boolean {
	return toDate(date, options?.in).getDay() === 2;
}

export interface IsWednesdayOptions extends ContextOptions<Date> {}

export function isWednesday(
	date: DateArg<Date> & {},
	options?: IsWednesdayOptions,
): boolean {
	return toDate(date, options?.in).getDay() === 3;
}

export interface IsThursdayOptions extends ContextOptions<Date> {}

export function isThursday(
	date: DateArg<Date> & {},
	options?: IsThursdayOptions,
): boolean {
	return toDate(date, options?.in).getDay() === 4;
}

export interface IsFridayOptions extends ContextOptions<Date> {}

export function isFriday(
	date: DateArg<Date> & {},
	options?: IsFridayOptions,
): boolean {
	return toDate(date, options?.in).getDay() === 5;
}

export interface IsSaturdayOptions extends ContextOptions<Date> {}

export function isSaturday(
	date: DateArg<Date> & {},
	options?: IsSaturdayOptions,
): boolean {
	return toDate(date, options?.in).getDay() === 6;
}

export interface IsSundayOptions extends ContextOptions<Date> {}

export function isSunday(
	date: DateArg<Date> & {},
	options?: IsSundayOptions,
): boolean {
	return toDate(date, options?.in).getDay() === 0;
}
