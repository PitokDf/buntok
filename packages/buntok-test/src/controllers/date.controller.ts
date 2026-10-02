import { type Context, Controller, Get, Use, type ZodCtx } from "@buntok/core";
import {
	addDays,
	differenceInCalendarDays,
	format,
	formatDistance,
	formatDistanceStrict,
	formatISO,
	formatRelative,
	getDay,
	getQuarter,
	getWeek,
	getWeekYear,
	intervalToDuration,
	isValid,
	isWithinInterval,
	nextFriday,
	parse,
	parseISO,
	subDays,
} from "@buntok/core/date";
import {
	addDays as addDaysFp,
	addWeeks as addWeeksFp,
	addYears as addYearsFp,
	formatDistance as formatDistanceFp,
	format as formatFp,
	formatWithOptions as formatWithOptionsFp,
	getISODay as getISODayFp,
	nextFriday as nextFridayFp,
	nextMonday as nextMondayFp,
} from "@buntok/core/date/fp";
import * as locales from "@buntok/core/date/locale";
import { HttpError } from "@buntok/core/helpers";
import { z, zValidator } from "@buntok/core/middlewares/validator";

type AnyLocale = (typeof locales)[keyof typeof locales];

const registry: Record<string, AnyLocale | undefined> = {};
for (const locale of Object.values(locales as Record<string, AnyLocale>)) {
	registry[locale.code] = locale;
}

function parseDateInput(input?: string): Date {
	if (!input) {
		return new Date();
	}
	const date = parseISO(input);
	if (!isValid(date)) {
		throw new HttpError(
			400,
			`invalid date "${input}" — expected ISO-8601, e.g. 2024-10-01T14:30:45Z`,
		);
	}
	return date;
}

const dateQuerySchema = {
	date: z.string().optional().describe("ISO-8601 date string, defaults to now"),
};

@Controller("/date")
export class DateController {
	@Get("/demo")
	@Use(zValidator("query", dateQuerySchema, { contentType: "application/json" }))
	async demo(ctx: ZodCtx<{ query: { date?: string } }>) {
		const query = ctx.valid("query");
		const date = parseDateInput(query.date);
		const now = new Date();
		const past = subDays(date, 10);
		const future = addDays(date, 10);
		const formatted = format(date, "PPpp");
		return ctx.success({
			input: query.date ?? now.toISOString(),
			format: {
				short: format(date, "P"),
				long: format(date, "PPPP"),
				weekday: format(date, "EEEE, d MMMM yyyy"),
				time: format(date, "HH:mm:ss"),
				quoted: format(date, "EEEE 'at' HH:mm"),
				iso: formatISO(date),
			},
			parse: {
				source: formatted,
				reparsed: parse(formatted, "PPpp", date).toISOString(),
				roundtrip_stable: format(parse(formatted, "PPpp", date), "PPpp") === formatted,
			},
			distance: {
				to_10_days_ago: formatDistance(past, date, { addSuffix: true }),
				to_10_days_ahead: formatDistance(future, date, { addSuffix: true }),
				strict_14_days: formatDistanceStrict(addDays(date, 14), date, {
					unit: "day",
					addSuffix: true,
				}),
			},
			relative: {
				tomorrow: formatRelative(addDays(date, 1), date),
				yesterday: formatRelative(subDays(date, 1), date),
				last_week: formatRelative(subDays(date, 6), date),
				next_month: formatRelative(addDays(date, 30), date),
			},
			calendars: {
				quarter: getQuarter(date),
				week_year: getWeekYear(date),
				week: getWeek(date),
				weekday_index: getDay(date),
				calendar_diff_days: differenceInCalendarDays(date, now),
			},
			duration: intervalToDuration({ start: date, end: addDays(date, 400) }),
			checks: {
				valid: isValid(date),
				within_next_week: isWithinInterval(date, {
					start: now,
					end: addDays(now, 7),
				}),
				next_friday: nextFriday(date).toISOString(),
			},
		});
	}

	@Get("/fp")
	@Use(zValidator("query", dateQuerySchema, { contentType: "application/json" }))
	async fpDemo(ctx: ZodCtx<{ query: { date?: string } }>) {
		const query = ctx.valid("query");
		const date = parseDateInput(query.date);
		const dayName = formatFp("EEEE");
		const plusYear = addYearsFp(1);
		return ctx.success({
			curried: {
				add_10_days: addDaysFp(10)(date).toISOString(),
				add_10_days_empty_chain: addDaysFp()(10)(date).toISOString(),
				full_call: addDaysFp(10, date).toISOString(),
				format_day_name: dayName(date),
				format_full: formatFp("PPPP")(date),
				next_monday: nextMondayFp(date).toISOString(),
			},
			reusable: {
				in_one_year: plusYear(date).toISOString(),
				two_weeks_label: formatFp("PP")(addWeeksFp(2)(date)),
				friday_label: formatFp("EEEE")(nextFridayFp(date)),
				iso_day: getISODayFp(date),
				distance_5_days: formatDistanceFp(date)(addDaysFp(5)(date)),
			},
			localized_partial: formatWithOptionsFp({ locale: registry.id }, "EEEE, d MMMM yyyy")(date),
		});
	}

	@Get("/locales")
	@Use(
		zValidator(
			"query",
			{
				...dateQuerySchema,
				codes: z.string().optional().describe("Comma-separated locale codes, e.g. id,en-US,ja,ru"),
			},
			{ contentType: "application/json" },
		),
	)
	async localesByCode(ctx: ZodCtx<{ query: { date?: string; codes?: string } }>) {
		const query = ctx.valid("query");
		const date = parseDateInput(query.date);
		const codes = (query.codes ?? "id,en-US,ja,ru,ar,zh-CN")
			.split(",")
			.map((code) => code.trim())
			.filter(Boolean);
		const results = codes.map((code) => {
			const locale = registry[code];
			if (!locale) {
				throw new HttpError(400, `unknown locale code "${code}" — see GET /date/locales/all`);
			}
			return {
				code: locale.code,
				week_starts_on: locale.options?.weekStartsOn ?? null,
				format_long: format(date, "EEEE, d MMMM yyyy HH:mm", { locale }),
				distance_7_days_ago: formatDistance(subDays(date, 7), date, {
					addSuffix: true,
					locale,
				}),
				relative_tomorrow: formatRelative(addDays(date, 1), date, { locale }),
				week: getWeek(date, { locale }),
			};
		});
		return ctx.success({ date: formatISO(date), results });
	}

	@Get("/locales/all")
	async allLocales(ctx: Context) {
		const codes = Object.keys(registry).sort();
		return ctx.success({
			total: codes.length,
			codes,
			usage: "GET /date/locales?codes=id,en-US,ja",
		});
	}
}
