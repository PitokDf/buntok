import type {
	CheckoutStatus,
	RefundStatus,
	SubscriptionStatus,
} from "./types";

// ─── Constant-Time Comparison ───────────────────────────────────────────────

/**
 * Constant-time string comparison to prevent timing side-channels when
 * verifying signatures/tokens. Returns `false` immediately when byte lengths
 * differ, then uses `crypto.subtle.timingSafeEqual` when they match.
 */
export async function safeEqual(a: string, b: string): Promise<boolean> {
	const encoder = new TextEncoder();
	const ba = encoder.encode(a);
	const bb = encoder.encode(b);
	if (ba.byteLength !== bb.byteLength) return false;
	let result = 0;
	for (let i = 0; i < ba.byteLength; i++) {
		result |= (ba[i] ?? 0) ^ (bb[i] ?? 0);
	}
	return result === 0;
}

// ─── ID Generation ────────────────────────────────────────────────────────────

/**
 * Generate a unique idempotency key for payment operations.
 * Format: `pay_{uuid}` - cryptographically random, safe for concurrent use.
 */
export function generateIdempotencyKey(): string {
	return `pay_${crypto.randomUUID()}`;
}

// ─── Checkout Status Normalization ────────────────────────────────────────────

const STRIPE_CHECKOUT_STATUS: Record<string, CheckoutStatus> = {
	open: "pending",
	complete: "completed",
	expired: "expired",
};

const STRIPE_INTENT_STATUS: Record<string, CheckoutStatus> = {
	requires_payment_method: "pending",
	requires_confirmation: "pending",
	requires_action: "requires_action",
	processing: "processing",
	requires_capture: "processing",
	succeeded: "completed",
	canceled: "cancelled",
};

const MIDTRANS_STATUS: Record<string, CheckoutStatus> = {
	pending: "pending",
	settlement: "completed",
	capture: "completed",
	deny: "failed",
	failure: "failed",
	cancel: "cancelled",
	expire: "expired",
};

const XENDIT_STATUS: Record<string, CheckoutStatus> = {
	PENDING: "pending",
	REQUIRES_ACTION: "requires_action",
	SUCCEEDED: "completed",
	FAILED: "failed",
	CANCELED: "cancelled",
	EXPIRED: "expired",
};

const PAYPAL_STATUS: Record<string, CheckoutStatus> = {
	CREATED: "pending",
	SAVED: "pending",
	APPROVED: "completed",
	VOIDED: "cancelled",
	COMPLETED: "completed",
	PAYER_ACTION_REQUIRED: "requires_action",
};

/**
 * Normalize a provider-specific checkout status into a unified CheckoutStatus.
 *
 * @param provider - The payment provider identifier
 * @param nativeStatus - The provider's native status string
 * @returns The normalized CheckoutStatus
 */
export function normalizeCheckoutStatus(
	provider: string,
	nativeStatus: string,
): CheckoutStatus {
	switch (provider) {
		case "stripe": {
			// Stripe checkout session status OR payment intent status
			return (
				STRIPE_CHECKOUT_STATUS[nativeStatus] ??
				STRIPE_INTENT_STATUS[nativeStatus] ??
				"pending"
			);
		}
		case "midtrans":
			return MIDTRANS_STATUS[nativeStatus] ?? "pending";
		case "xendit":
			return XENDIT_STATUS[nativeStatus] ?? "pending";
		case "paypal":
			return PAYPAL_STATUS[nativeStatus] ?? "pending";
		default:
			return "pending";
	}
}

// ─── Refund Status Normalization ──────────────────────────────────────────────

const STRIPE_REFUND_STATUS: Record<string, RefundStatus> = {
	pending: "pending",
	succeeded: "completed",
	failed: "failed",
	partial: "partially_refunded",
};

const MIDTRANS_REFUND_STATUS: Record<string, RefundStatus> = {
	refund: "completed",
	partial_refund: "partially_refunded",
};

const XENDIT_REFUND_STATUS: Record<string, RefundStatus> = {
	PENDING: "pending",
	SUCCEEDED: "completed",
	FAILED: "failed",
};

const PAYPAL_REFUND_STATUS: Record<string, RefundStatus> = {
	PENDING: "pending",
	COMPLETED: "completed",
	FAILED: "failed",
	REFUNDED: "partially_refunded",
	CANCELLED: "failed",
};

/**
 * Normalize a provider-specific refund status into a unified RefundStatus.
 */
export function normalizeRefundStatus(
	provider: string,
	nativeStatus: string,
): RefundStatus {
	switch (provider) {
		case "stripe":
			return STRIPE_REFUND_STATUS[nativeStatus] ?? "pending";
		case "midtrans":
			return MIDTRANS_REFUND_STATUS[nativeStatus] ?? "pending";
		case "xendit":
			return XENDIT_REFUND_STATUS[nativeStatus] ?? "pending";
		case "paypal":
			return PAYPAL_REFUND_STATUS[nativeStatus] ?? "pending";
		default:
			return "pending";
	}
}

// ─── Subscription Status Normalization ────────────────────────────────────────

const STRIPE_SUBSCRIPTION_STATUS: Record<string, SubscriptionStatus> = {
	active: "active",
	past_due: "past_due",
	canceled: "cancelled",
	unpaid: "expired",
	incomplete: "incomplete",
	incomplete_expired: "expired",
	trialing: "active",
};

const PAYPAL_SUBSCRIPTION_STATUS: Record<string, SubscriptionStatus> = {
	ACTIVE: "active",
	CANCELLED: "cancelled",
	SUSPENDED: "suspended",
	EXPIRED: "expired",
};

/**
 * Normalize a provider-specific subscription status into a unified SubscriptionStatus.
 */
export function normalizeSubscriptionStatus(
	provider: string,
	nativeStatus: string,
): SubscriptionStatus {
	switch (provider) {
		case "stripe":
			return STRIPE_SUBSCRIPTION_STATUS[nativeStatus] ?? "active";
		case "paypal":
			return PAYPAL_SUBSCRIPTION_STATUS[nativeStatus] ?? "active";
		default:
			return "active";
	}
}
