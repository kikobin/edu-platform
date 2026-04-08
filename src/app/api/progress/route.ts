import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { requireAuth } from "@/lib/auth/requireAuth";
import { supabase } from "@/lib/supabase";
import { createSupabaseAdmin } from "@/lib/supabaseServer";

/**
 * GET /api/progress
 * Returns the authenticated student's XP + per-lesson progress from Supabase.
 */
export async function GET() {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const userId = auth.appUserId;

  try {
    const admin = createSupabaseAdmin();

    // Read XP from profiles — the authoritative source updated by awardXP.
    // Do NOT use user_progress.xp: it is written by the client and can lag or diverge.
    const [profileResult, lessonProgressRows, submissionRows, purchasedIds] = await Promise.all([
      admin.from("profiles").select("xp").eq("app_user_id", userId).single(),
      supabase.getLessonProgressByUser(userId),
      supabase.getSubmissionsByUser(userId),
      supabase.getPurchasesByUser(userId),
    ]);

    const xp = (profileResult.data?.xp as number | null) ?? 0;

    const lessons = lessonProgressRows.map((lp) => {
      const sub = submissionRows.find((s) => s.lesson_id === lp.lesson_id);
      return {
        lessonId:       lp.lesson_id,
        videoDone:      lp.video_done,
        reviewDone:     lp.review_done,
        practiceDone:   lp.practice_done,
        practiceScore:  lp.practice_score,
        homeworkDone:   sub != null,
        homeworkStatus: sub?.status ?? null,
      };
    });

    for (const sub of submissionRows) {
      const already = lessons.find((l) => l.lessonId === sub.lesson_id);
      if (!already) {
        lessons.push({
          lessonId:       sub.lesson_id,
          videoDone:      false,
          reviewDone:     true,
          practiceDone:   true,
          practiceScore:  0,
          homeworkDone:   true,
          homeworkStatus: sub.status,
        });
      }
    }

    return NextResponse.json({ xp, lessons, purchasedIds });
  } catch (err) {
    Sentry.captureException(err, { tags: { route: "GET /api/progress" }, user: { id: userId } });
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  try {
    const { userId, name, avatarId, xp } = await request.json();

    if (!userId || typeof xp !== "number") {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    // Users can only update their own progress
    if (auth.appUserId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await supabase.upsertProgress({
      user_id:   userId,
      name:      String(name ?? userId),
      avatar_id: String(avatarId ?? "avatar_1"),
      xp:        Math.max(0, Math.floor(xp)),
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    Sentry.captureException(err, { tags: { route: "POST /api/progress" } });
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE() {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  try {
    const admin = createSupabaseAdmin();
    const baseAvatarId = auth.avatarId || "avatar_1";

    const [lessonProgressResult, submissionsResult, notificationsResult, purchasesResult, xpEventsResult, userProgressResult, profileResult] = await Promise.all([
      admin.from("lesson_progress").delete().eq("user_id", auth.appUserId),
      admin.from("submissions").delete().eq("user_id", auth.appUserId),
      admin.from("notifications").delete().eq("user_id", auth.appUserId),
      admin.from("purchases").delete().eq("user_id", auth.authId),
      admin.from("xp_events").delete().eq("user_id", auth.authId),
      admin.from("user_progress").upsert({
        user_id: auth.appUserId,
        name: auth.name || auth.appUserId,
        avatar_id: baseAvatarId,
        xp: 0,
      }, { onConflict: "user_id" }),
      admin.from("profiles").update({
        xp: 0,
        avatar_id: baseAvatarId,
        title_id: null,
        frame_id: null,
      }).eq("id", auth.authId),
    ]);

    for (const [label, result] of [
      ["lesson_progress", lessonProgressResult],
      ["submissions", submissionsResult],
      ["notifications", notificationsResult],
      ["purchases", purchasesResult],
      ["xp_events", xpEventsResult],
      ["user_progress", userProgressResult],
      ["profiles", profileResult],
    ] as const) {
      if (result.error) {
        throw new Error(`${label}: ${result.error.message}`);
      }
    }

    return NextResponse.json({
      ok: true,
      xp: 0,
      lessons: [],
      purchasedIds: [],
      avatarId: baseAvatarId,
      titleId: null,
      frameId: null,
    });
  } catch (err) {
    Sentry.captureException(err, { tags: { route: "DELETE /api/progress" }, user: { id: auth.appUserId } });
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
