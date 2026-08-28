import type { Metadata } from "next";
import Link from "next/link";

import { store } from "@/lib/db";
import { formatMoney } from "@/lib/money";
import { absoluteUrl } from "@/lib/site";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Categories — 24 boards, each ranked by money",
  description:
    "All 24 outbid99 categories, with the number of listings and the current number one on each board.",
  alternates: { canonical: "/categories" },
  openGraph: { title: "Categories on outbid99", url: absoluteUrl("/categories") },
};

export default async function CategoriesPage() {
  const categories = await store().getCategoryStats();
  const occupied = categories.filter((c) => c.count > 0).length;

  return (
    <div className="mx-auto max-w-[1180px] px-5 sm:px-8">
      <section className="border-b border-ink py-8 sm:py-10">
        <h1 className="display text-[clamp(34px,7vw,62px)] leading-none">Categories</h1>
        <p className="mt-4 max-w-[62ch] text-[15px] leading-relaxed text-ink-60">
          Twenty-four boards. Each one ranks independently, so being #1 in a quiet
          category costs a great deal less than being #1 overall.
        </p>
        <p className="mt-5 font-mono text-[11px] uppercase tracking-[0.13em] text-ink-40">
          {occupied} of {categories.length} boards have a listing on them
        </p>
      </section>

      <ul className="mt-2 grid sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => (
          <li key={category.slug} className="border-b border-rule py-5 sm:pr-8">
            <Link href={`/category/${category.slug}`} className="group block">
              <div className="flex items-baseline justify-between gap-4">
                <h2 className="text-[16px] font-semibold leading-tight group-hover:text-ultra">
                  {category.name}
                </h2>
                <span className="tnum shrink-0 font-mono text-[11px] text-ink-40">
                  {category.count}
                </span>
              </div>
              <p className="mt-1.5 line-clamp-2 text-[13px] leading-snug text-ink-60">
                {category.blurb}
              </p>
              <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.1em]">
                {category.leader ? (
                  <>
                    <span className="text-ink-40">#1 </span>
                    <span className="text-ink">{category.leader.title}</span>
                    <span className="text-ultra"> {formatMoney(category.leader.total_cents)}</span>
                  </>
                ) : (
                  <span className="text-ink-40">Nobody has paid for this category yet.</span>
                )}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
