import type { FormatRelativeFn, FormatRelativeFnOptions } from "../../types";
import { isSameWeek } from "../../../is";

function checkWeek(
	date: Date,
	baseDate: Date,
	options?: FormatRelativeFnOptions,
) {
  const baseFormat = "eeee p";

  if (isSameWeek(date, baseDate, options)) {
    return baseFormat;
  } else if (date.getTime() > baseDate.getTime()) {
    return "'下个'" + baseFormat;
  }
  return "'上个'" + baseFormat;
}

const formatRelativeLocale = {
  lastWeek: checkWeek,
  yesterday: "'昨天' p",
  today: "'今天' p",
  tomorrow: "'明天' p",
  nextWeek: checkWeek,
  other: "PP p",
};

export const formatRelative: FormatRelativeFn = (token, date, baseDate, options) => {
  const format = formatRelativeLocale[token];

  if (typeof format === "function") {
    return format(date, baseDate, options);
  }

  return format;
};
