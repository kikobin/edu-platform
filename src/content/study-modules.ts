import type { StudyModule } from "@/types/study";
import { getLessonsByModule } from "@/content/study-lessons";

export const MODULES: StudyModule[] = [
  {
    id: 1,
    slug: "ai-creator",
    title: "AI Creator",
    subtitle: "Создаём фото, видео и музыку с помощью нейросетей.",
    // Module total is 8 (6 common + 2 tier-specific). Each student sees 8 lessons,
    // even though the array stores 10 (smart and vip variants of 7-8 coexist).
    lessonCount: 8,
    status: "available",
  },
  {
    id: 2,
    slug: "ai-student",
    title: "AI Student",
    subtitle: "Учимся и работаем эффективнее с ИИ-инструментами.",
    lessonCount: getLessonsByModule("ai-student").length,
    status: "available",
  },
  {
    id: 3,
    slug: "vibecoding",
    title: "Vibecoding",
    subtitle: "Программирование через диалог с ИИ — от идеи до сайта.",
    lessonCount: getLessonsByModule("vibecoding").length,
    status: "available",
  },
];

export function getModuleBySlug(slug: string): StudyModule | undefined {
  return MODULES.find((m) => m.slug === slug);
}
