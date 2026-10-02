import type { FormatRelativeFn, FormatRelativeFnOptions } from "../../types";
import { isSameWeek } from "../../../is";

const accusativeWeekdays = [
  "воскресенье",
  "понедельник",
  "вторник",
  "среду",
  "четверг",
  "пятницу",
  "субботу",
];

function lastWeek(day: number) {
  const weekday = accusativeWeekdays[day]!;

  switch (day) {
    case 0:
      return "'в прошлое " + weekday + " в' p";
    case 1:
    case 2:
    case 4:
      return "'в прошлый " + weekday + " в' p";
    case 3:
    case 5:
    case 6:
      return "'в прошлую " + weekday + " в' p";
  	default:
  		return "'в прошлую " + weekday + " в' p";
  }
}

function thisWeek(day: number) {
  const weekday = accusativeWeekdays[day]!;

  if (day === 2 ) {
    return "'во " + weekday + " в' p";
  } else {
    return "'в " + weekday + " в' p";
  }
}

function nextWeek(day: number) {
  const weekday = accusativeWeekdays[day]!;

  switch (day) {
    case 0:
      return "'в следующее " + weekday + " в' p";
    case 1:
    case 2:
    case 4:
      return "'в следующий " + weekday + " в' p";
    case 3:
    case 5:
    case 6:
      return "'в следующую " + weekday + " в' p";
  	default:
  		return "'в следующую " + weekday + " в' p";
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
  yesterday: "'вчера в' p",
  today: "'сегодня в' p",
  tomorrow: "'завтра в' p",
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
