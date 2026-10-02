import type { Match } from "../../../locale/types";
import { Parser } from "../parser";
import type { ParseFlags, ParseResult } from "../types";
import { mapValue, normalizeTwoDigitYear, parseNDigits } from "../utils";

export interface YearParserValue {
	year: number;
	isTwoDigitYear: boolean;
}

export class YearParser extends Parser<YearParserValue> {
	priority = 130;
	incompatibleTokens = ["Y", "R", "u", "w", "I", "i", "e", "c", "t", "T"];

	parse(dateString: string, token: string, match: Match): ParseResult<YearParserValue> {
		const valueCallback = (year: number) => ({
			year,
			isTwoDigitYear: token === "yy",
		});

		switch (token) {
			case "y":
				return mapValue(parseNDigits(4, dateString), valueCallback);
			case "yo":
				return mapValue(
					match.ordinalNumber(dateString, {
						unit: "year",
					}),
					valueCallback,
				);
			default:
				return mapValue(parseNDigits(token.length, dateString), valueCallback);
		}
	}

	protected override validate(
		_date: Date,
		value: YearParserValue,
	): boolean {
		return value.isTwoDigitYear || value.year > 0;
	}

	override set<DateType extends Date>(
		date: DateType,
		flags: ParseFlags,
		value: YearParserValue,
	): DateType {
		const currentYear = date.getFullYear();

		if (value.isTwoDigitYear) {
			const normalizedTwoDigitYear = normalizeTwoDigitYear(
				value.year,
				currentYear,
			);
			date.setFullYear(normalizedTwoDigitYear, 0, 1);
			date.setHours(0, 0, 0, 0);
			return date;
		}

		const year =
			!("era" in flags) || flags.era === 1 ? value.year : 1 - value.year;
		date.setFullYear(year, 0, 1);
		date.setHours(0, 0, 0, 0);
		return date;
	}
}
