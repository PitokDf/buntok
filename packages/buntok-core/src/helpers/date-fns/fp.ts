import { convertToFP, type FPFn } from "./_lib/fp";
import { constructFrom as constructFromFn, toDate as toDateFn } from "./_lib/to-date";
import { add as addFn, addBusinessDays as addBusinessDaysFn, addDays as addDaysFn, addHours as addHoursFn, addISOWeekYears as addISOWeekYearsFn, addMilliseconds as addMillisecondsFn, addMinutes as addMinutesFn, addMonths as addMonthsFn, addQuarters as addQuartersFn, addSeconds as addSecondsFn, addWeeks as addWeeksFn, addYears as addYearsFn } from "./add";
import { daysToWeeks as daysToWeeksFn, fromUnixTime as fromUnixTimeFn, hoursToMilliseconds as hoursToMillisecondsFn, hoursToMinutes as hoursToMinutesFn, hoursToSeconds as hoursToSecondsFn, millisecondsToHours as millisecondsToHoursFn, millisecondsToMinutes as millisecondsToMinutesFn, millisecondsToSeconds as millisecondsToSecondsFn, minutesToHours as minutesToHoursFn, minutesToMilliseconds as minutesToMillisecondsFn, minutesToSeconds as minutesToSecondsFn, monthsToQuarters as monthsToQuartersFn, monthsToYears as monthsToYearsFn, quartersToMonths as quartersToMonthsFn, quartersToYears as quartersToYearsFn, secondsToHours as secondsToHoursFn, secondsToMilliseconds as secondsToMillisecondsFn, secondsToMinutes as secondsToMinutesFn, transpose as transposeFn, weeksToDays as weeksToDaysFn, yearsToDays as yearsToDaysFn, yearsToMonths as yearsToMonthsFn, yearsToQuarters as yearsToQuartersFn } from "./convert";
import { differenceInBusinessDays as differenceInBusinessDaysFn, differenceInCalendarDays as differenceInCalendarDaysFn, differenceInCalendarISOWeekYears as differenceInCalendarISOWeekYearsFn, differenceInCalendarISOWeeks as differenceInCalendarISOWeeksFn, differenceInCalendarMonths as differenceInCalendarMonthsFn, differenceInCalendarQuarters as differenceInCalendarQuartersFn, differenceInCalendarWeeks as differenceInCalendarWeeksFn, differenceInCalendarYears as differenceInCalendarYearsFn, differenceInDays as differenceInDaysFn, differenceInHours as differenceInHoursFn, differenceInISOWeekYears as differenceInISOWeekYearsFn, differenceInMilliseconds as differenceInMillisecondsFn, differenceInMinutes as differenceInMinutesFn, differenceInMonths as differenceInMonthsFn, differenceInQuarters as differenceInQuartersFn, differenceInSeconds as differenceInSecondsFn, differenceInWeeks as differenceInWeeksFn, differenceInYears as differenceInYearsFn } from "./difference";
import { format as formatFn } from "./format";
import { formatDistance as formatDistanceFn } from "./format-distance";
import { formatDistanceStrict as formatDistanceStrictFn } from "./format-distance-strict";
import { formatDuration as formatDurationFn } from "./format-duration";
import { formatISO as formatISOFn } from "./format-iso";
import { formatISODuration as formatISODurationFn } from "./format-iso-duration";
import { formatISO9075 as formatISO9075Fn } from "./format-iso9075";
import { formatRelative as formatRelativeFn } from "./format-relative";
import { formatRFC3339 as formatRFC3339Fn } from "./format-rfc3339";
import { formatRFC7231 as formatRFC7231Fn } from "./format-rfc7231";
import { getDate as getDateFn, getDay as getDayFn, getDayOfYear as getDayOfYearFn, getDaysInMonth as getDaysInMonthFn, getDaysInYear as getDaysInYearFn, getDecade as getDecadeFn, getHours as getHoursFn, getISODay as getISODayFn, getISOWeek as getISOWeekFn, getISOWeekYear as getISOWeekYearFn, getISOWeeksInYear as getISOWeeksInYearFn, getMilliseconds as getMillisecondsFn, getMinutes as getMinutesFn, getMonth as getMonthFn, getQuarter as getQuarterFn, getSeconds as getSecondsFn, getTime as getTimeFn, getUnixTime as getUnixTimeFn, getWeek as getWeekFn, getWeekOfMonth as getWeekOfMonthFn, getWeekYear as getWeekYearFn, getWeeksInMonth as getWeeksInMonthFn, getYear as getYearFn } from "./get";
import { areIntervalsOverlapping as areIntervalsOverlappingFn, eachDayOfInterval as eachDayOfIntervalFn, eachHourOfInterval as eachHourOfIntervalFn, eachMinuteOfInterval as eachMinuteOfIntervalFn, eachMonthOfInterval as eachMonthOfIntervalFn, eachQuarterOfInterval as eachQuarterOfIntervalFn, eachWeekOfInterval as eachWeekOfIntervalFn, eachWeekendOfInterval as eachWeekendOfIntervalFn, eachWeekendOfMonth as eachWeekendOfMonthFn, eachWeekendOfYear as eachWeekendOfYearFn, eachYearOfInterval as eachYearOfIntervalFn, getOverlappingDaysInIntervals as getOverlappingDaysInIntervalsFn, interval as intervalFn, intervalToDuration as intervalToDurationFn } from "./interval";
import { intlFormat as intlFormatFn } from "./intl-format";
import { intlFormatDistance as intlFormatDistanceFn } from "./intl-format-distance";
import { isAfter as isAfterFn, isBefore as isBeforeFn, isDate as isDateFn, isFirstDayOfMonth as isFirstDayOfMonthFn, isFriday as isFridayFn, isLastDayOfMonth as isLastDayOfMonthFn, isLeapYear as isLeapYearFn, isMonday as isMondayFn, isSameDay as isSameDayFn, isSameHour as isSameHourFn, isSameISOWeek as isSameISOWeekFn, isSameISOWeekYear as isSameISOWeekYearFn, isSameMinute as isSameMinuteFn, isSameMonth as isSameMonthFn, isSameQuarter as isSameQuarterFn, isSameSecond as isSameSecondFn, isSameWeek as isSameWeekFn, isSameYear as isSameYearFn, isSaturday as isSaturdayFn, isSunday as isSundayFn, isThursday as isThursdayFn, isTuesday as isTuesdayFn, isValid as isValidFn, isWednesday as isWednesdayFn, isWeekend as isWeekendFn, isWithinInterval as isWithinIntervalFn } from "./is";
import { isMatch as isMatchFn } from "./is-match";
import { lightFormat as lightFormatFn } from "./light-format";
import { clamp as clampFn, closestIndexTo as closestIndexToFn, closestTo as closestToFn, compareAsc as compareAscFn, compareDesc as compareDescFn, isEqual as isEqualFn, max as maxFn, milliseconds as millisecondsFn, min as minFn } from "./math";
import { isExists as isExistsFn } from "./misc";
import { parse as parseFn } from "./parse";
import { parseISO as parseISOFn } from "./parse-iso";
import { parseJSON as parseJSONFn } from "./parse-json";
import { roundToNearestHours as roundToNearestHoursFn, roundToNearestMinutes as roundToNearestMinutesFn } from "./round";
import { set as setFn, setDate as setDateFn, setDay as setDayFn, setDayOfYear as setDayOfYearFn, setHours as setHoursFn, setISODay as setISODayFn, setISOWeek as setISOWeekFn, setISOWeekYear as setISOWeekYearFn, setMilliseconds as setMillisecondsFn, setMinutes as setMinutesFn, setMonth as setMonthFn, setQuarter as setQuarterFn, setSeconds as setSecondsFn, setWeek as setWeekFn, setWeekYear as setWeekYearFn, setYear as setYearFn } from "./set";
import { endOfDay as endOfDayFn, endOfDecade as endOfDecadeFn, endOfHour as endOfHourFn, endOfISOWeek as endOfISOWeekFn, endOfISOWeekYear as endOfISOWeekYearFn, endOfMinute as endOfMinuteFn, endOfMonth as endOfMonthFn, endOfQuarter as endOfQuarterFn, endOfSecond as endOfSecondFn, endOfWeek as endOfWeekFn, endOfYear as endOfYearFn, lastDayOfDecade as lastDayOfDecadeFn, lastDayOfISOWeek as lastDayOfISOWeekFn, lastDayOfISOWeekYear as lastDayOfISOWeekYearFn, lastDayOfMonth as lastDayOfMonthFn, lastDayOfQuarter as lastDayOfQuarterFn, lastDayOfWeek as lastDayOfWeekFn, lastDayOfYear as lastDayOfYearFn, startOfDay as startOfDayFn, startOfDecade as startOfDecadeFn, startOfHour as startOfHourFn, startOfISOWeek as startOfISOWeekFn, startOfISOWeekYear as startOfISOWeekYearFn, startOfMinute as startOfMinuteFn, startOfMonth as startOfMonthFn, startOfQuarter as startOfQuarterFn, startOfSecond as startOfSecondFn, startOfWeek as startOfWeekFn, startOfWeekYear as startOfWeekYearFn, startOfYear as startOfYearFn } from "./start-end";
import { sub as subFn, subBusinessDays as subBusinessDaysFn, subDays as subDaysFn, subHours as subHoursFn, subISOWeekYears as subISOWeekYearsFn, subMilliseconds as subMillisecondsFn, subMinutes as subMinutesFn, subMonths as subMonthsFn, subQuarters as subQuartersFn, subSeconds as subSecondsFn, subWeeks as subWeeksFn, subYears as subYearsFn } from "./sub";
import { nextDay as nextDayFn, nextFriday as nextFridayFn, nextMonday as nextMondayFn, nextSaturday as nextSaturdayFn, nextSunday as nextSundayFn, nextThursday as nextThursdayFn, nextTuesday as nextTuesdayFn, nextWednesday as nextWednesdayFn, previousDay as previousDayFn, previousFriday as previousFridayFn, previousMonday as previousMondayFn, previousSaturday as previousSaturdayFn, previousSunday as previousSundayFn, previousThursday as previousThursdayFn, previousTuesday as previousTuesdayFn, previousWednesday as previousWednesdayFn } from "./weeks";

export const add: FPFn<typeof addFn, 2> = convertToFP(
	addFn,
	2,
);
export const addBusinessDays: FPFn<typeof addBusinessDaysFn, 2> = convertToFP(
	addBusinessDaysFn,
	2,
);
export const addBusinessDaysWithOptions: FPFn<typeof addBusinessDaysFn, 3> = convertToFP(
	addBusinessDaysFn,
	3,
);
export const addDays: FPFn<typeof addDaysFn, 2> = convertToFP(
	addDaysFn,
	2,
);
export const addDaysWithOptions: FPFn<typeof addDaysFn, 3> = convertToFP(
	addDaysFn,
	3,
);
export const addHours: FPFn<typeof addHoursFn, 2> = convertToFP(
	addHoursFn,
	2,
);
export const addHoursWithOptions: FPFn<typeof addHoursFn, 3> = convertToFP(
	addHoursFn,
	3,
);
export const addISOWeekYears: FPFn<typeof addISOWeekYearsFn, 2> = convertToFP(
	addISOWeekYearsFn,
	2,
);
export const addISOWeekYearsWithOptions: FPFn<typeof addISOWeekYearsFn, 3> = convertToFP(
	addISOWeekYearsFn,
	3,
);
export const addMilliseconds: FPFn<typeof addMillisecondsFn, 2> = convertToFP(
	addMillisecondsFn,
	2,
);
export const addMillisecondsWithOptions: FPFn<typeof addMillisecondsFn, 3> = convertToFP(
	addMillisecondsFn,
	3,
);
export const addMinutes: FPFn<typeof addMinutesFn, 2> = convertToFP(
	addMinutesFn,
	2,
);
export const addMinutesWithOptions: FPFn<typeof addMinutesFn, 3> = convertToFP(
	addMinutesFn,
	3,
);
export const addMonths: FPFn<typeof addMonthsFn, 2> = convertToFP(
	addMonthsFn,
	2,
);
export const addMonthsWithOptions: FPFn<typeof addMonthsFn, 3> = convertToFP(
	addMonthsFn,
	3,
);
export const addQuarters: FPFn<typeof addQuartersFn, 2> = convertToFP(
	addQuartersFn,
	2,
);
export const addQuartersWithOptions: FPFn<typeof addQuartersFn, 3> = convertToFP(
	addQuartersFn,
	3,
);
export const addSeconds: FPFn<typeof addSecondsFn, 2> = convertToFP(
	addSecondsFn,
	2,
);
export const addSecondsWithOptions: FPFn<typeof addSecondsFn, 3> = convertToFP(
	addSecondsFn,
	3,
);
export const addWeeks: FPFn<typeof addWeeksFn, 2> = convertToFP(
	addWeeksFn,
	2,
);
export const addWeeksWithOptions: FPFn<typeof addWeeksFn, 3> = convertToFP(
	addWeeksFn,
	3,
);
export const addWithOptions: FPFn<typeof addFn, 3> = convertToFP(
	addFn,
	3,
);
export const addYears: FPFn<typeof addYearsFn, 2> = convertToFP(
	addYearsFn,
	2,
);
export const addYearsWithOptions: FPFn<typeof addYearsFn, 3> = convertToFP(
	addYearsFn,
	3,
);
export const areIntervalsOverlapping: FPFn<typeof areIntervalsOverlappingFn, 2> = convertToFP(
	areIntervalsOverlappingFn,
	2,
);
export const areIntervalsOverlappingWithOptions: FPFn<typeof areIntervalsOverlappingFn, 3> = convertToFP(
	areIntervalsOverlappingFn,
	3,
);
export const clamp: FPFn<typeof clampFn, 2> = convertToFP(
	clampFn,
	2,
);
export const clampWithOptions: FPFn<typeof clampFn, 3> = convertToFP(
	clampFn,
	3,
);
export const closestIndexTo: FPFn<typeof closestIndexToFn, 2> = convertToFP(
	closestIndexToFn,
	2,
);
export const closestTo: FPFn<typeof closestToFn, 2> = convertToFP(
	closestToFn,
	2,
);
export const closestToWithOptions: FPFn<typeof closestToFn, 3> = convertToFP(
	closestToFn,
	3,
);
export const compareAsc: FPFn<typeof compareAscFn, 2> = convertToFP(
	compareAscFn,
	2,
);
export const compareDesc: FPFn<typeof compareDescFn, 2> = convertToFP(
	compareDescFn,
	2,
);
export const constructFrom: FPFn<typeof constructFromFn, 2> = convertToFP(
	constructFromFn,
	2,
);
export const daysToWeeks: FPFn<typeof daysToWeeksFn, 1> = convertToFP(
	daysToWeeksFn,
	1,
);
export const differenceInBusinessDays: FPFn<typeof differenceInBusinessDaysFn, 2> = convertToFP(
	differenceInBusinessDaysFn,
	2,
);
export const differenceInBusinessDaysWithOptions: FPFn<typeof differenceInBusinessDaysFn, 3> = convertToFP(
	differenceInBusinessDaysFn,
	3,
);
export const differenceInCalendarDays: FPFn<typeof differenceInCalendarDaysFn, 2> = convertToFP(
	differenceInCalendarDaysFn,
	2,
);
export const differenceInCalendarDaysWithOptions: FPFn<typeof differenceInCalendarDaysFn, 3> = convertToFP(
	differenceInCalendarDaysFn,
	3,
);
export const differenceInCalendarISOWeekYears: FPFn<typeof differenceInCalendarISOWeekYearsFn, 2> = convertToFP(
	differenceInCalendarISOWeekYearsFn,
	2,
);
export const differenceInCalendarISOWeekYearsWithOptions: FPFn<typeof differenceInCalendarISOWeekYearsFn, 3> = convertToFP(
	differenceInCalendarISOWeekYearsFn,
	3,
);
export const differenceInCalendarISOWeeks: FPFn<typeof differenceInCalendarISOWeeksFn, 2> = convertToFP(
	differenceInCalendarISOWeeksFn,
	2,
);
export const differenceInCalendarISOWeeksWithOptions: FPFn<typeof differenceInCalendarISOWeeksFn, 3> = convertToFP(
	differenceInCalendarISOWeeksFn,
	3,
);
export const differenceInCalendarMonths: FPFn<typeof differenceInCalendarMonthsFn, 2> = convertToFP(
	differenceInCalendarMonthsFn,
	2,
);
export const differenceInCalendarMonthsWithOptions: FPFn<typeof differenceInCalendarMonthsFn, 3> = convertToFP(
	differenceInCalendarMonthsFn,
	3,
);
export const differenceInCalendarQuarters: FPFn<typeof differenceInCalendarQuartersFn, 2> = convertToFP(
	differenceInCalendarQuartersFn,
	2,
);
export const differenceInCalendarQuartersWithOptions: FPFn<typeof differenceInCalendarQuartersFn, 3> = convertToFP(
	differenceInCalendarQuartersFn,
	3,
);
export const differenceInCalendarWeeks: FPFn<typeof differenceInCalendarWeeksFn, 2> = convertToFP(
	differenceInCalendarWeeksFn,
	2,
);
export const differenceInCalendarWeeksWithOptions: FPFn<typeof differenceInCalendarWeeksFn, 3> = convertToFP(
	differenceInCalendarWeeksFn,
	3,
);
export const differenceInCalendarYears: FPFn<typeof differenceInCalendarYearsFn, 2> = convertToFP(
	differenceInCalendarYearsFn,
	2,
);
export const differenceInCalendarYearsWithOptions: FPFn<typeof differenceInCalendarYearsFn, 3> = convertToFP(
	differenceInCalendarYearsFn,
	3,
);
export const differenceInDays: FPFn<typeof differenceInDaysFn, 2> = convertToFP(
	differenceInDaysFn,
	2,
);
export const differenceInDaysWithOptions: FPFn<typeof differenceInDaysFn, 3> = convertToFP(
	differenceInDaysFn,
	3,
);
export const differenceInHours: FPFn<typeof differenceInHoursFn, 2> = convertToFP(
	differenceInHoursFn,
	2,
);
export const differenceInHoursWithOptions: FPFn<typeof differenceInHoursFn, 3> = convertToFP(
	differenceInHoursFn,
	3,
);
export const differenceInISOWeekYears: FPFn<typeof differenceInISOWeekYearsFn, 2> = convertToFP(
	differenceInISOWeekYearsFn,
	2,
);
export const differenceInISOWeekYearsWithOptions: FPFn<typeof differenceInISOWeekYearsFn, 3> = convertToFP(
	differenceInISOWeekYearsFn,
	3,
);
export const differenceInMilliseconds: FPFn<typeof differenceInMillisecondsFn, 2> = convertToFP(
	differenceInMillisecondsFn,
	2,
);
export const differenceInMinutes: FPFn<typeof differenceInMinutesFn, 2> = convertToFP(
	differenceInMinutesFn,
	2,
);
export const differenceInMinutesWithOptions: FPFn<typeof differenceInMinutesFn, 3> = convertToFP(
	differenceInMinutesFn,
	3,
);
export const differenceInMonths: FPFn<typeof differenceInMonthsFn, 2> = convertToFP(
	differenceInMonthsFn,
	2,
);
export const differenceInMonthsWithOptions: FPFn<typeof differenceInMonthsFn, 3> = convertToFP(
	differenceInMonthsFn,
	3,
);
export const differenceInQuarters: FPFn<typeof differenceInQuartersFn, 2> = convertToFP(
	differenceInQuartersFn,
	2,
);
export const differenceInQuartersWithOptions: FPFn<typeof differenceInQuartersFn, 3> = convertToFP(
	differenceInQuartersFn,
	3,
);
export const differenceInSeconds: FPFn<typeof differenceInSecondsFn, 2> = convertToFP(
	differenceInSecondsFn,
	2,
);
export const differenceInSecondsWithOptions: FPFn<typeof differenceInSecondsFn, 3> = convertToFP(
	differenceInSecondsFn,
	3,
);
export const differenceInWeeks: FPFn<typeof differenceInWeeksFn, 2> = convertToFP(
	differenceInWeeksFn,
	2,
);
export const differenceInWeeksWithOptions: FPFn<typeof differenceInWeeksFn, 3> = convertToFP(
	differenceInWeeksFn,
	3,
);
export const differenceInYears: FPFn<typeof differenceInYearsFn, 2> = convertToFP(
	differenceInYearsFn,
	2,
);
export const differenceInYearsWithOptions: FPFn<typeof differenceInYearsFn, 3> = convertToFP(
	differenceInYearsFn,
	3,
);
export const eachDayOfInterval: FPFn<typeof eachDayOfIntervalFn, 1> = convertToFP(
	eachDayOfIntervalFn,
	1,
);
export const eachDayOfIntervalWithOptions: FPFn<typeof eachDayOfIntervalFn, 2> = convertToFP(
	eachDayOfIntervalFn,
	2,
);
export const eachHourOfInterval: FPFn<typeof eachHourOfIntervalFn, 1> = convertToFP(
	eachHourOfIntervalFn,
	1,
);
export const eachHourOfIntervalWithOptions: FPFn<typeof eachHourOfIntervalFn, 2> = convertToFP(
	eachHourOfIntervalFn,
	2,
);
export const eachMinuteOfInterval: FPFn<typeof eachMinuteOfIntervalFn, 1> = convertToFP(
	eachMinuteOfIntervalFn,
	1,
);
export const eachMinuteOfIntervalWithOptions: FPFn<typeof eachMinuteOfIntervalFn, 2> = convertToFP(
	eachMinuteOfIntervalFn,
	2,
);
export const eachMonthOfInterval: FPFn<typeof eachMonthOfIntervalFn, 1> = convertToFP(
	eachMonthOfIntervalFn,
	1,
);
export const eachMonthOfIntervalWithOptions: FPFn<typeof eachMonthOfIntervalFn, 2> = convertToFP(
	eachMonthOfIntervalFn,
	2,
);
export const eachQuarterOfInterval: FPFn<typeof eachQuarterOfIntervalFn, 1> = convertToFP(
	eachQuarterOfIntervalFn,
	1,
);
export const eachQuarterOfIntervalWithOptions: FPFn<typeof eachQuarterOfIntervalFn, 2> = convertToFP(
	eachQuarterOfIntervalFn,
	2,
);
export const eachWeekOfInterval: FPFn<typeof eachWeekOfIntervalFn, 1> = convertToFP(
	eachWeekOfIntervalFn,
	1,
);
export const eachWeekOfIntervalWithOptions: FPFn<typeof eachWeekOfIntervalFn, 2> = convertToFP(
	eachWeekOfIntervalFn,
	2,
);
export const eachWeekendOfInterval: FPFn<typeof eachWeekendOfIntervalFn, 1> = convertToFP(
	eachWeekendOfIntervalFn,
	1,
);
export const eachWeekendOfIntervalWithOptions: FPFn<typeof eachWeekendOfIntervalFn, 2> = convertToFP(
	eachWeekendOfIntervalFn,
	2,
);
export const eachWeekendOfMonth: FPFn<typeof eachWeekendOfMonthFn, 1> = convertToFP(
	eachWeekendOfMonthFn,
	1,
);
export const eachWeekendOfMonthWithOptions: FPFn<typeof eachWeekendOfMonthFn, 2> = convertToFP(
	eachWeekendOfMonthFn,
	2,
);
export const eachWeekendOfYear: FPFn<typeof eachWeekendOfYearFn, 1> = convertToFP(
	eachWeekendOfYearFn,
	1,
);
export const eachWeekendOfYearWithOptions: FPFn<typeof eachWeekendOfYearFn, 2> = convertToFP(
	eachWeekendOfYearFn,
	2,
);
export const eachYearOfInterval: FPFn<typeof eachYearOfIntervalFn, 1> = convertToFP(
	eachYearOfIntervalFn,
	1,
);
export const eachYearOfIntervalWithOptions: FPFn<typeof eachYearOfIntervalFn, 2> = convertToFP(
	eachYearOfIntervalFn,
	2,
);
export const endOfDay: FPFn<typeof endOfDayFn, 1> = convertToFP(
	endOfDayFn,
	1,
);
export const endOfDayWithOptions: FPFn<typeof endOfDayFn, 2> = convertToFP(
	endOfDayFn,
	2,
);
export const endOfDecade: FPFn<typeof endOfDecadeFn, 1> = convertToFP(
	endOfDecadeFn,
	1,
);
export const endOfDecadeWithOptions: FPFn<typeof endOfDecadeFn, 2> = convertToFP(
	endOfDecadeFn,
	2,
);
export const endOfHour: FPFn<typeof endOfHourFn, 1> = convertToFP(
	endOfHourFn,
	1,
);
export const endOfHourWithOptions: FPFn<typeof endOfHourFn, 2> = convertToFP(
	endOfHourFn,
	2,
);
export const endOfISOWeek: FPFn<typeof endOfISOWeekFn, 1> = convertToFP(
	endOfISOWeekFn,
	1,
);
export const endOfISOWeekWithOptions: FPFn<typeof endOfISOWeekFn, 2> = convertToFP(
	endOfISOWeekFn,
	2,
);
export const endOfISOWeekYear: FPFn<typeof endOfISOWeekYearFn, 1> = convertToFP(
	endOfISOWeekYearFn,
	1,
);
export const endOfISOWeekYearWithOptions: FPFn<typeof endOfISOWeekYearFn, 2> = convertToFP(
	endOfISOWeekYearFn,
	2,
);
export const endOfMinute: FPFn<typeof endOfMinuteFn, 1> = convertToFP(
	endOfMinuteFn,
	1,
);
export const endOfMinuteWithOptions: FPFn<typeof endOfMinuteFn, 2> = convertToFP(
	endOfMinuteFn,
	2,
);
export const endOfMonth: FPFn<typeof endOfMonthFn, 1> = convertToFP(
	endOfMonthFn,
	1,
);
export const endOfMonthWithOptions: FPFn<typeof endOfMonthFn, 2> = convertToFP(
	endOfMonthFn,
	2,
);
export const endOfQuarter: FPFn<typeof endOfQuarterFn, 1> = convertToFP(
	endOfQuarterFn,
	1,
);
export const endOfQuarterWithOptions: FPFn<typeof endOfQuarterFn, 2> = convertToFP(
	endOfQuarterFn,
	2,
);
export const endOfSecond: FPFn<typeof endOfSecondFn, 1> = convertToFP(
	endOfSecondFn,
	1,
);
export const endOfSecondWithOptions: FPFn<typeof endOfSecondFn, 2> = convertToFP(
	endOfSecondFn,
	2,
);
export const endOfWeek: FPFn<typeof endOfWeekFn, 1> = convertToFP(
	endOfWeekFn,
	1,
);
export const endOfWeekWithOptions: FPFn<typeof endOfWeekFn, 2> = convertToFP(
	endOfWeekFn,
	2,
);
export const endOfYear: FPFn<typeof endOfYearFn, 1> = convertToFP(
	endOfYearFn,
	1,
);
export const endOfYearWithOptions: FPFn<typeof endOfYearFn, 2> = convertToFP(
	endOfYearFn,
	2,
);
export const format: FPFn<typeof formatFn, 2> = convertToFP(
	formatFn,
	2,
);
export const formatDistance: FPFn<typeof formatDistanceFn, 2> = convertToFP(
	formatDistanceFn,
	2,
);
export const formatDistanceStrict: FPFn<typeof formatDistanceStrictFn, 2> = convertToFP(
	formatDistanceStrictFn,
	2,
);
export const formatDistanceStrictWithOptions: FPFn<typeof formatDistanceStrictFn, 3> = convertToFP(
	formatDistanceStrictFn,
	3,
);
export const formatDistanceWithOptions: FPFn<typeof formatDistanceFn, 3> = convertToFP(
	formatDistanceFn,
	3,
);
export const formatDuration: FPFn<typeof formatDurationFn, 1> = convertToFP(
	formatDurationFn,
	1,
);
export const formatDurationWithOptions: FPFn<typeof formatDurationFn, 2> = convertToFP(
	formatDurationFn,
	2,
);
export const formatISO: FPFn<typeof formatISOFn, 1> = convertToFP(
	formatISOFn,
	1,
);
export const formatISO9075: FPFn<typeof formatISO9075Fn, 1> = convertToFP(
	formatISO9075Fn,
	1,
);
export const formatISO9075WithOptions: FPFn<typeof formatISO9075Fn, 2> = convertToFP(
	formatISO9075Fn,
	2,
);
export const formatISODuration: FPFn<typeof formatISODurationFn, 1> = convertToFP(
	formatISODurationFn,
	1,
);
export const formatISOWithOptions: FPFn<typeof formatISOFn, 2> = convertToFP(
	formatISOFn,
	2,
);
export const formatRFC3339: FPFn<typeof formatRFC3339Fn, 1> = convertToFP(
	formatRFC3339Fn,
	1,
);
export const formatRFC3339WithOptions: FPFn<typeof formatRFC3339Fn, 2> = convertToFP(
	formatRFC3339Fn,
	2,
);
export const formatRFC7231: FPFn<typeof formatRFC7231Fn, 1> = convertToFP(
	formatRFC7231Fn,
	1,
);
export const formatRelative: FPFn<typeof formatRelativeFn, 2> = convertToFP(
	formatRelativeFn,
	2,
);
export const formatRelativeWithOptions: FPFn<typeof formatRelativeFn, 3> = convertToFP(
	formatRelativeFn,
	3,
);
export const formatWithOptions: FPFn<typeof formatFn, 3> = convertToFP(
	formatFn,
	3,
);
export const fromUnixTime: FPFn<typeof fromUnixTimeFn, 1> = convertToFP(
	fromUnixTimeFn,
	1,
);
export const fromUnixTimeWithOptions: FPFn<typeof fromUnixTimeFn, 2> = convertToFP(
	fromUnixTimeFn,
	2,
);
export const getDate: FPFn<typeof getDateFn, 1> = convertToFP(
	getDateFn,
	1,
);
export const getDateWithOptions: FPFn<typeof getDateFn, 2> = convertToFP(
	getDateFn,
	2,
);
export const getDay: FPFn<typeof getDayFn, 1> = convertToFP(
	getDayFn,
	1,
);
export const getDayOfYear: FPFn<typeof getDayOfYearFn, 1> = convertToFP(
	getDayOfYearFn,
	1,
);
export const getDayOfYearWithOptions: FPFn<typeof getDayOfYearFn, 2> = convertToFP(
	getDayOfYearFn,
	2,
);
export const getDayWithOptions: FPFn<typeof getDayFn, 2> = convertToFP(
	getDayFn,
	2,
);
export const getDaysInMonth: FPFn<typeof getDaysInMonthFn, 1> = convertToFP(
	getDaysInMonthFn,
	1,
);
export const getDaysInMonthWithOptions: FPFn<typeof getDaysInMonthFn, 2> = convertToFP(
	getDaysInMonthFn,
	2,
);
export const getDaysInYear: FPFn<typeof getDaysInYearFn, 1> = convertToFP(
	getDaysInYearFn,
	1,
);
export const getDaysInYearWithOptions: FPFn<typeof getDaysInYearFn, 2> = convertToFP(
	getDaysInYearFn,
	2,
);
export const getDecade: FPFn<typeof getDecadeFn, 1> = convertToFP(
	getDecadeFn,
	1,
);
export const getDecadeWithOptions: FPFn<typeof getDecadeFn, 2> = convertToFP(
	getDecadeFn,
	2,
);
export const getHours: FPFn<typeof getHoursFn, 1> = convertToFP(
	getHoursFn,
	1,
);
export const getHoursWithOptions: FPFn<typeof getHoursFn, 2> = convertToFP(
	getHoursFn,
	2,
);
export const getISODay: FPFn<typeof getISODayFn, 1> = convertToFP(
	getISODayFn,
	1,
);
export const getISODayWithOptions: FPFn<typeof getISODayFn, 2> = convertToFP(
	getISODayFn,
	2,
);
export const getISOWeek: FPFn<typeof getISOWeekFn, 1> = convertToFP(
	getISOWeekFn,
	1,
);
export const getISOWeekWithOptions: FPFn<typeof getISOWeekFn, 2> = convertToFP(
	getISOWeekFn,
	2,
);
export const getISOWeekYear: FPFn<typeof getISOWeekYearFn, 1> = convertToFP(
	getISOWeekYearFn,
	1,
);
export const getISOWeekYearWithOptions: FPFn<typeof getISOWeekYearFn, 2> = convertToFP(
	getISOWeekYearFn,
	2,
);
export const getISOWeeksInYear: FPFn<typeof getISOWeeksInYearFn, 1> = convertToFP(
	getISOWeeksInYearFn,
	1,
);
export const getISOWeeksInYearWithOptions: FPFn<typeof getISOWeeksInYearFn, 2> = convertToFP(
	getISOWeeksInYearFn,
	2,
);
export const getMilliseconds: FPFn<typeof getMillisecondsFn, 1> = convertToFP(
	getMillisecondsFn,
	1,
);
export const getMinutes: FPFn<typeof getMinutesFn, 1> = convertToFP(
	getMinutesFn,
	1,
);
export const getMinutesWithOptions: FPFn<typeof getMinutesFn, 2> = convertToFP(
	getMinutesFn,
	2,
);
export const getMonth: FPFn<typeof getMonthFn, 1> = convertToFP(
	getMonthFn,
	1,
);
export const getMonthWithOptions: FPFn<typeof getMonthFn, 2> = convertToFP(
	getMonthFn,
	2,
);
export const getOverlappingDaysInIntervals: FPFn<typeof getOverlappingDaysInIntervalsFn, 2> = convertToFP(
	getOverlappingDaysInIntervalsFn,
	2,
);
export const getQuarter: FPFn<typeof getQuarterFn, 1> = convertToFP(
	getQuarterFn,
	1,
);
export const getQuarterWithOptions: FPFn<typeof getQuarterFn, 2> = convertToFP(
	getQuarterFn,
	2,
);
export const getSeconds: FPFn<typeof getSecondsFn, 1> = convertToFP(
	getSecondsFn,
	1,
);
export const getTime: FPFn<typeof getTimeFn, 1> = convertToFP(
	getTimeFn,
	1,
);
export const getUnixTime: FPFn<typeof getUnixTimeFn, 1> = convertToFP(
	getUnixTimeFn,
	1,
);
export const getWeek: FPFn<typeof getWeekFn, 1> = convertToFP(
	getWeekFn,
	1,
);
export const getWeekOfMonth: FPFn<typeof getWeekOfMonthFn, 1> = convertToFP(
	getWeekOfMonthFn,
	1,
);
export const getWeekOfMonthWithOptions: FPFn<typeof getWeekOfMonthFn, 2> = convertToFP(
	getWeekOfMonthFn,
	2,
);
export const getWeekWithOptions: FPFn<typeof getWeekFn, 2> = convertToFP(
	getWeekFn,
	2,
);
export const getWeekYear: FPFn<typeof getWeekYearFn, 1> = convertToFP(
	getWeekYearFn,
	1,
);
export const getWeekYearWithOptions: FPFn<typeof getWeekYearFn, 2> = convertToFP(
	getWeekYearFn,
	2,
);
export const getWeeksInMonth: FPFn<typeof getWeeksInMonthFn, 1> = convertToFP(
	getWeeksInMonthFn,
	1,
);
export const getWeeksInMonthWithOptions: FPFn<typeof getWeeksInMonthFn, 2> = convertToFP(
	getWeeksInMonthFn,
	2,
);
export const getYear: FPFn<typeof getYearFn, 1> = convertToFP(
	getYearFn,
	1,
);
export const getYearWithOptions: FPFn<typeof getYearFn, 2> = convertToFP(
	getYearFn,
	2,
);
export const hoursToMilliseconds: FPFn<typeof hoursToMillisecondsFn, 1> = convertToFP(
	hoursToMillisecondsFn,
	1,
);
export const hoursToMinutes: FPFn<typeof hoursToMinutesFn, 1> = convertToFP(
	hoursToMinutesFn,
	1,
);
export const hoursToSeconds: FPFn<typeof hoursToSecondsFn, 1> = convertToFP(
	hoursToSecondsFn,
	1,
);
export const interval: FPFn<typeof intervalFn, 2> = convertToFP(
	intervalFn,
	2,
);
export const intervalToDuration: FPFn<typeof intervalToDurationFn, 1> = convertToFP(
	intervalToDurationFn,
	1,
);
export const intervalToDurationWithOptions: FPFn<typeof intervalToDurationFn, 2> = convertToFP(
	intervalToDurationFn,
	2,
);
export const intervalWithOptions: FPFn<typeof intervalFn, 3> = convertToFP(
	intervalFn,
	3,
);
export const intlFormat: FPFn<typeof intlFormatFn, 3> = convertToFP(
	intlFormatFn,
	3,
);
export const intlFormatDistance: FPFn<typeof intlFormatDistanceFn, 2> = convertToFP(
	intlFormatDistanceFn,
	2,
);
export const intlFormatDistanceWithOptions: FPFn<typeof intlFormatDistanceFn, 3> = convertToFP(
	intlFormatDistanceFn,
	3,
);
export const isAfter: FPFn<typeof isAfterFn, 2> = convertToFP(
	isAfterFn,
	2,
);
export const isBefore: FPFn<typeof isBeforeFn, 2> = convertToFP(
	isBeforeFn,
	2,
);
export const isDate: FPFn<typeof isDateFn, 1> = convertToFP(
	isDateFn,
	1,
);
export const isEqual: FPFn<typeof isEqualFn, 2> = convertToFP(
	isEqualFn,
	2,
);
export const isExists: FPFn<typeof isExistsFn, 3> = convertToFP(
	isExistsFn,
	3,
);
export const isFirstDayOfMonth: FPFn<typeof isFirstDayOfMonthFn, 1> = convertToFP(
	isFirstDayOfMonthFn,
	1,
);
export const isFirstDayOfMonthWithOptions: FPFn<typeof isFirstDayOfMonthFn, 2> = convertToFP(
	isFirstDayOfMonthFn,
	2,
);
export const isFriday: FPFn<typeof isFridayFn, 1> = convertToFP(
	isFridayFn,
	1,
);
export const isFridayWithOptions: FPFn<typeof isFridayFn, 2> = convertToFP(
	isFridayFn,
	2,
);
export const isLastDayOfMonth: FPFn<typeof isLastDayOfMonthFn, 1> = convertToFP(
	isLastDayOfMonthFn,
	1,
);
export const isLastDayOfMonthWithOptions: FPFn<typeof isLastDayOfMonthFn, 2> = convertToFP(
	isLastDayOfMonthFn,
	2,
);
export const isLeapYear: FPFn<typeof isLeapYearFn, 1> = convertToFP(
	isLeapYearFn,
	1,
);
export const isLeapYearWithOptions: FPFn<typeof isLeapYearFn, 2> = convertToFP(
	isLeapYearFn,
	2,
);
export const isMatch: FPFn<typeof isMatchFn, 2> = convertToFP(
	isMatchFn,
	2,
);
export const isMatchWithOptions: FPFn<typeof isMatchFn, 3> = convertToFP(
	isMatchFn,
	3,
);
export const isMonday: FPFn<typeof isMondayFn, 1> = convertToFP(
	isMondayFn,
	1,
);
export const isMondayWithOptions: FPFn<typeof isMondayFn, 2> = convertToFP(
	isMondayFn,
	2,
);
export const isSameDay: FPFn<typeof isSameDayFn, 2> = convertToFP(
	isSameDayFn,
	2,
);
export const isSameDayWithOptions: FPFn<typeof isSameDayFn, 3> = convertToFP(
	isSameDayFn,
	3,
);
export const isSameHour: FPFn<typeof isSameHourFn, 2> = convertToFP(
	isSameHourFn,
	2,
);
export const isSameHourWithOptions: FPFn<typeof isSameHourFn, 3> = convertToFP(
	isSameHourFn,
	3,
);
export const isSameISOWeek: FPFn<typeof isSameISOWeekFn, 2> = convertToFP(
	isSameISOWeekFn,
	2,
);
export const isSameISOWeekWithOptions: FPFn<typeof isSameISOWeekFn, 3> = convertToFP(
	isSameISOWeekFn,
	3,
);
export const isSameISOWeekYear: FPFn<typeof isSameISOWeekYearFn, 2> = convertToFP(
	isSameISOWeekYearFn,
	2,
);
export const isSameISOWeekYearWithOptions: FPFn<typeof isSameISOWeekYearFn, 3> = convertToFP(
	isSameISOWeekYearFn,
	3,
);
export const isSameMinute: FPFn<typeof isSameMinuteFn, 2> = convertToFP(
	isSameMinuteFn,
	2,
);
export const isSameMonth: FPFn<typeof isSameMonthFn, 2> = convertToFP(
	isSameMonthFn,
	2,
);
export const isSameMonthWithOptions: FPFn<typeof isSameMonthFn, 3> = convertToFP(
	isSameMonthFn,
	3,
);
export const isSameQuarter: FPFn<typeof isSameQuarterFn, 2> = convertToFP(
	isSameQuarterFn,
	2,
);
export const isSameQuarterWithOptions: FPFn<typeof isSameQuarterFn, 3> = convertToFP(
	isSameQuarterFn,
	3,
);
export const isSameSecond: FPFn<typeof isSameSecondFn, 2> = convertToFP(
	isSameSecondFn,
	2,
);
export const isSameWeek: FPFn<typeof isSameWeekFn, 2> = convertToFP(
	isSameWeekFn,
	2,
);
export const isSameWeekWithOptions: FPFn<typeof isSameWeekFn, 3> = convertToFP(
	isSameWeekFn,
	3,
);
export const isSameYear: FPFn<typeof isSameYearFn, 2> = convertToFP(
	isSameYearFn,
	2,
);
export const isSameYearWithOptions: FPFn<typeof isSameYearFn, 3> = convertToFP(
	isSameYearFn,
	3,
);
export const isSaturday: FPFn<typeof isSaturdayFn, 1> = convertToFP(
	isSaturdayFn,
	1,
);
export const isSaturdayWithOptions: FPFn<typeof isSaturdayFn, 2> = convertToFP(
	isSaturdayFn,
	2,
);
export const isSunday: FPFn<typeof isSundayFn, 1> = convertToFP(
	isSundayFn,
	1,
);
export const isSundayWithOptions: FPFn<typeof isSundayFn, 2> = convertToFP(
	isSundayFn,
	2,
);
export const isThursday: FPFn<typeof isThursdayFn, 1> = convertToFP(
	isThursdayFn,
	1,
);
export const isThursdayWithOptions: FPFn<typeof isThursdayFn, 2> = convertToFP(
	isThursdayFn,
	2,
);
export const isTuesday: FPFn<typeof isTuesdayFn, 1> = convertToFP(
	isTuesdayFn,
	1,
);
export const isTuesdayWithOptions: FPFn<typeof isTuesdayFn, 2> = convertToFP(
	isTuesdayFn,
	2,
);
export const isValid: FPFn<typeof isValidFn, 1> = convertToFP(
	isValidFn,
	1,
);
export const isWednesday: FPFn<typeof isWednesdayFn, 1> = convertToFP(
	isWednesdayFn,
	1,
);
export const isWednesdayWithOptions: FPFn<typeof isWednesdayFn, 2> = convertToFP(
	isWednesdayFn,
	2,
);
export const isWeekend: FPFn<typeof isWeekendFn, 1> = convertToFP(
	isWeekendFn,
	1,
);
export const isWeekendWithOptions: FPFn<typeof isWeekendFn, 2> = convertToFP(
	isWeekendFn,
	2,
);
export const isWithinInterval: FPFn<typeof isWithinIntervalFn, 2> = convertToFP(
	isWithinIntervalFn,
	2,
);
export const isWithinIntervalWithOptions: FPFn<typeof isWithinIntervalFn, 3> = convertToFP(
	isWithinIntervalFn,
	3,
);
export const lastDayOfDecade: FPFn<typeof lastDayOfDecadeFn, 1> = convertToFP(
	lastDayOfDecadeFn,
	1,
);
export const lastDayOfDecadeWithOptions: FPFn<typeof lastDayOfDecadeFn, 2> = convertToFP(
	lastDayOfDecadeFn,
	2,
);
export const lastDayOfISOWeek: FPFn<typeof lastDayOfISOWeekFn, 1> = convertToFP(
	lastDayOfISOWeekFn,
	1,
);
export const lastDayOfISOWeekWithOptions: FPFn<typeof lastDayOfISOWeekFn, 2> = convertToFP(
	lastDayOfISOWeekFn,
	2,
);
export const lastDayOfISOWeekYear: FPFn<typeof lastDayOfISOWeekYearFn, 1> = convertToFP(
	lastDayOfISOWeekYearFn,
	1,
);
export const lastDayOfISOWeekYearWithOptions: FPFn<typeof lastDayOfISOWeekYearFn, 2> = convertToFP(
	lastDayOfISOWeekYearFn,
	2,
);
export const lastDayOfMonth: FPFn<typeof lastDayOfMonthFn, 1> = convertToFP(
	lastDayOfMonthFn,
	1,
);
export const lastDayOfMonthWithOptions: FPFn<typeof lastDayOfMonthFn, 2> = convertToFP(
	lastDayOfMonthFn,
	2,
);
export const lastDayOfQuarter: FPFn<typeof lastDayOfQuarterFn, 1> = convertToFP(
	lastDayOfQuarterFn,
	1,
);
export const lastDayOfQuarterWithOptions: FPFn<typeof lastDayOfQuarterFn, 2> = convertToFP(
	lastDayOfQuarterFn,
	2,
);
export const lastDayOfWeek: FPFn<typeof lastDayOfWeekFn, 1> = convertToFP(
	lastDayOfWeekFn,
	1,
);
export const lastDayOfWeekWithOptions: FPFn<typeof lastDayOfWeekFn, 2> = convertToFP(
	lastDayOfWeekFn,
	2,
);
export const lastDayOfYear: FPFn<typeof lastDayOfYearFn, 1> = convertToFP(
	lastDayOfYearFn,
	1,
);
export const lastDayOfYearWithOptions: FPFn<typeof lastDayOfYearFn, 2> = convertToFP(
	lastDayOfYearFn,
	2,
);
export const lightFormat: FPFn<typeof lightFormatFn, 2> = convertToFP(
	lightFormatFn,
	2,
);
export const max: FPFn<typeof maxFn, 1> = convertToFP(
	maxFn,
	1,
);
export const maxWithOptions: FPFn<typeof maxFn, 2> = convertToFP(
	maxFn,
	2,
);
export const milliseconds: FPFn<typeof millisecondsFn, 1> = convertToFP(
	millisecondsFn,
	1,
);
export const millisecondsToHours: FPFn<typeof millisecondsToHoursFn, 1> = convertToFP(
	millisecondsToHoursFn,
	1,
);
export const millisecondsToMinutes: FPFn<typeof millisecondsToMinutesFn, 1> = convertToFP(
	millisecondsToMinutesFn,
	1,
);
export const millisecondsToSeconds: FPFn<typeof millisecondsToSecondsFn, 1> = convertToFP(
	millisecondsToSecondsFn,
	1,
);
export const min: FPFn<typeof minFn, 1> = convertToFP(
	minFn,
	1,
);
export const minWithOptions: FPFn<typeof minFn, 2> = convertToFP(
	minFn,
	2,
);
export const minutesToHours: FPFn<typeof minutesToHoursFn, 1> = convertToFP(
	minutesToHoursFn,
	1,
);
export const minutesToMilliseconds: FPFn<typeof minutesToMillisecondsFn, 1> = convertToFP(
	minutesToMillisecondsFn,
	1,
);
export const minutesToSeconds: FPFn<typeof minutesToSecondsFn, 1> = convertToFP(
	minutesToSecondsFn,
	1,
);
export const monthsToQuarters: FPFn<typeof monthsToQuartersFn, 1> = convertToFP(
	monthsToQuartersFn,
	1,
);
export const monthsToYears: FPFn<typeof monthsToYearsFn, 1> = convertToFP(
	monthsToYearsFn,
	1,
);
export const nextDay: FPFn<typeof nextDayFn, 2> = convertToFP(
	nextDayFn,
	2,
);
export const nextDayWithOptions: FPFn<typeof nextDayFn, 3> = convertToFP(
	nextDayFn,
	3,
);
export const nextFriday: FPFn<typeof nextFridayFn, 1> = convertToFP(
	nextFridayFn,
	1,
);
export const nextFridayWithOptions: FPFn<typeof nextFridayFn, 2> = convertToFP(
	nextFridayFn,
	2,
);
export const nextMonday: FPFn<typeof nextMondayFn, 1> = convertToFP(
	nextMondayFn,
	1,
);
export const nextMondayWithOptions: FPFn<typeof nextMondayFn, 2> = convertToFP(
	nextMondayFn,
	2,
);
export const nextSaturday: FPFn<typeof nextSaturdayFn, 1> = convertToFP(
	nextSaturdayFn,
	1,
);
export const nextSaturdayWithOptions: FPFn<typeof nextSaturdayFn, 2> = convertToFP(
	nextSaturdayFn,
	2,
);
export const nextSunday: FPFn<typeof nextSundayFn, 1> = convertToFP(
	nextSundayFn,
	1,
);
export const nextSundayWithOptions: FPFn<typeof nextSundayFn, 2> = convertToFP(
	nextSundayFn,
	2,
);
export const nextThursday: FPFn<typeof nextThursdayFn, 1> = convertToFP(
	nextThursdayFn,
	1,
);
export const nextThursdayWithOptions: FPFn<typeof nextThursdayFn, 2> = convertToFP(
	nextThursdayFn,
	2,
);
export const nextTuesday: FPFn<typeof nextTuesdayFn, 1> = convertToFP(
	nextTuesdayFn,
	1,
);
export const nextTuesdayWithOptions: FPFn<typeof nextTuesdayFn, 2> = convertToFP(
	nextTuesdayFn,
	2,
);
export const nextWednesday: FPFn<typeof nextWednesdayFn, 1> = convertToFP(
	nextWednesdayFn,
	1,
);
export const nextWednesdayWithOptions: FPFn<typeof nextWednesdayFn, 2> = convertToFP(
	nextWednesdayFn,
	2,
);
export const parse: FPFn<typeof parseFn, 3> = convertToFP(
	parseFn,
	3,
);
export const parseISO: FPFn<typeof parseISOFn, 1> = convertToFP(
	parseISOFn,
	1,
);
export const parseISOWithOptions: FPFn<typeof parseISOFn, 2> = convertToFP(
	parseISOFn,
	2,
);
export const parseJSON: FPFn<typeof parseJSONFn, 1> = convertToFP(
	parseJSONFn,
	1,
);
export const parseJSONWithOptions: FPFn<typeof parseJSONFn, 2> = convertToFP(
	parseJSONFn,
	2,
);
export const parseWithOptions: FPFn<typeof parseFn, 4> = convertToFP(
	parseFn,
	4,
);
export const previousDay: FPFn<typeof previousDayFn, 2> = convertToFP(
	previousDayFn,
	2,
);
export const previousDayWithOptions: FPFn<typeof previousDayFn, 3> = convertToFP(
	previousDayFn,
	3,
);
export const previousFriday: FPFn<typeof previousFridayFn, 1> = convertToFP(
	previousFridayFn,
	1,
);
export const previousFridayWithOptions: FPFn<typeof previousFridayFn, 2> = convertToFP(
	previousFridayFn,
	2,
);
export const previousMonday: FPFn<typeof previousMondayFn, 1> = convertToFP(
	previousMondayFn,
	1,
);
export const previousMondayWithOptions: FPFn<typeof previousMondayFn, 2> = convertToFP(
	previousMondayFn,
	2,
);
export const previousSaturday: FPFn<typeof previousSaturdayFn, 1> = convertToFP(
	previousSaturdayFn,
	1,
);
export const previousSaturdayWithOptions: FPFn<typeof previousSaturdayFn, 2> = convertToFP(
	previousSaturdayFn,
	2,
);
export const previousSunday: FPFn<typeof previousSundayFn, 1> = convertToFP(
	previousSundayFn,
	1,
);
export const previousSundayWithOptions: FPFn<typeof previousSundayFn, 2> = convertToFP(
	previousSundayFn,
	2,
);
export const previousThursday: FPFn<typeof previousThursdayFn, 1> = convertToFP(
	previousThursdayFn,
	1,
);
export const previousThursdayWithOptions: FPFn<typeof previousThursdayFn, 2> = convertToFP(
	previousThursdayFn,
	2,
);
export const previousTuesday: FPFn<typeof previousTuesdayFn, 1> = convertToFP(
	previousTuesdayFn,
	1,
);
export const previousTuesdayWithOptions: FPFn<typeof previousTuesdayFn, 2> = convertToFP(
	previousTuesdayFn,
	2,
);
export const previousWednesday: FPFn<typeof previousWednesdayFn, 1> = convertToFP(
	previousWednesdayFn,
	1,
);
export const previousWednesdayWithOptions: FPFn<typeof previousWednesdayFn, 2> = convertToFP(
	previousWednesdayFn,
	2,
);
export const quartersToMonths: FPFn<typeof quartersToMonthsFn, 1> = convertToFP(
	quartersToMonthsFn,
	1,
);
export const quartersToYears: FPFn<typeof quartersToYearsFn, 1> = convertToFP(
	quartersToYearsFn,
	1,
);
export const roundToNearestHours: FPFn<typeof roundToNearestHoursFn, 1> = convertToFP(
	roundToNearestHoursFn,
	1,
);
export const roundToNearestHoursWithOptions: FPFn<typeof roundToNearestHoursFn, 2> = convertToFP(
	roundToNearestHoursFn,
	2,
);
export const roundToNearestMinutes: FPFn<typeof roundToNearestMinutesFn, 1> = convertToFP(
	roundToNearestMinutesFn,
	1,
);
export const roundToNearestMinutesWithOptions: FPFn<typeof roundToNearestMinutesFn, 2> = convertToFP(
	roundToNearestMinutesFn,
	2,
);
export const secondsToHours: FPFn<typeof secondsToHoursFn, 1> = convertToFP(
	secondsToHoursFn,
	1,
);
export const secondsToMilliseconds: FPFn<typeof secondsToMillisecondsFn, 1> = convertToFP(
	secondsToMillisecondsFn,
	1,
);
export const secondsToMinutes: FPFn<typeof secondsToMinutesFn, 1> = convertToFP(
	secondsToMinutesFn,
	1,
);
export const set: FPFn<typeof setFn, 2> = convertToFP(
	setFn,
	2,
);
export const setDate: FPFn<typeof setDateFn, 2> = convertToFP(
	setDateFn,
	2,
);
export const setDateWithOptions: FPFn<typeof setDateFn, 3> = convertToFP(
	setDateFn,
	3,
);
export const setDay: FPFn<typeof setDayFn, 2> = convertToFP(
	setDayFn,
	2,
);
export const setDayOfYear: FPFn<typeof setDayOfYearFn, 2> = convertToFP(
	setDayOfYearFn,
	2,
);
export const setDayOfYearWithOptions: FPFn<typeof setDayOfYearFn, 3> = convertToFP(
	setDayOfYearFn,
	3,
);
export const setDayWithOptions: FPFn<typeof setDayFn, 3> = convertToFP(
	setDayFn,
	3,
);
export const setHours: FPFn<typeof setHoursFn, 2> = convertToFP(
	setHoursFn,
	2,
);
export const setHoursWithOptions: FPFn<typeof setHoursFn, 3> = convertToFP(
	setHoursFn,
	3,
);
export const setISODay: FPFn<typeof setISODayFn, 2> = convertToFP(
	setISODayFn,
	2,
);
export const setISODayWithOptions: FPFn<typeof setISODayFn, 3> = convertToFP(
	setISODayFn,
	3,
);
export const setISOWeek: FPFn<typeof setISOWeekFn, 2> = convertToFP(
	setISOWeekFn,
	2,
);
export const setISOWeekWithOptions: FPFn<typeof setISOWeekFn, 3> = convertToFP(
	setISOWeekFn,
	3,
);
export const setISOWeekYear: FPFn<typeof setISOWeekYearFn, 2> = convertToFP(
	setISOWeekYearFn,
	2,
);
export const setISOWeekYearWithOptions: FPFn<typeof setISOWeekYearFn, 3> = convertToFP(
	setISOWeekYearFn,
	3,
);
export const setMilliseconds: FPFn<typeof setMillisecondsFn, 2> = convertToFP(
	setMillisecondsFn,
	2,
);
export const setMillisecondsWithOptions: FPFn<typeof setMillisecondsFn, 3> = convertToFP(
	setMillisecondsFn,
	3,
);
export const setMinutes: FPFn<typeof setMinutesFn, 2> = convertToFP(
	setMinutesFn,
	2,
);
export const setMinutesWithOptions: FPFn<typeof setMinutesFn, 3> = convertToFP(
	setMinutesFn,
	3,
);
export const setMonth: FPFn<typeof setMonthFn, 2> = convertToFP(
	setMonthFn,
	2,
);
export const setMonthWithOptions: FPFn<typeof setMonthFn, 3> = convertToFP(
	setMonthFn,
	3,
);
export const setQuarter: FPFn<typeof setQuarterFn, 2> = convertToFP(
	setQuarterFn,
	2,
);
export const setQuarterWithOptions: FPFn<typeof setQuarterFn, 3> = convertToFP(
	setQuarterFn,
	3,
);
export const setSeconds: FPFn<typeof setSecondsFn, 2> = convertToFP(
	setSecondsFn,
	2,
);
export const setSecondsWithOptions: FPFn<typeof setSecondsFn, 3> = convertToFP(
	setSecondsFn,
	3,
);
export const setWeek: FPFn<typeof setWeekFn, 2> = convertToFP(
	setWeekFn,
	2,
);
export const setWeekWithOptions: FPFn<typeof setWeekFn, 3> = convertToFP(
	setWeekFn,
	3,
);
export const setWeekYear: FPFn<typeof setWeekYearFn, 2> = convertToFP(
	setWeekYearFn,
	2,
);
export const setWeekYearWithOptions: FPFn<typeof setWeekYearFn, 3> = convertToFP(
	setWeekYearFn,
	3,
);
export const setWithOptions: FPFn<typeof setFn, 3> = convertToFP(
	setFn,
	3,
);
export const setYear: FPFn<typeof setYearFn, 2> = convertToFP(
	setYearFn,
	2,
);
export const setYearWithOptions: FPFn<typeof setYearFn, 3> = convertToFP(
	setYearFn,
	3,
);
export const startOfDay: FPFn<typeof startOfDayFn, 1> = convertToFP(
	startOfDayFn,
	1,
);
export const startOfDayWithOptions: FPFn<typeof startOfDayFn, 2> = convertToFP(
	startOfDayFn,
	2,
);
export const startOfDecade: FPFn<typeof startOfDecadeFn, 1> = convertToFP(
	startOfDecadeFn,
	1,
);
export const startOfDecadeWithOptions: FPFn<typeof startOfDecadeFn, 2> = convertToFP(
	startOfDecadeFn,
	2,
);
export const startOfHour: FPFn<typeof startOfHourFn, 1> = convertToFP(
	startOfHourFn,
	1,
);
export const startOfHourWithOptions: FPFn<typeof startOfHourFn, 2> = convertToFP(
	startOfHourFn,
	2,
);
export const startOfISOWeek: FPFn<typeof startOfISOWeekFn, 1> = convertToFP(
	startOfISOWeekFn,
	1,
);
export const startOfISOWeekWithOptions: FPFn<typeof startOfISOWeekFn, 2> = convertToFP(
	startOfISOWeekFn,
	2,
);
export const startOfISOWeekYear: FPFn<typeof startOfISOWeekYearFn, 1> = convertToFP(
	startOfISOWeekYearFn,
	1,
);
export const startOfISOWeekYearWithOptions: FPFn<typeof startOfISOWeekYearFn, 2> = convertToFP(
	startOfISOWeekYearFn,
	2,
);
export const startOfMinute: FPFn<typeof startOfMinuteFn, 1> = convertToFP(
	startOfMinuteFn,
	1,
);
export const startOfMinuteWithOptions: FPFn<typeof startOfMinuteFn, 2> = convertToFP(
	startOfMinuteFn,
	2,
);
export const startOfMonth: FPFn<typeof startOfMonthFn, 1> = convertToFP(
	startOfMonthFn,
	1,
);
export const startOfMonthWithOptions: FPFn<typeof startOfMonthFn, 2> = convertToFP(
	startOfMonthFn,
	2,
);
export const startOfQuarter: FPFn<typeof startOfQuarterFn, 1> = convertToFP(
	startOfQuarterFn,
	1,
);
export const startOfQuarterWithOptions: FPFn<typeof startOfQuarterFn, 2> = convertToFP(
	startOfQuarterFn,
	2,
);
export const startOfSecond: FPFn<typeof startOfSecondFn, 1> = convertToFP(
	startOfSecondFn,
	1,
);
export const startOfSecondWithOptions: FPFn<typeof startOfSecondFn, 2> = convertToFP(
	startOfSecondFn,
	2,
);
export const startOfWeek: FPFn<typeof startOfWeekFn, 1> = convertToFP(
	startOfWeekFn,
	1,
);
export const startOfWeekWithOptions: FPFn<typeof startOfWeekFn, 2> = convertToFP(
	startOfWeekFn,
	2,
);
export const startOfWeekYear: FPFn<typeof startOfWeekYearFn, 1> = convertToFP(
	startOfWeekYearFn,
	1,
);
export const startOfWeekYearWithOptions: FPFn<typeof startOfWeekYearFn, 2> = convertToFP(
	startOfWeekYearFn,
	2,
);
export const startOfYear: FPFn<typeof startOfYearFn, 1> = convertToFP(
	startOfYearFn,
	1,
);
export const startOfYearWithOptions: FPFn<typeof startOfYearFn, 2> = convertToFP(
	startOfYearFn,
	2,
);
export const sub: FPFn<typeof subFn, 2> = convertToFP(
	subFn,
	2,
);
export const subBusinessDays: FPFn<typeof subBusinessDaysFn, 2> = convertToFP(
	subBusinessDaysFn,
	2,
);
export const subBusinessDaysWithOptions: FPFn<typeof subBusinessDaysFn, 3> = convertToFP(
	subBusinessDaysFn,
	3,
);
export const subDays: FPFn<typeof subDaysFn, 2> = convertToFP(
	subDaysFn,
	2,
);
export const subDaysWithOptions: FPFn<typeof subDaysFn, 3> = convertToFP(
	subDaysFn,
	3,
);
export const subHours: FPFn<typeof subHoursFn, 2> = convertToFP(
	subHoursFn,
	2,
);
export const subHoursWithOptions: FPFn<typeof subHoursFn, 3> = convertToFP(
	subHoursFn,
	3,
);
export const subISOWeekYears: FPFn<typeof subISOWeekYearsFn, 2> = convertToFP(
	subISOWeekYearsFn,
	2,
);
export const subISOWeekYearsWithOptions: FPFn<typeof subISOWeekYearsFn, 3> = convertToFP(
	subISOWeekYearsFn,
	3,
);
export const subMilliseconds: FPFn<typeof subMillisecondsFn, 2> = convertToFP(
	subMillisecondsFn,
	2,
);
export const subMillisecondsWithOptions: FPFn<typeof subMillisecondsFn, 3> = convertToFP(
	subMillisecondsFn,
	3,
);
export const subMinutes: FPFn<typeof subMinutesFn, 2> = convertToFP(
	subMinutesFn,
	2,
);
export const subMinutesWithOptions: FPFn<typeof subMinutesFn, 3> = convertToFP(
	subMinutesFn,
	3,
);
export const subMonths: FPFn<typeof subMonthsFn, 2> = convertToFP(
	subMonthsFn,
	2,
);
export const subMonthsWithOptions: FPFn<typeof subMonthsFn, 3> = convertToFP(
	subMonthsFn,
	3,
);
export const subQuarters: FPFn<typeof subQuartersFn, 2> = convertToFP(
	subQuartersFn,
	2,
);
export const subQuartersWithOptions: FPFn<typeof subQuartersFn, 3> = convertToFP(
	subQuartersFn,
	3,
);
export const subSeconds: FPFn<typeof subSecondsFn, 2> = convertToFP(
	subSecondsFn,
	2,
);
export const subSecondsWithOptions: FPFn<typeof subSecondsFn, 3> = convertToFP(
	subSecondsFn,
	3,
);
export const subWeeks: FPFn<typeof subWeeksFn, 2> = convertToFP(
	subWeeksFn,
	2,
);
export const subWeeksWithOptions: FPFn<typeof subWeeksFn, 3> = convertToFP(
	subWeeksFn,
	3,
);
export const subWithOptions: FPFn<typeof subFn, 3> = convertToFP(
	subFn,
	3,
);
export const subYears: FPFn<typeof subYearsFn, 2> = convertToFP(
	subYearsFn,
	2,
);
export const subYearsWithOptions: FPFn<typeof subYearsFn, 3> = convertToFP(
	subYearsFn,
	3,
);
export const toDate: FPFn<typeof toDateFn, 2> = convertToFP(
	toDateFn,
	2,
);
export const transpose: FPFn<typeof transposeFn, 2> = convertToFP(
	transposeFn,
	2,
);
export const weeksToDays: FPFn<typeof weeksToDaysFn, 1> = convertToFP(
	weeksToDaysFn,
	1,
);
export const yearsToDays: FPFn<typeof yearsToDaysFn, 1> = convertToFP(
	yearsToDaysFn,
	1,
);
export const yearsToMonths: FPFn<typeof yearsToMonthsFn, 1> = convertToFP(
	yearsToMonthsFn,
	1,
);
export const yearsToQuarters: FPFn<typeof yearsToQuartersFn, 1> = convertToFP(
	yearsToQuartersFn,
	1,
);
