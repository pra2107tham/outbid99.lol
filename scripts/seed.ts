/**
 * Plant the launch board in Supabase.
 *
 * Uses the same dataset builder as the local store, so the seeded board is
 * identical either way. Safe to run more than once: products are upserted on
 * slug and payments are upserted on provider_payment_id, so re-running does not
 * double any total.
 *
 *   NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npm run seed
 */
import { createClient } from "@supabase/supabase-js";

import { buildSeedDataset } from "../src/lib/db/local";

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    console.error(
      "Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before seeding.",
    );
    process.exit(1);
  }

  const db = createClient(url, key, { auth: { persistSession: false } });
  const { products, payments } = buildSeedDataset();

  console.log(`Seeding ${products.length} listings and ${payments.length} payments...`);

  const { error: productError } = await db
    .from("products")
    .upsert(products, { onConflict: "slug" });
  if (productError) {
    console.error("Failed to seed products:", productError.message);
    process.exit(1);
  }

  const { error: paymentError } = await db
    .from("payments")
    .upsert(payments, { onConflict: "provider_payment_id" });
  if (paymentError) {
    console.error("Failed to seed payments:", paymentError.message);
    process.exit(1);
  }

  const { count } = await db
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("status", "live");

  console.log(`Done. ${count ?? 0} listings are live.`);
  console.log("Every seeded listing is flagged is_seed and renders a SEED badge.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
