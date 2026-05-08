import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/requireAuth";
import { supabase } from "@/lib/supabase";

const PAGE_SIZE = 20;

export async function GET(request: Request) {
  const auth = await requireAuth("curator");
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(request.url);
  const statusFilter = searchParams.get("status") ?? "all";
  const groupFilter  = searchParams.get("groupId");
  const page         = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));

  // Curators only see their own students; admins see everyone.
  // IMPORTANT: if a curator has no assigned students yet, return empty immediately —
  // do NOT fall through to an unfiltered query that would expose all submissions.
  let studentIds: string[] | null = null;
  if (auth.role === "curator") {
    studentIds = await supabase.getCuratorStudents(auth.appUserId);
    if (studentIds.length === 0) {
      return NextResponse.json({ submissions: [], page, pageSize: PAGE_SIZE, hasMore: false });
    }
  }

  if (groupFilter) {
    const groupStudents = await supabase.getStudentsInGroup(groupFilter);
    const groupIds = groupStudents.map((s) => s.app_user_id);
    // Intersect with curator's assigned students. If curator filtered to a group
    // that contains none of their students, return empty rather than leak.
    studentIds = studentIds
      ? studentIds.filter((id) => groupIds.includes(id))
      : groupIds;
    if (studentIds.length === 0) {
      return NextResponse.json({ submissions: [], page, pageSize: PAGE_SIZE, hasMore: false });
    }
  }

  const rows = await supabase.getSubmissions({
    status:     statusFilter !== "all" ? statusFilter : undefined,
    studentIds: studentIds ?? undefined,
    page,
    pageSize:   PAGE_SIZE,
  });

  const submissions = rows.map((r) => ({
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
    version:        r.version ?? 1,
    fileUrl:        r.file_url    ?? undefined,
    fileMime:       r.file_mime   ?? undefined,
    fileSize:       r.file_size   ?? undefined,
  }));

  return NextResponse.json({ submissions, page, pageSize: PAGE_SIZE, hasMore: rows.length === PAGE_SIZE });
}
