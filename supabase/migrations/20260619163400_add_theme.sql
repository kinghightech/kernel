-- Stores the user's chosen dashboard theme ('light' or 'dark').
alter table public.onboarding
  add column if not exists theme text not null default 'dark';
