import type { Match } from "../../../locale/types";
import { Parser } from "../parser";
import type { ParseFlags, ParseResult } from "../types";
import { parseNDigits } from "../utils";

export class QuarterParser extends Parser<number> {
	priority = 120;

	parse(dateString: string, token: string, match: Match): ParseResult<number> {
		switch (token) {
			case "Q":
			case "QQ":
				return parseNDigits(token.length, dateString);
			case "Qo":
				return match.ordinalNumber(dateString, { unit: "quarter" });
			case "QQQ":
				return (
					match.quarter(dateString, {
						width: "abbreviated",
						context: "formatting",
					}) ||
					match.quarter(dateString, {
						width: "narrow",
						context: "formatting",
					})
				);

			case "QQQQQ":
				return match.quarter(dateString, {
					width: "narrow",
					context: "formatting",
				});
			case "QQQQ":
			default:
				return (
					match.quarter(dateString, {
						width: "wide",
						context: "formatting",
					}) ||
					match.quarter(dateString, {
						width: "abbreviated",
						context: "formatting",
					}) ||
					match.quarter(dateString, {
						width: "narrow",
						context: "formatting",
					})
				);
		}
	}

	validate(_date: Date, value: number): boolean {
		return value >= 1 && value <= 4;
	}

	set<DateType extends Date>(
		date: DateType,
		_flags: ParseFlags,
		value: number,
	): DateType {
		date.setMonth((value - 1) * 3, 1);
		date.setHours(0, 0, 0, 0);
		return date;
	}

	incompatibleTokens = [
		"Y",
		"R",
		"q",
		"M",
		"L",
		"w",
		"I",
		"d",
		"D",
		"i",
		"e",
		"c",
		"t",
		"T",
	];
}
