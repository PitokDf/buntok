import type { Locale } from "../types";
import { formatRelative } from "../en-US/_lib/formatRelative";
import { localize } from "../en-US/_lib/localize";
import { match } from "../en-US/_lib/match";

import { formatDistance } from "./_lib/formatDistance";
import { formatLong } from "./_lib/formatLong";

export const enCA: Locale = {
  code: "en-CA",
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

export default enCA;
