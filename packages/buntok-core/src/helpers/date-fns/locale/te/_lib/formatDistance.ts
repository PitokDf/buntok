import type { FormatDistanceFn } from "../../types";


const formatDistanceLocale = {
  lessThanXSeconds: {
    standalone: {
      one: "సెకను కన్నా తక్కువ",
      other: "{{count}} సెకన్ల కన్నా తక్కువ",
    },
    withPreposition: {
      one: "సెకను",
      other: "{{count}} సెకన్ల",
    },
  },

  xSeconds: {
    standalone: {
      one: "ఒక సెకను",
      other: "{{count}} సెకన్ల",
    },
    withPreposition: {
      one: "ఒక సెకను",
      other: "{{count}} సెకన్ల",
    },
  },

  halfAMinute: {
    standalone: "అర నిమిషం",
    withPreposition: "అర నిమిషం",
  },

  lessThanXMinutes: {
    standalone: {
      one: "ఒక నిమిషం కన్నా తక్కువ",
      other: "{{count}} నిమిషాల కన్నా తక్కువ",
    },
    withPreposition: {
      one: "ఒక నిమిషం",
      other: "{{count}} నిమిషాల",
    },
  },

  xMinutes: {
    standalone: {
      one: "ఒక నిమిషం",
      other: "{{count}} నిమిషాలు",
    },
    withPreposition: {
      one: "ఒక నిమిషం",
      other: "{{count}} నిమిషాల",
    },
  },

  aboutXHours: {
    standalone: {
      one: "సుమారు ఒక గంట",
      other: "సుమారు {{count}} గంటలు",
    },
    withPreposition: {
      one: "సుమారు ఒక గంట",
      other: "సుమారు {{count}} గంటల",
    },
  },

  xHours: {
    standalone: {
      one: "ఒక గంట",
      other: "{{count}} గంటలు",
    },
    withPreposition: {
      one: "ఒక గంట",
      other: "{{count}} గంటల",
    },
  },

  xDays: {
    standalone: {
      one: "ఒక రోజు",
      other: "{{count}} రోజులు",
    },
    withPreposition: {
      one: "ఒక రోజు",
      other: "{{count}} రోజుల",
    },
  },

  aboutXWeeks: {
    standalone: {
      one: "సుమారు ఒక వారం",
      other: "సుమారు {{count}} వారాలు",
    },
    withPreposition: {
      one: "సుమారు ఒక వారం",
      other: "సుమారు {{count}} వారాలల",
    },
  },

  xWeeks: {
    standalone: {
      one: "ఒక వారం",
      other: "{{count}} వారాలు",
    },
    withPreposition: {
      one: "ఒక వారం",
      other: "{{count}} వారాలల",
    },
  },

  aboutXMonths: {
    standalone: {
      one: "సుమారు ఒక నెల",
      other: "సుమారు {{count}} నెలలు",
    },
    withPreposition: {
      one: "సుమారు ఒక నెల",
      other: "సుమారు {{count}} నెలల",
    },
  },

  xMonths: {
    standalone: {
      one: "ఒక నెల",
      other: "{{count}} నెలలు",
    },
    withPreposition: {
      one: "ఒక నెల",
      other: "{{count}} నెలల",
    },
  },

  aboutXYears: {
    standalone: {
      one: "సుమారు ఒక సంవత్సరం",
      other: "సుమారు {{count}} సంవత్సరాలు",
    },
    withPreposition: {
      one: "సుమారు ఒక సంవత్సరం",
      other: "సుమారు {{count}} సంవత్సరాల",
    },
  },

  xYears: {
    standalone: {
      one: "ఒక సంవత్సరం",
      other: "{{count}} సంవత్సరాలు",
    },
    withPreposition: {
      one: "ఒక సంవత్సరం",
      other: "{{count}} సంవత్సరాల",
    },
  },

  overXYears: {
    standalone: {
      one: "ఒక సంవత్సరం పైగా",
      other: "{{count}} సంవత్సరాలకు పైగా",
    },
    withPreposition: {
      one: "ఒక సంవత్సరం",
      other: "{{count}} సంవత్సరాల",
    },
  },

  almostXYears: {
    standalone: {
      one: "దాదాపు ఒక సంవత్సరం",
      other: "దాదాపు {{count}} సంవత్సరాలు",
    },
    withPreposition: {
      one: "దాదాపు ఒక సంవత్సరం",
      other: "దాదాపు {{count}} సంవత్సరాల",
    },
  },
};

export const formatDistance: FormatDistanceFn = (token, count, options) => {
  let result;

  const tokenValue = options?.addSuffix
    ? formatDistanceLocale[token as keyof typeof formatDistanceLocale].withPreposition
    : formatDistanceLocale[token as keyof typeof formatDistanceLocale].standalone;

  if (typeof tokenValue === "string") {
    result = tokenValue;
  } else if (count === 1) {
    result = tokenValue.one;
  } else {
    result = tokenValue.other.replace("{{count}}", String(count));
  }

  if (options?.addSuffix) {
    if (options.comparison && options.comparison > 0) {
      return result + "లో";
    } else {
      return result + " క్రితం";
    }
  }

  return result;
};
