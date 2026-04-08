import { create } from "zustand";
import { storage } from "@/lib/storage";
import { emit } from "@/lib/events";
import type { LessonProgress, HomeworkStatus, StepProgress } from "@/types";
import { XP_REWARDS } from "@/types";
import { lessons } from "@/data/lessons";

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Computed once at module load — lessons is a static import and never mutates.
const SORTED_LESSONS = [...lessons].sort((a, b) => a.order - b.order);

/** Build empty StepProgress records from a lesson's step config. */
function defaultSteps(lessonId: string): Record<string, StepProgress> {
  const lesson = SORTED_LESSONS.find((l) => l.id === lessonId);
  const steps: Record<string, StepProgress> = {};
  for (const stepDef of lesson?.steps ?? []) {
    if (stepDef.type === "content" || stepDef.type === "video") {
      steps[stepDef.id] = { done: false, currentSlide: 0 };
    } else if (stepDef.type === "quiz" || stepDef.type === "checkpoint") {
      steps[stepDef.id] = { done: false, score: 0 };
    } else {
      steps[stepDef.id] = { done: false };
    }
  }
  return steps;
}

function defaultProgress(lessonId: string): LessonProgress {
  return {
    lessonId,
    steps: defaultSteps(lessonId),
    // Legacy flat fields — kept so existing step pages keep working without changes
    reviewDone: false,
    practiceDone: false,
    practiceScore: 0,
    homeworkStatus: "not_started",
    currentSlide: 0,
  };
}

/**
 * Migrate from the old flat-field format to the new `steps` Record.
 * If the saved object already has a valid `steps` object, it is returned as-is.
 */
function migrate(saved: Record<string, unknown>, lessonId: string): LessonProgress {
  const haSteps =
    saved.steps !== null &&
    saved.steps !== undefined &&
    typeof saved.steps === "object";

  // Already new format
  if (haSteps) {
    return {
      ...defaultProgress(lessonId),
      ...(saved as Partial<LessonProgress>),
      lessonId,
    } as LessonProgress;
  }

  // Build steps from legacy flat fields
  const steps: Record<string, StepProgress> = {};
  const lesson = SORTED_LESSONS.find((l) => l.id === lessonId);
  for (const stepDef of lesson?.steps ?? []) {
    if (stepDef.id === "review") {
      steps["review"] = {
        done: Boolean(saved.reviewDone),
        currentSlide: typeof saved.currentSlide === "number" ? saved.currentSlide : 0,
      };
    } else if (stepDef.id === "practice") {
      steps["practice"] = {
        done: Boolean(saved.practiceDone),
        score: typeof saved.practiceScore === "number" ? saved.practiceScore : 0,
      };
    } else if (stepDef.id === "homework") {
      const hs = saved.homeworkStatus as string;
      steps["homework"] = { done: hs === "submitted" || hs === "approved" || hs === "revision" };
    } else {
      steps[stepDef.id] = { done: false };
    }
  }

  return {
    lessonId,
    steps,
    reviewDone: Boolean(saved.reviewDone),
    practiceDone: Boolean(saved.practiceDone),
    practiceScore: typeof saved.practiceScore === "number" ? saved.practiceScore : 0,
    homeworkStatus: (saved.homeworkStatus as HomeworkStatus) ?? "not_started",
    currentSlide: typeof saved.currentSlide === "number" ? saved.currentSlide : 0,
  };
}

function saveProgress(userId: string, progress: Record<string, LessonProgress>) {
  storage.set(`progress_${userId}`, progress);
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
  /** Generic step-id unlock check. Falls back to legacy order for unknown ids. */
  isStepUnlocked: (lessonId: string, stepId: string) => boolean;
  isLessonUnlocked: (lessonId: string) => boolean;
  isLessonCompleted: (lessonId: string) => boolean;
  markReviewDone: (lessonId: string) => boolean;
  markPracticeDone: (lessonId: string, score: number) => boolean;
  markHomeworkSubmitted: (lessonId: string) => boolean;
  /**
   * Generic step completion for video / checkpoint / project step types.
   * Idempotent: returns false if already done.
   */
  markStepDone: (lessonId: string, stepId: string, score?: number) => boolean;
  resetReview: (lessonId: string) => void;
  resetPractice: (lessonId: string) => void;
  resetHomework: (lessonId: string) => void;
  resetAll: () => void;
  setCurrentSlide: (lessonId: string, slide: number) => void;
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
      const raw = saved[l.id];
      merged[l.id] = raw ? migrate(raw, l.id) : defaultProgress(l.id);
    });

    set({ progress: merged, userId });

    // Retroactive sync — deferred to idle so it doesn't compete with the initial render.
    const stepsToSync = Object.values(merged).filter(
      (lp) => lp.steps["video"]?.done || lp.reviewDone || lp.practiceDone,
    );
    if (stepsToSync.length > 0) {
      const runSync = () => {
        stepsToSync.forEach((lp) => {
          fetch("/api/progress/lesson", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId,
              lessonId: lp.lessonId,
              videoDone: lp.steps["video"]?.done ?? false,
              reviewDone: lp.reviewDone,
              practiceDone: lp.practiceDone,
              practiceScore: lp.practiceScore,
            }),
          }).catch(() => {});
        });
      };
      if (typeof requestIdleCallback !== "undefined") {
        requestIdleCallback(runSync, { timeout: 5000 });
      } else {
        setTimeout(runSync, 3000);
      }
    }
  },

  mergeServerProgress: (rows) => {
    if (!rows.length) return;
    const progress = { ...get().progress };
    let changed = false;

    for (const row of rows) {
      const local = progress[row.lessonId] ?? defaultProgress(row.lessonId);

      // Forward-only: OR local with server for each boolean field
      const videoDone     = (local.steps["video"]?.done ?? false) || row.videoDone;
      const reviewDone    = local.reviewDone    || row.reviewDone;
      const practiceDone  = local.practiceDone  || row.practiceDone;
      const homeworkDone  = (local.homeworkStatus !== "not_started" && local.homeworkStatus !== "in_progress") || row.homeworkDone;
      const practiceScore = Math.max(local.practiceScore, row.practiceScore);

      // Derive the richest homework status from server + local
      // Priority: approved > revision > submitted > local
      const serverHwStatus = row.homeworkStatus ?? null;
      let newHomeworkStatus: HomeworkStatus = local.homeworkStatus;
      if (serverHwStatus === "approved") {
        newHomeworkStatus = "approved";
      } else if (serverHwStatus === "revision" && local.homeworkStatus !== "in_progress") {
        // Guard: if the student clicked "Сдать заново" (local = "in_progress"), do NOT
        // revert them back to the revision screen — they are actively resubmitting.
        newHomeworkStatus = "revision";
      } else if (serverHwStatus === "pending" || (homeworkDone && newHomeworkStatus === "not_started")) {
        newHomeworkStatus = "submitted";
      }

      const didChange =
        videoDone     !== (local.steps["video"]?.done ?? false) ||
        reviewDone    !== local.reviewDone    ||
        practiceDone  !== local.practiceDone  ||
        homeworkDone  !== (local.homeworkStatus !== "not_started" && local.homeworkStatus !== "in_progress") ||
        practiceScore >  local.practiceScore  ||
        newHomeworkStatus !== local.homeworkStatus;

      if (!didChange) continue;
      changed = true;

      const steps = { ...local.steps };
      if (videoDone)    steps["video"]    = { ...(steps["video"]    ?? {}), done: true };
      if (reviewDone)   steps["review"]   = { ...(steps["review"]   ?? {}), done: true };
      if (practiceDone) steps["practice"] = { ...(steps["practice"] ?? {}), done: true, score: practiceScore };
      if (homeworkDone) steps["homework"] = { ...(steps["homework"] ?? {}), done: true };

      progress[row.lessonId] = {
        ...local,
        steps,
        reviewDone,
        practiceDone,
        practiceScore,
        homeworkStatus: newHomeworkStatus,
      };

      // XP for server-discovered completions is already reconciled by reconcileXP()
      // in useSession (forward-only server→local sync). Emitting step events here
      // would fire XP popups for every historical step on first cross-device login,
      // causing popup spam without awarding additional XP (ledger deduplicates).
    }

    if (changed) {
      saveProgress(get().userId, progress);
      set({ progress });
    }
  },

  getLesson: (lessonId) => {
    return get().progress[lessonId] ?? defaultProgress(lessonId);
  },

  isLessonUnlocked: (lessonId) => {
    const lesson = SORTED_LESSONS.find((l) => l.id === lessonId);
    if (!lesson) return false;
    const first = SORTED_LESSONS[0];
    if (first?.id === lessonId) return true;
    const prev = SORTED_LESSONS.filter((l) => l.order < lesson.order).at(-1);
    if (!prev) return true;
    // Next lesson unlocks only after curator approves previous homework
    const prevProgress = get().getLesson(prev.id);
    return prevProgress.homeworkStatus === "approved";
  },

  isLessonCompleted: (lessonId) => {
    const lesson = SORTED_LESSONS.find((l) => l.id === lessonId);
    const p = get().getLesson(lessonId);

    // Step-config-aware: every configured step must be done
    if (lesson && lesson.steps.length > 0) {
      return lesson.steps.every((stepDef) => p.steps[stepDef.id]?.done === true);
    }

    // Legacy fallback (no step config)
    return p.reviewDone && p.practiceDone && p.homeworkStatus === "submitted";
  },

  isStepUnlocked: (lessonId, stepId) => {
    const lesson = SORTED_LESSONS.find((l) => l.id === lessonId);
    const p = get().getLesson(lessonId);

    // Step-config-aware unlock: each step requires the previous step to be done
    if (lesson && lesson.steps.length > 0) {
      const stepIdx = lesson.steps.findIndex((s) => s.id === stepId);
      if (stepIdx <= 0) return true; // first step always unlocked
      const prevDef = lesson.steps[stepIdx - 1];
      return prevDef ? (p.steps[prevDef.id]?.done ?? false) : true;
    }

    // Legacy fallback
    if (stepId === "review") return true;
    if (stepId === "practice") return p.reviewDone;
    if (stepId === "homework") return p.practiceDone;
    return false;
  },

  markReviewDone: (lessonId) => {
    const lesson = get().getLesson(lessonId);
    if (lesson.reviewDone) return false;

    const steps = { ...lesson.steps };
    steps["review"] = { ...steps["review"], done: true };

    const progress = { ...get().progress };
    progress[lessonId] = { ...lesson, reviewDone: true, steps };
    saveProgress(get().userId, progress);
    set({ progress });

    const userId = get().userId;
    if (userId) {
      fetch("/api/progress/lesson", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          lessonId,
          reviewDone: true,
          practiceDone: lesson.practiceDone,
          practiceScore: lesson.practiceScore,
        }),
      }).catch(() => {});
    }

    emit("lesson:step:completed", {
      lessonId,
      stepId: "review",
      xpReward: XP_REWARDS.REVIEW_DONE,
    });

    // Check if this completed the whole lesson
    if (get().isLessonCompleted(lessonId)) {
      emit("lesson:completed", { lessonId });
    }

    return true;
  },

  markPracticeDone: (lessonId, score) => {
    const lesson = get().getLesson(lessonId);
    if (lesson.practiceDone) return false;

    const steps = { ...lesson.steps };
    steps["practice"] = { ...steps["practice"], done: true, score };

    const progress = { ...get().progress };
    progress[lessonId] = { ...lesson, practiceDone: true, practiceScore: score, steps };
    saveProgress(get().userId, progress);
    set({ progress });

    const userId = get().userId;
    if (userId) {
      fetch("/api/progress/lesson", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          lessonId,
          reviewDone: lesson.reviewDone,
          practiceDone: true,
          practiceScore: score,
        }),
      }).catch(() => {});
    }

    emit("lesson:step:completed", {
      lessonId,
      stepId:         "practice",
      xpReward:       XP_REWARDS.PRACTICE_DONE,
      score,
      bonusEligible:  score >= 80,
    });

    if (get().isLessonCompleted(lessonId)) {
      emit("lesson:completed", { lessonId });
    }

    return true;
  },

  markHomeworkSubmitted: (lessonId) => {
    const lesson = get().getLesson(lessonId);
    if (lesson.homeworkStatus === "submitted") return false;

    const steps = { ...lesson.steps };
    steps["homework"] = { ...steps["homework"], done: true };

    const progress = { ...get().progress };
    progress[lessonId] = {
      ...lesson,
      homeworkStatus: "submitted" as HomeworkStatus,
      steps,
    };
    saveProgress(get().userId, progress);
    set({ progress });

    // Homework page handles its own XP (includes deadline-sensitive bonus).
    // Emit a generic step:completed so external subscribers (analytics, achievements)
    // can react without depending on the homework page's deadline logic.
    emit("lesson:step:completed", {
      lessonId,
      stepId:    "homework",
      xpReward:  XP_REWARDS.HOMEWORK_DONE,
    });

    if (get().isLessonCompleted(lessonId)) {
      emit("lesson:completed", { lessonId });
    }

    return true;
  },

  resetReview: (lessonId) => {
    const lesson = get().getLesson(lessonId);
    // Reset every step (review is the gate — resetting it cascades all downstream)
    const steps: Record<string, StepProgress> = {};
    for (const key of Object.keys(lesson.steps)) {
      if (key === "review")    steps[key] = { done: false, currentSlide: 0 };
      else if (key === "practice") steps[key] = { done: false, score: 0 };
      else                    steps[key] = { done: false };
    }

    const progress = { ...get().progress };
    progress[lessonId] = {
      ...lesson,
      steps,
      reviewDone: false,
      practiceDone: false,
      practiceScore: 0,
      homeworkStatus: "not_started" as HomeworkStatus,
      currentSlide: 0,
    };
    saveProgress(get().userId, progress);
    set({ progress });
  },

  resetPractice: (lessonId) => {
    const lesson = get().getLesson(lessonId);
    const steps = { ...lesson.steps };
    steps["practice"] = { done: false, score: 0 };
    steps["homework"] = { done: false };

    const progress = { ...get().progress };
    progress[lessonId] = {
      ...lesson,
      steps,
      practiceDone: false,
      practiceScore: 0,
      homeworkStatus: "not_started" as HomeworkStatus,
    };
    saveProgress(get().userId, progress);
    set({ progress });
  },

  resetHomework: (lessonId) => {
    const lesson = get().getLesson(lessonId);
    const steps = { ...lesson.steps };
    steps["homework"] = { done: false };

    const progress = { ...get().progress };
    progress[lessonId] = {
      ...lesson,
      steps,
      // Use "in_progress" (not "not_started") so mergeServerProgress knows the
      // student deliberately restarted and will not revert back to "revision".
      homeworkStatus: "in_progress" as HomeworkStatus,
    };
    saveProgress(get().userId, progress);
    set({ progress });
  },

  resetAll: () => {
    const progress: Record<string, LessonProgress> = {};
    SORTED_LESSONS.forEach((lesson) => {
      progress[lesson.id] = defaultProgress(lesson.id);
    });
    saveProgress(get().userId, progress);
    set({ progress });
  },

  markStepDone: (lessonId, stepId, score) => {
    const lesson = get().getLesson(lessonId);
    if (lesson.steps[stepId]?.done) return false; // idempotent

    const lessonDef = SORTED_LESSONS.find((l) => l.id === lessonId);
    const stepDef   = lessonDef?.steps.find((s) => s.id === stepId);
    const xpReward  = stepDef?.xpReward ?? 0;

    const steps = { ...lesson.steps };
    steps[stepId] = { done: true, ...(score !== undefined ? { score } : {}) };

    const progress = { ...get().progress };
    progress[lessonId] = { ...lesson, steps };
    saveProgress(get().userId, progress);
    set({ progress });

    // Persist video completion server-side through the same progress route
    if (stepId === "video") {
      const userId = get().userId;
      if (userId) {
        fetch("/api/progress/lesson", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId,
            lessonId,
            videoDone: true,
            reviewDone: lesson.reviewDone,
            practiceDone: lesson.practiceDone,
            practiceScore: lesson.practiceScore,
          }),
        }).catch(() => {});
      }
    }

    emit("lesson:step:completed", {
      lessonId,
      stepId,
      xpReward,
      score,
      bonusEligible: false,
    });

    if (get().isLessonCompleted(lessonId)) {
      emit("lesson:completed", { lessonId });
    }

    return true;
  },

  setCurrentSlide: (lessonId, slide) => {
    const lesson = get().getLesson(lessonId);
    const safeSlide = Math.max(0, slide);

    const steps = { ...lesson.steps };
    const existing = steps["review"];
    steps["review"] = { done: existing?.done ?? false, score: existing?.score, currentSlide: safeSlide };

    const progress = { ...get().progress };
    progress[lessonId] = { ...lesson, steps, currentSlide: safeSlide };
    saveProgress(get().userId, progress);
    set({ progress });
  },
}));
