import { constructFrom } from "./to-date";
import type { DateArg, Interval } from "./types";

export function normalizeDates(
	context: ((value: DateArg<Date> & {}) => Date) | Date | undefined,
	date1: DateArg<Date> & {},
	date2: DateArg<Date> & {},
): [Date, Date];
export function normalizeDates(
	context: ((value: DateArg<Date> & {}) => Date) | Date | undefined,
	date1: DateArg<Date> & {},
	date2: DateArg<Date> & {},
	date3: DateArg<Date> & {},
): [Date, Date, Date];
export function normalizeDates(
	context: ((value: DateArg<Date> & {}) => Date) | Date | undefined,
	...dates: (DateArg<Date> & {})[]
): [Date, ...Date[]];
export function normalizeDates(
	context: ((value: DateArg<Date> & {}) => Date) | Date | undefined,
	...dates: (DateArg<Date> & {})[]
): Date[] {
	const normalize = constructFrom.bind(
		null,
		context || dates.find((date) => typeof date === "object"),
	);
	return dates.map(normalize);
}

export function normalizeInterval(
	context: ((value: DateArg<Date> & {}) => Date) | Date | undefined,
	interval: Interval,
): { start: Date; end: Date } {
	const [start, end] = normalizeDates(context, interval.start, interval.end);
	return { start, end };
}


