import type { DateArg } from "../../../_lib/types";
import type { FormatRelativeFn, FormatRelativeFnOptions } from "../../types";
import { isSameWeek } from "../../../is";
import { toDate } from "../../../_lib/to-date";

const accusativeWeekdays = [
  "нядзелю",
  "панядзелак",
  "аўторак",
  "сераду",
  "чацьвер",
  "пятніцу",
  "суботу",
];

function lastWeek(day: number) {
  const weekday = accusativeWeekdays[day]!;

  switch (day) {
    case 0:
    case 3:
    case 5:
    case 6:
      return "'у мінулую " + weekday + " а' p";
    case 1:
    case 2:
    case 4:
      return "'у мінулы " + weekday + " а' p";
  	default:
  		return "'у мінулы " + weekday + " а' p";
  }
}

function thisWeek(day: number) {
  const weekday = accusativeWeekdays[day]!;

  return "'у " + weekday + " а' p";
}

function nextWeek(day: number) {
  const weekday = accusativeWeekdays[day]!;

  switch (day) {
    case 0:
    case 3:
    case 5:
    case 6:
      return "'у наступную " + weekday + " а' p";
    case 1:
    case 2:
    case 4:
      return "'у наступны " + weekday + " а' p";
  	default:
  		return "'у наступны " + weekday + " а' p";
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
  yesterday: "'учора а' p",
  today: "'сёньня а' p",
  tomorrow: "'заўтра а' p",
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
