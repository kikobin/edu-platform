/**
 * Tests for critical progressStore logic:
 *   1. isLessonUnlocked — first lesson always open, subsequent require curator approval
 *   2. mergeServerProgress — forward-only merge never rolls back local state
 */

import { describe, it, expect, beforeEach } from "vitest";
import { useProgressStore } from "@/store/progressStore";
import type { LessonProgress, HomeworkStatus } from "@/types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Lesson IDs from src/data/lessons.ts (order 1 → 2) */
const FIRST_LESSON  = "lesson-1";
const SECOND_LESSON = "lesson-2";

function buildLesson(lessonId: string, overrides: Partial<LessonProgress> = {}): LessonProgress {
  return {
    lessonId,
    steps: {
      review:   { done: false },
      practice: { done: false, score: 0 },
      homework: { done: false },
    },
    reviewDone:    false,
    practiceDone:  false,
    practiceScore: 0,
    homeworkStatus: "not_started",
    currentSlide:  0,
    ...overrides,
  };
}

function setProgress(records: Record<string, Partial<LessonProgress>>) {
  const current = useProgressStore.getState().progress;
  const next: Record<string, LessonProgress> = { ...current };
  for (const [id, overrides] of Object.entries(records)) {
    next[id] = buildLesson(id, overrides);
  }
  useProgressStore.setState({ progress: next, userId: "test-user" });
}

// Reset store to empty state before each test
beforeEach(() => {
  useProgressStore.setState({ progress: {}, userId: "" });
});

// ─── isLessonUnlocked ─────────────────────────────────────────────────────────

describe("isLessonUnlocked", () => {
  it("first lesson is always unlocked", () => {
    const { isLessonUnlocked } = useProgressStore.getState();
    expect(isLessonUnlocked(FIRST_LESSON)).toBe(true);
  });

  it("second lesson is LOCKED when previous homework is not approved", () => {
    setProgress({
      [FIRST_LESSON]: { homeworkStatus: "submitted" },
    });
    const { isLessonUnlocked } = useProgressStore.getState();
    expect(isLessonUnlocked(SECOND_LESSON)).toBe(false);
  });

  it("second lesson is LOCKED when previous homework is in_progress", () => {
    setProgress({
      [FIRST_LESSON]: { homeworkStatus: "in_progress" },
    });
    const { isLessonUnlocked } = useProgressStore.getState();
    expect(isLessonUnlocked(SECOND_LESSON)).toBe(false);
  });

  it("second lesson is LOCKED when previous homework is revision", () => {
    setProgress({
      [FIRST_LESSON]: { homeworkStatus: "revision" },
    });
    const { isLessonUnlocked } = useProgressStore.getState();
    expect(isLessonUnlocked(SECOND_LESSON)).toBe(false);
  });

  it("second lesson is UNLOCKED when previous homework is approved", () => {
    setProgress({
      [FIRST_LESSON]: { homeworkStatus: "approved" },
    });
    const { isLessonUnlocked } = useProgressStore.getState();
    expect(isLessonUnlocked(SECOND_LESSON)).toBe(true);
  });
});

// ─── mergeServerProgress ──────────────────────────────────────────────────────

describe("mergeServerProgress", () => {
  it("advances local state from server when server is ahead", () => {
    useProgressStore.setState({ progress: {}, userId: "test-user" });

    useProgressStore.getState().mergeServerProgress([
      {
        lessonId:       FIRST_LESSON,
        videoDone:      true,
        reviewDone:     true,
        practiceDone:   true,
        practiceScore:  90,
        homeworkDone:   true,
        homeworkStatus: "approved",
      },
    ]);

    const lp = useProgressStore.getState().getLesson(FIRST_LESSON);
    expect(lp.reviewDone).toBe(true);
    expect(lp.practiceDone).toBe(true);
    expect(lp.practiceScore).toBe(90);
    expect(lp.homeworkStatus).toBe("approved");
  });

  it("never rolls back local state that is ahead of server", () => {
    setProgress({
      [FIRST_LESSON]: {
        reviewDone:    true,
        practiceDone:  true,
        practiceScore: 75,
        homeworkStatus: "submitted",
        steps: {
          review:   { done: true },
          practice: { done: true, score: 75 },
          homework: { done: true },
        },
      },
    });

    // Server says nothing is done (stale server state)
    useProgressStore.getState().mergeServerProgress([
      {
        lessonId:      FIRST_LESSON,
        videoDone:     false,
        reviewDone:    false,
        practiceDone:  false,
        practiceScore: 0,
        homeworkDone:  false,
        homeworkStatus: null,
      },
    ]);

    const lp = useProgressStore.getState().getLesson(FIRST_LESSON);
    expect(lp.reviewDone).toBe(true);   // not rolled back
    expect(lp.practiceDone).toBe(true); // not rolled back
    expect(lp.practiceScore).toBe(75);  // not rolled back
    expect(lp.homeworkStatus).toBe("submitted"); // not rolled back
  });

  it("takes the highest practice score between local and server", () => {
    setProgress({
      [FIRST_LESSON]: { practiceDone: true, practiceScore: 60 },
    });

    useProgressStore.getState().mergeServerProgress([
      {
        lessonId:      FIRST_LESSON,
        videoDone:     false,
        reviewDone:    false,
        practiceDone:  true,
        practiceScore: 85,
        homeworkDone:  false,
        homeworkStatus: null,
      },
    ]);

    const lp = useProgressStore.getState().getLesson(FIRST_LESSON);
    expect(lp.practiceScore).toBe(85);
  });

  it("upgrades status from pending to approved when server says approved", () => {
    setProgress({
      [FIRST_LESSON]: { homeworkStatus: "submitted" },
    });

    useProgressStore.getState().mergeServerProgress([
      {
        lessonId:       FIRST_LESSON,
        videoDone:      true,
        reviewDone:     true,
        practiceDone:   true,
        practiceScore:  70,
        homeworkDone:   true,
        homeworkStatus: "approved",
      },
    ]);

    const lp = useProgressStore.getState().getLesson(FIRST_LESSON);
    expect(lp.homeworkStatus).toBe("approved");
  });

  it("unlocks second lesson after merging approved status for first", () => {
    useProgressStore.setState({ progress: {}, userId: "test-user" });

    useProgressStore.getState().mergeServerProgress([
      {
        lessonId:       FIRST_LESSON,
        videoDone:      true,
        reviewDone:     true,
        practiceDone:   true,
        practiceScore:  80,
        homeworkDone:   true,
        homeworkStatus: "approved",
      },
    ]);

    expect(useProgressStore.getState().isLessonUnlocked(SECOND_LESSON)).toBe(true);
  });
});
