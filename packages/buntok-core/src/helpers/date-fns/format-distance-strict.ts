import { getDefaultOptions } from "./_lib/default-options";
import {
	millisecondsInMinute,
	minutesInDay,
	minutesInMonth,
	minutesInYear,
} from "./_lib/constants";
import { getRoundingMethod } from "./_lib/rounding";
import { enUS } from "./locale/en-US";
import { normalizeDates } from "./_lib/normalize-dates";
import { getTimezoneOffsetInMilliseconds } from "./_lib/timezone";
import type { FormatDistanceFnOptions } from "./locale/types";
import type {
	ContextOptions,
	DateArg,
	LocalizedOptions,
	RoundingOptions,
} from "./_lib/types";
import { compareAsc } from "./math";

export type FormatDistanceStrictUnit =
	| "second"
	| "minute"
	| "hour"
	| "day"
	| "month"
	| "year";

export interface FormatDistanceStrictOptions
	extends LocalizedOptions<"formatDistance">,
		RoundingOptions,
		ContextOptions<Date> {
	addSuffix?: boolean;
	unit?: FormatDistanceStrictUnit;
}

export function formatDistanceStrict(
	laterDate: DateArg<Date> & {},
	earlierDate: DateArg<Date> & {},
	options?: FormatDistanceStrictOptions,
): string {
	const defaultOptions = getDefaultOptions();
	const locale = options?.locale ?? defaultOptions.locale ?? enUS;

	const comparison = compareAsc(laterDate, earlierDate);

	if (Number.isNaN(comparison)) {
		throw new RangeError("Invalid time value");
	}

	const localizeOptions: FormatDistanceFnOptions = Object.assign({}, options, {
		addSuffix: options?.addSuffix,
		comparison: comparison as -1 | 0 | 1,
	});

	const [laterDate_, earlierDate_] = normalizeDates(
		options?.in,
		comparison > 0 ? earlierDate : laterDate,
		comparison > 0 ? laterDate : earlierDate,
	);

	const roundingMethod = getRoundingMethod(options?.roundingMethod ?? "round");

	const milliseconds = earlierDate_.getTime() - laterDate_.getTime();
	const minutes = milliseconds / millisecondsInMinute;

	const timezoneOffset =
		getTimezoneOffsetInMilliseconds(earlierDate_) -
		getTimezoneOffsetInMilliseconds(laterDate_);

	const dstNormalizedMinutes =
		(milliseconds - timezoneOffset) / millisecondsInMinute;

	const defaultUnit = options?.unit;
	let unit: FormatDistanceStrictUnit;
	if (!defaultUnit) {
		if (minutes < 1) {
			unit = "second";
		} else if (minutes < 60) {
			unit = "minute";
		} else if (minutes < minutesInDay) {
			unit = "hour";
		} else if (dstNormalizedMinutes < minutesInMonth) {
			unit = "day";
		} else if (dstNormalizedMinutes < minutesInYear) {
			unit = "month";
		} else {
			unit = "year";
		}
	} else {
		unit = defaultUnit;
	}

	if (unit === "second") {
		const seconds = roundingMethod(milliseconds / 1000);
		return locale.formatDistance("xSeconds", seconds, localizeOptions);

	} else if (unit === "minute") {
		const roundedMinutes = roundingMethod(minutes);
		return locale.formatDistance("xMinutes", roundedMinutes, localizeOptions);

	} else if (unit === "hour") {
		const hours = roundingMethod(minutes / 60);
		return locale.formatDistance("xHours", hours, localizeOptions);

	} else if (unit === "day") {
		const days = roundingMethod(dstNormalizedMinutes / minutesInDay);
		return locale.formatDistance("xDays", days, localizeOptions);

	} else if (unit === "month") {
		const months = roundingMethod(dstNormalizedMinutes / minutesInMonth);
		return months === 12 && defaultUnit !== "month"
			? locale.formatDistance("xYears", 1, localizeOptions)
			: locale.formatDistance("xMonths", months, localizeOptions);

	} else {
		const years = roundingMethod(dstNormalizedMinutes / minutesInYear);
		return locale.formatDistance("xYears", years, localizeOptions);
	}
}
