import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { requireAuth } from "@/lib/auth/requireAuth";
import { supabase } from "@/lib/supabase";
import { parseBody, CreateGroupSchema } from "@/lib/validation/schemas";
import { rateLimit } from "@/lib/rateLimit";

export async function GET() {
  const auth = await requireAuth("curator");
  if (auth instanceof NextResponse) return auth;

  try {
    const groups = await supabase.getGroupsByCurator(auth.appUserId);
    return NextResponse.json({ groups });
  } catch (err) {
    Sentry.captureException(err, { tags: { route: "GET /api/curator/groups" } });
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await requireAuth("curator");
  if (auth instanceof NextResponse) return auth;

  if (!rateLimit(`groups:create:${auth.authId}`, { limit: 20, windowMs: 60_000 })) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const body = await parseBody(request, CreateGroupSchema);
  if (body instanceof NextResponse) return body;

  try {
    const groupId = await supabase.createGroup(auth.authId, body.name, body.tier);
    if (!groupId) {
      return NextResponse.json({ error: "Failed to create group" }, { status: 500 });
    }
    return NextResponse.json({ id: groupId, name: body.name, tier: body.tier });
  } catch (err) {
    Sentry.captureException(err, { tags: { route: "POST /api/curator/groups" } });
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
