import { getDefaultOptions } from "./_lib/default-options";
import { enUS } from "./locale/en-US";
import type { FormatDistanceToken } from "./locale/types";
import type { Duration, DurationUnit, LocalizedOptions } from "./_lib/types";

export interface FormatDurationOptions
	extends LocalizedOptions<"formatDistance"> {
	format?: DurationUnit[];
	zero?: boolean;
	delimiter?: string;
}

const defaultFormat: DurationUnit[] = [
	"years",
	"months",
	"weeks",
	"days",
	"hours",
	"minutes",
	"seconds",
];

export function formatDuration(
	duration: Duration,
	options?: FormatDurationOptions,
): string {
	const defaultOptions = getDefaultOptions();
	const locale = options?.locale ?? defaultOptions.locale ?? enUS;
	const format = options?.format ?? defaultFormat;
	const zero = options?.zero ?? false;
	const delimiter = options?.delimiter ?? " ";

	if (!locale.formatDistance) {
		return "";
	}

	const result = format
		.reduce((acc: string[], unit) => {
			const token = `x${unit.replace(/(^.)/, (m) => m.toUpperCase())}` as
				FormatDistanceToken;
			const value = duration[unit];
			if (value !== undefined && (zero || duration[unit])) {
				return acc.concat(locale.formatDistance(token, value));
			}
			return acc;
		}, [])
		.join(delimiter);

	return result;
}
