import type { FormatRelativeFn, FormatRelativeFnOptions } from "../../types";
import { isSameWeek } from "../../../is";

const weekdays = [
  "недела",
  "понеделник",
  "вторник",
  "среда",
  "четврток",
  "петок",
  "сабота",
];

function lastWeek(day: number) {
  const weekday = weekdays[day]!;

  switch (day) {
    case 0:
    case 3:
    case 6:
      return "'минатата " + weekday + " во' p";
    case 1:
    case 2:
    case 4:
    case 5:
      return "'минатиот " + weekday + " во' p";
  	default:
  		return "'минатиот " + weekday + " во' p";
  }
}

function thisWeek(day: number) {
  const weekday = weekdays[day]!;

  switch (day) {
    case 0:
    case 3:
    case 6:
      return "'ова " + weekday + " вo' p";
    case 1:
    case 2:
    case 4:
    case 5:
      return "'овој " + weekday + " вo' p";
  	default:
  		return "'овој " + weekday + " вo' p";
  }
}

function nextWeek(day: number) {
  const weekday = weekdays[day]!;

  switch (day) {
    case 0:
    case 3:
    case 6:
      return "'следната " + weekday + " вo' p";
    case 1:
    case 2:
    case 4:
    case 5:
      return "'следниот " + weekday + " вo' p";
  	default:
  		return "'следниот " + weekday + " вo' p";
  }
}

const formatRelativeLocale = {
  lastWeek: (date: Date, baseDate: Date, options?: FormatRelativeFnOptions) => {
    const day = date.getDay();
    if (isSameWeek(date, baseDate, options)) {
      return thisWeek(day);
    } else {
      return lastWeek(day);
    }
  },
  yesterday: "'вчера во' p",
  today: "'денес во' p",
  tomorrow: "'утре во' p",
  nextWeek: (date: Date, baseDate: Date, options?: FormatRelativeFnOptions) => {
    const day = date.getDay();
    if (isSameWeek(date, baseDate, options)) {
      return thisWeek(day);
    } else {
      return nextWeek(day);
    }
  },
  other: "P",
};

export const formatRelative: FormatRelativeFn = (token, date, baseDate, options) => {
  const format = formatRelativeLocale[token];

  if (typeof format === "function") {
    return format(date, baseDate, options);
  }

  return format;
};
