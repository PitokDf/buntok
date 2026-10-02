import type { Locale } from "../types";
import { formatDistance } from "./_lib/formatDistance";
import { formatLong } from "./_lib/formatLong";
import { formatRelative } from "./_lib/formatRelative";
import { localize } from "./_lib/localize";
import { match } from "./_lib/match";

export const ckb: Locale = {
  code: "ckb",
  formatDistance,
  formatLong,
  formatRelative,
  localize,
  match,
  options: {
    weekStartsOn: 0 ,
    firstWeekContainsDate: 1,
  },
};

export default ckb;
