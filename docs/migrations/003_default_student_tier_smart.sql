-- Make smart the default tier for students and normalize older rows.
-- Run this in Supabase SQL Editor.

alter table profiles add column if not exists tier text not null default 'smart';
alter table profiles alter column tier set default 'smart';

update profiles
set tier = 'smart'
where role = 'student'
  and (tier is null or tier in ('base', 'basic'));
