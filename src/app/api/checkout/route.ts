import { NextResponse, type NextRequest } from "next/server";

import { resolveListing } from "@/lib/claim";
import { createCheckoutSession, dodoConfigured } from "@/lib/dodo";
import { isValidBid } from "@/lib/money";
import { clientIp, rateLimit } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";
export const maxDuration = 20;

/**
 * Prefer the configured public origin, but fall back to the origin the request
 * actually arrived on. Without the fallback, a local or preview deployment
 * sends buyers back to the production domain after checkout.
 */
function resolveOrigin(request: NextRequest): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (configured) return configured.replace(/\/$/, "");
  return request.nextUrl.origin;
}

export async function POST(request: NextRequest) {
  const limit = rateLimit(`checkout:${clientIp(request.headers)}`, 10, 60_000);
  if (!limit.ok) {
    return NextResponse.json(
      { ok: false, error: "Too many attempts. Wait a moment." },
      { status: 429, headers: { "retry-after": String(limit.retryAfterSeconds) } },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Bad request." }, { status: 400 });
  }

  // The amount is priced again here. Whatever the browser sent is a suggestion.
  const amountCents = Number(body.amountCents);
  if (!isValidBid(amountCents)) {
    return NextResponse.json(
      { ok: false, error: "Amount must be a whole number of 99-cent bids." },
      { status: 400 },
    );
  }

  try {
    const { product } = await resolveListing({
      url: String(body.url ?? ""),
      category: String(body.category ?? "other"),
      amountCents,
      email: body.email ? String(body.email) : null,
      title: body.title ? String(body.title) : null,
      description: body.description ? String(body.description) : null,
      faviconUrl: body.faviconUrl ? String(body.faviconUrl) : null,
      screenshotUrl: body.screenshotUrl ? String(body.screenshotUrl) : null,
    });

    const origin = resolveOrigin(request);
    const returnUrl = `${origin}/product/${product.slug}?claimed=1`;
    const cancelUrl = `${origin}/claim`;

    if (!dodoConfigured()) {
      // No payment credentials configured: hand back the local simulation so the
      // whole flow stays walkable. This path refuses to run in production.
      if (process.env.NODE_ENV === "production") {
        return NextResponse.json(
          { ok: false, error: "Payments are not configured." },
          { status: 503 },
        );
      }
      // Relative on purpose: the simulation is always same-origin.
      const simulate = new URLSearchParams({
        listing: product.id,
        slug: product.slug,
        amount: String(amountCents),
      });
      return NextResponse.json({
        ok: true,
        checkoutUrl: `/claim/simulate?${simulate.toString()}`,
        simulated: true,
      });
    }

    const checkoutUrl = await createCheckoutSession({
      amountCents,
      listingId: product.id,
      slug: product.slug,
      email: body.email ? String(body.email) : null,
      returnUrl,
      cancelUrl,
    });

    return NextResponse.json({ ok: true, checkoutUrl });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not start checkout.";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
