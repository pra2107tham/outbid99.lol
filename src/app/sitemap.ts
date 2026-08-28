import type { MetadataRoute } from "next";

import { CATEGORIES } from "@/lib/categories";
import {
  SITEMAP_CHUNK as CHUNK, sitemapCount, sitemapProductEntries as productEntries,
} from "@/lib/sitemap-chunks";
import { SITE_URL } from "@/lib/site";

const STATIC_PATHS: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }[] = [
  { path: "/", priority: 1, changeFrequency: "hourly" },
  { path: "/today", priority: 0.9, changeFrequency: "hourly" },
  { path: "/categories", priority: 0.8, changeFrequency: "daily" },
  { path: "/claim", priority: 0.7, changeFrequency: "weekly" },
  { path: "/about", priority: 0.5, changeFrequency: "weekly" },
  { path: "/rules", priority: 0.5, changeFrequency: "monthly" },
  { path: "/terms", priority: 0.3, changeFrequency: "yearly" },
  { path: "/privacy", priority: 0.3, changeFrequency: "yearly" },
];

/**
 * One sitemap for the fixed pages and the 24 category boards, then a sitemap
 * per 5,000 listings. Next serves these at /sitemap/<id>.xml behind an index.
 */
export async function generateSitemaps() {
  const count = await sitemapCount();
  return Array.from({ length: count }, (_, id) => ({ id }));
}

export default async function sitemap({ id }: { id: number }): Promise<MetadataRoute.Sitemap> {
  if (id === 0) {
    const now = new Date();
    return [
      ...STATIC_PATHS.map((entry) => ({
        url: `${SITE_URL}${entry.path}`,
        lastModified: now,
        changeFrequency: entry.changeFrequency,
        priority: entry.priority,
      })),
      ...CATEGORIES.map((category) => ({
        url: `${SITE_URL}/category/${category.slug}`,
        lastModified: now,
        changeFrequency: "daily" as const,
        priority: 0.7,
      })),
    ];
  }

  const products = await productEntries();
  const start = (id - 1) * CHUNK;
  return products.slice(start, start + CHUNK).map((entry) => ({
    url: `${SITE_URL}/product/${entry.slug}`,
    lastModified: new Date(entry.updated_at),
    changeFrequency: "daily" as const,
    priority: 0.6,
  }));
}
