import type { FormatRelativeFn, FormatRelativeFnOptions } from "../../types";
import { isSameWeek } from "../../../is";

const accusativeWeekdays = [
  "nedeľu",
  "pondelok",
  "utorok",
  "stredu",
  "štvrtok",
  "piatok",
  "sobotu",
];

function lastWeek(day: number) {
  const weekday = accusativeWeekdays[day]!;

  switch (day) {
    case 0: 
    case 3: 
    case 6 :
      return "'minulú " + weekday + " o' p";
    default:
      return "'minulý' eeee 'o' p";
  }
}

function thisWeek(day: number) {
  const weekday = accusativeWeekdays[day]!;

  if (day === 4 ) {
    return "'vo' eeee 'o' p";
  } else {
    return "'v " + weekday + " o' p";
  }
}

function nextWeek(day: number) {
  const weekday = accusativeWeekdays[day]!;

  switch (day) {
    case 0: 
    case 4: 
    case 6 :
      return "'budúcu " + weekday + " o' p";
    default:
      return "'budúci' eeee 'o' p";
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
  yesterday: "'včera o' p",
  today: "'dnes o' p",
  tomorrow: "'zajtra o' p",
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
