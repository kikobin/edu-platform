import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { requireAuth } from "@/lib/auth/requireAuth";
import { createSupabaseAdmin } from "@/lib/supabaseServer";

/**
 * GET /api/me
 * Returns the current authenticated user's profile.
 * Also computes and persists streak server-side based on last_visit_date.
 * Used by useSession to verify the session is still valid on app load.
 * Accepts ?tzOffset=<minutes> (same sign as Date.getTimezoneOffset()) for local-date streak.
 */
export async function GET(request: Request) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  try {
    const supabase = createSupabaseAdmin();
    const { data: profile } = await supabase
      .from("profiles")
      .select("xp, title_id, frame_id, streak, last_visit_date, tier")
      .eq("id", auth.authId)
      .single();

    // ── Streak computation ─────────────────────────────────────────────────────
    // Honour the client's local timezone so a user at 23:50 UTC+5 doesn't lose
    // their streak just because the server clock rolled over to the next UTC day.
    const rawOffset = new URL(request.url).searchParams.get("tzOffset");
    const tzOffsetMin = (() => {
      const n = rawOffset ? parseInt(rawOffset, 10) : NaN;
      return Number.isFinite(n) && Math.abs(n) <= 14 * 60 ? n : 0;
    })();
    const localDate = (d: Date) => {
      const shifted = new Date(d.getTime() - tzOffsetMin * 60_000);
      return shifted.toISOString().slice(0, 10);
    };

    const today = localDate(new Date());
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
      const yDate = new Date();
      yDate.setDate(yDate.getDate() - 1);
      const wasYesterday = lastVisit === localDate(yDate);
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
      tier:     profile?.tier ?? null,
    });
  } catch (err) {
    Sentry.captureException(err, { tags: { route: "GET /api/me" } });
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
