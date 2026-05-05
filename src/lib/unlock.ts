import { supabase } from "@/lib/supabase";
import { awardXPByAppUserId, XP_SOURCES } from "@/lib/awardXP";
import { ALL_LESSONS } from "@/content/study-lessons";
import { XP_REWARDS } from "@/types";
import type { StudyLesson } from "@/types/study";

const UNLOCK_COMMENT = "Разблокировано куратором без сдачи домашки";

export type UnlockReason = "approved" | "created" | "conflict" | "error";
export interface UnlockOutcome {
  appUserId: string;
  lessonId: string;
  reason: UnlockReason;
  message?: string;
}

/**
 * Unlock a single lesson for one student. Idempotent: re-running on an
 * already-approved lesson just updates the row (XP via source_id stays unique).
 *
 * Pass `notify: false` for bulk operations to avoid spamming notifications —
 * one row per (student × lesson) per click would otherwise drown the bell.
 */
export async function unlockLessonForStudent(
  appUserId: string,
  lesson: StudyLesson,
  options: { notify?: boolean } = {},
): Promise<UnlockOutcome> {
  const { notify = true } = options;

  await supabase.upsertLessonProgress({
    user_id:        appUserId,
    lesson_id:      lesson.slug,
    video_done:     true,
    review_done:    true,
    practice_done:  true,
    practice_score: 100,
  });

  const existing = await supabase.getSubmissionByUserAndLesson(appUserId, lesson.slug);
  if (existing) {
    const result = await supabase.updateSubmission(
      existing.id, "approved", UNLOCK_COMMENT, existing.version ?? 1,
    );
    if (!result.ok && result.reason === "conflict") {
      return { appUserId, lessonId: lesson.slug, reason: "conflict" };
    }
  } else {
    await supabase.createSubmission({
      user_id:         appUserId,
      user_name:       "(разблокировано куратором)",
      lesson_id:       lesson.slug,
      // Match the homework_id convention used by /study/{slug}/homework page.
      homework_id:     `${lesson.slug}:homework`,
      lesson_title:    lesson.title,
      homework_title:  "Разблокировано вручную",
      content:         UNLOCK_COMMENT,
      submit_type:     "confirm",
      status:          "approved",
      curator_comment: UNLOCK_COMMENT,
    });
  }

  // XP via source_id is idempotent — re-runs on the same (user, lesson) won't double-award.
  await awardXPByAppUserId(
    appUserId,
    XP_SOURCES.homeworkApproved(lesson.slug),
    XP_REWARDS.HOMEWORK_APPROVED,
  );

  if (notify) {
    await supabase.createNotification({
      user_id:   appUserId,
      type:      "homework_approved",
      message:   `Куратор разблокировал урок «${lesson.title}» 🔓`,
      lesson_id: lesson.slug,
    });
  }

  return { appUserId, lessonId: lesson.slug, reason: existing ? "approved" : "created" };
}

/**
 * Returns lessons sorted by (module order in ALL_LESSONS, id) up to and
 * including the target slug. Used by "open lessons up to N" admin actions —
 * unlocks every previous lesson in the same module AND every lesson in
 * preceding modules so a student migrating in at module 2 / lesson 4 has
 * everything before that point marked complete.
 */
export function lessonsUpTo(targetSlug: string): StudyLesson[] {
  const targetIdx = ALL_LESSONS.findIndex((l) => l.slug === targetSlug);
  if (targetIdx === -1) return [];
  return ALL_LESSONS.slice(0, targetIdx + 1);
}

/**
 * Unlock every lesson up to (and including) `targetSlug` for one student.
 * Bulk operation: notifications are off by default. Per-lesson failures are
 * captured in the result so the caller can show a partial-success summary.
 */
export async function unlockUpToForStudent(
  appUserId: string,
  targetSlug: string,
  options: { notify?: boolean } = {},
): Promise<{ ok: number; conflict: number; error: number; outcomes: UnlockOutcome[] }> {
  const { notify = false } = options;
  const lessons = lessonsUpTo(targetSlug);
  const outcomes: UnlockOutcome[] = [];
  let ok = 0;
  let conflict = 0;
  let error = 0;

  for (const lesson of lessons) {
    try {
      const result = await unlockLessonForStudent(appUserId, lesson, { notify });
      outcomes.push(result);
      if (result.reason === "conflict") conflict++;
      else ok++;
    } catch (err) {
      error++;
      outcomes.push({
        appUserId,
        lessonId: lesson.slug,
        reason: "error",
        message: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return { ok, conflict, error, outcomes };
}
