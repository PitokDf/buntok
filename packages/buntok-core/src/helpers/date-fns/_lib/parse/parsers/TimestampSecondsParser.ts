import { constructFrom } from "../../to-date";
import { Parser } from "../parser";
import type { ParseFlags, ParseResult } from "../types";
import { parseAnyDigitsSigned } from "../utils";

export class TimestampSecondsParser extends Parser<number> {
	priority = 40;

	parse(dateString: string): ParseResult<number> {
		return parseAnyDigitsSigned(dateString);
	}

	set<DateType extends Date>(
		date: DateType,
		_flags: ParseFlags,
		value: number,
	): [DateType, ParseFlags] {
		return [constructFrom(date, value * 1000), { timestampIsSet: true }];
	}

	incompatibleTokens: string[] | "*" = "*";
}
