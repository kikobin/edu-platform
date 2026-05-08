import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_PATHS = ["/login", "/api-docs", "/api/auth/login", "/api/auth/logout"];
const ADMIN_PATHS  = ["/admin"];
const STUDENT_PATHS = ["/dashboard", "/lesson", "/shop", "/profile", "/leaderboard"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Static assets and public paths — skip immediately
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // We need a mutable response so Supabase can refresh and persist tokens.
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Write refreshed cookies into both the request and the response so
          // subsequent server reads see the updated token.
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // getUser() validates the JWT and triggers a silent token refresh when needed.
  // This is the only safe way to check auth in middleware.
  const { data: { user } } = await supabase.auth.getUser();
  const role = (user?.user_metadata?.role as string) ?? null;
  const isAdminRole = role === "admin" || role === "curator";

  // ── Not authenticated ────────────────────────────────────────────────────────
  if (!user) {
    // API routes return 401 — handled by requireAuth() in each route
    if (pathname.startsWith("/api/")) return response;

    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // ── Already authenticated + visiting /login ──────────────────────────────────
  if (pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = isAdminRole ? "/admin" : "/dashboard";
    return NextResponse.redirect(url);
  }

  // ── Admin/curator paths — block students ─────────────────────────────────────
  if (ADMIN_PATHS.some((p) => pathname.startsWith(p))) {
    if (!isAdminRole) {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
    return response;
  }

  // ── Student paths — redirect curators/admins to /admin ───────────────────────
  if (isAdminRole && STUDENT_PATHS.some((p) => pathname.startsWith(p))) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico).*)"],
};
