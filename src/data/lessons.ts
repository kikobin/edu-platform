import type { Lesson } from "@/types";
import { XP_REWARDS } from "@/types";

const videoStep = (videoId?: string) => ({
  id: "video",
  type: "video" as const,
  label: "Видеоурок",
  description: "Посмотри видео — обязательный первый шаг урока",
  doneTip: "Видео просмотрено",
  icon: "🎬",
  xpReward: XP_REWARDS.VIDEO_DONE,
  estimatedMin: 10,
  route: "video",
  videoId,
});

const reviewStep = {
  id: "review",
  type: "content" as const,
  label: "Повторение",
  description: "Читай слайды и вникай в ключевые идеи урока",
  doneTip: "Материал повторён",
  icon: "📖",
  xpReward: XP_REWARDS.REVIEW_DONE,
  estimatedMin: 5,
  route: "review",
};

const practiceStep = {
  id: "practice",
  type: "quiz" as const,
  label: "Закрепление",
  description: "Ответь на вопросы и проверь, как усвоил материал",
  doneTip: "Тест пройден",
  icon: "✏️",
  xpReward: XP_REWARDS.PRACTICE_DONE,
  estimatedMin: 8,
  route: "practice",
  minPassScore: 0,
};

const homeworkStep = {
  id: "homework",
  type: "homework" as const,
  label: "Домашнее задание",
  description: "Выполни задание самостоятельно и загрузи результат",
  doneTip: "Домашка сдана",
  icon: "📝",
  xpReward: XP_REWARDS.HOMEWORK_DONE,
  estimatedMin: 15,
  route: "homework",
};

export const lessons: Lesson[] = [
  {
    id: "lesson-1",
    order: 1,
    title: "Кибер-Дирижер. Философия вайбкодинга и агентности",
    description: "Разбираемся, что такое вайбкодинг, зачем нужна агентность и как мыслить как режиссёр цифрового мира.",
    topic: "Философия",
    steps: [videoStep("FhIhKN_wJe0"), reviewStep, practiceStep, homeworkStep],
  },
  {
    id: "lesson-2",
    order: 2,
    title: "Gamma — презентации и сторителлинг будущего",
    description: "Создаём красивые презентации с помощью ИИ, учимся рассказывать истории через визуал.",
    topic: "Gamma",
    steps: [videoStep("FhIhKN_wJe0"), reviewStep, practiceStep, homeworkStep],
  },
  {
    id: "lesson-3",
    order: 3,
    title: "Дизайн будущего в Canva AI: от идеи к визуальному концепту",
    description: "Используем Canva AI для создания профессиональных визуальных концептов без опыта в дизайне.",
    topic: "Canva AI",
    steps: [videoStep("FhIhKN_wJe0"), reviewStep, practiceStep, homeworkStep],
  },
  {
    id: "lesson-4",
    order: 4,
    title: "Tilda — профессиональный крафт и Zero Block",
    description: "Осваиваем Zero Block в Tilda для создания уникальных сайтов с полным контролем над дизайном.",
    topic: "Tilda",
    steps: [videoStep("FhIhKN_wJe0"), reviewStep, practiceStep, homeworkStep],
  },
  {
    id: "lesson-codex-1",
    order: 5,
    title: "Создаём первый сайт через Codex",
    description: "Повторяем и закрепляем весь путь: от идеи до готового сайта в браузере через Codex + skill.",
    topic: "Codex",
    steps: [videoStep("FhIhKN_wJe0"), reviewStep, practiceStep, homeworkStep],
  },
  {
    id: "lesson-netlify-5",
    order: 6,
    title: "Улучшаем сайт и публикуем через Netlify",
    description: "Закрепляем маршрут: улучшение сайта через skill, проверка новой версии и публикация через Netlify.",
    topic: "Netlify",
    steps: [videoStep("FhIhKN_wJe0"), reviewStep, practiceStep, homeworkStep],
  },
  {
    id: "lesson-7",
    order: 7,
    title: "Основы автоматизации в Robochat AI: создание первого Telegram-бота",
    description: "Строим первого Telegram-бота с нуля: логика, сценарии, автоответы и подключение к Robochat AI.",
    topic: "Robochat AI",
    steps: [videoStep("FhIhKN_wJe0"), reviewStep, practiceStep, homeworkStep],
  },
  {
    id: "lesson-8",
    order: 8,
    title: "Интеллектуальные боты: интеграция Make, AI API Tokens и ИИ-агентов",
    description: "Подключаем Make, AI API и создаём интеллектуального бота, который думает и действует самостоятельно.",
    topic: "Make & AI API",
    steps: [videoStep("FhIhKN_wJe0"), reviewStep, practiceStep, homeworkStep],
  },
];
