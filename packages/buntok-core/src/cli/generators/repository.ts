import { detectORMOrNull, type ORM } from "../project.js";
import { toCamelCase } from "../utils.js";

export { detectORM } from "../project.js";
export type { ORM };

export interface RepositoryOptions {
	/** Generate the BaseRepository-based variant (Prisma only). */
	base?: boolean;
}

function generatePrismaRepository(entityName: string, pascalName: string): string {
	const delegate = toCamelCase(entityName);
	return `import { prisma } from "@/lib/prisma";
import type { ${pascalName}, Prisma } from "@prisma/client";

export class ${pascalName}Repository {
  async findAll(): Promise<${pascalName}[]> {
    return prisma.${delegate}.findMany();
  }

  async findById(id: string | number): Promise<${pascalName} | null> {
    return prisma.${delegate}.findUnique({ where: { id: id as any } });
  }

  async create(data: Prisma.${pascalName}CreateInput): Promise<${pascalName}> {
    return prisma.${delegate}.create({ data });
  }

  async update(id: string | number, data: Prisma.${pascalName}UpdateInput): Promise<${pascalName}> {
    return prisma.${delegate}.update({ where: { id: id as any }, data });
  }

  async delete(id: string | number): Promise<${pascalName}> {
    return prisma.${delegate}.delete({ where: { id: id as any } });
  }

  async count(): Promise<number> {
    return prisma.${delegate}.count();
  }
}
`;
}

function generatePrismaBaseRepository(
	entityName: string,
	pascalName: string,
): string {
	return `import { BaseRepository } from "@buntok/prisma";
import { prisma } from "@/lib/prisma";
import type { ${pascalName}, Prisma } from "@prisma/client";

export class ${pascalName}Repository extends BaseRepository<
  ${pascalName},
  Prisma.${pascalName}CreateInput,
  Prisma.${pascalName}UpdateInput
> {
  constructor() {
    super(prisma, "${entityName}");
  }
}
`;
}

function generateDrizzleRepository(entityName: string, pascalName: string): string {
	return `import { count, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { ${entityName} } from "@/lib/db/schema";

export class ${pascalName}Repository {
  async findAll() {
    return db.select().from(${entityName});
  }

  async findById(id: number) {
    const results = await db.select().from(${entityName}).where(eq(${entityName}.id, id));
    return results[0] ?? null;
  }

  async create(data: typeof ${entityName}.$inferInsert) {
    const results = await db.insert(${entityName}).values(data).returning();
    return results[0];
  }

  async update(id: number, data: typeof ${entityName}.$inferUpdate) {
    const results = await db.update(${entityName}).set(data).where(eq(${entityName}.id, id)).returning();
    return results[0];
  }

  async delete(id: number) {
    await db.delete(${entityName}).where(eq(${entityName}.id, id));
    return true;
  }

  async count(): Promise<number> {
    const results = await db.select({ value: count() }).from(${entityName});
    return results[0]?.value ?? 0;
  }
}
`;
}

function generateTypeORMRepository(entityName: string, pascalName: string): string {
	return `import { AppDataSource } from "@/lib/data-source";
import { ${pascalName} } from "@/lib/entities/${pascalName}";

export class ${pascalName}Repository {
  private repo = AppDataSource.getRepository(${pascalName});

  async findAll() {
    return this.repo.find();
  }

  async findById(id: number) {
    return this.repo.findOneBy({ id });
  }

  async create(data: Partial<${pascalName}>) {
    return this.repo.save(this.repo.create(data));
  }

  async update(id: number, data: Partial<${pascalName}>) {
    await this.repo.update(id, data);
    return this.repo.findOneBy({ id });
  }

  async delete(id: number) {
    await this.repo.delete(id);
    return true;
  }

  async count(): Promise<number> {
    return this.repo.count();
  }
}
`;
}

function generatePlainRepository(pascalName: string): string {
	return `export class ${pascalName}Repository {
  private items = new Map<string | number, any>();

  async findAll(): Promise<any[]> {
    return Array.from(this.items.values());
  }

  async findById(id: string | number): Promise<any | null> {
    return this.items.get(id) ?? null;
  }

  async create(data: any): Promise<any> {
    const id = (data?.id ?? this.items.size + 1) as string | number;
    const item = { ...data, id };
    this.items.set(id, item);
    return item;
  }

  async update(id: string | number, data: any): Promise<any> {
    const item = this.items.get(id);
    if (!item) return null;
    const merged = { ...item, ...data, id };
    this.items.set(id, merged);
    return merged;
  }

  async delete(id: string | number): Promise<boolean> {
    return this.items.delete(id);
  }

  async count(): Promise<number> {
    return this.items.size;
  }
}
`;
}

/**
 * Generate repository file content based on ORM.
 * Uses the passed ORM, otherwise auto-detects from the project; when no ORM
 * is found it falls back to a plain in-memory repository. `options.base` opts
 * into the BaseRepository variant (Prisma only - Drizzle/TypeORM stay plain).
 */
export function generateRepository(
	entityName: string,
	pascalName: string,
	orm?: ORM | null,
	options?: RepositoryOptions,
): string {
	const detectedOrm = orm ?? detectORMOrNull();

	if (detectedOrm === null) {
		return generatePlainRepository(pascalName);
	}

	switch (detectedOrm) {
		case "drizzle":
			return generateDrizzleRepository(entityName, pascalName);
		case "typeorm":
			return generateTypeORMRepository(entityName, pascalName);
		case "prisma":
		default:
			return options?.base
				? generatePrismaBaseRepository(entityName, pascalName)
				: generatePrismaRepository(entityName, pascalName);
	}
}
