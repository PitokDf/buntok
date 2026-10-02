import {
	getDefaultOptions as getInternalDefaultOptions,
	setDefaultOptions as setInternalDefaultOptions,
} from "./_lib/default-options";
import type { DefaultOptions } from "./_lib/types";

export function getDefaultOptions(): DefaultOptions {
	return Object.assign({}, getInternalDefaultOptions());
}

export function setDefaultOptions(options: DefaultOptions): void {
	const result: DefaultOptions = {};
	const defaultOptions = getDefaultOptions();

	for (const property in defaultOptions) {
		if (Object.prototype.hasOwnProperty.call(defaultOptions, property)) {
			result[property as keyof DefaultOptions] = defaultOptions[
				property as keyof DefaultOptions
			] as never;
		}
	}

	for (const property in options) {
		if (Object.prototype.hasOwnProperty.call(options, property)) {
			const key = property as keyof DefaultOptions;
			if (options[key] === undefined) {
				delete result[key];
			} else {
				result[key] = options[key] as never;
			}
		}
	}

	setInternalDefaultOptions(result);
}
