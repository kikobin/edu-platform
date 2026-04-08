"use client";

import { useRouter } from "next/navigation";
import { useUserStore } from "@/store/userStore";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title:      string;
  subtitle?:  string;
  showBack?:  boolean;
  backHref?:  string;
  right?:     React.ReactNode;
  showXP?:    boolean;
  className?: string;
}

export function PageHeader({ title, subtitle, showBack, backHref, right, showXP, className }: PageHeaderProps) {
  const router = useRouter();
  const xp = useUserStore((s) => s.xp);

  return (
    <header className={cn("flex items-center gap-3 px-4 md:px-0 pt-5 pb-4", className)}>
      {showBack && (
        <button
          onClick={() => backHref ? router.push(backHref) : router.back()}
          aria-label="Назад"
          className={
            "w-10 h-10 shrink-0 flex items-center justify-center rounded-xl " +
            "bg-white border border-border shadow-card text-text " +
            "hover:border-primary/20 hover:shadow-card-md " +
            "transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          }
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 3L5 8L10 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      )}

      <div className="flex-1 min-w-0">
        <h1 className="text-xl font-black text-text tracking-tight leading-tight truncate">{title}</h1>
        {subtitle && <p className="text-sm text-text-muted mt-0.5 truncate">{subtitle}</p>}
      </div>

      {showXP && (
        <div className="hidden md:flex items-center gap-1.5 bg-dark px-3 py-1.5 rounded-xl">
          <span className="text-accent text-sm">⚡</span>
          <span className="font-black text-white text-sm">{xp} XP</span>
        </div>
      )}

      {right && <div className="shrink-0">{right}</div>}
    </header>
  );
}
