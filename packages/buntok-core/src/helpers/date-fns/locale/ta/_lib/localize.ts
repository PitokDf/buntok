import type { Localize, LocalizeFnOptions } from "../../types";
import { buildLocalizeFn } from "../../_lib/build-localize-fn";

const eraValues = {
  narrow: ["கி.மு.", "கி.பி."],
  abbreviated: ["கி.மு.", "கி.பி."],
  wide: ["கிறிஸ்துவுக்கு முன்", "அன்னோ டோமினி"],
} as const;

const quarterValues = {

  narrow: ["1", "2", "3", "4"],

  abbreviated: ["காலா.1", "காலா.2", "காலா.3", "காலா.4"],

  wide: [
    "ஒன்றாம் காலாண்டு",
    "இரண்டாம் காலாண்டு",
    "மூன்றாம் காலாண்டு",
    "நான்காம் காலாண்டு",
  ],
} as const;

const monthValues = {

  narrow: ["ஜ", "பி", "மா", "ஏ", "மே", "ஜூ", "ஜூ", "ஆ", "செ", "அ", "ந", "டி"],

  abbreviated: [
    "ஜன.",
    "பிப்.",
    "மார்.",
    "ஏப்.",
    "மே",
    "ஜூன்",
    "ஜூலை",
    "ஆக.",
    "செப்.",
    "அக்.",
    "நவ.",
    "டிச.",
  ],

  wide: [
    "ஜனவரி",
    "பிப்ரவரி",
    "மார்ச்",
    "ஏப்ரல்",
    "மே",
    "ஜூன்",
    "ஜூலை",
    "ஆகஸ்ட்",
    "செப்டம்பர்",
    "அக்டோபர்",
    "நவம்பர்",
    "டிசம்பர்",
  ],
} as const;

const dayValues = {

  narrow: ["ஞா", "தி", "செ", "பு", "வி", "வெ", "ச"],

  short: ["ஞா", "தி", "செ", "பு", "வி", "வெ", "ச"],

  abbreviated: ["ஞாயி.", "திங்.", "செவ்.", "புத.", "வியா.", "வெள்.", "சனி"],

  wide: [
    "ஞாயிறு",
    "திங்கள்",
    "செவ்வாய்",
    "புதன்",
    "வியாழன்",
    "வெள்ளி",
    "சனி",
  ],
} as const;

const dayPeriodValues = {
  narrow: {
    am: "மு.ப",
    pm: "பி.ப",
    midnight: "நள்.",
    noon: "நண்.",
    morning: "கா.",
    afternoon: "மதி.",
    evening: "மா.",
    night: "இர.",
  },
  abbreviated: {
    am: "முற்பகல்",
    pm: "பிற்பகல்",
    midnight: "நள்ளிரவு",
    noon: "நண்பகல்",
    morning: "காலை",
    afternoon: "மதியம்",
    evening: "மாலை",
    night: "இரவு",
  },
  wide: {
    am: "முற்பகல்",
    pm: "பிற்பகல்",
    midnight: "நள்ளிரவு",
    noon: "நண்பகல்",
    morning: "காலை",
    afternoon: "மதியம்",
    evening: "மாலை",
    night: "இரவு",
  },
} as const;

const formattingDayPeriodValues = {
  narrow: {
    am: "மு.ப",
    pm: "பி.ப",
    midnight: "நள்.",
    noon: "நண்.",
    morning: "கா.",
    afternoon: "மதி.",
    evening: "மா.",
    night: "இர.",
  },
  abbreviated: {
    am: "முற்பகல்",
    pm: "பிற்பகல்",
    midnight: "நள்ளிரவு",
    noon: "நண்பகல்",
    morning: "காலை",
    afternoon: "மதியம்",
    evening: "மாலை",
    night: "இரவு",
  },
  wide: {
    am: "முற்பகல்",
    pm: "பிற்பகல்",
    midnight: "நள்ளிரவு",
    noon: "நண்பகல்",
    morning: "காலை",
    afternoon: "மதியம்",
    evening: "மாலை",
    night: "இரவு",
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
