import { addLeadingZeros } from "./_lib/add-leading-zeros";
import { isValid } from "./is";
import { toDate } from "./_lib/to-date";
import type { ContextOptions, DateArg } from "./_lib/types";

export interface FormatRFC3339Options extends ContextOptions<Date> {
	fractionDigits?: 0 | 1 | 2 | 3;
}

export function formatRFC3339(
	date: DateArg<Date> & {},
	options?: FormatRFC3339Options,
): string {
	const date_ = toDate(date, options?.in);
	if (!isValid(date_)) {
		throw new RangeError("Invalid time value");
	}

	const fractionDigits = options?.fractionDigits ?? 0;

	const day = addLeadingZeros(date_.getDate(), 2);
	const month = addLeadingZeros(date_.getMonth() + 1, 2);
	const year = date_.getFullYear();

	const hour = addLeadingZeros(date_.getHours(), 2);
	const minute = addLeadingZeros(date_.getMinutes(), 2);
	const second = addLeadingZeros(date_.getSeconds(), 2);

	let fractionalSecond = "";
	if (fractionDigits > 0) {
		const milliseconds = date_.getMilliseconds();
		const fractionalSeconds = Math.trunc(
			milliseconds * Math.pow(10, fractionDigits - 3),
		);
		fractionalSecond = "." + addLeadingZeros(fractionalSeconds, fractionDigits);
	}

	let offset = "";
	const tzOffset = date_.getTimezoneOffset();
	if (tzOffset !== 0) {
		const absoluteOffset = Math.abs(tzOffset);
		const hourOffset = addLeadingZeros(Math.trunc(absoluteOffset / 60), 2);
		const minuteOffset = addLeadingZeros(absoluteOffset % 60, 2);
		const sign = tzOffset < 0 ? "+" : "-";
		offset = `${sign}${hourOffset}:${minuteOffset}`;
	} else {
		offset = "Z";
	}

	return `${year}-${month}-${day}T${hour}:${minute}:${second}${fractionalSecond}${offset}`;
}
