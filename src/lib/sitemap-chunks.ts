import { store } from "./db";

/** Google allows 50,000 per file. 5,000 keeps each one small and quick to fetch. */
export const SITEMAP_CHUNK = 5000;

export async function sitemapProductEntries() {
  try {
    return await store().getSitemapEntries();
  } catch {
    return [];
  }
}

/**
 * Sitemap 0 holds the fixed pages and the category boards; each subsequent one
 * holds up to SITEMAP_CHUNK listings. Shared so the index and the sitemaps
 * themselves can never disagree about how many there are.
 */
export async function sitemapCount(): Promise<number> {
  const products = await sitemapProductEntries();
  return Math.max(1, Math.ceil(products.length / SITEMAP_CHUNK)) + 1;
}
