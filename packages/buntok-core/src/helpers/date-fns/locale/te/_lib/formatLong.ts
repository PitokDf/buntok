import { buildFormatLongFn } from "../../_lib/build-format-long-fn";

const dateFormats = {
  full: "d, MMMM y, EEEE",
  long: "d MMMM, y",
  medium: "d MMM, y",
  short: "dd-MM-yy",
};

const timeFormats = {
  full: "h:mm:ss a zzzz",
  long: "h:mm:ss a z",
  medium: "h:mm:ss a",
  short: "h:mm a",
};

const dateTimeFormats = {
  full: "{{date}} {{time}}'కి'",
  long: "{{date}} {{time}}'కి'",
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
