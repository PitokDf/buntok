import {
	differenceInCalendarDays,
	differenceInCalendarWeeks,
} from "./difference";
import { addWeeks } from "./add";
import { isLeapYear } from "./is";
import { resolveFirstWeekContainsDate, resolveWeekStartsOn } from "./_lib/options";
import { constructFrom, toDate } from "./_lib/to-date";
import type {
	ContextOptions,
	DateArg,
	LocalizedOptions,
	FirstWeekContainsDateOptions,
	WeekOptions,
} from "./_lib/types";
import {
	lastDayOfMonth,
	startOfISOWeek,
	startOfISOWeekYear,
	startOfMonth,
	startOfWeek,
	startOfWeekYear,
	startOfYear,
} from "./start-end";
import { millisecondsInWeek } from "./_lib/constants";

export interface GetDateOptions extends ContextOptions<Date> {}

export function getDate(
	date: DateArg<Date> & {},
	options?: GetDateOptions,
): number {
	return toDate(date, options?.in).getDate();
}

export interface GetDayOptions extends ContextOptions<Date> {}

export function getDay(
	date: DateArg<Date> & {},
	options?: GetDayOptions,
): number {
	return toDate(date, options?.in).getDay();
}

export interface GetDayOfYearOptions extends ContextOptions<Date> {}

export function getDayOfYear(
	date: DateArg<Date> & {},
	options?: GetDayOfYearOptions,
): number {
	const _date = toDate(date, options?.in);
	const diff = differenceInCalendarDays(_date, startOfYear(_date));
	const dayOfYear = diff + 1;
	return dayOfYear;
}

export interface GetDaysInMonthOptions extends ContextOptions<Date> {}

export function getDaysInMonth(
	date: DateArg<Date> & {},
	options?: GetDaysInMonthOptions,
): number {
	const _date = toDate(date, options?.in);
	const year = _date.getFullYear();
	const monthIndex = _date.getMonth();
	const lastDayOfMonth = constructFrom(_date, 0);
	lastDayOfMonth.setFullYear(year, monthIndex + 1, 0);
	lastDayOfMonth.setHours(0, 0, 0, 0);
	return lastDayOfMonth.getDate();
}

export interface GetDaysInYearOptions extends ContextOptions<Date> {}

export function getDaysInYear(
	date: DateArg<Date> & {},
	options?: GetDaysInYearOptions,
): number {
	const _date = toDate(date, options?.in);
	if (Number.isNaN(+_date)) return NaN;
	return isLeapYear(_date) ? 366 : 365;
}

export interface GetDecadeOptions extends ContextOptions<Date> {}

export function getDecade(
	date: DateArg<Date> & {},
	options?: GetDecadeOptions,
): number {
	const _date = toDate(date, options?.in);
	const year = _date.getFullYear();
	const decade = Math.floor(year / 10) * 10;
	return decade;
}

export interface GetHoursOptions extends ContextOptions<Date> {}

export function getHours(
	date: DateArg<Date> & {},
	options?: GetHoursOptions,
): number {
	return toDate(date, options?.in).getHours();
}

export function getTime(date: DateArg<Date> & {}): number {
	return toDate(date).getTime();
}

export interface GetISODayOptions extends ContextOptions<Date> {}

export function getISODay(
	date: DateArg<Date> & {},
	options?: GetISODayOptions,
): number {
	const day = toDate(date, options?.in).getDay();
	return day === 0 ? 7 : day;
}

export interface GetISOWeekOptions extends ContextOptions<Date> {}

export function getISOWeek(
	date: DateArg<Date> & {},
	options?: GetISOWeekOptions,
): number {
	const _date = toDate(date, options?.in);
	const diff = +startOfISOWeek(_date) - +startOfISOWeekYear(_date);
	return Math.round(diff / millisecondsInWeek) + 1;
}

export interface GetISOWeekYearOptions extends ContextOptions<Date> {}

export function getISOWeekYear(
	date: DateArg<Date> & {},
	options?: GetISOWeekYearOptions,
): number {
	const _date = toDate(date, options?.in);
	const year = _date.getFullYear();

	const fourthOfJanuaryOfNextYear = constructFrom(_date, 0);
	fourthOfJanuaryOfNextYear.setFullYear(year + 1, 0, 4);
	fourthOfJanuaryOfNextYear.setHours(0, 0, 0, 0);
	const startOfNextYear = startOfISOWeek(fourthOfJanuaryOfNextYear);

	const fourthOfJanuaryOfThisYear = constructFrom(_date, 0);
	fourthOfJanuaryOfThisYear.setFullYear(year, 0, 4);
	fourthOfJanuaryOfThisYear.setHours(0, 0, 0, 0);
	const startOfThisYear = startOfISOWeek(fourthOfJanuaryOfThisYear);

	if (_date.getTime() >= startOfNextYear.getTime()) {
		return year + 1;
	} else if (_date.getTime() >= startOfThisYear.getTime()) {
		return year;
	} else {
		return year - 1;
	}
}

export interface GetISOWeeksInYearOptions extends ContextOptions<Date> {}

export function getISOWeeksInYear(
	date: DateArg<Date> & {},
	options?: GetISOWeeksInYearOptions,
): number {
	const thisYear = startOfISOWeekYear(date, options);
	const nextYear = startOfISOWeekYear(addWeeks(thisYear, 60));
	const diff = +nextYear - +thisYear;
	return Math.round(diff / millisecondsInWeek);
}

export interface GetMillisecondsOptions extends ContextOptions<Date> {}

export function getMilliseconds(date: DateArg<Date> & {}): number {
	return toDate(date).getMilliseconds();
}

export interface GetMinutesOptions extends ContextOptions<Date> {}

export function getMinutes(
	date: DateArg<Date> & {},
	options?: GetMinutesOptions,
): number {
	return toDate(date, options?.in).getMinutes();
}

export interface GetMonthOptions extends ContextOptions<Date> {}

export function getMonth(
	date: DateArg<Date> & {},
	options?: GetMonthOptions,
): number {
	return toDate(date, options?.in).getMonth();
}

export interface GetQuarterOptions extends ContextOptions<Date> {}

export function getQuarter(
	date: DateArg<Date> & {},
	options?: GetQuarterOptions,
): number {
	const _date = toDate(date, options?.in);
	const quarter = Math.trunc(_date.getMonth() / 3) + 1;
	return quarter;
}

export interface GetSecondsOptions extends ContextOptions<Date> {}

export function getSeconds(date: DateArg<Date> & {}): number {
	return toDate(date).getSeconds();
}

export interface GetUnixTimeOptions extends ContextOptions<Date> {}

export function getUnixTime(date: DateArg<Date> & {}): number {
	return Math.trunc(+toDate(date) / 1000);
}

export interface GetYearOptions extends ContextOptions<Date> {}

export function getYear(
	date: DateArg<Date> & {},
	options?: GetYearOptions,
): number {
	return toDate(date, options?.in).getFullYear();
}

export interface GetWeekOptions
	extends LocalizedOptions<"options">,
		WeekOptions,
		FirstWeekContainsDateOptions,
		ContextOptions<Date> {}

export function getWeek(
	date: DateArg<Date> & {},
	options?: GetWeekOptions | undefined,
): number {
	const _date = toDate(date, options?.in);
	const diff = +startOfWeek(_date, options) - +startOfWeekYear(_date, options);
	return Math.round(diff / millisecondsInWeek) + 1;
}

export interface GetWeekOfMonthOptions
	extends LocalizedOptions<"options">,
		WeekOptions,
		ContextOptions<Date> {}

export function getWeekOfMonth(
	date: DateArg<Date> & {},
	options?: GetWeekOfMonthOptions,
): number {
	const weekStartsOn = resolveWeekStartsOn(options);
	const currentDayOfMonth = getDate(toDate(date, options?.in));
	if (Number.isNaN(currentDayOfMonth)) return NaN;

	const startWeekDay = getDay(startOfMonth(date, options));

	let lastDayOfFirstWeek = weekStartsOn - startWeekDay;
	if (lastDayOfFirstWeek <= 0) lastDayOfFirstWeek += 7;

	const remainingDaysAfterFirstWeek = currentDayOfMonth - lastDayOfFirstWeek;
	return Math.ceil(remainingDaysAfterFirstWeek / 7) + 1;
}

export interface GetWeekYearOptions
	extends LocalizedOptions<"options">,
		WeekOptions,
		FirstWeekContainsDateOptions,
		ContextOptions<Date> {}

export function getWeekYear(
	date: DateArg<Date> & {},
	options?: GetWeekYearOptions,
): number {
	const _date = toDate(date, options?.in);
	const year = _date.getFullYear();
	const firstWeekContainsDate = resolveFirstWeekContainsDate(options);

	const firstWeekOfNextYear = constructFrom(options?.in || date, 0);
	firstWeekOfNextYear.setFullYear(year + 1, 0, firstWeekContainsDate);
	firstWeekOfNextYear.setHours(0, 0, 0, 0);
	const startOfNextYear = startOfWeek(firstWeekOfNextYear, options);

	const firstWeekOfThisYear = constructFrom(options?.in || date, 0);
	firstWeekOfThisYear.setFullYear(year, 0, firstWeekContainsDate);
	firstWeekOfThisYear.setHours(0, 0, 0, 0);
	const startOfThisYear = startOfWeek(firstWeekOfThisYear, options);

	if (+_date >= +startOfNextYear) {
		return year + 1;
	} else if (+_date >= +startOfThisYear) {
		return year;
	} else {
		return year - 1;
	}
}

export interface GetWeeksInMonthOptions
	extends LocalizedOptions<"options">,
		WeekOptions,
		ContextOptions<Date> {}

export function getWeeksInMonth(
	date: DateArg<Date> & {},
	options?: GetWeeksInMonthOptions,
): number {
	const contextDate = toDate(date, options?.in);
	return (
		differenceInCalendarWeeks(
			lastDayOfMonth(contextDate, options),
			startOfMonth(contextDate, options),
			options,
		) + 1
	);
}
