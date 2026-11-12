import type { PaymentDriver } from "../driver";
import type {
	CreateCheckoutInput,
	CreatePaymentLinkInput,
	CreateRefundInput,
	CreateSubscriptionInput,
	CheckoutResult,
	PaymentLinkResult,
	PaymentOptions,
	RefundResult,
	SubscriptionResult,
	WebhookEvent,
} from "../types";
import {
	normalizeCheckoutStatus,
	normalizeRefundStatus,
	normalizeSubscriptionStatus,
	safeEqual,
} from "../helpers";
import {
	PaymentConfigurationError,
	PaymentProviderError,
} from "../errors";

export interface StripeDriverConfig {
	secretKey: string;
	/** Your Stripe webhook signing secret (e.g., "whsec_...") */
	webhookSecret?: string;
	/** API version override (default: "2026-04-22.dahlia") */
	apiVersion?: string;
}

const API_BASE = "https://api.stripe.com/v1";

export class StripeDriver implements PaymentDriver {
	readonly id = "stripe";

	private secretKey: string;
	private webhookSecret: string;
	private apiVersion: string;

	constructor(config: StripeDriverConfig) {
		if (!config.secretKey) {
			throw new PaymentConfigurationError(
				this.id,
				"Stripe secretKey is required",
			);
		}
		this.secretKey = config.secretKey;
		this.webhookSecret = config.webhookSecret ?? "";
		this.apiVersion = config.apiVersion ?? "2026-04-22.dahlia";
	}

	// ─── HTTP ──────────────────────────────────────────────────────────────

	private async request<T>(
		method: string,
		path: string,
		body?: Record<string, unknown>,
		idempotencyKey?: string,
	): Promise<T> {
		const url = `${API_BASE}${path}`;
		const headers: Record<string, string> = {
			Authorization: `Bearer ${this.secretKey}`,
			"Stripe-Version": this.apiVersion,
		};

		if (idempotencyKey) {
			headers["Idempotency-Key"] = idempotencyKey;
		}

		let res: Response;
		if (method === "GET") {
			const params = body
				? `?${new URLSearchParams(body as Record<string, string>).toString()}`
				: "";
			res = await fetch(`${url}${params}`, { method, headers });
		} else {
			headers["Content-Type"] = "application/x-www-form-urlencoded";
			const formBody = body ? this.flattenParams(body) : "";
			res = await fetch(url, { method, headers, body: formBody });
		}

		const raw = await res.text();
		let data: Record<string, unknown>;
		try {
			data = JSON.parse(raw) as Record<string, unknown>;
		} catch {
			throw new PaymentProviderError(
				this.id,
				"api_error",
				`Stripe returned non-JSON response (status ${res.status}): ${raw.slice(0, 200)}`,
			);
		}

		if (!res.ok) {
			const err = data as { error?: { message?: string; type?: string; code?: string } };
			throw new PaymentProviderError(
				this.id,
				err.error?.code ?? "api_error",
				err.error?.message ?? "Stripe API error",
			);
		}

		return data as T;
	}

	/** Convert nested objects to Stripe's dot-notation form params */
	private flattenParams(
		obj: Record<string, unknown>,
		prefix = "",
	): string {
		const parts: string[] = [];
		for (const [key, value] of Object.entries(obj)) {
			if (value === undefined || value === null) continue;
			const fullKey = prefix ? `${prefix}[${key}]` : key;
			if (typeof value === "object" && value !== null && !Array.isArray(value)) {
				parts.push(this.flattenParams(value as Record<string, unknown>, fullKey));
			} else if (Array.isArray(value)) {
				for (let i = 0; i < value.length; i++) {
					const itemKey = `${fullKey}[${i}]`;
					if (typeof value[i] === "object" && value[i] !== null) {
						parts.push(
							this.flattenParams(value[i] as Record<string, unknown>, itemKey),
						);
					} else {
						parts.push(`${encodeURIComponent(itemKey)}=${encodeURIComponent(String(value[i]))}`);
					}
				}
			} else {
				parts.push(`${encodeURIComponent(fullKey)}=${encodeURIComponent(String(value))}`);
			}
		}
		return parts.join("&");
	}

	// ─── Checkout ─────────────────────────────────────────────────────────

	async createCheckout(
		input: CreateCheckoutInput,
		opts?: PaymentOptions,
	): Promise<CheckoutResult> {
		const params: Record<string, unknown> = {
			mode: "payment",
			payment_method_types: ["card"],
			line_items: [
				{
					price_data: {
						currency: input.currency.toLowerCase(),
						product_data: {
							name: input.description ?? "Payment",
						},
						unit_amount: this.toSmallestUnit(input.amount, input.currency),
					},
					quantity: 1,
				},
			],
			success_url: input.successUrl ?? "https://example.com/success",
			cancel_url: input.cancelUrl ?? "https://example.com/cancel",
		};

		if (input.customerEmail) {
			params.customer_email = input.customerEmail;
		}
		if (input.metadata) {
			params.metadata = input.metadata;
		}

		const res = await this.request<{
			id: string;
			status: string;
			amount_total: number | null;
			currency: string | null;
			url: string | null;
			payment_intent: string | { id: string; client_secret: string } | null;
			expires_at: number;
			created: number;
			metadata: Record<string, unknown>;
		}>("POST", "/checkout/sessions", params, opts?.orderId);

		return {
			id: res.id,
			status: normalizeCheckoutStatus(this.id, res.status),
			amount: input.amount,
			currency: input.currency.toUpperCase(),
			provider: this.id,
			checkoutUrl: res.url ?? undefined,
			providerPaymentId:
				typeof res.payment_intent === "string"
					? res.payment_intent
					: typeof res.payment_intent === "object" && res.payment_intent
						? res.payment_intent.id
						: undefined,
			clientSecret:
				typeof res.payment_intent === "object" && res.payment_intent
					? res.payment_intent.client_secret
					: undefined,
			metadata: res.metadata,
			expiresAt: res.expires_at ? new Date(res.expires_at * 1000) : undefined,
			createdAt: new Date(res.created * 1000),
		};
	}

	// ─── Refund ───────────────────────────────────────────────────────────

	async createRefund(
		input: CreateRefundInput,
		opts?: PaymentOptions,
	): Promise<RefundResult> {
		const params: Record<string, unknown> = {
			payment_intent: input.paymentId,
		};
		if (input.amount) {
			params.amount = this.toSmallestUnit(input.amount, "IDR");
		}
		if (input.reason) {
			params.reason = input.reason;
		}
		if (input.metadata) {
			params.metadata = input.metadata;
		}

		const res = await this.request<{
			id: string;
			status: string;
			amount: number;
			currency: string;
			payment_intent: string;
			reason: string | null;
			created: number;
			metadata: Record<string, unknown>;
		}>("POST", "/refunds", params, opts?.orderId);

		return {
			id: res.id,
			status: normalizeRefundStatus(this.id, res.status),
			amount: this.fromSmallestUnit(res.amount, res.currency),
			currency: res.currency.toUpperCase(),
			provider: this.id,
			paymentId: res.payment_intent,
			reason: res.reason ?? undefined,
			metadata: res.metadata,
			createdAt: new Date(res.created * 1000),
		};
	}

	// ─── Subscription ─────────────────────────────────────────────────────

	async createSubscription(
		input: CreateSubscriptionInput,
		opts?: PaymentOptions,
	): Promise<SubscriptionResult> {
		const params: Record<string, unknown> = {
			price: input.planId,
		};
		if (input.customerEmail) {
			params.customer_email = input.customerEmail;
		}
		if (input.metadata) {
			params.metadata = input.metadata;
		}
		if (input.trialPeriodDays) {
			params.trial_period_days = input.trialPeriodDays;
		}

		const res = await this.request<{
			id: string;
			status: string;
			current_period_start: number;
			current_period_end: number;
			created: number;
			metadata: Record<string, unknown>;
			items: { data: Array<{ price: { id: string } }> };
		}>("POST", "/subscriptions", params);

		return {
			id: res.id,
			status: normalizeSubscriptionStatus(this.id, res.status),
			provider: this.id,
			planId: res.items.data[0]?.price.id ?? input.planId,
			customerEmail: input.customerEmail,
			metadata: res.metadata,
			currentPeriodStart: new Date(res.current_period_start * 1000),
			currentPeriodEnd: new Date(res.current_period_end * 1000),
			createdAt: new Date(res.created * 1000),
		};
	}

	// ─── Payment Link ─────────────────────────────────────────────────────

	async createPaymentLink(
		input: CreatePaymentLinkInput,
	): Promise<PaymentLinkResult> {
		const params: Record<string, unknown> = {
			line_items: [
				{
					price_data: {
						currency: input.currency.toLowerCase(),
						product_data: {
							name: input.description ?? "Payment",
						},
						unit_amount: this.toSmallestUnit(input.amount, input.currency),
					},
					quantity: 1,
				},
			],
			active: true,
		};

		if (input.metadata) {
			params.metadata = input.metadata;
		}

		const res = await this.request<{
			id: string;
			url: string;
			active: boolean;
			created: number;
			metadata: Record<string, unknown>;
		}>("POST", "/payment_links", params);

		return {
			id: res.id,
			url: res.url,
			amount: input.amount,
			currency: input.currency.toUpperCase(),
			provider: this.id,
			metadata: res.metadata,
			expiresAt: input.expiresAt ? new Date(input.expiresAt) : undefined,
			createdAt: new Date(res.created * 1000),
		};
	}

	// ─── Webhook Verification ─────────────────────────────────────────────

	async verifyWebhookSignature(
		payload: string,
		signature: string,
		_secret: string,
	): Promise<boolean> {
		const secret = _secret || this.webhookSecret;
		if (!secret) return false;

		try {
			const parts = signature.split(",").map((p) => p.split("="));
			let timestamp: number | undefined;
			const receivedSigs: string[] = [];
			for (const part of parts) {
				const [k, v] = part;
				if (k === "t") timestamp = Number(v);
				else if (k === "v1" && v) receivedSigs.push(v);
			}

			// Stripe may send multiple `v1` signatures during secret rotation.
			if (!timestamp || receivedSigs.length === 0) return false;

			// Reject if timestamp is > 5 minutes old
			const tolerance = 300;
			if (Math.abs(Date.now() / 1000 - timestamp) > tolerance) return false;

			const signedPayload = `${timestamp}.${payload}`;
			const computed = await this.hmacSha256(signedPayload, secret);
			for (const receivedSig of receivedSigs) {
				if (await safeEqual(computed, receivedSig)) return true;
			}
			return false;
		} catch {
			return false;
		}
	}

	private async hmacSha256(message: string, secret: string): Promise<string> {
		const encoder = new TextEncoder();
		const key = await crypto.subtle.importKey(
			"raw",
			encoder.encode(secret),
			{ name: "HMAC", hash: "SHA-256" },
			false,
			["sign"],
		);
		const signature = await crypto.subtle.sign(
			"HMAC",
			key,
			encoder.encode(message),
		);
		return Array.from(new Uint8Array(signature))
			.map((b) => b.toString(16).padStart(2, "0"))
			.join("");
	}

	parseWebhookEvent(payload: string): WebhookEvent {
		const event = JSON.parse(payload) as {
			id: string;
			type: string;
			created: number;
			data: { object: Record<string, unknown> };
		};

		const typeMap: Record<string, WebhookEvent["type"]> = {
			"checkout.session.completed": "payment.completed",
			"payment_intent.succeeded": "payment.completed",
			"payment_intent.payment_failed": "payment.failed",
			"checkout.session.expired": "payment.expired",
			"customer.subscription.created": "subscription.created",
			"customer.subscription.deleted": "subscription.cancelled",
			"invoice.paid": "subscription.payment_succeeded",
			"invoice.payment_failed": "subscription.payment_failed",
			"charge.refunded": "refund.completed",
		};

		const obj = event.data.object;
		const normalizedType = typeMap[event.type] ?? "payment.created";

		return {
			id: event.id,
			type: normalizedType,
			provider: this.id,
			rawData: event,
			entityId: (obj.id as string) ?? undefined,
			amount: typeof obj.amount === "number" ? obj.amount / 100 : undefined,
			currency: typeof obj.currency === "string" ? obj.currency.toUpperCase() : undefined,
			status: typeof obj.status === "string" ? obj.status : undefined,
			metadata: (obj.metadata as Record<string, unknown>) ?? undefined,
			createdAt: new Date(event.created * 1000),
		};
	}

	// ─── Currency Helpers ─────────────────────────────────────────────────

	private toSmallestUnit(amount: number, currency: string): number {
		const zeroDecimal = ["BIF", "CLP", "DJF", "GNF", "JPY", "KMF", "KRW", "MGA", "PYG", "RWF", "UGX", "VND", "VUV", "XAF", "XOF", "XPF"];
		return zeroDecimal.includes(currency.toUpperCase())
			? Math.round(amount)
			: Math.round(amount * 100);
	}

	private fromSmallestUnit(amount: number, currency: string): number {
		const zeroDecimal = ["BIF", "CLP", "DJF", "GNF", "JPY", "KMF", "KRW", "MGA", "PYG", "RWF", "UGX", "VND", "VUV", "XAF", "XOF", "XPF"];
		return zeroDecimal.includes(currency.toUpperCase())
			? amount
			: amount / 100;
	}
}
