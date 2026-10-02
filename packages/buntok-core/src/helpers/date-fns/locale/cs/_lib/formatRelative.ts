import type { FormatRelativeFn, FormatRelativeFnOptions } from "../../types";
const accusativeWeekdays = [
  "neděli",
  "pondělí",
  "úterý",
  "středu",
  "čtvrtek",
  "pátek",
  "sobotu",
];

const formatRelativeLocale = {
  lastWeek: "'poslední' eeee 've' p",
  yesterday: "'včera v' p",
  today: "'dnes v' p",
  tomorrow: "'zítra v' p",
  nextWeek: (date: Date, _baseDate?: Date, _options?: FormatRelativeFnOptions) => {
    const day = date.getDay();
    return "'v " + accusativeWeekdays[day]! + " o' p";
  },
  other: "P",
};

export const formatRelative: FormatRelativeFn = (token, date) => {
  const format = formatRelativeLocale[token];

  if (typeof format === "function") {
    return format(date);
  }

  return format;
};
