alter table public.lesson_reports
  add column if not exists learning_progress text,
  add column if not exists next_lesson_suggestion text,
  add column if not exists guardian_message text,
  add column if not exists teacher_signature text,
  add column if not exists reviewed_at timestamptz;

update public.lesson_reports
set guardian_message = coalesce(guardian_message, parent_message)
where guardian_message is null;
