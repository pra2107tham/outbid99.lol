import Link from "next/link";

import { BoardRow } from "@/components/BoardRow";
import { HeroCard } from "@/components/HeroCard";
import { ClaimBar } from "@/components/ClaimBar";
import { ActivityFeed, LiveProvider, RevenueCounter } from "@/components/Live";
import { Pagination } from "@/components/Pagination";
import { SectionHeading } from "@/components/Bits";
import { PAGE_SIZE, getBoardPageData, parsePage } from "@/lib/home";
import { formatMoney } from "@/lib/money";
import { SITE_DESCRIPTION } from "@/lib/site";
import type { Metadata } from "next";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "outbid99 — the leaderboard you buy your way onto",
  description: SITE_DESCRIPTION,
  alternates: { canonical: "/" },
};

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const page = parsePage((await searchParams).page);
  const { board, todayTop, stats, activity, categoryLeaders, totals, totalPages } =
    await getBoardPageData(page);

  const heroes = page === 1 ? board.rows.slice(0, 3) : [];
  const rows = page === 1 ? board.rows.slice(3) : board.rows;
  const snapshot = { stats, activity };

  return (
    <LiveProvider initial={snapshot}>
      <div className="mx-auto max-w-[1180px] px-5 sm:px-8">
        <RevenueCounter initial={snapshot} />

        <ClaimBar totals={totals} />

        {heroes.length > 0 ? (
          <section aria-labelledby="top-three" className="pt-10">
            <h2 id="top-three" className="sr-only">
              The top three positions
            </h2>
            <div className="grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
              {heroes.map((product, i) => (
                <HeroCard
                  key={product.id}
                  product={product}
                  rank={product.rank}
                  flipIndex={i}
                  categoryLeader={categoryLeaders.has(product.slug)}
                />
              ))}
            </div>
          </section>
        ) : null}

        {page === 1 ? (
          <div className="mt-14 grid gap-x-10 gap-y-10 lg:grid-cols-2">
            <section aria-labelledby="today-heading" className="min-w-0">
              <SectionHeading
                title="Today's top 3"
                note="Full board →"
                href="/today"
              />
              {todayTop.length ? (
                <ul className="divide-y divide-rule">
                  {todayTop.map((row) => (
                    <li key={row.id} className="flex items-baseline justify-between gap-4 py-3">
                      <p className="min-w-0 text-[14px]">
                        <span className="display mr-2 text-[18px]">{row.rank}</span>
                        <Link href={`/product/${row.slug}`} className="font-medium hover:text-ultra">
                          {row.title}
                        </Link>
                      </p>
                      <span className="tnum shrink-0 text-[14px] font-medium text-ultra">
                        {formatMoney(row.today_cents)}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="py-6 text-[13px] text-ink-60">
                  Nobody has paid in the last 24 hours. The next payment takes #1 on this board.
                </p>
              )}
            </section>

            <section aria-labelledby="activity-heading" className="min-w-0">
              <SectionHeading title="Latest activity" note="Updates every 30s" />
              <h2 id="activity-heading" className="sr-only">
                Latest payments
              </h2>
              <ActivityFeed initial={snapshot} />
            </section>
          </div>
        ) : null}

        <section id="board" aria-labelledby="board-heading" className="mt-14 scroll-mt-4">
          <SectionHeading
            title={page === 1 ? "Ranks 4 and below" : `Ranks ${(page - 1) * PAGE_SIZE + 1}–${(page - 1) * PAGE_SIZE + rows.length}`}
            note={`${board.total} listing${board.total === 1 ? "" : "s"} on the board`}
          />
          <h2 id="board-heading" className="sr-only">
            The all-time leaderboard
          </h2>

          {rows.length ? (
            <ul>
              {rows.map((product, i) => (
                <BoardRow
                  key={product.id}
                  product={product}
                  rank={product.rank}
                  flipIndex={i}
                  categoryLeader={categoryLeaders.has(product.slug)}
                />
              ))}
            </ul>
          ) : (
            <p className="py-10 text-[14px] text-ink-60">
              Nothing on this page yet.
            </p>
          )}

          <Pagination page={page} totalPages={totalPages} basePath="/" />
        </section>

        {/* Real buyers only. Nothing goes here until somebody posts about us. */}
        <section aria-labelledby="testimonials" className="border-t border-rule py-10">
          <h2 id="testimonials" className="display text-[19px] leading-none">
            What buyers say
          </h2>
          <p className="mt-3 max-w-[60ch] text-[14px] leading-relaxed text-ink-60">
            Nothing here yet. This section fills up with real posts from people who
            bought a rank. We are not writing them ourselves.
          </p>
        </section>
      </div>
    </LiveProvider>
  );
}
