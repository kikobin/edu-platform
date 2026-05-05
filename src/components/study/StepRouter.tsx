"use client";

import type { StudyStep } from "@/types/study";
import {
  WhichTagMiniContent,
  FindLayerContent,
  PromptBuilderContent,
  PromptStrengthContent,
  PromptGalleryContent,
  ActionStepContent,
  SendPromptContent,
  ChecklistContent,
  QuizContent,
  HallucinationSpotterContent,
  FixPromptContent,
  RoleSwapContent,
} from "@/types/study";
import { WhichTagMini } from "./interactives/WhichTagMini";
import { FindLayer } from "./interactives/FindLayer";
import { PromptBuilder } from "./interactives/PromptBuilder";
import { PromptStrength } from "./interactives/PromptStrength";
import { PromptGallery } from "./interactives/PromptGallery";
import { ActionStep } from "./interactives/ActionStep";
import { SendPrompt } from "./interactives/SendPrompt";
import { Checklist } from "./interactives/Checklist";
import { Quiz } from "./interactives/Quiz";
import { HallucinationSpotter } from "./interactives/HallucinationSpotter";
import { FixPrompt } from "./interactives/FixPrompt";
import { RoleSwap } from "./interactives/RoleSwap";
import { useStepDone } from "./useStepDone";

// Fallback for steps that have no interactive kind (e.g. lesson-5 imported from edu-main).
// Shows the step title/description and lets the student self-report completion.
function StepPlaceholder({
  lessonSlug,
  stepKey,
  step,
}: {
  lessonSlug: string;
  stepKey: string;
  step: StudyStep;
}) {
  const { isDone, markDone } = useStepDone(lessonSlug, stepKey);
  return (
    <div className="bg-white rounded-xl border border-border p-6 space-y-4">
      {step.title && (
        <h3 className="text-[16px] font-semibold text-text">{step.title}</h3>
      )}
      {step.description && (
        <p className="text-[14px] text-text-muted leading-relaxed">{step.description}</p>
      )}
      <button
        onClick={markDone}
        disabled={isDone}
        className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
          isDone
            ? "bg-green-50 text-green-600 border border-green-200 cursor-default"
            : "bg-primary text-white hover:bg-primary/90"
        }`}
      >
        {isDone ? "✓ Выполнено" : "Я разобрался"}
      </button>
    </div>
  );
}

interface Props {
  lessonSlug: string;
  lessonTitle: string;
  /** YouTube id from lesson.landing.youtubeVideoId — needed by Action/SendPrompt for the embedded preview. */
  videoId?: string;
  step: StudyStep;
}

/**
 * Picks the right interactive component based on `step.kind`.
 * Falls back to a friendly placeholder for steps without a kind/content.
 *
 * The stepKey is derived from `step.completion`:
 *   - practice → completion.key (e.g. "step-1", "step-7")
 *   - submission → "submission"
 */
export function StepRouter({ lessonSlug, lessonTitle, videoId, step }: Props) {
  const stepKey =
    step.completion.type === "practice" ? step.completion.key : "submission";

  if (!step.kind || !step.content) {
    return <StepPlaceholder lessonSlug={lessonSlug} stepKey={stepKey} step={step} />;
  }

  switch (step.kind) {
    case "which-tag-mini":
      return (
        <WhichTagMini
          lessonSlug={lessonSlug}
          stepKey={stepKey}
          content={step.content as WhichTagMiniContent}
        />
      );
    case "find-layer":
      return (
        <FindLayer
          lessonSlug={lessonSlug}
          stepKey={stepKey}
          content={step.content as FindLayerContent}
        />
      );
    case "prompt-builder":
      return (
        <PromptBuilder
          lessonSlug={lessonSlug}
          stepKey={stepKey}
          content={step.content as PromptBuilderContent}
        />
      );
    case "prompt-strength":
      return (
        <PromptStrength
          lessonSlug={lessonSlug}
          stepKey={stepKey}
          content={step.content as PromptStrengthContent}
        />
      );
    case "prompt-gallery":
      return (
        <PromptGallery
          lessonSlug={lessonSlug}
          stepKey={stepKey}
          content={step.content as PromptGalleryContent}
        />
      );
    case "action-step":
      return (
        <ActionStep
          lessonSlug={lessonSlug}
          stepKey={stepKey}
          content={step.content as ActionStepContent}
          videoId={videoId}
        />
      );
    case "send-prompt":
      return (
        <SendPrompt
          lessonSlug={lessonSlug}
          stepKey={stepKey}
          content={step.content as SendPromptContent}
          videoId={videoId}
        />
      );
    case "checklist":
      return (
        <Checklist
          lessonSlug={lessonSlug}
          stepKey={stepKey}
          content={step.content as ChecklistContent}
        />
      );
    case "quiz":
      return (
        <Quiz
          lessonSlug={lessonSlug}
          stepKey={stepKey}
          content={step.content as QuizContent}
        />
      );
    case "hallucination-spotter":
      return (
        <HallucinationSpotter
          lessonSlug={lessonSlug}
          stepKey={stepKey}
          content={step.content as HallucinationSpotterContent}
        />
      );
    case "fix-prompt":
      return (
        <FixPrompt
          lessonSlug={lessonSlug}
          stepKey={stepKey}
          content={step.content as FixPromptContent}
        />
      );
    case "role-swap":
      return (
        <RoleSwap
          lessonSlug={lessonSlug}
          stepKey={stepKey}
          content={step.content as RoleSwapContent}
        />
      );
    default:
      return (
        <div className="bg-white rounded-xl border border-border p-8 text-center text-text-muted text-[14px]">
          Неизвестный тип шага: {step.kind}
        </div>
      );
  }
}
