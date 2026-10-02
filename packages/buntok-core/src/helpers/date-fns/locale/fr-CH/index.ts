import type { Locale } from "../types";

import { formatDistance } from "../fr/_lib/formatDistance";
import { localize } from "../fr/_lib/localize";
import { match } from "../fr/_lib/match";

import { formatLong } from "./_lib/formatLong";
import { formatRelative } from "./_lib/formatRelative";

export const frCH: Locale = {
  code: "fr-CH",
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

export default frCH;
