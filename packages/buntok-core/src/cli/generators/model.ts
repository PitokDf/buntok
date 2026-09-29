import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Model-aware generation: a hand-rolled Prisma schema parser (zero deps)
 * with a universal `--fields` fallback for projects without Prisma.
 */

export interface FieldDef {
	name: string;
	/** Prisma scalar name (String, Int, ...) or a logical kind from `--fields`. */
	type: string;
	optional: boolean;
	list: boolean;
	isId: boolean;
	unique: boolean;
	/** Field has @default / @createdAt / @updatedAt → not part of create input. */
	hasDefault: boolean;
	isEnum: boolean;
}

export interface PrismaModel {
	name: string;
	fields: FieldDef[];
}

export interface PrismaSchema {
	models: Map<string, PrismaModel>;
	enums: Map<string, string[]>;
}

const SCALARS = new Set([
	"String",
	"Int",
	"Float",
	"Decimal",
	"BigInt",
	"Boolean",
	"DateTime",
	"Json",
	"Bytes",
]);

const SCHEMA_CANDIDATES = ["prisma/schema.prisma", "schema.prisma"];

function stripComments(source: string): string {
	let out = "";
	let inString: '"' | "'" | null = null;
	for (let i = 0; i < source.length; i++) {
		const ch = source[i];
		if (inString) {
			out += ch;
			if (ch === inString && source[i - 1] !== "\\") inString = null;
			continue;
		}
		if (ch === '"' || ch === "'") {
			inString = ch;
			out += ch;
			continue;
		}
		if (ch === "/" && source[i + 1] === "/") {
			while (i < source.length && source[i] !== "\n") i++;
			out += "\n";
			continue;
		}
		out += ch;
	}
	return out;
}

function extractBlocks(
	source: string,
	kind: "model" | "enum",
): { name: string; body: string }[] {
	const blocks: { name: string; body: string }[] = [];
	const re = new RegExp(`\\b${kind}\\s+([A-Za-z_]\\w*)\\s*\\{`, "g");
	let match: RegExpExecArray | null;
	while ((match = re.exec(source)) !== null) {
		let depth = 0;
		let i = re.lastIndex - 1;
		for (; i < source.length; i++) {
			if (source[i] === "{") depth++;
			else if (source[i] === "}") {
				depth--;
				if (depth === 0) break;
			}
		}
		blocks.push({ name: match[1] ?? "", body: source.slice(re.lastIndex, i) });
		re.lastIndex = i + 1;
	}
	return blocks;
}

function parseFieldLine(line: string): FieldDef | null {
	const trimmed = line.trim();
	if (!trimmed || trimmed.startsWith("@@")) return null;
	const m = /^([A-Za-z_]\w*)\s+([A-Za-z_]\w*)(\[\])?(\?)?/.exec(trimmed);
	if (!m) return null;
	const [, name = "", fieldType = "", list, optional] = m;
	const attrs = trimmed.slice(m[0].length);
	return {
		name,
		type: fieldType,
		optional: Boolean(optional),
		list: Boolean(list),
		isId: /@id\b/.test(attrs),
		unique: /@unique\b/.test(attrs),
		hasDefault: /@default\b|@updatedAt\b/.test(attrs),
		isEnum: !SCALARS.has(fieldType),
	};
}

export function parsePrismaSchema(source: string): PrismaSchema {
	const clean = stripComments(source);
	const models = new Map<string, PrismaModel>();
	const enums = new Map<string, string[]>();

	for (const block of extractBlocks(clean, "enum")) {
		// Tokenize so both single-line and multi-line enum bodies work
		const values = block.body
			.split(/\s+/)
			.filter((t) => /^[A-Za-z_]\w*$/.test(t));
		enums.set(block.name.toLowerCase(), values);
	}
	for (const block of extractBlocks(clean, "model")) {
		const fields = block.body
			.split("\n")
			.map(parseFieldLine)
			.filter((f): f is FieldDef => f !== null);
		models.set(block.name.toLowerCase(), {
			name: block.name,
			fields,
		});
	}
	return { models, enums };
}

/** Locate and parse the project's Prisma schema; null when absent/unparsable. */
export function loadPrismaSchema(): PrismaSchema | null {
	for (const candidate of SCHEMA_CANDIDATES) {
		const path = join(process.cwd(), candidate);
		if (!existsSync(path)) continue;
		try {
			return parsePrismaSchema(readFileSync(path, "utf-8"));
		} catch {
			return null;
		}
	}
	return null;
}

/** Case-insensitive model lookup (plural route names like `users` also match). */
export function getEntityModel(
	entityName: string,
	schema?: PrismaSchema | null,
): PrismaModel | null {
	const s = schema ?? loadPrismaSchema();
	if (!s) return null;
	const key = entityName.toLowerCase().replace(/s$/, "");
	for (const [modelKey, model] of s.models) {
		if (modelKey === key || modelKey === entityName.toLowerCase()) return model;
	}
	return null;
}

const FIELD_TYPE_ALIASES: Record<string, string> = {
	string: "String",
	int: "Int",
	integer: "Int",
	float: "Float",
	number: "Float",
	decimal: "Decimal",
	bigint: "BigInt",
	boolean: "Boolean",
	bool: "Boolean",
	date: "DateTime",
	datetime: "DateTime",
	json: "Json",
	bytes: "Bytes",
};

/**
 * Universal fallback: `--fields title:string,body:string,published:boolean?`
 * Types: string, int, float, number, decimal, boolean, date, json (+ `[]`
 * for lists, `?` for optional).
 */
export function parseFieldsFlag(value: string): FieldDef[] {
	const fields: FieldDef[] = [];
	for (const part of value.split(",")) {
		const trimmed = part.trim();
		if (!trimmed) continue;
		const m = /^([A-Za-z_]\w*)\s*:\s*([A-Za-z_]\w*)(\[\])?(\?)?$/.exec(trimmed);
		if (!m) continue;
		const [, name = "", rawType = "", list, optional] = m;
		const type = FIELD_TYPE_ALIASES[rawType.toLowerCase()] ?? rawType;
		fields.push({
			name,
			type,
			optional: Boolean(optional),
			list: Boolean(list),
			isId: false,
			unique: false,
			hasDefault: false,
			isEnum: !SCALARS.has(type),
		});
	}
	return fields;
}

/** Create inputs exclude auto-generated columns (@id w/ default, @updatedAt). */
export function isAutoGenerated(field: FieldDef): boolean {
	return field.isId || field.hasDefault;
}

function zodScalar(field: FieldDef, schema?: PrismaSchema | null): string {
	const inner = (() => {
		switch (field.type) {
			case "String":
				return "z.string()";
			case "Int":
				return "z.number().int()";
			case "Float":
			case "BigInt":
				return "z.number()";
			case "Decimal":
				return "z.union([z.number(), z.string()])";
			case "Boolean":
				return "z.boolean()";
			case "DateTime":
				return "z.string()";
			case "Json":
			case "Bytes":
				return "z.any()";
			default: {
				const enumValues = schema?.enums.get(field.type.toLowerCase());
				if (enumValues && enumValues.length > 0) {
					return `z.enum([${enumValues.map((v) => `"${v}"`).join(", ")}])`;
				}
				return "z.string()";
			}
		}
	})();
	return inner;
}

function zodFor(field: FieldDef, schema?: PrismaSchema | null): string {
	let out = field.list ? `z.array(${zodScalar(field, schema)})` : zodScalar(field, schema);
	if (field.optional) out += ".optional()";
	return out;
}

/** Zod object body lines for the create schema (update = .partial()). */
export function zodLinesForFields(
	fields: FieldDef[],
	schema?: PrismaSchema | null,
): string[] {
	const used = new Set<string>();
	const lines: string[] = [];
	for (const field of fields) {
		if (isAutoGenerated(field) || used.has(field.name)) continue;
		used.add(field.name);
		lines.push(`${field.name}: ${zodFor(field, schema)},`);
	}
	return lines;
}

function fakerFor(field: FieldDef, schema?: PrismaSchema | null): string {
	const enumValues = field.isEnum
		? schema?.enums.get(field.type.toLowerCase())
		: undefined;
	const scalar = (() => {
		if (enumValues && enumValues.length > 0) {
			return `faker.helpers.arrayElement([${enumValues.map((v) => `"${v}"`).join(", ")}])`;
		}
		switch (field.type) {
			case "String":
				if (/mail/i.test(field.name)) return "faker.internet.email()";
				if (/^name$|username|full_?name|first_?name|last_?name/i.test(field.name))
					return "faker.person.fullName()";
				if (/url|href|link/i.test(field.name)) return "faker.internet.url()";
				if (/slug/i.test(field.name)) return "faker.helpers.slug()";
				return "faker.lorem.words()";
			case "Int":
				return "faker.number.int({ max: 10000 })";
			case "Float":
			case "Decimal":
			case "BigInt":
				return "faker.number.float()";
			case "Boolean":
				return "faker.datatype.boolean()";
			case "DateTime":
				return "faker.date.recent().toISOString()";
			case "Json":
			case "Bytes":
				return "faker.lorem.sentence()";
			default:
				return "faker.lorem.words()";
		}
	})();
	return field.list ? `Array.from({ length: 3 }, () => ${scalar})` : scalar;
}

/** Faker assignment lines for factory `build()` bodies. */
export function fakerLinesForFields(
	fields: FieldDef[],
	schema?: PrismaSchema | null,
): string[] {
	const used = new Set<string>();
	const lines: string[] = [];
	for (const field of fields) {
		if (isAutoGenerated(field) || used.has(field.name)) continue;
		used.add(field.name);
		lines.push(`${field.name}: ${fakerFor(field, schema)},`);
	}
	return lines;
}

function tsTypeFor(field: FieldDef, schema?: PrismaSchema | null): string {
	const base = (() => {
		if (field.isEnum) {
			const values = schema?.enums.get(field.type.toLowerCase());
			if (values && values.length > 0) return values.map((v) => `"${v}"`).join(" | ");
			return "string";
		}
		switch (field.type) {
			case "Int":
			case "Float":
			case "Decimal":
			case "BigInt":
				return "number";
			case "Boolean":
				return "boolean";
			case "Json":
			case "Bytes":
				return "unknown";
			default:
				return "string";
		}
	})();
	return field.list ? `${base}[]` : base;
}

/** TypeScript member lines for an inline model type (non-Prisma factories). */
export function tsLinesForFields(
	fields: FieldDef[],
	schema?: PrismaSchema | null,
): string[] {
	const used = new Set<string>();
	const lines: string[] = [];
	for (const field of fields) {
		if (used.has(field.name)) continue;
		used.add(field.name);
		const optional = field.optional ? "?" : "";
		lines.push(`${field.name}${optional}: ${tsTypeFor(field, schema)};`);
	}
	return lines;
}
