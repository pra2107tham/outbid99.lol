import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { CategoryBadge, ClaimButton, Favicon, SeedBadge } from "@/components/Bits";
import { ClaimedBanner } from "@/components/ClaimedBanner";
import { RankFlap } from "@/components/Flaps";
import { categoryName } from "@/lib/categories";
import { store } from "@/lib/db";
import { formatCount, formatDate, shortAge } from "@/lib/format";
import { formatMoney, outbidPrice } from "@/lib/money";
import { cleanText, safeHttpUrl } from "@/lib/sanitize";
import { PAID_DISCLOSURE, SITE_NAME, absoluteUrl } from "@/lib/site";

/**
 * Product pages are the SEO surface, so they are prerendered and refreshed on
 * payment via revalidatePath. The five-minute backstop exists because a page's
 * rank also moves when *other* listings are paid for, which an on-demand
 * revalidation of the paid listing alone would never catch.
 */
export const revalidate = 300;
export const dynamicParams = true;

export async function generateStaticParams() {
  try {
    const { rows } = await store().getBoard(0, 200);
    return rows.map((p) => ({ slug: p.slug }));
  } catch {
    return [];
  }
}

async function load(slug: string) {
  const db = store();
  const product = await db.getProductBySlug(slug);
  if (!product || product.status !== "live") return null;

  const [rank, categoryRank, payments, neighbours] = await Promise.all([
    db.getRankOf(product),
    db.getCategoryRankOf(product),
    db.getPaymentsForProduct(product.id),
    db.getNeighbours(product),
  ]);

  return { product, rank, categoryRank, payments, neighbours };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = await load(slug);
  if (!data) return { title: "Listing not found" };

  const { product, rank } = data;
  const title = `${product.title} — #${rank} on ${SITE_NAME}`;
  const description =
    cleanText(product.description, 155) ||
    `${product.title} holds rank ${rank} on outbid99 with ${formatMoney(product.total_cents)} paid.`;

  return {
    title,
    description,
    alternates: { canonical: `/product/${product.slug}` },
    openGraph: {
      type: "article",
      title,
      description,
      url: absoluteUrl(`/product/${product.slug}`),
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await load(slug);
  if (!data) notFound();

  const { product, rank, categoryRank, payments, neighbours } = data;
  const outbound = safeHttpUrl(product.url);
  const leadsCategory = categoryRank === 1;

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Product",
        name: product.title,
        description: cleanText(product.description, 300) || product.title,
        url: absoluteUrl(`/product/${product.slug}`),
        category: categoryName(product.category_slug),
        ...(product.screenshot_url ? { image: product.screenshot_url } : {}),
        ...(outbound ? { sameAs: outbound } : {}),
        offers: {
          "@type": "Offer",
          // What it costs to take this position, not what the product sells for.
          price: (outbidPrice(product.total_cents) / 100).toFixed(2),
          priceCurrency: "USD",
          availability: "https://schema.org/InStock",
          url: absoluteUrl(`/claim?rank=${rank}&amount=${outbidPrice(product.total_cents)}`),
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Leaderboard", item: absoluteUrl("/") },
          {
            "@type": "ListItem",
            position: 2,
            name: categoryName(product.category_slug),
            item: absoluteUrl(`/category/${product.category_slug}`),
          },
          {
            "@type": "ListItem",
            position: 3,
            name: product.title,
            item: absoluteUrl(`/product/${product.slug}`),
          },
        ],
      },
    ],
  };

  return (
    <div className="mx-auto max-w-[1180px] px-5 sm:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <nav aria-label="Breadcrumb" className="py-5">
        <ol className="flex flex-wrap items-center gap-2 font-mono text-[10px] uppercase tracking-[0.13em] text-ink-40">
          <li><Link href="/" className="hover:text-ink">Leaderboard</Link></li>
          <li aria-hidden="true">/</li>
          <li>
            <Link href={`/category/${product.category_slug}`} className="hover:text-ink">
              {categoryName(product.category_slug)}
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li className="text-ink">{product.title}</li>
        </ol>
      </nav>

      <Suspense fallback={null}>
        <ClaimedBanner rank={rank} slug={product.slug} />
      </Suspense>

      <div className="mt-6 grid gap-x-12 gap-y-10 border-t-2 border-ink pt-6 lg:grid-cols-[1fr_320px]">
        <article className="min-w-0">
          <div className="flex flex-wrap items-start gap-x-6 gap-y-4">
            <RankFlap rank={rank} className="text-[76px] sm:text-[96px]" />
            <div className="min-w-0 flex-1 pt-1">
              <div className="flex items-center gap-2.5">
                <Favicon src={product.favicon_url} domain={product.domain} size={28} />
                <h1 className="min-w-0 text-[28px] font-semibold leading-tight sm:text-[34px]">
                  {product.title}
                </h1>
              </div>
              {outbound ? (
                <p className="mt-2 text-[13px]">
                  {/* The direct, followable link. This is the asset a listing buys. */}
                  <a
                    href={outbound}
                    rel="dofollow noopener"
                    className="font-mono tracking-[0.02em] text-ultra underline underline-offset-4 hover:text-ink"
                  >
                    {product.domain}
                  </a>
                </p>
              ) : null}
              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                <CategoryBadge slug={product.category_slug} leader={leadsCategory} />
                {product.is_seed ? <SeedBadge /> : null}
              </div>
            </div>
          </div>

          {product.screenshot_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.screenshot_url}
              alt={`Screenshot of ${product.title}`}
              className="mt-8 aspect-[16/9] w-full max-w-full rounded-[2px] border border-rule object-cover"
            />
          ) : null}

          {product.description ? (
            <p className="mt-8 max-w-[68ch] text-[16px] leading-relaxed">{product.description}</p>
          ) : null}

          <p className="mt-6 max-w-[68ch] border-l-2 border-rule pl-4 text-[13px] leading-relaxed text-ink-60">
            {product.is_seed
              ? `${product.title} was placed on this board by outbid99 at launch. Nobody paid for this position, and it can be taken for ${formatMoney(outbidPrice(product.total_cents))}.`
              : `${product.title} holds #${rank} because it has paid ${formatMoney(product.total_cents)}. That is the only reason. ${PAID_DISCLOSURE}`}
          </p>

          <section aria-labelledby="history" className="mt-12">
            <h2 id="history" className="display border-b border-ink pb-2 text-[19px] leading-none">
              Payment history
            </h2>
            {payments.length ? (
              <ul className="divide-y divide-rule">
                {payments.map((payment) => (
                  <li key={payment.id} className="flex items-baseline justify-between gap-6 py-3">
                    <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-ink-60">
                      {formatDate(payment.created_at)}
                    </span>
                    <span className="tnum text-[15px] font-medium text-ultra">
                      {formatMoney(payment.amount_cents)}
                    </span>
                  </li>
                ))}
                <li className="flex items-baseline justify-between gap-6 border-t border-ink py-3">
                  <span className="font-mono text-[11px] uppercase tracking-[0.1em]">Lifetime</span>
                  <span className="tnum text-[17px] font-semibold text-ultra">
                    {formatMoney(product.total_cents)}
                  </span>
                </li>
              </ul>
            ) : (
              <p className="py-5 text-[14px] text-ink-60">No payments recorded.</p>
            )}
          </section>

          <nav aria-label="Nearby ranks" className="mt-12 grid gap-4 sm:grid-cols-2">
            {neighbours.above ? (
              <Link
                href={`/product/${neighbours.above.slug}`}
                className="block min-w-0 border border-rule p-4 transition-colors hover:border-ink"
              >
                <p className="font-mono text-[10px] uppercase tracking-[0.13em] text-ink-40">
                  One above
                </p>
                <p className="mt-1.5 truncate text-[15px] font-medium">{neighbours.above.title}</p>
                <p className="tnum mt-1 text-[13px] text-ultra">
                  {formatMoney(neighbours.above.total_cents)}
                </p>
              </Link>
            ) : (
              <div className="min-w-0 border border-dashed border-rule p-4">
                <p className="font-mono text-[10px] uppercase tracking-[0.13em] text-ink-40">
                  One above
                </p>
                <p className="mt-1.5 text-[14px] text-ink-60">Nothing. This is #1.</p>
              </div>
            )}

            {neighbours.below ? (
              <Link
                href={`/product/${neighbours.below.slug}`}
                className="block min-w-0 border border-rule p-4 transition-colors hover:border-ink"
              >
                <p className="font-mono text-[10px] uppercase tracking-[0.13em] text-ink-40">
                  One below
                </p>
                <p className="mt-1.5 truncate text-[15px] font-medium">{neighbours.below.title}</p>
                <p className="tnum mt-1 text-[13px] text-ultra">
                  {formatMoney(neighbours.below.total_cents)}
                </p>
              </Link>
            ) : (
              <div className="min-w-0 border border-dashed border-rule p-4">
                <p className="font-mono text-[10px] uppercase tracking-[0.13em] text-ink-40">
                  One below
                </p>
                <p className="mt-1.5 text-[14px] text-ink-60">Nothing. This is last.</p>
              </div>
            )}
          </nav>
        </article>

        <aside className="min-w-0 lg:sticky lg:top-6 lg:self-start">
          <div className="border-t-2 border-ink pt-4">
            <dl className="space-y-5">
              <div>
                <dt className="font-mono text-[10px] uppercase tracking-[0.13em] text-ink-40">
                  Lifetime paid
                </dt>
                <dd className="display mt-1 text-[38px] leading-none text-ultra">
                  {formatMoney(product.total_cents)}
                </dd>
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <dt className="font-mono text-[10px] uppercase tracking-[0.13em] text-ink-40">
                    Rank
                  </dt>
                  <dd className="display mt-1 text-[24px] leading-none">#{rank}</dd>
                </div>
                <div>
                  <dt className="font-mono text-[10px] uppercase tracking-[0.13em] text-ink-40">
                    In category
                  </dt>
                  <dd className="display mt-1 text-[24px] leading-none">#{categoryRank}</dd>
                </div>
                <div>
                  <dt className="font-mono text-[10px] uppercase tracking-[0.13em] text-ink-40">
                    Clicks
                  </dt>
                  <dd className="display mt-1 text-[24px] leading-none">
                    {formatCount(product.click_count)}
                  </dd>
                </div>
                <div>
                  <dt className="font-mono text-[10px] uppercase tracking-[0.13em] text-ink-40">
                    On the board
                  </dt>
                  <dd className="display mt-1 text-[24px] leading-none">
                    {shortAge(product.first_paid_at)}
                  </dd>
                </div>
              </div>
            </dl>

            <div className="mt-7 space-y-3">
              <a
                href={`/go/${product.slug}`}
                rel="noopener"
                className="block rounded-[2px] border border-ink px-4 py-2.5 text-center font-mono text-[11px] uppercase tracking-[0.13em] transition-colors hover:bg-ink hover:text-paper"
              >
                Visit {product.domain}
              </a>
              <div>
                <ClaimButton rank={rank} totalCents={product.total_cents} targetSlug={product.slug} size="hero" />
              </div>
              <p className="text-[12px] leading-relaxed text-ink-60">
                Taking #{rank} costs {formatMoney(outbidPrice(product.total_cents))} — one 99-cent
                bid more than this listing has paid.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
