import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { requireAuth } from "@/lib/auth/requireAuth";
import { supabase } from "@/lib/supabase";

export async function GET(request: Request) {
  const auth = await requireAuth("curator");
  if (auth instanceof NextResponse) return auth;

  try {
    let studentIds: string[] | undefined;
    if (auth.role === "curator") {
      const assignedIds = await supabase.getCuratorStudents(auth.appUserId);
      if (assignedIds.length === 0) {
        return NextResponse.json({ students: [], total: 0, page: 1, pageSize: 50 });
      }
      studentIds = assignedIds;
    }

    const { searchParams } = new URL(request.url);
    // NaN/negative guards: parseInt of "abc" is NaN, which then poisons offset
    // and triggers a PostgREST 500. Clamp to sane range here.
    const rawPage     = parseInt(searchParams.get("page") ?? "1", 10);
    const rawPageSize = parseInt(searchParams.get("pageSize") ?? "50", 10);
    const page     = Number.isFinite(rawPage)     ? Math.max(1, rawPage)     : 1;
    const pageSize = Number.isFinite(rawPageSize) ? Math.min(200, Math.max(1, rawPageSize)) : 50;
    const search   = searchParams.get("search") ?? undefined;

    const { rows, total } = await supabase.getStudentProfiles({
      studentIds, search, page, pageSize,
    });

    const students = rows.map((p) => ({
      id:       p.app_user_id,
      name:     p.name,
      avatarId: p.avatar_id,
      xp:       p.xp,
    }));

    return NextResponse.json({ students, total, page, pageSize });
  } catch (err) {
    Sentry.captureException(err, { tags: { route: "GET /api/admin/students" } });
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
