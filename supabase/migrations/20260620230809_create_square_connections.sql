-- Square integration.
--
-- Two tables:
--   square_connections  — one row per user holding the tokens we use to read
--                         their Square account (revenue, orders, etc.).
--   square_oauth_states — short-lived random values that let the public OAuth
--                         callback prove which user started a connection.
--
-- SECURITY NOTE: both tables hold secrets (access/refresh tokens). RLS is
-- enabled but we deliberately create NO policies, so the browser-facing roles
-- (anon / authenticated) get ZERO access. Only the service_role key — used
-- exclusively inside the edge functions — can read or write these rows. The
-- frontend never sees a token: it asks the `square-oauth` and `square-data`
-- functions, which return only safe summary fields.

create table if not exists public.square_connections (
  user_id          uuid primary key references auth.users (id) on delete cascade,
  merchant_id      text,                            -- Square's id for the seller
  business_name    text,                            -- shown in our UI
  access_token     text not null,                   -- expires ~every 30 days
  refresh_token    text not null,                   -- used to mint new access tokens
  token_expires_at timestamptz,                     -- when access_token dies
  scopes           text[] not null default '{}',    -- permissions the seller granted
  environment      text   not null default 'sandbox', -- 'sandbox' | 'production'
  currency         text,                            -- e.g. 'USD'
  timezone         text,                            -- e.g. 'America/New_York'
  main_location_id text,                            -- default location for queries
  connected_at     timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

alter table public.square_connections enable row level security;
-- intentionally no policies: server-only access via service_role

create table if not exists public.square_oauth_states (
  state       text primary key,                     -- random CSRF token in the auth URL
  user_id     uuid not null references auth.users (id) on delete cascade,
  redirect_to text,                                 -- where to send the browser afterwards
  created_at  timestamptz not null default now(),
  expires_at  timestamptz not null default (now() + interval '15 minutes')
);

alter table public.square_oauth_states enable row level security;
-- intentionally no policies: server-only access via service_role
