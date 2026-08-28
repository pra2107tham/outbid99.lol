import type { Product, RankedProduct } from "./types";

/**
 * The only ranking rule on the site: most lifetime dollars wins, and the
 * earliest payment breaks a tie. Rank is never stored anywhere; it is derived
 * from this comparator every time a board is rendered.
 */
export function compareForBoard(a: Product, b: Product): number {
  if (b.total_cents !== a.total_cents) return b.total_cents - a.total_cents;
  const at = a.first_paid_at ? Date.parse(a.first_paid_at) : Number.MAX_SAFE_INTEGER;
  const bt = b.first_paid_at ? Date.parse(b.first_paid_at) : Number.MAX_SAFE_INTEGER;
  if (at !== bt) return at - bt;
  return a.slug.localeCompare(b.slug);
}

export function sortBoard<T extends Product>(products: T[]): T[] {
  return [...products].sort(compareForBoard);
}

/** Attach 1-based ranks to an already-sorted list, offset for pagination. */
export function withRanks<T extends Product>(sorted: T[], startRank = 1): (T & { rank: number })[] {
  return sorted.map((p, i) => ({ ...p, rank: startRank + i }));
}

/**
 * How many live listings sit strictly above this one. Rank is that count + 1.
 * Expressed as a predicate so the same rule drives both the in-memory store and
 * the Postgres head-count query.
 */
export function isAbove(candidate: Product, target: Pick<Product, "total_cents" | "first_paid_at">): boolean {
  if (candidate.total_cents !== target.total_cents) {
    return candidate.total_cents > target.total_cents;
  }
  const ct = candidate.first_paid_at ? Date.parse(candidate.first_paid_at) : Number.MAX_SAFE_INTEGER;
  const tt = target.first_paid_at ? Date.parse(target.first_paid_at) : Number.MAX_SAFE_INTEGER;
  return ct < tt;
}

/**
 * Where a brand new listing of `amountCents` would land, and how far it sits
 * below the rank above it. A new listing has no first_paid_at yet, so it loses
 * every tie — which is the honest answer to "what does this buy me right now".
 */
export function previewPlacement(
  sortedLive: Pick<Product, "total_cents" | "slug" | "title" | "first_paid_at">[],
  amountCents: number,
): { rank: number; gapCents: number; above: { title: string; total_cents: number } | null } {
  let rank = 1;
  for (const p of sortedLive) {
    if (p.total_cents >= amountCents) rank++;
    else break;
  }
  const above = rank >= 2 ? sortedLive[rank - 2] : null;
  return {
    rank,
    gapCents: above ? Math.max(0, above.total_cents - amountCents) : 0,
    above: above ? { title: above.title, total_cents: above.total_cents } : null,
  };
}
