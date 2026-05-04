import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { requireAuth } from "@/lib/auth/requireAuth";
import { supabase } from "@/lib/supabase";

interface Props {
  params: { id: string; studentId: string };
}

/** DELETE — remove a student from the group. Tier is preserved per spec. */
export async function DELETE(_request: Request, { params }: Props) {
  const auth = await requireAuth("curator");
  if (auth instanceof NextResponse) return auth;

  try {
    const group = await supabase.getGroupById(params.id);
    if (!group) return NextResponse.json({ error: "Group not found" }, { status: 404 });
    if (auth.role !== "admin" && group.curator_id !== auth.authId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Confirm the student actually belongs to this group before clearing — never
    // trust the URL alone, the curator could craft a request for someone else's
    // student that they happen to know the profile id of.
    const inGroup = await supabase.getStudentsInGroup(params.id);
    const target = inGroup.find((s) => s.id === params.studentId);
    if (!target) {
      return NextResponse.json({ error: "Student is not in this group" }, { status: 404 });
    }

    const ok = await supabase.removeStudentFromGroup(params.studentId);
    if (!ok) return NextResponse.json({ error: "Update failed" }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    Sentry.captureException(err, {
      tags: { route: `DELETE /api/curator/groups/${params.id}/students/${params.studentId}` },
    });
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
