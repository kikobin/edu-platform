import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { requireAuth } from "@/lib/auth/requireAuth";
import { supabase } from "@/lib/supabase";
import { awardXPByAppUserId, revokeXPByAppUserId, XP_SOURCES } from "@/lib/awardXP";
import { XP_REWARDS } from "@/types";
import { parseBody, PatchSubmissionSchema } from "@/lib/validation/schemas";

interface Props {
  params: { id: string };
}

export async function PATCH(request: Request, { params }: Props) {
  const auth = await requireAuth("curator");
  if (auth instanceof NextResponse) return auth;

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

    await supabase.updateSubmission(params.id, status, curatorComment);

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
      await awardXPByAppUserId(realUserId, approvalSource, XP_REWARDS.HOMEWORK_APPROVED);
    } else if (prevStatus === "approved" && status !== "approved") {
      // Revert from approved → deduct XP by deleting the award event.
      // Deleting (not negative-event) keeps the source_id reusable for future re-approvals.
      await revokeXPByAppUserId(realUserId, approvalSource);
    }

    if (status === "approved" || status === "revision") {
      const message =
        status === "approved"
          ? `Куратор принял твою работу по уроку «${realLessonTitle ?? realLessonId}» ✅`
          : `Куратор отправил работу на доработку по уроку «${realLessonTitle ?? realLessonId}» 💬`;

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
