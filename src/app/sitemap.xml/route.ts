import { sitemapCount } from "@/lib/sitemap-chunks";
import { SITE_URL } from "@/lib/site";

export const revalidate = 3600;

/**
 * Sitemap index. Next's generateSitemaps serves the individual files at
 * /sitemap/<id>.xml but does not publish an index for them, and /sitemap.xml is
 * the URL robots.txt advertises and Search Console expects.
 */
export async function GET() {
  const count = await sitemapCount();
  const lastModified = new Date().toISOString();

  const body = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...Array.from({ length: count }, (_, id) =>
      `  <sitemap><loc>${SITE_URL}/sitemap/${id}.xml</loc><lastmod>${lastModified}</lastmod></sitemap>`,
    ),
    "</sitemapindex>",
  ].join("\n");

  return new Response(body, {
    headers: {
      "content-type": "application/xml",
      "cache-control": "public, max-age=0, s-maxage=3600",
    },
  });
}
