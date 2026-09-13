// ─── Types ────────────────────────────────────────────────────────────────────
export type {
	CheckoutResult,
	CheckoutStatus,
	CreateCheckoutInput,
	CreatePaymentLinkInput,
	CreateRefundInput,
	CreateSubscriptionInput,
	LineItem,
	PaymentLinkResult,
	PaymentOptions,
	SnapPaymentOptions,
	QrisPaymentOptions,
	BankTransferPaymentOptions,
	GopayPaymentOptions,
	ShopeepayPaymentOptions,
	EchannelPaymentOptions,
	CstorePaymentOptions,
	RefundResult,
	RefundStatus,
	SubscriptionResult,
	SubscriptionStatus,
	WebhookEvent,
	WebhookEventType,
} from "./types";

export {
	CreateCheckoutInputSchema,
	CreatePaymentLinkInputSchema,
	CreateRefundInputSchema,
	CreateSubscriptionInputSchema,
	MoneyAmountSchema,
} from "./types";

// ─── Errors ───────────────────────────────────────────────────────────────────
export {
	PaymentConfigurationError,
	PaymentError,
	PaymentIdempotencyError,
	PaymentProviderError,
	PaymentVerificationError,
} from "./errors";

// ─── Driver Interface ─────────────────────────────────────────────────────────
export type { PaymentDriver, TransactionStatusResult } from "./driver";

// ─── Helpers ──────────────────────────────────────────────────────────────────
export {
	generateIdempotencyKey,
	normalizeCheckoutStatus,
	normalizeRefundStatus,
	normalizeSubscriptionStatus,
} from "./helpers";

// ─── Middleware ────────────────────────────────────────────────────────────────
export { paymentWebhook } from "./middleware/webhook";
export type { WebhookMiddlewareOptions } from "./middleware/webhook";

// ─── Drivers ──────────────────────────────────────────────────────────────────
export { StripeDriver, type StripeDriverConfig } from "./drivers/stripe";
export { MidtransDriver, type MidtransDriverConfig } from "./drivers/midtrans";
export { XenditDriver, type XenditDriverConfig } from "./drivers/xendit";
export { PayPalDriver, type PayPalDriverConfig } from "./drivers/paypal";

// ─── Convenience Factory ──────────────────────────────────────────────────────
import type { PaymentDriver } from "./driver";
import type { StripeDriverConfig } from "./drivers/stripe";
import { StripeDriver } from "./drivers/stripe";
import type { MidtransDriverConfig } from "./drivers/midtrans";
import { MidtransDriver } from "./drivers/midtrans";
import type { XenditDriverConfig } from "./drivers/xendit";
import { XenditDriver } from "./drivers/xendit";
import type { PayPalDriverConfig } from "./drivers/paypal";
import { PayPalDriver } from "./drivers/paypal";

/**
 * Create payment drivers with a simple factory API.
 *
 * @example
 * ```ts
 * import { createPayment } from "@buntok/core/payment";
 *
 * const stripe = createPayment.stripe({
 *   secretKey: process.env.STRIPE_SECRET_KEY!,
 *   webhookSecret: process.env.STRIPE_WEBHOOK_SECRET!,
 * });
 *
 * const midtrans = createPayment.midtrans({
 *   serverKey: process.env.MIDTRANS_SERVER_KEY!,
 *   isProduction: false,
 * });
 * ```
 */
export const createPayment = {
	stripe: (config: StripeDriverConfig): PaymentDriver => new StripeDriver(config),
	midtrans: (config: MidtransDriverConfig): PaymentDriver => new MidtransDriver(config),
	xendit: (config: XenditDriverConfig): PaymentDriver => new XenditDriver(config),
	paypal: (config: PayPalDriverConfig): PaymentDriver => new PayPalDriver(config),
};
