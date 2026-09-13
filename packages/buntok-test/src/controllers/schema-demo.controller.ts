import {
	Context,
	Controller,
	Get,
	Post,
	Use,
	type ZodCtx,
} from "@buntok/core";
import { z, zValidator } from "@buntok/core/middlewares/validator";

const AllTypesSchema = {
	// String types
	name: z.string().min(1).max(100).describe("Full name"),
	email: z.string().email().describe("Email address"),
	password: z.string().min(8).describe("Password"),
	bio: z.string().max(500).optional().describe("Short biography"),
	website: z.string().url().optional().describe("Personal website"),
	birthday: z.string().date().optional().describe("Date of birth"),
	avatar_url: z.string().url().optional().describe("Avatar image URL"),

	// Number types
	age: z.number().int().min(0).max(150).describe("User age"),
	score: z.number().min(0).max(100).describe("Score percentage"),
	latitude: z.number().min(-90).max(90).describe("Latitude coordinate"),
	longitude: z.number().min(-180).max(180).describe("Longitude coordinate"),

	// Boolean
	is_active: z.boolean().default(true).describe("Account active status"),
	is_admin: z.boolean().default(false).describe("Admin privileges"),

	// Enum
	status: z.enum(["active", "inactive", "pending"]).default("active").describe("Account status"),
	role: z.enum(["user", "editor", "admin"]).default("user").describe("User role"),
	preferred_language: z.enum(["en", "id", "ja", "ko"]).default("en").describe("Preferred language"),

	// Array
	tags: z.array(z.string()).optional().describe("User tags"),
	scores: z.array(z.number()).optional().describe("Monthly scores"),
};

@Controller("/schema-demo")
export class SchemaDemoController {
	/**
	 * POST /schema-demo/validate
	 * Demonstrates all supported OpenAPI types with zValidator
	 */
	@Post("/validate")
	@Use(
		zValidator(
			"body",
			AllTypesSchema,
			{ contentType: "application/json" },
		),
	)
	async validateBody(ctx: ZodCtx<{ body: typeof AllTypesSchema }>) {
		const body = ctx.valid("body");

		return ctx.success({
			message: "Validation successful!",
			received: {
				// String types
				name: body.name,
				email: body.email,
				password: "********", // mask password
				bio: body.bio,
				website: body.website,
				birthday: body.birthday,
				avatar_url: body.avatar_url,

				// Number types
				age: body.age,
				score: body.score,
				latitude: body.latitude,
				longitude: body.longitude,

				// Boolean
				is_active: body.is_active,
				is_admin: body.is_admin,

				// Enum
				status: body.status,
				role: body.role,
				preferred_language: body.preferred_language,

				// Array
				tags: body.tags,
				scores: body.scores,
			},
			type_info: {
				name: "string",
				email: "string (email)",
				password: "string (min: 8)",
				bio: "string (max: 500, optional)",
				website: "string (url, optional)",
				birthday: "string (date, optional)",
				avatar_url: "string (url, optional)",
				age: "integer (0-150)",
				score: "number (0-100)",
				latitude: "number (-90 to 90)",
				longitude: "number (-180 to 180)",
				is_active: "boolean",
				is_admin: "boolean",
				status: "enum: active, inactive, pending",
				role: "enum: user, editor, admin",
				preferred_language: "enum: en, id, ja, ko",
				tags: "array of strings",
				scores: "array of numbers",
			}
		});
	}

	/**
	 * GET /schema-demo/pets
	 * Query params with various types
	 */
	@Get("/pets")
	@Use(
		zValidator(
			"query",
			{
				name: z.string().optional().describe("Filter by name"),
				age_min: z.coerce.number().int().min(0).optional().describe("Minimum age"),
				age_max: z.coerce.number().int().max(100).optional().describe("Maximum age"),
				species: z.enum(["dog", "cat", "bird", "fish"]).optional().describe("Filter by species"),
				is_vaccinated: z.coerce.boolean().optional().describe("Vaccinated filter"),
				tags: z.coerce.string().optional().describe("Comma-separated tags"),
			},
			{ contentType: "application/json" },
		),
	)
	async getPets(ctx: ZodCtx<{ query: { name?: string; age_min?: number; age_max?: number; species?: string; is_vaccinated?: boolean; tags?: string } }>) {
		const query = ctx.valid("query");

		const mockPets = [
			{ id: 1, name: "Buddy", species: "dog", age: 3, is_vaccinated: true, tags: ["friendly", "trained"] },
			{ id: 2, name: "Whiskers", species: "cat", age: 2, is_vaccinated: true, tags: ["indoor"] },
			{ id: 3, name: "Goldie", species: "fish", age: 1, is_vaccinated: false, tags: ["aquarium"] },
		];

		let filtered = mockPets;

		if (query.name) {
			filtered = filtered.filter(p => p.name.toLowerCase().includes(query.name!.toLowerCase()));
		}
		if (query.age_min !== undefined) {
			filtered = filtered.filter(p => p.age >= query.age_min!);
		}
		if (query.age_max !== undefined) {
			filtered = filtered.filter(p => p.age <= query.age_max!);
		}
		if (query.species) {
			filtered = filtered.filter(p => p.species === query.species);
		}
		if (query.is_vaccinated !== undefined) {
			filtered = filtered.filter(p => p.is_vaccinated === query.is_vaccinated);
		}
		if (query.tags) {
			const filterTags = query.tags.split(",").map(t => t.trim().toLowerCase());
			filtered = filtered.filter(p => p.tags.some(t => filterTags.includes(t.toLowerCase())));
		}

		return ctx.success({
			query_used: query,
			total: filtered.length,
			pets: filtered,
		});
	}

	/**
	 * POST /schema-demo/complex
	 * Nested objects and arrays
	 */
	@Post("/complex")
	@Use(
		zValidator(
			"body",
			{
				user: z.object({
					name: z.string().min(1),
					email: z.string().email(),
					profile: z.object({
						age: z.number().int().min(0).max(150),
						bio: z.string().max(500).optional(),
						social: z.object({
							twitter: z.string().url().optional(),
							github: z.string().url().optional(),
						}).optional(),
					}),
				}),
				settings: z.object({
					theme: z.enum(["light", "dark", "system"]).default("system"),
					notifications: z.object({
						email: z.boolean().default(true),
						push: z.boolean().default(true),
						sms: z.boolean().default(false),
					}),
					language: z.enum(["en", "id"]).default("en"),
				}),
				friends: z.array(z.string().email()).max(10).optional().describe("Friend email list"),
				addresses: z.array(z.object({
					label: z.string().describe("Address label (e.g. Home, Office)"),
					street: z.string().describe("Street address"),
					city: z.string().describe("City"),
					zip: z.string().describe("ZIP / Postal code"),
					isDefault: z.boolean().default(false).describe("Use as primary address"),
				})).optional().describe("List of addresses"),
				scores: z.array(z.number().min(0).max(100)).max(10).optional().describe("Test scores (0-100)"),
			},
			{ contentType: "application/json" },
		),
	)
	async validateComplex(ctx: ZodCtx<{ body: any }>) {
		const body = ctx.valid("body");

		return ctx.success({
			message: "Complex validation successful!",
			received: {
				user: {
					...body.user,
					profile: {
						...body.user.profile,
						social: body.user.profile.social || {},
					},
				},
				settings: body.settings,
				friends: body.friends || [],
				addresses: body.addresses || [],
				scores: body.scores || [],
			}
		});
	}

	/**
	 * GET /schema-demo/health
	 * Simple endpoint without validation
	 */
	@Get("/health")
	async health() {
		return {
			status: "ok",
			timestamp: new Date().toISOString(),
			types_supported: [
				"string", "string (email)", "string (password)", "string (url)",
				"string (date)", "string (date-time)", "string (uuid)",
				"number", "integer", "boolean",
				"enum", "array", "object (nested)"
			]
		};
	}

	/**
	 * POST /schema-demo/upload
	 * Multipart form-data with all supported types
	 */
	@Post("/upload")
	@Use(
		zValidator(
			"body",
			{
				name: z.string().min(1).describe("Your name"),
				email: z.string().email().describe("Email address"),
				age: z.coerce.number().int().min(0).max(150).describe("Your age"),
				bio: z.string().max(500).optional().describe("Short biography"),
				role: z.enum(["admin", "user", "guest"]).default("user").describe("User role"),
				is_active: z.coerce.boolean().default(true).describe("Account active status"),
				scores: z.coerce.number().min(0).max(100).array().max(5).optional().describe("Test scores (0-100)"),
				tags: z.string().array().max(10).optional().describe("User tags (comma-separated)"),
				avatar: z.file().optional().describe("Profile picture (image/*)"),
			},
			{ contentType: "multipart/form-data" },
		),
	)
	async upload(ctx: ZodCtx<{ body: any }>) {
		const body = ctx.valid("body");

		return ctx.success({
			message: "Upload successful!",
			received: {
				name: body.name,
				email: body.email,
				age: body.age,
				bio: body.bio || null,
				role: body.role,
				is_active: body.is_active,
				scores: body.scores || [],
				tags: body.tags || [],
				has_avatar: !!body.avatar,
			}
		});
	}
}
