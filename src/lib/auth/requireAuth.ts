import "server-only";
import { NextResponse } from "next/server";
import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabaseServer";

export type AuthResult = {
  authId: string;    // Supabase Auth UUID
  appUserId: string; // legacy "student-1", "curator-1" etc. — used for existing DB queries
  role: string;
  name: string;
  avatarId: string;
};

/**
 * Server-side auth check using Supabase JWT.
 *
 * Usage in API routes:
 *   const auth = await requireAuth();
 *   if (auth instanceof NextResponse) return auth; // 401 or 403
 *   // auth.appUserId, auth.role, auth.authId are available
 *
 * With role check:
 *   const auth = await requireAuth("curator"); // 403 if not curator/admin
 */
export async function requireAuth(
  requiredRole?: "curator" | "admin"
): Promise<AuthResult | NextResponse> {
  const supabase = createSupabaseServer();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // app_user_id lives in profiles, not user_metadata (metadata is never populated by seed)
  const admin = createSupabaseAdmin();
  const { data: profile, error: pErr } = await admin
    .from("profiles")
    .select("app_user_id, role, name, avatar_id")
    .eq("id", user.id)
    .maybeSingle();

  if (pErr || !profile?.app_user_id) {
    return NextResponse.json({ error: "Profile missing" }, { status: 401 });
  }

  const appUserId = profile.app_user_id as string;
  const role      = (profile.role      as string) ?? "student";
  const name      = (profile.name      as string) ?? "";
  const avatarId  = (profile.avatar_id as string) ?? "avatar_1";

  if (requiredRole && role !== requiredRole && role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return { authId: user.id, appUserId, role, name, avatarId };
}
