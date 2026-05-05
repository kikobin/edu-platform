import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/requireAuth";
import { awardXPByAppUserId } from "@/lib/awardXP";
import { supabase } from "@/lib/supabase";
import { rateLimit } from "@/lib/rateLimit";
import { parseBody, AdminAdjustXPSchema, isValidAppUserId } from "@/lib/validation/schemas";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth("admin");
  if (auth instanceof NextResponse) return auth;

  if (!isValidAppUserId(params.id)) {
    return NextResponse.json({ error: "Invalid student id" }, { status: 400 });
  }

  if (!rateLimit(`admin:xp:${auth.authId}`, { limit: 30, windowMs: 60_000 })) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const body = await parseBody(request, AdminAdjustXPSchema);
  if (body instanceof NextResponse) return body;

  const profile = await supabase.getStudentProfileById(params.id);
  if (!profile) {
    return NextResponse.json({ error: "Student not found" }, { status: 404 });
  }

  // Guard: don't let XP go below zero.
  if (body.delta < 0 && profile.xp + body.delta < 0) {
    return NextResponse.json(
      { error: `Cannot reduce XP below 0 (current: ${profile.xp})` },
      { status: 422 }
    );
  }

  // Admin adjustments use a timestamped source so awardXP's idempotency
  // doesn't collapse multiple distinct adjustments into one.
  const sourceId = `admin:adjust:${params.id}:${Date.now()}`;
  const newTotal = await awardXPByAppUserId(params.id, sourceId, body.delta);

  if (newTotal === null) {
    return NextResponse.json({ error: "XP update failed — profile not found" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, xp: newTotal });
}
