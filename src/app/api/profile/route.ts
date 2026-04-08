import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { requireAuth } from "@/lib/auth/requireAuth";
import { createSupabaseAdmin } from "@/lib/supabaseServer";

/**
 * PATCH /api/profile
 * Persists cosmetic profile changes (avatarId, titleId, frameId) to the DB.
 * Body: { avatarId?, titleId?, frameId? }
 */
export async function PATCH(request: Request) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  try {
    const { avatarId, titleId, frameId } = await request.json();

    const updates: Record<string, string | null> = {};
    if (avatarId !== undefined) updates["avatar_id"] = avatarId;
    if (titleId  !== undefined) updates["title_id"]  = titleId ?? null;
    if (frameId  !== undefined) updates["frame_id"]  = frameId ?? null;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ ok: true });
    }

    const supabase = createSupabaseAdmin();
    const { error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", auth.authId);

    if (error) throw new Error(error.message);

    return NextResponse.json({ ok: true });
  } catch (err) {
    Sentry.captureException(err, { tags: { route: "PATCH /api/profile" } });
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
