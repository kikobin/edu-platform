import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { requireAuth } from "@/lib/auth/requireAuth";
import { createSupabaseAdmin } from "@/lib/supabaseServer";
import { awardXP } from "@/lib/awardXP";
import { rateLimit } from "@/lib/rateLimit";
import { parseBody, BuyItemSchema } from "@/lib/validation/schemas";
import { shopItems } from "@/data/shop";

export async function POST(request: Request) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  if (!rateLimit(`shop:${auth.authId}`, { limit: 10, windowMs: 60_000 })) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const body = await parseBody(request, BuyItemSchema);
  if (body instanceof NextResponse) return body;

  const item = shopItems.find((i) => i.id === body.itemId);
  if (!item) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  const supabase = createSupabaseAdmin();

  try {
    // Get profile: auth UUID + current XP
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, xp")
      .eq("app_user_id", auth.appUserId)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Check already purchased (idempotent — return current state)
    const { data: existing } = await supabase
      .from("purchases")
      .select("id")
      .eq("user_id", profile.id)
      .eq("item_id", body.itemId)
      .maybeSingle();

    if (existing) {
      const { data: allRows } = await supabase
        .from("purchases")
        .select("item_id")
        .eq("user_id", profile.id);
      return NextResponse.json({
        ok: true,
        newXP: profile.xp,
        purchasedIds: (allRows ?? []).map((r) => r.item_id),
      });
    }

    // Check XP balance
    if (profile.xp < item.cost) {
      return NextResponse.json({ error: "Not enough XP" }, { status: 400 });
    }

    // Insert purchase (UNIQUE guard prevents double-buy)
    const { error: insertErr } = await supabase.from("purchases").insert({
      user_id:     profile.id,
      app_user_id: auth.appUserId,
      item_id:     body.itemId,
    });
    if (insertErr) {
      if (insertErr.code === "23505") {
        // Race: another request already inserted — return current state as if idempotent
        const { data: allRows } = await supabase.from("purchases").select("item_id").eq("user_id", profile.id);
        return NextResponse.json({ ok: true, newXP: profile.xp, purchasedIds: (allRows ?? []).map((r) => r.item_id) });
      }
      throw new Error(insertErr.message);
    }

    // Deduct XP via negative event — keeps xp_events as single source of truth
    const newXP = await awardXP(
      profile.id as string,
      `shop:purchase:${body.itemId}`,
      -item.cost,
      supabase,
    );

    // Return full purchase list so client can reconcile
    const { data: allRows } = await supabase
      .from("purchases")
      .select("item_id")
      .eq("user_id", profile.id);

    return NextResponse.json({
      ok: true,
      newXP,
      purchasedIds: (allRows ?? []).map((r) => r.item_id),
    });
  } catch (err) {
    Sentry.captureException(err, {
      tags: { route: "POST /api/shop/buy" },
      user: { id: auth.appUserId },
    });
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
