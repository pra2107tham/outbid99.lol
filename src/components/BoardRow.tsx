import Link from "next/link";

import { CategoryBadge, ClaimButton, Favicon, SeedBadge } from "./Bits";
import { RankFlap } from "./Flaps";
import { formatCount, shortAge } from "@/lib/format";
import { formatMoney } from "@/lib/money";
import type { Product } from "@/lib/types";

export interface BoardRowProps {
  product: Product;
  rank: number;
  /** Cascade offset so rows flip into place top to bottom. */
  flipIndex?: number;
  /** True when this listing also leads its own category board. */
  categoryLeader?: boolean;
  /** On /today, the trailing-24h figure replaces the lifetime one. */
  todayCents?: number;
}

export function BoardRow({
  product,
  rank,
  flipIndex = 0,
  categoryLeader = false,
  todayCents,
}: BoardRowProps) {
  const amount = todayCents ?? product.total_cents;
  return (
    <li className="border-b border-rule">
      <div className="grid grid-cols-[52px_1fr] items-start gap-x-4 py-4 sm:grid-cols-[68px_1fr] sm:gap-x-6">
        <div className="pt-0.5">
          <RankFlap rank={rank} baseDelay={flipIndex * 55} className="text-[30px] sm:text-[38px]" />
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
            <div className="min-w-0 flex-1 basis-[240px]">
              <div className="flex items-center gap-2">
                <Favicon src={product.favicon_url} domain={product.domain} size={20} />
                <h3 className="min-w-0 truncate text-[16px] font-semibold leading-tight">
                  <Link href={`/product/${product.slug}`} className="hover:text-ultra">
                    {product.title}
                  </Link>
                </h3>
              </div>

              {product.description ? (
                <p className="mt-1.5 line-clamp-2 max-w-[62ch] text-[13px] leading-snug text-ink-60">
                  {product.description}
                </p>
              ) : null}

              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <CategoryBadge slug={product.category_slug} leader={categoryLeader} />
                {product.is_seed ? <SeedBadge /> : null}
                <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-40">
                  {shortAge(product.first_paid_at)} on the board
                </span>
                <span aria-hidden="true" className="text-ink-40">·</span>
                <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-40">
                  {formatCount(product.click_count)} clicks
                </span>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-4 sm:gap-6">
              <div className="text-right">
                <p className="display text-[24px] leading-none text-ultra sm:text-[28px]">
                  {formatMoney(amount)}
                </p>
                <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.1em] text-ink-40">
                  {todayCents === undefined ? "lifetime" : "last 24h"}
                </p>
              </div>
              <ClaimButton rank={rank} totalCents={product.total_cents} targetSlug={product.slug} />
            </div>
          </div>
        </div>
      </div>
    </li>
  );
}
