import type { Match } from "../../../locale/types";
import { Parser } from "../parser";
import type { ParseFlags, ParseResult } from "../types";
import { parseNDigits } from "../utils";

export class StandAloneQuarterParser extends Parser<number> {
	priority = 120;

	parse(dateString: string, token: string, match: Match): ParseResult<number> {
		switch (token) {
			case "q":
			case "qq":
				return parseNDigits(token.length, dateString);
			case "qo":
				return match.ordinalNumber(dateString, { unit: "quarter" });
			case "qqq":
				return (
					match.quarter(dateString, {
						width: "abbreviated",
						context: "standalone",
					}) ||
					match.quarter(dateString, {
						width: "narrow",
						context: "standalone",
					})
				);

			case "qqqqq":
				return match.quarter(dateString, {
					width: "narrow",
					context: "standalone",
				});
			case "qqqq":
			default:
				return (
					match.quarter(dateString, {
						width: "wide",
						context: "standalone",
					}) ||
					match.quarter(dateString, {
						width: "abbreviated",
						context: "standalone",
					}) ||
					match.quarter(dateString, {
						width: "narrow",
						context: "standalone",
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
		"Q",
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
