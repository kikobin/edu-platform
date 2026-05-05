"use client";

import type { StudyStep } from "@/types/study";
import { ToolIcon } from "@/components/brand/Icon";
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
    return (
      <div className="bg-white rounded-xl border border-border p-8 text-center text-text-muted">
        <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-bg mb-3">
          <ToolIcon size={20} />
        </div>
        <p className="text-[14px]">Этот тип шага пока не поддержан.</p>
      </div>
    );
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
