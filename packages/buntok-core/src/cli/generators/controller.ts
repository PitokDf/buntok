import type { ORM } from "./repository.js";

function getPrismaType(pascalName: string): string {
	return `import type { ${pascalName} } from "@prisma/client";`;
}

function getDrizzleType(_entityName: string): string {
	const pascalName = _entityName.charAt(0).toUpperCase() + _entityName.slice(1);
	return `import type { InferSelectModel } from "drizzle-orm";
import { ${_entityName} } from "@/lib/db/schema";

type ${pascalName} = InferSelectModel<typeof ${_entityName}>;`;
}

function getTypeORMType(pascalName: string): string {
	return `import type { ${pascalName} } from "@/lib/entities/${pascalName}";`;
}

export function generateController(
	entityName: string,
	pascalName: string,
	withService: boolean = true,
	orm?: ORM,
): string {
	if (withService) {
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

		return `import { Dependencies, Controller, BaseController } from "@buntok/core";
import { ${pascalName}Service } from "./${entityName}.service";
${typeImport}

@Dependencies(${pascalName}Service)
@Controller("/${entityName}s")
export class ${pascalName}Controller extends BaseController<${typeRef}> {
  constructor(private readonly ${entityName}Service: ${pascalName}Service) {
    super(${entityName}Service);
  }
}
`;
	}

	return `import { Controller, Get, Post, Put, Delete } from "@buntok/core";
import type { Context } from "@buntok/core";

@Controller("/${entityName}s")
export class ${pascalName}Controller {
  @Get("/")
  async getAll(ctx: Context) {
    return ctx.success([], "Records retrieved successfully");
  }

  @Get("/:id")
  async getById(ctx: Context) {
    return ctx.success({ id: ctx.params.id }, "Record retrieved successfully");
  }

  @Post("/")
  async create(ctx: Context) {
    const data = await ctx.body<any>();
    return ctx.success(data, "Record created successfully", 201);
  }

  @Put("/:id")
  async update(ctx: Context) {
    const data = await ctx.body<any>();
    return ctx.success({ id: ctx.params.id, ...data }, "Record updated successfully");
  }

  @Delete("/:id")
  async delete(ctx: Context) {
    return ctx.success(null, "Record deleted successfully");
  }
}
`;
}
