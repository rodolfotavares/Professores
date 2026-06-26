alter table public.class_schedules
  add column if not exists meeting_start_url text;

create table if not exists public.zoom_oauth_states (
  state text primary key,
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.zoom_connections (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null unique references public.profiles(id) on delete cascade,
  zoom_user_id text,
  zoom_email text,
  access_token text not null,
  refresh_token text,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.zoom_oauth_states enable row level security;
alter table public.zoom_connections enable row level security;

create index if not exists zoom_oauth_states_teacher_idx on public.zoom_oauth_states(teacher_id);
create index if not exists zoom_connections_teacher_idx on public.zoom_connections(teacher_id);
