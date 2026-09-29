import { resolveNames, toCamelCase } from "../utils.js";
import type { ORM } from "./repository.js";

export interface ControllerOptions {
	/** Generate the BaseController-based variant. */
	base?: boolean;
	/** Override the route prefix (default: pluralized entity name). */
	route?: string;
}

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

function generatePlainController(
	entityName: string,
	pascalName: string,
	route: string,
): string {
	const serviceProp = `${toCamelCase(entityName)}Service`;
	return `import { Dependencies, Controller, Get, Post, Put, Delete } from "@buntok/core";
import type { Context } from "@buntok/core";
import { ${pascalName}Service } from "./${entityName}.service";

@Dependencies(${pascalName}Service)
@Controller("/${route}")
export class ${pascalName}Controller {
  constructor(private readonly ${serviceProp}: ${pascalName}Service) {}

  private parseId(id: string): string | number {
    if (id === "") return id;
    const num = Number(id);
    return Number.isNaN(num) ? id : num;
  }

  @Get("/")
  async getAll(ctx: Context) {
    const data = await this.${serviceProp}.getAll();
    return ctx.success(data);
  }

  @Get("/:id")
  async getById(ctx: Context) {
    const id = this.parseId(ctx.params.id ?? "");
    const data = await this.${serviceProp}.getById(id);
    return ctx.success(data);
  }

  @Post("/")
  async create(ctx: Context) {
    const body = await ctx.body();
    const data = await this.${serviceProp}.create(body);
    return ctx.success(data, "Created successfully!.", 201);
  }

  @Put("/:id")
  async update(ctx: Context) {
    const id = this.parseId(ctx.params.id ?? "");
    const body = await ctx.body();
    const data = await this.${serviceProp}.update(id, body);
    return ctx.success(data);
  }

  @Delete("/:id")
  async delete(ctx: Context) {
    const id = this.parseId(ctx.params.id ?? "");
    await this.${serviceProp}.delete(id);
    return ctx.status(204);
  }
}
`;
}

function generateBaseController(
	entityName: string,
	pascalName: string,
	route: string,
	typeImport: string,
	typeRef: string,
): string {
	return `import { Dependencies, Controller, BaseController } from "@buntok/core";
import { ${pascalName}Service } from "./${entityName}.service";
${typeImport}

@Dependencies(${pascalName}Service)
@Controller("/${route}")
export class ${pascalName}Controller extends BaseController<${typeRef}> {
  constructor(private readonly ${toCamelCase(entityName)}Service: ${pascalName}Service) {
    super(${toCamelCase(entityName)}Service);
  }
}
`;
}

function generateStubController(
	entityName: string,
	pascalName: string,
	route: string,
): string {
	return `import { Controller, Get, Post, Put, Delete } from "@buntok/core";
import type { Context } from "@buntok/core";

@Controller("/${route}")
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

/**
 * Generate controller file content.
 * Default is plain (explicit CRUD endpoints delegating to the service);
 * `options.base` opts into the BaseController variant.
 * Route prefix is pluralized (`category` → `/categories`), overridable via `options.route`.
 */
export function generateController(
	entityName: string,
	pascalName: string,
	withService: boolean = true,
	orm?: ORM,
	options?: ControllerOptions,
): string {
	const route = options?.route ?? resolveNames(entityName).route;

	if (withService) {
		const detectedOrm = orm ?? "prisma";
		let typeImport: string;
		let typeRef: string;

		switch (detectedOrm) {
			case "drizzle":
				typeImport = getDrizzleType(entityName);
				typeRef = pascalName;
				break;
			case "typeorm":
				typeImport = getTypeORMType(pascalName);
				typeRef = pascalName;
				break;
			case "prisma":
			default:
				typeImport = getPrismaType(pascalName);
				typeRef = pascalName;
				break;
		}

		return options?.base
			? generateBaseController(
					entityName,
					pascalName,
					route,
					typeImport,
					typeRef,
				)
			: generatePlainController(entityName, pascalName, route);
	}

	return generateStubController(entityName, pascalName, route);
}
