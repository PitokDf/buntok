import {
	millisecondsInHour,
	millisecondsInMinute,
} from "./_lib/constants";
import { constructFrom } from "./_lib/to-date";
import { toDate } from "./_lib/to-date";
import type { ContextOptions } from "./_lib/types";

export interface ParseISOOptions<DateType extends Date = Date>
	extends ContextOptions<DateType> {
	additionalDigits?: 0 | 1 | 2;
}

interface DateStrings {
	date?: string;
	time?: string;
	timezone?: string;
}

const patterns = {
	dateTimeDelimiter: /[T ]/,
	timeZoneDelimiter: /[Z ]/i,
	timezone: /([Z+-].*)$/,
};

const dateRegex =
	/^-?(?:(\d{3})|(\d{2})(?:-?(\d{2}))?|W(\d{2})(?:-?(\d{1}))?|)$/;

const timeRegex =
	/^(\d{2}(?:[.,]\d*)?)(?::?(\d{2}(?:[.,]\d*)?))?(?::?(\d{2}(?:[.,]\d*)?))?$/;

const timezoneRegex = /^([+-])(\d{2})(?::?(\d{2}))?$/;

export function parseISO<
	DateType extends Date,
	ResultDate extends Date = DateType,
>(argument: string, options?: ParseISOOptions<ResultDate>): ResultDate {
	const invalidDate = (): ResultDate =>
		constructFrom(options?.in, NaN as unknown as Date) as ResultDate;
	const additionalDigits = options?.additionalDigits ?? 2;

	const dateStrings = splitDateString(argument);
	let date: Date | undefined;

	if (dateStrings.date) {
		const parseYearResult = parseYear(dateStrings.date, additionalDigits);
		date = parseDate(parseYearResult.restDateString, parseYearResult.year);
	}

	if (!date || isNaN(+date)) return invalidDate();

	const timestamp = +date;

	let time = 0;
	let offset: number | undefined;

	if (dateStrings.time) {
		time = parseTime(dateStrings.time);
		if (isNaN(time)) return invalidDate();
	}

	if (dateStrings.timezone) {
		offset = parseTimezone(dateStrings.timezone);
		if (isNaN(offset)) return invalidDate();
	} else {
		const tmpDate = new Date(timestamp + time);
		const result = toDate(0 as unknown as Date, options?.in);
		result.setFullYear(
			tmpDate.getUTCFullYear(),
			tmpDate.getUTCMonth(),
			tmpDate.getUTCDate(),
		);
		result.setHours(
			tmpDate.getUTCHours(),
			tmpDate.getUTCMinutes(),
			tmpDate.getUTCSeconds(),
			tmpDate.getUTCMilliseconds(),
		);
		return result as ResultDate;
	}

	return toDate(timestamp + time + offset, options?.in) as ResultDate;}

function splitDateString(dateString: string): DateStrings {
	const dateStrings: DateStrings = {};

	const array = dateString.split(patterns.dateTimeDelimiter);
	let timeString: string | undefined;

	if (array.length > 2) {
		return dateStrings;
	}

	if (/:/.test(array[0]!)) {
		timeString = array[0];
	} else {
		dateStrings.date = array[0]!;
		timeString = array[1];
		if (patterns.timeZoneDelimiter.test(dateStrings.date)) {
			dateStrings.date = dateString.split(patterns.timeZoneDelimiter)[0]!;
			timeString = dateString.substr(
				dateStrings.date.length,
				dateString.length,
			);
		}
	}

	if (timeString) {
		const token = patterns.timezone.exec(timeString);
		if (token) {
			dateStrings.time = timeString.replace(token[1]!, "");
			dateStrings.timezone = token[1];
		} else {
			dateStrings.time = timeString;
		}
	}

	return dateStrings;
}

function parseYear(
	dateString: string,
	additionalDigits: number,
): { year: number | null; restDateString: string } {
	const regex = new RegExp(
		"^(?:(\\d{4}|[+-]\\d{" +
			(4 + additionalDigits) +
			"})|(\\d{2}|[+-]\\d{" +
			(2 + additionalDigits) +
			"})$)",
	);
	const captures = dateString.match(regex);

	if (!captures) return { year: NaN, restDateString: "" };

	const year = captures[1] ? parseInt(captures[1]) : null;
	const century = captures[2] ? parseInt(captures[2]) : null;

	return {
		year: century === null ? year : century * 100,
		restDateString: dateString.slice(
			(captures[1] || captures[2]!).length,
		),
	};
}

function parseDate(dateString: string, year: number | null): Date {
	if (year === null) return new Date(NaN);

	const captures = dateString.match(dateRegex);

	if (!captures) return new Date(NaN);

	const isWeekDate = !!captures[4];

	const dayOfYear = parseDateUnit(captures[1]);
	const month = parseDateUnit(captures[2]) - 1;
	const day = parseDateUnit(captures[3]);
	const week = parseDateUnit(captures[4]);
	const dayOfWeek = parseDateUnit(captures[5]) - 1;

	if (isWeekDate) {
		if (!validateWeekDate(year, week, dayOfWeek)) {
			return new Date(NaN);
		}
		return dayOfISOWeekYear(year, week, dayOfWeek);
	} else {
		const date = new Date(0);
		if (
			!validateDate(year, month, day) ||
			!validateDayOfYearDate(year, dayOfYear)
		) {
			return new Date(NaN);
		}
		date.setUTCFullYear(year, month, Math.max(dayOfYear, day));
		return date;
	}
}

function parseDateUnit(value: string | undefined): number {
	return value ? parseInt(value) : 1;
}

function parseTime(timeString: string): number {
	const captures = timeString.match(timeRegex);

	if (!captures) return NaN;

	const hours = parseTimeUnit(captures[1]);
	const minutes = parseTimeUnit(captures[2]);
	const seconds = parseTimeUnit(captures[3]);

	if (!validateTime(hours, minutes, seconds)) {
		return NaN;
	}

	return (
		hours * millisecondsInHour + minutes * millisecondsInMinute + seconds * 1000
	);
}

function parseTimeUnit(value: string | undefined): number {
	return (value && parseFloat(value.replace(",", "."))) || 0;
}

function parseTimezone(timezoneString: string): number {
	if (timezoneString === "Z") return 0;

	const captures = timezoneString.match(timezoneRegex);

	if (!captures) return 0;

	const sign = captures[1] === "+" ? -1 : 1;
	const hours = parseInt(captures[2]!);
	const minutes = (captures[3] && parseInt(captures[3])) || 0;

	if (!validateTimezone(hours, minutes)) {
		return NaN;
	}

	return sign * (hours * millisecondsInHour + minutes * millisecondsInMinute);
}

function dayOfISOWeekYear(
	isoWeekYear: number,
	week: number,
	day: number,
): Date {
	const date = new Date(0);
	date.setUTCFullYear(isoWeekYear, 0, 4);
	const fourthOfJanuaryDay = date.getUTCDay() || 7;
	const diff = (week - 1) * 7 + day + 1 - fourthOfJanuaryDay;
	date.setUTCDate(date.getUTCDate() + diff);
	return date;
}

const daysInMonths = [31, null, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

function isLeapYearIndex(year: number): boolean {
	return year % 400 === 0 || (year % 4 === 0 && year % 100 !== 0);
}

function validateDate(year: number, month: number, date: number): boolean {
	return (
		month >= 0 &&
		month <= 11 &&
		date >= 1 &&
		date <= (daysInMonths[month] || (isLeapYearIndex(year) ? 29 : 28))
	);
}

function validateDayOfYearDate(year: number, dayOfYear: number): boolean {
	return dayOfYear >= 1 && dayOfYear <= (isLeapYearIndex(year) ? 366 : 365);
}

function validateWeekDate(_year: number, week: number, day: number): boolean {
	return week >= 1 && week <= 53 && day >= 0 && day <= 6;
}

function validateTime(hours: number, minutes: number, seconds: number): boolean {
	if (hours === 24) {
		return minutes === 0 && seconds === 0;
	}
	return (
		seconds >= 0 &&
		seconds < 60 &&
		minutes >= 0 &&
		minutes < 60 &&
		hours >= 0 &&
		hours < 25
	);
}

function validateTimezone(_hours: number, minutes: number): boolean {
	return minutes >= 0 && minutes <= 59;
}
