export function generateBarrel(
	name: string,
	pascalName: string,
	options: {
		repository: boolean;
		service: boolean;
		controller: boolean;
		schema: boolean;
	},
): string {
	const exports: string[] = [];

	if (options.repository) {
		exports.push(`export { ${pascalName}Repository } from "./${name}.repository";`);
	}

	if (options.service) {
		exports.push(`export { ${pascalName}Service } from "./${name}.service";`);
	}

	if (options.controller) {
		exports.push(`export { ${pascalName}Controller } from "./${name}.controller";`);
	}

	if (options.schema) {
		exports.push(
			`export { Create${pascalName}Schema, Update${pascalName}Schema } from "./${name}.schema";`,
			`export type { Create${pascalName}Input, Update${pascalName}Input } from "./${name}.schema";`,
		);
	}

	return exports.join("\n") + "\n";
}
