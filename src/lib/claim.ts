import { store } from "./db";
import { isValidBid } from "./money";
import { getCategory } from "./categories";
import { cleanText, domainOf, safeHttpUrl, slugify } from "./sanitize";
import type { Product } from "./types";

export interface ClaimInput {
  url: string;
  category: string;
  amountCents: number;
  email?: string | null;
  /** Used only when the scrape failed and the buyer filled the fields in. */
  title?: string | null;
  description?: string | null;
  faviconUrl?: string | null;
  screenshotUrl?: string | null;
}

export interface ClaimResolution {
  product: Product;
  /** True when this payment tops up a listing that already exists. */
  topUp: boolean;
}

/** A slug nobody else is using, derived from the domain. */
async function uniqueSlug(domain: string): Promise<string> {
  const base = slugify(domain);
  for (let attempt = 0; attempt < 25; attempt++) {
    const candidate = attempt === 0 ? base : `${base}-${attempt + 1}`;
    const existing = await store().getProductBySlug(candidate);
    if (!existing) return candidate;
  }
  return `${base}-${Date.now().toString(36)}`;
}

/**
 * Turn a validated claim into the listing the payment will be credited to.
 * A domain already on the board is topped up rather than duplicated, so paying
 * twice for the same site stacks instead of splitting the total in two.
 */
export async function resolveListing(input: ClaimInput): Promise<ClaimResolution> {
  const url = safeHttpUrl(input.url);
  if (!url) throw new Error("That is not a valid http or https URL.");
  if (!isValidBid(input.amountCents)) {
    throw new Error("Amount must be a whole number of 99-cent bids.");
  }

  const domain = domainOf(url);
  if (!domain) throw new Error("Could not read a domain from that URL.");

  const db = store();
  const existing = await db.findProductByDomain(domain);
  if (existing) return { product: existing, topUp: true };

  const category = getCategory(input.category) ? input.category : "other";
  const product = await db.createPendingListing({
    slug: await uniqueSlug(domain),
    url,
    domain,
    title: cleanText(input.title, 90) || domain,
    description: cleanText(input.description, 240) || null,
    favicon_url: safeHttpUrl(input.faviconUrl),
    screenshot_url: safeHttpUrl(input.screenshotUrl),
    category_slug: category,
    email: input.email ? cleanText(input.email, 200) : null,
  });

  return { product, topUp: false };
}
