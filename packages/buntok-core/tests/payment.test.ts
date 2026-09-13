import { describe, it, expect } from "bun:test";
import {
	PaymentError,
	PaymentVerificationError,
	PaymentIdempotencyError,
	PaymentProviderError,
	PaymentConfigurationError,
} from "../src/payment/errors";
import {
	generateIdempotencyKey,
	normalizeCheckoutStatus,
	normalizeRefundStatus,
	normalizeSubscriptionStatus,
} from "../src/payment/helpers";
import {
	CreateCheckoutInputSchema,
	CreateRefundInputSchema,
	CreateSubscriptionInputSchema,
	MoneyAmountSchema,
} from "../src/payment/types";

// ─── Payment Errors ─────────────────────────────────────────────────────────────

describe("Payment Errors", () => {
	it("PaymentError should have provider and status", () => {
		const err = new PaymentError("test error", 400, "stripe", "CARD_DECLINED");
		expect(err.message).toBe("test error");
		expect(err.status).toBe(400);
		expect(err.provider).toBe("stripe");
		expect(err.providerCode).toBe("CARD_DECLINED");
		expect(err.name).toBe("PaymentError");
		expect(err).toBeInstanceOf(Error);
	});

	it("PaymentVerificationError should default to 400", () => {
		const err = new PaymentVerificationError("stripe");
		expect(err.status).toBe(400);
		expect(err.providerCode).toBe("VERIFICATION_FAILED");
		expect(err.name).toBe("PaymentVerificationError");
		expect(err.provider).toBe("stripe");
	});

	it("PaymentVerificationError should accept custom message", () => {
		const err = new PaymentVerificationError("midtrans", "Custom message");
		expect(err.message).toBe("Custom message");
	});

	it("PaymentIdempotencyError should default to 409", () => {
		const err = new PaymentIdempotencyError("paypal");
		expect(err.status).toBe(409);
		expect(err.providerCode).toBe("IDEMPOTENCY_CONFLICT");
		expect(err.name).toBe("PaymentIdempotencyError");
	});

	it("PaymentProviderError should default to 502", () => {
		const err = new PaymentProviderError("xendit", "RATE_LIMITED", "Too many requests");
		expect(err.status).toBe(502);
		expect(err.providerCode).toBe("RATE_LIMITED");
		expect(err.message).toBe("Too many requests");
		expect(err.name).toBe("PaymentProviderError");
	});

	it("PaymentConfigurationError should default to 500", () => {
		const err = new PaymentConfigurationError("stripe");
		expect(err.status).toBe(500);
		expect(err.providerCode).toBe("CONFIGURATION_ERROR");
		expect(err.name).toBe("PaymentConfigurationError");
	});
});

// ─── Payment Helpers ────────────────────────────────────────────────────────────

describe("Payment Helpers", () => {
	describe("generateIdempotencyKey", () => {
		it("should generate a key with pay_ prefix", () => {
			const key = generateIdempotencyKey();
			expect(key).toMatch(/^pay_/);
		});

		it("should generate unique keys", () => {
			const k1 = generateIdempotencyKey();
			const k2 = generateIdempotencyKey();
			expect(k1).not.toBe(k2);
		});
	});

	describe("normalizeCheckoutStatus", () => {
		it("should normalize Stripe checkout statuses", () => {
			expect(normalizeCheckoutStatus("stripe", "open")).toBe("pending");
			expect(normalizeCheckoutStatus("stripe", "complete")).toBe("completed");
			expect(normalizeCheckoutStatus("stripe", "expired")).toBe("expired");
		});

		it("should normalize Stripe payment intent statuses", () => {
			expect(normalizeCheckoutStatus("stripe", "requires_payment_method")).toBe("pending");
			expect(normalizeCheckoutStatus("stripe", "requires_confirmation")).toBe("pending");
			expect(normalizeCheckoutStatus("stripe", "requires_action")).toBe("requires_action");
			expect(normalizeCheckoutStatus("stripe", "processing")).toBe("processing");
			expect(normalizeCheckoutStatus("stripe", "requires_capture")).toBe("processing");
			expect(normalizeCheckoutStatus("stripe", "succeeded")).toBe("completed");
			expect(normalizeCheckoutStatus("stripe", "canceled")).toBe("cancelled");
		});

		it("should normalize Midtrans statuses", () => {
			expect(normalizeCheckoutStatus("midtrans", "pending")).toBe("pending");
			expect(normalizeCheckoutStatus("midtrans", "settlement")).toBe("completed");
			expect(normalizeCheckoutStatus("midtrans", "capture")).toBe("completed");
			expect(normalizeCheckoutStatus("midtrans", "deny")).toBe("failed");
			expect(normalizeCheckoutStatus("midtrans", "failure")).toBe("failed");
			expect(normalizeCheckoutStatus("midtrans", "cancel")).toBe("cancelled");
			expect(normalizeCheckoutStatus("midtrans", "expire")).toBe("expired");
		});

		it("should normalize Xendit statuses", () => {
			expect(normalizeCheckoutStatus("xendit", "PENDING")).toBe("pending");
			expect(normalizeCheckoutStatus("xendit", "REQUIRES_ACTION")).toBe("requires_action");
			expect(normalizeCheckoutStatus("xendit", "SUCCEEDED")).toBe("completed");
			expect(normalizeCheckoutStatus("xendit", "FAILED")).toBe("failed");
			expect(normalizeCheckoutStatus("xendit", "CANCELED")).toBe("cancelled");
			expect(normalizeCheckoutStatus("xendit", "EXPIRED")).toBe("expired");
		});

		it("should normalize PayPal statuses", () => {
			expect(normalizeCheckoutStatus("paypal", "CREATED")).toBe("pending");
			expect(normalizeCheckoutStatus("paypal", "APPROVED")).toBe("completed");
			expect(normalizeCheckoutStatus("paypal", "COMPLETED")).toBe("completed");
			expect(normalizeCheckoutStatus("paypal", "VOIDED")).toBe("cancelled");
			expect(normalizeCheckoutStatus("paypal", "PAYER_ACTION_REQUIRED")).toBe("requires_action");
		});

		it("should return pending for unknown provider", () => {
			expect(normalizeCheckoutStatus("unknown", "anything")).toBe("pending");
		});
	});

	describe("normalizeRefundStatus", () => {
		it("should normalize Stripe refund statuses", () => {
			expect(normalizeRefundStatus("stripe", "pending")).toBe("pending");
			expect(normalizeRefundStatus("stripe", "succeeded")).toBe("completed");
			expect(normalizeRefundStatus("stripe", "failed")).toBe("failed");
			expect(normalizeRefundStatus("stripe", "partial")).toBe("partially_refunded");
		});

		it("should return pending for unknown provider", () => {
			expect(normalizeRefundStatus("unknown", "anything")).toBe("pending");
		});
	});

	describe("normalizeSubscriptionStatus", () => {
		it("should normalize Stripe subscription statuses", () => {
			expect(normalizeSubscriptionStatus("stripe", "active")).toBe("active");
			expect(normalizeSubscriptionStatus("stripe", "past_due")).toBe("past_due");
			expect(normalizeSubscriptionStatus("stripe", "canceled")).toBe("cancelled");
			expect(normalizeSubscriptionStatus("stripe", "unpaid")).toBe("expired");
			expect(normalizeSubscriptionStatus("stripe", "trialing")).toBe("active");
			expect(normalizeSubscriptionStatus("stripe", "incomplete")).toBe("incomplete");
		});

		it("should return active for unknown provider", () => {
			expect(normalizeSubscriptionStatus("unknown", "anything")).toBe("active");
		});
	});
});

// ─── Payment Zod Schemas ────────────────────────────────────────────────────────

describe("Payment Zod Schemas", () => {
	describe("MoneyAmountSchema", () => {
		it("should validate valid money amount", () => {
			const result = MoneyAmountSchema.safeParse({ amount: 1000, currency: "usd" });
			expect(result.success).toBe(true);
		});

		it("should uppercase currency", () => {
			const result = MoneyAmountSchema.safeParse({ amount: 1000, currency: "usd" });
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.currency).toBe("USD");
			}
		});

		it("should reject negative amount", () => {
			const result = MoneyAmountSchema.safeParse({ amount: -100, currency: "USD" });
			expect(result.success).toBe(false);
		});

		it("should reject zero amount", () => {
			const result = MoneyAmountSchema.safeParse({ amount: 0, currency: "USD" });
			expect(result.success).toBe(false);
		});
	});

	describe("CreateCheckoutInputSchema", () => {
		it("should validate a basic checkout", () => {
			const result = CreateCheckoutInputSchema.safeParse({
				amount: 5000,
				currency: "idr",
				description: "Test payment",
			});
			expect(result.success).toBe(true);
		});

		it("should require amount and currency", () => {
			const result = CreateCheckoutInputSchema.safeParse({});
			expect(result.success).toBe(false);
		});

		it("should uppercase currency", () => {
			const result = CreateCheckoutInputSchema.safeParse({
				amount: 100,
				currency: "usd",
			});
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.currency).toBe("USD");
			}
		});
	});

	describe("CreateRefundInputSchema", () => {
		it("should validate a refund with reason", () => {
			const result = CreateRefundInputSchema.safeParse({
				paymentId: "pi_123",
				reason: "Customer request",
			});
			expect(result.success).toBe(true);
		});

		it("should require paymentId and reason", () => {
			const result = CreateRefundInputSchema.safeParse({});
			expect(result.success).toBe(false);
		});

		it("should allow optional amount for partial refund", () => {
			const result = CreateRefundInputSchema.safeParse({
				paymentId: "pi_123",
				amount: 500,
				reason: "Partial",
			});
			expect(result.success).toBe(true);
		});
	});

	describe("CreateSubscriptionInputSchema", () => {
		it("should validate a subscription", () => {
			const result = CreateSubscriptionInputSchema.safeParse({
				planId: "price_123",
				customerEmail: "user@example.com",
			});
			expect(result.success).toBe(true);
		});

		it("should require planId", () => {
			const result = CreateSubscriptionInputSchema.safeParse({
				customerEmail: "user@example.com",
			});
			expect(result.success).toBe(false);
		});
	});
});
