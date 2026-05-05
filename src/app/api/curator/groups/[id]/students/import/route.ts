import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { z } from "zod";
import { requireAuth } from "@/lib/auth/requireAuth";
import { supabase } from "@/lib/supabase";
import { rateLimit } from "@/lib/rateLimit";
import { parseBody, isValidUuid } from "@/lib/validation/schemas";

const ImportSchema = z.object({
  appUserIds: z.array(z.string().trim().min(1).max(100)).min(1).max(200),
});

interface Props { params: { id: string } }

export async function POST(request: Request, { params }: Props) {
  const auth = await requireAuth("curator");
  if (auth instanceof NextResponse) return auth;

  if (!isValidUuid(params.id)) {
    return NextResponse.json({ error: "Invalid group id" }, { status: 400 });
  }

  if (!rateLimit(`groups:import:${auth.authId}`, { limit: 5, windowMs: 60_000 })) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const body = await parseBody(request, ImportSchema);
  if (body instanceof NextResponse) return body;

  try {
    const group = await supabase.getGroupById(params.id);
    if (!group) return NextResponse.json({ error: "Group not found" }, { status: 404 });
    if (auth.role !== "admin" && group.curator_id !== auth.authId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (group.tier === "vip") {
      return NextResponse.json(
        { error: "Импорт CSV доступен только для smart-групп (VIP вмещает 1 ученика)" },
        { status: 400 }
      );
    }

    // Dedupe + normalize
    const ids = Array.from(new Set(body.appUserIds.map((s) => s.trim()).filter(Boolean)));

    // Resolve app_user_id → profile UUID for unassigned students of matching tier.
    // We do not surface profile UUIDs to the client by accident — only counts.
    const candidates = await supabase.getUnassignedStudentsByTier(group.tier);
    const byAppId = new Map(candidates.map((c) => [c.app_user_id, c.id]));

    const added: string[]    = [];
    const notFound: string[] = [];
    const failed: string[]   = [];

    for (const appId of ids) {
      const profileId = byAppId.get(appId);
      if (!profileId) { notFound.push(appId); continue; }
      const ok = await supabase.addStudentToGroup(profileId, params.id);
      if (ok) added.push(appId); else failed.push(appId);
    }

    return NextResponse.json({
      added: added.length,
      notFound,
      failed,
    });
  } catch (err) {
    Sentry.captureException(err, {
      tags: { route: `POST /api/curator/groups/${params.id}/students/import` },
    });
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
