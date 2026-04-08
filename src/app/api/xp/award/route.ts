import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { requireAuth } from "@/lib/auth/requireAuth";
import { awardXP } from "@/lib/awardXP";
import { parseBody, AwardXPSchema } from "@/lib/validation/schemas";
import { rateLimit } from "@/lib/rateLimit";

/**
 * POST /api/xp/award
 * Awards XP to the authenticated user idempotently.
 * Body: { sourceId: string, amount: number }
 * Returns: { total: number }
 */
export async function POST(request: Request) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  // 20 awards per minute per user
  if (!rateLimit(`xp:${auth.authId}`, { limit: 20, windowMs: 60_000 })) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const body = await parseBody(request, AwardXPSchema);
  if (body instanceof NextResponse) return body;

  try {
    const total = await awardXP(auth.authId, body.sourceId, body.amount);
    return NextResponse.json({ total });
  } catch (err) {
    Sentry.captureException(err, { tags: { route: "POST /api/xp/award" } });
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
