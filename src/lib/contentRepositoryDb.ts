/**
 * DB-backed ContentRepository — NOT YET IMPLEMENTED.
 *
 * This is the placeholder contract for migrating lesson content from
 * static TypeScript files to a database (Supabase) or CMS (Sanity, Contentful).
 *
 * ── Migration plan ────────────────────────────────────────────────────────────
 *
 * Step 1 — Create tables in Supabase:
 *   slides (id, lesson_id, order, title, content, image_url, tip, highlight, ...)
 *   questions (id, lesson_id, order, type, text, options jsonb, correct_ids text[], ...)
 *   homework (id, lesson_id, title, description, checklist jsonb, submit_type, deadline)
 *
 * Step 2 — Seed from static data (one-time migration):
 *   npx tsx scripts/seedContent.ts
 *   (Write this script to INSERT all slides/questions/homework from src/data/ into Supabase)
 *
 * Step 3 — Implement this repository using the Supabase client:
 *   import { createClient } from "@supabase/supabase-js";
 *   const client = createClient(url, serviceKey);
 *
 *   getSlides: async (lessonId) => {
 *     const { data } = await client.from("slides")
 *       .select("*").eq("lesson_id", lessonId).order("order");
 *     return data ?? [];
 *   }
 *
 * Step 4 — Switch the export in contentRepository.ts:
 *   export const contentRepository: ContentRepository = dbContentRepository;
 *
 * ── Note on sync vs async ─────────────────────────────────────────────────────
 * The ContentRepository interface is currently synchronous.
 * When switching to async DB calls, update the interface to return Promises
 * and add a useContent(lessonId) hook that wraps with useState + useEffect.
 * All lesson pages already import through contentRepository, so only those
 * two files need to change.
 * ──────────────────────────────────────────────────────────────────────────────
 */

import type { ContentRepository } from "./contentRepository";

export const dbContentRepository: ContentRepository = {
  getSlides(_lessonId: string) {
    throw new Error(
      "dbContentRepository.getSlides is not implemented. " +
      "See src/lib/contentRepositoryDb.ts for the migration plan.",
    );
  },

  getQuestions(_lessonId: string) {
    throw new Error(
      "dbContentRepository.getQuestions is not implemented.",
    );
  },

  getHomework(_lessonId: string) {
    throw new Error(
      "dbContentRepository.getHomework is not implemented.",
    );
  },
};
