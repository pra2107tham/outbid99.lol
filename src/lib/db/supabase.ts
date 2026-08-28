import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { CATEGORIES, getCategory } from "../categories";
import { compareForBoard, sortBoard, withRanks } from "../board";
import type {
  ActivityItem, CategoryStat, NewListing, Payment, Product,
  ProductStatus, SiteStats, TodayRow,
} from "../types";
import type { BoardPage, BoardSummary, CreditPaymentInput, Store } from "./store";

const LIVE = "live";
const BOARD_ORDER = (q: any) =>
  q.order("total_cents", { ascending: false }).order("first_paid_at", { ascending: true });

export function supabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  );
}

let client: SupabaseClient | null = null;

function db(): SupabaseClient {
  if (client) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  client = createClient(url, key, { auth: { persistSession: false } });
  return client;
}

export class SupabaseStore implements Store {
  readonly kind = "supabase" as const;

  async getBoard(offset: number, limit: number): Promise<BoardPage> {
    const { data, count, error } = await BOARD_ORDER(
      db().from("products").select("*", { count: "exact" }).eq("status", LIVE),
    ).range(offset, offset + limit - 1);
    if (error) throw error;
    return { rows: withRanks((data ?? []) as Product[], offset + 1), total: count ?? 0 };
  }

  async getCategoryBoard(categorySlug: string, offset: number, limit: number): Promise<BoardPage> {
    const { data, count, error } = await BOARD_ORDER(
      db()
        .from("products")
        .select("*", { count: "exact" })
        .eq("status", LIVE)
        .eq("category_slug", categorySlug),
    ).range(offset, offset + limit - 1);
    if (error) throw error;
    return { rows: withRanks((data ?? []) as Product[], offset + 1), total: count ?? 0 };
  }

  async getTodayBoard(limit: number): Promise<TodayRow[]> {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    let totals: { product_id: string; today_cents: number }[] = [];
    const rpc = await db().rpc("today_board", { p_limit: limit });
    if (!rpc.error && Array.isArray(rpc.data)) {
      totals = (rpc.data as { product_id: string; today_cents: number }[]).map((r) => ({
        product_id: r.product_id,
        today_cents: Number(r.today_cents),
      }));
    } else {
      // RPC not installed: aggregate the trailing day in the app instead.
      const { data, error } = await db()
        .from("payments")
        .select("product_id, amount_cents")
        .eq("status", "succeeded")
        .gte("created_at", since);
      if (error) throw error;
      const byProduct = new Map<string, number>();
      for (const row of (data ?? []) as { product_id: string; amount_cents: number }[]) {
        byProduct.set(row.product_id, (byProduct.get(row.product_id) ?? 0) + row.amount_cents);
      }
      totals = [...byProduct.entries()]
        .map(([product_id, today_cents]) => ({ product_id, today_cents }))
        .sort((a, b) => b.today_cents - a.today_cents)
        .slice(0, limit);
    }

    if (!totals.length) return [];

    const { data: products, error: perr } = await db()
      .from("products")
      .select("*")
      .eq("status", LIVE)
      .in("id", totals.map((t) => t.product_id));
    if (perr) throw perr;

    const byId = new Map((products ?? []).map((p) => [(p as Product).id, p as Product]));
    return totals
      .map((t) => {
        const product = byId.get(t.product_id);
        return product ? { ...product, today_cents: t.today_cents } : null;
      })
      .filter((x): x is Product & { today_cents: number } => x !== null)
      .sort((a, b) =>
        b.today_cents !== a.today_cents ? b.today_cents - a.today_cents : compareForBoard(a, b),
      )
      .slice(0, limit)
      .map((row, i) => ({ ...row, rank: i + 1 }));
  }

  async getBoardSummaries(): Promise<BoardSummary[]> {
    const { data, error } = await BOARD_ORDER(
      db().from("products").select("slug, title, total_cents, first_paid_at").eq("status", LIVE),
    ).limit(5000);
    if (error) throw error;
    return (data ?? []) as BoardSummary[];
  }

  async getProductBySlug(slug: string): Promise<Product | null> {
    const { data, error } = await db().from("products").select("*").eq("slug", slug).maybeSingle();
    if (error) throw error;
    return (data as Product) ?? null;
  }

  async findProductByDomain(domain: string): Promise<Product | null> {
    const { data, error } = await db()
      .from("products")
      .select("*")
      .eq("domain", domain)
      .neq("status", "removed")
      .limit(1);
    if (error) throw error;
    return ((data ?? [])[0] as Product) ?? null;
  }

  async getPaymentsForProduct(productId: string): Promise<Payment[]> {
    const { data, error } = await db()
      .from("payments")
      .select("*")
      .eq("product_id", productId)
      .eq("status", "succeeded")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as Payment[];
  }

  /** Rank is a head count: how many live listings sort strictly above this one. */
  private aboveFilter(product: Product) {
    const paidAt = product.first_paid_at ?? new Date().toISOString();
    return `total_cents.gt.${product.total_cents},and(total_cents.eq.${product.total_cents},first_paid_at.lt.${paidAt})`;
  }

  async getRankOf(product: Product): Promise<number> {
    const { count, error } = await db()
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("status", LIVE)
      .or(this.aboveFilter(product));
    if (error) throw error;
    return (count ?? 0) + 1;
  }

  async getCategoryRankOf(product: Product): Promise<number> {
    const { count, error } = await db()
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("status", LIVE)
      .eq("category_slug", product.category_slug)
      .or(this.aboveFilter(product));
    if (error) throw error;
    return (count ?? 0) + 1;
  }

  async getNeighbours(product: Product): Promise<{ above: Product | null; below: Product | null }> {
    const paidAt = product.first_paid_at ?? new Date().toISOString();

    // The row immediately above is the weakest of the rows that outrank it, so
    // read that set in reverse board order and take one.
    const above = await db()
      .from("products")
      .select("*")
      .eq("status", LIVE)
      .or(this.aboveFilter(product))
      .order("total_cents", { ascending: true })
      .order("first_paid_at", { ascending: false })
      .limit(1);
    if (above.error) throw above.error;

    const below = await db()
      .from("products")
      .select("*")
      .eq("status", LIVE)
      .or(
        `total_cents.lt.${product.total_cents},and(total_cents.eq.${product.total_cents},first_paid_at.gt.${paidAt})`,
      )
      .order("total_cents", { ascending: false })
      .order("first_paid_at", { ascending: true })
      .limit(1);
    if (below.error) throw below.error;

    return {
      above: ((above.data ?? [])[0] as Product) ?? null,
      below: ((below.data ?? [])[0] as Product) ?? null,
    };
  }

  async getCategoryStats(): Promise<CategoryStat[]> {
    const { data, error } = await BOARD_ORDER(
      db()
        .from("products")
        .select("slug, title, total_cents, first_paid_at, category_slug")
        .eq("status", LIVE),
    ).limit(5000);
    if (error) throw error;
    const rows = (data ?? []) as (BoardSummary & { category_slug: string })[];
    return CATEGORIES.map((c) => {
      const inCat = rows.filter((r) => r.category_slug === c.slug);
      const leader = inCat[0];
      return {
        slug: c.slug,
        name: c.name,
        blurb: c.blurb,
        count: inCat.length,
        total_cents: inCat.reduce((sum, r) => sum + r.total_cents, 0),
        leader: leader
          ? { slug: leader.slug, title: leader.title, total_cents: leader.total_cents }
          : null,
      };
    });
  }

  async getSiteStats(): Promise<SiteStats> {
    const rpc = await db().rpc("site_stats");
    if (!rpc.error && Array.isArray(rpc.data) && rpc.data[0]) {
      const r = rpc.data[0] as Record<string, unknown>;
      return {
        total_cents: Number(r.total_cents ?? 0),
        payment_count: Number(r.payment_count ?? 0),
        listing_count: Number(r.listing_count ?? 0),
        first_payment_at: (r.first_payment_at as string | null) ?? null,
      };
    }

    const { data, error } = await db()
      .from("payments")
      .select("amount_cents, created_at")
      .eq("status", "succeeded")
      .order("created_at", { ascending: true })
      .limit(50000);
    if (error) throw error;
    const rows = (data ?? []) as { amount_cents: number; created_at: string }[];
    const { count } = await db()
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("status", LIVE);
    return {
      total_cents: rows.reduce((sum, r) => sum + r.amount_cents, 0),
      payment_count: rows.length,
      listing_count: count ?? 0,
      first_payment_at: rows[0]?.created_at ?? null,
    };
  }

  async getRecentActivity(limit: number): Promise<ActivityItem[]> {
    const { data, error } = await db()
      .from("payments")
      .select("id, amount_cents, created_at, products!inner(slug, title, total_cents, first_paid_at, status)")
      .eq("status", "succeeded")
      .eq("products.status", LIVE)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw error;

    const summaries = await this.getBoardSummaries();
    const rankBySlug = new Map(summaries.map((s, i) => [s.slug, i + 1]));

    return ((data ?? []) as unknown as {
      id: string;
      amount_cents: number;
      created_at: string;
      products: { slug: string; title: string } | { slug: string; title: string }[];
    }[]).map((row) => {
      const product = Array.isArray(row.products) ? row.products[0] : row.products;
      return {
        id: row.id,
        slug: product?.slug ?? "",
        title: product?.title ?? "A listing",
        amount_cents: row.amount_cents,
        rank: rankBySlug.get(product?.slug ?? "") ?? 0,
        created_at: row.created_at,
      };
    }).filter((a) => a.slug);
  }

  async getSitemapEntries(): Promise<{ slug: string; updated_at: string }[]> {
    const { data, error } = await db()
      .from("products")
      .select("slug, last_paid_at, created_at")
      .eq("status", LIVE)
      .order("total_cents", { ascending: false })
      .limit(50000);
    if (error) throw error;
    return ((data ?? []) as { slug: string; last_paid_at: string | null; created_at: string }[]).map(
      (r) => ({ slug: r.slug, updated_at: r.last_paid_at ?? r.created_at }),
    );
  }

  async createPendingListing(input: NewListing): Promise<Product> {
    const existing = await this.getProductBySlug(input.slug);
    if (existing) return existing;
    const { data, error } = await db()
      .from("products")
      .insert({
        slug: input.slug,
        url: input.url,
        domain: input.domain,
        title: input.title,
        description: input.description,
        favicon_url: input.favicon_url,
        screenshot_url: input.screenshot_url,
        category_slug: getCategory(input.category_slug) ? input.category_slug : "other",
        email: input.email,
        status: "pending",
        is_seed: false,
      })
      .select("*")
      .single();
    if (error) {
      // Lost a race against a concurrent claim for the same slug.
      const raced = await this.getProductBySlug(input.slug);
      if (raced) return raced;
      throw error;
    }
    return data as Product;
  }

  async creditPayment(input: CreditPaymentInput): Promise<Product | null> {
    const { error } = await db().rpc("credit_payment", {
      p_product_id: input.productId,
      p_amount_cents: input.amountCents,
      p_provider_payment_id: input.providerPaymentId,
      p_email: input.email,
    });
    if (error) throw error;
    const { data } = await db().from("products").select("*").eq("id", input.productId).maybeSingle();
    return (data as Product) ?? null;
  }

  async logClick(productId: string, referrer: string | null, country: string | null): Promise<void> {
    await db().from("clicks").insert({ product_id: productId, referrer, country });
    await db().rpc("increment_click", { p_product_id: productId });
  }

  async setProductStatus(slug: string, status: ProductStatus): Promise<Product | null> {
    const { data, error } = await db()
      .from("products")
      .update({ status })
      .eq("slug", slug)
      .select("*")
      .maybeSingle();
    if (error) throw error;
    return (data as Product) ?? null;
  }
}

export { sortBoard };
