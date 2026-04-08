import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { createSupabaseServer } from "@/lib/supabaseServer";

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ error: "Заполни все поля" }, { status: 400 });
    }

    const supabase = createSupabaseServer();
    const email = `${String(username).trim().toLowerCase()}@edu-platform.internal`;

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error || !data.user) {
      return NextResponse.json({ error: "Неверный логин или пароль" }, { status: 401 });
    }

    const meta = data.user.user_metadata ?? {};
    const user = {
      id:       (meta.appUserId as string) ?? data.user.id,
      name:     (meta.name      as string) ?? username,
      role:     (meta.role      as string) ?? "student",
      avatarId: (meta.avatarId  as string) ?? "avatar_1",
      email:    username as string,
    };

    // @supabase/ssr sets sb-access-token / sb-refresh-token cookies automatically.
    // No manual cookie management needed.
    return NextResponse.json({ user });
  } catch (err) {
    Sentry.captureException(err, { tags: { route: "POST /api/auth/login" } });
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
