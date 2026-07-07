create table if not exists public.telegram_bot_connections (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null unique references public.profiles(id) on delete cascade,
  telegram_user_id text unique,
  telegram_username text,
  telegram_first_name text,
  telegram_chat_id text,
  connection_code text not null unique,
  code_expires_at timestamptz not null,
  pending_action jsonb,
  connected_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.telegram_bot_interaction_logs (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid references public.profiles(id) on delete set null,
  telegram_user_id text,
  telegram_chat_id text,
  direction text not null check (direction in ('inbound', 'outbound')),
  message text,
  intent text,
  status text not null default 'ok',
  metadata jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.bot_student_notes (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  note text not null,
  source text not null default 'telegram',
  created_at timestamptz not null default now()
);

create index if not exists telegram_bot_connections_teacher_idx on public.telegram_bot_connections(teacher_id);
create index if not exists telegram_bot_connections_telegram_user_idx on public.telegram_bot_connections(telegram_user_id);
create index if not exists telegram_bot_logs_teacher_idx on public.telegram_bot_interaction_logs(teacher_id, created_at desc);
create index if not exists bot_student_notes_teacher_student_idx on public.bot_student_notes(teacher_id, student_id);

alter table public.telegram_bot_connections enable row level security;
alter table public.telegram_bot_interaction_logs enable row level security;
alter table public.bot_student_notes enable row level security;

drop policy if exists "telegram connections teacher read" on public.telegram_bot_connections;
create policy "telegram connections teacher read" on public.telegram_bot_connections
  for select to authenticated
  using ((select auth.uid()) = teacher_id);

drop policy if exists "telegram logs teacher read" on public.telegram_bot_interaction_logs;
create policy "telegram logs teacher read" on public.telegram_bot_interaction_logs
  for select to authenticated
  using ((select auth.uid()) = teacher_id);

drop policy if exists "bot notes teacher read" on public.bot_student_notes;
create policy "bot notes teacher read" on public.bot_student_notes
  for select to authenticated
  using ((select auth.uid()) = teacher_id);
