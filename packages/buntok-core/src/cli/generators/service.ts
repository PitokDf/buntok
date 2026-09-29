import type { ORM } from "./repository.js";
import { toCamelCase } from "../utils.js";

export interface ServiceOptions {
	/** Generate the BaseService-based variant. */
	base?: boolean;
}

function getPrismaType(pascalName: string): string {
	return `import type { ${pascalName} } from "@prisma/client";`;
}

function getDrizzleType(_entityName: string): string {
	return `import type { InferSelectModel } from "drizzle-orm";
import { ${_entityName} } from "@/lib/db/schema";

type ${_entityName.charAt(0).toUpperCase() + _entityName.slice(1)} = InferSelectModel<typeof ${_entityName}>;`;
}

function getTypeORMType(pascalName: string): string {
	return `import type { ${pascalName} } from "@/lib/entities/${pascalName}";`;
}

function resolveTypeRef(
	entityName: string,
	pascalName: string,
	detectedOrm: ORM,
): { typeImport: string; typeRef: string } {
	switch (detectedOrm) {
		case "drizzle":
			return { typeImport: getDrizzleType(entityName), typeRef: pascalName };
		case "typeorm":
			return { typeImport: getTypeORMType(pascalName), typeRef: pascalName };
		case "prisma":
		default:
			return { typeImport: getPrismaType(pascalName), typeRef: pascalName };
	}
}

function generatePlainService(
	entityName: string,
	pascalName: string,
	typeImport: string,
	typeRef: string,
): string {
	const repoProp = `${toCamelCase(entityName)}Repository`;
	return `import { Dependencies, NotFoundError } from "@buntok/core";
import { ${pascalName}Repository } from "./${entityName}.repository";
${typeImport}

@Dependencies(${pascalName}Repository)
export class ${pascalName}Service {
  constructor(private readonly ${repoProp}: ${pascalName}Repository) {}

  async getAll(): Promise<${typeRef}[]> {
    return this.${repoProp}.findAll();
  }

  async getById(id: string | number): Promise<${typeRef}> {
    const item = await this.${repoProp}.findById(id);
    if (!item) throw new NotFoundError(\`Data dengan id \${id} tidak ditemukan\`);
    return item;
  }

  async create(data: any): Promise<${typeRef}> {
    return this.${repoProp}.create(data);
  }

  async update(id: string | number, data: any): Promise<${typeRef}> {
    await this.getById(id);
    return this.${repoProp}.update(id, data);
  }

  async delete(id: string | number): Promise<${typeRef} | boolean> {
    await this.getById(id);
    return this.${repoProp}.delete(id);
  }

  async count(): Promise<number> {
    return this.${repoProp}.count();
  }
}
`;
}

function generateBaseService(
	entityName: string,
	pascalName: string,
	typeImport: string,
	typeRef: string,
): string {
	const repoProp = `${toCamelCase(entityName)}Repository`;
	return `import { Dependencies, BaseService } from "@buntok/core";
import { ${pascalName}Repository } from "./${entityName}.repository";
${typeImport}

@Dependencies(${pascalName}Repository)
export class ${pascalName}Service extends BaseService<${typeRef}> {
  constructor(private readonly ${repoProp}: ${pascalName}Repository) {
    super(${repoProp});
  }
}
`;
}

export function generateService(
	entityName: string,
	pascalName: string,
	withRepo: boolean = true,
	orm?: ORM,
	options?: ServiceOptions,
): string {
	if (withRepo) {
		const detectedOrm = orm ?? "prisma";
		const { typeImport, typeRef } = resolveTypeRef(
			entityName,
			pascalName,
			detectedOrm,
		);

		return options?.base
			? generateBaseService(entityName, pascalName, typeImport, typeRef)
			: generatePlainService(entityName, pascalName, typeImport, typeRef);
	}

	return `export class ${pascalName}Service {
  async getAll(): Promise<any[]> {
    return [];
  }

  async getById(id: string): Promise<any> {
    return { id };
  }

  async create(data: any): Promise<any> {
    return data;
  }

  async update(id: string, data: any): Promise<any> {
    return { id, ...data };
  }

  async delete(id: string): Promise<boolean> {
    return true;
  }
}
`;
}
