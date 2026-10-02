import type { Localize, LocalizeFnOptions } from "../../types";
import { buildLocalizeFn } from "../../_lib/build-localize-fn";

const eraValues = {
  narrow: ["пр.н.е.", "н.е."],
  abbreviated: ["пред н. е.", "н. е."],
  wide: ["пред нашата ера", "нашата ера"],
} as const;

const quarterValues = {
  narrow: ["1", "2", "3", "4"],
  abbreviated: ["1-ви кв.", "2-ри кв.", "3-ти кв.", "4-ти кв."],
  wide: ["1-ви квартал", "2-ри квартал", "3-ти квартал", "4-ти квартал"],
} as const;

const monthValues = {
  abbreviated: [
    "јан",
    "фев",
    "мар",
    "апр",
    "мај",
    "јун",
    "јул",
    "авг",
    "септ",
    "окт",
    "ноем",
    "дек",
  ],

  wide: [
    "јануари",
    "февруари",
    "март",
    "април",
    "мај",
    "јуни",
    "јули",
    "август",
    "септември",
    "октомври",
    "ноември",
    "декември",
  ],
} as const;

const dayValues = {
  narrow: ["Н", "П", "В", "С", "Ч", "П", "С"],
  short: ["не", "по", "вт", "ср", "че", "пе", "са"],
  abbreviated: ["нед", "пон", "вто", "сре", "чет", "пет", "саб"],
  wide: [
    "недела",
    "понеделник",
    "вторник",
    "среда",
    "четврток",
    "петок",
    "сабота",
  ],
} as const;

const dayPeriodValues = {
  wide: {
    am: "претпладне",
    pm: "попладне",
    midnight: "полноќ",
    noon: "напладне",
    morning: "наутро",
    afternoon: "попладне",
    evening: "навечер",
    night: "ноќе",
  },
} as const;

const ordinalNumber = (dirtyNumber: number, _options?: LocalizeFnOptions) => {
  const number = Number(dirtyNumber);

  const rem100 = number % 100;
  if (rem100 > 20 || rem100 < 10) {
    switch (rem100 % 10) {
      case 1:
        return number + "-ви";
      case 2:
        return number + "-ри";
      case 7:
      case 8:
        return number + "-ми";
    }
  }
  return number + "-ти";
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
  }),
};
