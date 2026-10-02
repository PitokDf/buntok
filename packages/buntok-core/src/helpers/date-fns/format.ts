import { getDefaultOptions } from "./_lib/default-options";
import { formatters } from "./_lib/format/formatters";
import { longFormatters } from "./_lib/format/long-formatters";
import {
	isProtectedDayOfYearToken,
	isProtectedWeekYearToken,
	warnOrThrowProtectedError,
} from "./_lib/protected-tokens";
import {
	resolveFirstWeekContainsDate,
	resolveWeekStartsOn,
} from "./_lib/options";
import { isValid } from "./is";
import { toDate } from "./_lib/to-date";
import { enUS } from "./locale/en-US";
import type {
	AdditionalTokensOptions,
	ContextOptions,
	DateArg,
	FirstWeekContainsDateOptions,
	LocalizedOptions,
	WeekOptions,
} from "./_lib/types";
import type { FormatPart } from "./locale/types";

export { formatters, longFormatters };

const formattingTokensRegExp =
	/[yYQqMLwIdDecihHKkms]o|(\w)\1*|''|'(''|[^'])+('|$)|./g;

const longFormattingTokensRegExp = /P+p+|P+|p+|''|'(''|[^'])+('|$)|./g;

const escapedStringRegExp = /^'([^]*?)'?$/;
const doubleQuoteRegExp = /''/g;
const unescapedLatinCharacterRegExp = /[a-zA-Z]/;

export { format as formatDate };

export interface FormatOptions
	extends LocalizedOptions<"options" | "localize" | "formatLong">,
		WeekOptions,
		FirstWeekContainsDateOptions,
		AdditionalTokensOptions,
		ContextOptions<Date> {}

export function format(
	date: DateArg<Date> & {},
	formatStr: string,
	options?: FormatOptions,
): string {
	const defaultOptions = getDefaultOptions();
	const locale = options?.locale ?? defaultOptions.locale ?? enUS;

	const weekStartsOn = resolveWeekStartsOn(options);
	const firstWeekContainsDate = resolveFirstWeekContainsDate(options);

	const originalDate = toDate(date, options?.in);

	if (!isValid(originalDate)) {
		throw new RangeError("Invalid time value");
	}

	let parts: FormatPart[] = formatStr
		.match(longFormattingTokensRegExp)!
		.map((substring) => {
			const firstCharacter = substring[0]!;
			if (firstCharacter === "p" || firstCharacter === "P") {
				const longFormatter = longFormatters[firstCharacter as "p" | "P"];
				return longFormatter(substring, locale.formatLong);
			}
			return substring;
		})
		.join("")
		.match(formattingTokensRegExp)
		?.map((substring): FormatPart => {
			if (substring === "''") {
				return { isToken: false, value: "'" };
			}

			const firstCharacter = substring[0]!;
			if (firstCharacter === "'") {
				return { isToken: false, value: cleanEscapedString(substring) };
			}

			if (formatters[firstCharacter]) {
				return { isToken: true, value: substring };
			}

			if (firstCharacter.match(unescapedLatinCharacterRegExp)) {
				throw new RangeError(
					"Format string contains an unescaped latin alphabet character `" +
						firstCharacter +
						"`",
				);
			}

			return { isToken: false, value: substring };
		}) ?? [];

	if (locale.localize.preprocessor) {
		parts = locale.localize.preprocessor(originalDate, parts);
	}

	const formatterOptions = {
		firstWeekContainsDate,
		weekStartsOn,
		locale,
	};

	return parts
		.map((part) => {
			if (!part.isToken) return part.value;

			const token = part.value;

			if (
				(!options?.useAdditionalWeekYearTokens &&
					isProtectedWeekYearToken(token)) ||
				(!options?.useAdditionalDayOfYearTokens &&
					isProtectedDayOfYearToken(token))
			) {
				warnOrThrowProtectedError(token, formatStr, String(date));
			}

			const formatter = formatters[token[0]!];
			return formatter!(originalDate, token, locale.localize, formatterOptions);
		})
		.join("");
}

function cleanEscapedString(input: string): string {
	const matched = input.match(escapedStringRegExp);

	if (!matched) {
		return input;
	}

	return matched[1]!.replace(doubleQuoteRegExp, "'");
}
