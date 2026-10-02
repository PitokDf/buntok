import type { RoundingMethod } from "./types";

export function getRoundingMethod(
	method: RoundingMethod | undefined,
): (number: number) => number {
	return (number: number) => {
		const round = method ? Math[method] : Math.trunc;
		const result = round(number);
		return result === 0 ? 0 : result;
	};
}
