/**
 * Content Repository — data layer abstraction.
 *
 * Components import content through this interface instead of directly from
 * individual data files. When migrating to a CMS or API, swap the
 * implementation here — nothing in the components changes.
 *
 * Current implementation: static JSON data bundled at build time.
 * Future implementations: Sanity, Contentful, Supabase, or any REST/GraphQL API.
 *
 * ── Async migration path ─────────────────────────────────────────────────────
 * The interface is synchronous today because components use `useMemo`.
 * To migrate to an async CMS: introduce `useContent(lessonId)` hooks that
 * wrap this repository with `useState` + `useEffect` and return
 * `{ data, loading, error }`. Then switch the implementation to async.
 * No component logic changes beyond the hook call site.
 */

import type { Slide, Question, Homework } from "@/types";
import { slides }       from "@/data/slides";
import { questions }    from "@/data/questions";
import { homeworkList } from "@/data/homework";

// ─── Interface ────────────────────────────────────────────────────────────────

export interface ContentRepository {
  /** Returns slides for a lesson, sorted by order. */
  getSlides(lessonId: string): Slide[];
  /** Returns questions for a lesson, sorted by order. */
  getQuestions(lessonId: string): Question[];
  /** Returns the homework assignment for a lesson, or null if none. */
  getHomework(lessonId: string): Homework | null;
}

// ─── Static implementation ────────────────────────────────────────────────────

const staticContentRepository: ContentRepository = {
  getSlides(lessonId) {
    return slides
      .filter((s) => s.lessonId === lessonId)
      .sort((a, b) => a.order - b.order);
  },

  getQuestions(lessonId) {
    return questions
      .filter((q) => q.lessonId === lessonId)
      .sort((a, b) => a.order - b.order);
  },

  getHomework(lessonId) {
    return homeworkList.find((h) => h.lessonId === lessonId) ?? null;
  },
};

// ─── Singleton export — swap this to change the data source everywhere ────────

export const contentRepository: ContentRepository = staticContentRepository;
