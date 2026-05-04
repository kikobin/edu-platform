import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { requireAuth } from "@/lib/auth/requireAuth";
import { createSupabaseAdmin } from "@/lib/supabaseServer";
import { rateLimit } from "@/lib/rateLimit";
import { parseBody, LessonProgressSchema } from "@/lib/validation/schemas";

export async function POST(request: Request) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  if (!rateLimit(`lesson:${auth.authId}`, { limit: 30, windowMs: 60_000 })) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const body = await parseBody(request, LessonProgressSchema);
  if (body instanceof NextResponse) return body;

  const { userId, lessonId, videoDone, reviewDone, practiceDone, practiceScore } = body;

  if (auth.appUserId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const safeScore = typeof practiceScore === "number" ? Math.max(0, Math.floor(practiceScore)) : 0;
    const admin = createSupabaseAdmin();

    // Monotonic upsert: boolean progress flags and practice_score only move forward.
    // Implemented in TypeScript so it works without a DB migration.
    // Read current row → merge → write back.
    const { data: existing } = await admin
      .from("lesson_progress")
      .select("video_done, review_done, practice_done, practice_score")
      .eq("user_id", userId)
      .eq("lesson_id", lessonId)
      .maybeSingle();

    const merged = {
      user_id:        userId,
      lesson_id:      lessonId,
      video_done:     Boolean(videoDone)    || (existing?.video_done    ?? false),
      review_done:    Boolean(reviewDone)   || (existing?.review_done   ?? false),
      practice_done:  Boolean(practiceDone) || (existing?.practice_done ?? false),
      practice_score: Math.max(safeScore,       existing?.practice_score ?? 0),
      updated_at:     new Date().toISOString(),
    };

    const { error } = await admin
      .from("lesson_progress")
      .upsert(merged, { onConflict: "user_id,lesson_id" });

    if (error) throw new Error(error.message);

    return NextResponse.json({ ok: true });
  } catch (err) {
    Sentry.captureException(err, { tags: { route: "POST /api/progress/lesson" } });
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
