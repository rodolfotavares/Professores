create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.app_role not null,
  endpoint text not null unique,
  subscription jsonb not null,
  user_agent text,
  last_sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists push_subscriptions_user_id_idx on public.push_subscriptions(user_id);

alter table public.push_subscriptions enable row level security;

drop policy if exists "push subscriptions own read" on public.push_subscriptions;
create policy "push subscriptions own read" on public.push_subscriptions
  for select using (auth.uid() = user_id);
