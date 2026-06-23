alter table public.teacher_profiles
  add column if not exists subscription_exempt boolean not null default false;

update public.teacher_profiles
set subscription_exempt = true
where subscription_exempt = false;
