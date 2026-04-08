/**
 * Tests for shop purchase flow:
 * - purchase() deducts XP and records itemId
 * - purchase() is idempotent (double-buy is a no-op)
 * - spendXP() rejects when balance is insufficient
 * - reconcilePurchases() merges server items forward-only
 * - reconcileXP() + purchase() interaction after server buy
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

function resetStore(xp = 500) {
  useUserStore.setState({
    user: TEST_USER,
    xp,
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

// ─── purchase() ───────────────────────────────────────────────────────────────

describe("purchase()", () => {
  it("deducts XP and records itemId on success", () => {
    const ok = useUserStore.getState().purchase("av_dragon", 200);
    expect(ok).toBe(true);
    expect(useUserStore.getState().xp).toBe(300);
    expect(useUserStore.getState().purchasedIds).toContain("av_dragon");
  });

  it("returns false and does not deduct XP if already owned", () => {
    useUserStore.getState().purchase("av_dragon", 200);
    const ok = useUserStore.getState().purchase("av_dragon", 200); // duplicate
    expect(ok).toBe(false);
    expect(useUserStore.getState().xp).toBe(300); // deducted only once
    expect(useUserStore.getState().purchasedIds.filter((id) => id === "av_dragon")).toHaveLength(1);
  });

  it("returns false and leaves XP unchanged if balance is insufficient", () => {
    resetStore(50);
    const ok = useUserStore.getState().purchase("av_dragon", 200);
    expect(ok).toBe(false);
    expect(useUserStore.getState().xp).toBe(50);
    expect(useUserStore.getState().purchasedIds).toHaveLength(0);
  });

  it("persists purchasedIds to localStorage", () => {
    useUserStore.getState().purchase("av_eagle", 150);
    const stored = JSON.parse(localStorage.getItem("edu_purchasedIds_test-student") ?? "[]");
    expect(stored).toContain("av_eagle");
  });

  it("can buy multiple different items", () => {
    useUserStore.getState().purchase("av_eagle", 150);
    useUserStore.getState().purchase("av_dragon", 200);
    expect(useUserStore.getState().xp).toBe(150);
    expect(useUserStore.getState().purchasedIds).toEqual(["av_eagle", "av_dragon"]);
  });
});

// ─── reconcilePurchases() ─────────────────────────────────────────────────────

describe("reconcilePurchases()", () => {
  it("adds server items missing from local state", () => {
    useUserStore.getState().reconcilePurchases(["av_dragon", "av_eagle"]);
    expect(useUserStore.getState().purchasedIds).toEqual(["av_dragon", "av_eagle"]);
  });

  it("does not duplicate items already in local state", () => {
    useUserStore.getState().purchase("av_dragon", 200);
    useUserStore.getState().reconcilePurchases(["av_dragon", "av_eagle"]);
    const ids = useUserStore.getState().purchasedIds;
    expect(ids.filter((id) => id === "av_dragon")).toHaveLength(1);
    expect(ids).toContain("av_eagle");
  });

  it("is a no-op when server list is a subset of local", () => {
    useUserStore.getState().purchase("av_dragon", 200);
    useUserStore.getState().purchase("av_eagle", 150);
    const before = useUserStore.getState().purchasedIds;
    useUserStore.getState().reconcilePurchases(["av_dragon"]);
    expect(useUserStore.getState().purchasedIds).toEqual(before);
  });

  it("persists merged list to localStorage", () => {
    useUserStore.getState().reconcilePurchases(["av_robot"]);
    const stored = JSON.parse(localStorage.getItem("edu_purchasedIds_test-student") ?? "[]");
    expect(stored).toContain("av_robot");
  });
});

// ─── reconcileXP() after server buy ──────────────────────────────────────────

describe("reconcileXP() after server confirms purchase", () => {
  it("sets XP to server value when server is lower post-purchase", () => {
    // Local state: 500 XP, then we do optimistic purchase locally
    useUserStore.getState().purchase("av_dragon", 200); // local XP = 300
    // Server returns newXP = 300 (same deduction)
    // reconcileXP is forward-only, so 300 <= 300 → no-op
    useUserStore.getState().reconcileXP(300);
    expect(useUserStore.getState().xp).toBe(300);
  });

  it("upgrades XP if server has more (e.g. concurrent award)", () => {
    useUserStore.getState().purchase("av_dragon", 200); // local = 300
    // Server awarded bonus XP concurrently → server total = 350
    useUserStore.getState().reconcileXP(350);
    expect(useUserStore.getState().xp).toBe(350);
  });
});
