import type { Middleware } from "../../app";
import type { Context } from "../../context";
import { PaymentVerificationError } from "../errors";
import type { PaymentDriver } from "../driver";

export interface WebhookMiddlewareOptions {
	/** The payment driver to use for verification */
	driver: PaymentDriver;
	/** Webhook signing secret from the payment provider */
	secret: string;
	/**
	 * Header name that contains the signature.
	 * Defaults vary by provider: Stripe uses "stripe-signature",
	 * Midtrans uses "x-signature", Xendit uses "x-callback-token",
	 * PayPal uses "paypal-transmission-sig".
	 */
	signatureHeader?: string;
}

/**
 * Middleware that verifies payment webhook signatures and injects
 * the parsed event into `ctx.store.paymentEvent`.
 *
 * @example
 * ```ts
 * import { paymentWebhook } from "@buntok/core/payment";
 *
 * const stripe = new StripeDriver({ secretKey: "sk_..." });
 *
 * app.post("/webhooks/stripe",
 *   paymentWebhook({
 *     driver: stripe,
 *     secret: process.env.STRIPE_WEBHOOK_SECRET!,
 *     signatureHeader: "stripe-signature",
 *   }),
 *   (ctx) => {
 *     const event = ctx.store.paymentEvent;
 *     // Handle the event...
 *     return ctx.json({ received: true });
 *   }
 * );
 * ```
 */
export function paymentWebhook(options: WebhookMiddlewareOptions): Middleware {
	const {
		driver,
		secret,
		signatureHeader = getDefaultSignatureHeader(driver.id),
	} = options;

	return async (ctx: Context, next: () => Promise<Response> | Response) => {
		const rawBody = await ctx.request.text();
		const signature = ctx.request.headers.get(signatureHeader) ?? "";

		const isValid = await driver.verifyWebhookSignature(rawBody, signature, secret);
		if (!isValid) {
			throw new PaymentVerificationError(driver.id);
		}

		const event = driver.parseWebhookEvent(rawBody);
		ctx.store.paymentEvent = event;

		return next();
	};
}

/**
 * Get the default signature header name for a provider.
 */
function getDefaultSignatureHeader(provider: string): string {
	switch (provider) {
		case "stripe":
			return "stripe-signature";
		case "midtrans":
			return "x-signature";
		case "xendit":
			return "x-callback-token";
		case "paypal":
			return "paypal-transmission-sig";
		default:
			return "x-payment-signature";
	}
}
