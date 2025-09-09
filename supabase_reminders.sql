-- Таблица напоминаний для Steroid Tracker
create table if not exists reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  title text not null,
  date timestamptz not null,
  created_at timestamptz default now(),
  is_done boolean default false
);
create index if not exists reminders_user_id_idx on reminders(user_id); 