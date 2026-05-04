import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/requireAuth";
import { awardXPByAppUserId } from "@/lib/awardXP";
import { supabase } from "@/lib/supabase";
import { rateLimit } from "@/lib/rateLimit";
import { parseBody, AdminAdjustXPSchema } from "@/lib/validation/schemas";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth("admin");
  if (auth instanceof NextResponse) return auth;

  if (!rateLimit(`admin:xp:${auth.authId}`, { limit: 30, windowMs: 60_000 })) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const body = await parseBody(request, AdminAdjustXPSchema);
  if (body instanceof NextResponse) return body;

  const profile = await supabase.getStudentProfileById(params.id);
  if (!profile) {
    return NextResponse.json({ error: "Student not found" }, { status: 404 });
  }

  // Admin adjustments use a timestamped source so awardXP's idempotency
  // doesn't collapse multiple distinct adjustments into one.
  const sourceId = `admin:adjust:${params.id}:${Date.now()}`;
  const newTotal = await awardXPByAppUserId(params.id, sourceId, body.delta);

  return NextResponse.json({ ok: true, xp: newTotal ?? profile.xp });
}
