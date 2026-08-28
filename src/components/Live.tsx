"use client";

import Link from "next/link";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

import { SplitFlap } from "./SplitFlap";
import { timeAgo } from "@/lib/format";
import { formatMoney, formatMoneyBare } from "@/lib/money";
import type { ActivityItem, SiteStats } from "@/lib/types";

export interface LiveSnapshot {
  stats: SiteStats;
  activity: ActivityItem[];
}

const LiveContext = createContext<LiveSnapshot | null>(null);

/**
 * One poll for the whole page. The revenue counter and the activity list both
 * read from it, so a 30-second refresh costs a single request rather than one
 * per live element.
 */
export function LiveProvider({
  initial,
  children,
  intervalMs = 30_000,
}: {
  initial: LiveSnapshot;
  children: React.ReactNode;
  intervalMs?: number;
}) {
  const [snapshot, setSnapshot] = useState(initial);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    async function poll() {
      try {
        const res = await fetch("/api/activity", {
          cache: "no-store",
          signal: controller.signal,
        });
        if (!res.ok) return;
        const data = (await res.json()) as LiveSnapshot;
        if (!cancelled && data?.stats) setSnapshot(data);
      } catch {
        // A failed poll just leaves the last good numbers on screen.
      }
    }

    const id = window.setInterval(poll, intervalMs);
    const onVisible = () => document.visibilityState === "visible" && poll();
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      controller.abort();
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [intervalMs]);

  return <LiveContext.Provider value={snapshot}>{children}</LiveContext.Provider>;
}

function useLive(fallback: LiveSnapshot): LiveSnapshot {
  return useContext(LiveContext) ?? fallback;
}

function hoursLive(iso: string | null): number {
  if (!iso) return 0;
  return Math.max(1, Math.floor((Date.now() - Date.parse(iso)) / 3_600_000));
}

/**
 * The most shareable number on the site, so it gets the biggest type and the
 * split-flap treatment: when a payment lands, the digits physically turn over.
 */
export function RevenueCounter({ initial }: { initial: LiveSnapshot }) {
  const { stats } = useLive(initial);
  const [hours, setHours] = useState(() => hoursLive(stats.first_payment_at));

  useEffect(() => {
    setHours(hoursLive(stats.first_payment_at));
  }, [stats.first_payment_at]);

  return (
    <section aria-labelledby="revenue-heading" className="border-b border-ink py-8 sm:py-10">
      <h1 id="revenue-heading" className="sr-only">
        outbid99 revenue to date
      </h1>
      <p className="font-mono text-[11px] uppercase tracking-[0.13em] text-ink-60">
        outbid99 has made
      </p>
      <div className="ticker mt-3 flex flex-wrap items-end gap-x-5 gap-y-3">
        <SplitFlap
          value={`$${formatMoneyBare(stats.total_cents)}`}
          stagger={38}
          variant="light"
          className="display text-[clamp(46px,11vw,118px)] text-ultra"
          label={`${formatMoney(stats.total_cents)} in total`}
        />
      </div>
      <p className="mt-4 max-w-[60ch] text-[14px] leading-relaxed text-ink-60">
        since it went live {hours} hour{hours === 1 ? "" : "s"} ago, across{" "}
        <span className="tnum text-ink">{stats.payment_count}</span> payment
        {stats.payment_count === 1 ? "" : "s"} on{" "}
        <span className="tnum text-ink">{stats.listing_count}</span> listing
        {stats.listing_count === 1 ? "" : "s"}. Every cent of it bought a position on this
        board.
      </p>
    </section>
  );
}

export function ActivityFeed({ initial }: { initial: LiveSnapshot }) {
  const { activity } = useLive(initial);
  // Rendered client-side from a timestamp, so keep it stable across hydration.
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  const items = useMemo(() => activity.slice(0, 8), [activity]);

  if (!items.length) {
    return (
      <p className="py-6 text-[13px] text-ink-60">
        Nobody has paid for a position yet. The first payment opens the board.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-rule">
      {items.map((item) => (
        <li key={item.id} className="flex items-baseline justify-between gap-4 py-2.5">
          <p className="min-w-0 text-[13px] leading-snug">
            <Link href={`/product/${item.slug}`} className="font-medium hover:text-ultra">
              {item.title}
            </Link>{" "}
            <span className="text-ink-60">
              claimed #{item.rank} · <span className="tnum">{formatMoney(item.amount_cents)}</span>
            </span>
          </p>
          <span className="shrink-0 font-mono text-[10px] uppercase tracking-[0.1em] text-ink-40">
            {now === null ? "" : timeAgo(item.created_at, now)}
          </span>
        </li>
      ))}
    </ul>
  );
}
