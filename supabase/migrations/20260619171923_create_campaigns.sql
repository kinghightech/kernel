-- Saved (liked) social media campaigns. One row per liked campaign.
-- Disliked campaigns are never inserted, so they simply disappear.

create table if not exists public.campaigns (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  name        text,
  inputs      jsonb,            -- the form answers used to generate it
  content     jsonb,            -- the AI-generated campaign
  images      text[] default '{}', -- uploaded images (data URLs), saved only on "like"
  created_at  timestamptz not null default now()
);

create index if not exists campaigns_user_id_idx on public.campaigns (user_id);

alter table public.campaigns enable row level security;

create policy "Users can read their own campaigns"
  on public.campaigns for select
  using (auth.uid() = user_id);

create policy "Users can insert their own campaigns"
  on public.campaigns for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their own campaigns"
  on public.campaigns for delete
  using (auth.uid() = user_id);
