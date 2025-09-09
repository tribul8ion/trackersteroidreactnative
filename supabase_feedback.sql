-- Таблица обратной связи для Steroid Tracker
create table if not exists feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  message text not null,
  created_at timestamptz default now()
);
create index if not exists feedback_user_id_idx on feedback(user_id); 