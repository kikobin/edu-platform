import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { requireAuth } from "@/lib/auth/requireAuth";
import { supabase } from "@/lib/supabase";
import { rateLimit } from "@/lib/rateLimit";

export async function GET() {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  // 5 tabs × 2 req/min = 10; give generous headroom
  if (!rateLimit(`notifications:${auth.authId}`, { limit: 20, windowMs: 60_000 })) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  try {
    const rows = await supabase.getNotificationsByUser(auth.appUserId);
    const notifications = rows.map((r) => ({
      id:        r.id,
      type:      r.type,
      message:   r.message,
      lessonId:  r.lesson_id,
      read:      r.read,
      createdAt: r.created_at,
    }));

    return NextResponse.json(notifications);
  } catch (err) {
    Sentry.captureException(err, { tags: { route: "GET /api/notifications" } });
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json().catch(() => ({})) as Record<string, unknown>;
    const before = typeof body.before === "string" ? body.before : undefined;
    await supabase.markNotificationsRead(auth.appUserId, before);
    return NextResponse.json({ ok: true });
  } catch (err) {
    Sentry.captureException(err, { tags: { route: "PATCH /api/notifications" } });
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
