import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { requireAuth } from "@/lib/auth/requireAuth";
import { supabase } from "@/lib/supabase";
import { parseBody, RenameGroupSchema } from "@/lib/validation/schemas";

interface Props {
  params: { id: string };
}

/** Verify the curator owns this group. Returns the group or a 403/404 NextResponse. */
async function loadOwnedGroup(groupId: string, curatorAuthId: string, role: string) {
  const group = await supabase.getGroupById(groupId);
  if (!group) {
    return NextResponse.json({ error: "Group not found" }, { status: 404 });
  }
  // Admin can act on any group; curator only on their own.
  if (role !== "admin" && group.curator_id !== curatorAuthId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return group;
}

export async function GET(_request: Request, { params }: Props) {
  const auth = await requireAuth("curator");
  if (auth instanceof NextResponse) return auth;

  try {
    const group = await loadOwnedGroup(params.id, auth.authId, auth.role);
    if (group instanceof NextResponse) return group;

    const students = await supabase.getStudentsInGroup(params.id);
    return NextResponse.json({ group, students });
  } catch (err) {
    Sentry.captureException(err, { tags: { route: `GET /api/curator/groups/${params.id}` } });
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: Props) {
  const auth = await requireAuth("curator");
  if (auth instanceof NextResponse) return auth;

  const body = await parseBody(request, RenameGroupSchema);
  if (body instanceof NextResponse) return body;

  try {
    const group = await loadOwnedGroup(params.id, auth.authId, auth.role);
    if (group instanceof NextResponse) return group;

    const ok = await supabase.renameGroup(params.id, body.name);
    if (!ok) return NextResponse.json({ error: "Update failed" }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    Sentry.captureException(err, { tags: { route: `PATCH /api/curator/groups/${params.id}` } });
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: Props) {
  const auth = await requireAuth("curator");
  if (auth instanceof NextResponse) return auth;

  try {
    const group = await loadOwnedGroup(params.id, auth.authId, auth.role);
    if (group instanceof NextResponse) return group;

    // Refuse to delete a non-empty group — curator must remove students first
    // so the action is explicit and reversible.
    const students = await supabase.getStudentsInGroup(params.id);
    if (students.length > 0) {
      return NextResponse.json(
        { error: "Group is not empty", studentsCount: students.length },
        { status: 409 }
      );
    }

    const ok = await supabase.deleteGroup(params.id);
    if (!ok) return NextResponse.json({ error: "Delete failed" }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    Sentry.captureException(err, { tags: { route: `DELETE /api/curator/groups/${params.id}` } });
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
