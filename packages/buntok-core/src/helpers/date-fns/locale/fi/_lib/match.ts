import type { Quarter } from "../../../_lib/types";
import type { Match } from "../../types";
import { buildMatchFn } from "../../_lib/build-match-fn";
import { buildMatchPatternFn } from "../../_lib/build-match-pattern-fn";

const matchOrdinalNumberPattern = /^(\d+)(\.)/i;
const parseOrdinalNumberPattern = /\d+/i;

const matchEraPatterns = {
  narrow: /^(e|j)/i,
  abbreviated: /^(eaa.|jaa.)/i,
  wide: /^(ennen ajanlaskun alkua|jälkeen ajanlaskun alun)/i,
} as const;
const parseEraPatterns = {
  any: [/^e/i, /^j/i],
} as const;

const matchQuarterPatterns = {
  narrow: /^[1234]/i,
  abbreviated: /^q[1234]/i,
  wide: /^[1234]\.? kvartaali/i,
} as const;
const parseQuarterPatterns = {
  any: [/1/i, /2/i, /3/i, /4/i],
} as const;

const matchMonthPatterns = {
  narrow: /^[thmkeslj]/i,
  abbreviated:
    /^(tammi|helmi|maalis|huhti|touko|kesä|heinä|elo|syys|loka|marras|joulu)/i,
  wide: /^(tammikuu|helmikuu|maaliskuu|huhtikuu|toukokuu|kesäkuu|heinäkuu|elokuu|syyskuu|lokakuu|marraskuu|joulukuu)(ta)?/i,
} as const;
const parseMonthPatterns = {
  narrow: [
    /^t/i,
    /^h/i,
    /^m/i,
    /^h/i,
    /^t/i,
    /^k/i,
    /^h/i,
    /^e/i,
    /^s/i,
    /^l/i,
    /^m/i,
    /^j/i,
  ],

  any: [
    /^ta/i,
    /^hel/i,
    /^maa/i,
    /^hu/i,
    /^to/i,
    /^k/i,
    /^hei/i,
    /^e/i,
    /^s/i,
    /^l/i,
    /^mar/i,
    /^j/i,
  ],
} as const;

const matchDayPatterns = {
  narrow: /^[smtkpl]/i,
  short: /^(su|ma|ti|ke|to|pe|la)/i,
  abbreviated: /^(sunn.|maan.|tiis.|kesk.|torst.|perj.|la)/i,
  wide: /^(sunnuntai|maanantai|tiistai|keskiviikko|torstai|perjantai|lauantai)(na)?/i,
} as const;
const parseDayPatterns = {
  narrow: [/^s/i, /^m/i, /^t/i, /^k/i, /^t/i, /^p/i, /^l/i],
  any: [/^s/i, /^m/i, /^ti/i, /^k/i, /^to/i, /^p/i, /^l/i],
} as const;

const matchDayPeriodPatterns = {
  narrow:
    /^(ap|ip|keskiyö|keskipäivä|aamupäivällä|iltapäivällä|illalla|yöllä)/i,
  any: /^(ap|ip|keskiyöllä|keskipäivällä|aamupäivällä|iltapäivällä|illalla|yöllä)/i,
} as const;
const parseDayPeriodPatterns = {
  any: {
    am: /^ap/i,
    pm: /^ip/i,
    midnight: /^keskiyö/i,
    noon: /^keskipäivä/i,
    morning: /aamupäivällä/i,
    afternoon: /iltapäivällä/i,
    evening: /illalla/i,
    night: /yöllä/i,
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
