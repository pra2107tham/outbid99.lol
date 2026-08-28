import Link from "next/link";

import { CategoryBadge, ClaimButton, Favicon, SeedBadge } from "./Bits";
import { RankFlap } from "./Flaps";
import { formatCount, shortAge } from "@/lib/format";
import { formatMoney } from "@/lib/money";
import type { Product } from "@/lib/types";

/**
 * Screenshot when a listing has one, otherwise a board panel carrying the
 * domain. A generated panel reads as deliberate; a broken image does not.
 */
function Screen({ product }: { product: Product }) {
  if (product.screenshot_url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={product.screenshot_url}
        alt=""
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        className="aspect-[16/9] w-full max-w-full rounded-[2px] border border-rule object-cover"
      />
    );
  }
  return (
    <div
      aria-hidden="true"
      className="grid aspect-[16/9] w-full place-items-center rounded-[2px] bg-ink px-4"
    >
      <span className="display max-w-full truncate text-[clamp(18px,3.2vw,30px)] leading-none text-paper">
        {product.domain}
      </span>
    </div>
  );
}

export function HeroCard({
  product,
  rank,
  flipIndex = 0,
  categoryLeader = false,
}: {
  product: Product;
  rank: number;
  flipIndex?: number;
  categoryLeader?: boolean;
}) {
  return (
    <article className="flex min-w-0 flex-col border-t-2 border-ink pt-4">
      <div className="flex items-start justify-between gap-4">
        <RankFlap rank={rank} baseDelay={flipIndex * 90} className="text-[64px] sm:text-[76px]" />
        <div className="pt-2 text-right">
          <p className="display text-[30px] leading-none text-ultra sm:text-[34px]">
            {formatMoney(product.total_cents)}
          </p>
          <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.13em] text-ink-40">
            lifetime paid
          </p>
        </div>
      </div>

      <div className="mt-4">
        <Screen product={product} />
      </div>

      <div className="mt-4 flex items-center gap-2">
        <Favicon src={product.favicon_url} domain={product.domain} size={24} />
        <h3 className="min-w-0 truncate text-[19px] font-semibold leading-tight">
          <Link href={`/product/${product.slug}`} className="hover:text-ultra">
            {product.title}
          </Link>
        </h3>
      </div>

      {product.description ? (
        <p className="mt-2 line-clamp-3 text-[13px] leading-relaxed text-ink-60">
          {product.description}
        </p>
      ) : null}

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <CategoryBadge slug={product.category_slug} leader={categoryLeader} />
        {product.is_seed ? <SeedBadge /> : null}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[10px] uppercase tracking-[0.1em] text-ink-40">
        <span>{formatCount(product.click_count)} clicks</span>
        <span aria-hidden="true">·</span>
        <span>{shortAge(product.first_paid_at)} on the board</span>
      </div>

      <div className="mt-4 pt-1">
        <ClaimButton
          rank={rank}
          totalCents={product.total_cents}
          targetSlug={product.slug}
          size="hero"
        />
      </div>
    </article>
  );
}
