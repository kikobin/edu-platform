import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { requireAuth } from "@/lib/auth/requireAuth";
import { createSupabaseAdmin } from "@/lib/supabaseServer";

export async function GET() {
  const auth = await requireAuth("admin");
  if (auth instanceof NextResponse) return auth;

  try {
    const admin = createSupabaseAdmin();
    const { data, error } = await admin
      .from("groups")
      .select("id, name, tier")
      .order("created_at", { ascending: true });

    if (error) {
      Sentry.captureException(error, { tags: { route: "GET /api/admin/groups" } });
      return NextResponse.json({ error: "Server error" }, { status: 500 });
    }

    return NextResponse.json({ groups: data ?? [] });
  } catch (err) {
    Sentry.captureException(err, { tags: { route: "GET /api/admin/groups" } });
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
