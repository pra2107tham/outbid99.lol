-- outbid99.lol schema
-- Run this once against a fresh Supabase Postgres project (SQL editor or psql).
-- Rank is never stored. It is always derived: ORDER BY total_cents DESC, first_paid_at ASC.

create extension if not exists "pgcrypto";

create table if not exists products (
  id             uuid primary key default gen_random_uuid(),
  slug           text unique not null,
  url            text not null,
  domain         text not null,
  title          text not null,
  description    text,
  favicon_url    text,
  screenshot_url text,
  category_slug  text not null default 'other',
  total_cents    int  not null default 0,
  click_count    int  not null default 0,
  first_paid_at  timestamptz,
  last_paid_at   timestamptz,
  email          text,
  status         text not null default 'pending',   -- pending | live | removed
  is_seed        boolean not null default false,     -- house-placed at launch, not paid for by the owner
  created_at     timestamptz not null default now()
);

create table if not exists payments (
  id                  uuid primary key default gen_random_uuid(),
  product_id          uuid not null references products(id) on delete cascade,
  amount_cents        int  not null,
  provider_payment_id text unique not null,
  email               text,
  status              text not null default 'succeeded',
  created_at          timestamptz not null default now()
);

create table if not exists clicks (
  id         bigserial primary key,
  product_id uuid not null references products(id) on delete cascade,
  created_at timestamptz not null default now(),
  referrer   text,
  country    text
);

-- The leaderboard sort. Composite so the board is a single index scan.
create index if not exists products_board_idx
  on products (total_cents desc, first_paid_at asc)
  where status = 'live';

create index if not exists products_category_board_idx
  on products (category_slug, total_cents desc, first_paid_at asc)
  where status = 'live';

create index if not exists products_slug_idx        on products (slug);
create index if not exists products_domain_idx      on products (domain);
create index if not exists payments_product_idx     on payments (product_id, created_at desc);
create index if not exists payments_recent_idx      on payments (created_at desc) where status = 'succeeded';
create index if not exists clicks_product_idx       on clicks (product_id, created_at desc);

-- Every amount on the board is a whole number of 99c bids. Enforce it in the
-- database too, so a bad webhook payload can never put an off-grid number on
-- the board.
alter table payments drop constraint if exists payments_amount_is_whole_bids;
alter table payments add  constraint payments_amount_is_whole_bids
  check (amount_cents > 0 and amount_cents % 99 = 0);

alter table products drop constraint if exists products_status_valid;
alter table products add  constraint products_status_valid
  check (status in ('pending', 'live', 'removed'));

-- Atomic credit of a payment onto a listing. Called by the verified webhook.
-- Safe to call twice with the same provider_payment_id: the unique index makes
-- the second insert a no-op, so totals never double-count a retried webhook.
create or replace function credit_payment(
  p_product_id uuid,
  p_amount_cents int,
  p_provider_payment_id text,
  p_email text
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rows int := 0;
begin
  insert into payments (product_id, amount_cents, provider_payment_id, email, status)
  values (p_product_id, p_amount_cents, p_provider_payment_id, p_email, 'succeeded')
  on conflict (provider_payment_id) do nothing;

  get diagnostics v_rows = row_count;

  if v_rows > 0 then
    update products
       set total_cents   = total_cents + p_amount_cents,
           first_paid_at = coalesce(first_paid_at, now()),
           last_paid_at  = now(),
           status        = case when status = 'removed' then 'removed' else 'live' end,
           email         = coalesce(email, p_email)
     where id = p_product_id;
  end if;
end;
$$;

create or replace function increment_click(p_product_id uuid)
returns void language sql security definer set search_path = public as $$
  update products set click_count = click_count + 1 where id = p_product_id;
$$;

-- All writes go through the service role key on the server. Reads of live
-- listings are public so an anon key works for read-only surfaces too.
alter table products enable row level security;
alter table payments enable row level security;
alter table clicks   enable row level security;

drop policy if exists "public reads live products" on products;
create policy "public reads live products" on products
  for select using (status = 'live');

drop policy if exists "public reads succeeded payments" on payments;
create policy "public reads succeeded payments" on payments
  for select using (status = 'succeeded');

-- Aggregates. The app falls back to client-side aggregation if these are
-- missing, but installing them keeps the revenue counter and /today to a
-- single round trip each.
create or replace function site_stats()
returns table (total_cents bigint, payment_count bigint, listing_count bigint, first_payment_at timestamptz)
language sql stable security definer set search_path = public as $$
  select
    coalesce((select sum(amount_cents) from payments where status = 'succeeded'), 0)::bigint,
    (select count(*) from payments where status = 'succeeded')::bigint,
    (select count(*) from products where status = 'live')::bigint,
    (select min(created_at) from payments where status = 'succeeded');
$$;

create or replace function today_board(p_limit int default 3)
returns table (product_id uuid, today_cents bigint)
language sql stable security definer set search_path = public as $$
  select p.product_id, sum(p.amount_cents)::bigint as today_cents
    from payments p
    join products pr on pr.id = p.product_id
   where p.status = 'succeeded'
     and pr.status = 'live'
     and p.created_at >= now() - interval '24 hours'
   group by p.product_id
   order by today_cents desc
   limit p_limit;
$$;
