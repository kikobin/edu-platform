import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabaseServer";
import { AdminShell } from "./AdminShell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Server-side guard: redirect anyone who is not curator/admin before any
  // admin UI renders. Defense-in-depth on top of the middleware role check.
  const supabase = createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const role = (user.user_metadata?.role as string | undefined) ?? "student";
  if (role !== "curator" && role !== "admin") {
    redirect("/dashboard");
  }

  return <AdminShell>{children}</AdminShell>;
}
