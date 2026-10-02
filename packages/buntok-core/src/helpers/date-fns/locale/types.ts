import type {
	DateArg,
	Day,
	Era,
	FirstWeekContainsDateOptions,
	LocalizedOptions,
	Month,
	Quarter,
	WeekOptions,
} from "../_lib/types";

export interface Locale {
	code: string;
	formatDistance: FormatDistanceFn;
	formatRelative: FormatRelativeFn;
	localize: Localize;
	formatLong: FormatLong;
	match: Match;
	options?: LocaleOptions;
}

export interface LocaleOptions
	extends WeekOptions,
		FirstWeekContainsDateOptions {}

export type FormatDistanceFn = (
	token: FormatDistanceToken,
	count: number,
	options?: FormatDistanceFnOptions,
) => string;

export interface FormatDistanceFnOptions {
	addSuffix?: boolean;
	comparison?: -1 | 0 | 1;
}

export type FormatDistanceTokenFn = (
	count: number,
	options?: FormatDistanceFnOptions,
) => string;

export type FormatDistanceLocale<Template> = {
	[Token in FormatDistanceToken]: Template;
};

export type FormatDistanceToken =
	| "lessThanXSeconds"
	| "xSeconds"
	| "halfAMinute"
	| "lessThanXMinutes"
	| "xMinutes"
	| "aboutXHours"
	| "xHours"
	| "xDays"
	| "aboutXWeeks"
	| "xWeeks"
	| "aboutXMonths"
	| "xMonths"
	| "aboutXYears"
	| "xYears"
	| "overXYears"
	| "almostXYears";

export type FormatRelativeFn = <DateType extends Date>(
	token: FormatRelativeToken,
	date: DateType,
	baseDate: DateType,
	options?: FormatRelativeFnOptions,
) => string;

export interface FormatRelativeFnOptions
	extends WeekOptions,
		LocalizedOptions<"options" | "formatRelative"> {}

export type FormatRelativeTokenFn = <DateType extends Date>(
	date: DateArg<DateType>,
	baseDate: DateArg<DateType>,
	options?: FormatRelativeTokenFnOptions,
) => string;

export interface FormatRelativeTokenFnOptions extends WeekOptions {}

export type FormatRelativeToken =
	| "lastWeek"
	| "yesterday"
	| "today"
	| "tomorrow"
	| "nextWeek"
	| "other";

export interface FormatPart {
	isToken: boolean;
	value: string;
}

export interface Localize {
	ordinalNumber: LocalizeFn<number>;
	era: LocalizeFn<Era>;
	quarter: LocalizeFn<Quarter>;
	month: LocalizeFn<Month>;
	day: LocalizeFn<Day>;
	dayPeriod: LocalizeFn<LocaleDayPeriod>;
	preprocessor?: <DateType extends Date>(
		date: DateType,
		parts: FormatPart[],
	) => FormatPart[];
}

export type LocalizeFn<Value extends LocaleUnitValue | number> = (
	value: Value,
	options?: LocalizeFnOptions,
) => string;

export interface LocalizeFnOptions {
	width?: LocaleWidth;
	context?: "formatting" | "standalone";
	unit?: LocaleUnit;
}

export interface Match {
	ordinalNumber: MatchFn<
		number,
		{
			unit: LocaleUnit;
		}
	>;
	era: MatchFn<Era>;
	quarter: MatchFn<Quarter>;
	month: MatchFn<Month>;
	day: MatchFn<Day>;
	dayPeriod: MatchFn<LocaleDayPeriod>;
}

export type MatchFn<Result, ExtraOptions = Record<string, unknown>> = (
	str: string,
	options?: MatchFnOptions<Result> & ExtraOptions,
) => MatchFnResult<Result> | null;

export interface MatchFnOptions<Result> {
	width?: LocaleWidth;
	/** @deprecated Map the value manually instead. */
	valueCallback?: MatchValueCallback<string, Result>;
}

export type MatchValueCallback<Arg, Result> = (value: Arg) => Result;

export interface MatchFnResult<Result> {
	value: Result;
	rest: string;
}

export interface FormatLong {
	date: FormatLongFn;
	time: FormatLongFn;
	dateTime: FormatLongFn;
}

export type FormatLongFn = (options: FormatLongFnOptions) => string;

export interface FormatLongFnOptions {
	width?: FormatLongWidth;
}

export type FormatLongWidth = "full" | "long" | "medium" | "short" | "any";

export type LocaleUnitValue = Era | Quarter | Month | Day | LocaleDayPeriod;

export type LocaleWidth = "narrow" | "short" | "abbreviated" | "wide" | "any";

export type LocaleDayPeriod =
	| "am"
	| "pm"
	| "midnight"
	| "noon"
	| "morning"
	| "afternoon"
	| "evening"
	| "night";

export type LocaleUnit =
	| "second"
	| "minute"
	| "hour"
	| "day"
	| "dayOfYear"
	| "date"
	| "week"
	| "month"
	| "quarter"
	| "year";
