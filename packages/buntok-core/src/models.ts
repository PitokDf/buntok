const registry = new Map<string, unknown>();

export function registerModel(name: string, schema: unknown): void {
	registry.set(name, schema);
}

export function getModel(name: string): unknown {
	return registry.get(name);
}

export function resolveModel<T>(schema: T | string): T {
	if (typeof schema !== "string") return schema;
	const found = registry.get(schema);
	if (found === undefined) {
		throw new Error(
			`Unknown model "${schema}". Register it with app.model("${schema}", schema) before routes use it.`,
		);
	}
	return found as T;
}
