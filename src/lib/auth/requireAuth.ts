import "server-only";
import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabaseServer";

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

  const meta = user.user_metadata ?? {};
  const role      = (meta.role      as string) ?? "student";
  const appUserId = (meta.appUserId as string) ?? user.id;
  const name      = (meta.name      as string) ?? "";
  const avatarId  = (meta.avatarId  as string) ?? "avatar_1";

  if (requiredRole && role !== requiredRole && role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return { authId: user.id, appUserId, role, name, avatarId };
}
