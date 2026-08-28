import type {
  ActivityItem, CategoryStat, NewListing, Payment, Product,
  ProductStatus, RankedProduct, SiteStats, TodayRow,
} from "../types";

export interface BoardPage {
  rows: RankedProduct[];
  total: number;
}

/** Minimal listing shape needed to price a rank without loading whole rows. */
export interface BoardSummary {
  slug: string;
  title: string;
  total_cents: number;
  first_paid_at: string | null;
}

export interface CreditPaymentInput {
  productId: string;
  amountCents: number;
  providerPaymentId: string;
  email: string | null;
}

/**
 * Everything the site needs from storage. Implemented twice: against Supabase
 * Postgres in production, and against a local JSON file when no credentials
 * are configured, so the board runs and is demoable out of the box.
 */
export interface Store {
  readonly kind: "supabase" | "local";

  getBoard(offset: number, limit: number): Promise<BoardPage>;
  getCategoryBoard(categorySlug: string, offset: number, limit: number): Promise<BoardPage>;
  getTodayBoard(limit: number): Promise<TodayRow[]>;
  getBoardSummaries(): Promise<BoardSummary[]>;

  getProductBySlug(slug: string): Promise<Product | null>;
  findProductByDomain(domain: string): Promise<Product | null>;
  getPaymentsForProduct(productId: string): Promise<Payment[]>;
  getRankOf(product: Product): Promise<number>;
  getCategoryRankOf(product: Product): Promise<number>;
  getNeighbours(product: Product): Promise<{ above: Product | null; below: Product | null }>;

  getCategoryStats(): Promise<CategoryStat[]>;
  getSiteStats(): Promise<SiteStats>;
  getRecentActivity(limit: number): Promise<ActivityItem[]>;
  getSitemapEntries(): Promise<{ slug: string; updated_at: string }[]>;

  createPendingListing(input: NewListing): Promise<Product>;
  creditPayment(input: CreditPaymentInput): Promise<Product | null>;
  logClick(productId: string, referrer: string | null, country: string | null): Promise<void>;
  setProductStatus(slug: string, status: ProductStatus): Promise<Product | null>;
}
