import type { PaymentDriver, TransactionStatusResult } from "../driver";
import type {
	CreateCheckoutInput,
	CreateRefundInput,
	CreateSubscriptionInput,
	CheckoutResult,
	PaymentOptions,
	SnapPaymentOptions,
	QrisPaymentOptions,
	BankTransferPaymentOptions,
	GopayPaymentOptions,
	ShopeepayPaymentOptions,
	EchannelPaymentOptions,
	CstorePaymentOptions,
	RefundResult,
	SubscriptionResult,
	WebhookEvent,
} from "../types";
import {
	normalizeCheckoutStatus,
	normalizeRefundStatus,
} from "../helpers";
import {
	PaymentProviderError,
} from "../errors";

export interface MidtransDriverConfig {
	/** Your Midtrans server key (e.g., "SB-Mid-server-...") */
	serverKey: string;
	/** Your Midtrans client key (for frontend Snap integration) */
	clientKey?: string;
	/** Use sandbox mode (default: false) */
	isProduction?: boolean;
	/** Webhook notification URL for Midtrans to POST to */
	notificationUrl?: string;
}

// ─── API Request/Response Types ───────────────────────────────────────────────

interface MidtransSnapRequest {
	transaction_details: {
		order_id: string;
		gross_amount: number;
	};
	credit_card: { secure: boolean };
	customer_details?: {
		email?: string;
		first_name?: string;
		last_name?: string;
	};
	item_details?: Array<{
		id: string;
		price: number;
		quantity: number;
		name: string;
	}>;
	callbacks?: { finish: string };
	custom_field1?: string;
}

interface MidtransSnapResponse {
	token: string;
	redirect_url: string;
}

interface MidtransRefundRequest {
	refund_type: "full" | "partial";
	refund_amount?: number;
	reason?: string;
}

interface MidtransRefundResponse {
	status_code: string;
	status_message: string;
	transaction_status: string;
}

interface MidtransSubscriptionRequest {
	name: string;
	amount: number;
	currency: string;
	interval: string;
	interval_count: number;
	customer_email?: string;
}

interface MidtransSubscriptionResponse {
	id: string;
	status: string;
	created_at: string;
}

interface MidtransWebhookBody {
	signature_key: string;
	order_id: string;
	status_code: string;
	transaction_status: string;
	gross_amount: string;
	transaction_time: string;
	custom_field1?: string;
	[key: string]: unknown;
}

interface MidtransErrorResponse {
	status_code?: string;
	status_message?: string;
	error_messages?: string[];
	[key: string]: unknown;
}

// ─── Core API Types ─────────────────────────────────────────────────────────

interface MidtransChargeRequest {
	payment_type: string;
	transaction_details: {
		order_id: string;
		gross_amount: number;
	};
	qris?: { acquirer?: string };
	bank_transfer?: { bank?: string };
	gopay?: { enable_callback?: boolean; callback_url?: string };
	shopeepay?: { callback_url?: string };
	echannel?: { bill_info1?: string; bill_info2?: string };
	cstore?: { store?: string; message?: string };
	item_details?: Array<{
		id: string;
		price: number;
		quantity: number;
		name: string;
	}>;
	customer_details?: {
		first_name?: string;
		last_name?: string;
		email?: string;
		phone?: string;
	};
	custom_expiry?: { expiry_duration?: number; unit?: string };
}

interface MidtransChargeResponse {
	status_code: string;
	status_message: string;
	transaction_id: string;
	order_id: string;
	merchant_id?: string;
	gross_amount: string;
	currency?: string;
	payment_type: string;
	transaction_time: string;
	transaction_status: string;
	fraud_status?: string;
	actions?: Array<{
		name: string;
		method: string;
		url: string;
	}>;
	qr_string?: string;
	payment_code?: string;
	// Bank transfer
	permata_va_number?: string;
	bca_va_number?: string;
	bni_va_number?: string;
	bri_va_number?: string;
	cimb_va_number?: string;
	va_numbers?: Array<{ bank: string; va_number: string }>;
	// E-wallet
	deeplink?: string;
	web_url?: string;
	// E-channel
	bill_key?: string;
	biller_code?: string;
}

interface MidtransStatusResponse {
	status_code: string;
	status_message: string;
	transaction_id: string;
	order_id: string;
	gross_amount: string;
	currency?: string;
	payment_type: string;
	transaction_time: string;
	transaction_status: string;
	fraud_status?: string;
	signature_key?: string;
}

// ─── Base URLs ────────────────────────────────────────────────────────────────

const SNAP_BASE_DEV = "https://app.sandbox.midtrans.com/snap";
const SNAP_BASE_PROD = "https://app.midtrans.com/snap";
const API_BASE_DEV = "https://api.sandbox.midtrans.com/v2";
const API_BASE_PROD = "https://api.midtrans.com/v2";

// ─── Driver ───────────────────────────────────────────────────────────────────

export class MidtransDriver implements PaymentDriver {
	readonly id = "midtrans";

	private serverKey: string;
	private snapBase: string;
	private apiBase: string;
	private notificationUrl?: string;

	constructor(config: MidtransDriverConfig) {
		if (!config.serverKey) {
			throw new PaymentProviderError(
				this.id,
				"CONFIGURATION_ERROR",
				"Midtrans serverKey is required",
			);
		}
		this.serverKey = config.serverKey;
		const isProd = config.isProduction ?? false;
		this.snapBase = isProd ? SNAP_BASE_PROD : SNAP_BASE_DEV;
		this.apiBase = isProd ? API_BASE_PROD : API_BASE_DEV;
		this.notificationUrl = config.notificationUrl;
	}

	// ─── HTTP ──────────────────────────────────────────────────────────────

	private authHeader(): string {
		const encoded = btoa(`${this.serverKey}:`);
		return `Basic ${encoded}`;
	}

	private async request<T>(
		method: string,
		base: string,
		path: string,
		body?: MidtransSnapRequest | MidtransChargeRequest | MidtransRefundRequest | MidtransSubscriptionRequest,
	): Promise<T> {
		const url = `${base}${path}`;
		const headers: Record<string, string> = {
			Authorization: this.authHeader(),
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
				`Midtrans returned non-JSON response (status ${res.status}): ${raw.slice(0, 200)}`,
			);
		}

		if (!res.ok || data.error_messages) {
			const errData = data as unknown as MidtransErrorResponse;
			throw new PaymentProviderError(
				this.id,
				errData.status_code ?? "api_error",
				errData.error_messages?.join(", ") ??
					errData.status_message ??
					"Midtrans API error",
			);
		}

		return data as T;
	}

	// ─── Core API ────────────────────────────────────────────────────────

	private async charge<T>(
		body: MidtransChargeRequest,
	): Promise<T> {
		return this.request<T>("POST", this.apiBase, "/charge", body);
	}

	// ─── Checkout ─────────────────────────────────────────────────────────

	async createCheckout(
		input: CreateCheckoutInput,
		opts?: PaymentOptions,
	): Promise<CheckoutResult> {
		// Core API path - direct charge (QRIS, bank transfer, e-wallet)
		if (opts && "paymentType" in opts) {
			return this.createCoreCheckout(input, opts);
		}

		// Snap path - redirect to hosted checkout page
		return this.createSnapCheckout(input, opts);
	}

	private async createSnapCheckout(
		input: CreateCheckoutInput,
		opts?: SnapPaymentOptions,
	): Promise<CheckoutResult> {
		const orderId = opts?.orderId ?? `ORDER-${crypto.randomUUID().slice(0, 8)}`;

		const params: MidtransSnapRequest = {
			transaction_details: {
				order_id: orderId,
				gross_amount: input.amount,
			},
			credit_card: {
				secure: true,
			},
		};

		if (input.customerEmail || input.customerName) {
			const nameParts = input.customerName?.split(" ") ?? [];
			params.customer_details = {
				email: input.customerEmail,
				first_name: nameParts[0],
				last_name: nameParts.slice(1).join(" ") || undefined,
			};
		}

		if (input.items && input.items.length > 0) {
			params.item_details = input.items.map((item) => ({
				id: item.id ?? orderId,
				price: item.amount,
				quantity: item.quantity,
				name: item.name,
			}));
		} else if (input.description) {
			params.item_details = [
				{
					id: orderId,
					price: input.amount,
					quantity: 1,
					name: input.description,
				},
			];
		}

		if (this.notificationUrl) {
			params.callbacks = {
				finish: input.successUrl ?? "https://example.com/success",
			};
		}

		if (input.metadata) {
			params.custom_field1 = JSON.stringify(input.metadata);
		}

		const res = await this.request<MidtransSnapResponse>(
			"POST",
			this.snapBase,
			"/v1/transactions",
			params,
		);

		return {
			id: orderId,
			status: "pending",
			amount: input.amount,
			currency: input.currency.toUpperCase(),
			provider: this.id,
			checkoutUrl: res.redirect_url,
			providerPaymentId: res.token,
			metadata: input.metadata,
			createdAt: new Date(),
		};
	}

	private async createCoreCheckout(
		input: CreateCheckoutInput,
		opts: QrisPaymentOptions | BankTransferPaymentOptions | GopayPaymentOptions | ShopeepayPaymentOptions | EchannelPaymentOptions | CstorePaymentOptions,
	): Promise<CheckoutResult> {
		const orderId = opts.orderId ?? `ORDER-${crypto.randomUUID().slice(0, 8)}`;
		const paymentType = opts.paymentType;

		const params: MidtransChargeRequest = {
			payment_type: paymentType,
			transaction_details: {
				order_id: orderId,
				gross_amount: input.amount,
			},
		};

		// Payment method specific params
		if (paymentType === "qris") {
			params.qris = { acquirer: opts.acquirer };
		} else if (paymentType === "bank_transfer") {
			params.bank_transfer = { bank: opts.bank };
		} else if (paymentType === "gopay") {
			params.gopay = {
				enable_callback: true,
				callback_url: input.successUrl ?? "https://example.com/success",
			};
		} else if (paymentType === "shopeepay") {
			params.shopeepay = {
				callback_url: input.successUrl ?? "https://example.com/success",
			};
		}

		if (input.items && input.items.length > 0) {
			params.item_details = input.items.map((item) => ({
				id: item.id ?? orderId,
				price: item.amount,
				quantity: item.quantity,
				name: item.name,
			}));
		} else if (input.description) {
			params.item_details = [
				{
					id: orderId,
					price: input.amount,
					quantity: 1,
					name: input.description,
				},
			];
		}

		if (input.customerEmail || input.customerName) {
			const nameParts = input.customerName?.split(" ") ?? [];
			params.customer_details = {
				email: input.customerEmail,
				first_name: nameParts[0],
				last_name: nameParts.slice(1).join(" ") || undefined,
			};
		}

		const res = await this.charge<MidtransChargeResponse>(params);

		// Extract QR code URL from actions
		const qrAction = res.actions?.find((a) => a.name === "generate-qr-code");

		// Extract bank/VA info
		const vaNumber = res.bca_va_number ?? res.bni_va_number ?? res.bri_va_number ?? res.permata_va_number;

		return {
			id: orderId,
			status: normalizeCheckoutStatus(this.id, res.transaction_status),
			amount: input.amount,
			currency: input.currency.toUpperCase(),
			provider: this.id,
			checkoutUrl: qrAction?.url,
			providerPaymentId: res.transaction_id,
			metadata: {
				...input.metadata,
				payment_type: res.payment_type,
				qr_string: res.qr_string,
				payment_code: res.payment_code,
				va_number: vaNumber,
				bank: "bank" in opts ? opts.bank : undefined,
				acquirer: "acquirer" in opts ? opts.acquirer : undefined,
				deeplink: res.deeplink,
				bill_key: res.bill_key,
				biller_code: res.biller_code,
			},
			createdAt: new Date(),
		};
	}

	// ─── Transaction Status ──────────────────────────────────────────────

	async getTransactionStatus(
		orderId: string,
	): Promise<TransactionStatusResult> {
		const res = await this.request<MidtransStatusResponse>(
			"GET",
			this.apiBase,
			`/${orderId}/status`,
		);

		return {
			orderId: res.order_id,
			transactionId: res.transaction_id,
			status: res.transaction_status,
			paymentType: res.payment_type,
			amount: res.gross_amount ? Number(res.gross_amount) : undefined,
			currency: res.currency,
			createdAt: res.transaction_time ? new Date(res.transaction_time) : undefined,
			rawData: res,
		};
	}

	// ─── Refund ───────────────────────────────────────────────────────────

	async createRefund(
		input: CreateRefundInput,
		opts?: PaymentOptions,
	): Promise<RefundResult> {
		const params: MidtransRefundRequest = {
			refund_type: input.amount ? "partial" : "full",
		};
		if (input.amount) {
			params.refund_amount = input.amount;
		}
		if (input.reason) {
			params.reason = input.reason;
		}

		const res = await this.request<MidtransRefundResponse>(
			"POST",
			this.apiBase,
			`/transactions/${input.paymentId}/refund`,
			params,
		);

		return {
			id: `${input.paymentId}-refund-${crypto.randomUUID().slice(0, 8)}`,
			status: normalizeRefundStatus(this.id, res.transaction_status),
			amount: input.amount ?? 0,
			currency: "IDR",
			provider: this.id,
			paymentId: input.paymentId,
			reason: input.reason,
			metadata: input.metadata,
			createdAt: new Date(),
		};
	}

	// ─── Subscription (Midtrans Recurring) ────────────────────────────────

	async createSubscription(
		input: CreateSubscriptionInput,
		opts?: PaymentOptions,
	): Promise<SubscriptionResult> {
		const params: MidtransSubscriptionRequest = {
			name: input.planId,
			amount: 0,
			currency: "IDR",
			interval: "month",
			interval_count: 1,
		};

		if (input.customerEmail) {
			params.customer_email = input.customerEmail;
		}

		const res = await this.request<MidtransSubscriptionResponse>(
			"POST",
			this.apiBase,
			"/subscriptions",
			params,
		);

		return {
			id: res.id,
			status: res.status === "active" ? "active" : "incomplete",
			provider: this.id,
			planId: input.planId,
			customerEmail: input.customerEmail,
			metadata: input.metadata,
			createdAt: new Date(res.created_at),
		};
	}

	// ─── Webhook Verification ─────────────────────────────────────────────

	async verifyWebhookSignature(
		payload: string,
		signature: string,
		secret: string,
	): Promise<boolean> {
		try {
			const body = JSON.parse(payload) as MidtransWebhookBody;
			if (!body.signature_key || !body.order_id || !body.status_code || !body.gross_amount) {
				return false;
			}
			const serverKey = secret || this.serverKey;
			const raw = `${body.order_id}${body.status_code}${body.gross_amount}${serverKey}`;
			const computed = await this.sha512(raw);
			return computed === body.signature_key;
		} catch {
			return false;
		}
	}

	private async sha512(message: string): Promise<string> {
		const encoder = new TextEncoder();
		const data = encoder.encode(message);
		const hashBuffer = await crypto.subtle.digest("SHA-512", data);
		return Array.from(new Uint8Array(hashBuffer))
			.map((b) => b.toString(16).padStart(2, "0"))
			.join("");
	}

	parseWebhookEvent(payload: string): WebhookEvent {
		const body = JSON.parse(payload) as MidtransWebhookBody;

		const typeMap: Record<string, WebhookEvent["type"]> = {
			settlement: "payment.completed",
			capture: "payment.completed",
			pending: "payment.created",
			deny: "payment.failed",
			failure: "payment.failed",
			cancel: "payment.failed",
			expire: "payment.expired",
			refund: "refund.completed",
			partial_refund: "refund.completed",
		};

		return {
			id: body.order_id,
			type: typeMap[body.transaction_status] ?? "payment.created",
			provider: this.id,
			rawData: body,
			entityId: body.order_id,
			amount: body.gross_amount ? Number(body.gross_amount) : undefined,
			currency: "IDR",
			status: body.transaction_status,
			metadata: body.custom_field1
				? JSON.parse(body.custom_field1)
				: undefined,
			createdAt: body.transaction_time
				? new Date(body.transaction_time)
				: new Date(),
		};
	}
}
