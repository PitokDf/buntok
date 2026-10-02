import type { Localize, LocalizeFnOptions } from "../../types";
import { buildLocalizeFn } from "../../_lib/build-localize-fn";

const eraValues = {
  narrow: ["SM", "M"],
  abbreviated: ["SM", "M"],
  wide: ["Sebelum Masehi", "Masehi"],
} as const;

const quarterValues = {
  narrow: ["1", "2", "3", "4"],
  abbreviated: ["K1", "K2", "K3", "K4"],
  wide: ["Kuartal ke-1", "Kuartal ke-2", "Kuartal ke-3", "Kuartal ke-4"],
} as const;

const monthValues = {
  narrow: ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"],
  abbreviated: [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "Mei",
    "Jun",
    "Jul",
    "Agt",
    "Sep",
    "Okt",
    "Nov",
    "Des",
  ],

  wide: [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ],
} as const;

const dayValues = {
  narrow: ["M", "S", "S", "R", "K", "J", "S"],
  short: ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"],
  abbreviated: ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"],
  wide: ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"],
} as const;

const dayPeriodValues = {
  narrow: {
    am: "AM",
    pm: "PM",
    midnight: "tengah malam",
    noon: "tengah hari",
    morning: "pagi",
    afternoon: "siang",
    evening: "sore",
    night: "malam",
  },
  abbreviated: {
    am: "AM",
    pm: "PM",
    midnight: "tengah malam",
    noon: "tengah hari",
    morning: "pagi",
    afternoon: "siang",
    evening: "sore",
    night: "malam",
  },
  wide: {
    am: "AM",
    pm: "PM",
    midnight: "tengah malam",
    noon: "tengah hari",
    morning: "pagi",
    afternoon: "siang",
    evening: "sore",
    night: "malam",
  },
} as const;

const formattingDayPeriodValues = {
  narrow: {
    am: "AM",
    pm: "PM",
    midnight: "tengah malam",
    noon: "tengah hari",
    morning: "pagi",
    afternoon: "siang",
    evening: "sore",
    night: "malam",
  },
  abbreviated: {
    am: "AM",
    pm: "PM",
    midnight: "tengah malam",
    noon: "tengah hari",
    morning: "pagi",
    afternoon: "siang",
    evening: "sore",
    night: "malam",
  },
  wide: {
    am: "AM",
    pm: "PM",
    midnight: "tengah malam",
    noon: "tengah hari",
    morning: "pagi",
    afternoon: "siang",
    evening: "sore",
    night: "malam",
  },
} as const;

const ordinalNumber = (dirtyNumber: number, _options?: LocalizeFnOptions) => {
  const number = Number(dirtyNumber);

  return "ke-" + number;
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
