import { add, addMinutes, addQuarters, addWeeks } from "./add";
import {
	differenceInDays,
	differenceInHours,
	differenceInMinutes,
	differenceInMonths,
	differenceInSeconds,
	differenceInYears,
} from "./difference";
import { isWeekend } from "./is";
import {
	normalizeDates,
	normalizeInterval,
} from "./_lib/normalize-dates";
import { getTimezoneOffsetInMilliseconds } from "./_lib/timezone";
import { millisecondsInDay } from "./_lib/constants";
import { constructFrom, toDate } from "./_lib/to-date";
import type {
	ContextOptions,
	DateArg,
	Duration,
	Interval,
	LocalizedOptions,
	StepOptions,
	WeekOptions,
} from "./_lib/types";
import {
	endOfMonth,
	endOfYear,
	startOfMonth,
	startOfQuarter,
	startOfWeek,
	startOfYear,
} from "./start-end";

export interface IntervalOptions<ResultDate extends Date = Date>
	extends ContextOptions<ResultDate> {
	assertPositive?: boolean;
}

export function interval(
	start: DateArg<Date> & {},
	end: DateArg<Date> & {},
	options?: IntervalOptions | undefined,
): Interval {
	const [_start, _end] = normalizeDates(options?.in, start, end);

	if (Number.isNaN(+_start)) throw new TypeError("Start date is invalid");
	if (Number.isNaN(+_end)) throw new TypeError("End date is invalid");

	if (options?.assertPositive && +_start > +_end)
		throw new TypeError("End date must be after start date");

	return { start: _start, end: _end };
}

export interface IntervalToDurationOptions extends ContextOptions<Date> {}

export function intervalToDuration(
	interval: Interval,
	options?: IntervalToDurationOptions | undefined,
): Duration {
	const { start, end } = normalizeInterval(options?.in, interval);
	const duration: Duration = {};

	const years = differenceInYears(end, start);
	if (years) duration.years = years;

	const remainingMonths = add(start, { years: duration.years });
	const months = differenceInMonths(end, remainingMonths);
	if (months) duration.months = months;

	const remainingDays = add(remainingMonths, { months: duration.months });
	const days = differenceInDays(end, remainingDays);
	if (days) duration.days = days;

	const remainingHours = add(remainingDays, { days: duration.days });
	const hours = differenceInHours(end, remainingHours);
	if (hours) duration.hours = hours;

	const remainingMinutes = add(remainingHours, { hours: duration.hours });
	const minutes = differenceInMinutes(end, remainingMinutes);
	if (minutes) duration.minutes = minutes;

	const remainingSeconds = add(remainingMinutes, { minutes: duration.minutes });
	const seconds = differenceInSeconds(end, remainingSeconds);
	if (seconds) duration.seconds = seconds;

	return duration;
}

export interface AreIntervalsOverlappingOptions
	extends ContextOptions<Date> {
	inclusive?: boolean;
}

export function areIntervalsOverlapping(
	intervalLeft: Interval,
	intervalRight: Interval,
	options?: AreIntervalsOverlappingOptions | undefined,
): boolean {
	const [leftStartTime, leftEndTime] = [
		+toDate(intervalLeft.start, options?.in),
		+toDate(intervalLeft.end, options?.in),
	].sort((a, b) => a - b) as [number, number];
	const [rightStartTime, rightEndTime] = [
		+toDate(intervalRight.start, options?.in),
		+toDate(intervalRight.end, options?.in),
	].sort((a, b) => a - b) as [number, number];

	if (options?.inclusive)
		return leftStartTime <= rightEndTime && rightStartTime <= leftEndTime;

	return leftStartTime < rightEndTime && rightStartTime < leftEndTime;
}

export function getOverlappingDaysInIntervals(
	intervalLeft: Interval,
	intervalRight: Interval,
): number {
	const [leftStart, leftEnd] = [
		+toDate(intervalLeft.start),
		+toDate(intervalLeft.end),
	].sort((a, b) => a - b) as [number, number];
	const [rightStart, rightEnd] = [
		+toDate(intervalRight.start),
		+toDate(intervalRight.end),
	].sort((a, b) => a - b) as [number, number];

	const isOverlapping = leftStart < rightEnd && rightStart < leftEnd;
	if (!isOverlapping) return 0;

	const overlapLeft = rightStart < leftStart ? leftStart : rightStart;
	const left = overlapLeft - getTimezoneOffsetInMilliseconds(overlapLeft);
	const overlapRight = rightEnd > leftEnd ? leftEnd : rightEnd;
	const right = overlapRight - getTimezoneOffsetInMilliseconds(overlapRight);

	return Math.ceil((right - left) / millisecondsInDay);
}

export interface EachDayOfIntervalOptions<ResultDate extends Date = Date>
	extends StepOptions,
		ContextOptions<ResultDate> {}

export function eachDayOfInterval<ResultDate extends Date = Date>(
	interval: Interval,
	options?: EachDayOfIntervalOptions<ResultDate> | undefined,
): ResultDate[] {
	const { start, end } = normalizeInterval(options?.in, interval);

	let reversed = +start > +end;
	const endTime = reversed ? +start : +end;
	const date = reversed ? end : start;
	date.setHours(0, 0, 0, 0);

	let step = options?.step ?? 1;
	if (!step) return [];
	if (step < 0) {
		step = -step;
		reversed = !reversed;
	}

	const dates: ResultDate[] = [];

	while (+date <= endTime) {
		dates.push(constructFrom(start, date) as ResultDate);
		date.setDate(date.getDate() + step);
		date.setHours(0, 0, 0, 0);
	}

	return reversed ? dates.reverse() : dates;
}

export interface EachHourOfIntervalOptions<ResultDate extends Date = Date>
	extends StepOptions,
		ContextOptions<ResultDate> {}

export function eachHourOfInterval<ResultDate extends Date = Date>(
	interval: Interval,
	options?: EachHourOfIntervalOptions<ResultDate> | undefined,
): ResultDate[] {
	const { start, end } = normalizeInterval(options?.in, interval);

	let reversed = +start > +end;
	const endTime = reversed ? +start : +end;
	const date = reversed ? end : start;
	date.setMinutes(0, 0, 0);

	let step = options?.step ?? 1;
	if (!step) return [];
	if (step < 0) {
		step = -step;
		reversed = !reversed;
	}

	const dates: ResultDate[] = [];

	while (+date <= endTime) {
		dates.push(constructFrom(start, date) as ResultDate);
		date.setHours(date.getHours() + step);
	}

	return reversed ? dates.reverse() : dates;
}

export interface EachMinuteOfIntervalOptions<ResultDate extends Date = Date>
	extends StepOptions,
		ContextOptions<ResultDate> {}

export function eachMinuteOfInterval<ResultDate extends Date = Date>(
	interval: Interval,
	options?: EachMinuteOfIntervalOptions<ResultDate> | undefined,
): ResultDate[] {
	const { start, end } = normalizeInterval(options?.in, interval);
	start.setSeconds(0, 0);

	let reversed = +start > +end;
	const endTime = reversed ? +start : +end;
	let date = reversed ? end : start;

	let step = options?.step ?? 1;
	if (!step) return [];
	if (step < 0) {
		step = -step;
		reversed = !reversed;
	}

	const dates: ResultDate[] = [];

	while (+date <= endTime) {
		dates.push(constructFrom(start, date) as ResultDate);
		date = addMinutes(date, step);
	}

	return reversed ? dates.reverse() : dates;
}

export interface EachMonthOfIntervalOptions<ResultDate extends Date = Date>
	extends StepOptions,
		ContextOptions<ResultDate> {}

export function eachMonthOfInterval<ResultDate extends Date = Date>(
	interval: Interval,
	options?: EachMonthOfIntervalOptions<ResultDate> | undefined,
): ResultDate[] {
	const { start, end } = normalizeInterval(options?.in, interval);

	let reversed = +start > +end;
	const endTime = reversed ? +start : +end;
	const date = reversed ? end : start;
	date.setHours(0, 0, 0, 0);
	date.setDate(1);

	let step = options?.step ?? 1;
	if (!step) return [];
	if (step < 0) {
		step = -step;
		reversed = !reversed;
	}

	const dates: ResultDate[] = [];

	while (+date <= endTime) {
		dates.push(constructFrom(start, date) as ResultDate);
		date.setMonth(date.getMonth() + step);
	}

	return reversed ? dates.reverse() : dates;
}

export interface EachQuarterOfIntervalOptions<ResultDate extends Date = Date>
	extends StepOptions,
		ContextOptions<ResultDate> {}

export function eachQuarterOfInterval<ResultDate extends Date = Date>(
	interval: Interval,
	options?: EachQuarterOfIntervalOptions<ResultDate> | undefined,
): ResultDate[] {
	const { start, end } = normalizeInterval(options?.in, interval);

	let reversed = +start > +end;
	const endTime = reversed ? +startOfQuarter(start) : +startOfQuarter(end);
	let date = reversed ? startOfQuarter(end) : startOfQuarter(start);

	let step = options?.step ?? 1;
	if (!step) return [];
	if (step < 0) {
		step = -step;
		reversed = !reversed;
	}

	const dates: ResultDate[] = [];

	while (+date <= endTime) {
		dates.push(constructFrom(start, date) as ResultDate);
		date = addQuarters(date, step);
	}

	return reversed ? dates.reverse() : dates;
}

export interface EachWeekOfIntervalOptions<ResultDate extends Date = Date>
	extends StepOptions,
		ContextOptions<ResultDate>,
		LocalizedOptions<"options">,
		WeekOptions {}

export function eachWeekOfInterval<ResultDate extends Date = Date>(
	interval: Interval,
	options?: EachWeekOfIntervalOptions<ResultDate> | undefined,
): ResultDate[] {
	const { start, end } = normalizeInterval(options?.in, interval);

	let reversed = +start > +end;
	const startDateWeek = reversed
		? startOfWeek(end, options)
		: startOfWeek(start, options);
	const endDateWeek = reversed
		? startOfWeek(start, options)
		: startOfWeek(end, options);

	startDateWeek.setHours(15);
	endDateWeek.setHours(15);

	const endTime = +endDateWeek.getTime();
	let currentDate = startDateWeek;

	let step = options?.step ?? 1;
	if (!step) return [];
	if (step < 0) {
		step = -step;
		reversed = !reversed;
	}

	const dates: ResultDate[] = [];

	while (+currentDate <= endTime) {
		currentDate.setHours(0);
		dates.push(constructFrom(start, currentDate) as ResultDate);
		currentDate = addWeeks(currentDate, step);
		currentDate.setHours(15);
	}

	return reversed ? dates.reverse() : dates;
}

export interface EachYearOfIntervalOptions<ResultDate extends Date = Date>
	extends StepOptions,
		ContextOptions<ResultDate> {}

export function eachYearOfInterval<ResultDate extends Date = Date>(
	interval: Interval,
	options?: EachYearOfIntervalOptions<ResultDate> | undefined,
): ResultDate[] {
	const { start, end } = normalizeInterval(options?.in, interval);

	let reversed = +start > +end;
	const endTime = reversed ? +start : +end;
	const date = reversed ? end : start;
	date.setHours(0, 0, 0, 0);
	date.setMonth(0, 1);

	let step = options?.step ?? 1;
	if (!step) return [];
	if (step < 0) {
		step = -step;
		reversed = !reversed;
	}

	const dates: ResultDate[] = [];

	while (+date <= endTime) {
		dates.push(constructFrom(start, date) as ResultDate);
		date.setFullYear(date.getFullYear() + step);
	}

	return reversed ? dates.reverse() : dates;
}

export interface EachWeekendOfIntervalOptions<ResultDate extends Date = Date>
	extends ContextOptions<ResultDate> {}

export function eachWeekendOfInterval<ResultDate extends Date = Date>(
	interval: Interval,
	options?: EachWeekendOfIntervalOptions<ResultDate> | undefined,
): ResultDate[] {
	const { start, end } = normalizeInterval(options?.in, interval);
	const dateInterval = eachDayOfInterval({ start, end }, options);
	const weekends: ResultDate[] = [];
	let index = 0;
	while (index < dateInterval.length) {
		const date = dateInterval[index++] as ResultDate;
		if (isWeekend(date)) weekends.push(constructFrom(start, date) as ResultDate);
	}
	return weekends;
}

export interface EachWeekendOfMonthOptions<ResultDate extends Date = Date>
	extends ContextOptions<ResultDate> {}

export function eachWeekendOfMonth<ResultDate extends Date = Date>(
	date: DateArg<Date> & {},
	options?: EachWeekendOfMonthOptions<ResultDate> | undefined,
): ResultDate[] {
	const start = startOfMonth(date, options);
	const end = endOfMonth(date, options);
	return eachWeekendOfInterval({ start, end }, options);
}

export interface EachWeekendOfYearOptions<ResultDate extends Date = Date>
	extends ContextOptions<ResultDate> {}

export function eachWeekendOfYear<ResultDate extends Date = Date>(
	date: DateArg<Date> & {},
	options?: EachWeekendOfYearOptions<ResultDate> | undefined,
): ResultDate[] {
	const start = startOfYear(date, options);
	const end = endOfYear(date, options);
	return eachWeekendOfInterval({ start, end }, options);
}
