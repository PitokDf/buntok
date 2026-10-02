import type { Match } from "../../locale/types";
import { ValueSetter } from "./setter";
import type { ParseFlags, ParseResult, ParserOptions } from "./types";

export abstract class Parser<Value> {
	abstract incompatibleTokens: string[] | "*";
	abstract priority: number;
	declare subPriority?: number;

	run(
		dateString: string,
		token: string,
		match: Match,
		options: ParserOptions,
	): { setter: ValueSetter<Value>; rest: string } | null {
		const result = this.parse(dateString, token, match, options);
		if (!result) {
			return null;
		}

		return {
			setter: new ValueSetter(
				result.value,
				this.validate,
				this.set,
				this.priority,
				this.subPriority,
			),
			rest: result.rest,
		};
	}

	protected abstract parse(
		dateString: string,
		token: string,
		match: Match,
		options: ParserOptions,
	): ParseResult<Value>;

	protected validate<DateType extends Date>(
		_utcDate: DateType,
		_value: Value,
		_options: ParserOptions,
	): boolean {
		return true;
	}

	protected abstract set<DateType extends Date>(
		date: DateType,
		flags: ParseFlags,
		value: Value,
		options: ParserOptions,
	): DateType | [DateType, ParseFlags];
}
