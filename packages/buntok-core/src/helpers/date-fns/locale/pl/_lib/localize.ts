import type { Localize, LocalizeFnOptions } from "../../types";
import { buildLocalizeFn } from "../../_lib/build-localize-fn";

const eraValues = {
  narrow: ["p.n.e.", "n.e."],
  abbreviated: ["p.n.e.", "n.e."],
  wide: ["przed naszą erą", "naszej ery"],
} as const;

const quarterValues = {
  narrow: ["1", "2", "3", "4"],
  abbreviated: ["I kw.", "II kw.", "III kw.", "IV kw."],
  wide: ["I kwartał", "II kwartał", "III kwartał", "IV kwartał"],
} as const;

const monthValues = {
  narrow: ["S", "L", "M", "K", "M", "C", "L", "S", "W", "P", "L", "G"],
  abbreviated: [
    "sty",
    "lut",
    "mar",
    "kwi",
    "maj",
    "cze",
    "lip",
    "sie",
    "wrz",
    "paź",
    "lis",
    "gru",
  ],

  wide: [
    "styczeń",
    "luty",
    "marzec",
    "kwiecień",
    "maj",
    "czerwiec",
    "lipiec",
    "sierpień",
    "wrzesień",
    "październik",
    "listopad",
    "grudzień",
  ],
} as const;
const monthFormattingValues = {
  narrow: ["s", "l", "m", "k", "m", "c", "l", "s", "w", "p", "l", "g"],
  abbreviated: [
    "sty",
    "lut",
    "mar",
    "kwi",
    "maj",
    "cze",
    "lip",
    "sie",
    "wrz",
    "paź",
    "lis",
    "gru",
  ],

  wide: [
    "stycznia",
    "lutego",
    "marca",
    "kwietnia",
    "maja",
    "czerwca",
    "lipca",
    "sierpnia",
    "września",
    "października",
    "listopada",
    "grudnia",
  ],
} as const;

const dayValues = {
  narrow: ["N", "P", "W", "Ś", "C", "P", "S"],
  short: ["nie", "pon", "wto", "śro", "czw", "pią", "sob"],
  abbreviated: ["niedz.", "pon.", "wt.", "śr.", "czw.", "pt.", "sob."],
  wide: [
    "niedziela",
    "poniedziałek",
    "wtorek",
    "środa",
    "czwartek",
    "piątek",
    "sobota",
  ],
} as const;
const dayFormattingValues = {
  narrow: ["n", "p", "w", "ś", "c", "p", "s"],
  short: ["nie", "pon", "wto", "śro", "czw", "pią", "sob"],
  abbreviated: ["niedz.", "pon.", "wt.", "śr.", "czw.", "pt.", "sob."],
  wide: [
    "niedziela",
    "poniedziałek",
    "wtorek",
    "środa",
    "czwartek",
    "piątek",
    "sobota",
  ],
} as const;

const dayPeriodValues = {
  narrow: {
    am: "a",
    pm: "p",
    midnight: "półn.",
    noon: "poł",
    morning: "rano",
    afternoon: "popoł.",
    evening: "wiecz.",
    night: "noc",
  },
  abbreviated: {
    am: "AM",
    pm: "PM",
    midnight: "północ",
    noon: "południe",
    morning: "rano",
    afternoon: "popołudnie",
    evening: "wieczór",
    night: "noc",
  },
  wide: {
    am: "AM",
    pm: "PM",
    midnight: "północ",
    noon: "południe",
    morning: "rano",
    afternoon: "popołudnie",
    evening: "wieczór",
    night: "noc",
  },
} as const;

const dayPeriodFormattingValues = {
  narrow: {
    am: "a",
    pm: "p",
    midnight: "o półn.",
    noon: "w poł.",
    morning: "rano",
    afternoon: "po poł.",
    evening: "wiecz.",
    night: "w nocy",
  },
  abbreviated: {
    am: "AM",
    pm: "PM",
    midnight: "o północy",
    noon: "w południe",
    morning: "rano",
    afternoon: "po południu",
    evening: "wieczorem",
    night: "w nocy",
  },
  wide: {
    am: "AM",
    pm: "PM",
    midnight: "o północy",
    noon: "w południe",
    morning: "rano",
    afternoon: "po południu",
    evening: "wieczorem",
    night: "w nocy",
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
    formattingValues: monthFormattingValues,
    defaultFormattingWidth: "wide",
  }),

  day: buildLocalizeFn({
    values: dayValues,
    defaultWidth: "wide",
    formattingValues: dayFormattingValues,
    defaultFormattingWidth: "wide",
  }),

  dayPeriod: buildLocalizeFn({
    values: dayPeriodValues,
    defaultWidth: "wide",
    formattingValues: dayPeriodFormattingValues,
    defaultFormattingWidth: "wide",
  }),
};
