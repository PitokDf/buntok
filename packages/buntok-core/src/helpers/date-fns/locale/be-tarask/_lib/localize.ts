import type { Localize, LocalizeFnOptions } from "../../types";
import { buildLocalizeFn } from "../../_lib/build-localize-fn";

const eraValues = {
  narrow: ["да н.э.", "н.э."],
  abbreviated: ["да н. э.", "н. э."],
  wide: ["да нашай эры", "нашай эры"],
} as const;

const quarterValues = {
  narrow: ["1", "2", "3", "4"],
  abbreviated: ["1-ы кв.", "2-і кв.", "3-і кв.", "4-ы кв."],
  wide: ["1-ы квартал", "2-і квартал", "3-і квартал", "4-ы квартал"],
} as const;

const monthValues = {
  narrow: ["С", "Л", "С", "К", "Т", "Ч", "Л", "Ж", "В", "К", "Л", "С"],
  abbreviated: [
    "студз.",
    "лют.",
    "сак.",
    "крас.",
    "трав.",
    "чэрв.",
    "ліп.",
    "жн.",
    "вер.",
    "кастр.",
    "ліст.",
    "сьнеж.",
  ],

  wide: [
    "студзень",
    "люты",
    "сакавік",
    "красавік",
    "травень",
    "чэрвень",
    "ліпень",
    "жнівень",
    "верасень",
    "кастрычнік",
    "лістапад",
    "сьнежань",
  ],
} as const;
const formattingMonthValues = {
  narrow: ["С", "Л", "С", "К", "Т", "Ч", "Л", "Ж", "В", "К", "Л", "С"],
  abbreviated: [
    "студз.",
    "лют.",
    "сак.",
    "крас.",
    "трав.",
    "чэрв.",
    "ліп.",
    "жн.",
    "вер.",
    "кастр.",
    "ліст.",
    "сьнеж.",
  ],

  wide: [
    "студзеня",
    "лютага",
    "сакавіка",
    "красавіка",
    "траўня",
    "чэрвеня",
    "ліпеня",
    "жніўня",
    "верасня",
    "кастрычніка",
    "лістапада",
    "сьнежня",
  ],
} as const;

const dayValues = {
  narrow: ["Н", "П", "А", "С", "Ч", "П", "С"],
  short: ["нд", "пн", "аў", "ср", "чц", "пт", "сб"],
  abbreviated: ["нядз", "пан", "аўт", "сер", "чаць", "пят", "суб"],
  wide: [
    "нядзеля",
    "панядзелак",
    "аўторак",
    "серада",
    "чацьвер",
    "пятніца",
    "субота",
  ],
} as const;

const dayPeriodValues = {
  narrow: {
    am: "ДП",
    pm: "ПП",
    midnight: "поўн.",
    noon: "поўд.",
    morning: "ран.",
    afternoon: "дзень",
    evening: "веч.",
    night: "ноч",
  },
  abbreviated: {
    am: "ДП",
    pm: "ПП",
    midnight: "поўн.",
    noon: "поўд.",
    morning: "ран.",
    afternoon: "дзень",
    evening: "веч.",
    night: "ноч",
  },
  wide: {
    am: "ДП",
    pm: "ПП",
    midnight: "поўнач",
    noon: "поўдзень",
    morning: "раніца",
    afternoon: "дзень",
    evening: "вечар",
    night: "ноч",
  },
} as const;
const formattingDayPeriodValues = {
  narrow: {
    am: "ДП",
    pm: "ПП",
    midnight: "поўн.",
    noon: "поўд.",
    morning: "ран.",
    afternoon: "дня",
    evening: "веч.",
    night: "ночы",
  },
  abbreviated: {
    am: "ДП",
    pm: "ПП",
    midnight: "поўн.",
    noon: "поўд.",
    morning: "ран.",
    afternoon: "дня",
    evening: "веч.",
    night: "ночы",
  },
  wide: {
    am: "ДП",
    pm: "ПП",
    midnight: "поўнач",
    noon: "поўдзень",
    morning: "раніцы",
    afternoon: "дня",
    evening: "вечара",
    night: "ночы",
  },
} as const;

const ordinalNumber = (dirtyNumber: number, options?: LocalizeFnOptions) => {
  const unit = String(options?.unit);
  const number = Number(dirtyNumber);
  let suffix;

  
  if (unit === "date") {
    suffix = "-га";
  } else if (unit === "hour" || unit === "minute" || unit === "second") {
    suffix = "-я";
  } else {
    suffix =
      (number % 10 === 2 || number % 10 === 3) &&
      number % 100 !== 12 &&
      number % 100 !== 13
        ? "-і"
        : "-ы";
  }

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
    formattingValues: formattingMonthValues,
    defaultFormattingWidth: "wide",
  }),

  day: buildLocalizeFn({
    values: dayValues,
    defaultWidth: "wide",
  }),

  dayPeriod: buildLocalizeFn({
    values: dayPeriodValues,
    defaultWidth: "any",
    formattingValues: formattingDayPeriodValues,
    defaultFormattingWidth: "wide",
  }),
};
