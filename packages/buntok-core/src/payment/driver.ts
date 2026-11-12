import type {
	CheckoutResult,
	CreateCheckoutInput,
	CreatePaymentLinkInput,
	CreateRefundInput,
	CreateSubscriptionInput,
	PaymentLinkResult,
	PaymentOptions,
	RefundResult,
	SubscriptionResult,
	WebhookEvent,
} from "./types";

/**
 * Pluggable payment driver interface.
 * Implement this to add a new payment provider.
 *
 * @example
 * ```ts
 * const driver: PaymentDriver = new StripeDriver({ secretKey: "sk_..." });
 * const checkout = await driver.createCheckout({
 *   amount: 10000,
 *   currency: "IDR",
 *   description: "Order #123",
 * });
 * ```
 */
export interface PaymentDriver {
	/** Unique provider identifier (e.g., "stripe", "midtrans", "xendit", "paypal") */
	readonly id: string;

	/** Create a checkout session / payment page */
	createCheckout(
		input: CreateCheckoutInput,
		opts?: PaymentOptions,
	): Promise<CheckoutResult>;

	/** Create a refund for an existing payment */
	createRefund(
		input: CreateRefundInput,
		opts?: PaymentOptions,
	): Promise<RefundResult>;

	/** Create a recurring subscription (if supported by the provider) */
	createSubscription?(
		input: CreateSubscriptionInput,
		opts?: PaymentOptions,
	): Promise<SubscriptionResult>;

	/** Create a shareable payment link */
	createPaymentLink?(
		input: CreatePaymentLinkInput,
	): Promise<PaymentLinkResult>;

	/** Verify a webhook signature from the provider */
	verifyWebhookSignature(
		payload: string,
		signature: string,
		secret: string,
		headers?: Headers,
	): Promise<boolean> | boolean;

	/** Parse raw webhook payload into a normalized WebhookEvent */
	parseWebhookEvent(payload: string): WebhookEvent;

	/** Get transaction status from the provider (optional) */
	getTransactionStatus?(
		orderId: string,
	): Promise<TransactionStatusResult>;
}

// ─── Transaction Status Result ──────────────────────────────────────────────

export interface TransactionStatusResult {
	orderId: string;
	transactionId?: string;
	status: string;
	paymentType?: string;
	amount?: number;
	currency?: string;
	createdAt?: Date;
	rawData?: unknown;
}
