create table if not exists public.google_oauth_states (
  state text primary key,
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.google_calendar_connections (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null unique references public.profiles(id) on delete cascade,
  google_email text,
  access_token text not null,
  refresh_token text,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.google_calendar_events (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  class_schedule_id uuid not null unique references public.class_schedules(id) on delete cascade,
  google_event_id text not null,
  synced_at timestamptz not null default now()
);

alter table public.google_oauth_states enable row level security;
alter table public.google_calendar_connections enable row level security;
alter table public.google_calendar_events enable row level security;

drop policy if exists "google connections teacher read" on public.google_calendar_connections;
create policy "google connections teacher read" on public.google_calendar_connections for select using (auth.uid() = teacher_id);

drop policy if exists "google events teacher read" on public.google_calendar_events;
create policy "google events teacher read" on public.google_calendar_events for select using (auth.uid() = teacher_id);
