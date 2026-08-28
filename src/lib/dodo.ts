import DodoPayments from "dodopayments";
import { Webhook } from "standardwebhooks";

import { isValidBid } from "./money";

export interface CheckoutRequest {
  amountCents: number;
  listingId: string;
  slug: string;
  email?: string | null;
  returnUrl: string;
  cancelUrl: string;
}

export function dodoConfigured(): boolean {
  return Boolean(process.env.DODO_API_KEY && process.env.DODO_PRODUCT_ID);
}

export function dodoWebhookConfigured(): boolean {
  return Boolean(process.env.DODO_WEBHOOK_SECRET);
}

function client(): DodoPayments {
  return new DodoPayments({
    bearerToken: process.env.DODO_API_KEY!,
    // "live_mode" in production, "test_mode" while wiring it up.
    environment:
      process.env.DODO_ENVIRONMENT === "live_mode" ? "live_mode" : "test_mode",
  });
}

/**
 * One pay-what-you-want product in Dodo represents "a placement on the board";
 * the bid amount rides on the checkout session rather than on the product, so
 * every rank is the same product at a different price.
 */
export async function createCheckoutSession(input: CheckoutRequest): Promise<string> {
  if (!isValidBid(input.amountCents)) {
    throw new Error("Amount is not a whole number of 99-cent bids.");
  }

  const session = await client().checkoutSessions.create({
    product_cart: [
      {
        product_id: process.env.DODO_PRODUCT_ID!,
        quantity: 1,
        amount: input.amountCents,
      },
    ],
    return_url: input.returnUrl,
    cancel_url: input.cancelUrl,
    ...(input.email ? { customer: { email: input.email, name: input.email } } : {}),
    // Set by us, echoed back over a signed webhook, never editable by the
    // customer. This is what the webhook credits, so it must be exact.
    metadata: {
      listing_id: input.listingId,
      slug: input.slug,
      amount_cents: String(input.amountCents),
    },
  });

  if (!session.checkout_url) {
    throw new Error("Dodo did not return a checkout URL.");
  }
  return session.checkout_url;
}

export interface DodoEvent {
  type: string;
  paymentId: string;
  amountCents: number | null;
  email: string | null;
  metadata: Record<string, string>;
}

/**
 * Verify a Dodo webhook (Standard Webhooks signing) and normalise it. Throws if
 * the signature, timestamp or shape is wrong, so the caller can answer 400 and
 * never act on an unverified payload.
 */
export function verifyDodoWebhook(rawBody: string, headers: Headers): DodoEvent {
  const secret = process.env.DODO_WEBHOOK_SECRET;
  if (!secret) throw new Error("DODO_WEBHOOK_SECRET is not set.");

  const webhookId = headers.get("webhook-id");
  const webhookTimestamp = headers.get("webhook-timestamp");
  const webhookSignature = headers.get("webhook-signature");
  if (!webhookId || !webhookTimestamp || !webhookSignature) {
    throw new Error("Missing Standard Webhooks headers.");
  }

  // Throws on a bad signature or a timestamp outside the tolerance window,
  // which is what stops a replayed payload from crediting a listing twice.
  const payload = new Webhook(secret).verify(rawBody, {
    "webhook-id": webhookId,
    "webhook-timestamp": webhookTimestamp,
    "webhook-signature": webhookSignature,
  }) as Record<string, unknown>;

  const type = String(payload.type ?? "");
  const data = (payload.data ?? {}) as Record<string, unknown>;
  const paymentId = String(data.payment_id ?? data.id ?? "");
  if (!paymentId) throw new Error("Webhook carried no payment id.");

  const rawMetadata = (data.metadata ?? {}) as Record<string, unknown>;
  const metadata: Record<string, string> = {};
  for (const [key, value] of Object.entries(rawMetadata)) {
    if (typeof value === "string") metadata[key] = value;
  }

  const customer = (data.customer ?? {}) as Record<string, unknown>;
  const email = typeof customer.email === "string" ? customer.email : null;

  const total = Number(data.total_amount ?? data.amount);

  return {
    type,
    paymentId,
    amountCents: Number.isFinite(total) ? total : null,
    email,
    metadata,
  };
}
