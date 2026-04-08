import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/requireAuth";
import { supabase, supabaseEnabled } from "@/lib/supabase";
import type { AvatarId } from "@/types";

export const revalidate = 60;

export async function GET() {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  if (!supabaseEnabled) {
    return NextResponse.json({ entries: [], source: "empty" });
  }

  const rows = await supabase.getLeaderboard();
  const entries = rows.map((r) => ({
    userId: r.user_id,
    name: r.name,
    avatarId: r.avatar_id as AvatarId,
    xp: r.xp,
  }));
  return NextResponse.json({ entries, source: "profiles" });
}
