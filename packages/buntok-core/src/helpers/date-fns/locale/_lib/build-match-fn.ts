import type { Day, Era, Month, Quarter } from "../../_lib/types";
import type {
	LocaleDayPeriod,
	LocaleUnitValue,
	LocaleWidth,
	MatchFn,
	MatchValueCallback,
} from "../types";

export interface BuildMatchFnArgs<
	Result extends LocaleUnitValue,
	DefaultMatchWidth extends LocaleWidth,
	DefaultParseWidth extends LocaleWidth,
> {
	matchPatterns: BuildMatchFnMatchPatterns<DefaultMatchWidth>;
	defaultMatchWidth: DefaultMatchWidth;
	parsePatterns: BuildMatchFnParsePatterns<Result, DefaultParseWidth>;
	defaultParseWidth: DefaultParseWidth;
	valueCallback?: MatchValueCallback<
		Result extends LocaleDayPeriod ? string : number,
		Result
	>;
}

export type BuildMatchFnMatchPatterns<DefaultWidth extends LocaleWidth> = {
	[Width in LocaleWidth]?: RegExp;
} & {
	[Width in DefaultWidth]: RegExp;
};

export type BuildMatchFnParsePatterns<
	Value extends LocaleUnitValue,
	DefaultWidth extends LocaleWidth,
> = {
	[Width in LocaleWidth]?: ParsePattern<Value>;
} & {
	[Width in DefaultWidth]: ParsePattern<Value>;
};

export type ParsePattern<Value extends LocaleUnitValue> =
	Value extends LocaleDayPeriod
		? Record<LocaleDayPeriod, RegExp>
		: Value extends Quarter
			? readonly [RegExp, RegExp, RegExp, RegExp]
			: Value extends Era
				? readonly [RegExp, RegExp]
				: Value extends Day
					? readonly [
							RegExp,
							RegExp,
							RegExp,
							RegExp,
							RegExp,
							RegExp,
							RegExp,
						]
					: Value extends Month
						? readonly [
								RegExp,
								RegExp,
								RegExp,
								RegExp,
								RegExp,
								RegExp,
								RegExp,
								RegExp,
								RegExp,
								RegExp,
								RegExp,
								RegExp,
							]
						: never;

export function buildMatchFn<
	Result extends LocaleUnitValue,
	DefaultMatchWidth extends LocaleWidth,
	DefaultParseWidth extends LocaleWidth,
>(
	args: BuildMatchFnArgs<Result, DefaultMatchWidth, DefaultParseWidth>,
): MatchFn<Result> {
	return (dirtyString, options = {}) => {
		const width = options.width;

		const matchPattern =
			(width && args.matchPatterns[width]) ||
			args.matchPatterns[args.defaultMatchWidth];
		const matchResult = dirtyString.match(matchPattern);

		if (!matchResult) {
			return null;
		}
		const matchedString = matchResult[0];

		const parsePatterns =
			(width && args.parsePatterns[width]) ||
			args.parsePatterns[args.defaultParseWidth];

		const key = Array.isArray(parsePatterns)
			? findIndex(
					parsePatterns as readonly RegExp[],
					(pattern) => pattern.test(matchedString),
				)
			: findKey(
					parsePatterns as unknown as Record<string, RegExp>,
					(pattern) => pattern.test(matchedString),
				);

		let value: unknown;
		const argsValueCallback = args.valueCallback as unknown as
			| ((matched: unknown) => Result)
			| undefined;
		value = argsValueCallback ? argsValueCallback(key) : key;
		value = options.valueCallback
			? options.valueCallback(value as string)
			: value;

		const rest = dirtyString.slice(matchedString.length);

		return { value: value as Result, rest };
	};
}

function findKey(
	object: Record<string, RegExp>,
	predicate: (pattern: RegExp) => boolean,
): string | undefined {
	for (const key in object) {
		if (
			Object.prototype.hasOwnProperty.call(object, key) &&
			predicate(object[key]!)
		) {
			return key;
		}
	}
	return undefined;
}

function findIndex(
	array: readonly RegExp[],
	predicate: (pattern: RegExp) => boolean,
): number | undefined {
	for (let key = 0; key < array.length; key++) {
		if (predicate(array[key]!)) {
			return key;
		}
	}
	return undefined;
}
