import type { FormatRelativeFn, FormatRelativeFnOptions } from "../../types";
const formatRelativeLocale = {
  lastWeek: (date: Date, _baseDate?: Date, _options?: FormatRelativeFnOptions) => {
    const day = date.getDay();
    let result = "'läschte";
    if (day === 2 || day === 4) {

      result += "n";
    }
    result += "' eeee 'um' p";
    return result;
  },
  yesterday: "'gëschter um' p",
  today: "'haut um' p",
  tomorrow: "'moien um' p",
  nextWeek: "eeee 'um' p",
  other: "P",
};

export const formatRelative: FormatRelativeFn = (token, date, _baseDate, _options) => {
  const format = formatRelativeLocale[token];

  if (typeof format === "function") {
    return format(date);
  }

  return format;
};
