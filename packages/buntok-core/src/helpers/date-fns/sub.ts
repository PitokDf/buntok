import {
	add,
	addBusinessDays,
	addDays,
	addHours,
	addISOWeekYears,
	addMilliseconds,
	addMinutes,
	addMonths,
	addQuarters,
	addSeconds,
	addWeeks,
	addYears,
	type AddBusinessDaysOptions,
	type AddDaysOptions,
	type AddHoursOptions,
	type AddISOWeekYearsOptions,
	type AddMillisecondsOptions,
	type AddMinutesOptions,
	type AddMonthsOptions,
	type AddOptions,
	type AddQuartersOptions,
	type AddSecondsOptions,
	type AddWeeksOptions,
	type AddYearsOptions,
} from "./add";
import { constructFrom } from "./_lib/to-date";
import type { ContextOptions, DateArg, Duration } from "./_lib/types";

export interface SubOptions<DateType extends Date = Date>
	extends ContextOptions<DateType> {}

export function sub<
	DateType extends Date,
	ResultDate extends Date = DateType,
>(
	date: DateArg<DateType>,
	duration: Duration,
	options?: SubOptions<ResultDate> | undefined,
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

	const withoutMonths = subMonths(date, months + years * 12, options);
	const withoutDays = subDays(withoutMonths, days + weeks * 7, options);

	const minutesToSub = minutes + hours * 60;
	const secondsToSub = seconds + minutesToSub * 60;
	const msToSub = secondsToSub * 1000;

	return constructFrom(options?.in || date, +withoutDays - msToSub);
}

export interface SubBusinessDaysOptions<DateType extends Date = Date>
	extends ContextOptions<DateType> {}

export function subBusinessDays<
	DateType extends Date,
	ResultDate extends Date = DateType,
>(
	date: DateArg<DateType>,
	amount: number,
	options?: SubBusinessDaysOptions<ResultDate> | undefined,
): ResultDate {
	return addBusinessDays(date, -amount, options);
}

export interface SubDaysOptions<DateType extends Date = Date>
	extends ContextOptions<DateType> {}

export function subDays<DateType extends Date, ResultDate extends Date = DateType>(
	date: DateArg<DateType>,
	amount: number,
	options?: SubDaysOptions<ResultDate> | undefined,
): ResultDate {
	return addDays(date, -amount, options);
}

export interface SubHoursOptions<DateType extends Date = Date>
	extends ContextOptions<DateType> {}

export function subHours<
	DateType extends Date,
	ResultDate extends Date = DateType,
>(
	date: DateArg<DateType>,
	amount: number,
	options?: SubHoursOptions<ResultDate> | undefined,
): ResultDate {
	return addHours(date, -amount, options);
}

export interface SubISOWeekYearsOptions<DateType extends Date = Date>
	extends ContextOptions<DateType> {}

export function subISOWeekYears<
	DateType extends Date,
	ResultDate extends Date = DateType,
>(
	date: DateArg<DateType>,
	amount: number,
	options?: SubISOWeekYearsOptions<ResultDate> | undefined,
): ResultDate {
	return addISOWeekYears(date, -amount, options);
}

export interface SubMillisecondsOptions<DateType extends Date = Date>
	extends ContextOptions<DateType> {}

export function subMilliseconds<
	DateType extends Date,
	ResultDate extends Date = DateType,
>(
	date: DateArg<DateType>,
	amount: number,
	options?: SubMillisecondsOptions<ResultDate> | undefined,
): ResultDate {
	return addMilliseconds(date, -amount, options);
}

export interface SubMinutesOptions<DateType extends Date = Date>
	extends ContextOptions<DateType> {}

export function subMinutes<
	DateType extends Date,
	ResultDate extends Date = DateType,
>(
	date: DateArg<DateType>,
	amount: number,
	options?: SubMinutesOptions<ResultDate> | undefined,
): ResultDate {
	return addMinutes(date, -amount, options);
}

export interface SubMonthsOptions<DateType extends Date = Date>
	extends ContextOptions<DateType> {}

export function subMonths<
	DateType extends Date,
	ResultDate extends Date = DateType,
>(
	date: DateArg<DateType>,
	amount: number,
	options?: SubMonthsOptions<ResultDate> | undefined,
): ResultDate {
	return addMonths(date, -amount, options);
}

export interface SubQuartersOptions<DateType extends Date = Date>
	extends ContextOptions<DateType> {}

export function subQuarters<
	DateType extends Date,
	ResultDate extends Date = DateType,
>(
	date: DateArg<DateType>,
	amount: number,
	options?: SubQuartersOptions<ResultDate> | undefined,
): ResultDate {
	return addQuarters(date, -amount, options);
}

export interface SubSecondsOptions<DateType extends Date = Date>
	extends ContextOptions<DateType> {}

export function subSeconds<
	DateType extends Date,
	ResultDate extends Date = DateType,
>(
	date: DateArg<DateType>,
	amount: number,
	options?: SubSecondsOptions<ResultDate> | undefined,
): ResultDate {
	return addSeconds(date, -amount, options);
}

export interface SubWeeksOptions<DateType extends Date = Date>
	extends ContextOptions<DateType> {}

export function subWeeks<
	DateType extends Date,
	ResultDate extends Date = DateType,
>(
	date: DateArg<DateType>,
	amount: number,
	options?: SubWeeksOptions<ResultDate> | undefined,
): ResultDate {
	return addWeeks(date, -amount, options);
}

export interface SubYearsOptions<DateType extends Date = Date>
	extends ContextOptions<DateType> {}

export function subYears<
	DateType extends Date,
	ResultDate extends Date = DateType,
>(
	date: DateArg<DateType>,
	amount: number,
	options?: SubYearsOptions<ResultDate> | undefined,
): ResultDate {
	return addYears(date, -amount, options);
}
