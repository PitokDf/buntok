import { bench, run } from "mitata";
import { z } from "zod";

// ──── Zod validation benchmarks ────

// Test schemas
const userSchema = z.object({
	name: z.string().min(1).max(100),
	email: z.string().email(),
	age: z.number().int().min(0).max(150),
	active: z.boolean(),
	tags: z.array(z.string()).optional(),
});

const postSchema = z.object({
	title: z.string().min(1).max(200),
	content: z.string().min(1),
	authorId: z.number().int().positive(),
	published: z.boolean().default(false),
	metadata: z.object({
	 views: z.number().int().default(0),
		likes: z.number().int().default(0),
	}).optional(),
});

const complexSchema = z.object({
	user: z.object({
		id: z.number(),
		profile: z.object({
			name: z.string(),
			bio: z.string().max(500).optional(),
		}),
	}),
	settings: z.object({
		theme: z.enum(["light", "dark"]),
		notifications: z.object({
			email: z.boolean(),
			push: z.boolean(),
		}),
	}),
});

// Test data
const validUser = {
	name: "John Doe",
	email: "john@example.com",
	age: 30,
	active: true,
	tags: ["admin", "user"],
};

const validPost = {
	title: "Hello World",
	content: "This is a test post content.",
	authorId: 1,
};

const invalidUser = {
	name: "",
	email: "not-an-email",
	age: -5,
	active: "yes",
};

const validComplex = {
	user: {
		id: 1,
		profile: {
			name: "John",
			bio: "Developer",
		},
	},
	settings: {
		theme: "dark",
		notifications: {
			email: true,
			push: false,
		},
	},
};

// Pre-compile schemas OUTSIDE benchmark loop
const compiledUserSchema = z.compile(userSchema);
const compiledPostSchema = z.compile(postSchema);
const compiledComplexSchema = z.compile(complexSchema);

bench("zod - raw safeParse (user)", () => {
	userSchema.safeParse(validUser);
});

bench("zod - compiled safeParse (user)", () => {
	compiledUserSchema.safeParse(validUser);
});

bench("zod - raw safeParse (post)", () => {
	postSchema.safeParse(validPost);
});

bench("zod - compiled safeParse (post)", () => {
	compiledPostSchema.safeParse(validPost);
});

bench("zod - raw safeParse (invalid user)", () => {
	userSchema.safeParse(invalidUser);
});

bench("zod - compiled safeParse (invalid user)", () => {
	compiledUserSchema.safeParse(invalidUser);
});

bench("zod - raw safeParse (complex nested)", () => {
	complexSchema.safeParse(validComplex);
});

bench("zod - compiled safeParse (complex nested)", () => {
	compiledComplexSchema.safeParse(validComplex);
});

run();
