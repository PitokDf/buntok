import { buildFormatLongFn } from "../../_lib/build-format-long-fn";

const dateFormats = {

  full: "EEEE, 'ngày' d MMMM 'năm' y",

  long: "'ngày' d MMMM 'năm' y",

  medium: "d MMM 'năm' y",

  short: "dd/MM/y",
};

const timeFormats = {
  full: "HH:mm:ss zzzz",
  long: "HH:mm:ss z",
  medium: "HH:mm:ss",
  short: "HH:mm",
};

const dateTimeFormats = {

  full: "{{date}} {{time}}",

  long: "{{date}} {{time}}",
  medium: "{{date}} {{time}}",
  short: "{{date}} {{time}}",
};

export const formatLong = {
  date: buildFormatLongFn({
    formats: dateFormats,
    defaultWidth: "full",
  }),

  time: buildFormatLongFn({
    formats: timeFormats,
    defaultWidth: "full",
  }),

  dateTime: buildFormatLongFn({
    formats: dateTimeFormats,
    defaultWidth: "full",
  }),
};
