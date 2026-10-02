import { toDate } from "./_lib/to-date";
import type { ContextOptions } from "./_lib/types";

export interface ParseJSONOptions<DateType extends Date = Date>
	extends ContextOptions<DateType> {}

export function parseJSON<ResultDate extends Date = Date>(
	dateStr: string,
	options?: ParseJSONOptions<ResultDate>,
): ResultDate {
	const parts = dateStr.match(
		/(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2}):(\d{2})(?:\.(\d{0,7}))?(?:Z|(.)(\d{2}):?(\d{2})?)?/,
	);
	if (!parts) return toDate(NaN as unknown as Date, options?.in) as ResultDate;
	return toDate(
		Date.UTC(
			+parts[1]!,
			+parts[2]! - 1,
			+parts[3]!,
			+parts[4]! - (+parts[9]! || 0) * (parts[8]! == "-" ? -1 : 1),
			+parts[5]! - (+parts[10]! || 0) * (parts[8]! == "-" ? -1 : 1),
			+parts[6]!,
			+((parts[7] || "0") + "00").substring(0, 3),
		) as unknown as Date,
		options?.in,
	) as ResultDate;
}
