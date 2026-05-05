"use client";

import { useCallback } from "react";
import { useStudyProgressStore } from "@/store/studyProgressStore";

/**
 * Helper hook all interactive step components use to mark themselves done.
 * Returns: { isDone, markDone } where markDone is fire-and-forget.
 */
export function useStepDone(lessonSlug: string, stepKey: string) {
  const isDone = useStudyProgressStore((s) => s.isStepDone(lessonSlug, stepKey));
  const markStepDone = useStudyProgressStore((s) => s.markStepDone);

  const markDone = useCallback(() => {
    if (isDone) return;
    void markStepDone(lessonSlug, stepKey);
  }, [isDone, markStepDone, lessonSlug, stepKey]);

  return { isDone, markDone };
}
