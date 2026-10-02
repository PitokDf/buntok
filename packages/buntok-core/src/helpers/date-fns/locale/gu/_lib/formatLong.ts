import { buildFormatLongFn } from "../../_lib/build-format-long-fn";

const dateFormats = {
  full: "EEEE, d MMMM, y",
  long: "d MMMM, y",
  medium: "d MMM, y",
  short: "d/M/yy",
};

const timeFormats = {
  full: "hh:mm:ss a zzzz",
  long: "hh:mm:ss a z",
  medium: "hh:mm:ss a",
  short: "hh:mm a",
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
