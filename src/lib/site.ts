export const SITE_NAME = "outbid99";
export const SITE_DOMAIN = "outbid99.lol";

/** Absolute origin, needed for canonicals, OG images and the sitemap. */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "") ||
  "https://outbid99.lol"
).replace(/\/$/, "");

export const SITE_TAGLINE = "The leaderboard you buy your way onto.";

export const SITE_DESCRIPTION =
  "outbid99 is a public leaderboard ranked by money. Every listing is an ad. Rank is lifetime dollars paid, highest first, and any position can be taken for 99 cents more than the listing holding it.";

/** One line, shown in the header, the footer and on every product page. */
export const PAID_DISCLOSURE =
  "Every listing on this site is a paid advertisement. Rank is bought, not earned, and nothing here is a recommendation.";

export const ANALYTICS_DOMAIN = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN || "";
export const ANALYTICS_PUBLIC_URL = process.env.NEXT_PUBLIC_PLAUSIBLE_PUBLIC_URL || "";

export function absoluteUrl(path: string): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
