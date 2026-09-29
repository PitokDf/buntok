import { describe, expect, it } from "bun:test";
import {
	fakerLinesForFields,
	getEntityModel,
	parseFieldsFlag,
	parsePrismaSchema,
	tsLinesForFields,
	zodLinesForFields,
} from "../../src/cli/generators/model";

const SCHEMA = `// Prisma schema
enum Role {
  USER
  ADMIN
}

enum Status { DRAFT PUBLISHED }

model Article {
  id        String   @id @default(cuid())
  title     String
  body      String?
  views     Int      @default(0)
  published Boolean  @default(false)
  status    Status   @default(DRAFT)
  author    Role
  tags      String[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("articles")
}
`;

describe("model: parsePrismaSchema", () => {
	const schema = parsePrismaSchema(SCHEMA);

	it("extracts models and fields", () => {
		expect(schema.models.size).toBe(1);
		const article = schema.models.get("article");
		expect(article?.name).toBe("Article");
		expect(article?.fields.map((f) => f.name)).toEqual([
			"id",
			"title",
			"body",
			"views",
			"published",
			"status",
			"author",
			"tags",
			"createdAt",
			"updatedAt",
		]);
	});

	it("marks attributes correctly", () => {
		const fields = parsePrismaSchema(SCHEMA).models.get("article")?.fields ?? [];
		const byName = Object.fromEntries(fields.map((f) => [f.name, f]));
		expect(byName.id?.isId).toBe(true);
		expect(byName.id?.hasDefault).toBe(true);
		expect(byName.title?.isId).toBe(false);
		expect(byName.body?.optional).toBe(true);
		expect(byName.tags?.list).toBe(true);
		expect(byName.tags?.type).toBe("String");
		expect(byName.updatedAt?.hasDefault).toBe(true);
	});

	it("parses enums including single-line bodies and ignores @@attributes", () => {
		const s = parsePrismaSchema(SCHEMA);
		expect(s.enums.get("role")).toEqual(["USER", "ADMIN"]);
		expect(s.enums.get("status")).toEqual(["DRAFT", "PUBLISHED"]);
		const article = s.models.get("article");
		expect(article?.fields.some((f) => f.name.startsWith("@@"))).toBe(false);
	});

	it("ignores comments", () => {
		const s = parsePrismaSchema(`model Note {
  // id String @id
  title String
}`);
		const note = s.models.get("note");
		expect(note?.fields.map((f) => f.name)).toEqual(["title"]);
	});

	it("looks up models case-insensitively and tolerates plural names", () => {
		const s = parsePrismaSchema(SCHEMA);
		expect(getEntityModel("article", s)?.name).toBe("Article");
		expect(getEntityModel("ARTICLE", s)?.name).toBe("Article");
		expect(getEntityModel("articles", s)?.name).toBe("Article");
		expect(getEntityModel("missing", s)).toBeNull();
	});
});

describe("model: --fields flag", () => {
	it("parses simple fields", () => {
		const fields = parseFieldsFlag("title:string,done:boolean");
		expect(fields).toHaveLength(2);
		expect(fields[0]).toMatchObject({ name: "title", type: "String" });
		expect(fields[1]).toMatchObject({ name: "done", type: "Boolean" });
	});

	it("parses optional and list markers", () => {
		const fields = parseFieldsFlag("body:string?,tags:string[]");
		expect(fields[0]).toMatchObject({ name: "body", optional: true });
		expect(fields[1]).toMatchObject({ name: "tags", list: true });
	});

	it("normalizes aliases and skips invalid segments", () => {
		const fields = parseFieldsFlag("age:int,price:number,???,ok:boolean");
		expect(fields.map((f) => [f.name, f.type])).toEqual([
			["age", "Int"],
			["price", "Float"],
			["ok", "Boolean"],
		]);
	});
});

describe("model: zodLinesForFields", () => {
	it("maps scalars, optionals and lists", () => {
		const fields = parseFieldsFlag("title:string,age:int,active:boolean,note:string?,tags:string[]");
		expect(zodLinesForFields(fields, null)).toEqual([
			"title: z.string(),",
			"age: z.number().int(),",
			"active: z.boolean(),",
			"note: z.string().optional(),",
			"tags: z.array(z.string()),",
		]);
	});

	it("skips auto-generated fields (@id and @default)", () => {
		const schema = parsePrismaSchema(SCHEMA);
		const article = getEntityModel("article", schema);
		const lines = zodLinesForFields(article?.fields ?? [], schema);
		const joined = lines.join("\n");
		expect(joined).not.toContain("id:");
		expect(joined).not.toContain("views:");
		expect(joined).not.toContain("createdAt:");
		expect(joined).not.toContain("updatedAt:");
		expect(joined).not.toContain("status:");
		expect(joined).not.toContain("published:");
		expect(joined).toContain("title: z.string(),");
		expect(joined).toContain("body: z.string().optional(),");
	});

	it("renders enums as z.enum", () => {
		const schema = parsePrismaSchema(SCHEMA);
		const article = getEntityModel("article", schema);
		const lines = zodLinesForFields(article?.fields ?? [], schema);
		expect(lines).toContain('author: z.enum(["USER", "ADMIN"]),');
	});
});

describe("model: fakerLinesForFields", () => {
	it("picks name-aware fakers", () => {
		const fields = parseFieldsFlag("email:string,name:string,url:string,age:int,active:boolean");
		const lines = fakerLinesForFields(fields, null);
		expect(lines[0]).toContain("faker.internet.email()");
		expect(lines[1]).toContain("faker.person.fullName()");
		expect(lines[2]).toContain("faker.internet.url()");
		expect(lines[3]).toContain("faker.number.int(");
		expect(lines[4]).toContain("faker.datatype.boolean()");
	});

	it("uses arrayElement for enums and repeats lists", () => {
		const schema = parsePrismaSchema(SCHEMA);
		const article = getEntityModel("article", schema);
		const lines = fakerLinesForFields(article?.fields ?? [], schema);
		const author = lines.find((l) => l.startsWith("author:"));
		expect(author).toContain('faker.helpers.arrayElement(["USER", "ADMIN"])');
		const tags = lines.find((l) => l.startsWith("tags:"));
		expect(tags).toContain("Array.from({ length: 3 }");
	});
});

describe("model: tsLinesForFields", () => {
	it("maps to TypeScript types with optionals", () => {
		const fields = parseFieldsFlag("title:string,age:int,active:boolean,note:string?");
		expect(tsLinesForFields(fields, null)).toEqual([
			"title: string;",
			"age: number;",
			"active: boolean;",
			"note?: string;",
		]);
	});
});
