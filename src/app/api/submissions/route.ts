import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { requireAuth } from "@/lib/auth/requireAuth";
import { supabase } from "@/lib/supabase";
import { parseBody, CreateSubmissionSchema } from "@/lib/validation/schemas";
import { rateLimit } from "@/lib/rateLimit";

export async function GET(request: Request) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(request.url);
  const lessonId = searchParams.get("lessonId");
  if (!lessonId) return NextResponse.json({ error: "lessonId required" }, { status: 400 });

  const row = await supabase.getSubmissionByUserAndLesson(auth.appUserId, lessonId);
  if (!row) return NextResponse.json(null);

  return NextResponse.json({
    id:             row.id,
    status:         row.status,
    curatorComment: row.curator_comment,
    submittedAt:    row.submitted_at,
    reviewedAt:     row.reviewed_at,
  });
}

export async function POST(request: Request) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  if (!rateLimit(`submissions:${auth.authId}`, { limit: 10, windowMs: 60_000 })) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  // Curators/admins cannot submit homework
  if (auth.role === "curator" || auth.role === "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await parseBody(request, CreateSubmissionSchema);
  if (body instanceof NextResponse) return body;

  const { lessonId, homeworkId, lessonTitle, homeworkTitle, content, submitType } = body;

  try {
    await supabase.upsertSubmission({
      user_id:         auth.appUserId,
      user_name:       auth.name ?? "Ученик",
      lesson_id:       lessonId,
      homework_id:     homeworkId,
      lesson_title:    lessonTitle,
      homework_title:  homeworkTitle,
      content:         content ?? "",
      submit_type:     submitType ?? "confirm",
      status:          "pending",
      curator_comment: undefined,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    Sentry.captureException(err, { tags: { route: "POST /api/submissions" } });
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
