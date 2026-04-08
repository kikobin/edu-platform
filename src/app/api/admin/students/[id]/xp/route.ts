import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/requireAuth";
import { awardXPByAppUserId, XP_SOURCES } from "@/lib/awardXP";
import { supabase } from "@/lib/supabase";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth("admin");
  if (auth instanceof NextResponse) return auth;

  const profile = await supabase.getStudentProfileById(params.id);
  if (!profile) {
    return NextResponse.json({ error: "Student not found" }, { status: 404 });
  }

  const { delta } = await request.json();
  if (typeof delta !== "number" || !Number.isFinite(delta) || delta <= 0) {
    return NextResponse.json({ error: "delta must be a positive number" }, { status: 400 });
  }

  // Use the idempotency-safe awardXP. Admin adjustments use a timestamped source
  // to allow multiple adjustments (not idempotent by design).
  const sourceId = `admin:adjust:${params.id}:${Date.now()}`;
  const newTotal = await awardXPByAppUserId(params.id, sourceId, Math.round(delta));

  return NextResponse.json({ ok: true, xp: newTotal ?? profile.xp });
}
