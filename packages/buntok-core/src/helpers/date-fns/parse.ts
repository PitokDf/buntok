import { getDefaultOptions } from "./_lib/default-options";
import { longFormatters } from "./_lib/format/long-formatters";
import {
	isProtectedDayOfYearToken,
	isProtectedWeekYearToken,
	warnOrThrowProtectedError,
} from "./_lib/protected-tokens";
import { constructFrom } from "./_lib/to-date";
import { toDate } from "./_lib/to-date";
import { enUS } from "./locale/en-US";
import { DateTimezoneSetter, Setter } from "./_lib/parse/setter";
import { parsers } from "./_lib/parse/parsers";
import type { ParseFlags } from "./_lib/parse/types";
import type {
	AdditionalTokensOptions,
	ContextOptions,
	DateArg,
	FirstWeekContainsDateOptions,
	LocalizedOptions,
	WeekOptions,
} from "./_lib/types";

export { longFormatters, parsers };

const formattingTokensRegExp =
	/[yYQqMLwIdDecihHKkms]o|(\w)\1*|''|'(''|[^'])+('|$)|./g;

const longFormattingTokensRegExp = /P+p+|P+|p+|''|'(''|[^'])+('|$)|./g;

const escapedStringRegExp = /^'([^]*?)'?$/;
const doubleQuoteRegExp = /''/g;
const notWhitespaceRegExp = /\S/;
const unescapedLatinCharacterRegExp = /[a-zA-Z]/;

export interface ParseOptions<ResultDate extends Date = Date>
	extends LocalizedOptions<"options" | "match" | "formatLong">,
		FirstWeekContainsDateOptions,
		WeekOptions,
		AdditionalTokensOptions,
		ContextOptions<ResultDate> {}

export function parse<
	DateType extends Date,
	ResultDate extends Date = DateType,
>(
	dateStr: string,
	formatStr: string,
	referenceDate: DateArg<DateType> & {},
	options?: ParseOptions<ResultDate>,
): ResultDate {
	const invalidDate = () =>
		constructFrom(options?.in || referenceDate, NaN as unknown as Date);
	const defaultOptions = getDefaultOptions();
	const locale = options?.locale ?? defaultOptions.locale ?? enUS;

	const firstWeekContainsDate =
		options?.firstWeekContainsDate ??
		options?.locale?.options?.firstWeekContainsDate ??
		defaultOptions.firstWeekContainsDate ??
		defaultOptions.locale?.options?.firstWeekContainsDate ??
		1;

	const weekStartsOn =
		options?.weekStartsOn ??
		options?.locale?.options?.weekStartsOn ??
		defaultOptions.weekStartsOn ??
		defaultOptions.locale?.options?.weekStartsOn ??
		0;

	if (!formatStr)
		return (dateStr
			? invalidDate()
			: toDate(referenceDate, options?.in)) as ResultDate;

	const subFnOptions = {
		firstWeekContainsDate,
		weekStartsOn,
		locale,
	};

	const setters: Setter[] = [new DateTimezoneSetter(options?.in, referenceDate)];

	const tokens = formatStr
		.match(longFormattingTokensRegExp)!
		.map((substring) => {
			const firstCharacter = substring[0];
			if (firstCharacter === "p" || firstCharacter === "P") {
				const longFormatter = longFormatters[firstCharacter];
				return longFormatter(substring, locale.formatLong);
			}
			return substring;
		})
		.join("")
		.match(formattingTokensRegExp)!;

	const usedTokens: { token: string; fullToken: string }[] = [];

	for (let token of tokens) {
		if (
			!options?.useAdditionalWeekYearTokens &&
			isProtectedWeekYearToken(token)
		) {
			warnOrThrowProtectedError(token, formatStr, dateStr);
		}
		if (
			!options?.useAdditionalDayOfYearTokens &&
			isProtectedDayOfYearToken(token)
		) {
			warnOrThrowProtectedError(token, formatStr, dateStr);
		}

		const firstCharacter = token[0]!;
		const parser = parsers[firstCharacter];
		if (parser) {
			const incompatibleTokens = parser.incompatibleTokens;
			if (Array.isArray(incompatibleTokens)) {
				const incompatibleToken = usedTokens.find(
					(usedToken) =>
						incompatibleTokens.includes(usedToken.token) ||
						usedToken.token === firstCharacter,
				);
				if (incompatibleToken) {
					throw new RangeError(
						`The format string mustn't contain \`${incompatibleToken.fullToken}\` and \`${token}\` at the same time`,
					);
				}
			} else if (parser.incompatibleTokens === "*" && usedTokens.length > 0) {
				throw new RangeError(
					`The format string mustn't contain \`${token}\` and any other token at the same time`,
				);
			}

			usedTokens.push({ token: firstCharacter, fullToken: token });

			const parseResult = parser.run(
				dateStr,
				token,
				locale.match,
				subFnOptions,
			);

			if (!parseResult) {
				return invalidDate() as ResultDate;
			}

			setters.push(parseResult.setter);

			dateStr = parseResult.rest;
		} else {
			if (firstCharacter.match(unescapedLatinCharacterRegExp)) {
				throw new RangeError(
					"Format string contains an unescaped latin alphabet character `" +
						firstCharacter +
						"`",
				);
			}

			if (token === "''") {
				token = "'";
			} else if (firstCharacter === "'") {
				token = cleanEscapedString(token);
			}

			if (dateStr.indexOf(token) === 0) {
				dateStr = dateStr.slice(token.length);
			} else {
				return invalidDate() as ResultDate;
			}
		}
	}

	if (dateStr.length > 0 && notWhitespaceRegExp.test(dateStr)) {
		return invalidDate() as ResultDate;
	}

	const uniquePrioritySetters = setters
		.map((setter) => setter.priority)
		.sort((a, b) => b - a)
		.filter((priority, index, array) => array.indexOf(priority) === index)
		.map((priority) =>
			setters
				.filter((setter) => setter.priority === priority)
				.sort((a, b) => b.subPriority - a.subPriority),
		)
		.map((setterArray) => setterArray[0]!);

	let date = toDate(referenceDate, options?.in);

	if (isNaN(+date)) return invalidDate() as ResultDate;

	const flags: ParseFlags = {};
	for (const setter of uniquePrioritySetters) {
		if (!setter.validate(date, subFnOptions)) {
			return invalidDate() as ResultDate;
		}

		const result = setter.set(date, flags, subFnOptions);
		if (Array.isArray(result)) {
			date = result[0];
			Object.assign(flags, result[1]);
		} else {
			date = result;
		}
	}

	return date as ResultDate;
}

function cleanEscapedString(input: string): string {
	return input.match(escapedStringRegExp)![1]!.replace(doubleQuoteRegExp, "'");
}
