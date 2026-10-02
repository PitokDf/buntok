import { differenceInMonths, differenceInSeconds } from "./difference";
import { getDefaultOptions } from "./_lib/default-options";
import { minutesInDay, minutesInMonth } from "./_lib/constants";
import { enUS } from "./locale/en-US";
import { normalizeDates } from "./_lib/normalize-dates";
import { getTimezoneOffsetInMilliseconds } from "./_lib/timezone";
import type { FormatDistanceFnOptions } from "./locale/types";
import type { ContextOptions, DateArg, LocalizedOptions } from "./_lib/types";
import { compareAsc } from "./math";

export interface FormatDistanceOptions
	extends LocalizedOptions<"formatDistance">,
		ContextOptions<Date> {
	includeSeconds?: boolean;
	addSuffix?: boolean;
}

export function formatDistance(
	laterDate: DateArg<Date> & {},
	earlierDate: DateArg<Date> & {},
	options?: FormatDistanceOptions,
): string {
	const defaultOptions = getDefaultOptions();
	const locale = options?.locale ?? defaultOptions.locale ?? enUS;
	const minutesInAlmostTwoDays = 2520;

	const comparison = compareAsc(laterDate, earlierDate);

	if (Number.isNaN(comparison)) throw new RangeError("Invalid time value");

	const localizeOptions: FormatDistanceFnOptions = Object.assign({}, options, {
		addSuffix: options?.addSuffix,
		comparison: comparison as -1 | 0 | 1,
	});

	const [laterDate_, earlierDate_] = normalizeDates(
		options?.in,
		comparison > 0 ? earlierDate : laterDate,
		comparison > 0 ? laterDate : earlierDate,
	);

	const seconds = differenceInSeconds(earlierDate_, laterDate_);
	const offsetInSeconds =
		(getTimezoneOffsetInMilliseconds(earlierDate_) -
			getTimezoneOffsetInMilliseconds(laterDate_)) /
		1000;
	const minutes = Math.round((seconds - offsetInSeconds) / 60);
	let months: number;

	if (minutes < 2) {
		if (options?.includeSeconds) {
			if (seconds < 5) {
				return locale.formatDistance("lessThanXSeconds", 5, localizeOptions);
			} else if (seconds < 10) {
				return locale.formatDistance("lessThanXSeconds", 10, localizeOptions);
			} else if (seconds < 20) {
				return locale.formatDistance("lessThanXSeconds", 20, localizeOptions);
			} else if (seconds < 40) {
				return locale.formatDistance("halfAMinute", 0, localizeOptions);
			} else if (seconds < 60) {
				return locale.formatDistance("lessThanXMinutes", 1, localizeOptions);
			} else {
				return locale.formatDistance("xMinutes", 1, localizeOptions);
			}
		} else {
			if (minutes === 0) {
				return locale.formatDistance("lessThanXMinutes", 1, localizeOptions);
			} else {
				return locale.formatDistance("xMinutes", minutes, localizeOptions);
			}
		}

	} else if (minutes < 45) {
		return locale.formatDistance("xMinutes", minutes, localizeOptions);

	} else if (minutes < 90) {
		return locale.formatDistance("aboutXHours", 1, localizeOptions);

	} else if (minutes < minutesInDay) {
		const hours = Math.round(minutes / 60);
		return locale.formatDistance("aboutXHours", hours, localizeOptions);

	} else if (minutes < minutesInAlmostTwoDays) {
		return locale.formatDistance("xDays", 1, localizeOptions);

	} else if (minutes < minutesInMonth) {
		const days = Math.round(minutes / minutesInDay);
		return locale.formatDistance("xDays", days, localizeOptions);

	} else if (minutes < minutesInMonth * 2) {
		months = Math.round(minutes / minutesInMonth);
		return locale.formatDistance("aboutXMonths", months, localizeOptions);
	}

	months = differenceInMonths(earlierDate_, laterDate_);

	if (months < 12) {
		const nearestMonth = Math.round(minutes / minutesInMonth);
		return locale.formatDistance("xMonths", nearestMonth, localizeOptions);

	} else {
		const monthsSinceStartOfYear = months % 12;
		const years = Math.trunc(months / 12);

		if (monthsSinceStartOfYear < 3) {
			return locale.formatDistance("aboutXYears", years, localizeOptions);

		} else if (monthsSinceStartOfYear < 9) {
			return locale.formatDistance("overXYears", years, localizeOptions);

		} else {
			return locale.formatDistance("almostXYears", years + 1, localizeOptions);
		}
	}
}
