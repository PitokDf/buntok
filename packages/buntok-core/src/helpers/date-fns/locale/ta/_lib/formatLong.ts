import { buildFormatLongFn } from "../../_lib/build-format-long-fn";

const dateFormats = {
  full: "EEEE, d MMMM, y",
  long: "d MMMM, y",
  medium: "d MMM, y",
  short: "d/M/yy",
};

const timeFormats = {
  full: "a h:mm:ss zzzz",
  long: "a h:mm:ss z",
  medium: "a h:mm:ss",
  short: "a h:mm",
};

const dateTimeFormats = {
  full: "{{date}} {{time}}",
  long: "{{date}} {{time}}",
  medium: "{{date}}, {{time}}",
  short: "{{date}}, {{time}}",
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
