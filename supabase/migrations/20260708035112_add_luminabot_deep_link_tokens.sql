create table if not exists public.telegram_bot_connection_tokens (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  used_at timestamptz,
  used_by_telegram_user_id text,
  created_at timestamptz not null default now()
);

create index if not exists telegram_bot_connection_tokens_teacher_idx
  on public.telegram_bot_connection_tokens(teacher_id, created_at desc);

create index if not exists telegram_bot_connection_tokens_lookup_idx
  on public.telegram_bot_connection_tokens(token_hash, expires_at, used_at);

alter table public.telegram_bot_connection_tokens enable row level security;

drop policy if exists "telegram connect tokens teacher read" on public.telegram_bot_connection_tokens;
create policy "telegram connect tokens teacher read" on public.telegram_bot_connection_tokens
  for select to authenticated
  using ((select auth.uid()) = teacher_id);
