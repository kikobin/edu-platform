-- Migration: monotonic lesson_progress upsert function
-- Prevents stale client writes from rolling back progress that was already recorded.
-- A boolean step that is TRUE in the DB can never be set back to FALSE via this function.
-- practice_score only improves (GREATEST).
--
-- Run this in Supabase SQL Editor.

create or replace function upsert_lesson_progress_monotonic(
  p_user_id       text,
  p_lesson_id     text,
  p_video_done    boolean,
  p_review_done   boolean,
  p_practice_done boolean,
  p_practice_score int
) returns void
language plpgsql
security definer
as $$
begin
  insert into lesson_progress (
    user_id, lesson_id,
    video_done, review_done, practice_done, practice_score,
    updated_at
  ) values (
    p_user_id, p_lesson_id,
    p_video_done, p_review_done, p_practice_done, p_practice_score,
    now()
  )
  on conflict (user_id, lesson_id) do update set
    video_done    = lesson_progress.video_done    OR excluded.video_done,
    review_done   = lesson_progress.review_done   OR excluded.review_done,
    practice_done = lesson_progress.practice_done OR excluded.practice_done,
    practice_score = GREATEST(lesson_progress.practice_score, excluded.practice_score),
    updated_at    = now();
end;
$$;

-- Grant execute to the anon role so the REST API can call it.
-- (The service key bypasses RLS and can always call security-definer functions.)
grant execute on function upsert_lesson_progress_monotonic(text,text,boolean,boolean,boolean,int)
  to anon, authenticated, service_role;
