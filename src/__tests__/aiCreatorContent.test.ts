/**
 * Smoke-tests for the AI Creator module content. These guard the silent
 * regressions that typecheck won't catch:
 *  - PromptGallery preview paths point at files that actually exist on disk.
 *  - targetUrl is well-formed.
 *  - No Higgsfield CDN URLs leaked into shipped data (must be local /public).
 *  - Each ai-creator lesson has a `submission` step (the "stop-lesson" gate).
 */

import { describe, it, expect } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import { ALL_LESSONS } from "@/content/study-lessons";
import type { PromptGalleryContent, StudyStep } from "@/types/study";

const PUBLIC_DIR = path.resolve(__dirname, "../../public");
const HIGGSFIELD_HOST = "d8j0ntlcm91z4.cloudfront.net";

function isPromptGallery(step: StudyStep): step is StudyStep & { content: PromptGalleryContent } {
  return step.kind === "prompt-gallery" && Boolean(step.content);
}

const aiCreatorLessons = ALL_LESSONS.filter((l) => l.module === "ai-creator");

describe("ai-creator content", () => {
  it("module has lessons", () => {
    expect(aiCreatorLessons.length).toBeGreaterThan(0);
  });

  describe.each(aiCreatorLessons.filter((l) => l.content))("$slug — $title", (lesson) => {
    const steps = lesson.content!.steps;

    it("has at least one submission step (stop-lesson)", () => {
      const submissions = steps.filter((s) => s.completion.type === "submission");
      expect(submissions.length, `${lesson.slug} must have a submission step`).toBeGreaterThanOrEqual(1);
    });

    const galleries = steps.filter(isPromptGallery);

    if (galleries.length > 0) {
      describe.each(galleries)("step $n: $title (prompt-gallery)", (step) => {
        const gallery = step.content as PromptGalleryContent;

        it("has targetTool", () => {
          expect(gallery.targetTool, `${lesson.slug} step ${step.n} missing targetTool`).toBeTruthy();
        });

        if (gallery.targetUrl) {
          it("targetUrl is a valid URL", () => {
            expect(() => new URL(gallery.targetUrl!)).not.toThrow();
          });
        }

        it("has at least one item", () => {
          expect(gallery.items.length).toBeGreaterThan(0);
        });

        it.each(gallery.items)("item $id has prompt + label", (item) => {
          expect(item.label).toBeTruthy();
          expect(item.prompt.trim().length, `prompt for ${item.id} is empty`).toBeGreaterThan(10);
        });

        it("preview images (when set) exist on disk and are local", () => {
          for (const item of gallery.items) {
            if (!item.previewImageUrl) continue;
            // Locked to local /public paths — Higgsfield CDN URLs expire.
            expect(
              item.previewImageUrl.includes(HIGGSFIELD_HOST),
              `${lesson.slug} ${item.id}: previewImageUrl points to Higgsfield CDN — download to /public/ai-creator/preview/ instead`,
            ).toBe(false);
            if (item.previewImageUrl.startsWith("/")) {
              const abs = path.join(PUBLIC_DIR, item.previewImageUrl);
              expect(fs.existsSync(abs), `${lesson.slug} ${item.id}: file not found at ${abs}`).toBe(true);
            }
          }
        });
      });
    }
  });
});
