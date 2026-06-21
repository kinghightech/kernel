-- Simple per-user checklist shown as "Today's to-do" on the dashboard home.
create table if not exists public.todos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  text text not null,
  done boolean not null default false,
  due_date date,                       -- which day this task is for (null = no date)
  created_at timestamptz not null default now()
);

alter table public.todos enable row level security;

create policy "Users manage their own todos"
  on public.todos for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists todos_user_id_idx on public.todos (user_id, created_at);
