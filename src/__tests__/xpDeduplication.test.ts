/**
 * Tests for XP deduplication via the sourceId ledger in userStore.addXP.
 *
 * Each unique sourceId can be awarded XP only once, regardless of how many
 * times addXP is called. This prevents double-award when:
 *   - The page remounts after step completion
 *   - Server reconciliation re-emits events for already-completed steps
 *   - The user navigates away and back
 */

import { describe, it, expect, beforeEach } from "vitest";
import { useUserStore } from "@/store/userStore";
import type { User } from "@/types";

const TEST_USER: User = {
  id: "test-student",
  name: "Test User",
  email: "test",
  avatarId: "avatar_1",
  role: "student",
};

function resetStore() {
  useUserStore.setState({
    user: TEST_USER,
    xp: 0,
    streak: 0,
    purchasedIds: [],
    xpPopup: { visible: false, amount: 0 },
    toast:   { visible: false, title: "" },
  });
}

beforeEach(() => {
  localStorage.clear();
  resetStore();
});

// ─── Basic award ──────────────────────────────────────────────────────────────

describe("addXP — basic", () => {
  it("awards XP when no sourceId is given", () => {
    useUserStore.getState().addXP(20);
    expect(useUserStore.getState().xp).toBe(20);
  });

  it("awards XP multiple times without sourceId (transient)", () => {
    useUserStore.getState().addXP(10);
    useUserStore.getState().addXP(10);
    expect(useUserStore.getState().xp).toBe(20);
  });
});

// ─── Idempotency via sourceId ─────────────────────────────────────────────────

describe("addXP — idempotency", () => {
  it("awards XP exactly once for a given sourceId", () => {
    const src = "step:lesson-codex-1:review";
    useUserStore.getState().addXP(20, src);
    useUserStore.getState().addXP(20, src); // duplicate — must be ignored
    expect(useUserStore.getState().xp).toBe(20);
  });

  it("awards XP for distinct sourceIds independently", () => {
    useUserStore.getState().addXP(20, "step:lesson-codex-1:review");
    useUserStore.getState().addXP(30, "step:lesson-codex-1:practice");
    expect(useUserStore.getState().xp).toBe(50);
  });

  it("does not award on a third call with the same sourceId", () => {
    const src = "step:lesson-codex-1:homework";
    useUserStore.getState().addXP(50, src);
    useUserStore.getState().addXP(50, src);
    useUserStore.getState().addXP(50, src);
    expect(useUserStore.getState().xp).toBe(50);
  });
});

// ─── Ledger persistence ───────────────────────────────────────────────────────

describe("addXP — ledger persists across store reads", () => {
  it("ledger entry survives store state replacement (simulates remount)", () => {
    const src = "step:lesson-codex-1:review";

    // First award
    useUserStore.getState().addXP(20, src);
    expect(useUserStore.getState().xp).toBe(20);

    // Simulate store state being reset (e.g. page re-mount reads XP from storage)
    // The ledger in localStorage should still prevent a second award.
    useUserStore.setState({ xp: 20 }); // keeps xp, simulates reload

    // Second call with same sourceId — ledger in localStorage should block it
    useUserStore.getState().addXP(20, src);
    expect(useUserStore.getState().xp).toBe(20); // unchanged
  });
});
