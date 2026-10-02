import type { Localize, LocalizeFnOptions } from "../../types";
import { buildLocalizeFn } from "../../_lib/build-localize-fn";

const eraValues = {
  narrow: ["o.Kr.", "m.Kr."],
  abbreviated: ["o.Kr.", "m.Kr."],
  wide: ["ovdal Kristusa", "maŋŋel Kristusa"],
} as const;

const quarterValues = {
  narrow: ["1", "2", "3", "4"],
  abbreviated: ["Q1", "Q2", "Q3", "Q4"],
  wide: ["1. kvartála", "2. kvartála", "3. kvartála", "4. kvartála"],
} as const;

const monthValues = {
  narrow: ["O", "G", "N", "C", "M", "G", "S", "B", "Č", "G", "S", "J"],
  abbreviated: [
    "ođđa",
    "guov",
    "njuk",
    "cuo",
    "mies",
    "geas",
    "suoi",
    "borg",
    "čakč",
    "golg",
    "skáb",
    "juov",
  ],

  wide: [
    "ođđajagemánnu",
    "guovvamánnu",
    "njukčamánnu",
    "cuoŋománnu",
    "miessemánnu",
    "geassemánnu",
    "suoidnemánnu",
    "borgemánnu",
    "čakčamánnu",
    "golggotmánnu",
    "skábmamánnu",
    "juovlamánnu",
  ],
} as const;

const dayValues = {
  narrow: ["S", "V", "M", "G", "D", "B", "L"],
  short: ["sotn", "vuos", "maŋ", "gask", "duor", "bear", "láv"],
  abbreviated: ["sotn", "vuos", "maŋ", "gask", "duor", "bear", "láv"],
  wide: [
    "sotnabeaivi",
    "vuossárga",
    "maŋŋebárga",
    "gaskavahkku",
    "duorastat",
    "bearjadat",
    "lávvardat",
  ],
} as const;

const dayPeriodValues = {
  narrow: {
    am: "a",
    pm: "p",
    midnight: "gaskaidja",
    noon: "gaskabeaivi",
    morning: "iđđes",
    afternoon: "maŋŋel gaska.",
    evening: "eahkes",
    night: "ihkku",
  },
  abbreviated: {
    am: "a.m.",
    pm: "p.m.",
    midnight: "gaskaidja",
    noon: "gaskabeaivvi",
    morning: "iđđes",
    afternoon: "maŋŋel gaskabea.",
    evening: "eahkes",
    night: "ihkku",
  },
  wide: {
    am: "a.m.",
    pm: "p.m.",
    midnight: "gaskaidja",
    noon: "gaskabeavvi",
    morning: "iđđes",
    afternoon: "maŋŋel gaskabeaivvi",
    evening: "eahkes",
    night: "ihkku",
  },
} as const;

const ordinalNumber = (dirtyNumber: number, _options?: LocalizeFnOptions) => {
  const number = Number(dirtyNumber);
  return number + ".";
};

export const localize = {
  ordinalNumber,

  era: buildLocalizeFn({
    values: eraValues,
    defaultWidth: "wide",
  }),

  quarter: buildLocalizeFn({
    values: quarterValues,
    defaultWidth: "wide",
    argumentCallback: (quarter) => (quarter as number) - 1,
  }),

  month: buildLocalizeFn({
    values: monthValues,
    defaultWidth: "wide",
  }),

  day: buildLocalizeFn({
    values: dayValues,
    defaultWidth: "wide",
  }),

  dayPeriod: buildLocalizeFn({
    values: dayPeriodValues,
    defaultWidth: "wide",
  }),
};
