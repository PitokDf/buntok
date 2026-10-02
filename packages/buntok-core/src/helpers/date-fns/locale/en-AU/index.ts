import type { Locale } from "../types";
import { formatDistance } from "../en-US/_lib/formatDistance";
import { formatLong } from "./_lib/formatLong";
import { formatRelative } from "../en-US/_lib/formatRelative";
import { localize } from "../en-US/_lib/localize";
import { match } from "../en-US/_lib/match";

export const enAU: Locale = {
  code: "en-AU",
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

export default enAU;
