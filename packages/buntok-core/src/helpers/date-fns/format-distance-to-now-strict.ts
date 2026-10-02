import { constructNow } from "./_lib/to-date";
import { formatDistanceStrict } from "./format-distance-strict";
import type { FormatDistanceStrictOptions } from "./format-distance-strict";
import type { DateArg } from "./_lib/types";

export type FormatDistanceToNowStrictOptions = FormatDistanceStrictOptions;

export function formatDistanceToNowStrict(
	date: DateArg<Date> & {},
	options?: FormatDistanceToNowStrictOptions,
): string {
	return formatDistanceStrict(date, constructNow(date), options);
}
