import { constructFromSymbol } from "./constants";
import type { Locale } from "../locale/types";

export type DateArg<DateType extends Date> = DateType | number | string;

export interface ConstructableDate extends Date {
	[constructFromSymbol]: <DateType extends Date = Date>(
		value: DateArg<Date> & {},
	) => DateType;
}

export interface GenericDateConstructor<DateType extends Date = Date> {
	new (): DateType;
	new (value: DateArg<Date> & {}): DateType;
	new (
		year: number,
		month: number,
		date?: number,
		hours?: number,
		minutes?: number,
		seconds?: number,
		ms?: number,
	): DateType;
}

export interface Duration {
	years?: number;
	months?: number;
	weeks?: number;
	days?: number;
	hours?: number;
	minutes?: number;
	seconds?: number;
}

export type DurationUnit = keyof Duration;

export interface Interval<
	StartDate extends DateArg<Date> = DateArg<Date>,
	EndDate extends DateArg<Date> = DateArg<Date>,
> {
	start: StartDate;
	end: EndDate;
}

export type NormalizedInterval<DateType extends Date = Date> = Interval<
	DateType,
	DateType
>;

export type Era = 0 | 1;

export type Quarter = 1 | 2 | 3 | 4;

export type Day = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type Month =
	| 0
	| 1
	| 2
	| 3
	| 4
	| 5
	| 6
	| 7
	| 8
	| 9
	| 10
	| 11;

export type FirstWeekContainsDate = 1 | 4;

export interface DateValues {
	year?: number;
	month?: number;
	date?: number;
	hours?: number;
	minutes?: number;
	seconds?: number;
	milliseconds?: number;
}

export type RoundingMethod = "ceil" | "floor" | "round" | "trunc";

export type ISOStringFormat = "extended" | "basic";

export type ISOStringRepresentation = "complete" | "date" | "time";

export interface StepOptions {
	step?: number;
}

export interface WeekOptions {
	weekStartsOn?: Day;
}

export interface FirstWeekContainsDateOptions {
	firstWeekContainsDate?: FirstWeekContainsDate;
}

export interface LocalizedOptions<LocaleFields extends keyof Locale> {
	locale?: Pick<Locale, LocaleFields>;
}

export interface ISOFormatOptions {
	format?: ISOStringFormat;
	representation?: ISOStringRepresentation;
}

export interface RoundingOptions {
	roundingMethod?: RoundingMethod;
}

export interface AdditionalTokensOptions {
	useAdditionalWeekYearTokens?: boolean;
	useAdditionalDayOfYearTokens?: boolean;
}

export type NearestMinutes =
	| 1
	| 2
	| 3
	| 4
	| 5
	| 6
	| 7
	| 8
	| 9
	| 10
	| 11
	| 12
	| 13
	| 14
	| 15
	| 16
	| 17
	| 18
	| 19
	| 20
	| 21
	| 22
	| 23
	| 24
	| 25
	| 26
	| 27
	| 28
	| 29
	| 30;

export type NearestHours = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

export type NearestMinutesOptions = NearestToUnitOptions<NearestMinutes>;

export interface NearestToUnitOptions<Unit extends number> {
	nearestTo?: Unit;
}

export interface ContextOptions<DateType extends Date> {
	in?: ContextFn<DateType> | undefined;
}

export type ContextFn<DateType extends Date> = (
	value: DateArg<Date> & {},
) => DateType;

export type MaybeArray<Type> = Type | Type[];

export type DefaultOptions = LocalizedOptions<keyof Locale> &
	WeekOptions &
	FirstWeekContainsDateOptions;
