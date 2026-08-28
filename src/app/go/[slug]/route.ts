import { NextResponse, type NextRequest } from "next/server";

import { store } from "@/lib/db";
import { safeHttpUrl } from "@/lib/sanitize";

export const dynamic = "force-dynamic";

/**
 * Click logger. Records the click, then bounces to the listing's URL with a
 * source tag so the buyer can see the traffic in their own analytics.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const db = store();
  const product = await db.getProductBySlug(slug);

  if (!product || product.status !== "live") {
    return NextResponse.redirect(new URL("/", request.url), 302);
  }

  const destination = safeHttpUrl(product.url);
  if (!destination) {
    return NextResponse.redirect(new URL("/", request.url), 302);
  }

  const target = new URL(destination);
  target.searchParams.set("utm_source", "outbid99");

  // Logging must never delay or block the redirect.
  try {
    await db.logClick(
      product.id,
      request.headers.get("referer"),
      request.headers.get("x-vercel-ip-country"),
    );
  } catch {
    // A dropped click is not worth failing the visit over.
  }

  return NextResponse.redirect(target.toString(), {
    status: 302,
    headers: { "cache-control": "no-store" },
  });
}
