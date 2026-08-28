import { revalidatePath } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { timingSafeEqual } from "node:crypto";

import { store } from "@/lib/db";
import { clientIp, rateLimit } from "@/lib/ratelimit";
import type { ProductStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

const ALLOWED: ProductStatus[] = ["live", "removed", "pending"];

/** Constant-time compare so the secret cannot be recovered by timing. */
function secretMatches(provided: string, expected: string): boolean {
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function POST(request: NextRequest) {
  const expected = process.env.ADMIN_SECRET;
  if (!expected) {
    return NextResponse.json({ ok: false, error: "Not found." }, { status: 404 });
  }

  // Rate limited so the secret cannot be brute forced.
  const limit = rateLimit(`admin:${clientIp(request.headers)}`, 10, 60_000);
  if (!limit.ok) {
    return NextResponse.json({ ok: false, error: "Too many attempts." }, { status: 429 });
  }

  const provided = request.headers.get("x-admin-secret") ?? "";
  if (!secretMatches(provided, expected)) {
    return NextResponse.json({ ok: false, error: "Not found." }, { status: 404 });
  }

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const slug = String(body.slug ?? "").trim();
  const status = String(body.status ?? "removed") as ProductStatus;

  if (!slug) {
    return NextResponse.json({ ok: false, error: "Send a slug." }, { status: 400 });
  }
  if (!ALLOWED.includes(status)) {
    return NextResponse.json({ ok: false, error: "Unknown status." }, { status: 400 });
  }

  const product = await store().setProductStatus(slug, status);
  if (!product) {
    return NextResponse.json({ ok: false, error: "No such listing." }, { status: 404 });
  }

  // Removal has to leave every board immediately, not on the next revalidation.
  revalidatePath("/");
  revalidatePath("/today");
  revalidatePath("/categories");
  revalidatePath(`/category/${product.category_slug}`);
  revalidatePath(`/product/${product.slug}`);

  return NextResponse.json({
    ok: true,
    slug: product.slug,
    status: product.status,
    note: "Money already paid is not refunded.",
  });
}
