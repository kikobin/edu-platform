import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/requireAuth";
import { supabase } from "@/lib/supabase";
import { ALL_LESSONS } from "@/content/study-lessons";
import { isValidAppUserId } from "@/lib/validation/schemas";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth("curator");
  if (auth instanceof NextResponse) return auth;

  if (!isValidAppUserId(params.id)) {
    return NextResponse.json({ error: "Invalid student id" }, { status: 400 });
  }

  // Curators may only view students explicitly assigned to them.
  // Admins bypass this check (they see everyone).
  if (auth.role === "curator") {
    const assignedIds = await supabase.getCuratorStudents(auth.appUserId);
    if (!assignedIds.includes(params.id)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const [profile, submissions, lessonProgressRows] = await Promise.all([
    supabase.getStudentProfileById(params.id),
    supabase.getSubmissionsByUser(params.id),
    supabase.getLessonProgressByUser(params.id),
  ]);

  if (!profile) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const xp = profile.xp ?? 0;

  const lessonsSummary = ALL_LESSONS.map((lesson) => {
    const lessonSubs = submissions.filter((s) => s.lesson_id === lesson.slug);
    const latest = lessonSubs[0] ?? null;
    const lp = lessonProgressRows.find((r) => r.lesson_id === lesson.slug);
    const homeworkSubmitted = latest !== null;

    return {
      lessonId:          lesson.slug,
      lessonTitle:       lesson.title,
      lessonOrder:       lesson.id, // numeric id used as ordering key for the curator UI
      reviewDone:        lp?.review_done ?? homeworkSubmitted,
      practiceDone:      lp?.practice_done ?? homeworkSubmitted,
      practiceScore:     lp?.practice_score ?? 0,
      submissionStatus:  latest?.status ?? null,
      submittedAt:       latest?.submitted_at ?? null,
      curatorComment:    latest?.curator_comment ?? null,
    };
  });

  const normalizedSubs = submissions.map((r) => ({
    id:             r.id,
    lessonId:       r.lesson_id,
    homeworkId:     r.homework_id,
    lessonTitle:    r.lesson_title,
    homeworkTitle:  r.homework_title,
    content:        r.content,
    submitType:     r.submit_type,
    status:         r.status,
    curatorComment: r.curator_comment,
    submittedAt:    r.submitted_at,
    reviewedAt:     r.reviewed_at,
  }));

  return NextResponse.json({
    student: {
      id:       profile.app_user_id,
      name:     profile.name,
      avatarId: profile.avatar_id,
    },
    xp,
    lessonsSummary,
    submissions: normalizedSubs,
  });
}
