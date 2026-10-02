import type { Locale } from "../types";
import { formatDistance } from "../de/_lib/formatDistance";
import { formatLong } from "../de/_lib/formatLong";
import { formatRelative } from "../de/_lib/formatRelative";
import { match } from "../de/_lib/match";

import { localize } from "./_lib/localize";

export const deAT: Locale = {
  code: "de-AT",
  formatDistance: formatDistance,
  formatLong: formatLong,
  formatRelative: formatRelative,
  localize: localize,
  match: match,
  options: {
    weekStartsOn: 1 ,
    firstWeekContainsDate: 4,
  },
};

export default deAT;
