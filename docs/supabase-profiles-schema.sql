-- Profiles + XP schema for edu-platform
-- Run this in Supabase SQL Editor BEFORE running supabase-admin-schema.sql
-- If profiles table already exists, run the ALTER TABLE section at the bottom.

-- ── Profiles ──────────────────────────────────────────────────────────────────
create table if not exists profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  app_user_id     text unique not null,  -- legacy "student-1", "curator-1"
  name            text not null,
  avatar_id       text not null default 'avatar_1',
  title_id        text,
  frame_id        text,
  role            text not null default 'student',
  tier            text not null default 'smart',
  xp              integer not null default 0,
  streak          integer not null default 1,      -- updated by GET /api/me on each visit
  last_visit_date date,                             -- used to compute streak server-side
  updated_at      timestamptz not null default now()
);

-- RLS: anon can read all profiles (leaderboard), only service role writes
alter table profiles enable row level security;

create policy "Anyone can read profiles"
  on profiles for select
  using (true);

-- Service role key (used by our API) bypasses RLS automatically.
-- No explicit write policy needed — server always uses service key for writes.

-- Index for fast leaderboard queries
create index if not exists profiles_xp_idx on profiles(xp desc);
create index if not exists profiles_role_idx on profiles(role);
create index if not exists profiles_app_user_id_idx on profiles(app_user_id);

-- ── XP Events ─────────────────────────────────────────────────────────────────
create table if not exists xp_events (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references profiles(id) on delete cascade,
  source_id  text not null,
  amount     integer not null,
  created_at timestamptz not null default now(),
  unique (user_id, source_id)  -- idempotency: same action = same source_id, awarded once
);

alter table xp_events enable row level security;

-- Only service role writes XP events (our API validates before inserting)
create policy "Anyone can read xp_events"
  on xp_events for select
  using (true);

create index if not exists xp_events_user_idx on xp_events(user_id);

-- ── Purchases ─────────────────────────────────────────────────────────────────
-- Records items bought from the shop. XP deduction is handled via a negative
-- xp_event with source_id = 'shop:purchase:{item_id}' (idempotent).
create table if not exists purchases (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references profiles(id) on delete cascade,
  app_user_id  text not null,  -- denormalized for fast lookup by app_user_id
  item_id      text not null,
  purchased_at timestamptz not null default now(),
  unique (user_id, item_id)
);

alter table purchases enable row level security;

create policy "Anyone can read purchases"
  on purchases for select
  using (true);

create index if not exists purchases_user_idx on purchases(user_id);
create index if not exists purchases_app_user_idx on purchases(app_user_id);

-- ── If profiles table ALREADY EXISTS — run these to add missing columns ───────
alter table profiles add column if not exists title_id text;
alter table profiles add column if not exists frame_id text;
alter table profiles add column if not exists app_user_id text;
alter table profiles add column if not exists role text not null default 'student';
alter table profiles add column if not exists tier text not null default 'smart';
alter table profiles alter column tier set default 'smart';
update profiles set tier = 'smart'
where role = 'student' and (tier is null or tier in ('base', 'basic'));
alter table profiles add column if not exists streak integer not null default 1;
alter table profiles add column if not exists last_visit_date date;
-- Add unique constraint on app_user_id if missing:
-- alter table profiles add constraint profiles_app_user_id_key unique (app_user_id);
