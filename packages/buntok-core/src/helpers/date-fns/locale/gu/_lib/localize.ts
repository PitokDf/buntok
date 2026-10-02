import type { Localize, LocalizeFnOptions } from "../../types";
import { buildLocalizeFn } from "../../_lib/build-localize-fn";

const eraValues = {
  narrow: ["ઈસપૂ", "ઈસ"],
  abbreviated: ["ઈ.સ.પૂર્વે", "ઈ.સ."],
  wide: ["ઈસવીસન પૂર્વે", "ઈસવીસન"],
} as const;

const quarterValues = {
  narrow: ["1", "2", "3", "4"],
  abbreviated: ["Q1", "Q2", "Q3", "Q4"],
  wide: ["1લો ત્રિમાસ", "2જો ત્રિમાસ", "3જો ત્રિમાસ", "4થો ત્રિમાસ"],
} as const;

const monthValues = {
  narrow: ["જા", "ફે", "મા", "એ", "મે", "જૂ", "જુ", "ઓ", "સ", "ઓ", "ન", "ડિ"],

  abbreviated: [
    "જાન્યુ",
    "ફેબ્રુ",
    "માર્ચ",
    "એપ્રિલ",
    "મે",
    "જૂન",
    "જુલાઈ",
    "ઑગસ્ટ",
    "સપ્ટે",
    "ઓક્ટો",
    "નવે",
    "ડિસે",
  ],

  wide: [
    "જાન્યુઆરી",
    "ફેબ્રુઆરી",
    "માર્ચ",
    "એપ્રિલ",
    "મે",
    "જૂન",
    "જુલાઇ",
    "ઓગસ્ટ",
    "સપ્ટેમ્બર",
    "ઓક્ટોબર",
    "નવેમ્બર",
    "ડિસેમ્બર",
  ],
} as const;

const dayValues = {
  narrow: ["ર", "સો", "મં", "બુ", "ગુ", "શુ", "શ"],
  short: ["ર", "સો", "મં", "બુ", "ગુ", "શુ", "શ"],
  abbreviated: ["રવિ", "સોમ", "મંગળ", "બુધ", "ગુરુ", "શુક્ર", "શનિ"],
  wide: [
    "રવિવાર" ,
    "સોમવાર" ,
    "મંગળવાર" ,
    "બુધવાર" ,
    "ગુરુવાર" ,
    "શુક્રવાર" ,
    "શનિવાર" ,
  ],
} as const;

const dayPeriodValues = {
  narrow: {
    am: "AM",
    pm: "PM",
    midnight: "મ.રાત્રિ",
    noon: "બ.",
    morning: "સવારે",
    afternoon: "બપોરે",
    evening: "સાંજે",
    night: "રાત્રે",
  },
  abbreviated: {
    am: "AM",
    pm: "PM",
    midnight: "​મધ્યરાત્રિ",
    noon: "બપોરે",
    morning: "સવારે",
    afternoon: "બપોરે",
    evening: "સાંજે",
    night: "રાત્રે",
  },
  wide: {
    am: "AM",
    pm: "PM",
    midnight: "​મધ્યરાત્રિ",
    noon: "બપોરે",
    morning: "સવારે",
    afternoon: "બપોરે",
    evening: "સાંજે",
    night: "રાત્રે",
  },
} as const;

const formattingDayPeriodValues = {
  narrow: {
    am: "AM",
    pm: "PM",
    midnight: "મ.રાત્રિ",
    noon: "બપોરે",
    morning: "સવારે",
    afternoon: "બપોરે",
    evening: "સાંજે",
    night: "રાત્રે",
  },
  abbreviated: {
    am: "AM",
    pm: "PM",
    midnight: "મધ્યરાત્રિ",
    noon: "બપોરે",
    morning: "સવારે",
    afternoon: "બપોરે",
    evening: "સાંજે",
    night: "રાત્રે",
  },
  wide: {
    am: "AM",
    pm: "PM",
    midnight: "​મધ્યરાત્રિ",
    noon: "બપોરે",
    morning: "સવારે",
    afternoon: "બપોરે",
    evening: "સાંજે",
    night: "રાત્રે",
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
