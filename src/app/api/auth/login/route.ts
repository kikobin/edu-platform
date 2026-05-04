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
    const email = `${uname}@edu-platform.internal`;

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error || !data.user) {
      return NextResponse.json({ error: "Неверный логин или пароль" }, { status: 401 });
    }

    const meta = data.user.user_metadata ?? {};
    const user = {
      id:       (meta.appUserId as string) ?? data.user.id,
      name:     (meta.name      as string) ?? body.username,
      role:     (meta.role      as string) ?? "student",
      avatarId: (meta.avatarId  as string) ?? "avatar_1",
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
