-- Social media integration via Composio (Instagram, TikTok, YouTube, ...).
--
-- One row per (user, platform). Unlike square_connections, this table holds
-- NO secrets: Composio stores the OAuth tokens on its side, keyed by our
-- Composio userId (which we set to the Supabase user.id). We only keep a
-- lightweight record so the UI can show what's connected.
--
--   connected_account_id — Composio's id for this connection. Used to
--                          disconnect / execute actions on the account.
--   status               — mirrors Composio: 'pending' until the user finishes
--                          the OAuth popup, then 'active' (or 'failed').
--
-- Because there are no secrets here, we DO allow the owner to read their own
-- rows (RLS select policy). All writes happen only inside the
-- `composio-connect` edge function via the service_role key.

create table if not exists public.social_connections (
  user_id              uuid not null references auth.users (id) on delete cascade,
  platform             text not null,                       -- 'instagram' | 'tiktok' | 'youtube'
  connected_account_id text,                                -- Composio connected-account id
  status               text not null default 'pending',     -- 'pending' | 'active' | 'failed'
  account_label        text,                                -- e.g. the @handle, shown in UI
  ig_user_id           text,                                -- Instagram Business Account ID (needed to publish)
  connected_at         timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  primary key (user_id, platform)
);

alter table public.social_connections enable row level security;

-- Owner may READ their own connection rows (no secrets in this table).
create policy "social_connections_owner_select"
  on public.social_connections
  for select
  using (auth.uid() = user_id);

-- No insert/update/delete policies: writes are server-only via service_role.
