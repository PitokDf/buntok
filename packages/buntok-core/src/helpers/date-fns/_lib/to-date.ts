import { constructFromSymbol } from "./constants";
import type { ConstructableDate, ContextFn, DateArg } from "./types";

export function constructFrom<
	DateType extends Date | ConstructableDate,
	ResultDate extends Date = DateType,
>(
	date: DateArg<DateType> | ContextFn<ResultDate> | undefined,
	value: DateArg<Date> & {},
): ResultDate {
	if (typeof date === "function") return date(value);

	if (date && typeof date === "object" && constructFromSymbol in date)
		return date[constructFromSymbol](value);

	if (date instanceof Date) {
		const DateCtor = date.constructor as new (
			value: DateArg<Date> & {},
		) => ResultDate;
		return new DateCtor(value);
	}

	return new Date(value) as ResultDate;
}

export function toDate<
	DateType extends Date | ConstructableDate,
	ResultDate extends Date = DateType,
>(
	argument: DateArg<DateType>,
	context?: ContextFn<ResultDate> | undefined,
): ResultDate {
	return constructFrom(context || argument, argument);
}

export function constructNow<
	DateType extends Date,
	ResultDate extends Date = DateType,
>(date: DateArg<DateType> | ContextFn<ResultDate> | undefined): ResultDate {
	return constructFrom(date, Date.now());
}
