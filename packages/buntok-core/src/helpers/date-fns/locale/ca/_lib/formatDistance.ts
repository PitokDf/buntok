import type { FormatDistanceFn } from "../../types";


const formatDistanceLocale = {
  lessThanXSeconds: {
    one: "menys d'un segon",
    eleven: "menys d'onze segons",
    other: "menys de {{count}} segons",
  },

  xSeconds: {
    one: "1 segon",
    other: "{{count}} segons",
  },

  halfAMinute: "mig minut",

  lessThanXMinutes: {
    one: "menys d'un minut",
    eleven: "menys d'onze minuts",
    other: "menys de {{count}} minuts",
  },

  xMinutes: {
    one: "1 minut",
    other: "{{count}} minuts",
  },

  aboutXHours: {
    one: "aproximadament una hora",
    other: "aproximadament {{count}} hores",
  },

  xHours: {
    one: "1 hora",
    other: "{{count}} hores",
  },

  xDays: {
    one: "1 dia",
    other: "{{count}} dies",
  },

  aboutXWeeks: {
    one: "aproximadament una setmana",
    other: "aproximadament {{count}} setmanes",
  },

  xWeeks: {
    one: "1 setmana",
    other: "{{count}} setmanes",
  },

  aboutXMonths: {
    one: "aproximadament un mes",
    other: "aproximadament {{count}} mesos",
  },

  xMonths: {
    one: "1 mes",
    other: "{{count}} mesos",
  },

  aboutXYears: {
    one: "aproximadament un any",
    other: "aproximadament {{count}} anys",
  },

  xYears: {
    one: "1 any",
    other: "{{count}} anys",
  },

  overXYears: {
    one: "més d'un any",
    eleven: "més d'onze anys",
    other: "més de {{count}} anys",
  },

  almostXYears: {
    one: "gairebé un any",
    other: "gairebé {{count}} anys",
  },
};

export const formatDistance: FormatDistanceFn = (token, count, options) => {
  let result;

  const tokenValue = formatDistanceLocale[token as keyof typeof formatDistanceLocale] as any;
  if (typeof tokenValue === "string") {
    result = tokenValue;
  } else if (count === 1) {
    result = tokenValue.one;
  } else if (count === 11 && tokenValue.eleven) {
    result = tokenValue.eleven;
  } else {
    result = tokenValue.other.replace("{{count}}", String(count));
  }

  if (options?.addSuffix) {
    if (options.comparison && options.comparison > 0) {
      return "en " + result;
    } else {
      return "fa " + result;
    }
  }

  return result;
};
