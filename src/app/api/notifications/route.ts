import { NextResponse } from "next/server";
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
}

export async function PATCH() {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  await supabase.markNotificationsRead(auth.appUserId);
  return NextResponse.json({ ok: true });
}
