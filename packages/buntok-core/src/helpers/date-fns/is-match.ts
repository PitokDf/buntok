import type { AdditionalTokensOptions, LocalizedOptions } from "./_lib/types";
import { isValid } from "./is";
import { parse } from "./parse";

export interface IsMatchOptions
	extends LocalizedOptions<"options" | "match" | "formatLong">,
		AdditionalTokensOptions {}

export function isMatch(
	dateStr: string,
	formatStr: string,
	options?: IsMatchOptions,
): boolean {
	return isValid(parse(dateStr, formatStr, new Date(), options));
}
