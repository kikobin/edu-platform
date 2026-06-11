import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { randomBytes } from "node:crypto";
import { requireAuth } from "@/lib/auth/requireAuth";
import { supabase } from "@/lib/supabase";
import { createSupabaseAdmin } from "@/lib/supabaseServer";
import { parseBody, CreateStudentSchema } from "@/lib/validation/schemas";
import { rateLimit } from "@/lib/rateLimit";

export async function GET(request: Request) {
  const auth = await requireAuth("curator");
  if (auth instanceof NextResponse) return auth;

  try {
    let studentIds: string[] | undefined;
    if (auth.role === "curator") {
      const assignedIds = await supabase.getCuratorStudents(auth.appUserId);
      if (assignedIds.length === 0) {
        return NextResponse.json({ students: [], total: 0, page: 1, pageSize: 50 });
      }
      studentIds = assignedIds;
    }

    const { searchParams } = new URL(request.url);
    // NaN/negative guards: parseInt of "abc" is NaN, which then poisons offset
    // and triggers a PostgREST 500. Clamp to sane range here.
    const rawPage     = parseInt(searchParams.get("page") ?? "1", 10);
    const rawPageSize = parseInt(searchParams.get("pageSize") ?? "50", 10);
    const page     = Number.isFinite(rawPage)     ? Math.max(1, rawPage)     : 1;
    const pageSize = Number.isFinite(rawPageSize) ? Math.min(200, Math.max(1, rawPageSize)) : 50;
    const search   = searchParams.get("search") ?? undefined;

    const { rows, total } = await supabase.getStudentProfiles({
      studentIds, search, page, pageSize,
    });

    const students = rows.map((p) => ({
      id:       p.app_user_id,
      name:     p.name,
      avatarId: p.avatar_id,
      xp:       p.xp,
    }));

    return NextResponse.json({ students, total, page, pageSize });
  } catch (err) {
    Sentry.captureException(err, { tags: { route: "GET /api/admin/students" } });
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await requireAuth("admin");
  if (auth instanceof NextResponse) return auth;

  if (!rateLimit(`students:create:${auth.authId}`, { limit: 30, windowMs: 60_000 })) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const body = await parseBody(request, CreateStudentSchema);
  if (body instanceof NextResponse) return body;

  const admin = createSupabaseAdmin();
  const email = `${body.username}@edu-platform.internal`;

  try {
    // 1. Create auth user (idempotent: surface "already exists" as 409)
    const { data: created, error: authErr } = await admin.auth.admin.createUser({
      email,
      password: body.password,
      email_confirm: true,
      user_metadata: { role: "student", name: body.name },
    });

    if (authErr || !created.user) {
      const msg = authErr?.message.toLowerCase() ?? "";
      if (msg.includes("already") || msg.includes("registered")) {
        return NextResponse.json({ error: "Логин уже занят" }, { status: 409 });
      }
      Sentry.captureException(authErr, { tags: { route: "POST /api/admin/students" } });
      return NextResponse.json({ error: "Не удалось создать аккаунт" }, { status: 500 });
    }

    // 2. If a group was selected, validate it exists and isn't a full VIP slot.
    if (body.groupId) {
      const { data: group } = await admin
        .from("groups")
        .select("id, tier")
        .eq("id", body.groupId)
        .maybeSingle();

      if (!group) {
        await admin.auth.admin.deleteUser(created.user.id);
        return NextResponse.json({ error: "Группа не найдена" }, { status: 400 });
      }
      if (group.tier === "vip") {
        const { count } = await admin
          .from("profiles")
          .select("id", { count: "exact", head: true })
          .eq("group_id", body.groupId);
        if ((count ?? 0) >= 1) {
          await admin.auth.admin.deleteUser(created.user.id);
          return NextResponse.json({ error: "VIP-группа уже занята" }, { status: 409 });
        }
      }
    }

    // 3. Generate a short, collision-resistant app_user_id ("student-a3f2k9").
    const appUserId = `student-${randomBytes(3).toString("hex")}`;

    // 4. Insert profile. If this fails, roll back the auth user to stay consistent.
    const { error: profileErr } = await admin.from("profiles").insert({
      id:          created.user.id,
      app_user_id: appUserId,
      name:        body.name,
      avatar_id:   body.avatarId ?? "avatar_1",
      role:        "student",
      tier:        "smart",
      xp:          0,
      group_id:    body.groupId ?? null,
    });

    if (profileErr) {
      await admin.auth.admin.deleteUser(created.user.id);
      Sentry.captureException(profileErr, { tags: { route: "POST /api/admin/students" } });
      return NextResponse.json({ error: "Не удалось сохранить профиль" }, { status: 500 });
    }

    return NextResponse.json({
      id:       appUserId,
      name:     body.name,
      avatarId: body.avatarId ?? "avatar_1",
      xp:       0,
    }, { status: 201 });
  } catch (err) {
    Sentry.captureException(err, { tags: { route: "POST /api/admin/students" } });
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
