import { constructFrom, constructNow, toDate } from "./_lib/to-date";
import {
	daysInWeek,
	daysInYear,
	millisecondsInHour,
	millisecondsInMinute,
	millisecondsInSecond,
	minutesInHour,
	monthsInQuarter,
	monthsInYear,
	quartersInYear,
	secondsInHour,
	secondsInMinute,
} from "./_lib/constants";
import type { ContextOptions, DateArg } from "./_lib/types";

export { constructFrom, constructNow, toDate } from "./_lib/to-date";

export interface FromUnixTimeOptions<ResultDate extends Date = Date>
	extends ContextOptions<ResultDate> {}

export function fromUnixTime<ResultDate extends Date = Date>(
	unixTime: number,
	options?: FromUnixTimeOptions<ResultDate> | undefined,
): ResultDate {
	return toDate(unixTime * 1000, options?.in);
}

function isConstructor(
	constructor: unknown,
): constructor is new (value?: DateArg<Date> & {}) => Date {
	return (
		typeof constructor === "function" &&
		(constructor as { prototype?: { constructor?: unknown } }).prototype
			?.constructor === constructor
	);
}

export function transpose(
	date: Date,
	constructor:
		| ((value: DateArg<Date> & {}) => Date)
		| Date
		| (new (value?: DateArg<Date> & {}) => Date),
): Date {
	const date_ = isConstructor(constructor)
		? new constructor(0)
		: constructFrom(constructor, 0);

	date_.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
	date_.setHours(
		date.getHours(),
		date.getMinutes(),
		date.getSeconds(),
		date.getMilliseconds(),
	);
	return date_;
}

export function daysToWeeks(days: number): number {
	const result = Math.trunc(days / daysInWeek);
	return result === 0 ? 0 : result;
}

export function weeksToDays(weeks: number): number {
	return Math.trunc(weeks * daysInWeek);
}

export function hoursToMinutes(hours: number): number {
	return Math.trunc(hours * minutesInHour);
}

export function hoursToSeconds(hours: number): number {
	return Math.trunc(hours * secondsInHour);
}

export function hoursToMilliseconds(hours: number): number {
	return Math.trunc(hours * millisecondsInHour);
}

export function minutesToHours(minutes: number): number {
	const hours = minutes / minutesInHour;
	return Math.trunc(hours);
}

export function minutesToSeconds(minutes: number): number {
	return Math.trunc(minutes * secondsInMinute);
}

export function minutesToMilliseconds(minutes: number): number {
	return Math.trunc(minutes * millisecondsInMinute);
}

export function secondsToHours(seconds: number): number {
	const hours = seconds / secondsInHour;
	return Math.trunc(hours);
}

export function secondsToMinutes(seconds: number): number {
	const minutes = seconds / secondsInMinute;
	return Math.trunc(minutes);
}

export function secondsToMilliseconds(seconds: number): number {
	return seconds * millisecondsInSecond;
}

export function millisecondsToMinutes(milliseconds: number): number {
	const minutes = milliseconds / millisecondsInMinute;
	return Math.trunc(minutes);
}

export function millisecondsToHours(milliseconds: number): number {
	const hours = milliseconds / millisecondsInHour;
	return Math.trunc(hours);
}

export function millisecondsToSeconds(milliseconds: number): number {
	const seconds = milliseconds / millisecondsInSecond;
	return Math.trunc(seconds);
}

export function monthsToQuarters(months: number): number {
	const quarters = months / monthsInQuarter;
	return Math.trunc(quarters);
}

export function monthsToYears(months: number): number {
	const years = months / monthsInYear;
	return Math.trunc(years);
}

export function quartersToMonths(quarters: number): number {
	return Math.trunc(quarters * monthsInQuarter);
}

export function quartersToYears(quarters: number): number {
	const years = quarters / quartersInYear;
	return Math.trunc(years);
}

export function yearsToMonths(years: number): number {
	return Math.trunc(years * monthsInYear);
}

export function yearsToQuarters(years: number): number {
	return Math.trunc(years * quartersInYear);
}

export function yearsToDays(years: number): number {
	return Math.trunc(years * daysInYear);
}
