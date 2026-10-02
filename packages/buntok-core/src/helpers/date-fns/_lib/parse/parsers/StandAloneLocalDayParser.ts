import { setDay } from "../../../set";
import type { Match } from "../../../locale/types";
import { Parser } from "../parser";
import type { ParseFlags, ParseResult, ParserOptions } from "../types";
import { mapValue, parseNDigits } from "../utils";

export class StandAloneLocalDayParser extends Parser<number> {
	priority = 90;

	parse(
		dateString: string,
		token: string,
		match: Match,
		options: ParserOptions,
	): ParseResult<number> {
		const valueCallback = (value: number) => {
			const wholeWeekDays = Math.floor((value - 1) / 7) * 7;
			return ((value + options.weekStartsOn + 6) % 7) + wholeWeekDays;
		};

		switch (token) {
			case "c":
			case "cc":
				return mapValue(parseNDigits(token.length, dateString), valueCallback);
			case "co":
				return mapValue(
					match.ordinalNumber(dateString, {
						unit: "day",
					}),
					valueCallback,
				);
			case "ccc":
				return (
					match.day(dateString, {
						width: "abbreviated",
						context: "standalone",
					}) ||
					match.day(dateString, { width: "short", context: "standalone" }) ||
					match.day(dateString, { width: "narrow", context: "standalone" })
				);

			case "ccccc":
				return match.day(dateString, {
					width: "narrow",
					context: "standalone",
				});
			case "cccccc":
				return (
					match.day(dateString, { width: "short", context: "standalone" }) ||
					match.day(dateString, { width: "narrow", context: "standalone" })
				);

			case "cccc":
			default:
				return (
					match.day(dateString, { width: "wide", context: "standalone" }) ||
					match.day(dateString, {
						width: "abbreviated",
						context: "standalone",
					}) ||
					match.day(dateString, { width: "short", context: "standalone" }) ||
					match.day(dateString, { width: "narrow", context: "standalone" })
				);
		}
	}

	validate(_date: Date, value: number): boolean {
		return value >= 0 && value <= 6;
	}

	set<DateType extends Date>(
		date: DateType,
		_flags: ParseFlags,
		value: number,
		options: ParserOptions,
	): DateType {
		date = setDay(date, value, options);
		date.setHours(0, 0, 0, 0);
		return date;
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
		"E",
		"i",
		"e",
		"t",
		"T",
	];
}
