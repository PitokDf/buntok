import type { Localize, LocalizeFnOptions } from "../../types";
import { buildLocalizeFn } from "../../_lib/build-localize-fn";

const eraValues = {
  narrow: ["ಕ್ರಿ.ಪೂ", "ಕ್ರಿ.ಶ"],
  abbreviated: ["ಕ್ರಿ.ಪೂ", "ಕ್ರಿ.ಶ"],
  wide: ["ಕ್ರಿಸ್ತ ಪೂರ್ವ", "ಕ್ರಿಸ್ತ ಶಕ"],
} as const;

const quarterValues = {
  narrow: ["1", "2", "3", "4"],
  abbreviated: ["ತ್ರೈ 1", "ತ್ರೈ 2", "ತ್ರೈ 3", "ತ್ರೈ 4"],
  wide: ["1ನೇ ತ್ರೈಮಾಸಿಕ", "2ನೇ ತ್ರೈಮಾಸಿಕ", "3ನೇ ತ್ರೈಮಾಸಿಕ", "4ನೇ ತ್ರೈಮಾಸಿಕ"],
} as const;

const monthValues = {
  narrow: ["ಜ", "ಫೆ", "ಮಾ", "ಏ", "ಮೇ", "ಜೂ", "ಜು", "ಆ", "ಸೆ", "ಅ", "ನ", "ಡಿ"],

  abbreviated: [
    "ಜನ",
    "ಫೆಬ್ರ",
    "ಮಾರ್ಚ್",
    "ಏಪ್ರಿ",
    "ಮೇ",
    "ಜೂನ್",
    "ಜುಲೈ",
    "ಆಗ",
    "ಸೆಪ್ಟೆಂ",
    "ಅಕ್ಟೋ",
    "ನವೆಂ",
    "ಡಿಸೆಂ",
  ],

  wide: [
    "ಜನವರಿ",
    "ಫೆಬ್ರವರಿ",
    "ಮಾರ್ಚ್",
    "ಏಪ್ರಿಲ್",
    "ಮೇ",
    "ಜೂನ್",
    "ಜುಲೈ",
    "ಆಗಸ್ಟ್",
    "ಸೆಪ್ಟೆಂಬರ್",
    "ಅಕ್ಟೋಬರ್",
    "ನವೆಂಬರ್",
    "ಡಿಸೆಂಬರ್",
  ],
} as const;

const dayValues = {
  narrow: ["ಭಾ", "ಸೋ", "ಮಂ", "ಬು", "ಗು", "ಶು", "ಶ"],
  short: ["ಭಾನು", "ಸೋಮ", "ಮಂಗಳ", "ಬುಧ", "ಗುರು", "ಶುಕ್ರ", "ಶನಿ"],
  abbreviated: ["ಭಾನು", "ಸೋಮ", "ಮಂಗಳ", "ಬುಧ", "ಗುರು", "ಶುಕ್ರ", "ಶನಿ"],
  wide: [
    "ಭಾನುವಾರ",
    "ಸೋಮವಾರ",
    "ಮಂಗಳವಾರ",
    "ಬುಧವಾರ",
    "ಗುರುವಾರ",
    "ಶುಕ್ರವಾರ",
    "ಶನಿವಾರ",
  ],
} as const;

const dayPeriodValues = {
  narrow: {
    am: "ಪೂರ್ವಾಹ್ನ",
    pm: "ಅಪರಾಹ್ನ",
    midnight: "ಮಧ್ಯರಾತ್ರಿ",
    noon: "ಮಧ್ಯಾಹ್ನ",
    morning: "ಬೆಳಗ್ಗೆ",
    afternoon: "ಮಧ್ಯಾಹ್ನ",
    evening: "ಸಂಜೆ",
    night: "ರಾತ್ರಿ",
  },
  abbreviated: {
    am: "ಪೂರ್ವಾಹ್ನ",
    pm: "ಅಪರಾಹ್ನ",
    midnight: "ಮಧ್ಯರಾತ್ರಿ",
    noon: "ಮಧ್ಯಾನ್ಹ",
    morning: "ಬೆಳಗ್ಗೆ",
    afternoon: "ಮಧ್ಯಾನ್ಹ",
    evening: "ಸಂಜೆ",
    night: "ರಾತ್ರಿ",
  },
  wide: {
    am: "ಪೂರ್ವಾಹ್ನ",
    pm: "ಅಪರಾಹ್ನ",
    midnight: "ಮಧ್ಯರಾತ್ರಿ",
    noon: "ಮಧ್ಯಾನ್ಹ",
    morning: "ಬೆಳಗ್ಗೆ",
    afternoon: "ಮಧ್ಯಾನ್ಹ",
    evening: "ಸಂಜೆ",
    night: "ರಾತ್ರಿ",
  },
} as const;

const formattingDayPeriodValues = {
  narrow: {
    am: "ಪೂ",
    pm: "ಅ",
    midnight: "ಮಧ್ಯರಾತ್ರಿ",
    noon: "ಮಧ್ಯಾನ್ಹ",
    morning: "ಬೆಳಗ್ಗೆ",
    afternoon: "ಮಧ್ಯಾನ್ಹ",
    evening: "ಸಂಜೆ",
    night: "ರಾತ್ರಿ",
  },
  abbreviated: {
    am: "ಪೂರ್ವಾಹ್ನ",
    pm: "ಅಪರಾಹ್ನ",
    midnight: "ಮಧ್ಯ ರಾತ್ರಿ",
    noon: "ಮಧ್ಯಾನ್ಹ",
    morning: "ಬೆಳಗ್ಗೆ",
    afternoon: "ಮಧ್ಯಾನ್ಹ",
    evening: "ಸಂಜೆ",
    night: "ರಾತ್ರಿ",
  },
  wide: {
    am: "ಪೂರ್ವಾಹ್ನ",
    pm: "ಅಪರಾಹ್ನ",
    midnight: "ಮಧ್ಯ ರಾತ್ರಿ",
    noon: "ಮಧ್ಯಾನ್ಹ",
    morning: "ಬೆಳಗ್ಗೆ",
    afternoon: "ಮಧ್ಯಾನ್ಹ",
    evening: "ಸಂಜೆ",
    night: "ರಾತ್ರಿ",
  },
} as const;

const ordinalNumber = (dirtyNumber: number, _options?: LocalizeFnOptions) => {
  const number = Number(dirtyNumber);
  return number + "ನೇ";
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
