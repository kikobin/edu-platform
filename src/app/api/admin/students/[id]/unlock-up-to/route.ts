import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { z } from "zod";
import { requireAuth } from "@/lib/auth/requireAuth";
import { supabase } from "@/lib/supabase";
import { rateLimit } from "@/lib/rateLimit";
import { parseBody, isValidAppUserId } from "@/lib/validation/schemas";
import { ALL_LESSONS } from "@/content/study-lessons";
import { unlockUpToForStudent } from "@/lib/unlock";

const Schema = z.object({
  lessonSlug: z.string().min(1).max(100),
});

interface Props { params: { id: string } }

/**
 * Bulk-unlock every lesson up to (and including) `lessonSlug` for one student.
 * Used for migrating existing students from another platform — they arrive
 * already past lesson N, so we mark 1..N as approved in one shot.
 *
 * Notifications are off (would spam the bell with 5–10 rows in a row).
 */
export async function POST(request: Request, { params }: Props) {
  const auth = await requireAuth("curator");
  if (auth instanceof NextResponse) return auth;

  if (!isValidAppUserId(params.id)) {
    return NextResponse.json({ error: "Invalid student id" }, { status: 400 });
  }

  // Looser limit than single-unlock since this is one user-initiated action,
  // even though it fans out to several lessons internally.
  if (!rateLimit(`unlock-up-to:${auth.authId}`, { limit: 10, windowMs: 60_000 })) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  if (auth.role === "curator") {
    const assigned = await supabase.getCuratorStudents(auth.appUserId);
    if (!assigned.includes(params.id)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const body = await parseBody(request, Schema);
  if (body instanceof NextResponse) return body;

  if (!ALL_LESSONS.some((l) => l.slug === body.lessonSlug)) {
    return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
  }

  try {
    const result = await unlockUpToForStudent(params.id, body.lessonSlug, { notify: false });
    return NextResponse.json({
      ok: result.error === 0,
      unlocked: result.ok,
      conflicts: result.conflict,
      errors: result.error,
    });
  } catch (err) {
    Sentry.captureException(err, {
      tags: { route: `POST /api/admin/students/${params.id}/unlock-up-to` },
    });
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
