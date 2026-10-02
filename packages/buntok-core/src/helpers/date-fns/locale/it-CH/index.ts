import type { Locale } from "../types";
import { formatDistance } from "../it/_lib/formatDistance";
import { formatRelative } from "../it/_lib/formatRelative";
import { localize } from "../it/_lib/localize";
import { match } from "../it/_lib/match";
import { formatLong } from "./_lib/formatLong";

export const itCH: Locale = {
  code: "it-CH",
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

export default itCH;
