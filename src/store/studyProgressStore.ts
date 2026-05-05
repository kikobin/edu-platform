"use client";

import { create } from "zustand";
import { storage } from "@/lib/storage";
import { emit } from "@/lib/events";
import { STUDY_STEP_XP } from "@/types/study";

/**
 * Per-lesson set of completed dynamic step keys (e.g. "step-1", "step-7", "submission").
 * Stored both on the server (lesson_progress.dynamic_steps_done) and locally
 * for instant UI. Forward-only merge: a locally-done step is never rolled back.
 */
type StudyProgressMap = Record<string, Set<string>>;

interface StudyProgressState {
  byLesson: StudyProgressMap;
  hydratedLessons: Set<string>;

  /** Pulls server-side dynamic_steps_done into local state. Idempotent. */
  hydrateLesson: (lessonSlug: string) => Promise<void>;

  /** True if the student has finished this step. */
  isStepDone: (lessonSlug: string, stepKey: string) => boolean;

  /** Returns the count of finished steps for the lesson. */
  doneCount: (lessonSlug: string) => number;

  /**
   * Marks a step done locally + on the server, awards XP idempotently,
   * and emits a `lesson:step:completed` event for the XP popup.
   * Returns true if this was the first time the step was marked done.
   */
  markStepDone: (lessonSlug: string, stepKey: string) => Promise<boolean>;
}

function lsKey(userId: string) {
  return `study_progress_${userId}`;
}

function readLocal(): StudyProgressMap {
  // We cannot read userId here — caller passes it via hydrate.
  return {};
}

function writeLocal(userId: string | null, map: StudyProgressMap) {
  if (!userId) return;
  const serial: Record<string, string[]> = {};
  for (const [k, v] of Object.entries(map)) serial[k] = Array.from(v);
  storage.set(lsKey(userId), serial);
}

function readLocalFor(userId: string): StudyProgressMap {
  const raw = storage.get<Record<string, string[]>>(lsKey(userId));
  if (!raw) return {};
  const out: StudyProgressMap = {};
  for (const [k, v] of Object.entries(raw)) out[k] = new Set(v);
  return out;
}

let currentUserIdRef: string | null = null;

export function setStudyProgressUserId(userId: string | null) {
  currentUserIdRef = userId;
  if (userId) {
    const local = readLocalFor(userId);
    useStudyProgressStore.setState({ byLesson: local });
  } else {
    useStudyProgressStore.setState({ byLesson: {}, hydratedLessons: new Set() });
  }
}

export const useStudyProgressStore = create<StudyProgressState>((set, get) => ({
  byLesson: readLocal(),
  hydratedLessons: new Set<string>(),

  hydrateLesson: async (lessonSlug) => {
    if (get().hydratedLessons.has(lessonSlug)) return;

    try {
      const res = await fetch(
        `/api/progress/dynamic-step?lessonSlug=${encodeURIComponent(lessonSlug)}`
      );
      if (!res.ok) return;
      const json = (await res.json()) as { steps?: string[] };
      const serverSteps = Array.isArray(json.steps) ? json.steps : [];

      const local = get().byLesson[lessonSlug] ?? new Set<string>();
      // Forward-only merge — union of local and server.
      for (const s of serverSteps) local.add(s);

      const next: StudyProgressMap = { ...get().byLesson, [lessonSlug]: local };
      const hydratedNext = new Set(get().hydratedLessons);
      hydratedNext.add(lessonSlug);
      set({ byLesson: next, hydratedLessons: hydratedNext });
      writeLocal(currentUserIdRef, next);
    } catch {
      // Network blip — leave hydratedLessons untouched so we retry next mount.
    }
  },

  isStepDone: (lessonSlug, stepKey) => {
    return get().byLesson[lessonSlug]?.has(stepKey) ?? false;
  },

  doneCount: (lessonSlug) => {
    return get().byLesson[lessonSlug]?.size ?? 0;
  },

  markStepDone: async (lessonSlug, stepKey) => {
    if (get().isStepDone(lessonSlug, stepKey)) return false;

    // Optimistic local update so the UI moves immediately.
    const local = new Set(get().byLesson[lessonSlug] ?? []);
    local.add(stepKey);
    const optimistic: StudyProgressMap = { ...get().byLesson, [lessonSlug]: local };
    set({ byLesson: optimistic });
    writeLocal(currentUserIdRef, optimistic);

    try {
      const res = await fetch("/api/progress/dynamic-step", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonSlug, stepKey }),
      });
      if (!res.ok) {
        // Roll back optimistic update only if the server explicitly rejected
        // the write. 5xx blips keep the optimistic state — server will catch
        // up on next hydrate.
        if (res.status === 400 || res.status === 403) {
          local.delete(stepKey);
          const rolledBack: StudyProgressMap = { ...get().byLesson, [lessonSlug]: local };
          set({ byLesson: rolledBack });
          writeLocal(currentUserIdRef, rolledBack);
          return false;
        }
      }
    } catch {
      // Keep optimistic state on network error.
    }

    const isSubmission = stepKey === "submission";
    const xpReward = isSubmission ? STUDY_STEP_XP.SUBMISSION : STUDY_STEP_XP.PRACTICE;
    emit("lesson:step:completed", {
      lessonId: lessonSlug,
      stepId: stepKey,
      xpReward,
    });

    return true;
  },
}));
