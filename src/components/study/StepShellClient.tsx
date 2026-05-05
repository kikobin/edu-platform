"use client";

import { ReactNode, useEffect } from "react";
import { useStudyProgressStore } from "@/store/studyProgressStore";
import { StepShell } from "./StepShell";

interface Props {
  lessonSlug: string;
  caption: string;
  title: string;
  description?: string;
  stepLabel: string;
  totalSteps: number;
  backHref: string;
  prevHref: string | null;
  nextHref: string | null;
  /** Step key (e.g. "step-1", "submission"). Used to read done-status. */
  stepKey: string;
  children: ReactNode;
}

/**
 * Client-side wrapper that hydrates the lesson's dynamic-step progress and
 * passes done-state into the dumb StepShell.
 */
export function StepShellClient({
  lessonSlug,
  caption,
  title,
  description,
  stepLabel,
  totalSteps,
  backHref,
  prevHref,
  nextHref,
  stepKey,
  children,
}: Props) {
  const hydrate = useStudyProgressStore((s) => s.hydrateLesson);
  useEffect(() => {
    void hydrate(lessonSlug);
  }, [hydrate, lessonSlug]);

  const isDone = useStudyProgressStore((s) => s.isStepDone(lessonSlug, stepKey));
  const doneCount = useStudyProgressStore((s) => s.doneCount(lessonSlug));

  const progressPct = totalSteps > 0 ? Math.round((doneCount / totalSteps) * 100) : 0;

  return (
    <StepShell
      caption={caption}
      title={title}
      description={description}
      stepLabel={stepLabel}
      progressPercent={progressPct}
      backHref={backHref}
      prevHref={prevHref}
      nextHref={nextHref}
      isDone={isDone}
    >
      {children}
    </StepShell>
  );
}
