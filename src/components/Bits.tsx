import Link from "next/link";

import { categoryName } from "@/lib/categories";
import { formatMoney, outbidPrice } from "@/lib/money";

/** Favicon with a typographic fallback, so a dead icon never leaves a hole. */
export function Favicon({
  src,
  domain,
  size = 22,
}: {
  src: string | null;
  domain: string;
  size?: number;
}) {
  if (!src) {
    return (
      <span
        aria-hidden="true"
        className="display grid shrink-0 place-items-center bg-ink text-paper"
        style={{ width: size, height: size, fontSize: size * 0.55, borderRadius: 2 }}
      >
        {domain.charAt(0).toUpperCase()}
      </span>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      width={size}
      height={size}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      className="shrink-0 rounded-[2px] bg-paper-2"
      style={{ width: size, height: size }}
    />
  );
}

export function CategoryBadge({ slug, leader = false }: { slug: string; leader?: boolean }) {
  return (
    <Link
      href={`/category/${slug}`}
      className={`inline-block whitespace-nowrap rounded-[2px] border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.1em] transition-colors ${
        leader
          ? "border-ultra bg-ultra text-paper hover:bg-ink hover:border-ink"
          : "border-rule text-ink-60 hover:border-ink hover:text-ink"
      }`}
    >
      {leader ? `#1 in ${categoryName(slug)}` : categoryName(slug)}
    </Link>
  );
}

/**
 * Marks a listing outbid99 placed itself at launch. Nobody paid for these, and
 * the board says so rather than implying a payment that never happened.
 */
export function SeedBadge() {
  return (
    <span
      title="Placed by outbid99 at launch. Not paid for by the owner."
      className="inline-block whitespace-nowrap rounded-[2px] border border-dashed border-ink-40 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.1em] text-ink-40"
    >
      Seed
    </span>
  );
}

/**
 * The price to take a given position: one 99-cent bid more than the listing
 * currently holding it. The exact number is the button label, everywhere.
 */
export function ClaimButton({
  rank,
  totalCents,
  targetSlug,
  size = "row",
}: {
  rank: number;
  totalCents: number;
  targetSlug?: string;
  size?: "row" | "hero";
}) {
  const price = outbidPrice(totalCents);
  const href = `/claim?rank=${rank}&amount=${price}${targetSlug ? `&target=${targetSlug}` : ""}`;
  const classes =
    size === "hero"
      ? "px-4 py-2.5 text-[12px]"
      : "px-3 py-1.5 text-[11px]";
  return (
    <Link
      href={href}
      className={`inline-block whitespace-nowrap rounded-[2px] bg-ultra font-mono uppercase tracking-[0.1em] text-paper transition-colors hover:bg-ink ${classes}`}
    >
      Take #{rank} for {formatMoney(price)}
    </Link>
  );
}

export function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-mono text-[10px] uppercase tracking-[0.13em] text-ink-40">{label}</dt>
      <dd className="display mt-1 text-[22px] leading-none">{value}</dd>
    </div>
  );
}

export function SectionHeading({
  title,
  note,
  href,
}: {
  title: string;
  note?: string;
  href?: string;
}) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-ink pb-2">
      <h2 className="display text-[19px] leading-none">{title}</h2>
      {note ? (
        href ? (
          <Link href={href} className="font-mono text-[10px] uppercase tracking-[0.13em] text-ink-60 hover:text-ultra">
            {note}
          </Link>
        ) : (
          <p className="font-mono text-[10px] uppercase tracking-[0.13em] text-ink-40">{note}</p>
        )
      ) : null}
    </div>
  );
}
