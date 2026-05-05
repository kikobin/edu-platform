/**
 * Tier-based lesson filtering. ai-creator lessons 7 and 8 are split into
 * smart and vip variants; students must see only the variant matching their
 * subscription tier.
 */

import { describe, it, expect } from "vitest";
import { getLessonsByModule } from "@/content/study-lessons";

describe("getLessonsByModule with tier filter", () => {
  it("returns common lessons regardless of tier", () => {
    const smart = getLessonsByModule("ai-creator", "smart");
    const vip = getLessonsByModule("ai-creator", "vip");
    const common = smart.filter((l) => !l.tier).map((l) => l.slug);
    const commonInVip = vip.filter((l) => !l.tier).map((l) => l.slug);
    expect(common).toEqual(commonInVip);
    expect(common.length).toBeGreaterThan(0);
  });

  it("smart students see only smart-tier-restricted lessons", () => {
    const smart = getLessonsByModule("ai-creator", "smart");
    const vipOnly = smart.filter((l) => l.tier === "vip");
    expect(vipOnly).toEqual([]);
  });

  it("vip students see only vip-tier-restricted lessons", () => {
    const vip = getLessonsByModule("ai-creator", "vip");
    const smartOnly = vip.filter((l) => l.tier === "smart");
    expect(smartOnly).toEqual([]);
  });

  it("smart and vip see different lessons 7 and 8", () => {
    const smart = getLessonsByModule("ai-creator", "smart").filter((l) => l.tier === "smart");
    const vip = getLessonsByModule("ai-creator", "vip").filter((l) => l.tier === "vip");
    expect(smart.length).toBeGreaterThan(0);
    expect(vip.length).toBeGreaterThan(0);
    const smartSlugs = new Set(smart.map((l) => l.slug));
    const vipSlugs = new Set(vip.map((l) => l.slug));
    // No overlap — vip students never see smart-only lessons and vice versa.
    Array.from(smartSlugs).forEach((slug) => {
      expect(vipSlugs.has(slug)).toBe(false);
    });
  });

  it("without tier argument returns all (admin/preview view)", () => {
    const all = getLessonsByModule("ai-creator");
    const smart = getLessonsByModule("ai-creator", "smart");
    const vip = getLessonsByModule("ai-creator", "vip");
    expect(all.length).toBeGreaterThanOrEqual(smart.length);
    expect(all.length).toBeGreaterThanOrEqual(vip.length);
  });

  it("modules without tier-split (ai-student, vibecoding) ignore tier", () => {
    const aiStudentSmart = getLessonsByModule("ai-student", "smart").map((l) => l.slug);
    const aiStudentVip = getLessonsByModule("ai-student", "vip").map((l) => l.slug);
    expect(aiStudentSmart).toEqual(aiStudentVip);
  });
});
