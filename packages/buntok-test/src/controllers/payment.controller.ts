import { Context, Controller, Post } from "@buntok/core";
import { generateCode } from "@buntok/core/helpers";
import { createPayment } from "@buntok/core/payment";

const midtrans = createPayment.midtrans({
	clientKey: "SB-Mid-client-_BxOLfo7ZCtihmRR",
	serverKey: "SB-Mid-server-HGifwPWORna9Rz1xQaIh6MHV",
});

@Controller("/payments")
export class PaymentController {
	@Post("/")
	async createPayment() {
		const result = await midtrans.createCheckout(
			{
				amount: 10000,
				currency: "IDR",
				items: [{ id: generateCode("ORD"), amount: 10000, name: "Test Product", quantity: 1 }],
			},
			{ orderId: generateCode("ORD") },
		);
		return result;
	}

	@Post("/webhook")
	async handleWebhook(ctx: Context) {
		const rawBody = await ctx.request.text();

		const isValid = await midtrans.verifyWebhookSignature(
			rawBody,
			"",
			"SB-Mid-server-HGifwPWORna9Rz1xQaIh6MHV",
		);

		if (!isValid) {
			return ctx.json({ error: "Invalid signature" }, 401);
		}

		const event = midtrans.parseWebhookEvent(rawBody);

		console.log("Received webhook event:", event);

		switch (event.type) {
			case "payment.completed":
				// Handle payment completed event
				console.log("Payment completed:", event.rawData);
				break;
			case "payment.failed":
				// Handle payment failed event
				console.log("Payment failed:", event.rawData);
				break;
			default:
				console.log("Unhandled event type:", event.type);
		}

		return ctx.json({ received: true });
	}
}
