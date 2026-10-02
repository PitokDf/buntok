import type { Quarter } from "../../../_lib/types";
import type { Match } from "../../types";
import { buildMatchFn } from "../../_lib/build-match-fn";
import { buildMatchPatternFn } from "../../_lib/build-match-pattern-fn";

const matchOrdinalNumberPattern = /^(\d+)e?/i;
const parseOrdinalNumberPattern = /\d+/i;

const matchEraPatterns = {
  narrow: /^([vn]\.? ?C\.?)/,
  abbreviated: /^([vn]\. ?Chr\.?)/,
  wide: /^((voor|na) Christus)/,
} as const;
const parseEraPatterns = {
  any: [/^v/, /^n/],
} as const;

const matchQuarterPatterns = {
  narrow: /^[1234]/i,
  abbreviated: /^K[1234]/i,
  wide: /^[1234]e kwartaal/i,
} as const;
const parseQuarterPatterns = {
  any: [/1/i, /2/i, /3/i, /4/i],
} as const;

const matchMonthPatterns = {
  narrow: /^[jfmasond]/i,
  abbreviated: /^(jan.|feb.|mrt.|apr.|mei|jun.|jul.|aug.|sep.|okt.|nov.|dec.)/i,
  wide: /^(januari|februari|maart|april|mei|juni|juli|augustus|september|oktober|november|december)/i,
} as const;
const parseMonthPatterns = {
  narrow: [
    /^j/i,
    /^f/i,
    /^m/i,
    /^a/i,
    /^m/i,
    /^j/i,
    /^j/i,
    /^a/i,
    /^s/i,
    /^o/i,
    /^n/i,
    /^d/i,
  ],

  any: [
    /^jan/i,
    /^feb/i,
    /^m(r|a)/i,
    /^apr/i,
    /^mei/i,
    /^jun/i,
    /^jul/i,
    /^aug/i,
    /^sep/i,
    /^okt/i,
    /^nov/i,
    /^dec/i,
  ],
} as const;

const matchDayPatterns = {
  narrow: /^[zmdwv]/i,
  short: /^(zo|ma|di|wo|do|vr|za)/i,
  abbreviated: /^(zon|maa|din|woe|don|vri|zat)/i,
  wide: /^(zondag|maandag|dinsdag|woensdag|donderdag|vrijdag|zaterdag)/i,
} as const;
const parseDayPatterns = {
  narrow: [/^z/i, /^m/i, /^d/i, /^w/i, /^d/i, /^v/i, /^z/i],
  any: [/^zo/i, /^ma/i, /^di/i, /^wo/i, /^do/i, /^vr/i, /^za/i],
} as const;

const matchDayPeriodPatterns = {
  any: /^(am|pm|middernacht|het middaguur|'s (ochtends|middags|avonds|nachts))/i,
} as const;
const parseDayPeriodPatterns = {
  any: {
    am: /^am/i,
    pm: /^pm/i,
    midnight: /^middernacht/i,
    noon: /^het middaguur/i,
    morning: /ochtend/i,
    afternoon: /middag/i,
    evening: /avond/i,
    night: /nacht/i,
  },
} as const;

export const match: Match = {
  ordinalNumber: buildMatchPatternFn({
    matchPattern: matchOrdinalNumberPattern,
    parsePattern: parseOrdinalNumberPattern,
    valueCallback: (value) => parseInt(value, 10),
  }),

  era: buildMatchFn({
    matchPatterns: matchEraPatterns,
    defaultMatchWidth: "wide",
    parsePatterns: parseEraPatterns,
    defaultParseWidth: "any",
  }),

  quarter: buildMatchFn({
    matchPatterns: matchQuarterPatterns,
    defaultMatchWidth: "wide",
    parsePatterns: parseQuarterPatterns,
    defaultParseWidth: "any",
    valueCallback: (index) => (index + 1) as Quarter,
  }),

  month: buildMatchFn({
    matchPatterns: matchMonthPatterns,
    defaultMatchWidth: "wide",
    parsePatterns: parseMonthPatterns,
    defaultParseWidth: "any",
  }),

  day: buildMatchFn({
    matchPatterns: matchDayPatterns,
    defaultMatchWidth: "wide",
    parsePatterns: parseDayPatterns,
    defaultParseWidth: "any",
  }),

  dayPeriod: buildMatchFn({
    matchPatterns: matchDayPeriodPatterns,
    defaultMatchWidth: "any",
    parsePatterns: parseDayPeriodPatterns,
    defaultParseWidth: "any",
  }),
};
