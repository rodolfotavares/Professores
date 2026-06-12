create extension if not exists pgcrypto;

create type public.app_role as enum ('teacher', 'student', 'admin');
create type public.student_status as enum ('active', 'paused', 'inactive');
create type public.class_status as enum ('scheduled', 'completed', 'cancelled', 'absence');
create type public.activity_status as enum ('pending', 'submitted', 'corrected', 'expired');
create type public.message_sender_role as enum ('teacher', 'student');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.app_role not null,
  full_name text not null,
  whatsapp text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.teacher_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  access_code text not null unique,
  subjects text,
  default_price_per_class numeric(10,2) not null default 100,
  created_at timestamptz not null default now()
);

create table public.students (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  user_id uuid unique references public.profiles(id) on delete set null,
  full_name text not null,
  email text not null,
  whatsapp text,
  subject text,
  school_year text,
  age integer,
  days_of_week integer[] not null default '{}',
  class_time time,
  duration_minutes integer not null default 60,
  classes_per_month integer,
  price_per_class numeric(10,2) not null default 100,
  status public.student_status not null default 'active',
  notes text,
  start_date date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.class_schedules (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  student_user_id uuid references public.profiles(id) on delete set null,
  subject text,
  class_date date not null,
  class_time time not null,
  duration_minutes integer not null default 60,
  status public.class_status not null default 'scheduled',
  student_confirmed boolean not null default false,
  teacher_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.activities (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  student_id uuid references public.students(id) on delete cascade,
  student_user_id uuid references public.profiles(id) on delete set null,
  title text not null,
  description text not null,
  subject text,
  due_date date,
  points numeric(10,2) not null default 10,
  file_url text,
  visible_to_student boolean not null default true,
  status public.activity_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.activity_submissions (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null references public.activities(id) on delete cascade,
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  student_user_id uuid references public.profiles(id) on delete set null,
  answer_text text,
  answer_file_url text,
  submitted_at timestamptz not null default now(),
  is_late boolean not null default false,
  grade numeric(4,2),
  feedback text,
  correction_file_url text,
  status public.activity_status not null default 'submitted',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(activity_id, student_id)
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  sender_role public.message_sender_role not null,
  text text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  student_user_id uuid references public.profiles(id) on delete set null,
  month_reference text not null,
  amount numeric(10,2) not null,
  paid_amount numeric(10,2) not null default 0,
  status text not null default 'pending',
  due_date date,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  message text not null,
  type text not null,
  link text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index students_teacher_id_idx on public.students(teacher_id);
create index students_user_id_idx on public.students(user_id);
create index class_schedules_teacher_student_idx on public.class_schedules(teacher_id, student_id);
create index activities_teacher_student_idx on public.activities(teacher_id, student_id);
create index activity_submissions_teacher_student_idx on public.activity_submissions(teacher_id, student_id);
create index messages_teacher_student_idx on public.messages(teacher_id, student_id);

alter table public.profiles enable row level security;
alter table public.teacher_profiles enable row level security;
alter table public.students enable row level security;
alter table public.class_schedules enable row level security;
alter table public.activities enable row level security;
alter table public.activity_submissions enable row level security;
alter table public.messages enable row level security;
alter table public.payments enable row level security;
alter table public.notifications enable row level security;

create policy "profiles own read" on public.profiles for select using (auth.uid() = id);
create policy "profiles own update" on public.profiles for update using (auth.uid() = id);

create policy "teacher own profile" on public.teacher_profiles for select using (auth.uid() = user_id);
create policy "students teacher or linked user read" on public.students for select using (auth.uid() = teacher_id or auth.uid() = user_id);
create policy "classes teacher or student read" on public.class_schedules for select using (auth.uid() = teacher_id or auth.uid() = student_user_id);
create policy "activities teacher or student read" on public.activities for select using (auth.uid() = teacher_id or auth.uid() = student_user_id);
create policy "submissions teacher or student read" on public.activity_submissions for select using (auth.uid() = teacher_id or auth.uid() = student_user_id);
create policy "messages teacher or sender read" on public.messages for select using (auth.uid() = teacher_id or auth.uid() = sender_id);
create policy "payments teacher or student read" on public.payments for select using (auth.uid() = teacher_id or auth.uid() = student_user_id);
create policy "notifications own read" on public.notifications for select using (auth.uid() = user_id);
