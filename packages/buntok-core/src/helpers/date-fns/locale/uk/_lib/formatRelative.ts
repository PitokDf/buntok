import type { DateArg } from "../../../_lib/types";
import type { FormatRelativeFn, FormatRelativeFnOptions } from "../../types";
import { isSameWeek } from "../../../is";
import { toDate } from "../../../_lib/to-date";

const accusativeWeekdays = [
  "неділю",
  "понеділок",
  "вівторок",
  "середу",
  "четвер",
  "п’ятницю",
  "суботу",
];

function lastWeek(day: number) {
  const weekday = accusativeWeekdays[day]!;

  switch (day) {
    case 0:
    case 3:
    case 5:
    case 6:
      return "'у минулу " + weekday + " о' p";
    case 1:
    case 2:
    case 4:
      return "'у минулий " + weekday + " о' p";
  	default:
  		return "'у минулий " + weekday + " о' p";
  }
}

function thisWeek(day: number) {
  const weekday = accusativeWeekdays[day]!;

  return "'у " + weekday + " о' p";
}

function nextWeek(day: number) {
  const weekday = accusativeWeekdays[day]!;

  switch (day) {
    case 0:
    case 3:
    case 5:
    case 6:
      return "'у наступну " + weekday + " о' p";
    case 1:
    case 2:
    case 4:
      return "'у наступний " + weekday + " о' p";
  	default:
  		return "'у наступний " + weekday + " о' p";
  }
}

const lastWeekFormat = (dirtyDate: DateArg<Date>, baseDate: DateArg<Date>, options?: FormatRelativeFnOptions) => {
  const date = toDate(dirtyDate);
  const day = date.getDay();

  if (isSameWeek(date, baseDate, options)) {
    return thisWeek(day);
  } else {
    return lastWeek(day);
  }
};

const nextWeekFormat = (dirtyDate: DateArg<Date>, baseDate: DateArg<Date>, options?: FormatRelativeFnOptions) => {
  const date = toDate(dirtyDate);
  const day = date.getDay();
  if (isSameWeek(date, baseDate, options)) {
    return thisWeek(day);
  } else {
    return nextWeek(day);
  }
};

const formatRelativeLocale = {
  lastWeek: lastWeekFormat,
  yesterday: "'вчора о' p",
  today: "'сьогодні о' p",
  tomorrow: "'завтра о' p",
  nextWeek: nextWeekFormat,
  other: "P",
};

export const formatRelative: FormatRelativeFn = (token, date, baseDate, options) => {
  const format = formatRelativeLocale[token];

  if (typeof format === "function") {
    return format(date, baseDate, options);
  }

  return format;
};
