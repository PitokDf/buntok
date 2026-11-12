import type { PaymentDriver } from "../driver";
import type {
	CreateCheckoutInput,
	CreatePaymentLinkInput,
	CreateRefundInput,
	CheckoutResult,
	PaymentLinkResult,
	PaymentOptions,
	RefundResult,
	WebhookEvent,
} from "../types";
import {
	normalizeCheckoutStatus,
	normalizeRefundStatus,
	safeEqual,
} from "../helpers";
import {
	PaymentProviderError,
} from "../errors";

export interface XenditDriverConfig {
	/** Your Xendit secret API key (e.g., "xnd_development_...") */
	secretKey: string;
	/** Use sandbox mode (default: false) */
	isProduction?: boolean;
}

// ─── API Request/Response Types ───────────────────────────────────────────────

interface XenditPaymentMethod {
	type: string;
	reusability?: string;
	permanent?: boolean;
	bank_transfer?: { bank: string };
	virtual_account_info?: { permanent: boolean };
}

interface XenditPaymentRequest {
	reference_id: string;
	amount: number;
	currency: string;
	payment_method: XenditPaymentMethod;
	description?: string;
	customer?: {
		reference_id: string;
		email?: string;
		name?: string;
	};
	metadata?: Record<string, unknown>;
}

interface XenditPaymentResponse {
	id: string;
	reference_id: string;
	status: string;
	amount: number;
	currency: string;
	description: string;
	created: string;
	updated: string;
	actions?: Array<{ url: string }>;
	metadata?: Record<string, unknown>;
}

interface XenditRefundRequest {
	payment_request_id: string;
	amount?: number;
	reason?: string;
}

interface XenditRefundResponse {
	id: string;
	payment_request_id: string;
	status: string;
	amount: number;
	created: string;
}

interface XenditErrorResponse {
	error_code?: string;
	message?: string;
	errors?: Array<{ message?: string }>;
}

interface XenditWebhookBody {
	id: string;
	reference_id?: string;
	status: string;
	amount: number;
	currency: string;
	created: string;
	updated?: string;
	description?: string;
	payment_request_id?: string;
	metadata?: Record<string, unknown>;
	[key: string]: unknown;
}

// ─── Driver ───────────────────────────────────────────────────────────────────

export class XenditDriver implements PaymentDriver {
	readonly id = "xendit";

	private secretKey: string;
	private apiBase: string;

	constructor(config: XenditDriverConfig) {
		if (!config.secretKey) {
			throw new PaymentProviderError(
				this.id,
				"CONFIGURATION_ERROR",
				"Xendit secretKey is required",
			);
		}
		this.secretKey = config.secretKey;
		this.apiBase = "https://api.xendit.co";
	}

	// ─── HTTP ──────────────────────────────────────────────────────────────

	private async request<T>(
		method: string,
		path: string,
		body?: XenditPaymentRequest | XenditRefundRequest,
	): Promise<T> {
		const url = `${this.apiBase}${path}`;
		const headers: Record<string, string> = {
			Authorization: this.secretKey,
			"Content-Type": "application/json",
		};

		const res = await fetch(url, {
			method,
			headers,
			body: body ? JSON.stringify(body) : undefined,
		});

		const raw = await res.text();
		let data: Record<string, unknown>;
		try {
			data = JSON.parse(raw) as Record<string, unknown>;
		} catch {
			throw new PaymentProviderError(
				this.id,
				"api_error",
				`Xendit returned non-JSON response (status ${res.status}): ${raw.slice(0, 200)}`,
			);
		}

		if (!res.ok) {
			const errData = data as unknown as XenditErrorResponse;
			throw new PaymentProviderError(
				this.id,
				errData.error_code ?? "api_error",
				errData.message ??
					errData.errors?.[0]?.message ??
					"Xendit API error",
			);
		}

		return data as T;
	}

	// ─── Checkout (Payment Request) ───────────────────────────────────────

	async createCheckout(
		input: CreateCheckoutInput,
		opts?: PaymentOptions,
	): Promise<CheckoutResult> {
		const referenceId = opts?.orderId ?? `REF-${crypto.randomUUID().slice(0, 8)}`;

		const params: XenditPaymentRequest = {
			reference_id: referenceId,
			amount: input.amount,
			currency: input.currency.toUpperCase(),
			payment_method: {
				type: "VIRTUAL_ACCOUNT",
				permanent: false,
			},
			description: input.description ?? "Payment",
		};

		if (input.customerEmail || input.customerName) {
			params.customer = {
				reference_id: referenceId,
				email: input.customerEmail,
				name: input.customerName,
			};
		}

		if (input.metadata) {
			params.metadata = input.metadata;
		}

		const res = await this.request<XenditPaymentResponse>(
			"POST",
			"/payment_requests",
			params,
		);

		const actions = res.actions ?? [];
		const checkoutUrl = actions.find((a) => a.url)?.url;

		return {
			id: res.id,
			status: normalizeCheckoutStatus(this.id, res.status),
			amount: res.amount,
			currency: res.currency,
			provider: this.id,
			checkoutUrl,
			providerPaymentId: res.id,
			metadata: res.metadata,
			createdAt: new Date(res.created),
		};
	}

	// ─── Refund ───────────────────────────────────────────────────────────

	async createRefund(
		input: CreateRefundInput,
		opts?: PaymentOptions,
	): Promise<RefundResult> {
		const params: XenditRefundRequest = {
			payment_request_id: input.paymentId,
		};
		if (input.amount) {
			params.amount = input.amount;
		}
		if (input.reason) {
			params.reason = input.reason;
		}

		const res = await this.request<XenditRefundResponse>(
			"POST",
			"/refunds",
			params,
		);

		return {
			id: res.id,
			status: normalizeRefundStatus(this.id, res.status),
			amount: res.amount,
			currency: "IDR",
			provider: this.id,
			paymentId: res.payment_request_id,
			reason: input.reason,
			metadata: input.metadata,
			createdAt: new Date(res.created),
		};
	}

	// ─── Payment Link ─────────────────────────────────────────────────────

	async createPaymentLink(
		input: CreatePaymentLinkInput,
	): Promise<PaymentLinkResult> {
		const params: XenditPaymentRequest = {
			reference_id: `REF-${crypto.randomUUID().slice(0, 8)}`,
			amount: input.amount,
			currency: input.currency.toUpperCase(),
			payment_method: {
				type: "VIRTUAL_ACCOUNT",
			},
			description: input.description ?? "Payment",
		};

		if (input.metadata) {
			params.metadata = input.metadata;
		}

		const res = await this.request<XenditPaymentResponse>(
			"POST",
			"/payment_requests",
			params,
		);

		const actions = res.actions ?? [];
		const url = actions.find((a) => a.url)?.url ?? "";

		return {
			id: res.id,
			url,
			amount: res.amount,
			currency: res.currency,
			provider: this.id,
			metadata: res.metadata,
			expiresAt: input.expiresAt ? new Date(input.expiresAt) : undefined,
			createdAt: new Date(res.created),
		};
	}

	// ─── Webhook Verification ─────────────────────────────────────────────

	async verifyWebhookSignature(
		payload: string,
		signature: string,
		secret: string,
	): Promise<boolean> {
		try {
			// Xendit's `x-callback-token` header is a static verification
			// token - compare it directly with the configured secret, in
			// constant time.
			return await safeEqual(secret, signature);
		} catch {
			return false;
		}
	}

	parseWebhookEvent(payload: string): WebhookEvent {
		const body = JSON.parse(payload) as XenditWebhookBody;

		const typeMap: Record<string, WebhookEvent["type"]> = {
			SUCCEEDED: "payment.completed",
			PENDING: "payment.created",
			FAILED: "payment.failed",
			REQUIRES_ACTION: "payment.failed",
			CANCELLED: "payment.failed",
			EXPIRED: "payment.expired",
		};

		return {
			id: body.id,
			type: typeMap[body.status] ?? "payment.created",
			provider: this.id,
			rawData: body,
			entityId: body.id,
			amount: body.amount,
			currency: body.currency,
			status: body.status,
			metadata: body.metadata,
			createdAt: new Date(body.created),
		};
	}
}
