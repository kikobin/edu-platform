/**
 * Tests for awardXP() — the server-side XP ledger primitive.
 *
 * Real awardXP talks to Supabase. Here we inject a fake client that mirrors
 * the production schema's UNIQUE(user_id, source_id) constraint on xp_events:
 * a duplicate (user_id, source_id) insert is dropped, then total is recomputed
 * from all surviving rows. profiles.xp is kept in sync as a denormalized cache.
 *
 * These tests cover the contract that awardXP itself owns:
 *   - first insert credits the amount
 *   - duplicate sourceId is a no-op (idempotent)
 *   - distinct sourceIds accumulate
 *   - profiles.xp matches the sum of xp_events
 */

import { describe, it, expect, beforeEach } from "vitest";
import { awardXP } from "@/lib/awardXP";

interface XPEvent {
  user_id: string;
  source_id: string;
  amount: number;
}

interface ProfileRow {
  id: string;
  xp: number;
}

/** Build a fake supabase client that mirrors the production constraints. */
function makeFakeClient() {
  const xpEvents: XPEvent[] = [];
  const profiles = new Map<string, ProfileRow>();

  // The chains awardXP uses:
  //   from("xp_events").insert({...})
  //   from("xp_events").select("amount").eq("user_id", id)
  //   from("profiles").update({ xp }).eq("id", id)
  function from(table: string) {
    if (table === "xp_events") {
      return {
        insert(row: XPEvent) {
          // UNIQUE(user_id, source_id) — drop duplicates silently
          const dup = xpEvents.some(
            (e) => e.user_id === row.user_id && e.source_id === row.source_id,
          );
          if (!dup) xpEvents.push(row);
          return Promise.resolve({ data: null, error: null });
        },
        select(_cols: string) {
          return {
            eq(_col: string, value: string) {
              const data = xpEvents
                .filter((e) => e.user_id === value)
                .map((e) => ({ amount: e.amount }));
              return Promise.resolve({ data, error: null });
            },
          };
        },
      };
    }
    if (table === "profiles") {
      return {
        update(patch: { xp: number }) {
          return {
            eq(_col: string, value: string) {
              profiles.set(value, { id: value, xp: patch.xp });
              return Promise.resolve({ data: null, error: null });
            },
          };
        },
      };
    }
    throw new Error(`unexpected table ${table}`);
  }

  return {
    client: { from } as unknown as Parameters<typeof awardXP>[3],
    xpEvents,
    profiles,
  };
}

const USER = "user-uuid-1";

describe("awardXP", () => {
  let fake: ReturnType<typeof makeFakeClient>;

  beforeEach(() => {
    fake = makeFakeClient();
  });

  it("credits the amount on first insert and returns the new total", async () => {
    const total = await awardXP(USER, "step:lesson-1:video", 25, fake.client);
    expect(total).toBe(25);
    expect(fake.xpEvents).toHaveLength(1);
    expect(fake.profiles.get(USER)?.xp).toBe(25);
  });

  it("is idempotent: duplicate sourceId does not double-credit", async () => {
    await awardXP(USER, "step:lesson-1:video", 25, fake.client);
    const total = await awardXP(USER, "step:lesson-1:video", 25, fake.client);
    expect(total).toBe(25);
    expect(fake.xpEvents).toHaveLength(1);
    expect(fake.profiles.get(USER)?.xp).toBe(25);
  });

  it("accumulates distinct sourceIds", async () => {
    await awardXP(USER, "step:lesson-1:video", 25, fake.client);
    await awardXP(USER, "step:lesson-1:practice", 30, fake.client);
    const total = await awardXP(USER, "step:lesson-1:homework:approved", 30, fake.client);
    expect(total).toBe(85);
    expect(fake.xpEvents).toHaveLength(3);
    expect(fake.profiles.get(USER)?.xp).toBe(85);
  });

  it("keeps profiles.xp in sync with xp_events sum across mixed calls", async () => {
    await awardXP(USER, "a", 10, fake.client);
    await awardXP(USER, "b", 20, fake.client);
    await awardXP(USER, "a", 10, fake.client); // dup
    await awardXP(USER, "c", 5, fake.client);
    const eventsSum = fake.xpEvents.reduce((s, e) => s + e.amount, 0);
    expect(fake.profiles.get(USER)?.xp).toBe(eventsSum);
    expect(eventsSum).toBe(35);
  });

  it("isolates per-user totals", async () => {
    await awardXP("user-a", "x", 100, fake.client);
    await awardXP("user-b", "x", 50, fake.client); // same sourceId, different user — must credit
    expect(fake.profiles.get("user-a")?.xp).toBe(100);
    expect(fake.profiles.get("user-b")?.xp).toBe(50);
  });

  it("ignores duplicate amount mismatches (DB constraint wins, not the caller)", async () => {
    // If a buggy caller passes a different amount on the second call with the
    // same sourceId, the duplicate is dropped — total stays at the first value.
    await awardXP(USER, "step:lesson-1:video", 25, fake.client);
    const total = await awardXP(USER, "step:lesson-1:video", 9999, fake.client);
    expect(total).toBe(25);
  });
});
