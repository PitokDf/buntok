import type { DateArg } from "../../../_lib/types";
import type { FormatRelativeFn, FormatRelativeFnOptions } from "../../types";
import { isSameWeek } from "../../../is";
import { toDate } from "../../../_lib/to-date";

const weekdays = [
  "неделя",
  "понеделник",
  "вторник",
  "сряда",
  "четвъртък",
  "петък",
  "събота",
];

function lastWeek(day: number) {
  const weekday = weekdays[day]!;

  switch (day) {
    case 0:
    case 3:
    case 6:
      return "'миналата " + weekday + " в' p";
    case 1:
    case 2:
    case 4:
    case 5:
      return "'миналия " + weekday + " в' p";
  	default:
  		return "'миналия " + weekday + " в' p";
  }
}

function thisWeek(day: number) {
  const weekday = weekdays[day]!;

  if (day === 2 ) {
    return "'във " + weekday + " в' p";
  } else {
    return "'в " + weekday + " в' p";
  }
}

function nextWeek(day: number) {
  const weekday = weekdays[day]!;

  switch (day) {
    case 0:
    case 3:
    case 6:
      return "'следващата " + weekday + " в' p";
    case 1:
    case 2:
    case 4:
    case 5:
      return "'следващия " + weekday + " в' p";
  	default:
  		return "'следващия " + weekday + " в' p";
  }
}

const lastWeekFormatToken = (dirtyDate: DateArg<Date>, baseDate: DateArg<Date>, options?: FormatRelativeFnOptions) => {
  const date = toDate(dirtyDate);
  const day = date.getDay();
  if (isSameWeek(date, baseDate, options)) {
    return thisWeek(day);
  } else {
    return lastWeek(day);
  }
};

const nextWeekFormatToken = (dirtyDate: DateArg<Date>, baseDate: DateArg<Date>, options?: FormatRelativeFnOptions) => {
  const date = toDate(dirtyDate);
  const day = date.getDay();
  if (isSameWeek(date, baseDate, options)) {
    return thisWeek(day);
  } else {
    return nextWeek(day);
  }
};

const formatRelativeLocale = {
  lastWeek: lastWeekFormatToken,
  yesterday: "'вчера в' p",
  today: "'днес в' p",
  tomorrow: "'утре в' p",
  nextWeek: nextWeekFormatToken,
  other: "P",
};

export const formatRelative: FormatRelativeFn = (token, date, baseDate, options) => {
  const format = formatRelativeLocale[token];

  if (typeof format === "function") {
    return format(date, baseDate, options);
  }

  return format;
};
