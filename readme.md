# outbid99.lol

A public leaderboard with one rule: **your rank is the total amount of money you have paid.**
Highest total sits at #1. Ties break by whoever paid first. Nothing is editorial — every
listing is an advertisement, and the site says so in the header, the footer, and on every
listing page.

## The 99-cent bid

Every payment is a whole number of 99-cent bids. The minimum is one bid ($0.99).

This keeps the arithmetic closed: because every total is a multiple of 99 cents, the price
to beat any listing is also a multiple of 99 cents. Taking rank N costs exactly one bid
more than the listing holding it, and that number is printed on every row's button. An
amount that isn't a whole number of bids rounds **up**, and the exact figure is shown
before anything is charged.

Enforced in three places so it can't drift: `src/lib/money.ts`, a `CHECK` constraint on
`payments`, and revalidation in the checkout and webhook routes.

## Running it

```bash
npm install
npm run dev
```

**It runs with no configuration at all.** With no Supabase credentials it uses a local
JSON store (`.data/db.json`) seeded with the launch board, and with no Dodo credentials
the claim flow routes to a local simulated checkout that credits a listing through the
same code path a settled payment takes. That makes the whole flow walkable offline; both
fallbacks refuse to run in production.

```bash
npm run typecheck
npx tsx scripts/check-sanitize.ts   # scraped-text sanitising
npx tsx scripts/check-store.ts      # ranking, money rules, webhook idempotency
```

## Going live

1. **Database.** Create a Supabase project, run `supabase/schema.sql` in the SQL editor,
   then set `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.
2. **Seed the board.** `npm run seed` plants the launch listings.
3. **Payments.** In Dodo, create a **one-time product with pay-what-you-want pricing
   enabled** — the bid amount is set per checkout session, so one product serves every
   rank. Set `DODO_API_KEY`, `DODO_PRODUCT_ID`, `DODO_ENVIRONMENT=live_mode`.
4. **Webhook.** Point Dodo at `https://<domain>/api/webhooks/dodo` and set
   `DODO_WEBHOOK_SECRET`. Signatures are verified with Standard Webhooks; an unverified
   payload is rejected with a 400 and never touches the board.
5. **The rest.** `NEXT_PUBLIC_SITE_URL`, `ADMIN_SECRET`, and the Plausible variables.
   See `.env.example`.

## How ranking is computed

Rank is **never stored**. Every board derives it from `ORDER BY total_cents DESC,
first_paid_at ASC`, and a single listing's rank is a head count of the listings above it.
`/today` runs the same ordering over payments from the trailing 24 hours — a rolling
window, not a midnight reset.

## Notes on the build

- **Seed listings are labelled.** The launch board holds real products that nobody paid
  for. Rather than implying a payment that never happened, each carries `is_seed` and
  renders a visible SEED badge, explained on `/rules` and `/about`. One real 99-cent bid
  outranks all of them.
- **Payments are idempotent.** Crediting keys on the provider's payment id, so a webhook
  retry cannot move the board twice. Covered by `scripts/check-store.ts`.
- **The credited amount is our own metadata**, not the payment total, because a merchant
  of record's total can include tax. It is cross-checked against the actual charge so the
  two can never diverge upward.
- **The scraper refuses private addresses.** Without that guard the scrape endpoint is an
  SSRF probe into whatever network the server sits on. `OUTBID99_ALLOW_PRIVATE_SCRAPE=1`
  lifts it for local testing only.
- **All scraped text is sanitised** before storage: tags stripped, entities decoded,
  control characters and bidi overrides removed, length capped.
- **Product pages carry a 5-minute revalidation backstop** on top of on-payment
  revalidation, because a listing's rank also changes when *other* listings are paid for.
- **`prefers-reduced-motion` removes every animation.** The split-flap leaves are never
  rendered and state changes land instantly. The real value is always in the static
  markup, so crawlers and screen readers never depend on the animation.

## Still to do before launch

- Point the domain at the deployment and confirm HTTPS.
- Verify the webhook against one real $0.99 payment in `live_mode`.
- Run the OG image through the X card validator.
- Submit `/sitemap.xml` to Search Console.
- Set the Plausible dashboard to public and confirm the footer link resolves.
- Replace the placeholder operator paragraph on `/about` with a real name and contact.
