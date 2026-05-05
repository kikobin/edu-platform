"use client";

import { storage } from "@/lib/storage";

/**
 * Tiny localStorage-backed store for prompts assembled in PromptBuilder steps
 * and consumed by later SendPrompt steps within the same lesson.
 * Keys are namespaced per (userId, lessonSlug, promptKey).
 */

function key(userId: string, lessonSlug: string, promptKey: string): string {
  return `prompt_${userId}_${lessonSlug}_${promptKey}`;
}

export function getSavedPrompt(
  userId: string | null,
  lessonSlug: string,
  promptKey: string
): string | null {
  if (!userId) return null;
  return storage.get<string>(key(userId, lessonSlug, promptKey));
}

export function saveSavedPrompt(
  userId: string | null,
  lessonSlug: string,
  promptKey: string,
  value: string
): void {
  if (!userId) return;
  storage.set(key(userId, lessonSlug, promptKey), value);
}
