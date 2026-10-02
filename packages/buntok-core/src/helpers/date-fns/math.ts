import { daysInYear } from "./_lib/constants";
import { normalizeDates } from "./_lib/normalize-dates";
import { constructFrom, toDate } from "./_lib/to-date";
import type {
	ContextFn,
	ContextOptions,
	DateArg,
	Duration,
	Interval,
} from "./_lib/types";

export function milliseconds({
	years,
	months,
	weeks,
	days,
	hours,
	minutes,
	seconds,
}: Duration): number {
	let totalDays = 0;

	if (years) totalDays += years * daysInYear;
	if (months) totalDays += months * (daysInYear / 12);
	if (weeks) totalDays += weeks * 7;
	if (days) totalDays += days;

	let totalSeconds = totalDays * 24 * 60 * 60;

	if (hours) totalSeconds += hours * 60 * 60;
	if (minutes) totalSeconds += minutes * 60;
	if (seconds) totalSeconds += seconds;

	return Math.trunc(totalSeconds * 1000);
}

export function compareAsc(
	dateLeft: DateArg<Date> & {},
	dateRight: DateArg<Date> & {},
): number {
	const diff = +toDate(dateLeft) - +toDate(dateRight);

	if (diff < 0) return -1;
	else if (diff > 0) return 1;

	return diff;
}

export function compareDesc(
	dateLeft: DateArg<Date> & {},
	dateRight: DateArg<Date> & {},
): number {
	const diff = +toDate(dateLeft) - +toDate(dateRight);

	if (diff > 0) return -1;
	else if (diff < 0) return 1;

	return diff;
}

export function isEqual(
	leftDate: DateArg<Date> & {},
	rightDate: DateArg<Date> & {},
): boolean {
	return +toDate(leftDate) === +toDate(rightDate);
}

export interface MinOptions<ResultDate extends Date = Date>
	extends ContextOptions<ResultDate> {}

export function min<ResultDate extends Date = Date>(
	dates: Array<DateArg<Date> & {}>,
	options?: MinOptions<ResultDate> | undefined,
): ResultDate {
	let result: Date | undefined;
	let context: ContextFn<ResultDate> | undefined = options?.in;

	dates.forEach((date) => {
		if (!context && typeof date === "object") {
			context = constructFrom.bind(null, date) as ContextFn<ResultDate>;
		}

		const date_ = toDate(date, context);
		if (!result || result > date_ || Number.isNaN(+date_)) result = date_;
	});

	return constructFrom<Date, ResultDate>(context, result || NaN);
}

export interface MaxOptions<ResultDate extends Date = Date>
	extends ContextOptions<ResultDate> {}

export function max<ResultDate extends Date = Date>(
	dates: Array<DateArg<Date> & {}>,
	options?: MaxOptions<ResultDate> | undefined,
): ResultDate {
	let result: Date | undefined;
	let context: ContextFn<ResultDate> | undefined = options?.in;

	dates.forEach((date) => {
		if (!context && typeof date === "object") {
			context = constructFrom.bind(null, date) as ContextFn<ResultDate>;
		}

		const date_ = toDate(date, context);
		if (!result || result < date_ || Number.isNaN(+date_)) result = date_;
	});

	return constructFrom<Date, ResultDate>(context, result || NaN);
}

export interface ClampOptions<ResultDate extends Date = Date>
	extends ContextOptions<ResultDate> {}

export function clamp(
	date: DateArg<Date> & {},
	interval: Interval,
	options?: ClampOptions | undefined,
): Date {
	const [date_, start, end] = normalizeDates(
		options?.in,
		date,
		interval.start,
		interval.end,
	);

	return min([max([date_, start], options), end], options);
}

export interface ClosestToOptions<ResultDate extends Date = Date>
	extends ContextOptions<ResultDate> {}

export function closestTo<ResultDate extends Date = Date>(
	dateToCompare: DateArg<Date> & {},
	dates: Array<DateArg<Date> & {}>,
	options?: ClosestToOptions<ResultDate> | undefined,
): ResultDate | undefined {
	const normalized = normalizeDates(options?.in, dateToCompare, ...dates) as [
		Date,
		...Date[],
	];
	const [dateToCompare_, ...dates_] = normalized;

	const index = closestIndexTo(dateToCompare_, dates_);

	if (typeof index === "number" && Number.isNaN(index))
		return constructFrom<Date, ResultDate>(dateToCompare_, NaN);

	if (index !== undefined) return dates_[index] as ResultDate;

	return undefined;
}

export function closestIndexTo(
	dateToCompare: DateArg<Date> & {},
	dates: Array<DateArg<Date> & {}>,
): number | undefined {
	const timeToCompare = +toDate(dateToCompare);

	if (Number.isNaN(timeToCompare)) return Number.NaN;

	let result: number | undefined;
	let minDistance: number | undefined;
	dates.forEach((date, index) => {
		const date_ = toDate(date);

		if (Number.isNaN(+date_)) {
			result = Number.NaN;
			minDistance = Number.NaN;
			return;
		}

		const distance = Math.abs(timeToCompare - +date_);
		if (result == null || (minDistance !== undefined && distance < minDistance)) {
			result = index;
			minDistance = distance;
		}
	});

	return result;
}
