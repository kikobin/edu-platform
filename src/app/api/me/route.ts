import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/requireAuth";
import { createSupabaseAdmin } from "@/lib/supabaseServer";

/**
 * GET /api/me
 * Returns the current authenticated user's profile.
 * Also computes and persists streak server-side based on last_visit_date.
 * Used by useSession to verify the session is still valid on app load.
 */
export async function GET() {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const supabase = createSupabaseAdmin();
  const { data: profile } = await supabase
    .from("profiles")
    .select("xp, title_id, frame_id, streak, last_visit_date")
    .eq("id", auth.authId)
    .single();

  // ── Streak computation ─────────────────────────────────────────────────────
  const today = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
  const lastVisit = profile?.last_visit_date as string | null ?? null;
  const prevStreak = profile?.streak ?? 1;

  let newStreak = prevStreak;
  let shouldUpdate = false;

  if (lastVisit === null) {
    // First ever visit
    newStreak = 1;
    shouldUpdate = true;
  } else if (lastVisit < today) {
    // Not yet visited today — compute streak delta
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const wasYesterday = lastVisit === yesterday.toISOString().slice(0, 10);
    newStreak = wasYesterday ? prevStreak + 1 : 1;
    shouldUpdate = true;
  }
  // lastVisit === today → already recorded, no update needed

  if (shouldUpdate) {
    await supabase
      .from("profiles")
      .update({ streak: newStreak, last_visit_date: today })
      .eq("id", auth.authId);
  }

  return NextResponse.json({
    id:       auth.appUserId,
    name:     auth.name,
    role:     auth.role,
    avatarId: auth.avatarId,
    xp:       profile?.xp ?? 0,
    titleId:  profile?.title_id ?? null,
    frameId:  profile?.frame_id ?? null,
    streak:   newStreak,
  });
}
