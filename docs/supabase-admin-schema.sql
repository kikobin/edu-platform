-- Admin panel schema for edu-platform
-- Run this in Supabase SQL Editor after supabase-schema.sql

-- Submissions table (homework submissions from students)
create table if not exists submissions (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  user_name text not null,
  lesson_id text not null,
  homework_id text not null,
  lesson_title text not null,
  homework_title text not null,
  content text not null default '',
  submit_type text not null default 'confirm',
  status text not null default 'pending',
  curator_comment text,
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz,
  version integer not null default 1  -- incremented on resubmission
);
alter table submissions enable row level security;
create policy "Allow all for anon" on submissions for all using (true) with check (true);

-- Curator-student assignments
create table if not exists curator_students (
  curator_id text not null,
  student_id text not null,
  primary key (curator_id, student_id)
);

-- Lesson progress per student (video / review / practice steps)
create table if not exists lesson_progress (
  user_id text not null,
  lesson_id text not null,
  video_done boolean not null default false,
  review_done boolean not null default false,
  practice_done boolean not null default false,
  practice_score int not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, lesson_id)
);
alter table lesson_progress enable row level security;
create policy "Allow all for anon" on lesson_progress for all using (true) with check (true);

-- Notifications for students (homework reviewed by curator)
create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  type text not null, -- 'homework_approved' | 'homework_revision'
  message text not null,
  lesson_id text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);
alter table notifications enable row level security;
create policy "Allow all for anon" on notifications for all using (true) with check (true);

-- Indexes for performance
create index if not exists submissions_status_idx on submissions(status);
create index if not exists submissions_user_idx on submissions(user_id);
create index if not exists submissions_user_lesson_idx on submissions(user_id, lesson_id);
create index if not exists lesson_progress_user_idx on lesson_progress(user_id);
create index if not exists notifications_user_idx on notifications(user_id);

-- If submissions table already exists, add version column:
alter table submissions add column if not exists version integer not null default 1;
