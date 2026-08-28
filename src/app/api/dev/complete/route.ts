import { revalidatePath } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";

import { store } from "@/lib/db";
import { dodoConfigured } from "@/lib/dodo";
import { isValidBid } from "@/lib/money";

export const dynamic = "force-dynamic";

/**
 * Local stand-in for a settled Dodo payment, so the claim flow can be walked
 * end to end with no credentials. It refuses to exist in production, and
 * refuses to exist at all once real payment credentials are configured.
 */
export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === "production" || dodoConfigured()) {
    return NextResponse.json({ ok: false, error: "Not found." }, { status: 404 });
  }

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const slug = String(body.slug ?? "");
  const amountCents = Number(body.amountCents);

  if (!slug || !isValidBid(amountCents)) {
    return NextResponse.json({ ok: false, error: "Bad request." }, { status: 400 });
  }

  const db = store();
  const product = await db.getProductBySlug(slug);
  if (!product) {
    return NextResponse.json({ ok: false, error: "No such listing." }, { status: 404 });
  }

  await db.creditPayment({
    productId: product.id,
    amountCents,
    providerPaymentId: `sim_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    email: product.email,
  });

  revalidatePath("/");
  revalidatePath("/today");
  revalidatePath("/categories");
  revalidatePath(`/category/${product.category_slug}`);
  revalidatePath(`/product/${product.slug}`);

  return NextResponse.json({ ok: true, slug: product.slug });
}
