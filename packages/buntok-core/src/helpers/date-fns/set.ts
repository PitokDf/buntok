import { addDays } from "./add";
import { differenceInCalendarDays } from "./difference";
import { getDaysInMonth, getISODay, getISOWeek, getWeek } from "./get";
import {
	resolveFirstWeekContainsDate,
	resolveWeekStartsOn,
} from "./_lib/options";
import { constructFrom, toDate } from "./_lib/to-date";
import type {
	ContextOptions,
	DateArg,
	DateValues,
	LocalizedOptions,
	FirstWeekContainsDateOptions,
	WeekOptions,
} from "./_lib/types";
import {
	startOfISOWeekYear,
	startOfWeekYear,
} from "./start-end";

export interface SetOptions<DateType extends Date = Date>
	extends ContextOptions<DateType> {}

export function set<DateType extends Date, ResultDate extends Date = DateType>(
	date: DateArg<DateType>,
	values: DateValues,
	options?: SetOptions<ResultDate>,
): ResultDate {
	let _date = toDate(date, options?.in);

	if (Number.isNaN(+_date)) return constructFrom(options?.in || date, Number.NaN);

	if (values.year != null) _date.setFullYear(values.year);
	if (values.month != null) _date = setMonth(_date, values.month);
	if (values.date != null) _date.setDate(values.date);
	if (values.hours != null) _date.setHours(values.hours);
	if (values.minutes != null) _date.setMinutes(values.minutes);
	if (values.seconds != null) _date.setSeconds(values.seconds);
	if (values.milliseconds != null) _date.setMilliseconds(values.milliseconds);

	return _date;
}

export interface SetDateOptions<DateType extends Date = Date>
	extends ContextOptions<DateType> {}

export function setDate<DateType extends Date, ResultDate extends Date = DateType>(
	date: DateArg<DateType>,
	dayOfMonth: number,
	options?: SetDateOptions<ResultDate>,
): ResultDate {
	const _date = toDate(date, options?.in);
	_date.setDate(dayOfMonth);
	return _date;
}

export interface SetDayOptions<DateType extends Date = Date>
	extends LocalizedOptions<"options">,
		WeekOptions,
		ContextOptions<DateType> {}

export function setDay<DateType extends Date, ResultDate extends Date = DateType>(
	date: DateArg<DateType>,
	day: number,
	options?: SetDayOptions<ResultDate>,
): ResultDate {
	const weekStartsOn = resolveWeekStartsOn(options);
	const date_ = toDate(date, options?.in);
	const currentDay = date_.getDay();

	const remainder = day % 7;
	const dayIndex = (remainder + 7) % 7;

	const delta = 7 - weekStartsOn;
	const diff =
		day < 0 || day > 6
			? day - ((currentDay + delta) % 7)
			: ((dayIndex + delta) % 7) - ((currentDay + delta) % 7);
	return addDays(date_, diff, options);
}

export interface SetDayOfYearOptions<DateType extends Date = Date>
	extends ContextOptions<DateType> {}

export function setDayOfYear<
	DateType extends Date,
	ResultDate extends Date = DateType,
>(
	date: DateArg<DateType>,
	dayOfYear: number,
	options?: SetDayOfYearOptions<ResultDate>,
): ResultDate {
	const date_ = toDate(date, options?.in);
	date_.setMonth(0);
	date_.setDate(dayOfYear);
	return date_;
}

export interface SetHoursOptions<DateType extends Date = Date>
	extends ContextOptions<DateType> {}

export function setHours<DateType extends Date, ResultDate extends Date = DateType>(
	date: DateArg<DateType>,
	hours: number,
	options?: SetHoursOptions<ResultDate>,
): ResultDate {
	const _date = toDate(date, options?.in);
	_date.setHours(hours);
	return _date;
}

export interface SetISODayOptions<DateType extends Date = Date>
	extends ContextOptions<DateType> {}

export function setISODay<DateType extends Date, ResultDate extends Date = DateType>(
	date: DateArg<DateType>,
	day: number,
	options?: SetISODayOptions<ResultDate>,
): ResultDate {
	const date_ = toDate(date, options?.in);
	const currentDay = getISODay(date_, options);
	const diff = day - currentDay;
	return addDays(date_, diff, options);
}

export interface SetISOWeekOptions<DateType extends Date = Date>
	extends ContextOptions<DateType> {}

export function setISOWeek<DateType extends Date, ResultDate extends Date = DateType>(
	date: DateArg<DateType>,
	week: number,
	options?: SetISOWeekOptions<ResultDate>,
): ResultDate {
	const _date = toDate(date, options?.in);
	const diff = getISOWeek(_date, options) - week;
	_date.setDate(_date.getDate() - diff * 7);
	return _date;
}

export interface SetISOWeekYearOptions<DateType extends Date = Date>
	extends ContextOptions<DateType> {}

export function setISOWeekYear<
	DateType extends Date,
	ResultDate extends Date = DateType,
>(
	date: DateArg<DateType>,
	weekYear: number,
	options?: SetISOWeekYearOptions<ResultDate>,
): ResultDate {
	let _date = toDate(date, options?.in);
	const diff = differenceInCalendarDays(
		_date,
		startOfISOWeekYear(_date, options),
	);
	const fourthOfJanuary = constructFrom(options?.in || date, 0);
	fourthOfJanuary.setFullYear(weekYear, 0, 4);
	fourthOfJanuary.setHours(0, 0, 0, 0);
	_date = startOfISOWeekYear(fourthOfJanuary);
	_date.setDate(_date.getDate() + diff);
	return _date;
}

export interface SetMillisecondsOptions<DateType extends Date = Date>
	extends ContextOptions<DateType> {}

export function setMilliseconds<
	DateType extends Date,
	ResultDate extends Date = DateType,
>(
	date: DateArg<DateType>,
	milliseconds: number,
	options?: SetMillisecondsOptions<ResultDate>,
): ResultDate {
	const _date = toDate(date, options?.in);
	_date.setMilliseconds(milliseconds);
	return _date;
}

export interface SetMinutesOptions<DateType extends Date = Date>
	extends ContextOptions<DateType> {}

export function setMinutes<DateType extends Date, ResultDate extends Date = DateType>(
	date: DateArg<DateType>,
	minutes: number,
	options?: SetMinutesOptions<ResultDate>,
): ResultDate {
	const date_ = toDate(date, options?.in);
	date_.setMinutes(minutes);
	return date_;
}

export interface SetMonthOptions<DateType extends Date = Date>
	extends ContextOptions<DateType> {}

export function setMonth<DateType extends Date, ResultDate extends Date = DateType>(
	date: DateArg<DateType>,
	month: number,
	options?: SetMonthOptions<ResultDate>,
): ResultDate {
	const _date = toDate(date, options?.in);
	const year = _date.getFullYear();
	const day = _date.getDate();

	const midMonth = constructFrom(options?.in || date, 0);
	midMonth.setFullYear(year, month, 15);
	midMonth.setHours(0, 0, 0, 0);
	const daysInMonth = getDaysInMonth(midMonth);

	_date.setMonth(month, Math.min(day, daysInMonth));
	return _date;
}

export interface SetQuarterOptions<DateType extends Date = Date>
	extends ContextOptions<DateType> {}

export function setQuarter<
	DateType extends Date,
	ResultDate extends Date = DateType,
>(
	date: DateArg<DateType>,
	quarter: number,
	options?: SetQuarterOptions<ResultDate>,
): ResultDate {
	const date_ = toDate(date, options?.in);
	const oldQuarter = Math.trunc(date_.getMonth() / 3) + 1;
	const diff = quarter - oldQuarter;
	return setMonth(date_, date_.getMonth() + diff * 3);
}

export interface SetSecondsOptions<DateType extends Date = Date>
	extends ContextOptions<DateType> {}

export function setSeconds<DateType extends Date, ResultDate extends Date = DateType>(
	date: DateArg<DateType>,
	seconds: number,
	options?: SetSecondsOptions<ResultDate>,
): ResultDate {
	const _date = toDate(date, options?.in);
	_date.setSeconds(seconds);
	return _date;
}

export interface SetWeekOptions<DateType extends Date = Date>
	extends LocalizedOptions<"options">,
		WeekOptions,
		FirstWeekContainsDateOptions,
		ContextOptions<DateType> {}

export function setWeek<DateType extends Date, ResultDate extends Date = DateType>(
	date: DateArg<DateType>,
	week: number,
	options?: SetWeekOptions<ResultDate>,
): ResultDate {
	const date_ = toDate(date, options?.in);
	const diff = getWeek(date_, options) - week;
	date_.setDate(date_.getDate() - diff * 7);
	return toDate(date_, options?.in);
}

export interface SetWeekYearOptions<DateType extends Date = Date>
	extends LocalizedOptions<"options">,
		WeekOptions,
		FirstWeekContainsDateOptions,
		ContextOptions<DateType> {}

export function setWeekYear<DateType extends Date, ResultDate extends Date = DateType>(
	date: DateArg<DateType>,
	weekYear: number,
	options?: SetWeekYearOptions<ResultDate>,
): ResultDate {
	const firstWeekContainsDate = resolveFirstWeekContainsDate(options);

	const diff = differenceInCalendarDays(
		toDate(date, options?.in),
		startOfWeekYear(date, options),
		options,
	);

	const firstWeek = constructFrom(options?.in || date, 0);
	firstWeek.setFullYear(weekYear, 0, firstWeekContainsDate);
	firstWeek.setHours(0, 0, 0, 0);

	const date_ = startOfWeekYear(firstWeek, options);
	date_.setDate(date_.getDate() + diff);
	return date_;
}

export interface SetYearOptions<DateType extends Date = Date>
	extends ContextOptions<DateType> {}

export function setYear<DateType extends Date, ResultDate extends Date = DateType>(
	date: DateArg<DateType>,
	year: number,
	options?: SetYearOptions<ResultDate>,
): ResultDate {
	const date_ = toDate(date, options?.in);

	if (Number.isNaN(+date_)) return constructFrom(options?.in || date, Number.NaN);

	date_.setFullYear(year);
	return date_;
}
