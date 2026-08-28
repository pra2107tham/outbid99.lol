"use client";

import { useSearchParams } from "next/navigation";

import { SITE_DOMAIN, absoluteUrl } from "@/lib/site";

/**
 * Shown when a buyer lands back from checkout. Reads the flag from the query
 * string on the client so the product page itself stays static.
 */
export function ClaimedBanner({ rank, slug }: { rank: number; slug: string }) {
  const params = useSearchParams();
  if (params.get("claimed") !== "1") return null;

  const text = `just took #${rank} on ${SITE_DOMAIN}`;
  const shareUrl = `https://x.com/intent/post?text=${encodeURIComponent(text)}&url=${encodeURIComponent(absoluteUrl(`/product/${slug}`))}`;

  return (
    <aside className="rank-flash-up mt-5 border-2 border-ultra px-5 py-4">
      <p className="font-mono text-[10px] uppercase tracking-[0.13em] text-ultra">
        Rank claimed
      </p>
      <p className="mt-2 text-[15px] leading-relaxed">
        You are #{rank}. The board has already updated. You hold this position until
        somebody pays more than you.
      </p>
      <a
        href={shareUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 inline-block rounded-[2px] bg-ink px-4 py-2 font-mono text-[11px] uppercase tracking-[0.13em] text-paper transition-colors hover:bg-ultra"
      >
        Post &ldquo;{text}&rdquo;
      </a>
    </aside>
  );
}
