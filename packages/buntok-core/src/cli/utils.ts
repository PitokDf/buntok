export function toSnakeCase(str: string): string {
	return str
		.replace(/([A-Z])/g, "_$1")
		.toLowerCase()
		.replace(/^_/, "")
		.replace(/-/g, "_");
}

export function toPascalCase(str: string): string {
	return str
		.split(/[-_\s]+/)
		.filter(Boolean)
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
		.join("");
}

export function toCamelCase(str: string): string {
	const pascal = toPascalCase(str);
	return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

export function toKebabCase(str: string): string {
	return toSnakeCase(str).replace(/_/g, "-");
}

const IRREGULARS: Record<string, string> = {
	person: "people",
	child: "children",
	man: "men",
	woman: "women",
	mouse: "mice",
	goose: "geese",
	tooth: "teeth",
	foot: "feet",
	knife: "knives",
	wife: "wives",
	life: "lives",
	leaf: "leaves",
	wolf: "wolves",
	half: "halves",
	shelf: "shelves",
	potato: "potatoes",
	tomato: "tomatoes",
	hero: "heroes",
	echo: "echoes",
	analysis: "analyses",
	crisis: "crises",
	thesis: "theses",
	diagnosis: "diagnoses",
	hypothesis: "hypotheses",
	basis: "bases",
	quiz: "quizzes",
};

const UNCOUNTABLE = new Set([
	"sheep",
	"fish",
	"series",
	"species",
	"deer",
	"news",
	"information",
	"equipment",
	"money",
	"furniture",
	"software",
	"hardware",
	"feedback",
	"research",
]);

/**
 * Minimal English pluralization for route/file names (zero-dep).
 * Handles irregulars, uncountables, consonant+-y, and -s/-x/-z/-ch/-sh endings.
 */
export function pluralize(word: string): string {
	const lower = word.toLowerCase();
	if (UNCOUNTABLE.has(lower)) return word;

	const irregular = IRREGULARS[lower];
	if (irregular) {
		return /^[A-Z]/.test(word)
			? irregular.charAt(0).toUpperCase() + irregular.slice(1)
			: irregular;
	}

	// Already plural? (ends in plain -s, but not -ss/-us/-is which stay singular)
	if (/s$/i.test(word) && !/(ss|us|is)$/i.test(word)) return word;

	if (/(s|x|z|ch|sh)$/i.test(word)) return `${word}es`;
	if (/[^aeiou]y$/i.test(word)) return `${word.slice(0, -1)}ies`;
	return `${word}s`;
}

export interface EntityNames {
	/** Input as passed by the user, e.g. `blog-post` */
	raw: string;
	/** User / BlogPost */
	pascal: string;
	/** user / blog_post */
	snake: string;
	/** user / blog-post */
	kebab: string;
	/** user / blogPost */
	camel: string;
	/** users / blog-posts (kebab, pluralized) */
	route: string;
	/** users / blog_posts (snake, pluralized) */
	pluralSnake: string;
}

export function resolveNames(entity: string): EntityNames {
	const snake = toSnakeCase(entity);
	const kebab = snake.replace(/_/g, "-");
	const pascal = toPascalCase(entity);
	const camel = pascal.charAt(0).toLowerCase() + pascal.slice(1);
	return {
		raw: entity,
		pascal,
		snake,
		kebab,
		camel,
		route: pluralize(kebab),
		pluralSnake: pluralize(snake),
	};
}

/**
 * Interactively select one option from a list. Returns the chosen index,
 * or `null` when stdin is not a TTY (CI / piped input) so callers fall
 * back to a deterministic default instead of hanging.
 */
export async function selectFrom(
	question: string,
	choices: string[],
	defaultIndex = 0,
): Promise<number | null> {
	if (!process.stdin.isTTY || choices.length === 0) return null;
	const { createInterface } = await import("node:readline");
	const rl = createInterface({ input: process.stdin, output: process.stdout });
	try {
		const lines = choices
			.map((choice, i) => `  ${i + 1}. ${choice}`)
			.join("\n");
		const answer: string = await new Promise((resolve) => {
			console.log(lines);
			rl.question(`${question} [${defaultIndex + 1}]: `, resolve);
		});
		const trimmed = answer.trim();
		if (trimmed === "") return defaultIndex;
		const picked = Number.parseInt(trimmed, 10);
		if (Number.isNaN(picked) || picked < 1 || picked > choices.length) return null;
		return picked - 1;
	} finally {
		rl.close();
	}
}
