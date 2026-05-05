import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { requireAuth } from "@/lib/auth/requireAuth";
import { supabase } from "@/lib/supabase";
import { awardXPByAppUserId, revokeXPByAppUserId, XP_SOURCES } from "@/lib/awardXP";
import { rateLimit } from "@/lib/rateLimit";
import { XP_REWARDS } from "@/types";
import { parseBody, PatchSubmissionSchema, isValidUuid } from "@/lib/validation/schemas";

interface Props {
  params: { id: string };
}

export async function PATCH(request: Request, { params }: Props) {
  const auth = await requireAuth("curator");
  if (auth instanceof NextResponse) return auth;

  if (!isValidUuid(params.id)) {
    return NextResponse.json({ error: "Invalid submission id" }, { status: 400 });
  }

  // Curators/admins can mass-review, but a single account spamming approve/revision
  // toggles can both inflate notifications and create XP-rollback churn. Cap to
  // ~2/sec sustained.
  if (!rateLimit(`admin:submission:${auth.authId}`, { limit: 60, windowMs: 60_000 })) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const body = await parseBody(request, PatchSubmissionSchema);
  if (body instanceof NextResponse) return body;

  const { status, curatorComment } = body;

  try {
    // Fetch the submission from DB — never trust userId/lessonId from the client body.
    // This also implicitly validates that the submission exists.
    const submission = await supabase.getSubmissionById(params.id);
    if (!submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }

    // Curators may only act on their own students' submissions.
    if (auth.role === "curator") {
      const assignedIds = await supabase.getCuratorStudents(auth.appUserId);
      if (!assignedIds.includes(submission.user_id)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    // Optimistic lock on version: if another curator already moved the submission
    // forward, return 409 so the client refetches instead of awarding XP twice.
    // Pre-versioned rows (version IS NULL) are updated unconditionally — once
    // updated they get version=1 and the lock kicks in for subsequent writes.
    const expectedVersion = submission.version ?? undefined;
    const result = await supabase.updateSubmission(params.id, status, curatorComment, expectedVersion);
    if (!result.ok && result.reason === "conflict") {
      return NextResponse.json(
        { error: "Эта домашка уже была обновлена другим куратором — обнови список." },
        { status: 409 }
      );
    }

    // Use real user_id and lesson_id from the DB row — never from the client body.
    const realUserId      = submission.user_id;
    const realLessonId    = submission.lesson_id;
    const realLessonTitle = submission.lesson_title;
    const prevStatus      = submission.status;
    const approvalSource  = XP_SOURCES.homeworkApproved(realLessonId);

    // ── XP transitions ────────────────────────────────────────────────────────
    if (status === "approved" && prevStatus !== "approved") {
      // Award approval XP.
      // awardXP uses UNIQUE(user_id, source_id) — idempotent within the same source.
      // Because revokeXP deletes the row when reverting, re-approval re-inserts it.
      const total = await awardXPByAppUserId(realUserId, approvalSource, XP_REWARDS.HOMEWORK_APPROVED);
      if (total === null) {
        Sentry.captureMessage("awardXPByAppUserId returned null — profile not found", {
          level: "warning",
          tags: { route: `PATCH /api/admin/submissions/${params.id}`, action: "approve" },
          extra: { realUserId, realLessonId, approvalSource },
        });
      }
    } else if (prevStatus === "approved" && status !== "approved") {
      // Revert from approved → deduct XP by deleting the award event.
      // Deleting (not negative-event) keeps the source_id reusable for future re-approvals.
      const total = await revokeXPByAppUserId(realUserId, approvalSource);
      if (total === null) {
        // Rollback silently failed — log so we can investigate XP inflation.
        Sentry.captureMessage("revokeXPByAppUserId returned null — XP rollback skipped", {
          level: "warning",
          tags: { route: `PATCH /api/admin/submissions/${params.id}`, action: "revoke" },
          extra: { realUserId, realLessonId, approvalSource, prevStatus, status },
        });
      }
    }

    if (status === "approved" || status === "revision") {
      const message =
        status === "approved"
          ? `Куратор принял твою работу по уроку «${realLessonTitle ?? realLessonId}»`
          : `Куратор отправил работу на доработку по уроку «${realLessonTitle ?? realLessonId}»`;

      await supabase.createNotification({
        user_id:   realUserId,
        type:      `homework_${status}`,
        message,
        lesson_id: realLessonId,
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    Sentry.captureException(err, { tags: { route: `PATCH /api/admin/submissions/${params.id}` } });
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
