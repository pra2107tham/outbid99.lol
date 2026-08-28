import { revalidatePath } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";

import { store } from "@/lib/db";
import { verifyDodoWebhook } from "@/lib/dodo";
import { isValidBid } from "@/lib/money";

export const dynamic = "force-dynamic";

const SUCCESS_EVENTS = new Set(["payment.succeeded", "payment.completed"]);

export async function POST(request: NextRequest) {
  // Signature is computed over the exact bytes, so the body must be read raw
  // and never re-serialised before verification.
  const rawBody = await request.text();

  let event;
  try {
    event = verifyDodoWebhook(rawBody, request.headers);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid signature.";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }

  // Acknowledge anything we do not act on, so Dodo stops retrying it.
  if (!SUCCESS_EVENTS.has(event.type)) {
    return NextResponse.json({ ok: true, ignored: event.type });
  }

  const listingId = event.metadata.listing_id;
  const declared = Number(event.metadata.amount_cents);

  if (!listingId || !isValidBid(declared)) {
    return NextResponse.json({ ok: true, ignored: "missing or invalid metadata" });
  }

  // The credited figure is our own metadata, not the payment total, because the
  // total can include tax collected by the merchant of record. Cross-check it
  // against what was actually charged so the two can never diverge upward.
  if (event.amountCents !== null && declared > event.amountCents) {
    return NextResponse.json({ ok: true, ignored: "declared amount exceeds charge" });
  }

  const db = store();
  const product = await db.getProductBySlug(event.metadata.slug ?? "");
  const targetId = product?.id ?? listingId;

  // creditPayment is idempotent on provider_payment_id: a retried webhook does
  // not move the board a second time.
  const updated = await db.creditPayment({
    productId: targetId,
    amountCents: declared,
    providerPaymentId: event.paymentId,
    email: event.email,
  });

  if (updated) {
    revalidatePath("/");
    revalidatePath("/today");
    revalidatePath("/categories");
    revalidatePath(`/category/${updated.category_slug}`);
    revalidatePath(`/product/${updated.slug}`);
  }

  return NextResponse.json({ ok: true });
}
