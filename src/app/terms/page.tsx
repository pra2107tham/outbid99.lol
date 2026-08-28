import type { Metadata } from "next";
import Link from "next/link";

import { Prose } from "@/components/Prose";
import { MIN_BID_CENTS, formatMoney } from "@/lib/money";
import { SITE_DOMAIN, absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms",
  description:
    "Terms for outbid99: what a payment buys, what gets removed, and why there are no refunds once a listing is live.",
  alternates: { canonical: "/terms" },
  openGraph: { title: "Terms — outbid99", url: absoluteUrl("/terms") },
};

export default function TermsPage() {
  return (
    <Prose
      title="Terms"
      lede="Short, because there is not much to it. You are buying a position on a public board."
      updated="28 August 2026"
    >
      <h2>What you are buying</h2>
      <p>
        A payment buys your listing a position on {SITE_DOMAIN}, ranked by the rules set
        out on the <Link href="/rules">rules page</Link>. It buys a page for your listing,
        a followable link to your URL, and a place in the ordering. It does not buy
        endorsement, review, traffic guarantees, a fixed position, or any promise about
        how long you will hold it.
      </p>
      <p>
        Your position lasts until somebody else pays more. That may be in a year or in a
        minute. There is no floor and no protected period.
      </p>

      <h2>No refunds once live</h2>
      <p>
        Payments are final once your listing is live. That includes being outbid
        immediately, changing your mind, your product shutting down, or deciding the
        traffic was not worth it. The board is a public record and we are not unwinding
        it after the fact.
      </p>
      <p>
        If a payment is taken and the listing never goes live because of a fault on our
        side, we refund that payment in full.
      </p>

      <h2>What gets removed</h2>
      <p>We remove a listing, without a refund, if it:</p>
      <ul>
        <li>is illegal in the jurisdiction it is served from, or facilitates something that is;</li>
        <li>is sexually explicit, or is adult content of any kind;</li>
        <li>distributes malware, or exists to phish, scam or impersonate;</li>
        <li>stops resolving, or redirects to a domain other than the one that was paid for;</li>
        <li>misrepresents what it is in its title or description.</li>
      </ul>
      <p>
        Removal takes the listing off every board and off its own page. The money already
        paid stays paid. We are not obliged to warn you first, and this is the only
        editorial judgement exercised anywhere on this site.
      </p>

      <h2>Ownership of a listing</h2>
      <p>
        There are no accounts. A listing belongs to the email address on the payment that
        created it. Adding money to an existing listing tops up the same listing whoever
        pays, so if you want a position under your own control, do not pay into somebody
        else&rsquo;s.
      </p>

      <h2>Prices</h2>
      <p>
        Every amount is in US dollars and every payment is a whole number of 99-cent bids,
        minimum {formatMoney(MIN_BID_CENTS)}. Payment is handled by our payment provider
        as merchant of record; taxes are their calculation, not ours.
      </p>

      <h2>Changes</h2>
      <p>
        We may change these terms. Changes are not retroactive: whatever was true when you
        paid governs that payment. The ranking rule itself will not change, because it is
        the entire product.
      </p>

      <h2>Liability</h2>
      <p>
        The site is provided as is. We are not liable for lost traffic, lost revenue, lost
        rank, downtime, or anything a listing on this board does to anyone. Our total
        liability to you is capped at the amount you have paid us.
      </p>
    </Prose>
  );
}
