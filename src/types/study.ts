// Study module types — interactive lesson steps imported from edu-main.
// Kept in a separate file so the legacy `Lesson`/`Slide`/`Question` types
// in `./index.ts` stay untouched while we migrate.

export type ModuleSlug = "vibecoding" | "ai-student" | "ai-creator";

export type StudyLessonRouteMode = "catalog" | "dedicated";

export type StudyStepCompletion =
  | { type: "practice"; key: string }
  | { type: "submission" };

export type StudyStepKind =
  | "which-tag-mini"
  | "find-layer"
  | "prompt-builder"
  | "prompt-strength"
  | "prompt-gallery"
  | "action-step"
  | "send-prompt"
  | "checklist"
  | "quiz"
  | "hallucination-spotter"
  | "fix-prompt"
  | "role-swap";

export interface StudyOptionQuestion {
  id: string;
  text: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
}

export interface StudyRecapAnchor {
  time: string;
  seconds: number;
  label: string;
}

export interface StudyLanding {
  youtubeVideoId: string;
  recap: string;
  anchors: StudyRecapAnchor[];
}

// ─── Per-kind step content ───────────────────────────────────────────────────

export interface WhichTagMiniContent {
  questions: StudyOptionQuestion[];
}

export type FindLayerCodePart =
  | { type: "text"; content: string }
  | { type: "fragment"; id: string; answer: string; content: string };

export interface FindLayerContent {
  options: { label: string; value: string }[];
  parts: FindLayerCodePart[];
  display?: "code" | "blocks";
}

export interface PromptBuilderField {
  key: string;
  label: string;
  type: "radio-chips" | "multi-chips" | "text" | "yes-no";
  options?: string[];
  placeholder?: string;
  minLength?: number;
  minSelections?: number;
  multiline?: boolean;
  allowCustom?: boolean;
}

export interface PromptBuilderContent {
  promptKey: string;
  promptTitle?: string;
  savedTitle?: string;
  template: string;
  fields: PromptBuilderField[];
}

export interface PromptStrengthContent {
  items: {
    id: string;
    text: string;
    verdict: "weak" | "medium" | "strong";
    explanation: string;
  }[];
}

export interface PromptGalleryItem {
  id: string;
  /** Card title shown above the prompt body, e.g. "Cinematic portrait". */
  label: string;
  /** Tool label shown as a chip — Midjourney / Veo 3 / Lyria / etc. */
  tool?: string;
  /** Style/genre chip — "anime", "cinematic", "pixel-art" etc. Optional. */
  style?: string;
  /** The prompt body the student copies into the target tool. */
  prompt: string;
  /** Optional hint shown under the prompt (e.g. "Best on Midjourney v6"). */
  note?: string;
  /** Optional preview rendered above the prompt. Path relative to /public
   *  (e.g. "/ai-creator/preview/lesson-1/cinematic.webp") or absolute https URL. */
  previewImageUrl?: string;
}

export interface PromptGalleryContent {
  /** Where to use the copied prompt — "Midjourney", "Veo 3", "Lyria", … */
  targetTool: string;
  /** Direct link to open the tool in a new tab. */
  targetUrl?: string;
  /** Number of prompts the student must copy to mark the step done. Default 1. */
  copiesRequired?: number;
  items: PromptGalleryItem[];
  successNote?: string;
}

export interface ActionStepContent {
  videoStartSeconds: number;
  checkboxLabel: string;
  doneLabel?: string;
  instructions: string[];
  note?: string;
}

export interface SendPromptContent extends ActionStepContent {
  promptKey: string;
  promptTitle?: string;
  sourceStepNumber: number;
}

export interface ChecklistContent {
  items: { id: string; question: string; hintIfNo: string }[];
}

export interface QuizContent {
  passThreshold: number;
  questions: StudyOptionQuestion[];
}

export interface HallucinationSpotterStatement {
  id: string;
  text: string;
  verdict: "hallucination" | "truth";
  explanation: string;
}

export interface HallucinationSpotterContent {
  contextPrompt: string;
  statements: HallucinationSpotterStatement[];
}

export interface FixPromptUpgrade {
  id: string;
  label: string;
  addition: string;
  hint: string;
}

export interface FixPromptContent {
  weakPrompt: string;
  upgrades: FixPromptUpgrade[];
  successNote?: string;
}

export interface RoleSwapRole {
  id: string;
  label: string;
  sampleAnswer: string;
}

export interface RoleSwapContent {
  question: string;
  roles: RoleSwapRole[];
  slots?: number;
  successNote?: string;
}

export type StudyStepContent =
  | WhichTagMiniContent
  | FindLayerContent
  | PromptBuilderContent
  | PromptStrengthContent
  | ActionStepContent
  | SendPromptContent
  | ChecklistContent
  | QuizContent
  | PromptGalleryContent
  | HallucinationSpotterContent
  | FixPromptContent
  | RoleSwapContent;

export interface HomeworkLevel {
  key: string;
  level: string;
  title: string;
  description: string;
}

export interface LessonHomework {
  urlPlaceholder?: string;
  levels: HomeworkLevel[];
}

// ─── Step + lesson + module ──────────────────────────────────────────────────

export interface StudyStep {
  n: number;
  completion: StudyStepCompletion;
  caption: string;
  title: string;
  description?: string;
  kind?: StudyStepKind;
  content?: StudyStepContent;
}

export interface StudyLessonContent {
  landing: StudyLanding;
  steps: StudyStep[];
}

export interface StudyLesson {
  id: number;
  slug: string;
  module: ModuleSlug;
  title: string;
  subtitle: string;
  tools: string[];
  videoMinutes: number;
  estimatedPracticeMinutes: number;
  status: "available" | "soon";
  routeMode: StudyLessonRouteMode;
  /** Optional SHA-256 password gate from edu-main. We currently ignore gating
   *  (lessons unlock through curator approval), but keep the field for parity. */
  passwordHash?: string;
  /** Tier-restrict this lesson. If unset, lesson is visible to all tiers.
   *  Used in ai-creator module where lessons 7–8 differ between smart and vip cohorts. */
  tier?: "smart" | "vip";
  content?: StudyLessonContent;
  /** Homework — submitted on a separate /study/{slug}/homework page after all steps are done.
   *  Approval by curator unlocks the next lesson. */
  homework?: LessonHomework;
}

export interface StudyModule {
  id: number;
  slug: ModuleSlug;
  title: string;
  subtitle: string;
  lessonCount: number;
  status: "available" | "soon";
}

// ─── Per-step XP rewards (server enforces) ────────────────────────────────────

export const STUDY_STEP_XP = {
  PRACTICE: 10,
  SUBMISSION: 50,
} as const;
