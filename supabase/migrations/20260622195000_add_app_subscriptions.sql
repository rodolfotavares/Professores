create table if not exists public.app_subscriptions (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  month_reference text not null,
  amount numeric(10,2) not null default 39.90,
  status text not null default 'pending',
  mercado_pago_payment_id text,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  unique(teacher_id, month_reference)
);

alter table public.app_subscriptions enable row level security;

drop policy if exists "app subscriptions teacher read" on public.app_subscriptions;
create policy "app subscriptions teacher read" on public.app_subscriptions
  for select using (auth.uid() = teacher_id);
