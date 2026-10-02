import type { Localize } from "../../types";
import { buildLocalizeFn } from "../../_lib/build-localize-fn";

const eraValues = {
  narrow: ["ق", "ب"],
  abbreviated: ["ق.م.", "ب.م."],
  wide: ["قبل الميلاد", "بعد الميلاد"],
} as const;

const quarterValues = {
  narrow: ["1", "2", "3", "4"],
  abbreviated: ["ر1", "ر2", "ر3", "ر4"],
  wide: ["الربع الأول", "الربع الثاني", "الربع الثالث", "الربع الرابع"],
} as const;

const monthValues = {
  narrow: ["ي", "ف", "م", "أ", "م", "ي", "ي", "أ", "س", "أ", "ن", "د"],
  abbreviated: [
    "يناير",
    "فبراير",
    "مارس",
    "أبريل",
    "مايو",
    "يونيو",
    "يوليو",
    "أغسطس",
    "سبتمبر",
    "أكتوبر",
    "نوفمبر",
    "ديسمبر",
  ],

  wide: [
    "يناير",
    "فبراير",
    "مارس",
    "أبريل",
    "مايو",
    "يونيو",
    "يوليو",
    "أغسطس",
    "سبتمبر",
    "أكتوبر",
    "نوفمبر",
    "ديسمبر",
  ],
} as const;

const dayValues = {
  narrow: ["ح", "ن", "ث", "ر", "خ", "ج", "س"],
  short: ["أحد", "اثنين", "ثلاثاء", "أربعاء", "خميس", "جمعة", "سبت"],
  abbreviated: ["أحد", "اثنين", "ثلاثاء", "أربعاء", "خميس", "جمعة", "سبت"],

  wide: [
    "الأحد",
    "الاثنين",
    "الثلاثاء",
    "الأربعاء",
    "الخميس",
    "الجمعة",
    "السبت",
  ],
} as const;

const dayPeriodValues = {
  narrow: {
    am: "ص",
    pm: "م",
    morning: "الصباح",
    noon: "الظهر",
    afternoon: "بعد الظهر",
    evening: "المساء",
    night: "الليل",
    midnight: "منتصف الليل",
  },
  abbreviated: {
    am: "ص",
    pm: "م",
    morning: "الصباح",
    noon: "الظهر",
    afternoon: "بعد الظهر",
    evening: "المساء",
    night: "الليل",
    midnight: "منتصف الليل",
  },
  wide: {
    am: "ص",
    pm: "م",
    morning: "الصباح",
    noon: "الظهر",
    afternoon: "بعد الظهر",
    evening: "المساء",
    night: "الليل",
    midnight: "منتصف الليل",
  },
} as const;

const formattingDayPeriodValues = {
  narrow: {
    am: "ص",
    pm: "م",
    morning: "في الصباح",
    noon: "الظهر",
    afternoon: "بعد الظهر",
    evening: "في المساء",
    night: "في الليل",
    midnight: "منتصف الليل",
  },
  abbreviated: {
    am: "ص",
    pm: "م",
    morning: "في الصباح",
    noon: "الظهر",
    afternoon: "بعد الظهر",
    evening: "في المساء",
    night: "في الليل",
    midnight: "منتصف الليل",
  },
  wide: {
    am: "ص",
    pm: "م",
    morning: "في الصباح",
    noon: "الظهر",
    afternoon: "بعد الظهر",
    evening: "في المساء",
    night: "في الليل",
    midnight: "منتصف الليل",
  },
} as const;

const ordinalNumber = (num: number) => String(num);

export const localize: Localize = {
  ordinalNumber: ordinalNumber,

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
