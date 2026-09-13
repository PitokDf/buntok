import { describe, it, expect, beforeEach, spyOn } from "bun:test";
import { Mailer, Mailable } from "../src/mailer";

// ─── Mailer ─────────────────────────────────────────────────────────────────────

describe("Mailer", () => {
	describe("constructor", () => {
		it("should create a mailer with resend config", () => {
			const mailer = new Mailer({ provider: "resend", apiKey: "re_123" });
			expect(mailer).toBeDefined();
		});

		it("should create a mailer with sendgrid config", () => {
			const mailer = new Mailer({ provider: "sendgrid", apiKey: "sg_123" });
			expect(mailer).toBeDefined();
		});

		it("should create a mailer with mailgun config", () => {
			const mailer = new Mailer({
				provider: "mailgun",
				apiKey: "mg_123",
				domain: "example.com",
			});
			expect(mailer).toBeDefined();
		});

		it("should create a mailer with smtp config", () => {
			const mailer = new Mailer({
				provider: "smtp",
				smtp: {
					host: "smtp.example.com",
					port: 587,
					secure: false,
					auth: { user: "user", pass: "pass" },
				},
			});
			expect(mailer).toBeDefined();
		});
	});

	describe("send - unsupported provider", () => {
		it("should return error for unsupported provider", async () => {
			const mailer = new Mailer({ provider: "unsupported" as any });
			const result = await mailer.send({
				from: "test@example.com",
				to: "user@example.com",
				subject: "Test",
				text: "Hello",
			});
			expect(result.success).toBe(false);
			expect(result.error).toBe("Unsupported provider");
		});
	});

	describe("send - Resend", () => {
		it("should return error when API call fails", async () => {
			const mailer = new Mailer({ provider: "resend", apiKey: "invalid" });

			// Mock fetch to simulate failure
			const originalFetch = globalThis.fetch;
			globalThis.fetch = async () => {
				return new Response(
					JSON.stringify({ message: "Invalid API key" }),
					{ status: 401, headers: { "Content-Type": "application/json" } },
				);
			};

			try {
				const result = await mailer.send({
					from: "test@example.com",
					to: "user@example.com",
					subject: "Test",
					text: "Hello",
				});
				expect(result.success).toBe(false);
				expect(result.error).toBe("Invalid API key");
			} finally {
				globalThis.fetch = originalFetch;
			}
		});

		it("should return success on valid response", async () => {
			const mailer = new Mailer({ provider: "resend", apiKey: "re_123" });

			const originalFetch = globalThis.fetch;
			globalThis.fetch = async () => {
				return new Response(
					JSON.stringify({ id: "email_123" }),
					{ status: 200, headers: { "Content-Type": "application/json" } },
				);
			};

			try {
				const result = await mailer.send({
					from: "test@example.com",
					to: "user@example.com",
					subject: "Test",
					text: "Hello",
				});
				expect(result.success).toBe(true);
				expect(result.id).toBe("email_123");
			} finally {
				globalThis.fetch = originalFetch;
			}
		});
	});

	describe("send - SendGrid", () => {
		it("should return error when API call fails", async () => {
			const mailer = new Mailer({ provider: "sendgrid", apiKey: "sg_123" });

			const originalFetch = globalThis.fetch;
			globalThis.fetch = async () => {
				return new Response(
					JSON.stringify({ errors: [{ message: "Forbidden" }] }),
					{ status: 403, headers: { "Content-Type": "application/json" } },
				);
			};

			try {
				const result = await mailer.send({
					from: "test@example.com",
					to: "user@example.com",
					subject: "Test",
					text: "Hello",
				});
				expect(result.success).toBe(false);
				expect(result.error).toBe("Forbidden");
			} finally {
				globalThis.fetch = originalFetch;
			}
		});
	});

	describe("send - Mailgun", () => {
		it("should return error when domain is missing", async () => {
			const mailer = new Mailer({ provider: "mailgun", apiKey: "mg_123" });
			const result = await mailer.send({
				from: "test@example.com",
				to: "user@example.com",
				subject: "Test",
				text: "Hello",
			});
			expect(result.success).toBe(false);
			expect(result.error).toContain("domain");
		});
	});

	describe("send - SMTP", () => {
		it("should return error when SMTP config is missing", async () => {
			const mailer = new Mailer({ provider: "smtp" });
			const result = await mailer.send({
				from: "test@example.com",
				to: "user@example.com",
				subject: "Test",
				text: "Hello",
			});
			expect(result.success).toBe(false);
			expect(result.error).toBe("SMTP configuration missing");
		});
	});

	// ─── Template Integration ────────────────────────────────────────────────

	describe("registerTemplate", () => {
		it("should register a template", () => {
			const mailer = new Mailer({ provider: "resend", apiKey: "re_123" });
			mailer.registerTemplate("welcome", "<h1>Selamat datang, {{name}}!</h1>");
			// No error means it was registered
		});
	});

	describe("sendTemplate", () => {
		it("should return error for unregistered template", async () => {
			const mailer = new Mailer({ provider: "resend", apiKey: "re_123" });
			const result = await mailer.sendTemplate({
				from: "test@example.com",
				to: "user@example.com",
				subject: "Welcome!",
				template: "nonexistent",
				context: { name: "Tok" },
			});
			expect(result.success).toBe(false);
			expect(result.error).toContain("not found");
		});

		it("should render template with context and send", async () => {
			const mailer = new Mailer({ provider: "resend", apiKey: "re_123" });
			mailer.registerTemplate("welcome", "<h1>Selamat datang, {{name}}!</h1>");

			let sentHtml = "";
			const originalFetch = globalThis.fetch;
			globalThis.fetch = async (_url: string, init: any) => {
				const body = JSON.parse(init.body);
				sentHtml = body.html;
				return new Response(
					JSON.stringify({ id: "email_456" }),
					{ status: 200, headers: { "Content-Type": "application/json" } },
				);
			};

			try {
				const result = await mailer.sendTemplate({
					from: "test@example.com",
					to: "user@example.com",
					subject: "Welcome!",
					template: "welcome",
					context: { name: "Tok" },
				});
				expect(result.success).toBe(true);
				expect(result.id).toBe("email_456");
				expect(sentHtml).toContain("Selamat datang, Tok!");
			} finally {
				globalThis.fetch = originalFetch;
			}
		});

		it("should render template without context as empty object", async () => {
			const mailer = new Mailer({ provider: "resend", apiKey: "re_123" });
			mailer.registerTemplate("static", "<p>Hello World</p>");

			let sentHtml = "";
			const originalFetch = globalThis.fetch;
			globalThis.fetch = async (_url: string, init: any) => {
				const body = JSON.parse(init.body);
				sentHtml = body.html;
				return new Response(
					JSON.stringify({ id: "email_789" }),
					{ status: 200, headers: { "Content-Type": "application/json" } },
				);
			};

			try {
				const result = await mailer.sendTemplate({
					from: "test@example.com",
					to: "user@example.com",
					subject: "Hello",
					template: "static",
				});
				expect(result.success).toBe(true);
				expect(sentHtml).toBe("<p>Hello World</p>");
			} finally {
				globalThis.fetch = originalFetch;
			}
		});
	});

	describe("sendProviderTemplate", () => {
		it("should return error for unsupported provider", async () => {
			const mailer = new Mailer({ provider: "mailgun", apiKey: "mg_123", domain: "example.com" });
			const result = await mailer.sendProviderTemplate({
				from: "test@example.com",
				to: "user@example.com",
				subject: "Hello",
				templateId: "d-123",
				templateData: { name: "Tok" },
			});
			expect(result.success).toBe(false);
			expect(result.error).toContain("only supported");
		});

		it("should send Resend template with template ID", async () => {
			const mailer = new Mailer({ provider: "resend", apiKey: "re_123" });

			let sentPayload: any;
			const originalFetch = globalThis.fetch;
			globalThis.fetch = async (_url: string, init: any) => {
				sentPayload = JSON.parse(init.body);
				return new Response(
					JSON.stringify({ id: "email_tpl" }),
					{ status: 200, headers: { "Content-Type": "application/json" } },
				);
			};

			try {
				const result = await mailer.sendProviderTemplate({
					from: "test@example.com",
					to: "user@example.com",
					subject: "Template Email",
					templateId: "template-uuid-123",
					templateData: { name: "Tok" },
				});
				expect(result.success).toBe(true);
				expect(sentPayload.template.id).toBe("template-uuid-123");
				expect(sentPayload.template.variables).toEqual({ name: "Tok" });
				expect(sentPayload.html).toBeUndefined();
			} finally {
				globalThis.fetch = originalFetch;
			}
		});

		it("should send SendGrid template with template_id and dynamic data", async () => {
			const mailer = new Mailer({ provider: "sendgrid", apiKey: "sg_123" });

			let sentPayload: any;
			const originalFetch = globalThis.fetch;
			globalThis.fetch = async (_url: string, init: any) => {
				sentPayload = JSON.parse(init.body);
				return new Response("OK", { status: 202 });
			};

			try {
				const result = await mailer.sendProviderTemplate({
					from: "test@example.com",
					to: "user@example.com",
					subject: "Template Email",
					templateId: "d-abc123",
					templateData: { name: "Tok" },
				});
				expect(result.success).toBe(true);
				expect(sentPayload.template_id).toBe("d-abc123");
				expect(sentPayload.personalizations[0].dynamic_template_data).toEqual({ name: "Tok" });
			} finally {
				globalThis.fetch = originalFetch;
			}
		});
	});

	describe("registerPartial / registerHelper", () => {
		it("should register and use a partial in template", async () => {
			const mailer = new Mailer({ provider: "resend", apiKey: "re_123" });
			mailer.registerPartial("layout", "<div class='email'>{{{body}}}</div>");
			mailer.registerTemplate("withLayout", "{{> layout}}");

			let sentHtml = "";
			const originalFetch = globalThis.fetch;
			globalThis.fetch = async (_url: string, init: any) => {
				const body = JSON.parse(init.body);
				sentHtml = body.html;
				return new Response(
					JSON.stringify({ id: "email_101" }),
					{ status: 200, headers: { "Content-Type": "application/json" } },
				);
			};

			try {
				await mailer.sendTemplate({
					from: "test@example.com",
					to: "user@example.com",
					subject: "Test",
					template: "withLayout",
					context: { body: "<p>Hi Tok!</p>" },
				});
				expect(sentHtml).toContain("<p>Hi Tok!</p>");
				expect(sentHtml).toContain("<div class='email'>");
			} finally {
				globalThis.fetch = originalFetch;
			}
		});

		it("should register and use a custom helper", async () => {
			const mailer = new Mailer({ provider: "resend", apiKey: "re_123" });
			mailer.registerHelper("shout", (text: string) => `${text.toUpperCase()}!!!`);
			mailer.registerTemplate("withHelper", "<p>{{shout greeting}}</p>");

			let sentHtml = "";
			const originalFetch = globalThis.fetch;
			globalThis.fetch = async (_url: string, init: any) => {
				const body = JSON.parse(init.body);
				sentHtml = body.html;
				return new Response(
					JSON.stringify({ id: "email_102" }),
					{ status: 200, headers: { "Content-Type": "application/json" } },
				);
			};

			try {
				await mailer.sendTemplate({
					from: "test@example.com",
					to: "user@example.com",
					subject: "Test",
					template: "withHelper",
					context: { greeting: "hello" },
				});
				expect(sentHtml).toContain("HELLO!!!");
			} finally {
				globalThis.fetch = originalFetch;
			}
		});
	});
});

// ─── Mailable ─────────────────────────────────────────────────────────────────

class TestWelcomeMail extends Mailable {
	template = "welcome";
	subject = "Welcome to BunTok!";

	constructor(private username: string, private userEmail: string) {
		super();
	}

	build() {
		return {
			from: "noreply@example.com",
			to: this.userEmail,
			context: { name: this.username, email: this.userEmail },
		};
	}
}

class TestCustomFromMail extends Mailable {
	template = "notification";
	subject = "You have a notification";
	from = "noreply@custom.dev";
	to = "user@example.com";

	build() {
		return { context: { title: "New Message" } };
	}
}

describe("Mailable", () => {
	it("should create a mailable instance", () => {
		const mail = new TestWelcomeMail("Tok", "tok@example.com");
		expect(mail).toBeDefined();
		expect(mail.template).toBe("welcome");
		expect(mail.subject).toBe("Welcome to BunTok!");
	});

	it("should build context via build()", () => {
		const mail = new TestWelcomeMail("Tok", "tok@example.com");
		const built = mail.build();
		expect(built.context).toEqual({ name: "Tok", email: "tok@example.com" });
	});

	it("should allow custom from/to via Mailable properties", () => {
		const mail = new TestCustomFromMail();
		expect(mail.from).toBe("noreply@custom.dev");
		expect(mail.to).toBe("user@example.com");
	});

	it("should send via Mailer.sendMailable()", async () => {
		const mailer = new Mailer({ provider: "resend", apiKey: "re_123" });
		mailer.registerTemplate("welcome", "<h1>Halo, {{name}}!</h1><p>{{email}}</p>");

		let sentHtml = "";
		let sentSubject = "";
		const originalFetch = globalThis.fetch;
		globalThis.fetch = async (_url: string, init: any) => {
			const body = JSON.parse(init.body);
			sentHtml = body.html;
			sentSubject = body.subject;
			return new Response(
				JSON.stringify({ id: "email_mailable" }),
				{ status: 200, headers: { "Content-Type": "application/json" } },
			);
		};

		try {
			const mail = new TestWelcomeMail("Tok", "tok@example.com");
			const result = await mailer.sendMailable(mail);
			expect(result.success).toBe(true);
			expect(sentSubject).toBe("Welcome to BunTok!");
			expect(sentHtml).toContain("Halo, Tok!");
			expect(sentHtml).toContain("tok@example.com");
		} finally {
			globalThis.fetch = originalFetch;
		}
	});

	it("should use Mailable from/to over build() return", async () => {
		const mailer = new Mailer({ provider: "resend", apiKey: "re_123" });
		mailer.registerTemplate("notification", "<p>{{title}}</p>");

		let sentFrom = "";
		let sentTo = "";
		const originalFetch = globalThis.fetch;
		globalThis.fetch = async (_url: string, init: any) => {
			const body = JSON.parse(init.body);
			sentFrom = body.from;
			sentTo = body.to?.[0];
			return new Response(
				JSON.stringify({ id: "email_notif" }),
				{ status: 200, headers: { "Content-Type": "application/json" } },
			);
		};

		try {
			const mail = new TestCustomFromMail();
			const result = await mailer.sendMailable(mail);
			expect(result.success).toBe(true);
			expect(sentFrom).toBe("noreply@custom.dev");
			expect(sentTo).toBe("user@example.com");
		} finally {
			globalThis.fetch = originalFetch;
		}
	});
});
