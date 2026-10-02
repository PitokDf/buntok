import { addDays } from "./add";
import { subDays } from "./sub";
import { getDay } from "./get";
import type { ContextOptions, DateArg, Day } from "./_lib/types";

export interface NextDayOptions<ResultDate extends Date = Date>
	extends ContextOptions<ResultDate> {}

export function nextDay<ResultDate extends Date = Date>(
	date: DateArg<Date> & {},
	day: Day,
	options?: NextDayOptions<ResultDate> | undefined,
): ResultDate {
	let delta = day - getDay(date, options);
	if (delta <= 0) delta += 7;

	return addDays(date, delta, options);
}

export interface PreviousDayOptions<ResultDate extends Date = Date>
	extends ContextOptions<ResultDate> {}

export function previousDay<ResultDate extends Date = Date>(
	date: DateArg<Date> & {},
	day: Day,
	options?: PreviousDayOptions<ResultDate> | undefined,
): ResultDate {
	let delta = getDay(date, options) - day;
	if (delta <= 0) delta += 7;

	return subDays(date, delta, options);
}

export function nextMonday<ResultDate extends Date = Date>(
	date: DateArg<Date> & {},
	options?: NextDayOptions<ResultDate> | undefined,
): ResultDate {
	return nextDay(date, 1, options);
}

export function nextTuesday<ResultDate extends Date = Date>(
	date: DateArg<Date> & {},
	options?: NextDayOptions<ResultDate> | undefined,
): ResultDate {
	return nextDay(date, 2, options);
}

export function nextWednesday<ResultDate extends Date = Date>(
	date: DateArg<Date> & {},
	options?: NextDayOptions<ResultDate> | undefined,
): ResultDate {
	return nextDay(date, 3, options);
}

export function nextThursday<ResultDate extends Date = Date>(
	date: DateArg<Date> & {},
	options?: NextDayOptions<ResultDate> | undefined,
): ResultDate {
	return nextDay(date, 4, options);
}

export function nextFriday<ResultDate extends Date = Date>(
	date: DateArg<Date> & {},
	options?: NextDayOptions<ResultDate> | undefined,
): ResultDate {
	return nextDay(date, 5, options);
}

export function nextSaturday<ResultDate extends Date = Date>(
	date: DateArg<Date> & {},
	options?: NextDayOptions<ResultDate> | undefined,
): ResultDate {
	return nextDay(date, 6, options);
}

export function nextSunday<ResultDate extends Date = Date>(
	date: DateArg<Date> & {},
	options?: NextDayOptions<ResultDate> | undefined,
): ResultDate {
	return nextDay(date, 0, options);
}

export function previousMonday<ResultDate extends Date = Date>(
	date: DateArg<Date> & {},
	options?: PreviousDayOptions<ResultDate> | undefined,
): ResultDate {
	return previousDay(date, 1, options);
}

export function previousTuesday<ResultDate extends Date = Date>(
	date: DateArg<Date> & {},
	options?: PreviousDayOptions<ResultDate> | undefined,
): ResultDate {
	return previousDay(date, 2, options);
}

export function previousWednesday<ResultDate extends Date = Date>(
	date: DateArg<Date> & {},
	options?: PreviousDayOptions<ResultDate> | undefined,
): ResultDate {
	return previousDay(date, 3, options);
}

export function previousThursday<ResultDate extends Date = Date>(
	date: DateArg<Date> & {},
	options?: PreviousDayOptions<ResultDate> | undefined,
): ResultDate {
	return previousDay(date, 4, options);
}

export function previousFriday<ResultDate extends Date = Date>(
	date: DateArg<Date> & {},
	options?: PreviousDayOptions<ResultDate> | undefined,
): ResultDate {
	return previousDay(date, 5, options);
}

export function previousSaturday<ResultDate extends Date = Date>(
	date: DateArg<Date> & {},
	options?: PreviousDayOptions<ResultDate> | undefined,
): ResultDate {
	return previousDay(date, 6, options);
}

export function previousSunday<ResultDate extends Date = Date>(
	date: DateArg<Date> & {},
	options?: PreviousDayOptions<ResultDate> | undefined,
): ResultDate {
	return previousDay(date, 0, options);
}
