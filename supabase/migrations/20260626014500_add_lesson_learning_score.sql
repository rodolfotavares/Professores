alter table public.lesson_reports
  add column if not exists learning_score integer,
  add column if not exists detected_doubts text,
  add column if not exists learning_evidence text;
