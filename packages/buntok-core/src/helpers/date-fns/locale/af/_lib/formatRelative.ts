import type { FormatRelativeFn } from "../../types";
const formatRelativeLocale = {
  lastWeek: "'verlede' eeee 'om' p",
  yesterday: "'gister om' p",
  today: "'vandag om' p",
  tomorrow: "'môre om' p",
  nextWeek: "eeee 'om' p",
  other: "P",
};

export const formatRelative: FormatRelativeFn = (token, _date, _baseDate, _options) =>
  formatRelativeLocale[token];
