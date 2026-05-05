import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/requireAuth";
import { supabase } from "@/lib/supabase";

export async function GET() {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const rows = await supabase.getSubmissionsByUser(auth.appUserId);
  return NextResponse.json(rows.map((r) => ({
    id:             r.id,
    userId:         r.user_id,
    userName:       r.user_name,
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
    fileUrl:        r.file_url,
    fileMime:       r.file_mime,
    fileSize:       r.file_size,
  })));
}
