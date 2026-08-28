import { promises as fs } from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

import { CATEGORIES, categoryName, getCategory } from "../categories";
import { compareForBoard, isAbove, sortBoard, withRanks } from "../board";
import { BID_UNIT_CENTS } from "../money";
import { SEED_LISTINGS, seedFaviconUrl } from "../seed-data";
import type {
  ActivityItem, CategoryStat, NewListing, Payment, Product,
  ProductStatus, SiteStats, TodayRow,
} from "../types";
import type { BoardPage, BoardSummary, CreditPaymentInput, Store } from "./store";

export interface Dataset {
  products: Product[];
  payments: Payment[];
  clicks: { id: number; product_id: string; created_at: string; referrer: string | null; country: string | null }[];
}

const DATA_DIR = process.env.OUTBID99_DATA_DIR || path.join(process.cwd(), ".data");
const DATA_FILE = path.join(DATA_DIR, "db.json");
const DAY_MS = 24 * 60 * 60 * 1000;

/** Deterministic per-slug jitter so the seeded board looks the same on every boot. */
function hashInt(input: string): number {
  const h = crypto.createHash("sha256").update(input).digest();
  return h.readUInt32BE(0);
}

/** Exported so the Supabase seed script plants exactly the same board. */
export function buildSeedDataset(): Dataset {
  const now = Date.now();
  const products: Product[] = [];
  const payments: Payment[] = [];

  SEED_LISTINGS.forEach((listing, index) => {
    const h = hashInt(listing.slug);
    const id = crypto.createHash("sha1").update(`product:${listing.slug}`).digest("hex");
    const productId = [
      id.slice(0, 8), id.slice(8, 12), "4" + id.slice(13, 16),
      "a" + id.slice(17, 20), id.slice(20, 32),
    ].join("-");

    // Spread the launch board across the trailing fortnight, oldest at the top
    // so tie-breaks look natural.
    const firstPaidAt = new Date(now - (index * 9 + (h % 40)) * 60 * 60 * 1000 - 6 * 60 * 60 * 1000);

    // Split larger listings into two payments so product pages have a history
    // and /today has something on it.
    const totalBids = listing.bids;
    const splits: { bids: number; at: Date }[] = [];
    if (totalBids >= 3) {
      const topUpBids = 1 + (h % 2);
      splits.push({ bids: totalBids - topUpBids, at: firstPaidAt });
      splits.push({ bids: topUpBids, at: new Date(now - (h % 20) * 60 * 60 * 1000 - 30 * 60 * 1000) });
    } else {
      splits.push({ bids: totalBids, at: firstPaidAt });
    }

    const lastPaidAt = splits.reduce((a, b) => (a.at > b.at ? a : b)).at;

    products.push({
      id: productId,
      slug: listing.slug,
      url: listing.url,
      domain: listing.domain,
      title: listing.title,
      description: listing.description,
      favicon_url: seedFaviconUrl(listing.domain),
      screenshot_url: null,
      category_slug: listing.category_slug,
      total_cents: totalBids * BID_UNIT_CENTS,
      click_count: (h % 180) + 4,
      first_paid_at: firstPaidAt.toISOString(),
      last_paid_at: lastPaidAt.toISOString(),
      email: null,
      status: "live",
      is_seed: true,
      created_at: firstPaidAt.toISOString(),
    });

    splits.forEach((split, i) => {
      payments.push({
        id: crypto.createHash("sha1").update(`payment:${listing.slug}:${i}`).digest("hex"),
        product_id: productId,
        amount_cents: split.bids * BID_UNIT_CENTS,
        provider_payment_id: `seed_${listing.slug}_${i}`,
        email: null,
        status: "succeeded",
        created_at: split.at.toISOString(),
      });
    });
  });

  return { products, payments, clicks: [] };
}

let cache: Dataset | null = null;
let loading: Promise<Dataset> | null = null;
let persistable = true;

async function load(): Promise<Dataset> {
  if (cache) return cache;
  if (loading) return loading;
  loading = (async () => {
    try {
      const raw = await fs.readFile(DATA_FILE, "utf8");
      const parsed = JSON.parse(raw) as Dataset;
      if (parsed?.products?.length) {
        cache = parsed;
        return cache;
      }
    } catch {
      // No file yet, or unreadable: fall through and seed.
    }
    cache = buildSeedDataset();
    await persist();
    return cache;
  })();
  return loading;
}

async function persist(): Promise<void> {
  if (!cache || !persistable) return;
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(DATA_FILE, JSON.stringify(cache, null, 2), "utf8");
  } catch {
    // Read-only filesystem (a serverless runtime, say). The dataset still works
    // in memory for the life of the process; it just will not survive a restart.
    persistable = false;
  }
}

const live = (d: Dataset) => d.products.filter((p) => p.status === "live");

function activityRank(sorted: Product[], productId: string): number {
  const i = sorted.findIndex((p) => p.id === productId);
  return i < 0 ? 0 : i + 1;
}

export class LocalStore implements Store {
  readonly kind = "local" as const;

  async getBoard(offset: number, limit: number): Promise<BoardPage> {
    const d = await load();
    const sorted = sortBoard(live(d));
    return {
      rows: withRanks(sorted.slice(offset, offset + limit), offset + 1),
      total: sorted.length,
    };
  }

  async getCategoryBoard(categorySlug: string, offset: number, limit: number): Promise<BoardPage> {
    const d = await load();
    const sorted = sortBoard(live(d).filter((p) => p.category_slug === categorySlug));
    return {
      rows: withRanks(sorted.slice(offset, offset + limit), offset + 1),
      total: sorted.length,
    };
  }

  async getTodayBoard(limit: number): Promise<TodayRow[]> {
    const d = await load();
    const since = Date.now() - DAY_MS;
    const byProduct = new Map<string, number>();
    for (const pay of d.payments) {
      if (pay.status !== "succeeded") continue;
      if (Date.parse(pay.created_at) < since) continue;
      byProduct.set(pay.product_id, (byProduct.get(pay.product_id) ?? 0) + pay.amount_cents);
    }
    const rows = live(d)
      .filter((p) => byProduct.has(p.id))
      .map((p) => ({ ...p, today_cents: byProduct.get(p.id) ?? 0 }))
      .sort((a, b) =>
        b.today_cents !== a.today_cents
          ? b.today_cents - a.today_cents
          : compareForBoard(a, b),
      )
      .slice(0, limit);
    return rows.map((r, i) => ({ ...r, rank: i + 1 }));
  }

  async getBoardSummaries(): Promise<BoardSummary[]> {
    const d = await load();
    return sortBoard(live(d)).map((p) => ({
      slug: p.slug, title: p.title, total_cents: p.total_cents, first_paid_at: p.first_paid_at,
    }));
  }

  async getProductBySlug(slug: string): Promise<Product | null> {
    const d = await load();
    return d.products.find((p) => p.slug === slug) ?? null;
  }

  async findProductByDomain(domain: string): Promise<Product | null> {
    const d = await load();
    return d.products.find((p) => p.domain === domain && p.status !== "removed") ?? null;
  }

  async getPaymentsForProduct(productId: string): Promise<Payment[]> {
    const d = await load();
    return d.payments
      .filter((p) => p.product_id === productId && p.status === "succeeded")
      .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));
  }

  async getRankOf(product: Product): Promise<number> {
    const d = await load();
    return live(d).filter((p) => isAbove(p, product)).length + 1;
  }

  async getCategoryRankOf(product: Product): Promise<number> {
    const d = await load();
    return (
      live(d).filter((p) => p.category_slug === product.category_slug && isAbove(p, product)).length + 1
    );
  }

  async getNeighbours(product: Product): Promise<{ above: Product | null; below: Product | null }> {
    const d = await load();
    const sorted = sortBoard(live(d));
    const i = sorted.findIndex((p) => p.id === product.id);
    if (i < 0) return { above: null, below: null };
    return { above: sorted[i - 1] ?? null, below: sorted[i + 1] ?? null };
  }

  async getCategoryStats(): Promise<CategoryStat[]> {
    const d = await load();
    const sorted = sortBoard(live(d));
    return CATEGORIES.map((c) => {
      const inCat = sorted.filter((p) => p.category_slug === c.slug);
      const leader = inCat[0];
      return {
        slug: c.slug,
        name: c.name,
        blurb: c.blurb,
        count: inCat.length,
        total_cents: inCat.reduce((sum, p) => sum + p.total_cents, 0),
        leader: leader
          ? { slug: leader.slug, title: leader.title, total_cents: leader.total_cents }
          : null,
      };
    });
  }

  async getSiteStats(): Promise<SiteStats> {
    const d = await load();
    const succeeded = d.payments.filter((p) => p.status === "succeeded");
    const first = succeeded.reduce<string | null>(
      (min, p) => (!min || Date.parse(p.created_at) < Date.parse(min) ? p.created_at : min),
      null,
    );
    return {
      total_cents: succeeded.reduce((sum, p) => sum + p.amount_cents, 0),
      payment_count: succeeded.length,
      listing_count: live(d).length,
      first_payment_at: first,
    };
  }

  async getRecentActivity(limit: number): Promise<ActivityItem[]> {
    const d = await load();
    const sorted = sortBoard(live(d));
    const byId = new Map(d.products.map((p) => [p.id, p]));
    return d.payments
      .filter((p) => p.status === "succeeded")
      .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))
      .slice(0, limit)
      .map((pay) => {
        const product = byId.get(pay.product_id);
        return {
          id: pay.id,
          slug: product?.slug ?? "",
          title: product?.title ?? "A listing",
          amount_cents: pay.amount_cents,
          rank: product ? activityRank(sorted, product.id) : 0,
          created_at: pay.created_at,
        };
      })
      .filter((a) => a.slug);
  }

  async getSitemapEntries(): Promise<{ slug: string; updated_at: string }[]> {
    const d = await load();
    return live(d).map((p) => ({
      slug: p.slug,
      updated_at: p.last_paid_at ?? p.created_at,
    }));
  }

  async createPendingListing(input: NewListing): Promise<Product> {
    const d = await load();
    const existing = d.products.find((p) => p.slug === input.slug);
    if (existing) return existing;
    const product: Product = {
      id: crypto.randomUUID(),
      slug: input.slug,
      url: input.url,
      domain: input.domain,
      title: input.title,
      description: input.description,
      favicon_url: input.favicon_url,
      screenshot_url: input.screenshot_url,
      category_slug: getCategory(input.category_slug) ? input.category_slug : "other",
      total_cents: 0,
      click_count: 0,
      first_paid_at: null,
      last_paid_at: null,
      email: input.email,
      status: "pending",
      is_seed: false,
      created_at: new Date().toISOString(),
    };
    d.products.push(product);
    await persist();
    return product;
  }

  async creditPayment(input: CreditPaymentInput): Promise<Product | null> {
    const d = await load();
    // Idempotent: a webhook retry carrying a provider id we already banked
    // must not move the board a second time.
    if (d.payments.some((p) => p.provider_payment_id === input.providerPaymentId)) {
      return d.products.find((p) => p.id === input.productId) ?? null;
    }
    const product = d.products.find((p) => p.id === input.productId);
    if (!product) return null;

    const now = new Date().toISOString();
    d.payments.push({
      id: crypto.randomUUID(),
      product_id: product.id,
      amount_cents: input.amountCents,
      provider_payment_id: input.providerPaymentId,
      email: input.email,
      status: "succeeded",
      created_at: now,
    });
    product.total_cents += input.amountCents;
    product.first_paid_at = product.first_paid_at ?? now;
    product.last_paid_at = now;
    product.email = product.email ?? input.email;
    if (product.status !== "removed") product.status = "live";
    await persist();
    return product;
  }

  async logClick(productId: string, referrer: string | null, country: string | null): Promise<void> {
    const d = await load();
    const product = d.products.find((p) => p.id === productId);
    if (!product) return;
    d.clicks.push({
      id: d.clicks.length + 1,
      product_id: productId,
      created_at: new Date().toISOString(),
      referrer,
      country,
    });
    product.click_count += 1;
    await persist();
  }

  async setProductStatus(slug: string, status: ProductStatus): Promise<Product | null> {
    const d = await load();
    const product = d.products.find((p) => p.slug === slug);
    if (!product) return null;
    product.status = status;
    await persist();
    return product;
  }
}

export { categoryName };
