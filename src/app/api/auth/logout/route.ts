import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabaseServer";

export async function POST() {
  const supabase = createSupabaseServer();

  // Revokes the refresh token server-side.
  // @supabase/ssr clears sb-* cookies automatically.
  await supabase.auth.signOut();

  return NextResponse.json({ ok: true });
}
