import Link from "next/link";

import { PAID_DISCLOSURE } from "@/lib/site";

const NAV = [
  { href: "/", label: "Leaderboard" },
  { href: "/today", label: "Today" },
  { href: "/categories", label: "Categories" },
  { href: "/about", label: "About" },
];

export function Header() {
  return (
    <header className="border-b border-rule bg-paper">
      <div className="mx-auto flex max-w-[1180px] flex-wrap items-baseline gap-x-8 gap-y-3 px-5 py-4 sm:px-8">
        <Link href="/" className="display text-[26px] leading-none tracking-tight sm:text-[30px]">
          outbid<span className="text-ultra">99</span>
        </Link>
        <nav aria-label="Primary" className="flex flex-wrap items-baseline gap-x-6 gap-y-2">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="font-mono text-[11px] uppercase tracking-[0.13em] text-ink-60 transition-colors hover:text-ink"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <Link
          href="/claim"
          className="ml-auto rounded-[2px] bg-ink px-4 py-2 font-mono text-[11px] uppercase tracking-[0.13em] text-paper transition-colors hover:bg-ultra"
        >
          Claim a rank
        </Link>
      </div>
      {/* The disclosure is permanent and sits above the fold on every page. */}
      <p className="border-t border-rule bg-paper-2 px-5 py-2 text-center font-mono text-[10px] uppercase tracking-[0.13em] text-ink-60 sm:px-8">
        {PAID_DISCLOSURE}
      </p>
    </header>
  );
}
