-- Stores everything a user answers during onboarding, one row per user.
-- The user owns their row and may read/write only it (row level security).

create table if not exists public.onboarding (
  user_id          uuid primary key references auth.users (id) on delete cascade,
  business_type    text,
  address          text,
  lat              double precision,
  lng              double precision,
  revenue          text,
  profit_margin    text,
  business_model   text,
  mixed_models     text[] default '{}',
  peak_traffic     text,
  customer_source  text,
  promotion_style  text,
  business_name    text,
  completed_at     timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

alter table public.onboarding enable row level security;

create policy "Users can read their own onboarding"
  on public.onboarding for select
  using (auth.uid() = user_id);

create policy "Users can insert their own onboarding"
  on public.onboarding for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own onboarding"
  on public.onboarding for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
