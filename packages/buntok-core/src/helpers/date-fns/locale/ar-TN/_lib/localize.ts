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
  narrow: ["د", "ن", "أ", "س", "أ", "ج", "ج", "م", "أ", "م", "ف", "ج"],
  abbreviated: [
    "جانفي",
    "فيفري",
    "مارس",
    "أفريل",
    "ماي",
    "جوان",
    "جويلية",
    "أوت",
    "سبتمبر",
    "أكتوبر",
    "نوفمبر",
    "ديسمبر",
  ],

  wide: [
    "جانفي",
    "فيفري",
    "مارس",
    "أفريل",
    "ماي",
    "جوان",
    "جويلية",
    "أوت",
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
    pm: "ع",
    morning: "الصباح",
    noon: "القايلة",
    afternoon: "بعد القايلة",
    evening: "العشية",
    night: "الليل",
    midnight: "نص الليل",
  },
  abbreviated: {
    am: "ص",
    pm: "ع",
    morning: "الصباح",
    noon: "القايلة",
    afternoon: "بعد القايلة",
    evening: "العشية",
    night: "الليل",
    midnight: "نص الليل",
  },
  wide: {
    am: "ص",
    pm: "ع",
    morning: "الصباح",
    noon: "القايلة",
    afternoon: "بعد القايلة",
    evening: "العشية",
    night: "الليل",
    midnight: "نص الليل",
  },
} as const;

const formattingDayPeriodValues = {
  narrow: {
    am: "ص",
    pm: "ع",
    morning: "في الصباح",
    noon: "في القايلة",
    afternoon: "بعد القايلة",
    evening: "في العشية",
    night: "في الليل",
    midnight: "نص الليل",
  },
  abbreviated: {
    am: "ص",
    pm: "ع",
    morning: "في الصباح",
    noon: "في القايلة",
    afternoon: "بعد القايلة",
    evening: "في العشية",
    night: "في الليل",
    midnight: "نص الليل",
  },
  wide: {
    am: "ص",
    pm: "ع",
    morning: "في الصباح",
    noon: "في القايلة",
    afternoon: "بعد القايلة",
    evening: "في العشية",
    night: "في الليل",
    midnight: "نص الليل",
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
