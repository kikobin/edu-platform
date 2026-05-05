"use client";

import { ReactNode, useEffect, useMemo } from "react";
import { useStudyProgressStore } from "@/store/studyProgressStore";
import { StepShell } from "./StepShell";
import type { StepperItem } from "./StepStepper";

export interface StepDescriptor {
  n: number;
  /** Step key in progress store: "step-N" for practice, "submission" for homework. */
  key: string;
  title: string;
  href: string;
}

interface Props {
  lessonSlug: string;
  caption: string;
  title: string;
  description?: string;
  stepLabel: string;
  currentStepN: number;
  /** All steps in the lesson, in order — drives the stepper. */
  allSteps: StepDescriptor[];
  backHref: string;
  prevHref: string | null;
  nextHref: string | null;
  /** Step key of the current step. Used to read done-status. */
  stepKey: string;
  children: ReactNode;
}

/**
 * Client wrapper that hydrates dynamic-step progress and feeds the dumb StepShell
 * with a per-step done map for the stepper.
 */
export function StepShellClient({
  lessonSlug,
  caption,
  title,
  description,
  stepLabel,
  currentStepN,
  allSteps,
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
  const doneSet = useStudyProgressStore(
    (s) => s.byLesson[lessonSlug] ?? new Set<string>()
  );

  const stepperItems: StepperItem[] = useMemo(
    () =>
      allSteps.map((s) => ({
        n: s.n,
        title: s.title,
        href: s.href,
        done: doneSet.has(s.key),
      })),
    [allSteps, doneSet]
  );

  return (
    <StepShell
      caption={caption}
      title={title}
      description={description}
      stepLabel={stepLabel}
      currentStepN={currentStepN}
      steps={stepperItems}
      backHref={backHref}
      prevHref={prevHref}
      nextHref={nextHref}
      isDone={isDone}
    >
      {children}
    </StepShell>
  );
}
