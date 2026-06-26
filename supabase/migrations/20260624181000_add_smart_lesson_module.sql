alter table public.class_schedules
  add column if not exists started_at timestamptz,
  add column if not exists finished_at timestamptz,
  add column if not exists actual_duration_minutes integer,
  add column if not exists teacher_present boolean not null default false,
  add column if not exists smart_status text not null default 'not_started',
  add column if not exists meeting_provider text,
  add column if not exists meeting_url text,
  add column if not exists external_meeting_id text;

create table if not exists public.lesson_reports (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.class_schedules(id) on delete cascade,
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  student_user_id uuid references public.profiles(id) on delete set null,
  title text not null default 'Relatório da aula',
  summary text,
  taught_content text,
  student_questions text,
  reinforcement_points text,
  exercises_done text,
  homework text,
  next_recommendation text,
  parent_message text,
  raw_transcript text,
  status text not null default 'DRAFT' check (status in ('DRAFT', 'APPROVED', 'PUBLISHED', 'ARCHIVED')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz
);

create index if not exists lesson_reports_teacher_status_idx on public.lesson_reports(teacher_id, status);
create index if not exists lesson_reports_student_status_idx on public.lesson_reports(student_id, status);
create index if not exists lesson_reports_lesson_idx on public.lesson_reports(lesson_id);

alter table public.lesson_reports enable row level security;

drop policy if exists "lesson reports teacher read" on public.lesson_reports;
drop policy if exists "lesson reports student published read" on public.lesson_reports;

create policy "lesson reports teacher read" on public.lesson_reports
  for select using (auth.uid() = teacher_id);

create policy "lesson reports student published read" on public.lesson_reports
  for select using (auth.uid() = student_user_id and status = 'PUBLISHED');
