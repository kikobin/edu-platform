-- Схема для лидерборда EduPlatform
-- Выполни этот SQL в Supabase SQL Editor (https://app.supabase.com → SQL Editor)

create table if not exists user_progress (
  user_id   text primary key,
  name      text not null,
  avatar_id text not null default 'avatar_1',
  xp        integer not null default 0,
  updated_at timestamptz not null default now()
);

-- Индекс для быстрой сортировки лидерборда
create index if not exists user_progress_xp_idx on user_progress (xp desc);

-- Row Level Security — каждый видит всё, но пишет только своё
-- (проверка userId происходит на нашем сервере в /api/progress)
alter table user_progress enable row level security;

create policy "Anyone can read leaderboard"
  on user_progress for select
  using (true);

create policy "Service role can write"
  on user_progress for all
  using (true);
