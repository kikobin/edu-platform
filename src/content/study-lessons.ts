// Imported from edu-main/src/content/lessons.ts.
// Types come from @/types/study; arrays + helpers below.

import {
  LESSON_1_CONTENT,
  LESSON_2_CONTENT,
  LESSON_3_CONTENT,
  LESSON_4_CONTENT,
  LESSON_6_CONTENT,
  LESSON_7_CONTENT,
  AI_STUDENT_1_CONTENT,
  AI_STUDENT_2_CONTENT,
  AI_STUDENT_3_CONTENT,
  AI_STUDENT_4_CONTENT,
  AI_STUDENT_5_CONTENT,
  AI_STUDENT_6_CONTENT,
  AI_STUDENT_7_CONTENT,
  AI_STUDENT_8_CONTENT,
} from "@/content/imported-lessons";
import {
  AI_CREATOR_1_CONTENT,
  AI_CREATOR_2_CONTENT,
  AI_CREATOR_3_CONTENT,
  AI_CREATOR_4_CONTENT,
  AI_CREATOR_5_CONTENT,
  AI_CREATOR_6_CONTENT,
  AI_CREATOR_7_SMART_CONTENT,
  AI_CREATOR_8_SMART_CONTENT,
  AI_CREATOR_7_VIP_CONTENT,
  AI_CREATOR_8_VIP_CONTENT,
} from "@/content/imported-ai-creator";
import { HOMEWORK_BY_SLUG } from "@/content/lesson-homework";
import type { LessonHomework, ModuleSlug, StudyLesson, StudyStep, StudyLessonContent } from "@/types/study";

export const LESSONS: StudyLesson[] = [
  {
    id: 1,
    slug: "lesson-1",
    module: "vibecoding",
    title: "Вайб-кодинг: программирование на языке смыслов",
    subtitle:
      "Превращаем идею в работающую программу через диалог с ИИ.",
    tools: ["Gemini", "CodePen"],
    videoMinutes: 17,
    estimatedPracticeMinutes: 40,
    status: "available",
    routeMode: "catalog",
    content: LESSON_1_CONTENT,
  },
  {
    id: 2,
    slug: "lesson-2",
    module: "vibecoding",
    title: "Вайб-дизайн в Stitch",
    subtitle:
      "Из идеи в визуальную систему сайта — для мобильного и десктопа.",
    tools: ["Stitch", "Gemini"],
    videoMinutes: 16,
    estimatedPracticeMinutes: 35,
    status: "available",
    routeMode: "catalog",
    // password: 2531
    passwordHash: "d9eb1c864cfaa8b6deef076edd37d9fe3403212dfae3d243947419118e4a06f2",
    content: LESSON_2_CONTENT,
  },
  {
    id: 3,
    slug: "lesson-3",
    module: "vibecoding",
    title: "Canva AI: от шаблона до опубликованного сайта",
    subtitle:
      "Шаблоны, Magic Studio, генерация документов и кода — всё в одном инструменте.",
    tools: ["Canva", "Canva AI", "Magic Studio"],
    videoMinutes: 18,
    estimatedPracticeMinutes: 45,
    status: "available",
    routeMode: "catalog",
    // password: 3962
    passwordHash: "5c7d9080a7a635fe5f5c65d3608d16736770590f7bdad8a357d2aedd7a64f1ef",
    content: LESSON_3_CONTENT,
  },
  {
    id: 4,
    slug: "lesson-4",
    module: "vibecoding",
    title: "Tilda: от первой структуры до своего Zero Block",
    subtitle:
      "Собираем настоящий сайт без кода через AI Assistant, а потом делаем его уникальным в Zero Block.",
    tools: ["Tilda", "Tilda AI Assistant", "Zero Block"],
    videoMinutes: 17,
    estimatedPracticeMinutes: 45,
    status: "available",
    routeMode: "catalog",
    // password: 4715
    passwordHash: "e2aab8e08a6b9259d75af99a4834614986995cad46ef3c4780dd540dc4c5da82",
    content: LESSON_4_CONTENT,
  },
  {
    id: 5,
    slug: "lesson-5",
    module: "vibecoding",
    title: "Создаём первую версию сайта",
    subtitle:
      "Идея → промт → готовая страница в браузере. Делаем по шагам вместе через Codex.",
    tools: ["Codex", "Skill AI TREND LESSON 5"],
    videoMinutes: 16,
    estimatedPracticeMinutes: 45,
    status: "available",
    routeMode: "dedicated",
    // password: 5068
    passwordHash:
      "52fca1c4244d415a9f7934878ec582a71099283471514360ff8976d1463118d9",
    content: {
      landing: {
        youtubeVideoId: "BihultRb-To",
        recap:
          "Сайт состоит из трёх слоёв — HTML отвечает за структуру, CSS за внешний вид, JavaScript за поведение. В видео мы установили Codex, подключили skill AI TREND LESSON 5 и разобрали, как описать идею сайта так, чтобы получить точный результат.",
        anchors: [
          { time: "06:08", seconds: 6 * 60 + 8, label: "шаг 1: найди слой" },
          {
            time: "07:11",
            seconds: 7 * 60 + 11,
            label: "шаг 2: конструктор промта",
          },
          {
            time: "09:45",
            seconds: 9 * 60 + 45,
            label: "шаг 3: слабый или сильный промт",
          },
          {
            time: "12:23",
            seconds: 12 * 60 + 23,
            label: "шаг 4: создаём папку проекта",
          },
        ],
      },
      steps: [
        {
          n: 1,
          completion: { type: "practice", key: "step-1" },
          caption: "ШАГ 1 ИЗ 11 · РАЗОГРЕВ",
          title: "Найди слой",
          description:
            "Разбери, где в реальном HTML-файле прячутся CSS и JavaScript.",
        },
        {
          n: 2,
          completion: { type: "practice", key: "step-2" },
          caption: "ШАГ 2 ИЗ 11 · ПРОМТ",
          title: "Конструктор промта",
          description:
            "Соберём твой промт по полям — Codex поймёт идею с первого раза.",
        },
        {
          n: 3,
          completion: { type: "practice", key: "step-3" },
          caption: "ШАГ 3 ИЗ 11 · ПРОМТ",
          title: "Слабый или сильный?",
          description: "Оцени промты, чтобы развить чутьё.",
        },
        {
          n: 4,
          completion: { type: "practice", key: "step-4" },
          caption: "ШАГ 4 ИЗ 11 · CODEX",
          title: "Создай папку проекта",
          description: "В Codex создаём отдельную папку для нашего сайта.",
        },
        {
          n: 5,
          completion: { type: "practice", key: "step-5" },
          caption: "ШАГ 5 ИЗ 11 · CODEX",
          title: "Подключи skill",
          description:
            "Активируем AI TREND LESSON 5 — поле ввода загорится фиолетовым.",
        },
        {
          n: 6,
          completion: { type: "practice", key: "step-6" },
          caption: "ШАГ 6 ИЗ 11 · CODEX",
          title: "Отправь свой промт",
          description:
            "Вставляешь готовый промт из шага 2 — Codex задаст уточняющие.",
        },
        {
          n: 7,
          completion: { type: "practice", key: "step-7" },
          caption: "ШАГ 7 ИЗ 11 · CODEX",
          title: "Открой index.html",
          description:
            "Заходишь в папку проекта и кликаешь на файл — сайт откроется в браузере.",
        },
        {
          n: 8,
          completion: { type: "practice", key: "step-8" },
          caption: "ШАГ 8 ИЗ 11 · ПРОВЕРКА",
          title: "Чек-лист после практики",
          description: "Открой свой сайт и пройдись по 4 пунктам.",
        },
        {
          n: 9,
          completion: { type: "practice", key: "step-9" },
          caption: "ШАГ 9 ИЗ 11 · КВИЗ",
          title: "Квиз по уроку",
          description: "5 коротких вопросов. 4 правильных — урок зачтён.",
        },
        {
          n: 10,
          completion: { type: "submission" },
          caption: "ШАГ 10 ИЗ 11 · СДАЧА",
          title: "Сдача учителю",
          description: "Покажи учителю свою работу в Google Meet.",
        },
        {
          n: 11,
          completion: { type: "practice", key: "step-11" },
          caption: "ШАГ 11 ИЗ 11 · ДОМАШКА",
          title: "Домашнее задание",
          description:
            "После урока — три уровня глубины. Выбери, насколько хочешь зайти, и возвращайся сюда отмечать, когда сделаешь.",
        },
      ],
    },
  },
  {
    id: 6,
    slug: "lesson-6",
    module: "vibecoding",
    title: "Улучшаем сайт и публикуем через Netlify",
    subtitle:
      "Берём первую версию из прошлого урока, усиливаем её через Skill и выводим в настоящий интернет.",
    tools: ["Codex", "Skill AI TREND LESSON 6", "Netlify"],
    videoMinutes: 17,
    estimatedPracticeMinutes: 40,
    status: "available",
    routeMode: "catalog",
    // password: 6283
    passwordHash: "0810d383f0c33cf47ae1873588ab843742154a2f58ab6ec476a2750fc06f1d7b",
    content: LESSON_6_CONTENT,
  },
  {
    id: 7,
    slug: "lesson-7",
    module: "vibecoding",
    title: "Создаём первого Telegram-бота",
    subtitle:
      "Идея → промт → Skill → BotFather → токен → живой бот в Telegram.",
    tools: ["Codex", "AI TREND LESSON 7", "BotFather", "Telegram"],
    videoMinutes: 17,
    estimatedPracticeMinutes: 40,
    status: "available",
    routeMode: "catalog",
    // password: 7490
    passwordHash: "8aab8fb5f1a95db34508f4701fe0a202537165287eaecc3868b255da9740ac62",
    content: LESSON_7_CONTENT,
  },
];
export const LESSONS_AI_STUDENT: StudyLesson[] = [
  {
    id: 101,
    slug: "ai-student-1",
    module: "ai-student",
    title: "Основы безопасности и знакомство с ИИ",
    subtitle:
      "Кибер-Детектив против галлюцинаций, заглушек и небезопасных запросов.",
    tools: ["ChatGPT", "Gemini"],
    videoMinutes: 18,
    estimatedPracticeMinutes: 35,
    status: "available",
    routeMode: "catalog",
    // password: 1247
    passwordHash:
      "92f3c34650437f1ddf6b2f2e3f4d240e6e3755bace50d44b7a3fda82332a942b",
    content: AI_STUDENT_1_CONTENT,
  },
  {
    id: 102,
    slug: "ai-student-2",
    module: "ai-student",
    title: "Промпт-инжиниринг и формула РОЛИ",
    subtitle:
      "Превращаем Джинна-ИИ в точного исполнителя через 4 элемента: Роль, Объект, Лимиты, Формат.",
    tools: ["ChatGPT", "Gemini"],
    videoMinutes: 17,
    estimatedPracticeMinutes: 40,
    status: "available",
    routeMode: "catalog",
    // password: 2358
    passwordHash:
      "4bbcd97e4d538bc5da6a88208b59caf366322b75dc8e4a2ab66129e3f5ef1d46",
    content: AI_STUDENT_2_CONTENT,
  },
  {
    id: 103,
    slug: "ai-student-3",
    module: "ai-student",
    title: "Проекты, Холст и Глубокое Исследование",
    subtitle:
      "Три фундамента ChatGPT-5: командный центр, мастерская соавторства и глобальный сыщик.",
    tools: ["ChatGPT-5"],
    videoMinutes: 18,
    estimatedPracticeMinutes: 45,
    status: "available",
    routeMode: "catalog",
    // password: 3169
    passwordHash:
      "7ac7a7fb16bdf38f677eef82fc5b7b9d7ea1666f8cfb9b47ad192569ed09a767",
    content: AI_STUDENT_3_CONTENT,
  },
  {
    id: 104,
    slug: "ai-student-4",
    module: "ai-student",
    title: "Магазин приложений ИИ",
    subtitle:
      "ChatGPT обретает руки — Canva, Spotify, Figma и другие сервисы прямо в чате через @.",
    tools: ["ChatGPT-5", "Canva", "Spotify", "Figma", "Wolfram Alpha"],
    videoMinutes: 18,
    estimatedPracticeMinutes: 40,
    status: "available",
    routeMode: "catalog",
    // password: 4582
    passwordHash:
      "486ea85278bd246cca4a4de0dd8e08ed0802eed350c73eebd662a4578c281496",
    content: AI_STUDENT_4_CONTENT,
  },
  {
    id: 105,
    slug: "ai-student-5",
    module: "ai-student",
    title: "The NotebookLM — твой личный аналитик",
    subtitle:
      "Заземлённый ИИ, который читает только твои файлы и не выдумывает.",
    tools: ["NotebookLM"],
    videoMinutes: 17,
    estimatedPracticeMinutes: 40,
    status: "available",
    routeMode: "catalog",
    // password: 5793
    passwordHash:
      "399bd91a2b1e5ebdb54a7aec97bc3f30c1c2a19a758556febf86ebe87bcfcd16",
    content: AI_STUDENT_5_CONTENT,
  },
  {
    id: 106,
    slug: "ai-student-6",
    module: "ai-student",
    title: "NotebookLM 2: видео, тесты и Quizlet",
    subtitle:
      "Превращаем заметки в аниме-видео, тесты с пояснением и масштабные карточки через ChatGPT + Quizlet.",
    tools: ["NotebookLM", "ChatGPT-5", "Quizlet"],
    videoMinutes: 16,
    estimatedPracticeMinutes: 40,
    status: "available",
    routeMode: "catalog",
    // password: 6824
    passwordHash:
      "def2f2195183e1938537e9bcd0b725a5b92e57d2e7e02df933bc863be682fe91",
    content: AI_STUDENT_6_CONTENT,
  },
  {
    id: 107,
    slug: "ai-student-7",
    module: "ai-student",
    title: "Создаём первого ИИ-агента в Gemini",
    subtitle:
      "Gem-боты от Google — твой бесплатный полигон для проектирования цифровых сотрудников.",
    tools: ["Gemini", "Gem-боты", "ChatGPT-5"],
    videoMinutes: 17,
    estimatedPracticeMinutes: 45,
    status: "available",
    routeMode: "catalog",
    // password: 7635
    passwordHash:
      "884486e0e1e2bec9055d0c00af61ced9bbf31e120ae9b47ea84fc87d65741b61",
    content: AI_STUDENT_7_CONTENT,
  },
  {
    id: 108,
    slug: "ai-student-8",
    module: "ai-student",
    title: "Создание бота Poe",
    subtitle:
      "Финал модуля — собираем AI Trend Teacher на платформе Poe и питчим как продукт.",
    tools: ["Poe", "ChatGPT-5", "ElevenLabs"],
    videoMinutes: 19,
    estimatedPracticeMinutes: 60,
    status: "available",
    routeMode: "catalog",
    // password: 8146
    passwordHash:
      "ce8e47d6923e702e3c0f39d6062aac756bfbca51e9bf2e9a1c3c1a9b24cbb6f7",
    content: AI_STUDENT_8_CONTENT,
  },
];

// ─── ai-creator (10 lessons: 6 common + 2 smart + 2 vip) ─────────────────────
//
// Lessons 1–6 are common to both tiers. Lessons 7–8 differ between smart and
// vip — students see only the lesson matching their tier. The duplicate
// numeric ids don't collide because `getLessonById` is never used to look up
// a tier-split lesson; consumers go through getLessonBySlug or
// getLessonsByModule (which filters by tier).

export const LESSONS_AI_CREATOR: StudyLesson[] = [
  {
    id: 201,
    slug: "ai-creator-1",
    module: "ai-creator",
    title: "Введение — что такое ИИ?",
    subtitle: "Стартовый урок модуля AI Creator: знакомство с инструментами и языком промтов.",
    tools: ["Midjourney", "Gemini Image"],
    videoMinutes: 12,
    estimatedPracticeMinutes: 25,
    status: "available",
    routeMode: "catalog",
    content: AI_CREATOR_1_CONTENT,
  },
  {
    id: 202,
    slug: "ai-creator-2",
    module: "ai-creator",
    title: "Prompt Engineering",
    subtitle: "Формула качественного промта: Subject + Style + Composition + Lighting + Modifiers.",
    tools: ["Midjourney"],
    videoMinutes: 14,
    estimatedPracticeMinutes: 30,
    status: "available",
    routeMode: "catalog",
    content: AI_CREATOR_2_CONTENT,
  },
  {
    id: 203,
    slug: "ai-creator-3",
    module: "ai-creator",
    title: "Фото-генерация",
    subtitle: "Фотореалистичные изображения через язык реальной фотографии.",
    tools: ["Midjourney"],
    videoMinutes: 14,
    estimatedPracticeMinutes: 30,
    status: "available",
    routeMode: "catalog",
    content: AI_CREATOR_3_CONTENT,
  },
  {
    id: 204,
    slug: "ai-creator-4",
    module: "ai-creator",
    title: "FaceSwap",
    subtitle: "Этичный FaceSwap: только своё лицо или с разрешением.",
    tools: ["Midjourney", "Akool", "InsightFaceSwap"],
    videoMinutes: 13,
    estimatedPracticeMinutes: 25,
    status: "available",
    routeMode: "catalog",
    content: AI_CREATOR_4_CONTENT,
  },
  {
    id: 205,
    slug: "ai-creator-5",
    module: "ai-creator",
    title: "Оживление фото",
    subtitle: "Image-to-video: превращаем статичный кадр в кинематографичный клип.",
    tools: ["Runway Gen-3", "Kling 2.0", "Luma Ray"],
    videoMinutes: 15,
    estimatedPracticeMinutes: 30,
    status: "available",
    routeMode: "catalog",
    content: AI_CREATOR_5_CONTENT,
  },
  {
    id: 206,
    slug: "ai-creator-6",
    module: "ai-creator",
    title: "ИИ Постеры",
    subtitle: "Визуал в Midjourney + типографика в Canva = профессиональный постер.",
    tools: ["Midjourney", "Canva"],
    videoMinutes: 14,
    estimatedPracticeMinutes: 35,
    status: "available",
    routeMode: "catalog",
    content: AI_CREATOR_6_CONTENT,
  },
  // Lessons 7–8 — smart vs vip split.
  {
    id: 207,
    slug: "ai-creator-7-smart",
    module: "ai-creator",
    title: "Видео-генерация",
    subtitle: "Text-to-video через Veo 3 / Kling: сценарий за 2 предложения.",
    tools: ["Veo 3", "Kling 2.0"],
    videoMinutes: 15,
    estimatedPracticeMinutes: 35,
    status: "available",
    routeMode: "catalog",
    tier: "smart",
    content: AI_CREATOR_7_SMART_CONTENT,
  },
  {
    id: 208,
    slug: "ai-creator-8-smart",
    module: "ai-creator",
    title: "Создание музыки с Lyria",
    subtitle: "Музыка под видео или настроение — за пару минут в Lyria.",
    tools: ["Lyria"],
    videoMinutes: 13,
    estimatedPracticeMinutes: 25,
    status: "available",
    routeMode: "catalog",
    tier: "smart",
    content: AI_CREATOR_8_SMART_CONTENT,
  },
  {
    id: 209,
    slug: "ai-creator-7-vip",
    module: "ai-creator",
    title: "Motion Control",
    subtitle: "Motion Brush и Camera Keyframes — режиссёрский контроль над движением.",
    tools: ["Runway Gen-3", "Kling Camera Control"],
    videoMinutes: 16,
    estimatedPracticeMinutes: 40,
    status: "available",
    routeMode: "catalog",
    tier: "vip",
    content: AI_CREATOR_7_VIP_CONTENT,
  },
  {
    id: 210,
    slug: "ai-creator-8-vip",
    module: "ai-creator",
    title: "Cinema Studio",
    subtitle: "Финал vip-трека: 30–60 секундный мини-фильм через Veo + CapCut + Lyria + ElevenLabs.",
    tools: ["Veo 3", "CapCut", "Lyria", "ElevenLabs"],
    videoMinutes: 18,
    estimatedPracticeMinutes: 60,
    status: "available",
    routeMode: "catalog",
    tier: "vip",
    content: AI_CREATOR_8_VIP_CONTENT,
  },
];

// Lesson 5 has its content inlined in edu-main but we already keep it inside
// the LESSONS array above, so no extra const needed.

// Attach homework definitions from lesson-homework.ts so each lesson knows
// its own submission spec without us repeating it inline 14 times.
function withHomework(lessons: StudyLesson[]): StudyLesson[] {
  return lessons.map((l) => {
    const hw = HOMEWORK_BY_SLUG[l.slug];
    return hw ? { ...l, homework: hw } : l;
  });
}

export const ALL_LESSONS: StudyLesson[] = [
  ...withHomework(LESSONS_AI_CREATOR),
  ...withHomework(LESSONS),
  ...withHomework(LESSONS_AI_STUDENT),
];

export function getLessonHomework(slug: string): LessonHomework | undefined {
  return getLessonBySlug(slug)?.homework;
}

export const COURSE_TOTAL_LESSONS = ALL_LESSONS.length;
export const COURSE_DESCRIPTION = `Курс из ${COURSE_TOTAL_LESSONS} уроков. От первого разговора с ИИ до автономных агентов.`;

/**
 * Lessons in the given module, optionally filtered by tier.
 *
 * Tier-tagged lessons (e.g. ai-creator 7-smart vs 7-vip) are visible only to
 * matching students. Untagged lessons are visible to everyone. If `tier` is
 * not provided, all tier-tagged lessons fall through — useful for admin views,
 * static-param generation and unit tests.
 */
export function getLessonsByModule(moduleSlug: ModuleSlug, tier?: "smart" | "vip"): StudyLesson[] {
  return ALL_LESSONS.filter((l) => {
    if (l.module !== moduleSlug) return false;
    if (l.tier && tier && l.tier !== tier) return false;
    return true;
  });
}

export function getLessonBySlug(slug: string): StudyLesson | undefined {
  return ALL_LESSONS.find((l) => l.slug === slug);
}

export function getLessonById(id: number): StudyLesson | undefined {
  return ALL_LESSONS.find((l) => l.id === id);
}

export function getNextLesson(currentId: number): StudyLesson | undefined {
  const current = getLessonById(currentId);
  if (!current) return undefined;
  const sameModule = getLessonsByModule(current.module);
  const idx = sameModule.findIndex((l) => l.id === currentId);
  return idx >= 0 ? sameModule[idx + 1] : undefined;
}

export function getLessonContent(slug: string): StudyLessonContent | undefined {
  return getLessonBySlug(slug)?.content;
}

export function getLessonSteps(slug: string): StudyStep[] {
  return getLessonContent(slug)?.steps ?? [];
}

export function getLessonStep(slug: string, n: number): StudyStep | undefined {
  return getLessonSteps(slug).find((step) => step.n === n);
}

export function getLessonTotalSteps(slug: string): number {
  return getLessonSteps(slug).length;
}

export function getLessonHref(slug: string): string {
  return `/study/${slug}`;
}

export function getLessonStepHref(slug: string, n: number): string {
  return `${getLessonHref(slug)}/step/${n}`;
}

interface ProgressSnapshot {
  practiceSteps?: Set<string>;
  workSubmitted?: boolean;
}

export function isLessonStepDone(step: StudyStep, progress?: ProgressSnapshot): boolean {
  if (step.completion.type === "submission") return Boolean(progress?.workSubmitted);
  return Boolean(progress?.practiceSteps?.has(step.completion.key));
}

export function getLessonDoneStepsCount(slug: string, progress?: ProgressSnapshot): number {
  return getLessonSteps(slug).filter((step) => isLessonStepDone(step, progress)).length;
}

export function areAllLessonStepsDone(slug: string, progress?: ProgressSnapshot): boolean {
  const steps = getLessonSteps(slug);
  return steps.length > 0 && steps.every((step) => isLessonStepDone(step, progress));
}

export function findFirstIncompleteLessonStep(slug: string, progress?: ProgressSnapshot): number {
  const steps = getLessonSteps(slug);
  const firstIncomplete = steps.find((step) => !isLessonStepDone(step, progress));
  if (firstIncomplete) return firstIncomplete.n;
  return steps.at(-1)?.n ?? 1;
}
