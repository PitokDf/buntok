
import { TemplateEngine } from "@buntok/core/template";
import { readFileSync } from "fs";
import { join } from "path";

const engine = new TemplateEngine({});
const templatesDir = join(import.meta.dir);

// Cache loaded templates
const templateCache = new Map<string, string>();

function loadTemplate(name: string): string {
	if (templateCache.has(name)) return templateCache.get(name)!;
	const content = readFileSync(join(templatesDir, `${name}.hbs`), "utf-8");
	templateCache.set(name, content);
	return content;
}

/**
 * Render an email template with layout
 *
 * @example
 * renderEmail("welcome", {
 *   name: "John",
 *   appName: "MyApp",
 *   dashboardUrl: "https://example.com/dashboard"
 * });
 */
export function renderEmail(
	templateName: string,
	context: Record<string, unknown>,
): { html: string; subject: string } {
	const base = loadTemplate("base");
	const content = loadTemplate(templateName);

	const mergedContext = {
		appName: "Buntok Test",
		year: new Date().getFullYear(),
		...context,
	};

	// Render content template
	const renderedContent = engine.render(content, mergedContext);

	// Register rendered content as partial, then render base
	engine.registerPartial("content", renderedContent);
	const html = engine.render(base, mergedContext);

	return {
		html,
		subject: (context.subject as string) ?? templateName,
	};
}
