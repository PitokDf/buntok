import { toDate } from "./_lib/to-date";
import type { DateArg, MaybeArray } from "./_lib/types";

export type IntlFormatLocale = Intl.ResolvedDateTimeFormatOptions["locale"];
export type IntlFormatFormatOptions = Intl.DateTimeFormatOptions;

export interface IntlFormatLocaleOptions {
	locale: MaybeArray<Intl.ResolvedDateTimeFormatOptions["locale"]>;
}

export function intlFormat(date: DateArg<Date> & {}): string;
export function intlFormat(
	date: DateArg<Date> & {},
	localeOptions: IntlFormatLocaleOptions,
): string;
export function intlFormat(
	date: DateArg<Date> & {},
	formatOptions: IntlFormatFormatOptions,
): string;
export function intlFormat(
	date: DateArg<Date> & {},
	formatOptions: IntlFormatFormatOptions,
	localeOptions: IntlFormatLocaleOptions,
): string;
export function intlFormat(
	date: DateArg<Date> & {},
	formatOrLocale?: IntlFormatFormatOptions | IntlFormatLocaleOptions,
	localeOptions?: IntlFormatLocaleOptions,
): string {
	let formatOptions: IntlFormatFormatOptions | undefined;
	if (isFormatOptions(formatOrLocale)) {
		formatOptions = formatOrLocale;
	} else {
		localeOptions = formatOrLocale;
	}
	return new Intl.DateTimeFormat(localeOptions?.locale, formatOptions).format(
		toDate(date),
	);
}

function isFormatOptions(
	opts?: IntlFormatFormatOptions | IntlFormatLocaleOptions,
): opts is IntlFormatFormatOptions {
	return opts !== undefined && !("locale" in opts);
}
