import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { SimulateCheckout } from "@/components/SimulateCheckout";
import { dodoConfigured } from "@/lib/dodo";
import { MIN_BID_CENTS, formatMoney, isValidBid } from "@/lib/money";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { robots: { index: false, follow: false } };

/**
 * Stands in for the hosted checkout while no payment credentials are set, so
 * the claim flow can be walked from end to end locally. Never reachable in
 * production or once Dodo is configured.
 */
export default async function SimulatePage({
  searchParams,
}: {
  searchParams: Promise<{ slug?: string; amount?: string }>;
}) {
  if (process.env.NODE_ENV === "production" || dodoConfigured()) notFound();

  const query = await searchParams;
  const slug = query.slug ?? "";
  const amountCents = Number(query.amount);
  if (!slug || !isValidBid(amountCents)) notFound();

  return (
    <div className="mx-auto max-w-[560px] px-5 py-16 sm:px-8">
      <p className="font-mono text-[10px] uppercase tracking-[0.13em] text-signal">
        Simulated checkout — no payment credentials configured
      </p>
      <h1 className="display mt-4 text-[38px] leading-none">Confirm {formatMoney(amountCents)}</h1>
      <p className="mt-4 text-[14px] leading-relaxed text-ink-60">
        This page stands in for the hosted checkout so the flow can be walked without
        credentials. Confirming credits the listing exactly as a settled payment would,
        which is the same path the verified webhook takes. Set the Dodo environment
        variables and this page stops existing.
      </p>
      <div className="mt-8">
        <SimulateCheckout slug={slug} amountCents={amountCents} />
      </div>
      <p className="mt-6 font-mono text-[10px] uppercase tracking-[0.13em] text-ink-40">
        Minimum bid {formatMoney(MIN_BID_CENTS)}
      </p>
    </div>
  );
}
