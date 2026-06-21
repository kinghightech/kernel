-- AI call-answering ("voice agent"): one agent per business that picks up
-- calls the owner misses. The agent's knowledge comes from the business's
-- onboarding row + products table at call time (via the voice-webhook fn),
-- so hours/menu are always current.

-- Business hours, stored structured so the AI can reason about "open tomorrow?".
-- Shape: { "mon": [{"open":"17:00","close":"22:00"}], "tue": [], ... }
-- An empty array means closed that day.
alter table public.onboarding
  add column if not exists hours jsonb default '{}'::jsonb;

-- One voice agent per user. Rows exist only once the owner enables the feature.
create table if not exists public.voice_agents (
  user_id uuid primary key references auth.users(id) on delete cascade,
  enabled boolean not null default false,
  greeting text,                       -- optional custom opening line
  retell_agent_id text,                -- set after provisioning via Retell API
  retell_llm_id text,
  phone_number text,                   -- the number callers reach the AI on
  phone_number_pretty text,            -- formatted for display
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.voice_agents enable row level security;

create policy "Users can read their own voice agent"
  on public.voice_agents for select
  using (auth.uid() = user_id);

create policy "Users can insert their own voice agent"
  on public.voice_agents for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own voice agent"
  on public.voice_agents for update
  using (auth.uid() = user_id);

-- One row per handled call. Written by the voice-webhook edge function using
-- the service role, so no user insert policy (server-only writes).
create table if not exists public.calls (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  retell_call_id text unique,
  caller_number text,
  transcript jsonb,                    -- full turn-by-turn transcript
  summary text,                        -- short AI summary of what they wanted
  recording_url text,
  duration_seconds integer,
  lead jsonb,                          -- captured name/callback/intent if any
  created_at timestamptz not null default now()
);

alter table public.calls enable row level security;

create policy "Users can read their own calls"
  on public.calls for select
  using (auth.uid() = user_id);

create index if not exists calls_user_id_created_at_idx
  on public.calls (user_id, created_at desc);
