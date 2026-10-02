import type { Localize, LocalizeFnOptions } from "../../types";
import { buildLocalizeFn } from "../../_lib/build-localize-fn";

const eraValues = {
  narrow: ["క్రీ.పూ.", "క్రీ.శ."],
  abbreviated: ["క్రీ.పూ.", "క్రీ.శ."],
  wide: ["క్రీస్తు పూర్వం", "క్రీస్తుశకం"],
} as const;

const quarterValues = {
  narrow: ["1", "2", "3", "4"],
  abbreviated: ["త్రై1", "త్రై2", "త్రై3", "త్రై4"],
  wide: ["1వ త్రైమాసికం", "2వ త్రైమాసికం", "3వ త్రైమాసికం", "4వ త్రైమాసికం"],
} as const;

const monthValues = {
  narrow: ["జ", "ఫి", "మా", "ఏ", "మే", "జూ", "జు", "ఆ", "సె", "అ", "న", "డి"],

  abbreviated: [
    "జన",
    "ఫిబ్ర",
    "మార్చి",
    "ఏప్రి",
    "మే",
    "జూన్",
    "జులై",
    "ఆగ",
    "సెప్టెం",
    "అక్టో",
    "నవం",
    "డిసెం",
  ],

  wide: [
    "జనవరి",
    "ఫిబ్రవరి",
    "మార్చి",
    "ఏప్రిల్",
    "మే",
    "జూన్",
    "జులై",
    "ఆగస్టు",
    "సెప్టెంబర్",
    "అక్టోబర్",
    "నవంబర్",
    "డిసెంబర్",
  ],
} as const;

const dayValues = {
  narrow: ["ఆ", "సో", "మ", "బు", "గు", "శు", "శ"],
  short: ["ఆది", "సోమ", "మంగళ", "బుధ", "గురు", "శుక్ర", "శని"],
  abbreviated: ["ఆది", "సోమ", "మంగళ", "బుధ", "గురు", "శుక్ర", "శని"],
  wide: [
    "ఆదివారం",
    "సోమవారం",
    "మంగళవారం",
    "బుధవారం",
    "గురువారం",
    "శుక్రవారం",
    "శనివారం",
  ],
} as const;

const dayPeriodValues = {
  narrow: {
    am: "పూర్వాహ్నం",
    pm: "అపరాహ్నం",
    midnight: "అర్ధరాత్రి",
    noon: "మిట్టమధ్యాహ్నం",
    morning: "ఉదయం",
    afternoon: "మధ్యాహ్నం",
    evening: "సాయంత్రం",
    night: "రాత్రి",
  },
  abbreviated: {
    am: "పూర్వాహ్నం",
    pm: "అపరాహ్నం",
    midnight: "అర్ధరాత్రి",
    noon: "మిట్టమధ్యాహ్నం",
    morning: "ఉదయం",
    afternoon: "మధ్యాహ్నం",
    evening: "సాయంత్రం",
    night: "రాత్రి",
  },
  wide: {
    am: "పూర్వాహ్నం",
    pm: "అపరాహ్నం",
    midnight: "అర్ధరాత్రి",
    noon: "మిట్టమధ్యాహ్నం",
    morning: "ఉదయం",
    afternoon: "మధ్యాహ్నం",
    evening: "సాయంత్రం",
    night: "రాత్రి",
  },
} as const;

const formattingDayPeriodValues = {
  narrow: {
    am: "పూర్వాహ్నం",
    pm: "అపరాహ్నం",
    midnight: "అర్ధరాత్రి",
    noon: "మిట్టమధ్యాహ్నం",
    morning: "ఉదయం",
    afternoon: "మధ్యాహ్నం",
    evening: "సాయంత్రం",
    night: "రాత్రి",
  },
  abbreviated: {
    am: "పూర్వాహ్నం",
    pm: "అపరాహ్నం",
    midnight: "అర్ధరాత్రి",
    noon: "మిట్టమధ్యాహ్నం",
    morning: "ఉదయం",
    afternoon: "మధ్యాహ్నం",
    evening: "సాయంత్రం",
    night: "రాత్రి",
  },
  wide: {
    am: "పూర్వాహ్నం",
    pm: "అపరాహ్నం",
    midnight: "అర్ధరాత్రి",
    noon: "మిట్టమధ్యాహ్నం",
    morning: "ఉదయం",
    afternoon: "మధ్యాహ్నం",
    evening: "సాయంత్రం",
    night: "రాత్రి",
  },
} as const;

const ordinalNumber = (dirtyNumber: number, _options?: LocalizeFnOptions) => {
  const number = Number(dirtyNumber);
  return number + "వ";
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
