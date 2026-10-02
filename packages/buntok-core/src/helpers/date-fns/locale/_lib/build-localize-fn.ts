import type { Day, Era, Month, Quarter } from "../../_lib/types";
import type {
	LocaleDayPeriod,
	LocaleUnitValue,
	LocaleWidth,
	LocalizeFn,
} from "../types";

export type LocalizeFnArgCallback<Value extends LocaleUnitValue | number> = (
	value: Value,
) => LocalizeUnitIndex<Value>;

export type LocalizePeriodValuesMap<Value extends LocaleUnitValue> = {
	[Pattern in LocaleWidth]?: LocalizeValues<Value>;
};

export type LocalizeUnitIndex<Value extends LocaleUnitValue | number> =
	Value extends LocaleUnitValue ? keyof LocalizeValues<Value> : number;

export type LocalizeValues<Value extends LocaleUnitValue> =
	Value extends LocaleDayPeriod
		? Record<LocaleDayPeriod, string>
		: Value extends Quarter
			? LocalizeQuarterValues
			: Value extends Era
				? LocalizeEraValues
				: Value extends Day
					? LocalizeDayValues
					: Value extends Month
						? LocalizeMonthValues
						: never;

export type LocalizeEraValues = readonly [string, string];
export type LocalizeQuarterValues = readonly [string, string, string, string];
export type LocalizeDayValues = readonly [
	string,
	string,
	string,
	string,
	string,
	string,
	string,
];
export type LocalizeMonthValues = readonly [
	string,
	string,
	string,
	string,
	string,
	string,
	string,
	string,
	string,
	string,
	string,
	string,
];

export type BuildLocalizeFnArgs<
	Value extends LocaleUnitValue,
	ArgCallback extends LocalizeFnArgCallback<Value> | undefined,
> = {
	values: LocalizePeriodValuesMap<Value>;
	defaultWidth: LocaleWidth;
	formattingValues?: LocalizePeriodValuesMap<Value>;
	defaultFormattingWidth?: LocaleWidth;
} & (ArgCallback extends undefined
	? {
			argumentCallback?: undefined;
		}
	: {
			argumentCallback: LocalizeFnArgCallback<Value>;
		});

export function buildLocalizeFn<
	Value extends LocaleUnitValue,
	ArgCallback extends LocalizeFnArgCallback<Value> | undefined,
>(args: BuildLocalizeFnArgs<Value, ArgCallback>): LocalizeFn<Value> {
	return (dirtyValue, dirtyOptions) => {
		const context = dirtyOptions?.context
			? String(dirtyOptions.context)
			: "standalone";

		let valuesArray: LocalizeValues<Value> | undefined;
		if (context === "formatting" && args.formattingValues) {
			const defaultWidth = args.defaultFormattingWidth || args.defaultWidth;
			const width = dirtyOptions?.width
				? String(dirtyOptions.width)
				: defaultWidth;

			valuesArray =
				args.formattingValues[width as LocaleWidth] ||
				args.formattingValues[defaultWidth as LocaleWidth];
		} else {
			const defaultWidth = args.defaultWidth;
			const width = dirtyOptions?.width
				? String(dirtyOptions.width)
				: args.defaultWidth;

			valuesArray =
				args.values[width as LocaleWidth] ||
				args.values[defaultWidth as LocaleWidth];
		}
		const index = args.argumentCallback
			? args.argumentCallback(dirtyValue)
			: dirtyValue;
		return (
			valuesArray as unknown as Record<string | number, string>
		)[index as string | number] as string;
	};
}
