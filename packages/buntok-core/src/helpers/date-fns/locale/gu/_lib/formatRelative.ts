import type { FormatRelativeFn } from "../../types";


const formatRelativeLocale = {
  lastWeek: "'પાછલા' eeee p",
  yesterday: "'ગઈકાલે' p",
  today: "'આજે' p",
  tomorrow: "'આવતીકાલે' p",
  nextWeek: "eeee p",
  other: "P",
};

export const formatRelative: FormatRelativeFn = (token, _date, _baseDate, _options) =>
  formatRelativeLocale[token];
