import { NextResponse, type NextRequest } from "next/server";

import { clientIp, rateLimit } from "@/lib/ratelimit";
import { scrapeUrl } from "@/lib/scrape";

export const dynamic = "force-dynamic";
export const maxDuration = 15;

/** Scrape a candidate listing. Rate limited: it makes an outbound request. */
export async function POST(request: NextRequest) {
  const limit = rateLimit(`scrape:${clientIp(request.headers)}`, 12, 60_000);
  if (!limit.ok) {
    return NextResponse.json(
      { ok: false, error: "Too many lookups. Wait a moment and try again." },
      { status: 429, headers: { "retry-after": String(limit.retryAfterSeconds) } },
    );
  }

  let url: unknown;
  try {
    ({ url } = await request.json());
  } catch {
    return NextResponse.json({ ok: false, error: "Bad request." }, { status: 400 });
  }

  if (typeof url !== "string" || url.length > 2048) {
    return NextResponse.json({ ok: false, error: "Send a URL." }, { status: 400 });
  }

  const result = await scrapeUrl(url);
  return NextResponse.json(result, { headers: { "cache-control": "no-store" } });
}
