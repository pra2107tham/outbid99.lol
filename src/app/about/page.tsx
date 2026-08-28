import type { Metadata } from "next";
import Link from "next/link";

import { LiveProvider, RevenueCounter } from "@/components/Live";
import { Stat } from "@/components/Bits";
import { store } from "@/lib/db";
import { formatCount } from "@/lib/format";
import { BID_UNIT_CENTS, MIN_BID_CENTS, formatMoney } from "@/lib/money";
import { SITE_DOMAIN, absoluteUrl } from "@/lib/site";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "About — what this is and what it has made",
  description:
    "outbid99 is a leaderboard with one rule: rank is lifetime dollars paid. This page shows what it has made, live.",
  alternates: { canonical: "/about" },
  openGraph: { title: "About outbid99", url: absoluteUrl("/about") },
};

export default async function AboutPage() {
  const db = store();
  const [stats, activity, categories] = await Promise.all([
    db.getSiteStats(),
    db.getRecentActivity(8),
    db.getCategoryStats(),
  ]);
  const snapshot = { stats, activity };
  const occupied = categories.filter((c) => c.count > 0).length;

  return (
    <LiveProvider initial={snapshot}>
      <div className="mx-auto max-w-[1180px] px-5 sm:px-8">
        <RevenueCounter initial={snapshot} />

        <div className="grid gap-x-12 gap-y-10 py-10 lg:grid-cols-[1fr_300px]">
          <div className="min-w-0 max-w-[68ch]">
            <h2 className="display border-b border-ink pb-2 text-[19px] leading-none">
              What this is
            </h2>
            <p className="mt-4 text-[15px] leading-relaxed">
              {SITE_DOMAIN} is a public leaderboard with exactly one rule: your position is
              the total amount of money you have paid, highest first. There is no
              algorithm, no editorial process, and no quality bar. If you are at the top it
              is because you paid the most.
            </p>
            <p className="mt-4 text-[15px] leading-relaxed">
              Positions are sold in 99-cent bids. The minimum is {formatMoney(MIN_BID_CENTS)}.
              Taking any position costs one bid — {formatMoney(BID_UNIT_CENTS)} — more than
              whoever is holding it, and that exact number is printed on every row so you
              never have to guess.
            </p>

            <h2 className="display mt-10 border-b border-ink pb-2 text-[19px] leading-none">
              Why it is honest
            </h2>
            <p className="mt-4 text-[15px] leading-relaxed">
              Most directories rank by money and describe it as curation. This one ranks by
              money and says so in the header, the footer, and on every listing page. The
              only thing a listing buys is a position, a page, and a link. It does not buy
              a recommendation, because nothing here is recommended.
            </p>
            <p className="mt-4 text-[15px] leading-relaxed">
              The revenue number above is read from the database on every request. It is not
              rounded, not projected, and not marketing. When somebody pays, it goes up, and
              you can watch it happen.
            </p>

            <h2 className="display mt-10 border-b border-ink pb-2 text-[19px] leading-none">
              The board at launch
            </h2>
            <p className="mt-4 text-[15px] leading-relaxed">
              A handful of listings were placed here by us so the board was not empty on day
              one. They are real products, none of them paid anything, and every one of them
              is badged SEED. We are not going to imply a company bought a position it never
              bought. One real bid outranks all of them.
            </p>

            <h2 className="display mt-10 border-b border-ink pb-2 text-[19px] leading-none">
              Who runs it
            </h2>
            {/* Replace with your own name and contact before launch. */}
            <p className="mt-4 text-[15px] leading-relaxed">
              An independent builder, working alone. Payments are processed by a merchant of
              record, so the money is handled by a licensed payment company rather than by
              hand. If something on the board is wrong, or a listing needs to come down,
              write in and it gets dealt with.
            </p>
            <p className="mt-4 text-[15px] leading-relaxed">
              The mechanics are written out in full on the{" "}
              <Link href="/rules" className="text-ultra underline underline-offset-4">
                rules page
              </Link>
              . The commercial terms are on the{" "}
              <Link href="/terms" className="text-ultra underline underline-offset-4">
                terms page
              </Link>
              . Neither is long.
            </p>
          </div>

          <aside className="min-w-0 lg:sticky lg:top-6 lg:self-start">
            <div className="border-t-2 border-ink pt-4">
              <h2 className="font-mono text-[10px] uppercase tracking-[0.13em] text-ink-40">
                Live numbers
              </h2>
              <dl className="mt-5 space-y-5">
                <Stat label="Total paid" value={formatMoney(stats.total_cents)} />
                <Stat label="Payments" value={formatCount(stats.payment_count)} />
                <Stat label="Listings live" value={formatCount(stats.listing_count)} />
                <Stat label="Categories in use" value={`${occupied} of ${categories.length}`} />
                <Stat label="Bid unit" value={formatMoney(BID_UNIT_CENTS)} />
              </dl>
              <Link
                href="/claim"
                className="mt-7 block rounded-[2px] bg-ultra px-4 py-2.5 text-center font-mono text-[11px] uppercase tracking-[0.13em] text-paper transition-colors hover:bg-ink"
              >
                Claim a rank
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </LiveProvider>
  );
}
