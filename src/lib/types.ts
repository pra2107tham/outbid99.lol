export type ProductStatus = "pending" | "live" | "removed";

export interface Product {
  id: string;
  slug: string;
  url: string;
  domain: string;
  title: string;
  description: string | null;
  favicon_url: string | null;
  screenshot_url: string | null;
  category_slug: string;
  total_cents: number;
  click_count: number;
  first_paid_at: string | null;
  last_paid_at: string | null;
  email: string | null;
  status: ProductStatus;
  is_seed: boolean;
  created_at: string;
}

export interface Payment {
  id: string;
  product_id: string;
  amount_cents: number;
  provider_payment_id: string;
  email: string | null;
  status: string;
  created_at: string;
}

/** A board row: a listing plus the rank derived for the board it appears on. */
export interface RankedProduct extends Product {
  rank: number;
}

/** A row on /today — ranked by dollars paid in the trailing 24h, not lifetime. */
export interface TodayRow extends RankedProduct {
  today_cents: number;
}

export interface ActivityItem {
  id: string;
  slug: string;
  title: string;
  amount_cents: number;
  rank: number;
  created_at: string;
}

export interface CategoryStat {
  slug: string;
  name: string;
  blurb: string;
  count: number;
  total_cents: number;
  leader: { slug: string; title: string; total_cents: number } | null;
}

export interface SiteStats {
  total_cents: number;
  payment_count: number;
  listing_count: number;
  first_payment_at: string | null;
}

export interface NewListing {
  slug: string;
  url: string;
  domain: string;
  title: string;
  description: string | null;
  favicon_url: string | null;
  screenshot_url: string | null;
  category_slug: string;
  email: string | null;
}
