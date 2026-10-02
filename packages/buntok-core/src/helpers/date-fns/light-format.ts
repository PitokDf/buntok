import { lightFormatters } from "./_lib/format/light-formatters";
import { isValid } from "./is";
import { toDate } from "./_lib/to-date";
import type { DateArg } from "./_lib/types";

export { lightFormatters };

const formattingTokensRegExp = /(\w)\1*|''|'(''|[^'])+('|$)|./g;

const escapedStringRegExp = /^'([^]*?)'?$/;
const doubleQuoteRegExp = /''/g;
const unescapedLatinCharacterRegExp = /[a-zA-Z]/;

export function lightFormat(
	date: DateArg<Date> & {},
	formatStr: string,
): string {
	const date_ = toDate(date);

	if (!isValid(date_)) {
		throw new RangeError("Invalid time value");
	}

	const tokens = formatStr.match(formattingTokensRegExp);

	if (!tokens) return "";

	const result = tokens
		.map((substring) => {
			if (substring === "''") {
				return "'";
			}

			const firstCharacter = substring[0]!;
			if (firstCharacter === "'") {
				return cleanEscapedString(substring);
			}

			const formatter =
				lightFormatters[firstCharacter as keyof typeof lightFormatters];
			if (formatter) {
				return formatter(date_, substring);
			}

			if (firstCharacter.match(unescapedLatinCharacterRegExp)) {
				throw new RangeError(
					"Format string contains an unescaped latin alphabet character `" +
						firstCharacter +
						"`",
				);
			}

			return substring;
		})
		.join("");

	return result;
}

function cleanEscapedString(input: string): string {
	const matches = input.match(escapedStringRegExp);
	if (!matches) return input;
	return matches[1]!.replace(doubleQuoteRegExp, "'");
}
