import type { Locale } from "../types";

import { formatDistance } from "../fr/_lib/formatDistance";
import { formatRelative } from "../fr/_lib/formatRelative";
import { localize } from "../fr/_lib/localize";
import { match } from "../fr/_lib/match";

import { formatLong } from "./_lib/formatLong";

export const frCA: Locale = {
  code: "fr-CA",
  formatDistance: formatDistance,
  formatLong: formatLong,
  formatRelative: formatRelative,
  localize: localize,
  match: match,

  options: {
    weekStartsOn: 0 ,
    firstWeekContainsDate: 1,
  },
};

export default frCA;
