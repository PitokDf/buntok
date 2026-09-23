/**
 * Type-safe data factory for generating test and seed data.
 *
 * @example
 * ```ts
 * import { Factory } from "@buntok/core";
 * import { faker } from "@faker-js/faker";
 *
 * interface User {
 *   id: number;
 *   name: string;
 *   email: string;
 *   role: "user" | "admin";
 * }
 *
 * const UserFactory = Factory.define<User>(() => ({
 *   id: faker.number.int({ max: 10000 }),
 *   name: faker.person.fullName(),
 *   email: faker.internet.email(),
 *   role: faker.helpers.arrayElement(["user", "admin"]),
 * }));
 *
 * // Create one
 * const user = await UserFactory.create();
 *
 * // Create many
 * const users = await UserFactory.createMany(10);
 *
 * // Override fields
 * const admin = await UserFactory.create({ role: "admin" });
 * ```
 */
export class Factory<T extends Record<string, any>> {
	private definition: () => T;
	private overrides: Partial<T> = {};
	private _afterCreate?: (item: T) => void | Promise<void>;

	private constructor(definition: () => T) {
		this.definition = definition;
	}

	/**
	 * Define a new factory for type T.
	 */
	static define<T extends Record<string, any>>(
		definition: () => T,
	): Factory<T> {
		return new Factory<T>(definition);
	}

	/**
	 * Set default overrides for all created items.
	 */
	withDefaults(defaults: Partial<T>): this {
		this.overrides = { ...this.overrides, ...defaults };
		return this;
	}

	/**
	 * Register a callback to run after each item is created.
	 */
	afterCreate(callback: (item: T) => void | Promise<void>): this {
		this._afterCreate = callback;
		return this;
	}

	/**
	 * Create a single item. Override fields per-call.
	 */
	async create(overrides?: Partial<T>): Promise<T> {
		const item = { ...this.definition(), ...this.overrides, ...overrides };
		if (this._afterCreate) {
			await this._afterCreate(item);
		}
		return item;
	}

	/**
	 * Create multiple items.
	 */
	async createMany(count: number, overrides?: Partial<T>): Promise<T[]> {
		const items: T[] = [];
		for (let i = 0; i < count; i++) {
			const item = { ...this.definition(), ...this.overrides, ...overrides };
			if (this._afterCreate) {
				await this._afterCreate(item);
			}
			items.push(item);
		}
		return items;
	}

	/**
	 * Generate a single item synchronously (no afterCreate hook).
	 */
	build(overrides?: Partial<T>): T {
		return { ...this.definition(), ...this.overrides, ...overrides };
	}

	/**
	 * Generate multiple items synchronously.
	 */
	buildMany(count: number, overrides?: Partial<T>): T[] {
		const items: T[] = [];
		for (let i = 0; i < count; i++) {
			items.push({ ...this.definition(), ...this.overrides, ...overrides });
		}
		return items;
	}

	/**
	 * Create a lazy reference to another factory's field.
	 * Useful for relations.
	 *
	 * @example
	 * ```ts
	 * const PostFactory = Factory.define(() => ({
	 *   id: faker.number.int(),
	 *   userId: Factory.ref(() => UserFactory.build().id),
	 * }));
	 * ```
	 */
	static ref<T>(resolver: () => T): T {
		return resolver() as T;
	}

	/**
	 * Pick random items from an array.
	 */
	static pick<T>(arr: readonly T[], count: number = 1): T | T[] {
		if (arr.length === 0) {
			throw new Error("Cannot pick from empty array");
		}
		if (count === 1) {
			const idx = Math.floor(Math.random() * arr.length);
			return arr[idx] as T;
		}
		const shuffled = [...arr].sort(() => Math.random() - 0.5);
		return shuffled.slice(0, Math.min(count, arr.length));
	}
}
