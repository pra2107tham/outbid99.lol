import type { Metadata } from "next";

import { BoardRow } from "@/components/BoardRow";
import { SectionHeading } from "@/components/Bits";
import { store } from "@/lib/db";
import { formatMoney } from "@/lib/money";
import { absoluteUrl } from "@/lib/site";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Today — ranked by the last 24 hours",
  description:
    "The outbid99 board ranked by dollars paid in the trailing 24 hours. A rolling window, not a midnight reset.",
  alternates: { canonical: "/today" },
  openGraph: { title: "Today on outbid99", url: absoluteUrl("/today") },
};

export default async function TodayPage() {
  const db = store();
  const [rows, categoryStats] = await Promise.all([
    db.getTodayBoard(50),
    db.getCategoryStats(),
  ]);

  const leaders = new Set(
    categoryStats.map((c) => c.leader?.slug).filter((s): s is string => Boolean(s)),
  );
  const total = rows.reduce((sum, r) => sum + r.today_cents, 0);

  return (
    <div className="mx-auto max-w-[1180px] px-5 sm:px-8">
      <section className="border-b border-ink py-8 sm:py-10">
        <h1 className="display text-[clamp(34px,7vw,62px)] leading-none">Today</h1>
        <p className="mt-4 max-w-[62ch] text-[15px] leading-relaxed text-ink-60">
          Ranked by dollars paid in the last 24 hours, counted from right now. The window
          rolls continuously — it does not reset at midnight, so a payment stays on this
          board for exactly one day after it lands.
        </p>
        <p className="mt-5 font-mono text-[11px] uppercase tracking-[0.13em] text-ink-40">
          {formatMoney(total)} paid in the last 24 hours across {rows.length} listing
          {rows.length === 1 ? "" : "s"}
        </p>
      </section>

      <section id="board" className="mt-10 scroll-mt-4">
        <SectionHeading title="Last 24 hours" note="Lifetime board →" href="/" />
        {rows.length ? (
          <ul>
            {rows.map((row, i) => (
              <BoardRow
                key={row.id}
                product={row}
                rank={row.rank}
                flipIndex={i}
                categoryLeader={leaders.has(row.slug)}
                todayCents={row.today_cents}
              />
            ))}
          </ul>
        ) : (
          <p className="py-14 text-[15px] text-ink-60">
            Nobody has paid in the last 24 hours. The next payment takes #1 on this board,
            whatever it is.
          </p>
        )}
      </section>
    </div>
  );
}
