import type { FormatRelativeFn } from "../../types";
const formatRelativeLocale = {
  lastWeek: "'mu dheireadh' eeee 'aig' p",
  yesterday: "'an-dè aig' p",
  today: "'an-diugh aig' p",
  tomorrow: "'a-màireach aig' p",
  nextWeek: "eeee 'aig' p",
  other: "P",
};

export const formatRelative: FormatRelativeFn = (token, _date, _baseDate, _options) =>
  formatRelativeLocale[token];
