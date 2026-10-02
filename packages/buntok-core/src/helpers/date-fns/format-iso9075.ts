import { addLeadingZeros } from "./_lib/add-leading-zeros";
import { isValid } from "./is";
import { toDate } from "./_lib/to-date";
import type { ContextOptions, DateArg, ISOFormatOptions } from "./_lib/types";

export interface FormatISO9075Options
	extends ISOFormatOptions,
		ContextOptions<Date> {}

export function formatISO9075(
	date: DateArg<Date> & {},
	options?: FormatISO9075Options,
): string {
	const date_ = toDate(date, options?.in);
	if (!isValid(date_)) {
		throw new RangeError("Invalid time value");
	}

	const format = options?.format ?? "extended";
	const representation = options?.representation ?? "complete";

	let result = "";
	const dateDelimiter = format === "extended" ? "-" : "";
	const timeDelimiter = format === "extended" ? ":" : "";

	if (representation !== "time") {
		const day = addLeadingZeros(date_.getDate(), 2);
		const month = addLeadingZeros(date_.getMonth() + 1, 2);
		const year = addLeadingZeros(date_.getFullYear(), 4);
		result = `${year}${dateDelimiter}${month}${dateDelimiter}${day}`;
	}

	if (representation !== "date") {
		const hour = addLeadingZeros(date_.getHours(), 2);
		const minute = addLeadingZeros(date_.getMinutes(), 2);
		const second = addLeadingZeros(date_.getSeconds(), 2);
		const separator = result === "" ? "" : " ";
		result = `${result}${separator}${hour}${timeDelimiter}${minute}${timeDelimiter}${second}`;
	}

	return result;
}
