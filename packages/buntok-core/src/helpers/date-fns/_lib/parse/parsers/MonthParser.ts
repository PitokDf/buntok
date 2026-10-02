import type { Match } from "../../../locale/types";
import { numericPatterns } from "../constants";
import { Parser } from "../parser";
import type { ParseFlags, ParseResult } from "../types";
import { mapValue, parseNDigits, parseNumericPattern } from "../utils";

export class MonthParser extends Parser<number> {
	incompatibleTokens = [
		"Y",
		"R",
		"q",
		"Q",
		"L",
		"w",
		"I",
		"D",
		"i",
		"e",
		"c",
		"t",
		"T",
	];

	priority = 110;

	parse(dateString: string, token: string, match: Match): ParseResult<number> {
		const valueCallback = (value: number) => value - 1;

		switch (token) {
			case "M":
				return mapValue(
					parseNumericPattern(numericPatterns.month, dateString),
					valueCallback,
				);
			case "MM":
				return mapValue(parseNDigits(2, dateString), valueCallback);
			case "Mo":
				return mapValue(
					match.ordinalNumber(dateString, {
						unit: "month",
					}),
					valueCallback,
				);
			case "MMM":
				return (
					match.month(dateString, {
						width: "abbreviated",
						context: "formatting",
					}) ||
					match.month(dateString, { width: "narrow", context: "formatting" })
				);

			case "MMMMM":
				return match.month(dateString, {
					width: "narrow",
					context: "formatting",
				});
			case "MMMM":
			default:
				return (
					match.month(dateString, { width: "wide", context: "formatting" }) ||
					match.month(dateString, {
						width: "abbreviated",
						context: "formatting",
					}) ||
					match.month(dateString, { width: "narrow", context: "formatting" })
				);
		}
	}

	validate(_date: Date, value: number): boolean {
		return value >= 0 && value <= 11;
	}

	set<DateType extends Date>(
		date: DateType,
		_flags: ParseFlags,
		value: number,
	): DateType {
		date.setMonth(value, 1);
		date.setHours(0, 0, 0, 0);
		return date;
	}
}
