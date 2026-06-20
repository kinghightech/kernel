-- Website Creator feature.
--
-- Adds:
--   * onboarding.logo_url          -- the business logo, reusable across the app
--   * public.products              -- a user's catalog of items (name, price, image)
--   * public.websites              -- the ONE saved/liked website per user (upsert)
--   * storage bucket business-assets -- public read, per-user write (logos + product images)
--
-- The AI-generated HTML is only ever stored when the user clicks "I like this".

-- 1. Logo lives on the business profile so it's reusable everywhere.
alter table public.onboarding add column if not exists logo_url text;

-- 2. Catalog of products a user sells. Price is text so "10", "$10", "Free",
--    or "From $8" all work — we only ever display it.
create table if not exists public.products (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  name        text not null,
  price       text,
  description text,
  image_url   text,
  created_at  timestamptz not null default now()
);

create index if not exists products_user_id_idx on public.products (user_id);

alter table public.products enable row level security;

create policy "Users can read their own products"
  on public.products for select
  using (auth.uid() = user_id);

create policy "Users can insert their own products"
  on public.products for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own products"
  on public.products for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own products"
  on public.products for delete
  using (auth.uid() = user_id);

-- 3. The single active website per user. user_id is the primary key, so saving
--    again simply replaces the previous one (upsert on conflict).
create table if not exists public.websites (
  user_id     uuid primary key references auth.users (id) on delete cascade,
  name        text,
  inputs      jsonb,            -- the form answers + product snapshot used to build it
  html        text,            -- the full self-contained HTML document
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.websites enable row level security;

create policy "Users can read their own website"
  on public.websites for select
  using (auth.uid() = user_id);

create policy "Users can insert their own website"
  on public.websites for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own website"
  on public.websites for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own website"
  on public.websites for delete
  using (auth.uid() = user_id);

-- 4. Storage bucket for logos and product images. The bucket is public, so the
--    generated site can <img src> the object URLs directly via the CDN — no
--    SELECT policy is needed for that, and deliberately omitting one prevents
--    clients from listing/enumerating the bucket. Writes are confined to each
--    user's own folder (path must start with "<user_id>/...").
insert into storage.buckets (id, name, public)
values ('business-assets', 'business-assets', true)
on conflict (id) do nothing;

create policy "Users can upload to their own folder"
  on storage.objects for insert
  with check (
    bucket_id = 'business-assets'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can update their own assets"
  on storage.objects for update
  using (
    bucket_id = 'business-assets'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can delete their own assets"
  on storage.objects for delete
  using (
    bucket_id = 'business-assets'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
