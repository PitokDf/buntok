import { addLeadingZeros } from "./_lib/add-leading-zeros";
import { toDate } from "./_lib/to-date";
import type { ContextOptions, DateArg, ISOFormatOptions } from "./_lib/types";

export interface FormatISOOptions
	extends ISOFormatOptions,
		ContextOptions<Date> {}

export function formatISO(
	date: DateArg<Date> & {},
	options?: FormatISOOptions,
): string {
	const date_ = toDate(date, options?.in);
	if (isNaN(+date_)) {
		throw new RangeError("Invalid time value");
	}

	const format = options?.format ?? "extended";
	const representation = options?.representation ?? "complete";

	let result = "";
	let tzOffset = "";
	const dateDelimiter = format === "extended" ? "-" : "";
	const timeDelimiter = format === "extended" ? ":" : "";

	if (representation !== "time") {
		const day = addLeadingZeros(date_.getDate(), 2);
		const month = addLeadingZeros(date_.getMonth() + 1, 2);
		const year = addLeadingZeros(date_.getFullYear(), 4);
		result = `${year}${dateDelimiter}${month}${dateDelimiter}${day}`;
	}

	if (representation !== "date") {
		const offset = date_.getTimezoneOffset();
		if (offset !== 0) {
			const absoluteOffset = Math.abs(offset);
			const hourOffset = addLeadingZeros(Math.trunc(absoluteOffset / 60), 2);
			const minuteOffset = addLeadingZeros(absoluteOffset % 60, 2);
			const sign = offset < 0 ? "+" : "-";
			tzOffset = `${sign}${hourOffset}:${minuteOffset}`;
		} else {
			tzOffset = "Z";
		}

		const hour = addLeadingZeros(date_.getHours(), 2);
		const minute = addLeadingZeros(date_.getMinutes(), 2);
		const second = addLeadingZeros(date_.getSeconds(), 2);
		const separator = result === "" ? "" : "T";
		const time = [hour, minute, second].join(timeDelimiter);
		result = `${result}${separator}${time}${tzOffset}`;
	}

	return result;
}
