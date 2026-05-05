import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { z } from "zod";
import { requireAuth } from "@/lib/auth/requireAuth";
import { supabase } from "@/lib/supabase";
import { rateLimit } from "@/lib/rateLimit";
import { parseBody, isValidUuid } from "@/lib/validation/schemas";
import { ALL_LESSONS } from "@/content/study-lessons";
import { unlockUpToForStudent } from "@/lib/unlock";

const Schema = z.object({
  lessonSlug: z.string().min(1).max(100),
});

interface Props { params: { id: string } }

/**
 * Bulk-unlock every lesson up to `lessonSlug` for *every* student in the group.
 * Designed for migrating cohorts mid-course — e.g. a group already past lesson 4
 * on another platform should arrive here with 1..4 marked complete.
 *
 * Per-student failures are aggregated into the response so the UI can show
 * partial-success ("opened for 27 of 30, 3 failed").
 */
export async function POST(request: Request, { params }: Props) {
  const auth = await requireAuth("curator");
  if (auth instanceof NextResponse) return auth;

  if (!isValidUuid(params.id)) {
    return NextResponse.json({ error: "Invalid group id" }, { status: 400 });
  }

  if (!rateLimit(`group-unlock-up-to:${auth.authId}`, { limit: 5, windowMs: 60_000 })) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const group = await supabase.getGroupById(params.id);
  if (!group) {
    return NextResponse.json({ error: "Group not found" }, { status: 404 });
  }
  if (auth.role !== "admin" && group.curator_id !== auth.authId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await parseBody(request, Schema);
  if (body instanceof NextResponse) return body;

  if (!ALL_LESSONS.some((l) => l.slug === body.lessonSlug)) {
    return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
  }

  try {
    const students = await supabase.getStudentsInGroup(params.id);
    if (students.length === 0) {
      return NextResponse.json({ ok: true, students: 0, totalUnlocked: 0, failed: [] });
    }

    let totalUnlocked = 0;
    let totalConflicts = 0;
    const failed: { appUserId: string; name: string }[] = [];

    for (const s of students) {
      try {
        const r = await unlockUpToForStudent(s.app_user_id, body.lessonSlug, { notify: false });
        totalUnlocked += r.ok;
        totalConflicts += r.conflict;
        if (r.error > 0) failed.push({ appUserId: s.app_user_id, name: s.name });
      } catch (err) {
        Sentry.captureException(err, {
          tags: { route: `POST /api/curator/groups/${params.id}/unlock-up-to`, student: s.app_user_id },
        });
        failed.push({ appUserId: s.app_user_id, name: s.name });
      }
    }

    return NextResponse.json({
      ok: failed.length === 0,
      students: students.length,
      totalUnlocked,
      conflicts: totalConflicts,
      failed,
    });
  } catch (err) {
    Sentry.captureException(err, {
      tags: { route: `POST /api/curator/groups/${params.id}/unlock-up-to` },
    });
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
