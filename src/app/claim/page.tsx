import type { Metadata } from "next";

import { ClaimFlow } from "@/components/ClaimFlow";
import { isCategorySlug } from "@/lib/categories";
import { store } from "@/lib/db";
import { MIN_BID_CENTS, formatMoney, snapUpToBid } from "@/lib/money";
import { safeHttpUrl } from "@/lib/sanitize";
import { absoluteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Claim a rank",
  description:
    "Buy a position on the outbid99 board. Bids are whole 99-cent steps, and the exact rank your amount buys is shown before you pay.",
  alternates: { canonical: "/claim" },
  openGraph: { title: "Claim a rank on outbid99", url: absoluteUrl("/claim") },
};

export default async function ClaimPage({
  searchParams,
}: {
  searchParams: Promise<{ url?: string; category?: string; amount?: string; rank?: string }>;
}) {
  const query = await searchParams;
  const totals = (await store().getBoardSummaries()).map((s) => s.total_cents);

  const requested = Number(query.amount);
  const initialAmountCents = Number.isFinite(requested) && requested > 0
    ? snapUpToBid(requested)
    : MIN_BID_CENTS;

  return (
    <div className="mx-auto max-w-[1180px] px-5 sm:px-8">
      <section className="border-b border-ink py-8 sm:py-10">
        <h1 className="display text-[clamp(34px,7vw,62px)] leading-none">Claim a rank</h1>
        <p className="mt-4 max-w-[62ch] text-[15px] leading-relaxed text-ink-60">
          Pick a URL, pick an amount, and the board tells you exactly which position that
          buys before you pay anything. The minimum is {formatMoney(MIN_BID_CENTS)}, and
          every amount is a whole number of 99-cent bids.
        </p>
      </section>

      <div className="py-10">
        <ClaimFlow
          totals={totals}
          initialUrl={safeHttpUrl(query.url) ?? ""}
          initialCategory={query.category && isCategorySlug(query.category) ? query.category : ""}
          initialAmountCents={initialAmountCents}
        />
      </div>
    </div>
  );
}
