import type { Localize, LocalizeFnOptions } from "../../types";
import { buildLocalizeFn } from "../../_lib/build-localize-fn";

const eraValues = {
  narrow: ["ab. J.C.", "apr. J.C."],
  abbreviated: ["ab. J.C.", "apr. J.C."],
  wide: ["abans Jèsus-Crist", "après Jèsus-Crist"],
} as const;

const quarterValues = {
  narrow: ["T1", "T2", "T3", "T4"],
  abbreviated: ["1èr trim.", "2nd trim.", "3en trim.", "4en trim."],
  wide: ["1èr trimèstre", "2nd trimèstre", "3en trimèstre", "4en trimèstre"],
} as const;

const monthValues = {
  narrow: [
    "GN",
    "FB",
    "MÇ",
    "AB",
    "MA",
    "JN",
    "JL",
    "AG",
    "ST",
    "OC",
    "NV",
    "DC",
  ],

  abbreviated: [
    "gen.",
    "febr.",
    "març",
    "abr.",
    "mai",
    "junh",
    "jul.",
    "ag.",
    "set.",
    "oct.",
    "nov.",
    "dec.",
  ],

  wide: [
    "genièr",
    "febrièr",
    "març",
    "abril",
    "mai",
    "junh",
    "julhet",
    "agost",
    "setembre",
    "octòbre",
    "novembre",
    "decembre",
  ],
} as const;

const dayValues = {
  narrow: ["dg.", "dl.", "dm.", "dc.", "dj.", "dv.", "ds."],
  short: ["dg.", "dl.", "dm.", "dc.", "dj.", "dv.", "ds."],
  abbreviated: ["dg.", "dl.", "dm.", "dc.", "dj.", "dv.", "ds."],
  wide: [
    "dimenge",
    "diluns",
    "dimars",
    "dimècres",
    "dijòus",
    "divendres",
    "dissabte",
  ],
} as const;

const dayPeriodValues = {
  narrow: {
    am: "am",
    pm: "pm",
    midnight: "mièjanuèch",
    noon: "miègjorn",
    morning: "matin",
    afternoon: "aprèp-miègjorn",
    evening: "vèspre",
    night: "nuèch",
  },
  abbreviated: {
    am: "a.m.",
    pm: "p.m.",
    midnight: "mièjanuèch",
    noon: "miègjorn",
    morning: "matin",
    afternoon: "aprèp-miègjorn",
    evening: "vèspre",
    night: "nuèch",
  },
  wide: {
    am: "a.m.",
    pm: "p.m.",
    midnight: "mièjanuèch",
    noon: "miègjorn",
    morning: "matin",
    afternoon: "aprèp-miègjorn",
    evening: "vèspre",
    night: "nuèch",
  },
} as const;

const formattingDayPeriodValues = {
  narrow: {
    am: "am",
    pm: "pm",
    midnight: "mièjanuèch",
    noon: "miègjorn",
    morning: "del matin",
    afternoon: "de l’aprèp-miègjorn",
    evening: "del ser",
    night: "de la nuèch",
  },
  abbreviated: {
    am: "AM",
    pm: "PM",
    midnight: "mièjanuèch",
    noon: "miègjorn",
    morning: "del matin",
    afternoon: "de l’aprèp-miègjorn",
    evening: "del ser",
    night: "de la nuèch",
  },
  wide: {
    am: "ante meridiem",
    pm: "post meridiem",
    midnight: "mièjanuèch",
    noon: "miègjorn",
    morning: "del matin",
    afternoon: "de l’aprèp-miègjorn",
    evening: "del ser",
    night: "de la nuèch",
  },
} as const;

const ordinalNumber = (dirtyNumber: number, options?: LocalizeFnOptions) => {
  const number = Number(dirtyNumber);
  const unit = options?.unit;
  let ordinal;

  switch (number) {
    case 1:
      ordinal = "èr";
      break;
    case 2:
      ordinal = "nd";
      break;
    default:
      ordinal = "en";
  }

  if (
    unit === "year" ||
    unit === "week" ||
    unit === "hour" ||
    unit === "minute" ||
    unit === "second"
  ) {
    ordinal += "a";
  }

  return number + ordinal;
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
    formattingValues: formattingDayPeriodValues,
    defaultFormattingWidth: "wide",
  }),
};
