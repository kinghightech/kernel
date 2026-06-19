-- Tracks each user's Stripe subscription so the app knows who has paid.
-- One row per user. The webhook (running with the service role) writes to it;
-- the logged-in user can only read their own row.

create table if not exists public.subscriptions (
  id                     uuid primary key default gen_random_uuid(),
  user_id                uuid not null unique references auth.users (id) on delete cascade,
  stripe_customer_id     text,
  stripe_subscription_id text,
  plan                   text,                       -- 'pro' or 'max'
  status                 text not null default 'inactive', -- 'active', 'canceled', etc.
  current_period_end     timestamptz,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

-- Fast lookups when the webhook receives a Stripe customer/subscription id.
create index if not exists subscriptions_stripe_customer_id_idx
  on public.subscriptions (stripe_customer_id);
create index if not exists subscriptions_stripe_subscription_id_idx
  on public.subscriptions (stripe_subscription_id);

-- Lock the table down: nobody can touch it by default.
alter table public.subscriptions enable row level security;

-- A logged-in user may read ONLY their own subscription row.
create policy "Users can read their own subscription"
  on public.subscriptions
  for select
  using (auth.uid() = user_id);

-- Note: no insert/update/delete policies on purpose. Only the webhook,
-- which uses the service role key, may write here — and the service role
-- bypasses row level security. The browser can never write to this table.
