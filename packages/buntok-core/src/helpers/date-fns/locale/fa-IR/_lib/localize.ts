import type { Localize, LocalizeFnOptions } from "../../types";
import { buildLocalizeFn } from "../../_lib/build-localize-fn";

const eraValues = {
  narrow: ["ق", "ب"],
  abbreviated: ["ق.م.", "ب.م."],
  wide: ["قبل از میلاد", "بعد از میلاد"],
} as const;

const quarterValues = {
  narrow: ["1", "2", "3", "4"],
  abbreviated: ["س‌م1", "س‌م2", "س‌م3", "س‌م4"],
  wide: ["سه‌ماهه 1", "سه‌ماهه 2", "سه‌ماهه 3", "سه‌ماهه 4"],
} as const;

const monthValues = {
  narrow: ["ژ", "ف", "م", "آ", "م", "ج", "ج", "آ", "س", "ا", "ن", "د"],
  abbreviated: [
    "ژانـ",
    "فور",
    "مارس",
    "آپر",
    "می",
    "جون",
    "جولـ",
    "آگو",
    "سپتـ",
    "اکتـ",
    "نوامـ",
    "دسامـ",
  ],

  wide: [
    "ژانویه",
    "فوریه",
    "مارس",
    "آپریل",
    "می",
    "جون",
    "جولای",
    "آگوست",
    "سپتامبر",
    "اکتبر",
    "نوامبر",
    "دسامبر",
  ],
} as const;

const dayValues = {
  narrow: ["ی", "د", "س", "چ", "پ", "ج", "ش"],
  short: ["1ش", "2ش", "3ش", "4ش", "5ش", "ج", "ش"],
  abbreviated: [
    "یکشنبه",
    "دوشنبه",
    "سه‌شنبه",
    "چهارشنبه",
    "پنجشنبه",
    "جمعه",
    "شنبه",
  ],

  wide: ["یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه", "شنبه"],
} as const;

const dayPeriodValues = {
  narrow: {
    am: "ق",
    pm: "ب",
    midnight: "ن",
    noon: "ظ",
    morning: "ص",
    afternoon: "ب.ظ.",
    evening: "ع",
    night: "ش",
  },
  abbreviated: {
    am: "ق.ظ.",
    pm: "ب.ظ.",
    midnight: "نیمه‌شب",
    noon: "ظهر",
    morning: "صبح",
    afternoon: "بعدازظهر",
    evening: "عصر",
    night: "شب",
  },
  wide: {
    am: "قبل‌ازظهر",
    pm: "بعدازظهر",
    midnight: "نیمه‌شب",
    noon: "ظهر",
    morning: "صبح",
    afternoon: "بعدازظهر",
    evening: "عصر",
    night: "شب",
  },
} as const;

const formattingDayPeriodValues = {
  narrow: {
    am: "ق",
    pm: "ب",
    midnight: "ن",
    noon: "ظ",
    morning: "ص",
    afternoon: "ب.ظ.",
    evening: "ع",
    night: "ش",
  },
  abbreviated: {
    am: "ق.ظ.",
    pm: "ب.ظ.",
    midnight: "نیمه‌شب",
    noon: "ظهر",
    morning: "صبح",
    afternoon: "بعدازظهر",
    evening: "عصر",
    night: "شب",
  },
  wide: {
    am: "قبل‌ازظهر",
    pm: "بعدازظهر",
    midnight: "نیمه‌شب",
    noon: "ظهر",
    morning: "صبح",
    afternoon: "بعدازظهر",
    evening: "عصر",
    night: "شب",
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
