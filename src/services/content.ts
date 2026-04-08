/**
 * Async content service — thin async wrapper over ContentRepository.
 *
 * Use this in Server Components and API routes where async is natural.
 * Client components use `contentRepository` directly via useMemo.
 *
 * To migrate to a real CMS: update the implementation in
 * `src/lib/contentRepository.ts` — this file needs no changes.
 */

import { contentRepository } from "@/lib/contentRepository";
import type { Lesson } from "@/types";
import { lessons as _lessons } from "@/data/lessons";

export async function getLessons(): Promise<Lesson[]> {
  return _lessons;
}

export async function getLesson(id: string): Promise<Lesson | null> {
  return _lessons.find((l) => l.id === id) ?? null;
}

export async function getSlides(lessonId: string) {
  return contentRepository.getSlides(lessonId);
}

export async function getQuestions(lessonId: string) {
  return contentRepository.getQuestions(lessonId);
}

export async function getHomework(lessonId: string) {
  return contentRepository.getHomework(lessonId);
}
