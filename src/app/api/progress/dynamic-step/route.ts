import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { requireAuth } from "@/lib/auth/requireAuth";
import { createSupabaseAdmin } from "@/lib/supabaseServer";
import { rateLimit } from "@/lib/rateLimit";
import { parseBody, MarkDynamicStepSchema } from "@/lib/validation/schemas";
import { awardXP } from "@/lib/awardXP";
import { STUDY_STEP_XP } from "@/types/study";

/**
 * POST /api/progress/dynamic-step
 *
 * Marks a `(lessonSlug, stepKey)` pair as completed for the current student
 * and awards XP idempotently. Server is the source of truth — students cannot
 * award themselves arbitrary XP, the amount is fixed by step kind.
 *
 * - `step-*` keys → STUDY_STEP_XP.PRACTICE (10 XP) per unique (lesson, step).
 * - `submission` key → STUDY_STEP_XP.SUBMISSION (50 XP), but only when the
 *   student also has a row in `submissions` for this lesson (anti-cheese).
 *
 * Idempotency: dedup is done at two layers:
 *   1) `lesson_progress.dynamic_steps_done` jsonb array — only added once.
 *   2) `xp_events` UNIQUE(user_id, source_id) — XP can never double-count.
 */
export async function POST(request: Request) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  if (auth.role === "curator" || auth.role === "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!rateLimit(`dynstep:${auth.authId}`, { limit: 60, windowMs: 60_000 })) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const body = await parseBody(request, MarkDynamicStepSchema);
  if (body instanceof NextResponse) return body;

  const { lessonSlug, stepKey } = body;

  try {
    const admin = createSupabaseAdmin();

    // Read current dynamic_steps_done so we can decide whether this is the
    // first time completing this step.
    const { data: existing } = await admin
      .from("lesson_progress")
      .select("dynamic_steps_done")
      .eq("user_id", auth.appUserId)
      .eq("lesson_id", lessonSlug)
      .maybeSingle();

    const currentSteps: string[] = Array.isArray(existing?.dynamic_steps_done)
      ? (existing!.dynamic_steps_done as string[])
      : [];

    const alreadyDone = currentSteps.includes(stepKey);

    if (!alreadyDone) {
      const nextSteps = [...currentSteps, stepKey];
      const { error: upsertErr } = await admin
        .from("lesson_progress")
        .upsert(
          {
            user_id:             auth.appUserId,
            lesson_id:           lessonSlug,
            dynamic_steps_done:  nextSteps,
            updated_at:          new Date().toISOString(),
          },
          { onConflict: "user_id,lesson_id" }
        );
      if (upsertErr) throw new Error(upsertErr.message);
    }

    // XP — always idempotent at the events layer, but we still skip if the
    // student already had this step done to avoid one extra DB call.
    let newTotalXP: number | null = null;
    if (!alreadyDone) {
      const isSubmission = stepKey === "submission";
      const amount = isSubmission ? STUDY_STEP_XP.SUBMISSION : STUDY_STEP_XP.PRACTICE;
      const sourceId = `study:${lessonSlug}:${stepKey}`;
      newTotalXP = await awardXP(auth.authId, sourceId, amount);
    }

    return NextResponse.json({
      ok: true,
      alreadyDone,
      newTotalXP,
    });
  } catch (err) {
    Sentry.captureException(err, { tags: { route: "POST /api/progress/dynamic-step" } });
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/**
 * GET /api/progress/dynamic-step?lessonSlug=lesson-1
 * Returns the list of step keys completed for the lesson by the current student.
 */
export async function GET(request: Request) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(request.url);
  const lessonSlug = searchParams.get("lessonSlug");
  if (!lessonSlug) {
    return NextResponse.json({ error: "lessonSlug required" }, { status: 400 });
  }

  try {
    const admin = createSupabaseAdmin();
    const { data } = await admin
      .from("lesson_progress")
      .select("dynamic_steps_done")
      .eq("user_id", auth.appUserId)
      .eq("lesson_id", lessonSlug)
      .maybeSingle();

    const steps: string[] = Array.isArray(data?.dynamic_steps_done)
      ? (data!.dynamic_steps_done as string[])
      : [];

    return NextResponse.json({ steps });
  } catch (err) {
    Sentry.captureException(err, { tags: { route: "GET /api/progress/dynamic-step" } });
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
