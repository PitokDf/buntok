import { Heading } from "@/components/ui/Heading";
import { CodeBlock } from "@/components/ui/CodeBlock";
import { Callout } from "@/components/ui/Callout";

export const metadata = {
  title: "Payment",
  description: "Pluggable payment gateway integration with Stripe, Midtrans, Xendit, and PayPal.",
};

export default function PaymentPage() {
  return (
    <div>
      <Heading level={1} className="text-4xl font-bold mt-8 mb-4 text-text-primary">
        Payment
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Pluggable payment gateway integration supporting Stripe, Midtrans, Xendit, and PayPal.
        All providers share a unified <code>PaymentDriver</code> interface with normalized types.
      </p>

      {/* ──────────────── SETUP ──────────────── */}
      <Heading level={2} className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2">
        Setup
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Use the <code>createPayment</code> factory to instantiate drivers:
      </p>
      <CodeBlock
        code={`import { createPayment } from "@buntok/core/payment";

const stripe = createPayment.stripe({
  secretKey: process.env.STRIPE_SECRET_KEY!,
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET!,
});

const midtrans = createPayment.midtrans({
  serverKey: process.env.MIDTRANS_SERVER_KEY!,
  isProduction: false,
});

const xendit = createPayment.xendit({
  secretKey: process.env.XENDIT_SECRET_KEY!,
});

const paypal = createPayment.paypal({
  clientId: process.env.PAYPAL_CLIENT_ID!,
  clientSecret: process.env.PAYPAL_CLIENT_SECRET!,
  mode: "sandbox",
});`}
      />

      <Heading level={3} className="text-xl font-semibold mt-6 mb-2 text-text-primary">
        Driver Configuration
      </Heading>
      <div className="my-4 overflow-x-auto">
        <table className="w-full text-sm text-text-secondary border border-border-primary rounded-lg overflow-hidden">
          <thead className="bg-bg-tertiary border-b border-border-primary">
            <tr>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">Driver</th>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">Config</th>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">Required Fields</th>
            </tr>
          </thead>
          <tbody>
            {[
              ["Stripe", "StripeDriverConfig", "secretKey"],
              ["Midtrans", "MidtransDriverConfig", "serverKey, isProduction"],
              ["Xendit", "XenditDriverConfig", "secretKey"],
              ["PayPal", "PayPalDriverConfig", "clientId, clientSecret, mode"],
            ].map(([driver, config, fields]) => (
              <tr key={driver} className="border-b border-border-primary/50 hover:bg-bg-tertiary/50 transition-colors">
                <td className="px-4 py-2 font-mono text-accent">{driver}</td>
                <td className="px-4 py-2 font-mono text-text-secondary">{config}</td>
                <td className="px-4 py-2">{fields}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ──────────────── CHECKOUT ──────────────── */}
      <Heading level={2} className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2">
        Checkout
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Create a checkout session to collect payments:
      </p>
      <CodeBlock
        code={`const result = await stripe.createCheckout({
  amount: 100000,
  currency: "IDR",
  description: "Order #123",
  customerEmail: "user@example.com",
  successUrl: "https://myapp.com/success",
  cancelUrl: "https://myapp.com/cancel",
}, {
  idempotencyKey: "order-123",
});

// result.checkoutUrl → redirect customer to pay
// result.status → "pending" | "processing" | "completed" | "failed" | ...`}
      />

      <Heading level={3} className="text-xl font-semibold mt-6 mb-2 text-text-primary">
        CheckoutResult
      </Heading>
      <div className="my-4 overflow-x-auto">
        <table className="w-full text-sm text-text-secondary border border-border-primary rounded-lg overflow-hidden">
          <thead className="bg-bg-tertiary border-b border-border-primary">
            <tr>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">Field</th>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">Type</th>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">Description</th>
            </tr>
          </thead>
          <tbody>
            {[
              ["id", "string", "Provider checkout/session ID"],
              ["status", "CheckoutStatus", "Normalized status"],
              ["amount", "number", "Amount in smallest currency unit"],
              ["currency", "string", "3-letter currency code"],
              ["provider", "string", "Provider identifier"],
              ["checkoutUrl", "string?", "Redirect URL for customer"],
              ["providerPaymentId", "string?", "Payment intent/session ID"],
              ["clientSecret", "string?", "Client-side secret"],
              ["metadata", "Record?", "Provider-specific metadata"],
              ["expiresAt", "Date?", "Expiration timestamp"],
              ["createdAt", "Date", "Creation timestamp"],
            ].map(([field, type, desc]) => (
              <tr key={field} className="border-b border-border-primary/50 hover:bg-bg-tertiary/50 transition-colors">
                <td className="px-4 py-2 font-mono text-accent">{field}</td>
                <td className="px-4 py-2 font-mono text-text-secondary">{type}</td>
                <td className="px-4 py-2">{desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Heading level={3} className="text-xl font-semibold mt-6 mb-2 text-text-primary">
        CheckoutStatus
      </Heading>
      <CodeBlock
        code={`type CheckoutStatus =
  | "pending"
  | "processing"
  | "requires_action"
  | "completed"
  | "failed"
  | "expired"
  | "cancelled";`}
      />

      {/* ──────────────── REFUND ──────────────── */}
      <Heading level={2} className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2">
        Refund
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Create a refund for an existing payment:
      </p>
      <CodeBlock
        code={`const refund = await stripe.createRefund({
  paymentId: "pi_xxx",
  amount: 50000,      // partial refund (omit for full)
  reason: "customer_request",
});

// refund.status → "pending" | "completed" | "failed" | "partially_refunded"`}
      />

      {/* ──────────────── SUBSCRIPTION ──────────────── */}
      <Heading level={2} className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2">
        Subscription
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Create and manage recurring subscriptions:
      </p>
      <CodeBlock
        code={`const sub = await stripe.createSubscription({
  planId: "price_xxx",
  customerEmail: "user@example.com",
  trialPeriodDays: 14,
});

// Cancel
await stripe.cancelSubscription(sub.id);`}
      />

      <Heading level={3} className="text-xl font-semibold mt-6 mb-2 text-text-primary">
        SubscriptionStatus
      </Heading>
      <CodeBlock
        code={`type SubscriptionStatus =
  | "active"
  | "past_due"
  | "cancelled"
  | "suspended"
  | "expired"
  | "incomplete";`}
      />

      {/* ──────────────── PAYMENT LINK ──────────────── */}
      <Heading level={2} className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2">
        Payment Link
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Generate a shareable payment link:
      </p>
      <CodeBlock
        code={`const link = await stripe.createPaymentLink({
  amount: 100000,
  currency: "IDR",
  description: "One-time payment",
});

// link.url → share with customer`}
      />

      {/* ──────────────── WEBHOOKS ──────────────── */}
      <Heading level={2} className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2">
        Webhooks
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Handle webhook events with signature verification:
      </p>
      <CodeBlock
        code={`import { paymentWebhook } from "@buntok/core/payment";

app.post("/webhooks/stripe",
  paymentWebhook({
    driver: stripe,
    secret: process.env.STRIPE_WEBHOOK_SECRET!,
  }),
  (ctx) => {
    const event = ctx.store.paymentEvent;
    // event.type → "payment.completed" | "payment.failed" | ...
    return ctx.json({ received: true });
  }
);`}
      />

      <Heading level={3} className="text-xl font-semibold mt-6 mb-2 text-text-primary">
        WebhookMiddlewareOptions
      </Heading>
      <div className="my-4 overflow-x-auto">
        <table className="w-full text-sm text-text-secondary border border-border-primary rounded-lg overflow-hidden">
          <thead className="bg-bg-tertiary border-b border-border-primary">
            <tr>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">Field</th>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">Type</th>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">Description</th>
            </tr>
          </thead>
          <tbody>
            {[
              ["driver", "PaymentDriver", "Payment driver for verification"],
              ["secret", "string", "Webhook signing secret from provider"],
              ["signatureHeader", "string?", "Override signature header name"],
            ].map(([field, type, desc]) => (
              <tr key={field} className="border-b border-border-primary/50 hover:bg-bg-tertiary/50 transition-colors">
                <td className="px-4 py-2 font-mono text-accent">{field}</td>
                <td className="px-4 py-2 font-mono text-text-secondary">{type}</td>
                <td className="px-4 py-2">{desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Heading level={3} className="text-xl font-semibold mt-6 mb-2 text-text-primary">
        WebhookEvent
      </Heading>
      <div className="my-4 overflow-x-auto">
        <table className="w-full text-sm text-text-secondary border border-border-primary rounded-lg overflow-hidden">
          <thead className="bg-bg-tertiary border-b border-border-primary">
            <tr>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">Field</th>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">Type</th>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">Description</th>
            </tr>
          </thead>
          <tbody>
            {[
              ["id", "string", "Event ID"],
              ["type", "WebhookEventType", "Normalized event type"],
              ["provider", "string", "Provider identifier"],
              ["rawData", "unknown", "Original provider payload"],
              ["entityId", "string?", "Payment/subscription ID"],
              ["amount", "number?", "Amount if applicable"],
              ["currency", "string?", "Currency if applicable"],
              ["status", "string?", "Provider status string"],
              ["metadata", "Record?", "Provider-specific metadata"],
              ["createdAt", "Date", "Event timestamp"],
            ].map(([field, type, desc]) => (
              <tr key={field} className="border-b border-border-primary/50 hover:bg-bg-tertiary/50 transition-colors">
                <td className="px-4 py-2 font-mono text-accent">{field}</td>
                <td className="px-4 py-2 font-mono text-text-secondary">{type}</td>
                <td className="px-4 py-2">{desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Heading level={3} className="text-xl font-semibold mt-6 mb-2 text-text-primary">
        WebhookEventType
      </Heading>
      <CodeBlock
        code={`type WebhookEventType =
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
  | "refund.failed";`}
      />

      <Callout type="info">
        Default signature headers: Stripe (<code>stripe-signature</code>), Midtrans (<code>x-signature</code>), Xendit (<code>x-callback-token</code>), PayPal (<code>paypal-transmission-sig</code>).
      </Callout>

      {/* ──────────────── ERROR HANDLING ──────────────── */}
      <Heading level={2} className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2">
        Error Handling
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Payment errors extend <code>HttpError</code> for consistent error handling:
      </p>
      <CodeBlock
        code={`import {
  PaymentError,              // base class (extends HttpError)
  PaymentProviderError,      // 502 — provider API error
  PaymentVerificationError,  // 400 — webhook signature mismatch
  PaymentIdempotencyError,   // 409 — idempotency key reuse
  PaymentConfigurationError, // 500 — invalid driver config
} from "@buntok/core/payment";`}
      />

      <div className="my-4 overflow-x-auto">
        <table className="w-full text-sm text-text-secondary border border-border-primary rounded-lg overflow-hidden">
          <thead className="bg-bg-tertiary border-b border-border-primary">
            <tr>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">Error</th>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">Status</th>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">Use Case</th>
            </tr>
          </thead>
          <tbody>
            {[
              ["PaymentError", "varies", "Base payment error"],
              ["PaymentProviderError", "502", "Provider API returned an error"],
              ["PaymentVerificationError", "400", "Webhook signature verification failed"],
              ["PaymentIdempotencyError", "409", "Idempotency key reuse detected"],
              ["PaymentConfigurationError", "500", "Invalid driver configuration"],
            ].map(([error, status, desc]) => (
              <tr key={error} className="border-b border-border-primary/50 hover:bg-bg-tertiary/50 transition-colors">
                <td className="px-4 py-2 font-mono text-accent">{error}</td>
                <td className="px-4 py-2 font-mono text-text-secondary">{status}</td>
                <td className="px-4 py-2">{desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
