import type { ORM } from "./repository.js";

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

export function generateService(
	entityName: string,
	pascalName: string,
	withRepo: boolean = true,
	orm?: ORM,
): string {
	if (withRepo) {
		const detectedOrm = orm ?? "prisma";
		let typeImport: string;
		let typeRef: string;

		switch (detectedOrm) {
			case "drizzle":
				typeImport = getDrizzleType(entityName);
				typeRef = `${pascalName}`;
				break;
			case "typeorm":
				typeImport = getTypeORMType(pascalName);
				typeRef = `${pascalName}`;
				break;
			case "prisma":
			default:
				typeImport = getPrismaType(pascalName);
				typeRef = `${pascalName}`;
				break;
		}

		return `import { Dependencies, BaseService } from "@buntok/core";
import { ${pascalName}Repository } from "./${entityName}.repository";
${typeImport}

@Dependencies(${pascalName}Repository)
export class ${pascalName}Service extends BaseService<${typeRef}> {
  constructor(private readonly ${entityName}Repository: ${pascalName}Repository) {
    super(${entityName}Repository);
  }
}
`;
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
