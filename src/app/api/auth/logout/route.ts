import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { createSupabaseServer } from "@/lib/supabaseServer";

export async function POST() {
  try {
    const supabase = createSupabaseServer();

    // Revokes the refresh token server-side.
    // @supabase/ssr clears sb-* cookies automatically.
    await supabase.auth.signOut();

    return NextResponse.json({ ok: true });
  } catch (err) {
    Sentry.captureException(err, { tags: { route: "POST /api/auth/logout" } });
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
