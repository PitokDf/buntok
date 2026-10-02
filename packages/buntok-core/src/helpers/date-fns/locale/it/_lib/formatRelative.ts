import type { FormatRelativeFn, FormatRelativeFnOptions } from "../../types";
import { isSameWeek } from "../../../is";

const weekdays = [
  "domenica",
  "lunedì",
  "martedì",
  "mercoledì",
  "giovedì",
  "venerdì",
  "sabato",
];

function lastWeek(day: number) {
  switch (day) {
    case 0:
      return "'domenica scorsa alle' p";
    default:
      return "'" + weekdays[day]! + " scorso alle' p";
  }
}

function thisWeek(day: number) {
  return "'" + weekdays[day]! + " alle' p";
}

function nextWeek(day: number) {
  switch (day) {
    case 0:
      return "'domenica prossima alle' p";
    default:
      return "'" + weekdays[day]! + " prossimo alle' p";
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
  yesterday: "'ieri alle' p",
  today: "'oggi alle' p",
  tomorrow: "'domani alle' p",
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
