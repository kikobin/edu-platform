import { create } from "zustand";
import { storage } from "@/lib/storage";
import type { LessonProgress, HomeworkStatus, StepProgress } from "@/types";
import { ALL_LESSONS, getLessonsByModule } from "@/content/study-lessons";
import type { StudyLesson } from "@/types/study";

// ─── Helpers ──────────────────────────────────────────────────────────────────

// All study lessons in stable id-order. Used to compute "previous lesson in module".
const SORTED_LESSONS: StudyLesson[] = [...ALL_LESSONS].sort((a, b) => a.id - b.id);

function defaultProgress(lessonId: string): LessonProgress {
  return {
    lessonId,
    steps: {
      review:   { done: false, currentSlide: 0 },
      practice: { done: false, score: 0 },
      homework: { done: false },
    },
    reviewDone:    false,
    practiceDone:  false,
    practiceScore: 0,
    homeworkStatus: "not_started",
    currentSlide:  0,
  };
}

/**
 * Migrate a raw saved object to LessonProgress shape. The new study lessons
 * don't use the legacy review/practice/homework flat fields, but the type
 * still carries them for back-compat — we just keep them in sync where useful.
 */
function migrate(saved: Record<string, unknown>, lessonId: string): LessonProgress {
  const hasSteps =
    saved.steps !== null &&
    saved.steps !== undefined &&
    typeof saved.steps === "object";

  if (hasSteps) {
    return {
      ...defaultProgress(lessonId),
      ...(saved as Partial<LessonProgress>),
      lessonId,
    } as LessonProgress;
  }

  return {
    ...defaultProgress(lessonId),
    reviewDone:    Boolean(saved.reviewDone),
    practiceDone:  Boolean(saved.practiceDone),
    practiceScore: typeof saved.practiceScore === "number" ? saved.practiceScore : 0,
    homeworkStatus: (saved.homeworkStatus as HomeworkStatus) ?? "not_started",
    currentSlide:   typeof saved.currentSlide === "number" ? saved.currentSlide : 0,
  };
}

function saveProgress(userId: string, progress: Record<string, LessonProgress>) {
  storage.set(`progress_${userId}`, progress);
}

/** Find the previous lesson in the same module, or undefined if this is the first.
 *  Tier-aware: if the lesson is tier-tagged (e.g. ai-creator-7-vip), we
 *  navigate the module within that tier track so we don't accidentally point
 *  at the other tier's lesson. If the lesson is untagged, we pretend
 *  tier-tagged lessons in the same module don't exist. */
function previousLessonInModule(lessonId: string): StudyLesson | undefined {
  const lesson = SORTED_LESSONS.find((l) => l.id === lessonIdToNumeric(lessonId));
  if (!lesson) return undefined;
  const sameModule = getLessonsByModule(lesson.module, lesson.tier).sort((a, b) => a.id - b.id);
  const idx = sameModule.findIndex((l) => l.id === lesson.id);
  return idx > 0 ? sameModule[idx - 1] : undefined;
}

/** Lesson slug ("lesson-1") → numeric id (1) — used to look up StudyLesson rows. */
function lessonIdToNumeric(slug: string): number | null {
  const lesson = ALL_LESSONS.find((l) => l.slug === slug);
  return lesson?.id ?? null;
}

// ─── Store interface ──────────────────────────────────────────────────────────

interface ServerLessonRow {
  lessonId: string;
  videoDone: boolean;
  reviewDone: boolean;
  practiceDone: boolean;
  practiceScore: number;
  homeworkDone: boolean;
  /** Supabase submission status — null means no submission yet */
  homeworkStatus?: "pending" | "approved" | "revision" | null;
}

interface ProgressState {
  progress: Record<string, LessonProgress>;
  userId: string;

  initFromStorage: (userId: string) => void;
  /**
   * Forward-only merge of server-side lesson progress.
   * A step that is done on the server will be marked done locally even if
   * localStorage was behind. A locally-done step is never rolled back.
   */
  mergeServerProgress: (rows: ServerLessonRow[]) => void;
  getLesson: (lessonId: string) => LessonProgress;
  /** Whether the next lesson in the module unlocks (curator approval gate). */
  isLessonUnlocked: (lessonSlug: string) => boolean;
  /** Whether all the lesson's steps (review/practice/homework) are done. */
  isLessonCompleted: (lessonSlug: string) => boolean;
  resetAll: () => void;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useProgressStore = create<ProgressState>((set, get) => ({
  progress: {},
  userId: "",

  initFromStorage: (userId) => {
    const saved =
      storage.get<Record<string, Record<string, unknown>>>(`progress_${userId}`) ?? {};
    const merged: Record<string, LessonProgress> = {};

    SORTED_LESSONS.forEach((l) => {
      const raw = saved[l.slug];
      merged[l.slug] = raw ? migrate(raw, l.slug) : defaultProgress(l.slug);
    });

    set({ progress: merged, userId });
  },

  mergeServerProgress: (rows) => {
    if (!rows.length) return;
    const progress = { ...get().progress };
    let changed = false;

    for (const row of rows) {
      const local = progress[row.lessonId] ?? defaultProgress(row.lessonId);

      const reviewDone    = local.reviewDone    || row.reviewDone;
      const practiceDone  = local.practiceDone  || row.practiceDone;
      const practiceScore = Math.max(local.practiceScore, row.practiceScore);

      const serverHwStatus = row.homeworkStatus ?? null;
      let newHomeworkStatus: HomeworkStatus = local.homeworkStatus;
      if (serverHwStatus === "approved") {
        newHomeworkStatus = "approved";
      } else if (serverHwStatus === "revision" && local.homeworkStatus !== "in_progress") {
        newHomeworkStatus = "revision";
      } else if (serverHwStatus === "pending" || (row.homeworkDone && newHomeworkStatus === "not_started")) {
        newHomeworkStatus = "submitted";
      }

      const didChange =
        reviewDone    !== local.reviewDone    ||
        practiceDone  !== local.practiceDone  ||
        practiceScore >  local.practiceScore  ||
        newHomeworkStatus !== local.homeworkStatus;

      if (!didChange) continue;
      changed = true;

      const steps: Record<string, StepProgress> = { ...local.steps };
      if (reviewDone)   steps["review"]   = { ...(steps["review"]   ?? {}), done: true };
      if (practiceDone) steps["practice"] = { ...(steps["practice"] ?? {}), done: true, score: practiceScore };

      progress[row.lessonId] = {
        ...local,
        steps,
        reviewDone,
        practiceDone,
        practiceScore,
        homeworkStatus: newHomeworkStatus,
      };
    }

    if (changed) {
      saveProgress(get().userId, progress);
      set({ progress });
    }
  },

  getLesson: (lessonId) => {
    return get().progress[lessonId] ?? defaultProgress(lessonId);
  },

  isLessonUnlocked: (lessonSlug) => {
    const prev = previousLessonInModule(lessonSlug);
    if (!prev) return true; // first lesson in module always unlocked
    const prevProgress = get().getLesson(prev.slug);
    return prevProgress.homeworkStatus === "approved";
  },

  isLessonCompleted: (lessonSlug) => {
    const p = get().getLesson(lessonSlug);
    return p.reviewDone && p.practiceDone && p.homeworkStatus === "approved";
  },

  resetAll: () => {
    const progress: Record<string, LessonProgress> = {};
    SORTED_LESSONS.forEach((l) => {
      progress[l.slug] = defaultProgress(l.slug);
    });
    saveProgress(get().userId, progress);
    set({ progress });
  },
}));
