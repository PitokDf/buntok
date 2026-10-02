import type { Localize, LocalizeFnOptions } from "../../types";
import { buildLocalizeFn } from "../../_lib/build-localize-fn";

const eraValues = {
  narrow: ["e.ə", "b.e"],
  abbreviated: ["e.ə", "b.e"],
  wide: ["eramızdan əvvəl", "bizim era"],
} as const;

const quarterValues = {
  narrow: ["1", "2", "3", "4"],
  abbreviated: ["K1", "K2", "K3", "K4"],
  wide: ["1ci kvartal", "2ci kvartal", "3cü kvartal", "4cü kvartal"],
} as const;
const monthValues = {
  narrow: ["Y", "F", "M", "A", "M", "İ", "İ", "A", "S", "O", "N", "D"],
  abbreviated: [
    "Yan",
    "Fev",
    "Mar",
    "Apr",
    "May",
    "İyun",
    "İyul",
    "Avq",
    "Sen",
    "Okt",
    "Noy",
    "Dek",
  ],

  wide: [
    "Yanvar",
    "Fevral",
    "Mart",
    "Aprel",
    "May",
    "İyun",
    "İyul",
    "Avqust",
    "Sentyabr",
    "Oktyabr",
    "Noyabr",
    "Dekabr",
  ],
} as const;

const dayValues = {
  narrow: ["B.", "B.e", "Ç.a", "Ç.", "C.a", "C.", "Ş."],
  short: ["B.", "B.e", "Ç.a", "Ç.", "C.a", "C.", "Ş."],
  abbreviated: ["Baz", "Baz.e", "Çər.a", "Çər", "Cüm.a", "Cüm", "Şə"],
  wide: [
    "Bazar",
    "Bazar ertəsi",
    "Çərşənbə axşamı",
    "Çərşənbə",
    "Cümə axşamı",
    "Cümə",
    "Şənbə",
  ],
} as const;

const dayPeriodValues = {
  narrow: {
    am: "am",
    pm: "pm",
    midnight: "gecəyarı",
    noon: "gün",
    morning: "səhər",
    afternoon: "gündüz",
    evening: "axşam",
    night: "gecə",
  },
  abbreviated: {
    am: "AM",
    pm: "PM",
    midnight: "gecəyarı",
    noon: "gün",
    morning: "səhər",
    afternoon: "gündüz",
    evening: "axşam",
    night: "gecə",
  },
  wide: {
    am: "a.m.",
    pm: "p.m.",
    midnight: "gecəyarı",
    noon: "gün",
    morning: "səhər",
    afternoon: "gündüz",
    evening: "axşam",
    night: "gecə",
  },
} as const;

const formattingDayPeriodValues = {
  narrow: {
    am: "a",
    pm: "p",
    midnight: "gecəyarı",
    noon: "gün",
    morning: "səhər",
    afternoon: "gündüz",
    evening: "axşam",
    night: "gecə",
  },
  abbreviated: {
    am: "AM",
    pm: "PM",
    midnight: "gecəyarı",
    noon: "gün",
    morning: "səhər",
    afternoon: "gündüz",
    evening: "axşam",
    night: "gecə",
  },
  wide: {
    am: "a.m.",
    pm: "p.m.",
    midnight: "gecəyarı",
    noon: "gün",
    morning: "səhər",
    afternoon: "gündüz",
    evening: "axşam",
    night: "gecə",
  },
} as const;

const suffixes = {
  1: "-inci",
  5: "-inci",
  8: "-inci",
  70: "-inci",
  80: "-inci",
  2: "-nci",
  7: "-nci",
  20: "-nci",
  50: "-nci",
  3: "-üncü",
  4: "-üncü",
  100: "-üncü",
  6: "-ncı",
  9: "-uncu",
  10: "-uncu",
  30: "-uncu",
  60: "-ıncı",
  90: "-ıncı",
};

const getSuffix = (number: number) => {
  if (number === 0) {

    return number + "-ıncı";
  }

  const a = number % 10;
  const b = (number % 100) - a;
  const c = number >= 100 ? 100 : null;

  if (suffixes[a as keyof typeof suffixes]) {
    return suffixes[a as keyof typeof suffixes];
  } else if (suffixes[b as keyof typeof suffixes]) {
    return suffixes[b as keyof typeof suffixes];
  } else if (c !== null) {
    return suffixes[c as keyof typeof suffixes];
  }
  return "";
};

const ordinalNumber = (dirtyNumber: number, _options?: LocalizeFnOptions) => {
  const number = Number(dirtyNumber);
  const suffix = getSuffix(number);

  return number + suffix;
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
