import { describe, expect, it } from "bun:test";
import {
	pluralize,
	resolveNames,
	toCamelCase,
	toKebabCase,
	toPascalCase,
	toSnakeCase,
} from "../../src/cli/utils";

describe("utils: casing", () => {
	it("toPascalCase splits on dashes, underscores and spaces", () => {
		expect(toPascalCase("blog-post")).toBe("BlogPost");
		expect(toPascalCase("blog_post")).toBe("BlogPost");
		expect(toPascalCase("blog post")).toBe("BlogPost");
		expect(toPascalCase("category")).toBe("Category");
		expect(toPascalCase("UserProfile")).toBe("Userprofile");
	});

	it("toSnakeCase converts PascalCase and kebab-case", () => {
		expect(toSnakeCase("BlogPost")).toBe("blog_post");
		expect(toSnakeCase("blog-post")).toBe("blog_post");
		expect(toSnakeCase("user")).toBe("user");
	});

	it("toCamelCase lowercases the first letter", () => {
		expect(toCamelCase("blog-post")).toBe("blogPost");
		expect(toCamelCase("user")).toBe("user");
	});

	it("toKebabCase converts to dashes", () => {
		expect(toKebabCase("blog_post")).toBe("blog-post");
		expect(toKebabCase("BlogPost")).toBe("blog-post");
	});
});

describe("utils: pluralize", () => {
	it("adds a plain -s", () => {
		expect(pluralize("user")).toBe("users");
		expect(pluralize("order")).toBe("orders");
	});

	it("handles consonant + y", () => {
		expect(pluralize("category")).toBe("categories");
		expect(pluralize("blog-post")).toBe("blog-posts");
	});

	it("adds -es for s/x/z/ch/sh endings", () => {
		expect(pluralize("bus")).toBe("buses");
		expect(pluralize("status")).toBe("statuses");
		expect(pluralize("box")).toBe("boxes");
		expect(pluralize("match")).toBe("matches");
		expect(pluralize("dish")).toBe("dishes");
	});

	it("keeps already-plural words as-is", () => {
		expect(pluralize("users")).toBe("users");
		expect(pluralize("categories")).toBe("categories");
		expect(pluralize("news")).toBe("news");
	});

	it("keeps uncountables as-is", () => {
		expect(pluralize("sheep")).toBe("sheep");
		expect(pluralize("information")).toBe("information");
	});

	it("supports common irregulars", () => {
		expect(pluralize("person")).toBe("people");
		expect(pluralize("child")).toBe("children");
		expect(pluralize("Person")).toBe("People");
	});
});

describe("utils: resolveNames", () => {
	it("resolves a simple entity", () => {
		const names = resolveNames("user");
		expect(names).toEqual({
			raw: "user",
			pascal: "User",
			snake: "user",
			kebab: "user",
			camel: "user",
			route: "users",
			pluralSnake: "users",
		});
	});

	it("resolves a multi-word entity with plural route", () => {
		const names = resolveNames("blog-post");
		expect(names.pascal).toBe("BlogPost");
		expect(names.camel).toBe("blogPost");
		expect(names.snake).toBe("blog_post");
		expect(names.route).toBe("blog-posts");
		expect(names.pluralSnake).toBe("blog_posts");
	});

	it("does not double-pluralize", () => {
		expect(resolveNames("categories").route).toBe("categories");
	});
});
