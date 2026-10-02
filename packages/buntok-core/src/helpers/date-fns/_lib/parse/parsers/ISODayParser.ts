import { setISODay } from "../../../set";
import type { Match } from "../../../locale/types";
import { Parser } from "../parser";
import type { ParseFlags, ParseResult } from "../types";
import { mapValue, parseNDigits } from "../utils";

export class ISODayParser extends Parser<number> {
	priority = 90;

	parse(dateString: string, token: string, match: Match): ParseResult<number> {
		const valueCallback = (value: number) => {
			if (value === 0) {
				return 7;
			}
			return value;
		};

		switch (token) {
			case "i":
			case "ii":
				return parseNDigits(token.length, dateString);
			case "io":
				return match.ordinalNumber(dateString, { unit: "day" });
			case "iii":
				return mapValue(
					match.day(dateString, {
						width: "abbreviated",
						context: "formatting",
					}) ||
						match.day(dateString, {
							width: "short",
							context: "formatting",
						}) ||
						match.day(dateString, {
							width: "narrow",
							context: "formatting",
						}),
					valueCallback,
				);
			case "iiiii":
				return mapValue(
					match.day(dateString, {
						width: "narrow",
						context: "formatting",
					}),
					valueCallback,
				);
			case "iiiiii":
				return mapValue(
					match.day(dateString, {
						width: "short",
						context: "formatting",
					}) ||
						match.day(dateString, {
							width: "narrow",
							context: "formatting",
						}),
					valueCallback,
				);
			case "iiii":
			default:
				return mapValue(
					match.day(dateString, {
						width: "wide",
						context: "formatting",
					}) ||
						match.day(dateString, {
							width: "abbreviated",
							context: "formatting",
						}) ||
						match.day(dateString, {
							width: "short",
							context: "formatting",
						}) ||
						match.day(dateString, {
							width: "narrow",
							context: "formatting",
						}),
					valueCallback,
				);
		}
	}

	validate(_date: Date, value: number): boolean {
		return value >= 1 && value <= 7;
	}

	set<DateType extends Date>(
		date: DateType,
		_flags: ParseFlags,
		value: number,
	): DateType {
		date = setISODay(date, value);
		date.setHours(0, 0, 0, 0);
		return date;
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
		"E",
		"e",
		"c",
		"t",
		"T",
	];
}
