import { z } from "zod";

// ─── Normalized Status Types ──────────────────────────────────────────────────

export type CheckoutStatus =
	| "pending"
	| "processing"
	| "requires_action"
	| "completed"
	| "failed"
	| "expired"
	| "cancelled";

export type SubscriptionStatus =
	| "active"
	| "past_due"
	| "cancelled"
	| "suspended"
	| "expired"
	| "incomplete";

export type RefundStatus =
	| "pending"
	| "completed"
	| "failed"
	| "partially_refunded";

export type WebhookEventType =
	| "payment.completed"
	| "payment.failed"
	| "payment.expired"
	| "payment.created"
	| "subscription.created"
	| "subscription.cancelled"
	| "subscription.payment_succeeded"
	| "subscription.payment_failed"
	| "subscription.suspended"
	| "refund.completed"
	| "refund.failed";

// ─── Line Item ────────────────────────────────────────────────────────────────

export interface LineItem {
	name: string;
	quantity: number;
	amount: number;
	description?: string;
	imageUrl?: string;
	metadata?: Record<string, unknown>;
}

// ─── Input Schemas ────────────────────────────────────────────────────────────

export const MoneyAmountSchema = z.object({
	amount: z.number().positive(),
	currency: z.string().min(3).max(3).toUpperCase(),
});

export const CreateCheckoutInputSchema = z.object({
	amount: z.number().positive(),
	currency: z.string().min(3).max(3).transform((s) => s.toUpperCase()),
	description: z.string().optional(),
	customerEmail: z.string().email().optional(),
	customerName: z.string().optional(),
	successUrl: z.string().url().optional(),
	cancelUrl: z.string().url().optional(),
	metadata: z.record(z.string(), z.unknown()).optional(),
	items: z
		.array(
			z.object({
				id: z.string().optional(),
				name: z.string(),
				quantity: z.number().int().positive(),
				amount: z.number().positive(),
				description: z.string().optional(),
			}),
		)
		.optional(),
});

export const CreateRefundInputSchema = z.object({
	paymentId: z.string().min(1),
	amount: z.number().positive().optional(),
	reason: z.string().optional(),
	metadata: z.record(z.string(), z.unknown()).optional(),
});

export const CreateSubscriptionInputSchema = z.object({
	planId: z.string().min(1),
	customerEmail: z.string().email().optional(),
	customerName: z.string().optional(),
	metadata: z.record(z.string(), z.unknown()).optional(),
	trialPeriodDays: z.number().int().nonnegative().optional(),
});

export const CreatePaymentLinkInputSchema = z.object({
	amount: z.number().positive(),
	currency: z.string().min(3).max(3).transform((s) => s.toUpperCase()),
	description: z.string().optional(),
	metadata: z.record(z.string(), z.unknown()).optional(),
	expiresAt: z.string().datetime().optional(),
});

// ─── Input Types ──────────────────────────────────────────────────────────────

export type CreateCheckoutInput = z.infer<typeof CreateCheckoutInputSchema>;
export type CreateRefundInput = z.infer<typeof CreateRefundInputSchema>;
export type CreateSubscriptionInput = z.infer<typeof CreateSubscriptionInputSchema>;
export type CreatePaymentLinkInput = z.infer<typeof CreatePaymentLinkInputSchema>;

// ─── Payment Options ──────────────────────────────────────────────────────────

/** Snap checkout (default) - redirect to hosted page */
export interface SnapPaymentOptions {
	orderId?: string;
}

/** QRIS - generate QR code directly via Core API */
export interface QrisPaymentOptions {
	orderId?: string;
	paymentType: "qris";
	acquirer?: "gopay" | "shopeepay" | "other";
}

/** Bank transfer - generate VA number via Core API */
export interface BankTransferPaymentOptions {
	orderId?: string;
	paymentType: "bank_transfer";
	bank: "bca" | "bni" | "bri" | "permata" | "cimb" | "mandiri";
}

/** GoPay - deep link via Core API */
export interface GopayPaymentOptions {
	orderId?: string;
	paymentType: "gopay";
}

/** ShopeePay - deep link via Core API */
export interface ShopeepayPaymentOptions {
	orderId?: string;
	paymentType: "shopeepay";
}

/** Mandiri e-channel - bill code via Core API */
export interface EchannelPaymentOptions {
	orderId?: string;
	paymentType: "echannel";
}

/** Convenience store (Indomaret/Alfamart) - payment code via Core API */
export interface CstorePaymentOptions {
	orderId?: string;
	paymentType: "cstore";
	store?: "indomaret" | "alfamart";
}

export type PaymentOptions =
	| SnapPaymentOptions
	| QrisPaymentOptions
	| BankTransferPaymentOptions
	| GopayPaymentOptions
	| ShopeepayPaymentOptions
	| EchannelPaymentOptions
	| CstorePaymentOptions;

// ─── Result Types ─────────────────────────────────────────────────────────────

export interface CheckoutResult {
	id: string;
	status: CheckoutStatus;
	amount: number;
	currency: string;
	provider: string;
	/** Checkout URL for customer redirect (when status is "pending" or "requires_action") */
	checkoutUrl?: string;
	/** Payment intent / session ID from the provider */
	providerPaymentId?: string;
	clientSecret?: string;
	metadata?: Record<string, unknown>;
	expiresAt?: Date;
	createdAt: Date;
}

export interface RefundResult {
	id: string;
	status: RefundStatus;
	amount: number;
	currency: string;
	provider: string;
	paymentId: string;
	reason?: string;
	metadata?: Record<string, unknown>;
	createdAt: Date;
}

export interface SubscriptionResult {
	id: string;
	status: SubscriptionStatus;
	provider: string;
	planId: string;
	customerEmail?: string;
	metadata?: Record<string, unknown>;
	currentPeriodStart?: Date;
	currentPeriodEnd?: Date;
	createdAt: Date;
}

export interface PaymentLinkResult {
	id: string;
	url: string;
	amount: number;
	currency: string;
	provider: string;
	metadata?: Record<string, unknown>;
	expiresAt?: Date;
	createdAt: Date;
}

// ─── Webhook Event ────────────────────────────────────────────────────────────

export interface WebhookEvent {
	id: string;
	type: WebhookEventType;
	provider: string;
	rawData: unknown;
	/** The payment/subscription ID from the provider */
	entityId?: string;
	amount?: number;
	currency?: string;
	status?: string;
	metadata?: Record<string, unknown>;
	createdAt: Date;
}
