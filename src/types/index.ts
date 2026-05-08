// ─── User ────────────────────────────────────────────────────────────────────

export type AvatarId =
  | "avatar_1" | "avatar_2" | "avatar_3" | "avatar_4"
  | "avatar_5" | "avatar_6" | "avatar_7" | "avatar_8"
  // Premium avatars unlocked via shop
  | "av_dragon" | "av_eagle" | "av_robot"
  | "av_wizard" | "av_ninja" | "av_astronaut";

export type UserRole = "student" | "curator" | "admin";

export type Tier = "smart" | "vip";

export interface User {
  id: string;
  name: string;
  email: string;
  avatarId: AvatarId;
  titleId?: string;
  frameId?: string;
  role?: UserRole;
  /** Subscription tier — drives tier-specific lesson visibility (e.g. ai-creator lessons 7–8). */
  tier?: Tier;
}

// ─── XP & Levels ─────────────────────────────────────────────────────────────

export interface Level {
  level: number;
  label: string;
  minXP: number;
  maxXP: number;
}

export const LEVELS: Level[] = [
  { level: 1, label: "Новичок",       minXP: 0,    maxXP: 99   },
  { level: 2, label: "Исследователь", minXP: 100,  maxXP: 249  },
  { level: 3, label: "Знаток",        minXP: 250,  maxXP: 499  },
  { level: 4, label: "Мастер",        minXP: 500,  maxXP: 999  },
  { level: 5, label: "Эксперт",       minXP: 1000, maxXP: 9999 },
];

export const XP_REWARDS = {
  VIDEO_DONE:         25,
  REVIEW_DONE:        20,
  PRACTICE_DONE:      30,
  PRACTICE_BONUS:     20,
  HOMEWORK_DONE:      50,
  HOMEWORK_ON_TIME:   10,
  HOMEWORK_APPROVED:  30,
  DAILY_STREAK:        5,
} as const;

// ─── Shop ────────────────────────────────────────────────────────────────────

export type ShopCategory = "avatar" | "title" | "frame";

export interface ShopItem {
  id: string;
  category: ShopCategory;
  name: string;
  description: string;
  cost: number;
  preview: string;
  color: string;
  textColor?: string;
}

// ─── Course & Lessons ────────────────────────────────────────────────────────

/**
 * Step types supported by the lesson pipeline.
 *  content    — slide deck (watch + read, complete on last slide)
 *  quiz       — graded Q&A practice (complete when score >= minPassScore)
 *  homework   — async submission (complete when submitted)
 *  video      — watch-to-complete video
 *  checkpoint — module-level graded quiz (stricter minPassScore)
 *  project    — multi-stage submission with curator review
 */
export type LessonStepType =
  | "content"
  | "quiz"
  | "homework"
  | "video"
  | "checkpoint"
  | "project";

/** Per-step configuration declared inside each Lesson */
export interface LessonStepDef {
  /** Unique id within the lesson — also used as the progress key */
  id: string;
  type: LessonStepType;
  label: string;
  description: string;
  doneTip: string;
  icon: string;
  xpReward: number;
  estimatedMin: number;
  /** URL segment for the step's route under /lesson/[id]/ */
  route: string;
  /** Minimum score (0–100) required for quiz / checkpoint steps */
  minPassScore?: number;
  /** YouTube video ID for steps of type "video" */
  videoId?: string;
}

export interface Lesson {
  id: string;
  order: number;
  title: string;
  description: string;
  topic: string;
  /** Ordered list of steps for this lesson. Drives the hub UI and unlock logic. */
  steps: LessonStepDef[];
}

// ─── Slides ──────────────────────────────────────────────────────────────────

export interface Slide {
  id: string;
  lessonId: string;
  order: number;
  title: string;
  content: string;
  imageUrl?: string;
  tip?: string;           // необязательная подсказка/заметка
  highlight?: string;     // выделенный блок (пример, правило и т.д.)
  icon?: string;                                          // эмодзи-иконка слайда
  highlightType?: "example" | "rule" | "warning";       // визуальный стиль highlight-блока
  stepLabel?: string;                                     // "Шаг 2 из 5" для шаговых слайдов
}

// ─── Practice ────────────────────────────────────────────────────────────────

export type QuestionType =
  | "single"      // один правильный вариант
  | "multiple"    // несколько правильных вариантов
  | "truefalse"   // правда / миф
  | "ordering"    // расставь в правильном порядке
  | "matching"    // сопоставь пары
  | "checklist";  // самопроверка по чеклисту

export interface QuestionOption {
  id: string;
  text: string;
}

export interface Question {
  id: string;
  lessonId: string;
  order: number;
  type: QuestionType;
  text: string;
  options: QuestionOption[];
  // single/multiple/truefalse: id правильных ответов
  // ordering: id-шники в правильном порядке
  // matching: ["leftId:rightId", ...]
  // checklist: пусто — нет «неверных» ответов
  correctIds: string[];
  explanation: string;
  pairs?: QuestionOption[];  // правая колонка для matching
}

// ─── Homework ────────────────────────────────────────────────────────────────

export type SubmitType    = "text" | "link" | "confirm" | "file";
/** not_started → in_progress → submitted → approved | revision */
export type HomeworkStatus = "not_started" | "in_progress" | "submitted" | "approved" | "revision";

export interface ChecklistItemData {
  id: string;
  text: string;
}

export interface Homework {
  id: string;
  lessonId: string;
  title: string;
  description: string;
  checklist: ChecklistItemData[];
  submitType: SubmitType;
  deadline?: string;
}

// ─── Progress ────────────────────────────────────────────────────────────────

/** @deprecated Use LessonStepDef instead. Kept for backward compat with isStepUnlocked callers. */
export type LessonStep = "review" | "practice" | "homework";

/** Progress snapshot for a single step */
export interface StepProgress {
  done: boolean;
  /** Percentage score (0–100) for quiz / checkpoint steps */
  score?: number;
  /** Current slide index for content steps */
  currentSlide?: number;
}

export interface LessonProgress {
  lessonId: string;
  /** Primary source of truth — step id → progress. Step-count-agnostic. */
  steps: Record<string, StepProgress>;
  // ── Legacy flat fields kept for backward compat ──────────────────────────
  // All store mutations write to both `steps` AND these fields so that
  // existing consumers (step pages, profile, admin) keep working unchanged.
  reviewDone: boolean;
  practiceDone: boolean;
  practiceScore: number;
  homeworkStatus: HomeworkStatus;
  currentSlide: number;
}

// ─── Leaderboard ─────────────────────────────────────────────────────────────

export interface LeaderboardEntry {
  userId: string;
  name: string;
  avatarId: AvatarId;
  xp: number;
  rank: number;
}

// ─── Submissions ──────────────────────────────────────────────────────────────

export type SubmissionStatus = "pending" | "approved" | "revision";

export interface Submission {
  id: string;
  userId: string;
  userName: string;
  lessonId: string;
  homeworkId: string;
  lessonTitle: string;
  homeworkTitle: string;
  content: string;
  submitType: string;
  status: SubmissionStatus;
  curatorComment?: string;
  submittedAt: string;
  reviewedAt?: string;
  fileUrl?: string;
  fileMime?: string;
  fileSize?: number;
}
