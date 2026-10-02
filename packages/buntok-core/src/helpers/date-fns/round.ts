import { getRoundingMethod } from "./_lib/rounding";
import { constructFrom, toDate } from "./_lib/to-date";
import type {
	ContextOptions,
	DateArg,
	NearestHours,
	NearestMinutes,
	NearestToUnitOptions,
	RoundingOptions,
} from "./_lib/types";

export interface RoundToNearestHoursOptions<ResultDate extends Date = Date>
	extends NearestToUnitOptions<NearestHours>,
		RoundingOptions,
		ContextOptions<ResultDate> {}

export function roundToNearestHours<ResultDate extends Date = Date>(
	date: DateArg<Date> & {},
	options?: RoundToNearestHoursOptions<ResultDate> | undefined,
): ResultDate {
	const nearestTo: number = options?.nearestTo ?? 1;

	if (nearestTo < 1 || nearestTo > 12)
		return constructFrom(options?.in || date, NaN);

	const date_ = toDate(date, options?.in);
	const fractionalMinutes = date_.getMinutes() / 60;
	const fractionalSeconds = date_.getSeconds() / 60 / 60;
	const fractionalMilliseconds = date_.getMilliseconds() / 1000 / 60 / 60;
	const hours =
		date_.getHours() +
		fractionalMinutes +
		fractionalSeconds +
		fractionalMilliseconds;

	const method = options?.roundingMethod ?? "round";
	const roundingMethod = getRoundingMethod(method);

	const roundedHours = roundingMethod(hours / nearestTo) * nearestTo;

	date_.setHours(roundedHours, 0, 0, 0);
	return date_;
}

export interface RoundToNearestMinutesOptions<ResultDate extends Date = Date>
	extends NearestToUnitOptions<NearestMinutes>,
		RoundingOptions,
		ContextOptions<ResultDate> {}

export function roundToNearestMinutes<ResultDate extends Date = Date>(
	date: DateArg<Date> & {},
	options?: RoundToNearestMinutesOptions<ResultDate> | undefined,
): ResultDate {
	const nearestTo: number = options?.nearestTo ?? 1;

	if (nearestTo < 1 || nearestTo > 30) return constructFrom(date, NaN);

	const date_ = toDate(date, options?.in);
	const fractionalSeconds = date_.getSeconds() / 60;
	const fractionalMilliseconds = date_.getMilliseconds() / 1000 / 60;
	const minutes =
		date_.getMinutes() + fractionalSeconds + fractionalMilliseconds;

	const method = options?.roundingMethod ?? "round";
	const roundingMethod = getRoundingMethod(method);

	const roundedMinutes = roundingMethod(minutes / nearestTo) * nearestTo;

	date_.setMinutes(roundedMinutes, 0, 0);
	return date_;
}
