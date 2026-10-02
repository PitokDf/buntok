import type { MatchFn, MatchValueCallback } from "../types";

export interface BuildMatchPatternFnArgs<Result> {
	matchPattern: RegExp;
	parsePattern: RegExp;
	valueCallback?: MatchValueCallback<string, Result>;
}

export function buildMatchPatternFn<Result>(
	args: BuildMatchPatternFnArgs<Result>,
): MatchFn<Result> {
	return (dirtyString, options = {}) => {
		const matchResult = dirtyString.match(args.matchPattern);
		if (!matchResult) return null;
		const matchedString = matchResult[0];

		const parseResult = dirtyString.match(args.parsePattern);
		if (!parseResult) return null;
		let value: string | Result = args.valueCallback
			? args.valueCallback(parseResult[0]!)
			: parseResult[0]!;
		if (options.valueCallback) value = options.valueCallback(value as string);

		const rest = dirtyString.slice(matchedString.length);

		return { value: value as Result, rest };
	};
}
