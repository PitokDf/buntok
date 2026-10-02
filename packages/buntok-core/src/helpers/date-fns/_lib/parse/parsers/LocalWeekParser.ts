import { setWeek } from "../../../set";
import { startOfWeek } from "../../../start-end";
import type { Match } from "../../../locale/types";
import { numericPatterns } from "../constants";
import { Parser } from "../parser";
import type { ParseFlags, ParseResult, ParserOptions } from "../types";
import { parseNDigits, parseNumericPattern } from "../utils";

export class LocalWeekParser extends Parser<number> {
	priority = 100;

	parse(dateString: string, token: string, match: Match): ParseResult<number> {
		switch (token) {
			case "w":
				return parseNumericPattern(numericPatterns.week, dateString);
			case "wo":
				return match.ordinalNumber(dateString, { unit: "week" });
			default:
				return parseNDigits(token.length, dateString);
		}
	}

	validate(_date: Date, value: number): boolean {
		return value >= 1 && value <= 53;
	}

	set<DateType extends Date>(
		date: DateType,
		_flags: ParseFlags,
		value: number,
		options: ParserOptions,
	): DateType {
		return startOfWeek(setWeek(date, value, options), options);
	}

	incompatibleTokens = [
		"y",
		"R",
		"u",
		"q",
		"Q",
		"M",
		"L",
		"I",
		"d",
		"D",
		"i",
		"t",
		"T",
	];
}
