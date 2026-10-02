import type { FormatLongFn, FormatLongWidth } from "../types";

export interface BuildFormatLongFnArgs<DefaultWidth extends FormatLongWidth> {
	formats: Partial<{
		[Format in FormatLongWidth]: string;
	}> & {
		[Format in DefaultWidth]: string;
	};
	defaultWidth: DefaultWidth;
}

export function buildFormatLongFn<DefaultWidth extends FormatLongWidth>(
	args: BuildFormatLongFnArgs<DefaultWidth>,
): FormatLongFn {
	return (options = {}) => {
		const width = options.width ? String(options.width) : args.defaultWidth;
		const format =
			args.formats[width as FormatLongWidth] || args.formats[args.defaultWidth];
		return format as string;
	};
}
