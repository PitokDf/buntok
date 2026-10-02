import { AMPMParser } from "./parsers/AMPMParser";
import { AMPMMidnightParser } from "./parsers/AMPMMidnightParser";
import { DateParser } from "./parsers/DateParser";
import { DayOfYearParser } from "./parsers/DayOfYearParser";
import { DayParser } from "./parsers/DayParser";
import { DayPeriodParser } from "./parsers/DayPeriodParser";
import { EraParser } from "./parsers/EraParser";
import { ExtendedYearParser } from "./parsers/ExtendedYearParser";
import { FractionOfSecondParser } from "./parsers/FractionOfSecondParser";
import { Hour0To11Parser } from "./parsers/Hour0To11Parser";
import { Hour0to23Parser } from "./parsers/Hour0to23Parser";
import { Hour1to12Parser } from "./parsers/Hour1to12Parser";
import { Hour1To24Parser } from "./parsers/Hour1To24Parser";
import { ISODayParser } from "./parsers/ISODayParser";
import { ISOTimezoneParser } from "./parsers/ISOTimezoneParser";
import { ISOTimezoneWithZParser } from "./parsers/ISOTimezoneWithZParser";
import { ISOWeekParser } from "./parsers/ISOWeekParser";
import { ISOWeekYearParser } from "./parsers/ISOWeekYearParser";
import { LocalDayParser } from "./parsers/LocalDayParser";
import { LocalWeekParser } from "./parsers/LocalWeekParser";
import { LocalWeekYearParser } from "./parsers/LocalWeekYearParser";
import { MinuteParser } from "./parsers/MinuteParser";
import { MonthParser } from "./parsers/MonthParser";
import { QuarterParser } from "./parsers/QuarterParser";
import { SecondParser } from "./parsers/SecondParser";
import { StandAloneLocalDayParser } from "./parsers/StandAloneLocalDayParser";
import { StandAloneMonthParser } from "./parsers/StandAloneMonthParser";
import { StandAloneQuarterParser } from "./parsers/StandAloneQuarterParser";
import { TimestampMillisecondsParser } from "./parsers/TimestampMillisecondsParser";
import { TimestampSecondsParser } from "./parsers/TimestampSecondsParser";
import { YearParser } from "./parsers/YearParser";
import type { Parser } from "./parser";

export const parsers: Record<string, Parser<number>> = {
	G: new EraParser() as unknown as Parser<number>,
	y: new YearParser() as unknown as Parser<number>,
	Y: new LocalWeekYearParser() as unknown as Parser<number>,
	R: new ISOWeekYearParser(),
	u: new ExtendedYearParser(),
	Q: new QuarterParser(),
	q: new StandAloneQuarterParser(),
	M: new MonthParser(),
	L: new StandAloneMonthParser(),
	w: new LocalWeekParser(),
	I: new ISOWeekParser(),
	d: new DateParser(),
	D: new DayOfYearParser(),
	E: new DayParser(),
	e: new LocalDayParser(),
	c: new StandAloneLocalDayParser(),
	i: new ISODayParser(),
	a: new AMPMParser() as unknown as Parser<number>,
	b: new AMPMMidnightParser() as unknown as Parser<number>,
	B: new DayPeriodParser() as unknown as Parser<number>,
	h: new Hour1to12Parser(),
	H: new Hour0to23Parser(),
	K: new Hour0To11Parser(),
	k: new Hour1To24Parser(),
	m: new MinuteParser(),
	s: new SecondParser(),
	S: new FractionOfSecondParser(),
	X: new ISOTimezoneWithZParser(),
	x: new ISOTimezoneParser(),
	t: new TimestampSecondsParser(),
	T: new TimestampMillisecondsParser(),
};
