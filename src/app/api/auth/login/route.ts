import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { createSupabaseServer } from "@/lib/supabaseServer";
import { rateLimit } from "@/lib/rateLimit";
import { parseBody, LoginSchema } from "@/lib/validation/schemas";

export async function POST(request: Request) {
  // Rate-limit BEFORE parsing so a flood of malformed bodies still hits the limiter.
  // The IP-keyed limit caps attackers; the username-keyed limit protects a single
  // account even when attempts come from many IPs.
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const ipOk = rateLimit(`login:ip:${ip}`, { limit: 20, windowMs: 60_000 });
  if (!ipOk) {
    return NextResponse.json({ error: "Слишком много попыток. Попробуй через минуту." }, { status: 429 });
  }

  const body = await parseBody(request, LoginSchema);
  if (body instanceof NextResponse) return body;

  const uname = body.username.toLowerCase();
  const userOk = rateLimit(`login:user:${uname}`, { limit: 10, windowMs: 60_000 });
  if (!userOk) {
    return NextResponse.json({ error: "Слишком много попыток. Попробуй через минуту." }, { status: 429 });
  }

  try {
    const password = body.password;
    const supabase = createSupabaseServer();
    const email = uname.includes("@") ? uname : `${uname}@edu-platform.internal`;

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error || !data.user) {
      return NextResponse.json({ error: "Неверный логин или пароль" }, { status: 401 });
    }

    // Read profile for app_user_id — user_metadata is never populated by seed
    const { createClient } = await import("@supabase/supabase-js");
    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!,
    );
    const { data: profile } = await admin
      .from("profiles")
      .select("app_user_id, name, avatar_id, role")
      .eq("id", data.user.id)
      .maybeSingle();

    if (!profile?.app_user_id) {
      return NextResponse.json({ error: "Аккаунт не настроен. Обратись к преподавателю." }, { status: 403 });
    }

    const user = {
      id:       profile.app_user_id as string,
      name:     (profile.name      as string) ?? body.username,
      role:     (profile.role      as string) ?? "student",
      avatarId: (profile.avatar_id as string) ?? "avatar_1",
      email:    body.username,
    };

    // @supabase/ssr sets sb-access-token / sb-refresh-token cookies automatically.
    // No manual cookie management needed.
    return NextResponse.json({ user });
  } catch (err) {
    Sentry.captureException(err, { tags: { route: "POST /api/auth/login" } });
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
