import type { Localize, LocalizeFnOptions } from "../../types";
import { buildLocalizeFn } from "../../_lib/build-localize-fn";

const eraValues = {
  narrow: ["ب", "ك"],
  abbreviated: ["ب", "ك"],
  wide: ["مىيلادىدىن بۇرۇن", "مىيلادىدىن كىيىن"],
} as const;

const quarterValues = {
  narrow: ["1", "2", "3", "4"],
  abbreviated: ["1", "2", "3", "4"],
  wide: ["بىرىنجى چارەك", "ئىككىنجى چارەك", "ئۈچىنجى چارەك", "تۆتىنجى چارەك"],
} as const;

const monthValues = {
  narrow: ["ي", "ف", "م", "ا", "م", "ى", "ى", "ا", "س", "ۆ", "ن", "د"],
  abbreviated: [
    "يانۋار",
    "فېۋىرال",
    "مارت",
    "ئاپرىل",
    "ماي",
    "ئىيۇن",
    "ئىيول",
    "ئاۋغۇست",
    "سىنتەبىر",
    "ئۆكتەبىر",
    "نويابىر",
    "دىكابىر",
  ],

  wide: [
    "يانۋار",
    "فېۋىرال",
    "مارت",
    "ئاپرىل",
    "ماي",
    "ئىيۇن",
    "ئىيول",
    "ئاۋغۇست",
    "سىنتەبىر",
    "ئۆكتەبىر",
    "نويابىر",
    "دىكابىر",
  ],
} as const;

const dayValues = {
  narrow: ["ي", "د", "س", "چ", "پ", "ج", "ش"],
  short: ["ي", "د", "س", "چ", "پ", "ج", "ش"],
  abbreviated: [
    "يەكشەنبە",
    "دۈشەنبە",
    "سەيشەنبە",
    "چارشەنبە",
    "پەيشەنبە",
    "جۈمە",
    "شەنبە",
  ],

  wide: [
    "يەكشەنبە",
    "دۈشەنبە",
    "سەيشەنبە",
    "چارشەنبە",
    "پەيشەنبە",
    "جۈمە",
    "شەنبە",
  ],
} as const;

const dayPeriodValues = {
  narrow: {
    am: "ئە",
    pm: "چ",
    midnight: "ك",
    noon: "چ",
    morning: "ئەتىگەن",
    afternoon: "چۈشتىن كىيىن",
    evening: "ئاخشىم",
    night: "كىچە",
  },
  abbreviated: {
    am: "ئە",
    pm: "چ",
    midnight: "ك",
    noon: "چ",
    morning: "ئەتىگەن",
    afternoon: "چۈشتىن كىيىن",
    evening: "ئاخشىم",
    night: "كىچە",
  },
  wide: {
    am: "ئە",
    pm: "چ",
    midnight: "ك",
    noon: "چ",
    morning: "ئەتىگەن",
    afternoon: "چۈشتىن كىيىن",
    evening: "ئاخشىم",
    night: "كىچە",
  },
} as const;

const formattingDayPeriodValues = {
  narrow: {
    am: "ئە",
    pm: "چ",
    midnight: "ك",
    noon: "چ",
    morning: "ئەتىگەندە",
    afternoon: "چۈشتىن كىيىن",
    evening: "ئاخشامدا",
    night: "كىچىدە",
  },
  abbreviated: {
    am: "ئە",
    pm: "چ",
    midnight: "ك",
    noon: "چ",
    morning: "ئەتىگەندە",
    afternoon: "چۈشتىن كىيىن",
    evening: "ئاخشامدا",
    night: "كىچىدە",
  },
  wide: {
    am: "ئە",
    pm: "چ",
    midnight: "ك",
    noon: "چ",
    morning: "ئەتىگەندە",
    afternoon: "چۈشتىن كىيىن",
    evening: "ئاخشامدا",
    night: "كىچىدە",
  },
} as const;

const ordinalNumber = (dirtyNumber: number, _options?: LocalizeFnOptions) => {
  return String(dirtyNumber);
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
