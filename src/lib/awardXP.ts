import "server-only";
import { createSupabaseAdmin } from "@/lib/supabaseServer";

export const XP_SOURCES = {
  videoDone:        (lessonId: string) => `step:${lessonId}:video`,
  reviewDone:       (lessonId: string) => `step:${lessonId}:review`,
  practiceDone:     (lessonId: string) => `step:${lessonId}:practice`,
  practiceBonus:    (lessonId: string) => `step:${lessonId}:practice:bonus`,
  homeworkSubmit:   (lessonId: string) => `step:${lessonId}:homework`,
  homeworkApproved: (lessonId: string) => `step:${lessonId}:homework:approved`,
};

/**
 * Awards XP idempotently.
 * Duplicate source_id per user = silently ignored (UNIQUE constraint).
 * Returns the user's new total XP.
 */
export async function awardXP(
  authUserId: string,
  sourceId: string,
  amount: number,
  supabase = createSupabaseAdmin()
): Promise<number> {

  // Insert — ON CONFLICT DO NOTHING deduplicates at DB level
  await supabase.from("xp_events").insert({
    user_id:   authUserId,
    source_id: sourceId,
    amount,
  });

  // Recompute total from events (always correct, not dependent on old value)
  const { data } = await supabase
    .from("xp_events")
    .select("amount")
    .eq("user_id", authUserId);

  const total = (data ?? []).reduce((sum, r) => sum + r.amount, 0);

  // Keep profiles.xp in sync as a denormalized cache for leaderboard queries
  await supabase
    .from("profiles")
    .update({ xp: total })
    .eq("id", authUserId);

  return total;
}

/**
 * Awards XP by legacy appUserId (student-1, etc.).
 * Looks up the Supabase UUID from the profiles table.
 * Returns null if the profile is not found.
 */
export async function awardXPByAppUserId(
  appUserId: string,
  sourceId: string,
  amount: number
): Promise<number | null> {
  const supabase = createSupabaseAdmin();
  const { data } = await supabase
    .from("profiles")
    .select("id")
    .eq("app_user_id", appUserId)
    .single();

  if (!data?.id) return null;
  return awardXP(data.id as string, sourceId, amount, supabase);
}

/**
 * Revokes XP by deleting the xp_events row for the given sourceId.
 * Unlike a negative event, this makes the sourceId reusable — if the same
 * action is repeated (e.g. homework re-approved after being reverted), the
 * XP can be earned again via the same sourceId.
 * Returns the user's new total XP, or null if the profile is not found.
 */
export async function revokeXPByAppUserId(
  appUserId: string,
  sourceId: string
): Promise<number | null> {
  const supabase = createSupabaseAdmin();
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("app_user_id", appUserId)
    .single();

  if (!profile?.id) return null;

  const authUserId = profile.id as string;

  // Delete the specific XP event — this frees up the sourceId for future re-use.
  await supabase
    .from("xp_events")
    .delete()
    .eq("user_id", authUserId)
    .eq("source_id", sourceId);

  // Recompute total from remaining events (always authoritative).
  const { data: events } = await supabase
    .from("xp_events")
    .select("amount")
    .eq("user_id", authUserId);

  const total = (events ?? []).reduce((sum: number, r: { amount: number }) => sum + r.amount, 0);

  // Keep profiles.xp in sync.
  await supabase
    .from("profiles")
    .update({ xp: total })
    .eq("id", authUserId);

  return total;
}
