import { constructFrom } from "../../to-date";
import { Parser } from "../parser";
import type { ParseFlags, ParseResult } from "../types";
import { parseAnyDigitsSigned } from "../utils";

export class TimestampMillisecondsParser extends Parser<number> {
	priority = 20;

	parse(dateString: string): ParseResult<number> {
		return parseAnyDigitsSigned(dateString);
	}

	set<DateType extends Date>(
		date: DateType,
		_flags: ParseFlags,
		value: number,
	): [DateType, ParseFlags] {
		return [constructFrom(date, value), { timestampIsSet: true }];
	}

	incompatibleTokens: string[] | "*" = "*";
}
