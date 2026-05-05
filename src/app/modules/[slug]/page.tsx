import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { AppLayout } from "@/components/layout/AppLayout";
import { getModuleBySlug, MODULES } from "@/content/study-modules";
import { getLessonsByModule } from "@/content/study-lessons";
import { ModuleLessonsList } from "@/components/study/ModuleLessonsList";
import { ChevronLeftIcon, ToolIcon } from "@/components/brand/Icon";
import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

interface Params { slug: string }

export function generateStaticParams() {
  return MODULES.filter((m) => m.status === "available").map((m) => ({ slug: m.slug }));
}

export function generateMetadata({ params }: { params: Params }): Metadata {
  const mod = getModuleBySlug(params.slug);
  if (!mod) return { title: "Модуль не найден" };
  return { title: `${mod.title} · edu-platform`, description: mod.subtitle };
}

async function getCurrentTier(): Promise<"smart" | "vip" | undefined> {
  try {
    const server = createSupabaseServer();
    const { data: { user } } = await server.auth.getUser();
    if (!user) return undefined;
    const admin = createSupabaseAdmin();
    const { data } = await admin
      .from("profiles")
      .select("tier")
      .eq("id", user.id)
      .maybeSingle();
    const t = data?.tier as string | null;
    return t === "smart" || t === "vip" ? t : undefined;
  } catch {
    return undefined;
  }
}

export default async function ModulePage({ params }: { params: Params }) {
  const mod = getModuleBySlug(params.slug);
  if (!mod) notFound();

  const tier = await getCurrentTier();
  const lessons = getLessonsByModule(mod.slug, tier);

  return (
    <AppLayout wide>
      <div className="px-5 md:px-0 pt-6 pb-8">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-[13px] font-medium text-text-muted hover:text-text transition-colors -ml-2 px-2 py-1.5 rounded-md hover:bg-white mb-6"
        >
          <ChevronLeftIcon size={14} />
          К модулям
        </Link>

        <header className="mb-8">
          <h1 className="text-[28px] md:text-[36px] font-semibold text-text leading-[1.15] tracking-tight">
            {mod.title}
          </h1>
          <p className="text-text-muted text-[15px] mt-3 max-w-[560px] leading-relaxed">
            {mod.subtitle}
          </p>
        </header>

        {mod.status === "soon" ? (
          <div className="bg-white rounded-xl border border-border p-10 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-bg text-text-muted mb-3">
              <ToolIcon size={22} />
            </div>
            <p className="text-[15px] font-semibold text-text">Скоро откроется</p>
            <p className="text-[13px] text-text-muted mt-1">
              Этот модуль находится в разработке.
            </p>
          </div>
        ) : (
          <ModuleLessonsList lessons={lessons} />
        )}
      </div>
    </AppLayout>
  );
}
