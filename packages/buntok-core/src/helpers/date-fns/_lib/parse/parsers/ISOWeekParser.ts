import { setISOWeek } from "../../../set";
import { startOfISOWeek } from "../../../start-end";
import type { Match } from "../../../locale/types";
import { numericPatterns } from "../constants";
import { Parser } from "../parser";
import type { ParseFlags, ParseResult } from "../types";
import { parseNDigits, parseNumericPattern } from "../utils";

export class ISOWeekParser extends Parser<number> {
	priority = 100;

	parse(dateString: string, token: string, match: Match): ParseResult<number> {
		switch (token) {
			case "I":
				return parseNumericPattern(numericPatterns.week, dateString);
			case "Io":
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
	): DateType {
		return startOfISOWeek(setISOWeek(date, value));
	}

	incompatibleTokens = [
		"y",
		"Y",
		"u",
		"q",
		"Q",
		"M",
		"L",
		"w",
		"d",
		"D",
		"e",
		"c",
		"t",
		"T",
	];
}
