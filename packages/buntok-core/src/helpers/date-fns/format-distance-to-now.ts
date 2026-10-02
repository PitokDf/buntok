import { constructNow } from "./_lib/to-date";
import { formatDistance } from "./format-distance";
import type { FormatDistanceOptions } from "./format-distance";
import type { DateArg } from "./_lib/types";


export type FormatDistanceToNowOptions = FormatDistanceOptions;

export function formatDistanceToNow(
	date: DateArg<Date> & {},
	options?: FormatDistanceToNowOptions,
): string {
	return formatDistance(date, constructNow(date), options);
}
