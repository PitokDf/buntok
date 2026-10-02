import { getISOWeekYear, getWeekYear } from "./get";
import {
	resolveFirstWeekContainsDate,
	resolveWeekStartsOn,
} from "./_lib/options";
import { constructFrom, constructNow, toDate } from "./_lib/to-date";
import type {
	ContextOptions,
	DateArg,
	LocalizedOptions,
	WeekOptions,
} from "./_lib/types";

export interface StartOfDayOptions<DateType extends Date = Date>
	extends ContextOptions<DateType> {}

export function startOfDay<
	DateType extends Date,
	ResultDate extends Date = DateType,
>(
	date: DateArg<DateType>,
	options?: StartOfDayOptions<ResultDate> | undefined,
): ResultDate {
	const _date = toDate(date, options?.in);
	_date.setHours(0, 0, 0, 0);
	return _date;
}

export interface EndOfDayOptions<DateType extends Date = Date>
	extends ContextOptions<DateType> {}

export function endOfDay<
	DateType extends Date,
	ResultDate extends Date = DateType,
>(
	date: DateArg<DateType>,
	options?: EndOfDayOptions<ResultDate> | undefined,
): ResultDate {
	const _date = toDate(date, options?.in);
	_date.setHours(23, 59, 59, 999);
	return _date;
}

export interface StartOfWeekOptions<DateType extends Date = Date>
	extends LocalizedOptions<"options">,
		WeekOptions,
		ContextOptions<DateType> {}

export function startOfWeek<
	DateType extends Date,
	ResultDate extends Date = DateType,
>(
	date: DateArg<DateType>,
	options?: StartOfWeekOptions<ResultDate>,
): ResultDate {
	const weekStartsOn = resolveWeekStartsOn(options);
	const _date = toDate(date, options?.in);
	const day = _date.getDay();
	const diff = (day < weekStartsOn ? 7 : 0) + day - weekStartsOn;

	_date.setDate(_date.getDate() - diff);
	_date.setHours(0, 0, 0, 0);
	return _date;
}

export interface EndOfWeekOptions<DateType extends Date = Date>
	extends LocalizedOptions<"options">,
		WeekOptions,
		ContextOptions<DateType> {}

export function endOfWeek<
	DateType extends Date,
	ResultDate extends Date = DateType,
>(
	date: DateArg<DateType>,
	options?: EndOfWeekOptions<ResultDate>,
): ResultDate {
	const weekStartsOn = resolveWeekStartsOn(options);
	const _date = toDate(date, options?.in);
	const day = _date.getDay();
	const diff = (day < weekStartsOn ? -7 : 0) + 6 - (day - weekStartsOn);

	_date.setDate(_date.getDate() + diff);
	_date.setHours(23, 59, 59, 999);
	return _date;
}

export interface StartOfMonthOptions<ResultDate extends Date>
	extends ContextOptions<ResultDate> {}

export function startOfMonth<
	DateType extends Date,
	ResultDate extends Date = DateType,
>(
	date: DateArg<DateType>,
	options?: StartOfMonthOptions<ResultDate>,
): ResultDate {
	const _date = toDate(date, options?.in);
	_date.setDate(1);
	_date.setHours(0, 0, 0, 0);
	return _date;
}

export interface EndOfMonthOptions<DateType extends Date = Date>
	extends ContextOptions<DateType> {}

export function endOfMonth<
	DateType extends Date,
	ResultDate extends Date = DateType,
>(
	date: DateArg<DateType>,
	options?: EndOfMonthOptions<ResultDate>,
): ResultDate {
	const _date = toDate(date, options?.in);
	const month = _date.getMonth();
	_date.setFullYear(_date.getFullYear(), month + 1, 0);
	_date.setHours(23, 59, 59, 999);
	return _date;
}

export interface StartOfQuarterOptions<DateType extends Date = Date>
	extends ContextOptions<DateType> {}

export function startOfQuarter<
	DateType extends Date,
	ResultDate extends Date = DateType,
>(
	date: DateArg<DateType>,
	options?: StartOfQuarterOptions<ResultDate>,
): ResultDate {
	const _date = toDate(date, options?.in);
	const currentMonth = _date.getMonth();
	const month = currentMonth - (currentMonth % 3);
	_date.setMonth(month, 1);
	_date.setHours(0, 0, 0, 0);
	return _date;
}

export interface EndOfQuarterOptions<DateType extends Date = Date>
	extends ContextOptions<DateType> {}

export function endOfQuarter<
	DateType extends Date,
	ResultDate extends Date = DateType,
>(
	date: DateArg<DateType>,
	options?: EndOfQuarterOptions<ResultDate>,
): ResultDate {
	const _date = toDate(date, options?.in);
	const currentMonth = _date.getMonth();
	const month = currentMonth - (currentMonth % 3) + 3;
	_date.setMonth(month, 0);
	_date.setHours(23, 59, 59, 999);
	return _date;
}

export interface StartOfYearOptions<DateType extends Date = Date>
	extends ContextOptions<DateType> {}

export function startOfYear<
	DateType extends Date,
	ResultDate extends Date = DateType,
>(
	date: DateArg<DateType>,
	options?: StartOfYearOptions<ResultDate>,
): ResultDate {
	const date_ = toDate(date, options?.in);
	date_.setFullYear(date_.getFullYear(), 0, 1);
	date_.setHours(0, 0, 0, 0);
	return date_;
}

export interface EndOfYearOptions<DateType extends Date = Date>
	extends ContextOptions<DateType> {}

export function endOfYear<
	DateType extends Date,
	ResultDate extends Date = DateType,
>(
	date: DateArg<DateType>,
	options?: EndOfYearOptions<ResultDate>,
): ResultDate {
	const _date = toDate(date, options?.in);
	const year = _date.getFullYear();
	_date.setFullYear(year + 1, 0, 0);
	_date.setHours(23, 59, 59, 999);
	return _date;
}

export interface StartOfHourOptions<DateType extends Date = Date>
	extends ContextOptions<DateType> {}

export function startOfHour<
	DateType extends Date,
	ResultDate extends Date = DateType,
>(
	date: DateArg<DateType>,
	options?: StartOfHourOptions<ResultDate>,
): ResultDate {
	const _date = toDate(date, options?.in);
	_date.setMinutes(0, 0, 0);
	return _date;
}

export interface EndOfHourOptions<DateType extends Date = Date>
	extends ContextOptions<DateType> {}

export function endOfHour<
	DateType extends Date,
	ResultDate extends Date = DateType,
>(
	date: DateArg<DateType>,
	options?: EndOfHourOptions<ResultDate>,
): ResultDate {
	const _date = toDate(date, options?.in);
	_date.setMinutes(59, 59, 999);
	return _date;
}

export interface StartOfMinuteOptions<DateType extends Date = Date>
	extends ContextOptions<DateType> {}

export function startOfMinute<
	DateType extends Date,
	ResultDate extends Date = DateType,
>(
	date: DateArg<DateType>,
	options?: StartOfMinuteOptions<ResultDate>,
): ResultDate {
	const date_ = toDate(date, options?.in);
	date_.setSeconds(0, 0);
	return date_;
}

export interface EndOfMinuteOptions<DateType extends Date = Date>
	extends ContextOptions<DateType> {}

export function endOfMinute<
	DateType extends Date,
	ResultDate extends Date = DateType,
>(
	date: DateArg<DateType>,
	options?: EndOfMinuteOptions<ResultDate>,
): ResultDate {
	const _date = toDate(date, options?.in);
	_date.setSeconds(59, 999);
	return _date;
}

export interface StartOfSecondOptions<DateType extends Date = Date>
	extends ContextOptions<DateType> {}

export function startOfSecond<
	DateType extends Date,
	ResultDate extends Date = DateType,
>(
	date: DateArg<DateType>,
	options?: StartOfSecondOptions<ResultDate>,
): ResultDate {
	const date_ = toDate(date, options?.in);
	date_.setMilliseconds(0);
	return date_;
}

export interface EndOfSecondOptions<DateType extends Date = Date>
	extends ContextOptions<DateType> {}

export function endOfSecond<
	DateType extends Date,
	ResultDate extends Date = DateType,
>(
	date: DateArg<DateType>,
	options?: EndOfSecondOptions<ResultDate>,
): ResultDate {
	const _date = toDate(date, options?.in);
	_date.setMilliseconds(999);
	return _date;
}

export interface StartOfISOWeekOptions<DateType extends Date = Date>
	extends LocalizedOptions<"options">,
		ContextOptions<DateType> {}

export function startOfISOWeek<
	DateType extends Date,
	ResultDate extends Date = DateType,
>(
	date: DateArg<DateType>,
	options?: StartOfISOWeekOptions<ResultDate>,
): ResultDate {
	return startOfWeek(date, { ...options, weekStartsOn: 1 });
}

export interface EndOfISOWeekOptions<DateType extends Date = Date>
	extends LocalizedOptions<"options">,
		ContextOptions<DateType> {}

export function endOfISOWeek<
	DateType extends Date,
	ResultDate extends Date = DateType,
>(
	date: DateArg<DateType>,
	options?: EndOfISOWeekOptions<ResultDate>,
): ResultDate {
	return endOfWeek(date, { ...options, weekStartsOn: 1 });
}

export interface StartOfISOWeekYearOptions<DateType extends Date = Date>
	extends LocalizedOptions<"options">,
		ContextOptions<DateType> {}

export function startOfISOWeekYear<
	DateType extends Date,
	ResultDate extends Date = DateType,
>(
	date: DateArg<DateType>,
	options?: StartOfISOWeekYearOptions<ResultDate>,
): ResultDate {
	const year = getISOWeekYear(date, options);
	const fourthOfJanuary = constructFrom(options?.in || date, 0);
	fourthOfJanuary.setFullYear(year, 0, 4);
	fourthOfJanuary.setHours(0, 0, 0, 0);
	return startOfISOWeek(fourthOfJanuary);
}

export interface EndOfISOWeekYearOptions<DateType extends Date = Date>
	extends LocalizedOptions<"options">,
		ContextOptions<DateType> {}

export function endOfISOWeekYear<
	DateType extends Date,
	ResultDate extends Date = DateType,
>(
	date: DateArg<DateType>,
	options?: EndOfISOWeekYearOptions<ResultDate>,
): ResultDate {
	const year = getISOWeekYear(date, options);
	const fourthOfJanuaryOfNextYear = constructFrom(options?.in || date, 0);
	fourthOfJanuaryOfNextYear.setFullYear(year + 1, 0, 4);
	fourthOfJanuaryOfNextYear.setHours(0, 0, 0, 0);
	const _date = startOfISOWeek(fourthOfJanuaryOfNextYear, options);
	_date.setMilliseconds(_date.getMilliseconds() - 1);
	return _date;
}

export interface StartOfWeekYearOptions<DateType extends Date = Date>
	extends LocalizedOptions<"options">,
		WeekOptions,
		ContextOptions<DateType> {}

export function startOfWeekYear<
	DateType extends Date,
	ResultDate extends Date = DateType,
>(
	date: DateArg<DateType>,
	options?: StartOfWeekYearOptions<ResultDate>,
): ResultDate {
	const firstWeekContainsDate = resolveFirstWeekContainsDate(options);
	const year = getWeekYear(date, options);
	const firstWeek = constructFrom(options?.in || date, 0);
	firstWeek.setFullYear(year, 0, firstWeekContainsDate);
	firstWeek.setHours(0, 0, 0, 0);
	const _date = startOfWeek(firstWeek, options);
	return _date;
}

export interface StartOfDecadeOptions<DateType extends Date = Date>
	extends ContextOptions<DateType> {}

export function startOfDecade<
	DateType extends Date,
	ResultDate extends Date = DateType,
>(
	date: DateArg<DateType>,
	options?: StartOfDecadeOptions<ResultDate>,
): ResultDate {
	const _date = toDate(date, options?.in);
	const year = _date.getFullYear();
	const decade = Math.floor(year / 10) * 10;
	_date.setFullYear(decade, 0, 1);
	_date.setHours(0, 0, 0, 0);
	return _date;
}

export interface EndOfDecadeOptions<DateType extends Date = Date>
	extends ContextOptions<DateType> {}

export function endOfDecade<
	DateType extends Date,
	ResultDate extends Date = DateType,
>(
	date: DateArg<DateType>,
	options?: EndOfDecadeOptions<ResultDate>,
): ResultDate {
	const _date = toDate(date, options?.in);
	const year = _date.getFullYear();
	const decade = 9 + Math.floor(year / 10) * 10;
	_date.setFullYear(decade, 11, 31);
	_date.setHours(23, 59, 59, 999);
	return _date;
}

export interface LastDayOfMonthOptions<DateType extends Date = Date>
	extends ContextOptions<DateType> {}

export function lastDayOfMonth<
	DateType extends Date,
	ResultDate extends Date = DateType,
>(
	date: DateArg<DateType>,
	options?: LastDayOfMonthOptions<ResultDate>,
): ResultDate {
	const _date = toDate(date, options?.in);
	const month = _date.getMonth();
	_date.setFullYear(_date.getFullYear(), month + 1, 0);
	_date.setHours(0, 0, 0, 0);
	return toDate(_date, options?.in);
}

export interface LastDayOfQuarterOptions<DateType extends Date = Date>
	extends ContextOptions<DateType> {}

export function lastDayOfQuarter<
	DateType extends Date,
	ResultDate extends Date = DateType,
>(
	date: DateArg<DateType>,
	options?: LastDayOfQuarterOptions<ResultDate>,
): ResultDate {
	const date_ = toDate(date, options?.in);
	const currentMonth = date_.getMonth();
	const month = currentMonth - (currentMonth % 3) + 3;
	date_.setMonth(month, 0);
	date_.setHours(0, 0, 0, 0);
	return date_;
}

export interface LastDayOfYearOptions<DateType extends Date = Date>
	extends ContextOptions<DateType> {}

export function lastDayOfYear<
	DateType extends Date,
	ResultDate extends Date = DateType,
>(
	date: DateArg<DateType>,
	options?: LastDayOfYearOptions<ResultDate>,
): ResultDate {
	const date_ = toDate(date, options?.in);
	const year = date_.getFullYear();
	date_.setFullYear(year + 1, 0, 0);
	date_.setHours(0, 0, 0, 0);
	return date_;
}

export interface LastDayOfWeekOptions<DateType extends Date = Date>
	extends LocalizedOptions<"options">,
		WeekOptions,
		ContextOptions<DateType> {}

export function lastDayOfWeek<
	DateType extends Date,
	ResultDate extends Date = DateType,
>(
	date: DateArg<DateType>,
	options?: LastDayOfWeekOptions<ResultDate>,
): ResultDate {
	const weekStartsOn = resolveWeekStartsOn(options);
	const _date = toDate(date, options?.in);
	const day = _date.getDay();
	const diff = (day < weekStartsOn ? -7 : 0) + 6 - (day - weekStartsOn);

	_date.setHours(0, 0, 0, 0);
	_date.setDate(_date.getDate() + diff);

	return _date;
}

export interface LastDayOfISOWeekOptions<DateType extends Date = Date>
	extends LocalizedOptions<"options">,
		ContextOptions<DateType> {}

export function lastDayOfISOWeek<
	DateType extends Date,
	ResultDate extends Date = DateType,
>(
	date: DateArg<DateType>,
	options?: LastDayOfISOWeekOptions<ResultDate>,
): ResultDate {
	return lastDayOfWeek(date, { ...options, weekStartsOn: 1 });
}

export interface LastDayOfDecadeOptions<DateType extends Date = Date>
	extends ContextOptions<DateType> {}

export function lastDayOfDecade<
	DateType extends Date,
	ResultDate extends Date = DateType,
>(
	date: DateArg<DateType>,
	options?: LastDayOfDecadeOptions<ResultDate>,
): ResultDate {
	const _date = toDate(date, options?.in);
	const year = _date.getFullYear();
	const decade = 9 + Math.floor(year / 10) * 10;
	_date.setFullYear(decade + 1, 0, 0);
	_date.setHours(0, 0, 0, 0);
	return toDate(_date, options?.in);
}

export interface LastDayOfISOWeekYearOptions<DateType extends Date = Date>
	extends LocalizedOptions<"options">,
		ContextOptions<DateType> {}

export function lastDayOfISOWeekYear<
	DateType extends Date,
	ResultDate extends Date = DateType,
>(
	date: DateArg<DateType>,
	options?: LastDayOfISOWeekYearOptions<ResultDate>,
): ResultDate {
	const year = getISOWeekYear(date, options);
	const fourthOfJanuary = constructFrom(options?.in || date, 0);
	fourthOfJanuary.setFullYear(year + 1, 0, 4);
	fourthOfJanuary.setHours(0, 0, 0, 0);

	const date_ = startOfISOWeek(fourthOfJanuary, options);
	date_.setDate(date_.getDate() - 1);
	return date_;
}

export interface StartOfTodayOptions<DateType extends Date = Date>
	extends ContextOptions<DateType> {}

export function startOfToday(options?: StartOfTodayOptions<Date>): Date {
	return startOfDay(Date.now(), options);
}

export interface EndOfTodayOptions<DateType extends Date = Date>
	extends ContextOptions<DateType> {}

export function endOfToday(options?: EndOfTodayOptions<Date>): Date {
	return endOfDay(Date.now(), options);
}

export interface StartOfTomorrowOptions<DateType extends Date = Date>
	extends ContextOptions<DateType> {}

export function startOfTomorrow(options?: StartOfTomorrowOptions<Date>): Date {
	const now = constructNow(options?.in);
	const year = now.getFullYear();
	const month = now.getMonth();
	const day = now.getDate();

	const date = constructFrom(options?.in, 0);
	date.setFullYear(year, month, day + 1);
	date.setHours(0, 0, 0, 0);
	return date;
}

export interface EndOfTomorrowOptions<DateType extends Date = Date>
	extends ContextOptions<DateType> {}

export function endOfTomorrow(options?: EndOfTomorrowOptions<Date>): Date {
	const now = constructNow(options?.in);
	const year = now.getFullYear();
	const month = now.getMonth();
	const day = now.getDate();

	const date = constructNow(options?.in);
	date.setFullYear(year, month, day + 1);
	date.setHours(23, 59, 59, 999);
	return options?.in ? options.in(date) : date;
}

export interface StartOfYesterdayOptions<DateType extends Date = Date>
	extends ContextOptions<DateType> {}

export function startOfYesterday(options?: StartOfYesterdayOptions<Date>): Date {
	const now = constructNow(options?.in);
	const year = now.getFullYear();
	const month = now.getMonth();
	const day = now.getDate();

	const date = constructNow(options?.in);
	date.setFullYear(year, month, day - 1);
	date.setHours(0, 0, 0, 0);
	return date;
}

export interface EndOfYesterdayOptions<DateType extends Date = Date>
	extends ContextOptions<DateType> {}

export function endOfYesterday(options?: EndOfYesterdayOptions<Date>): Date {
	const now = constructNow(options?.in);
	const date = constructFrom(options?.in, 0);
	date.setFullYear(now.getFullYear(), now.getMonth(), now.getDate() - 1);
	date.setHours(23, 59, 59, 999);
	return date;
}
