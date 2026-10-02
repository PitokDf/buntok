import { getISOWeekYear } from "./get";
import { isSaturday, isSunday, isWeekend } from "./is";
import { setISOWeek, setISOWeekYear } from "./set";
import { constructFrom, toDate } from "./_lib/to-date";
import type { ContextOptions, DateArg, Duration } from "./_lib/types";
import { millisecondsInHour, millisecondsInMinute } from "./_lib/constants";

export interface AddOptions<DateType extends Date = Date>
	extends ContextOptions<DateType> {}

export function add<
	DateType extends Date,
	ResultDate extends Date = DateType,
>(
	date: DateArg<DateType>,
	duration: Duration,
	options?: AddOptions<ResultDate> | undefined,
): ResultDate {
	const {
		years = 0,
		months = 0,
		weeks = 0,
		days = 0,
		hours = 0,
		minutes = 0,
		seconds = 0,
	} = duration;

	const _date = toDate(date, options?.in);
	const dateWithMonths =
		months || years ? addMonths(_date, months + years * 12) : _date;

	const dateWithDays =
		days || weeks ? addDays(dateWithMonths, days + weeks * 7) : dateWithMonths;

	const minutesToAdd = minutes + hours * 60;
	const secondsToAdd = seconds + minutesToAdd * 60;
	const msToAdd = secondsToAdd * 1000;

	return constructFrom(options?.in || date, +dateWithDays + msToAdd);
}

export interface AddBusinessDaysOptions<DateType extends Date = Date>
	extends ContextOptions<DateType> {}

export function addBusinessDays<
	DateType extends Date,
	ResultDate extends Date = DateType,
>(
	date: DateArg<DateType>,
	amount: number,
	options?: AddBusinessDaysOptions<ResultDate> | undefined,
): ResultDate {
	const _date = toDate(date, options?.in);
	const startedOnWeekend = isWeekend(_date, options);

	if (Number.isNaN(amount)) return constructFrom(options?.in, Number.NaN);

	const hours = _date.getHours();
	const sign = amount < 0 ? -1 : 1;
	const fullWeeks = Math.trunc(amount / 5);

	_date.setDate(_date.getDate() + fullWeeks * 7);

	let restDays = Math.abs(amount % 5);

	while (restDays > 0) {
		_date.setDate(_date.getDate() + sign);
		if (!isWeekend(_date, options)) restDays -= 1;
	}

	if (startedOnWeekend && isWeekend(_date, options) && amount !== 0) {
		if (isSaturday(_date, options))
			_date.setDate(_date.getDate() + (sign < 0 ? 2 : -1));
		if (isSunday(_date, options))
			_date.setDate(_date.getDate() + (sign < 0 ? 1 : -2));
	}

	_date.setHours(hours);

	return _date;
}

export interface AddDaysOptions<DateType extends Date = Date>
	extends ContextOptions<DateType> {}

export function addDays<DateType extends Date, ResultDate extends Date = DateType>(
	date: DateArg<DateType>,
	amount: number,
	options?: AddDaysOptions<ResultDate> | undefined,
): ResultDate {
	const _date = toDate(date, options?.in);
	if (Number.isNaN(amount)) return constructFrom(options?.in || date, Number.NaN);

	if (!amount) return _date;

	_date.setDate(_date.getDate() + amount);
	return _date;
}

export interface AddHoursOptions<DateType extends Date = Date>
	extends ContextOptions<DateType> {}

export function addHours<
	DateType extends Date,
	ResultDate extends Date = DateType,
>(
	date: DateArg<DateType>,
	amount: number,
	options?: AddHoursOptions<ResultDate> | undefined,
): ResultDate {
	return addMilliseconds(date, amount * millisecondsInHour, options);
}

export interface AddISOWeekYearsOptions<DateType extends Date = Date>
	extends ContextOptions<DateType> {}

export function addISOWeekYears<
	DateType extends Date,
	ResultDate extends Date = DateType,
>(
	date: DateArg<DateType>,
	amount: number,
	options?: AddISOWeekYearsOptions<ResultDate> | undefined,
): ResultDate {
	return setISOWeekYear(date, getISOWeekYear(date, options) + amount, options);
}

export interface AddMillisecondsOptions<DateType extends Date = Date>
	extends ContextOptions<DateType> {}

export function addMilliseconds<
	DateType extends Date,
	ResultDate extends Date = DateType,
>(
	date: DateArg<DateType>,
	amount: number,
	options?: AddMillisecondsOptions<ResultDate> | undefined,
): ResultDate {
	return constructFrom(options?.in || date, +toDate(date) + amount);
}

export interface AddMinutesOptions<DateType extends Date = Date>
	extends ContextOptions<DateType> {}

export function addMinutes<
	DateType extends Date,
	ResultDate extends Date = DateType,
>(
	date: DateArg<DateType>,
	amount: number,
	options?: AddMinutesOptions<ResultDate> | undefined,
): ResultDate {
	const _date = toDate(date, options?.in);
	_date.setTime(_date.getTime() + amount * millisecondsInMinute);
	return _date;
}

export interface AddMonthsOptions<DateType extends Date = Date>
	extends ContextOptions<DateType> {}

export function addMonths<
	DateType extends Date,
	ResultDate extends Date = DateType,
>(
	date: DateArg<DateType>,
	amount: number,
	options?: AddMonthsOptions<ResultDate> | undefined,
): ResultDate {
	const _date = toDate(date, options?.in);
	if (Number.isNaN(amount)) return constructFrom(options?.in || date, Number.NaN);
	if (!amount) return _date;

	const dayOfMonth = _date.getDate();

	const endOfDesiredMonth = constructFrom(options?.in || date, _date.getTime());
	endOfDesiredMonth.setMonth(_date.getMonth() + amount + 1, 0);
	const daysInMonth = endOfDesiredMonth.getDate();
	if (dayOfMonth >= daysInMonth) {
		return endOfDesiredMonth;
	} else {
		_date.setFullYear(
			endOfDesiredMonth.getFullYear(),
			endOfDesiredMonth.getMonth(),
			dayOfMonth,
		);
		return _date;
	}
}

export interface AddQuartersOptions<DateType extends Date = Date>
	extends ContextOptions<DateType> {}

export function addQuarters<
	DateType extends Date,
	ResultDate extends Date = DateType,
>(
	date: DateArg<DateType>,
	amount: number,
	options?: AddQuartersOptions<ResultDate> | undefined,
): ResultDate {
	return addMonths(date, amount * 3, options);
}

export interface AddSecondsOptions<DateType extends Date = Date>
	extends ContextOptions<DateType> {}

export function addSeconds<
	DateType extends Date,
	ResultDate extends Date = DateType,
>(
	date: DateArg<DateType>,
	amount: number,
	options?: AddSecondsOptions<ResultDate> | undefined,
): ResultDate {
	return addMilliseconds(date, amount * 1000, options);
}

export interface AddWeeksOptions<DateType extends Date = Date>
	extends ContextOptions<DateType> {}

export function addWeeks<
	DateType extends Date,
	ResultDate extends Date = DateType,
>(
	date: DateArg<DateType>,
	amount: number,
	options?: AddWeeksOptions<ResultDate> | undefined,
): ResultDate {
	return addDays(date, amount * 7, options);
}

export interface AddYearsOptions<DateType extends Date = Date>
	extends ContextOptions<DateType> {}

export function addYears<DateType extends Date, ResultDate extends Date = DateType>(
	date: DateArg<DateType>,
	amount: number,
	options?: AddYearsOptions<ResultDate> | undefined,
): ResultDate {
	return addMonths(date, amount * 12, options);
}
