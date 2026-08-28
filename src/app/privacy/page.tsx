import type { Metadata } from "next";
import Link from "next/link";

import { Prose } from "@/components/Prose";
import { absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy",
  description:
    "What outbid99 collects: an email address on payment, and anonymous click counts. There are no accounts and no cross-site tracking.",
  alternates: { canonical: "/privacy" },
  openGraph: { title: "Privacy — outbid99", url: absoluteUrl("/privacy") },
};

export default function PrivacyPage() {
  return (
    <Prose
      title="Privacy"
      lede="There are no accounts here, so there is not much to collect."
      updated="28 August 2026"
    >
      <h2>What we store</h2>
      <ul>
        <li>
          <strong>Your email address</strong>, taken from the payment. It identifies who
          owns a listing and is where we write if a listing has to be removed. It is never
          shown on the site and never sold.
        </li>
        <li>
          <strong>What you submitted</strong>: the URL, the category, and the title,
          description and icon scraped from that URL.
        </li>
        <li>
          <strong>Payment records</strong>: amount, time, and the payment provider&rsquo;s
          reference. We never see or store card details.
        </li>
        <li>
          <strong>Clicks</strong>: when somebody clicks through to a listing we record the
          time, the referring page, and a country derived from the request. No IP address
          is stored and no identifier is attached to a person.
        </li>
      </ul>

      <h2>What is public</h2>
      <p>
        The listing itself, its rank, its total paid, its individual payment amounts and
        dates, and its click count are all public. That is the point of the board. Your
        email address is not part of it.
      </p>

      <h2>Analytics</h2>
      <p>
        We use privacy-preserving, cookie-free analytics that does not track visitors
        across sites and does not build a profile of anyone. The dashboard is public — the
        link is in the footer, and the numbers you see are the numbers we see.
      </p>

      <h2>Payments</h2>
      <p>
        Checkout is handled by our payment provider acting as merchant of record. Card
        details go to them, never to us. Their privacy policy covers what they collect
        during checkout.
      </p>

      <h2>Cookies</h2>
      <p>
        The site sets no tracking cookies and shows no cookie banner, because there is
        nothing to consent to.
      </p>

      <h2>Removing your data</h2>
      <p>
        Write to us and we will take a listing down and delete the email address attached
        to it. Payments already made are not refunded — see the{" "}
        <Link href="/terms">terms</Link> — and the aggregate revenue figure on the{" "}
        <Link href="/about">about page</Link> still includes them, because it is a total,
        not a list.
      </p>
    </Prose>
  );
}
