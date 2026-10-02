import { addLeadingZeros } from "./_lib/add-leading-zeros";
import { isValid } from "./is";
import { toDate } from "./_lib/to-date";
import type { DateArg } from "./_lib/types";

const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const months = [
	"Jan",
	"Feb",
	"Mar",
	"Apr",
	"May",
	"Jun",
	"Jul",
	"Aug",
	"Sep",
	"Oct",
	"Nov",
	"Dec",
];

export function formatRFC7231(date: DateArg<Date> & {}): string {
	const _date = toDate(date);
	if (!isValid(_date)) {
		throw new RangeError("Invalid time value");
	}

	const dayName = days[_date.getUTCDay()]!;
	const dayOfMonth = addLeadingZeros(_date.getUTCDate(), 2);
	const monthName = months[_date.getUTCMonth()]!;
	const year = _date.getUTCFullYear();

	const hour = addLeadingZeros(_date.getUTCHours(), 2);
	const minute = addLeadingZeros(_date.getUTCMinutes(), 2);
	const second = addLeadingZeros(_date.getUTCSeconds(), 2);

	return `${dayName}, ${dayOfMonth} ${monthName} ${year} ${hour}:${minute}:${second} GMT`;
}
