export interface MailAttachment {
	filename: string;
	/** Buffer, base64 string, or file path */
	content?: Buffer | string;
	/** Remote URL (Resend only) */
	path?: string;
	/** MIME type (e.g., "application/pdf", "image/png") */
	contentType?: string;
	/** Content-ID for inline images (e.g., "logo" for cid:logo) */
	cid?: string;
}

export interface MailOptions {
	from: string;
	to: string | string[];
	/** Carbon Copy recipients */
	cc?: string | string[];
	/** Blind Carbon Copy recipients */
	bcc?: string | string[];
	/** Reply-To address (different from from) */
	replyTo?: string | string[];
	subject: string;
	text?: string;
	html?: string;
	/** File attachments */
	attachments?: MailAttachment[];
}

export interface MailerConfig {
	provider: "resend" | "sendgrid" | "mailgun" | "smtp";
	/** Required for Resend, SendGrid, and Mailgun */
	apiKey?: string;
	/** Required for Mailgun */
	domain?: string;
	/** Required for SMTP */
	smtp?: {
		host: string;
		port: number;
		secure?: boolean;
		auth: {
			user: string;
			pass: string;
		};
	};
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toBase64(content: Buffer | string): string {
	if (typeof content === "string") {
		// Assume already base64 encoded
		return content;
	}
	return content.toString("base64");
}

function toArray(value: string | string[]): string[] {
	return Array.isArray(value) ? value : [value];
}

function inferMimeType(filename: string): string {
	const ext = filename.split(".").pop()?.toLowerCase();
	const mimeMap: Record<string, string> = {
		pdf: "application/pdf",
		png: "image/png",
		jpg: "image/jpeg",
		jpeg: "image/jpeg",
		gif: "image/gif",
		svg: "image/svg+xml",
		webp: "image/webp",
		txt: "text/plain",
		html: "text/html",
		css: "text/css",
		js: "application/javascript",
		json: "application/json",
		zip: "application/zip",
		doc: "application/msword",
		docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
		xls: "application/vnd.ms-excel",
		xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
	};
	return mimeMap[ext || ""] || "application/octet-stream";
}

/**
 * Built-in Mailer wrapper for Buntok.
 * Supports Resend, SendGrid, and Mailgun (HTTP-based, zero-deps).
 * Also supports SMTP via dynamic import of 'nodemailer' (requires user installation).
 */
// ─── Template Integration ──────────────────────────────────────────────────────

import { TemplateEngine } from "./template";

export interface SendTemplateOptions extends Omit<MailOptions, "html" | "text"> {
	/** Template name (registered via registerTemplate) */
	template: string;
	/** Context data for template rendering */
	context?: Record<string, unknown>;
}

export interface SendProviderTemplateOptions extends Omit<MailOptions, "html" | "text"> {
	/** Provider-side template ID (Resend template UUID or SendGrid template_id) */
	templateId: string;
	/** Variables for provider-side rendering */
	templateData?: Record<string, unknown>;
}

/**
 * Mailable — base class for class-based email definitions (Laravel-style).
 *
 * @example
 * ```ts
 * class WelcomeEmail extends Mailable {
 *   template = "welcome";
 *   subject = "Welcome to BunTok!";
 *
 *   constructor(private name: string, private email: string) {
 *     super();
 *   }
 *
 *   build() {
 *     return { context: { name: this.name, email: this.email } };
 *   }
 * }
 *
 * await mailer.send(new WelcomeEmail("Tok", "tok@example.com"));
 * ```
 */
export abstract class Mailable {
	abstract template: string;
	abstract subject: string;
	from?: string;
	to?: string | string[];
	cc?: string | string[];
	bcc?: string | string[];
	replyTo?: string | string[];

	abstract build(): { context?: Record<string, unknown>; from?: string; to?: string | string[] };
}

export class Mailer {
	private engine: TemplateEngine;
	private templates = new Map<string, string>();

	constructor(private config: MailerConfig) {
		this.engine = new TemplateEngine();
	}

	/**
	 * Register a named email template.
	 *
	 * @example
	 * ```ts
	 * mailer.registerTemplate("welcome", `
	 *   <h1>Selamat datang, {{name}}!</h1>
	 *   <p>Email: {{email}}</p>
	 * `);
	 * ```
	 */
	registerTemplate(name: string, template: string): void {
		this.templates.set(name, template);
	}

	/**
	 * Register a partial (layout) for email templates.
	 */
	registerPartial(name: string, template: string): void {
		this.engine.registerPartial(name, template);
	}

	/**
	 * Register a custom helper for email templates.
	 */
	registerHelper(name: string, fn: (...args: any[]) => string): void {
		this.engine.registerHelper(name, fn);
	}

	/**
	 * Send an email asynchronously.
	 * If you don't await this method, it acts as a background queue (fire-and-forget).
	 */
	async send(
		options: MailOptions,
	): Promise<{ success: boolean; id?: string; error?: string }> {
		if (this.config.provider === "resend") {
			return this.sendResend(options);
		}

		if (this.config.provider === "sendgrid") {
			return this.sendSendGrid(options);
		}

		if (this.config.provider === "mailgun") {
			return this.sendMailgun(options);
		}

		if (this.config.provider === "smtp") {
			return this.sendSmtp(options);
		}

		return { success: false, error: "Unsupported provider" };
	}

	// ─── Resend ──────────────────────────────────────────────────────────────

	/**
	 * Send an email using a registered template.
	 *
	 * @example
	 * ```ts
	 * await mailer.sendTemplate({
	 *   from: "hello@buntok.dev",
	 *   to: "user@example.com",
	 *   subject: "Welcome!",
	 *   template: "welcome",
	 *   context: { name: "Tok" },
	 * });
	 * ```
	 */
	async sendTemplate(
		options: SendTemplateOptions,
	): Promise<{ success: boolean; id?: string; error?: string }> {
		const tpl = this.templates.get(options.template);
		if (!tpl) {
			return { success: false, error: `Template "${options.template}" not found` };
		}
		const html = this.engine.render(tpl, options.context ?? {});
		return this.send({ ...options, html });
	}

	/**
	 * Send an email using a provider-side template (Resend/SendGrid).
	 *
	 * @example
	 * ```ts
	 * // Resend
	 * await mailer.sendProviderTemplate({
	 *   from: "hello@buntok.dev",
	 *   to: "user@example.com",
	 *   subject: "Welcome!",
	 *   templateId: "template-uuid",
	 *   templateData: { name: "Tok" },
	 * });
	 * ```
	 */
	async sendProviderTemplate(
		options: SendProviderTemplateOptions,
	): Promise<{ success: boolean; id?: string; error?: string }> {
		if (this.config.provider === "resend") {
			return this.sendResend({
				...options,
				html: undefined,
				text: undefined,
			} as MailOptions, options.templateId, options.templateData);
		}
		if (this.config.provider === "sendgrid") {
			return this.sendSendGrid({
				...options,
				html: undefined,
				text: undefined,
			} as MailOptions, options.templateId, options.templateData);
		}
		return { success: false, error: "Provider templates only supported for Resend and SendGrid" };
	}

	/**
	 * Send a Mailable instance.
	 *
	 * @example
	 * ```ts
	 * await mailer.send(new WelcomeEmail("Tok", "tok@example.com"));
	 * ```
	 */
	async sendMailable(
		mailable: Mailable,
	): Promise<{ success: boolean; id?: string; error?: string }> {
		const built = mailable.build();
		const from = mailable.from ?? built.from;
		const to = mailable.to ?? built.to;
		if (!from || !to) {
			return { success: false, error: "Mailable must define from and to (via properties or build())" };
		}
		return this.sendTemplate({
			from,
			to,
			subject: mailable.subject,
			template: mailable.template,
			context: built.context,
			cc: mailable.cc,
			bcc: mailable.bcc,
			replyTo: mailable.replyTo,
		});
	}

	// ─── Resend ──────────────────────────────────────────────────────────────

	private async sendResend(
		options: MailOptions,
		templateId?: string,
		templateData?: Record<string, unknown>,
	): Promise<{ success: boolean; id?: string; error?: string }> {
		try {
			const payload: Record<string, unknown> = {
				from: options.from,
				to: toArray(options.to),
				subject: options.subject,
			};

			// Provider-side template or local rendering
			if (templateId) {
				payload.template = { id: templateId, variables: templateData ?? {} };
			} else {
				payload.text = options.text;
				payload.html = options.html;
			}

			if (options.cc) payload.cc = toArray(options.cc);
			if (options.bcc) payload.bcc = toArray(options.bcc);
			if (options.replyTo) payload.reply_to = toArray(options.replyTo);

			if (options.attachments && options.attachments.length > 0) {
				payload.attachments = options.attachments.map((att) => {
					const attachment: Record<string, unknown> = {
						filename: att.filename,
					};

					if (att.path) {
						attachment.path = att.path;
					} else if (att.content) {
						attachment.content = toBase64(att.content);
					}

					if (att.contentType) {
						attachment.content_type = att.contentType;
					} else if (att.filename) {
						attachment.content_type = inferMimeType(att.filename);
					}

					if (att.cid) {
						attachment.content_id = att.cid;
					}

					return attachment;
				});
			}

			const res = await fetch("https://api.resend.com/emails", {
				method: "POST",
				headers: {
					Authorization: `Bearer ${this.config.apiKey}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify(payload),
			});

			const data = (await res.json()) as Record<string, unknown>;
			if (!res.ok) return { success: false, error: data.message as string };
			return { success: true, id: data.id as string };
		} catch (err: unknown) {
			const e = err as Error;
			return { success: false, error: e.message };
		}
	}

	// ─── SendGrid ────────────────────────────────────────────────────────────

	private async sendSendGrid(
		options: MailOptions,
		templateId?: string,
		templateData?: Record<string, unknown>,
	): Promise<{ success: boolean; id?: string; error?: string }> {
		try {
			const toArr = (v: string | string[]) =>
				(Array.isArray(v) ? v : [v]).map((email) => ({ email }));

			const personalization: Record<string, unknown> = {
				to: toArr(options.to),
			};
			if (options.cc) personalization.cc = toArr(options.cc);
			if (options.bcc) personalization.bcc = toArr(options.bcc);

			// Provider-side template data
			if (templateId && templateData) {
				personalization.dynamic_template_data = templateData;
			}

			const payload: Record<string, unknown> = {
				personalizations: [personalization],
				from: { email: options.from },
				subject: options.subject,
			};

			// SendGrid template_id
			if (templateId) {
				payload.template_id = templateId;
			}

			if (options.replyTo) {
				const replyToArr = toArray(options.replyTo);
				if (replyToArr.length === 1) {
					payload.reply_to = { email: replyToArr[0] };
				} else {
					payload.reply_to_list = replyToArr.map((email) => ({ email }));
				}
			}

			const content = [];
			if (options.text)
				content.push({ type: "text/plain", value: options.text });
			if (options.html)
				content.push({ type: "text/html", value: options.html });
			payload.content = content;

			if (options.attachments && options.attachments.length > 0) {
				payload.attachments = options.attachments.map((att) => {
					const attachment: Record<string, unknown> = {
						content: att.content ? toBase64(att.content) : "",
						filename: att.filename,
						disposition: att.cid ? "inline" : "attachment",
					};

					if (att.contentType) {
						attachment.type = att.contentType;
					} else if (att.filename) {
						attachment.type = inferMimeType(att.filename);
					}

					if (att.cid) {
						attachment.content_id = att.cid;
					}

					return attachment;
				});
			}

			const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
				method: "POST",
				headers: {
					Authorization: `Bearer ${this.config.apiKey}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify(payload),
			});

			if (!res.ok) {
				const data = (await res.json()) as { errors?: { message: string }[] };
				return {
					success: false,
					error: data.errors?.[0]?.message || "SendGrid Error",
				};
			}
			return { success: true };
		} catch (err: unknown) {
			const e = err as Error;
			return { success: false, error: e.message };
		}
	}

	// ─── Mailgun ─────────────────────────────────────────────────────────────

	private async sendMailgun(
		options: MailOptions,
	): Promise<{ success: boolean; id?: string; error?: string }> {
		try {
			if (!this.config.domain)
				throw new Error("Mailgun requires a domain configured");

			const formData = new FormData();
			formData.append("from", options.from);

			const toArray = (v: string | string[]) =>
				Array.isArray(v) ? v : [v];
			for (const t of toArray(options.to)) formData.append("to", t);
			if (options.cc) for (const c of toArray(options.cc)) formData.append("cc", c);
			if (options.bcc) for (const b of toArray(options.bcc)) formData.append("bcc", b);

			formData.append("subject", options.subject);
			if (options.text) formData.append("text", options.text);
			if (options.html) formData.append("html", options.html);

			if (options.replyTo) {
				const replyTo = toArray(options.replyTo).join(", ");
				formData.append("h:Reply-To", replyTo);
			}

			if (options.attachments && options.attachments.length > 0) {
				for (const att of options.attachments) {
					if (att.cid) {
						// Inline attachment
						if (att.content) {
							const blob =
								typeof att.content === "string"
									? new Blob([Uint8Array.from(atob(att.content), (c) => c.charCodeAt(0))])
									: new Blob([att.content]);
							formData.append("inline", blob, att.filename);
						} else if (att.path) {
							const res = await fetch(att.path);
							const blob = await res.blob();
							formData.append("inline", blob, att.filename);
						}
					} else {
						// Regular attachment
						if (att.content) {
							const blob =
								typeof att.content === "string"
									? new Blob([Uint8Array.from(atob(att.content), (c) => c.charCodeAt(0))])
									: new Blob([att.content]);
							formData.append("attachment", blob, att.filename);
						} else if (att.path) {
							const res = await fetch(att.path);
							const blob = await res.blob();
							formData.append("attachment", blob, att.filename);
						}
					}
				}
			}

			const basicAuth = btoa(`api:${this.config.apiKey}`);
			const res = await fetch(
				`https://api.mailgun.net/v3/${this.config.domain}/messages`,
				{
					method: "POST",
					headers: { Authorization: `Basic ${basicAuth}` },
					body: formData,
				},
			);

			const data = (await res.json()) as Record<string, unknown>;
			if (!res.ok) return { success: false, error: data.message as string };
			return { success: true, id: data.id as string };
		} catch (err: unknown) {
			const e = err as Error;
			return { success: false, error: e.message };
		}
	}

	// ─── SMTP (nodemailer) ──────────────────────────────────────────────────

	private async sendSmtp(
		options: MailOptions,
	): Promise<{ success: boolean; id?: string; error?: string }> {
		if (!this.config.smtp)
			return { success: false, error: "SMTP configuration missing" };
		try {
			// Dynamic import to keep Buntok dependency-free
			const nodemailer = await import("nodemailer");
			const transporter = nodemailer.createTransport(this.config.smtp);

			const mailOptions: Record<string, unknown> = {
				from: options.from,
				to: toArray(options.to).join(","),
				subject: options.subject,
				text: options.text,
				html: options.html,
			};

			if (options.cc) mailOptions.cc = toArray(options.cc).join(",");
			if (options.bcc) mailOptions.bcc = toArray(options.bcc).join(",");
			if (options.replyTo) mailOptions.replyTo = toArray(options.replyTo).join(",");

			if (options.attachments && options.attachments.length > 0) {
				mailOptions.attachments = options.attachments.map((att) => {
					const attachment: Record<string, unknown> = {
						filename: att.filename,
					};

					if (att.path) {
						attachment.path = att.path;
					} else if (att.content) {
						attachment.content =
							typeof att.content === "string"
								? Buffer.from(att.content, "base64")
								: att.content;
					}

					if (att.contentType) {
						attachment.contentType = att.contentType;
					}

					if (att.cid) {
						attachment.cid = att.cid;
						attachment.contentDisposition = "inline";
					}

					return attachment;
				});
			}

			const info = await transporter.sendMail(mailOptions);
			return { success: true, id: info.messageId };
		} catch (err: unknown) {
			const e = err as { code?: string; message: string };
			if (e.code === "ERR_MODULE_NOT_FOUND") {
				return {
					success: false,
					error: "Nodemailer is required for SMTP. Run 'bun add nodemailer'",
				};
			}
			return { success: false, error: e.message };
		}
	}
}
