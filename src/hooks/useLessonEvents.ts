"use client";

import { useEffect } from "react";
import { on } from "@/lib/events";
import { useUserStore } from "@/store/userStore";
import { XP_REWARDS } from "@/types";

/**
 * Central subscriber for lesson domain events.
 *
 * Mount once in AppLayout. Handles all cross-cutting concerns that
 * react to step/lesson completion:
 *   - XP rewards with idempotency via sourceId ledger
 *   - Future: achievement unlocks, streak bonuses, analytics
 *
 * sourceId format: "step:{lessonId}:{stepId}"
 * This guarantees each step rewards XP exactly once per account,
 * even across devices (server reconciliation re-emits events for
 * newly discovered completions, but the ledger prevents double-award).
 *
 * NOTE: Homework XP is NOT handled here because it includes a
 * deadline-sensitive bonus. The homework page passes its own sourceId.
 */
export function useLessonEvents() {
  const addXP = useUserStore((s) => s.addXP);

  useEffect(() => {
    const offStepCompleted = on("lesson:step:completed", (e) => {
      const sourceId = `step:${e.lessonId}:${e.stepId}`;

      if (e.stepId === "review") {
        addXP(e.xpReward, sourceId);
        return;
      }

      if (e.stepId === "practice") {
        addXP(e.xpReward, sourceId);
        if (e.bonusEligible) {
          addXP(XP_REWARDS.PRACTICE_BONUS, `${sourceId}:bonus`);
        }
        return;
      }

      // "homework" — page handles its own XP (deadline bonus).
      // Other step types (video, checkpoint, project) handled generically:
      if (e.stepId !== "homework") {
        addXP(e.xpReward, sourceId);
      }
    });

    return () => {
      offStepCompleted();
    };
  }, [addXP]);
}
