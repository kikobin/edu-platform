import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { z } from "zod";
import { requireAuth } from "@/lib/auth/requireAuth";
import { supabase } from "@/lib/supabase";
import { rateLimit } from "@/lib/rateLimit";
import { parseBody, isValidAppUserId } from "@/lib/validation/schemas";
import { ALL_LESSONS } from "@/content/study-lessons";
import { unlockLessonForStudent } from "@/lib/unlock";

const UnlockSchema = z.object({
  lessonId: z.string().min(1).max(100),
});

interface Props { params: { id: string } }

export async function POST(request: Request, { params }: Props) {
  const auth = await requireAuth("curator");
  if (auth instanceof NextResponse) return auth;

  if (!isValidAppUserId(params.id)) {
    return NextResponse.json({ error: "Invalid student id" }, { status: 400 });
  }

  if (!rateLimit(`unlock:${auth.authId}`, { limit: 30, windowMs: 60_000 })) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  if (auth.role === "curator") {
    const assigned = await supabase.getCuratorStudents(auth.appUserId);
    if (!assigned.includes(params.id)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const body = await parseBody(request, UnlockSchema);
  if (body instanceof NextResponse) return body;

  const lesson = ALL_LESSONS.find((l) => l.slug === body.lessonId);
  if (!lesson) {
    return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
  }

  try {
    const result = await unlockLessonForStudent(params.id, lesson, { notify: true });
    if (result.reason === "conflict") {
      return NextResponse.json(
        { error: "Эту домашку уже обновили — обнови страницу." },
        { status: 409 },
      );
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    Sentry.captureException(err, { tags: { route: `POST /api/admin/students/${params.id}/unlock` } });
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
