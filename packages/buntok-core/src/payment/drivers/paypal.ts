import type { PaymentDriver } from "../driver";
import type {
	CreateCheckoutInput,
	CreateRefundInput,
	CreateSubscriptionInput,
	CheckoutResult,
	PaymentOptions,
	RefundResult,
	SubscriptionResult,
	WebhookEvent,
} from "../types";
import {
	normalizeCheckoutStatus,
	normalizeRefundStatus,
} from "../helpers";
import {
	PaymentConfigurationError,
	PaymentProviderError,
} from "../errors";

export interface PayPalDriverConfig {
	/** PayPal client ID */
	clientId: string;
	/** PayPal client secret */
	clientSecret: string;
	/** Use sandbox mode (default: false) */
	isProduction?: boolean;
	/** PayPal webhook ID (required for webhook signature verification) */
	webhookId?: string;
}

// ─── API Request/Response Types ───────────────────────────────────────────────

interface PayPalOrderRequest {
	intent: "CAPTURE";
	purchase_units: Array<{
		amount: {
			currency_code: string;
			value: string;
		};
		description?: string;
	}>;
	application_context: {
		brand_name: string;
		landing_page: string;
		user_action: string;
		return_url?: string;
		cancel_url?: string;
	};
}

interface PayPalOrderResponse {
	id: string;
	status: string;
	links: Array<{ href: string; rel: string; method: string }>;
	create_time: string;
}

interface PayPalRefundRequest {
	amount?: {
		value: string;
		currency_code: string;
	};
	note_to_payer?: string;
}

interface PayPalRefundResponse {
	id: string;
	status: string;
	amount: { value: string; currency_code: string };
	note_to_payer?: string;
	create_time: string;
}

interface PayPalSubscriptionRequest {
	plan_id: string;
	start_time: string;
	subscriber?: {
		email_address: string;
	};
}

interface PayPalSubscriptionResponse {
	id: string;
	status: string;
	create_time: string;
	plan_id?: string;
}

interface PayPalAccessTokenResponse {
	access_token: string;
	expires_in: number;
}

interface PayPalErrorResponse {
	name?: string;
	message?: string;
	details?: Array<{ description?: string }>;
}

interface PayPalWebhookResource {
	id: string;
	state?: string;
	amount?: { total: string; currency: string };
	payer?: { email_address?: string };
	create_time?: string;
	[key: string]: unknown;
}

interface PayPalWebhookBody {
	id: string;
	event_type: string;
	resource: PayPalWebhookResource;
	create_time: string;
	resource_type: string;
	[key: string]: unknown;
}

// ─── Base URLs ────────────────────────────────────────────────────────────────

const API_BASE_SANDBOX = "https://api-m.sandbox.paypal.com";
const API_BASE_PROD = "https://api-m.paypal.com";

// ─── Driver ───────────────────────────────────────────────────────────────────

export class PayPalDriver implements PaymentDriver {
	readonly id = "paypal";

	private clientId: string;
	private clientSecret: string;
	private apiBase: string;
	private webhookId?: string;
	private accessToken?: string;
	private tokenExpiry = 0;

	constructor(config: PayPalDriverConfig) {
		if (!config.clientId || !config.clientSecret) {
			throw new PaymentConfigurationError(
				this.id,
				"PayPal clientId and clientSecret are required",
			);
		}
		this.clientId = config.clientId;
		this.clientSecret = config.clientSecret;
		this.apiBase = config.isProduction ? API_BASE_PROD : API_BASE_SANDBOX;
		this.webhookId = config.webhookId;
	}

	// ─── Auth ─────────────────────────────────────────────────────────────

	private async getAccessToken(): Promise<string> {
		if (this.accessToken && Date.now() < this.tokenExpiry) {
			return this.accessToken;
		}

		const encoded = btoa(`${this.clientId}:${this.clientSecret}`);
		const res = await fetch(`${this.apiBase}/v1/oauth2/token`, {
			method: "POST",
			headers: {
				Authorization: `Basic ${encoded}`,
				"Content-Type": "application/x-www-form-urlencoded",
			},
			body: "grant_type=client_credentials",
		});

		const raw = await res.text();
		let data: PayPalAccessTokenResponse;
		try {
			data = JSON.parse(raw) as PayPalAccessTokenResponse;
		} catch {
			throw new PaymentProviderError(
				this.id,
				"AUTH_ERROR",
				`PayPal returned non-JSON response (status ${res.status}): ${raw.slice(0, 200)}`,
			);
		}

		if (!res.ok || !data.access_token) {
			throw new PaymentProviderError(
				this.id,
				"AUTH_ERROR",
				"Failed to obtain PayPal access token",
			);
		}

		this.accessToken = data.access_token;
		this.tokenExpiry = Date.now() + (data.expires_in - 300) * 1000;

		return this.accessToken;
	}

	// ─── HTTP ──────────────────────────────────────────────────────────────

	private async request<T>(
		method: string,
		path: string,
		body?: PayPalOrderRequest | PayPalRefundRequest | PayPalSubscriptionRequest,
	): Promise<T> {
		const url = `${this.apiBase}${path}`;
		const token = await this.getAccessToken();
		const headers: Record<string, string> = {
			Authorization: `Bearer ${token}`,
			"Content-Type": "application/json",
			Prefer: "return=representation",
		};

		const res = await fetch(url, {
			method,
			headers,
			body: body ? JSON.stringify(body) : undefined,
		});

		if (res.status === 204) {
			return {} as T;
		}

		const raw = await res.text();
		let data: Record<string, unknown>;
		try {
			data = JSON.parse(raw) as Record<string, unknown>;
		} catch {
			throw new PaymentProviderError(
				this.id,
				"api_error",
				`PayPal returned non-JSON response (status ${res.status}): ${raw.slice(0, 200)}`,
			);
		}

		if (!res.ok) {
			const errData = data as unknown as PayPalErrorResponse;
			throw new PaymentProviderError(
				this.id,
				errData.name ?? "api_error",
				errData.message ??
					errData.details?.[0]?.description ??
					"PayPal API error",
			);
		}

		return data as T;
	}

	// ─── Checkout (Order) ─────────────────────────────────────────────────

	async createCheckout(
		input: CreateCheckoutInput,
		opts?: PaymentOptions,
	): Promise<CheckoutResult> {
		const params: PayPalOrderRequest = {
			intent: "CAPTURE",
			purchase_units: [
				{
					amount: {
						currency_code: input.currency.toUpperCase(),
						value: input.amount.toFixed(2),
					},
					description: input.description ?? "Payment",
				},
			],
			application_context: {
				brand_name: "Buntok Store",
				landing_page: "BILLING",
				user_action: "PAY_NOW",
			},
		};

		if (input.successUrl) {
			params.application_context.return_url = input.successUrl;
		}
		if (input.cancelUrl) {
			params.application_context.cancel_url = input.cancelUrl;
		}

		const res = await this.request<PayPalOrderResponse>(
			"POST",
			"/v2/checkout/orders",
			params,
		);

		const approveLink = res.links.find((l) => l.rel === "approve");

		return {
			id: res.id,
			status: normalizeCheckoutStatus(this.id, res.status),
			amount: input.amount,
			currency: input.currency.toUpperCase(),
			provider: this.id,
			checkoutUrl: approveLink?.href,
			providerPaymentId: res.id,
			metadata: input.metadata,
			createdAt: res.create_time ? new Date(res.create_time) : new Date(),
		};
	}

	// ─── Refund ───────────────────────────────────────────────────────────

	async createRefund(
		input: CreateRefundInput,
		opts?: PaymentOptions,
	): Promise<RefundResult> {
		const params: PayPalRefundRequest = {};
		if (input.amount) {
			params.amount = {
				value: input.amount.toFixed(2),
				currency_code: "USD",
			};
		}
		if (input.reason) {
			params.note_to_payer = input.reason;
		}

		const res = await this.request<PayPalRefundResponse>(
			"POST",
			`/v2/payments/captures/${input.paymentId}/refund`,
			params,
		);

		const refundAmount = res.amount?.value ? Number(res.amount.value) : 0;

		return {
			id: res.id,
			status: normalizeRefundStatus(this.id, res.status),
			amount: refundAmount,
			currency: res.amount?.currency_code ?? "USD",
			provider: this.id,
			paymentId: input.paymentId,
			reason: res.note_to_payer ?? input.reason,
			metadata: input.metadata,
			createdAt: res.create_time ? new Date(res.create_time) : new Date(),
		};
	}

	// ─── Subscription ─────────────────────────────────────────────────────

	async createSubscription(
		input: CreateSubscriptionInput,
		opts?: PaymentOptions,
	): Promise<SubscriptionResult> {
		const params: PayPalSubscriptionRequest = {
			plan_id: input.planId,
			start_time: new Date(Date.now() + 60000).toISOString(),
		};

		if (input.customerEmail) {
			params.subscriber = {
				email_address: input.customerEmail,
			};
		}

		const res = await this.request<PayPalSubscriptionResponse>(
			"POST",
			"/v1/billing/subscriptions",
			params,
		);

		return {
			id: res.id,
			status: res.status === "ACTIVE" ? "active" : res.status === "CANCELLED" ? "cancelled" : "incomplete",
			provider: this.id,
			planId: res.plan_id ?? input.planId,
			customerEmail: input.customerEmail,
			metadata: input.metadata,
			createdAt: res.create_time ? new Date(res.create_time) : new Date(),
		};
	}

	// ─── Webhook Verification ─────────────────────────────────────────────

	async verifyWebhookSignature(
		payload: string,
		signature: string,
		secret: string,
		headers?: Headers,
	): Promise<boolean> {
		// PayPal webhook signatures are certificate-based and cannot be
		// verified offline - they must be confirmed against PayPal's
		// verify-webhook-signature API. Any network/API failure fails closed.
		const webhookId = secret || this.webhookId;
		if (!webhookId) return false;

		let event: unknown;
		try {
			event = JSON.parse(payload);
		} catch {
			return false;
		}

		try {
			const token = await this.getAccessToken();
			const res = await fetch(`${this.apiBase}/v1/notifications/verify-webhook-signature`, {
				method: "POST",
				headers: {
					Authorization: `Bearer ${token}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					auth_algo: headers?.get("paypal-auth-algo") ?? "",
					cert_id: headers?.get("paypal-cert-id") ?? "",
					transmission_id: headers?.get("paypal-transmission-id") ?? "",
					transmission_sig: signature,
					transmission_time: headers?.get("paypal-transmission-time") ?? "",
					webhook_id: webhookId,
					webhook_event: event,
				}),
			});
			if (!res.ok) return false;
			const data = (await res.json()) as { verification_status?: string };
			return data.verification_status === "SUCCESS";
		} catch {
			return false;
		}
	}

	parseWebhookEvent(payload: string): WebhookEvent {
		const body = JSON.parse(payload) as PayPalWebhookBody;

		const typeMap: Record<string, WebhookEvent["type"]> = {
			"PAYMENT.CAPTURE.COMPLETED": "payment.completed",
			"PAYMENT.CAPTURE.DECLINED": "payment.failed",
			"PAYMENT.CAPTURE.REFUNDED": "refund.completed",
			"PAYMENT.CAPTURE.PENDING": "payment.created",
			"CHECKOUT.ORDER.APPROVED": "payment.completed",
			"BILLING.SUBSCRIPTION.CREATED": "subscription.created",
			"BILLING.SUBSCRIPTION.CANCELLED": "subscription.cancelled",
			"BILLING.SUBSCRIPTION.SUSPENDED": "subscription.suspended",
			"BILLING.SUBSCRIPTION.PAYMENT.SUCCEEDED": "subscription.payment_succeeded",
			"BILLING.SUBSCRIPTION.PAYMENT.FAILED": "subscription.payment_failed",
			"PAYMENT.REFUND.FAILED": "refund.failed",
		};

		const normalizedType = typeMap[body.event_type] ?? "payment.created";
		const amount = body.resource.amount?.total
			? Number(body.resource.amount.total)
			: undefined;

		return {
			id: body.id,
			type: normalizedType,
			provider: this.id,
			rawData: body,
			entityId: body.resource.id,
			amount,
			currency: body.resource.amount?.currency,
			status: body.resource.state,
			createdAt: body.create_time ? new Date(body.create_time) : new Date(),
		};
	}
}
