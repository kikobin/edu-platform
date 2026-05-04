import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { requireAuth } from "@/lib/auth/requireAuth";
import { supabase } from "@/lib/supabase";
import { parseBody, AddStudentToGroupSchema } from "@/lib/validation/schemas";
import { rateLimit } from "@/lib/rateLimit";

interface Props {
  params: { id: string };
}

/** GET — list of unassigned students matching this group's tier (for the "add" picker). */
export async function GET(_request: Request, { params }: Props) {
  const auth = await requireAuth("curator");
  if (auth instanceof NextResponse) return auth;

  try {
    const group = await supabase.getGroupById(params.id);
    if (!group) return NextResponse.json({ error: "Group not found" }, { status: 404 });
    if (auth.role !== "admin" && group.curator_id !== auth.authId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const candidates = await supabase.getUnassignedStudentsByTier(group.tier);
    return NextResponse.json({ candidates });
  } catch (err) {
    Sentry.captureException(err, {
      tags: { route: `GET /api/curator/groups/${params.id}/students` },
    });
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/** POST — add a student to the group. */
export async function POST(request: Request, { params }: Props) {
  const auth = await requireAuth("curator");
  if (auth instanceof NextResponse) return auth;

  if (!rateLimit(`groups:add:${auth.authId}`, { limit: 30, windowMs: 60_000 })) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const body = await parseBody(request, AddStudentToGroupSchema);
  if (body instanceof NextResponse) return body;

  try {
    const group = await supabase.getGroupById(params.id);
    if (!group) return NextResponse.json({ error: "Group not found" }, { status: 404 });
    if (auth.role !== "admin" && group.curator_id !== auth.authId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // VIP groups hold a single student — block adding a second one.
    if (group.tier === "vip") {
      const existing = await supabase.getStudentsInGroup(params.id);
      if (existing.length >= 1) {
        return NextResponse.json(
          { error: "VIP group already has a student" },
          { status: 409 }
        );
      }
    }

    const ok = await supabase.addStudentToGroup(body.studentProfileId, params.id);
    if (!ok) {
      // Likely rejected by the DB constraint (tier mismatch / basic student).
      return NextResponse.json(
        { error: "Could not add student — tier mismatch or already in another group" },
        { status: 409 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    Sentry.captureException(err, {
      tags: { route: `POST /api/curator/groups/${params.id}/students` },
    });
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
