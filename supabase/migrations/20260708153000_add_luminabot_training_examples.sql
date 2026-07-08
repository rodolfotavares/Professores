create table if not exists public.luminabot_training_examples (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references auth.users(id) on delete cascade,
  phrase text not null,
  normalized_phrase text not null,
  intent text not null,
  entities jsonb not null default '{}'::jsonb,
  confidence numeric(4, 3) not null default 0.900,
  source text not null default 'local_rules',
  status text not null default 'pending_review',
  usage_count integer not null default 0,
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint luminabot_training_examples_status_check check (status in ('auto', 'pending_review', 'approved', 'rejected')),
  constraint luminabot_training_examples_confidence_check check (confidence >= 0 and confidence <= 1)
);

create unique index if not exists luminabot_training_examples_teacher_phrase_idx
  on public.luminabot_training_examples (teacher_id, normalized_phrase);

create index if not exists luminabot_training_examples_teacher_status_idx
  on public.luminabot_training_examples (teacher_id, status, updated_at desc);

alter table public.luminabot_training_examples enable row level security;

drop policy if exists "Teachers can read own LumiBot examples" on public.luminabot_training_examples;
create policy "Teachers can read own LumiBot examples"
  on public.luminabot_training_examples
  for select
  to authenticated
  using ((select auth.uid()) = teacher_id);

drop policy if exists "Teachers can update own LumiBot examples" on public.luminabot_training_examples;
create policy "Teachers can update own LumiBot examples"
  on public.luminabot_training_examples
  for update
  to authenticated
  using ((select auth.uid()) = teacher_id)
  with check ((select auth.uid()) = teacher_id);
