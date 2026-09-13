import { Controller, Post } from "@buntok/core";
import Redis from "ioredis";
import { renderEmail } from "../emails";
import { Mailer } from "@buntok/core/mailer";
import { Queue } from "@buntok/core/queue";

const mailer = new Mailer({
	provider: "smtp",
	smtp: {
		host: "smtp.ethereal.email",
		port: 587,
		auth: {
			user: "lera80@ethereal.email",
			pass: "GPcExwPUfa6TvaBvkp",
		},
	},
});

interface EmailJob {
	template: string;
	context: Record<string, unknown>;
	to: string;
	from?: string;
}

const redis = new Redis();

const emailQueue = new Queue<EmailJob>("email", {
	driver: "redis",
	client: redis,
	maxRetries: 3,
});

emailQueue.process(async (job) => {
	const { template, context, to, from = "lera80@ethereal.email" } = job.data;
	const { html, subject } = renderEmail(template, context);
	await mailer.send({ from, to, subject, html });
});

@Controller("/mailer")
export class MailerController {
	@Post("/send")
	async sendEmail() {
		await emailQueue.add({
			template: "welcome",
			context: {
				subject: "Welcome to Buntok!",
				name: "John Doe",
				appName: "Buntok Test",
				dashboardUrl: "https://example.com/dashboard",
			},
			to: "pitok@gmail.com",
		});

		return { success: true, message: "Email queued" };
	}

	@Post("/welcome")
	async sendWelcome() {
		await emailQueue.add({
			template: "welcome",
			context: {
				subject: "Welcome to Buntok!",
				name: "John Doe",
				appName: "Buntok Test",
				dashboardUrl: "https://example.com/dashboard",
			},
			to: "pitok@gmail.com",
		});

		return { success: true, message: "Email queued" };
	}

	@Post("/password-reset")
	async sendPasswordReset() {
		await emailQueue.add({
			template: "password-reset",
			context: {
				subject: "Reset Your Password",
				name: "John Doe",
				appName: "Buntok Test",
				resetUrl: "https://example.com/reset-password?token=abc123",
				expiresIn: "1 hour",
			},
			to: "pitok@gmail.com",
		});

		return { success: true, message: "Email queued" };
	}

	@Post("/verify-email")
	async sendVerifyEmail() {
		await emailQueue.add({
			template: "verify-email",
			context: {
				subject: "Verify Your Email",
				name: "John Doe",
				appName: "Buntok Test",
				verifyUrl: "https://example.com/verify?token=abc123",
			},
			to: "pitok@gmail.com",
		});

		return { success: true, message: "Email queued" };
	}

	@Post("/invoice")
	async sendInvoice() {
		await emailQueue.add({
			template: "invoice",
			context: {
				subject: "Invoice #INV-001",
				name: "John Doe",
				appName: "Buntok Test",
				invoiceNumber: "INV-001",
				items: [
					{ name: "Buntok Pro", quantity: 1, amount: "$50.00" },
					{ name: "Support", quantity: 1, amount: "$29.00" },
				],
				total: "$79.00",
				paymentUrl: "https://example.com/pay/INV-001",
				dueDate: "2026-12-31",
			},
			to: "pitok@gmail.com",
		});

		return { success: true, message: "Email queued" };
	}
}
