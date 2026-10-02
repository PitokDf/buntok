import type { Localize, LocalizeFnOptions } from "../../types";
import { buildLocalizeFn } from "../../_lib/build-localize-fn";

const eraValues = {
  narrow: ["aC", "dC"],
  abbreviated: ["a. de C.", "d. de C."],
  wide: ["abans de Crist", "després de Crist"],
} as const;

const quarterValues = {
  narrow: ["1", "2", "3", "4"],
  abbreviated: ["T1", "T2", "T3", "T4"],
  wide: ["1r trimestre", "2n trimestre", "3r trimestre", "4t trimestre"],
} as const;

const monthValues = {
  narrow: [
    "GN",
    "FB",
    "MÇ",
    "AB",
    "MG",
    "JN",
    "JL",
    "AG",
    "ST",
    "OC",
    "NV",
    "DS",
  ],

  
  abbreviated: [
    "gen.",
    "febr.",
    "març",
    "abr.",
    "maig",
    "juny",
    "jul.",
    "ag.",
    "set.",
    "oct.",
    "nov.",
    "des.",
  ],

  wide: [
    "gener",
    "febrer",
    "març",
    "abril",
    "maig",
    "juny",
    "juliol",
    "agost",
    "setembre",
    "octubre",
    "novembre",
    "desembre",
  ],
} as const;

const dayValues = {
  narrow: ["dg.", "dl.", "dt.", "dm.", "dj.", "dv.", "ds."],
  short: ["dg.", "dl.", "dt.", "dm.", "dj.", "dv.", "ds."],
  abbreviated: ["dg.", "dl.", "dt.", "dm.", "dj.", "dv.", "ds."],
  wide: [
    "diumenge",
    "dilluns",
    "dimarts",
    "dimecres",
    "dijous",
    "divendres",
    "dissabte",
  ],
} as const;

const dayPeriodValues = {
  narrow: {
    am: "am",
    pm: "pm",
    midnight: "mitjanit",
    noon: "migdia",
    morning: "matí",
    afternoon: "tarda",
    evening: "vespre",
    night: "nit",
  },
  abbreviated: {
    am: "a.m.",
    pm: "p.m.",
    midnight: "mitjanit",
    noon: "migdia",
    morning: "matí",
    afternoon: "tarda",
    evening: "vespre",
    night: "nit",
  },
  wide: {
    am: "ante meridiem",
    pm: "post meridiem",
    midnight: "mitjanit",
    noon: "migdia",
    morning: "matí",
    afternoon: "tarda",
    evening: "vespre",
    night: "nit",
  },
} as const;

const formattingDayPeriodValues = {
  narrow: {
    am: "am",
    pm: "pm",
    midnight: "de la mitjanit",
    noon: "del migdia",
    morning: "del matí",
    afternoon: "de la tarda",
    evening: "del vespre",
    night: "de la nit",
  },
  abbreviated: {
    am: "AM",
    pm: "PM",
    midnight: "de la mitjanit",
    noon: "del migdia",
    morning: "del matí",
    afternoon: "de la tarda",
    evening: "del vespre",
    night: "de la nit",
  },
  wide: {
    am: "ante meridiem",
    pm: "post meridiem",
    midnight: "de la mitjanit",
    noon: "del migdia",
    morning: "del matí",
    afternoon: "de la tarda",
    evening: "del vespre",
    night: "de la nit",
  },
} as const;

const ordinalNumber = (dirtyNumber: number, _options?: LocalizeFnOptions) => {
  const number = Number(dirtyNumber);
  const rem100 = number % 100;
  if (rem100 > 20 || rem100 < 10) {
    switch (rem100 % 10) {
      case 1:
        return number + "r";
      case 2:
        return number + "n";
      case 3:
        return number + "r";
      case 4:
        return number + "t";
    }
  }
  return number + "è";
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
