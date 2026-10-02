import type { DefaultOptions } from "./types";

let defaultOptions: DefaultOptions = {};

export function getDefaultOptions(): DefaultOptions {
	return defaultOptions;
}

export function setDefaultOptions(newOptions: DefaultOptions): void {
	defaultOptions = newOptions;
}
