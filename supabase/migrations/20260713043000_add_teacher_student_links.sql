create table if not exists public.teacher_student_links (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  student_user_id uuid references public.profiles(id) on delete set null,
  subject text,
  price_per_class numeric(10,2),
  classes_per_week integer,
  status public.student_status not null default 'active',
  invite_id uuid,
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(teacher_id, student_id)
);

create table if not exists public.student_invites (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  student_id uuid references public.students(id) on delete set null,
  email text,
  subject text,
  price_per_class numeric(10,2),
  classes_per_week integer,
  token_hash text not null unique,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'cancelled', 'expired')),
  expires_at timestamptz not null,
  used_at timestamptz,
  used_by_student_id uuid references public.students(id) on delete set null,
  used_by_user_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.teacher_student_links enable row level security;
alter table public.student_invites enable row level security;

create index if not exists teacher_student_links_teacher_idx on public.teacher_student_links(teacher_id, status);
create index if not exists teacher_student_links_student_idx on public.teacher_student_links(student_id, status);
create index if not exists teacher_student_links_student_user_idx on public.teacher_student_links(student_user_id, status);
create index if not exists student_invites_teacher_idx on public.student_invites(teacher_id, created_at desc);
create index if not exists student_invites_token_lookup_idx on public.student_invites(token_hash, expires_at, used_at);

insert into public.teacher_student_links (
  teacher_id,
  student_id,
  student_user_id,
  subject,
  price_per_class,
  classes_per_week,
  status,
  accepted_at,
  created_at,
  updated_at
)
select
  teacher_id,
  id,
  user_id,
  subject,
  price_per_class,
  classes_per_week,
  status,
  created_at,
  created_at,
  updated_at
from public.students
on conflict (teacher_id, student_id) do update set
  student_user_id = excluded.student_user_id,
  subject = excluded.subject,
  price_per_class = excluded.price_per_class,
  classes_per_week = excluded.classes_per_week,
  status = excluded.status,
  updated_at = now();

drop policy if exists "teacher student links teacher or student read" on public.teacher_student_links;
create policy "teacher student links teacher or student read"
  on public.teacher_student_links
  for select
  to authenticated
  using ((select auth.uid()) = teacher_id or (select auth.uid()) = student_user_id);

drop policy if exists "student invites teacher read" on public.student_invites;
create policy "student invites teacher read"
  on public.student_invites
  for select
  to authenticated
  using ((select auth.uid()) = teacher_id);

drop policy if exists "student invites teacher insert" on public.student_invites;
create policy "student invites teacher insert"
  on public.student_invites
  for insert
  to authenticated
  with check ((select auth.uid()) = teacher_id);

drop policy if exists "student invites teacher update" on public.student_invites;
create policy "student invites teacher update"
  on public.student_invites
  for update
  to authenticated
  using ((select auth.uid()) = teacher_id)
  with check ((select auth.uid()) = teacher_id);
