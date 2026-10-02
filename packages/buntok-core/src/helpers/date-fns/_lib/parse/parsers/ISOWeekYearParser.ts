import { constructFrom } from "../../to-date";
import { startOfISOWeek } from "../../../start-end";
import { Parser } from "../parser";
import type { ParseFlags, ParseResult } from "../types";
import { parseNDigitsSigned } from "../utils";

export class ISOWeekYearParser extends Parser<number> {
	priority = 130;

	parse(dateString: string, token: string): ParseResult<number> {
		if (token === "R") {
			return parseNDigitsSigned(4, dateString);
		}

		return parseNDigitsSigned(token.length, dateString);
	}

	set<DateType extends Date>(
		date: DateType,
		_flags: ParseFlags,
		value: number,
	): DateType {
		const firstWeekOfYear = constructFrom(date, 0);
		firstWeekOfYear.setFullYear(value, 0, 4);
		firstWeekOfYear.setHours(0, 0, 0, 0);
		return startOfISOWeek(firstWeekOfYear);
	}

	incompatibleTokens = [
		"G",
		"y",
		"Y",
		"u",
		"Q",
		"q",
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
