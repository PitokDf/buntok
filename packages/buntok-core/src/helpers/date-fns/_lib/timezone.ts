import { toDate } from "./to-date";
import type { DateArg } from "./types";

export function getTimezoneOffsetInMilliseconds(
	date: DateArg<Date> & {},
): number {
	const _date = toDate(date);
	const utcDate = new Date(
		Date.UTC(
			_date.getFullYear(),
			_date.getMonth(),
			_date.getDate(),
			_date.getHours(),
			_date.getMinutes(),
			_date.getSeconds(),
			_date.getMilliseconds(),
		),
	);
	utcDate.setUTCFullYear(_date.getFullYear());
	return +date - +utcDate;
}
