import type { FormatRelativeFn } from "../../types";


const formatRelativeLocale = {
  lastWeek: "'గత' eeee p",
  yesterday: "'నిన్న' p",
  today: "'ఈ రోజు' p",
  tomorrow: "'రేపు' p",
  nextWeek: "'తదుపరి' eeee p",
  other: "P",
};

export const formatRelative: FormatRelativeFn = (token, _date, _baseDate, _options) =>
  formatRelativeLocale[token];
