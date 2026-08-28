import Link from "next/link";

import { ANALYTICS_PUBLIC_URL, PAID_DISCLOSURE, SITE_DOMAIN } from "@/lib/site";

const COLUMNS: { title: string; links: { href: string; label: string }[] }[] = [
  {
    title: "Board",
    links: [
      { href: "/", label: "All-time leaderboard" },
      { href: "/today", label: "Today" },
      { href: "/categories", label: "All 24 categories" },
      { href: "/claim", label: "Claim a rank" },
    ],
  },
  {
    title: "How it works",
    links: [
      { href: "/rules", label: "Ranking rules" },
      { href: "/about", label: "About and revenue" },
      { href: "/terms", label: "Terms" },
      { href: "/privacy", label: "Privacy" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="mt-20 border-t border-rule bg-paper-2">
      <div className="mx-auto max-w-[1180px] px-5 py-10 sm:px-8">
        <div className="flex flex-wrap gap-x-16 gap-y-8">
          <div className="min-w-[220px] flex-1">
            <p className="display text-[22px] leading-none">
              outbid<span className="text-ultra">99</span>
            </p>
            <p className="mt-3 max-w-[38ch] text-[13px] leading-relaxed text-ink-60">
              A public leaderboard ranked by money. Positions are sold in 99-cent bids and
              held until somebody pays more.
            </p>
          </div>
          {COLUMNS.map((column) => (
            <div key={column.title}>
              <h2 className="font-mono text-[10px] uppercase tracking-[0.13em] text-ink-40">
                {column.title}
              </h2>
              <ul className="mt-3 space-y-2">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-[13px] hover:text-ultra">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div>
            <h2 className="font-mono text-[10px] uppercase tracking-[0.13em] text-ink-40">
              Numbers
            </h2>
            <ul className="mt-3 space-y-2">
              <li>
                {ANALYTICS_PUBLIC_URL ? (
                  <a
                    href={ANALYTICS_PUBLIC_URL}
                    className="text-[13px] hover:text-ultra"
                    rel="noopener"
                  >
                    Public analytics
                  </a>
                ) : (
                  <span className="text-[13px] text-ink-40">Public analytics</span>
                )}
              </li>
              <li>
                <Link href="/about" className="text-[13px] hover:text-ultra">
                  Live revenue
                </Link>
              </li>
              <li>
                <Link href="/sitemap.xml" className="text-[13px] hover:text-ultra">
                  Sitemap
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <p className="mt-10 border-t border-rule pt-5 font-mono text-[10px] uppercase leading-relaxed tracking-[0.13em] text-ink-60">
          {PAID_DISCLOSURE}
        </p>
        <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.13em] text-ink-40">
          {SITE_DOMAIN} — no refunds once a listing is live.
        </p>
      </div>
    </footer>
  );
}
