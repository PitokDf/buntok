import type { Localize, LocalizeFnOptions } from "../../types";
import { buildLocalizeFn } from "../../_lib/build-localize-fn";

const eraValues = {
  narrow: ["BC", "AC"],
  abbreviated: ["きげんぜん", "せいれき"],
  wide: ["きげんぜん", "せいれき"],
} as const;

const quarterValues = {
  narrow: ["1", "2", "3", "4"],
  abbreviated: ["Q1", "Q2", "Q3", "Q4"],
  wide: ["だい1しはんき", "だい2しはんき", "だい3しはんき", "だい4しはんき"],
} as const;

const monthValues = {
  narrow: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"],

  abbreviated: [
    "1がつ",
    "2がつ",
    "3がつ",
    "4がつ",
    "5がつ",
    "6がつ",
    "7がつ",
    "8がつ",
    "9がつ",
    "10がつ",
    "11がつ",
    "12がつ",
  ],

  wide: [
    "1がつ",
    "2がつ",
    "3がつ",
    "4がつ",
    "5がつ",
    "6がつ",
    "7がつ",
    "8がつ",
    "9がつ",
    "10がつ",
    "11がつ",
    "12がつ",
  ],
} as const;

const dayValues = {
  narrow: ["にち", "げつ", "か", "すい", "もく", "きん", "ど"],
  short: ["にち", "げつ", "か", "すい", "もく", "きん", "ど"],
  abbreviated: ["にち", "げつ", "か", "すい", "もく", "きん", "ど"],
  wide: [
    "にちようび",
    "げつようび",
    "かようび",
    "すいようび",
    "もくようび",
    "きんようび",
    "どようび",
  ],
} as const;

const dayPeriodValues = {
  narrow: {
    am: "ごぜん",
    pm: "ごご",
    midnight: "しんや",
    noon: "しょうご",
    morning: "あさ",
    afternoon: "ごご",
    evening: "よる",
    night: "しんや",
  },
  abbreviated: {
    am: "ごぜん",
    pm: "ごご",
    midnight: "しんや",
    noon: "しょうご",
    morning: "あさ",
    afternoon: "ごご",
    evening: "よる",
    night: "しんや",
  },
  wide: {
    am: "ごぜん",
    pm: "ごご",
    midnight: "しんや",
    noon: "しょうご",
    morning: "あさ",
    afternoon: "ごご",
    evening: "よる",
    night: "しんや",
  },
} as const;
const formattingDayPeriodValues = {
  narrow: {
    am: "ごぜん",
    pm: "ごご",
    midnight: "しんや",
    noon: "しょうご",
    morning: "あさ",
    afternoon: "ごご",
    evening: "よる",
    night: "しんや",
  },
  abbreviated: {
    am: "ごぜん",
    pm: "ごご",
    midnight: "しんや",
    noon: "しょうご",
    morning: "あさ",
    afternoon: "ごご",
    evening: "よる",
    night: "しんや",
  },
  wide: {
    am: "ごぜん",
    pm: "ごご",
    midnight: "しんや",
    noon: "しょうご",
    morning: "あさ",
    afternoon: "ごご",
    evening: "よる",
    night: "しんや",
  },
} as const;

const ordinalNumber = (dirtyNumber: number, options?: LocalizeFnOptions) => {
  const number = Number(dirtyNumber);
  const unit = String(options?.unit);

  switch (unit) {
    case "year":
      return `${number}ねん`;
    case "quarter":
      return `だい${number}しはんき`;
    case "month":
      return `${number}がつ`;
    case "week":
      return `だい${number}しゅう`;
    case "date":
      return `${number}にち`;
    case "hour":
      return `${number}じ`;
    case "minute":
      return `${number}ふん`;
    case "second":
      return `${number}びょう`;
    default:
      return `${number}`;
  }
};

export const localize = {
  ordinalNumber: ordinalNumber,

  era: buildLocalizeFn({
    values: eraValues,
    defaultWidth: "wide",
  }),

  quarter: buildLocalizeFn({
    values: quarterValues,
    defaultWidth: "wide",
    argumentCallback: (quarter) => Number(quarter) - 1,
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
