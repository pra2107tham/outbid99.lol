import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { BoardRow } from "@/components/BoardRow";
import { SectionHeading } from "@/components/Bits";
import { Pagination } from "@/components/Pagination";
import { CATEGORIES, getCategory } from "@/lib/categories";
import { store } from "@/lib/db";
import { PAGE_SIZE, parsePage } from "@/lib/home";
import { MIN_BID_CENTS, formatMoney, outbidPrice } from "@/lib/money";
import { absoluteUrl } from "@/lib/site";

export const revalidate = 120;

export function generateStaticParams() {
  return CATEGORIES.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = getCategory(slug);
  if (!category) return { title: "Category not found" };

  const title = `${category.name} — ranked by money paid`;
  const description = `The ${category.name} board on outbid99. ${category.blurb} Ranked by lifetime dollars paid, and any position can be taken for 99 cents more.`;

  return {
    title,
    description,
    alternates: { canonical: `/category/${slug}` },
    openGraph: { title, description, url: absoluteUrl(`/category/${slug}`) },
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { slug } = await params;
  const category = getCategory(slug);
  if (!category) notFound();

  const page = parsePage((await searchParams).page);
  const board = await store().getCategoryBoard(slug, (page - 1) * PAGE_SIZE, PAGE_SIZE);
  const totalPages = Math.max(1, Math.ceil(board.total / PAGE_SIZE));
  const totalPaid = board.rows.reduce((sum, r) => sum + r.total_cents, 0);

  // Taking #1 here costs one bid more than the leader, or the opening bid if
  // the board is empty.
  const priceForTop = board.rows[0]
    ? outbidPrice(board.rows[0].total_cents)
    : MIN_BID_CENTS;

  return (
    <div className="mx-auto max-w-[1180px] px-5 sm:px-8">
      <nav aria-label="Breadcrumb" className="py-5">
        <ol className="flex flex-wrap items-center gap-2 font-mono text-[10px] uppercase tracking-[0.13em] text-ink-40">
          <li><Link href="/" className="hover:text-ink">Leaderboard</Link></li>
          <li aria-hidden="true">/</li>
          <li><Link href="/categories" className="hover:text-ink">Categories</Link></li>
          <li aria-hidden="true">/</li>
          <li className="text-ink">{category.name}</li>
        </ol>
      </nav>

      <section className="border-b border-ink pb-8">
        <h1 className="display text-[clamp(30px,6vw,56px)] leading-none">{category.name}</h1>
        <p className="mt-4 max-w-[62ch] text-[15px] leading-relaxed text-ink-60">
          {category.blurb}
        </p>
        <p className="mt-5 font-mono text-[11px] uppercase tracking-[0.13em] text-ink-40">
          {board.total} listing{board.total === 1 ? "" : "s"} · {formatMoney(totalPaid)} paid on
          this page · #1 costs {formatMoney(priceForTop)}
        </p>
      </section>

      <section id="board" className="mt-10 scroll-mt-4">
        <SectionHeading
          title={`${category.name} board`}
          note="All categories →"
          href="/categories"
        />
        {board.rows.length ? (
          <ul>
            {board.rows.map((product, i) => (
              <BoardRow
                key={product.id}
                product={product}
                rank={product.rank}
                flipIndex={i}
                categoryLeader={product.rank === 1 && page === 1}
              />
            ))}
          </ul>
        ) : (
          <p className="py-14 text-[15px] text-ink-60">
            Nobody has paid for this category yet. {formatMoney(MIN_BID_CENTS)} takes #1.
          </p>
        )}
        <Pagination page={page} totalPages={totalPages} basePath={`/category/${slug}`} />
      </section>
    </div>
  );
}
