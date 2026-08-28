import type { Metadata } from "next";
import Link from "next/link";

import { Prose } from "@/components/Prose";
import { BID_UNIT_CENTS, MIN_BID_CENTS, formatMoney } from "@/lib/money";
import { absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Rules — how ranking works",
  description:
    "How outbid99 ranks listings: lifetime dollars paid, highest first, ties broken by the earliest payment. Bids are whole 99-cent steps.",
  alternates: { canonical: "/rules" },
  openGraph: { title: "Rules — how outbid99 ranks", url: absoluteUrl("/rules") },
};

export default function RulesPage() {
  return (
    <Prose
      title="Rules"
      lede="There is one rule, and it is money. Everything below is a consequence of it."
    >
      <h2>How rank is decided</h2>
      <p>
        Listings are sorted by lifetime dollars paid, highest first. Nothing else counts.
        Not votes, not clicks, not quality, not how long you have been here.
      </p>
      <p>
        If two listings have paid exactly the same amount, the one that paid first sits
        higher. Getting there earlier is the only tiebreaker.
      </p>
      <p>
        Rank is never stored. It is recalculated from the payment totals every time a
        board is drawn, so it is always the true current order.
      </p>

      <h2>The 99-cent bid</h2>
      <p>
        Every payment on this site is a whole number of 99-cent bids. The minimum is one
        bid, {formatMoney(MIN_BID_CENTS)}. Six bids is {formatMoney(BID_UNIT_CENTS * 6)}.
        There is no other denomination.
      </p>
      <p>
        This keeps the arithmetic closed: because every total is a multiple of 99 cents,
        the price to beat any listing is also a multiple of 99 cents. If you type an
        amount that is not a whole number of bids, it rounds up to the next one, and the
        exact figure is shown before you pay.
      </p>

      <h2>What it costs to take a position</h2>
      <p>
        To take rank N you pay one bid more than the listing currently holding it. If #11
        has paid {formatMoney(BID_UNIT_CENTS * 10)}, taking #11 costs{" "}
        {formatMoney(BID_UNIT_CENTS * 11)}. Every row on every board shows that exact
        number on its button. You never have to work it out.
      </p>

      <h2>Payments stack</h2>
      <p>
        Payments are cumulative for the lifetime of a listing. Pay {formatMoney(BID_UNIT_CENTS * 50)},
        come back later and add {formatMoney(BID_UNIT_CENTS * 30)}, and you are at{" "}
        {formatMoney(BID_UNIT_CENTS * 80)}. You never start over, and you never lose what
        you have already paid.
      </p>
      <p>
        You cannot lose a position by doing nothing wrong. You lose it because somebody
        else paid more. That is the whole game.
      </p>

      <h2>Two people, one rank, same minute</h2>
      <p>
        Both payments go through. Nothing is rejected for being late or for being lower
        than somebody else&rsquo;s. The totals settle the order once both have landed, and
        whoever ends up with more sits higher.
      </p>

      <h2>Categories</h2>
      <p>
        Each of the <Link href="/categories">24 categories</Link> ranks independently, on
        the same rule. Being #1 in a quiet category is much cheaper than being #1 overall,
        and a listing that leads its category is badged as such on the main board.
      </p>

      <h2>Today</h2>
      <p>
        The <Link href="/today">Today board</Link> ranks by dollars paid in the trailing 24
        hours. The window rolls continuously from the current moment. It does not reset at
        midnight, so a payment counts for exactly one day from when it landed and then
        drops off.
      </p>

      <h2>Seed listings</h2>
      <p>
        A handful of listings were placed on the board by outbid99 at launch so it was not
        empty on day one. Nobody paid for them, and every one of them carries a SEED badge
        saying so. They hold nominal amounts and can be taken for{" "}
        {formatMoney(MIN_BID_CENTS)} more than they show. We are not going to pretend a
        company bought a position it did not buy.
      </p>

      <h2>What gets removed</h2>
      <p>
        Listings that are illegal, sexually explicit, or distribute malware are removed
        without a refund. So are URLs that stop resolving or start redirecting somewhere
        other than the domain that was paid for. See the{" "}
        <Link href="/terms">terms</Link> for the rest.
      </p>

      <h2>Nothing here is a recommendation</h2>
      <p>
        Every placement on this site is an advertisement. A high rank means somebody paid,
        and means nothing else. No listing is vetted, endorsed, tested, or reviewed by us.
      </p>
    </Prose>
  );
}
