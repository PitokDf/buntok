import type { Locale } from "../types";
import { formatDistance } from "./_lib/formatDistance";
import { formatLong } from "./_lib/formatLong";
import { formatRelative } from "./_lib/formatRelative";
import { localize } from "./_lib/localize";
import { match } from "./_lib/match";

export const arTN: Locale = {
  code: "ar-TN",
  formatDistance: formatDistance,
  formatLong: formatLong,
  formatRelative: formatRelative,
  localize: localize,
  match: match,
  options: {
    weekStartsOn: 1 ,
    firstWeekContainsDate: 1,
  },
};

export default arTN;
