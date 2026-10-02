import type { Localize, LocalizeFnOptions } from "../../types";
import { buildLocalizeFn } from "../../_lib/build-localize-fn";

const eraValues = {
  narrow: ["М.А", "М"],
  abbreviated: ["М.А", "М"],
  wide: ["Милоддан Аввалги", "Милодий"],
} as const;

const quarterValues = {
  narrow: ["1", "2", "3", "4"],
  abbreviated: ["1-чор.", "2-чор.", "3-чор.", "4-чор."],
  wide: ["1-чорак", "2-чорак", "3-чорак", "4-чорак"],
} as const;

const monthValues = {
  narrow: ["Я", "Ф", "М", "А", "М", "И", "И", "А", "С", "О", "Н", "Д"],
  abbreviated: [
    "янв",
    "фев",
    "мар",
    "апр",
    "май",
    "июн",
    "июл",
    "авг",
    "сен",
    "окт",
    "ноя",
    "дек",
  ],

  wide: [
    "январ",
    "феврал",
    "март",
    "апрел",
    "май",
    "июн",
    "июл",
    "август",
    "сентабр",
    "октабр",
    "ноябр",
    "декабр",
  ],
} as const;

const dayValues = {
  narrow: ["Я", "Д", "С", "Ч", "П", "Ж", "Ш"],
  short: ["як", "ду", "се", "чо", "па", "жу", "ша"],
  abbreviated: ["якш", "душ", "сеш", "чор", "пай", "жум", "шан"],
  wide: [
    "якшанба",
    "душанба",
    "сешанба",
    "чоршанба",
    "пайшанба",
    "жума",
    "шанба",
  ],
} as const;

const dayPeriodValues = {
  any: {
    am: "П.О.",
    pm: "П.К.",
    midnight: "ярим тун",
    noon: "пешин",
    morning: "эрталаб",
    afternoon: "пешиндан кейин",
    evening: "кечаси",
    night: "тун",
  },
} as const;

const formattingDayPeriodValues = {
  any: {
    am: "П.О.",
    pm: "П.К.",
    midnight: "ярим тун",
    noon: "пешин",
    morning: "эрталаб",
    afternoon: "пешиндан кейин",
    evening: "кечаси",
    night: "тун",
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
    defaultWidth: "any",
    formattingValues: formattingDayPeriodValues,
    defaultFormattingWidth: "any",
  }),
};
