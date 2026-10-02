import { getDefaultOptions } from "./default-options";
import type {
	Day,
	FirstWeekContainsDate,
	LocalizedOptions,
	WeekOptions,
} from "./types";

type WeekOptionsSource =
	| (LocalizedOptions<"options"> & WeekOptions)
	| undefined;

type FirstWeekOptionsSource =
	| (LocalizedOptions<"options"> & {
			firstWeekContainsDate?: FirstWeekContainsDate;
	  })
	| undefined;

export function resolveWeekStartsOn(options: WeekOptionsSource): Day {
	const defaultOptions = getDefaultOptions();
	return (
		options?.weekStartsOn ??
		options?.locale?.options?.weekStartsOn ??
		defaultOptions.weekStartsOn ??
		defaultOptions.locale?.options?.weekStartsOn ??
		0
	);
}

export function resolveFirstWeekContainsDate(
	options: FirstWeekOptionsSource,
): FirstWeekContainsDate {
	const defaultOptions = getDefaultOptions();
	return (
		options?.firstWeekContainsDate ??
		options?.locale?.options?.firstWeekContainsDate ??
		defaultOptions.firstWeekContainsDate ??
		defaultOptions.locale?.options?.firstWeekContainsDate ??
		1
	);
}
