"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/brand/Icon";
import { cn } from "@/lib/utils";

interface StepShellProps {
  caption: string;
  title: string;
  description?: string;
  /** "Шаг 7 из 11" — left-side label of the progress strip */
  stepLabel: string;
  /** 0..100 — width of the filled progress bar */
  progressPercent: number;
  /** Back-to-lesson href (lesson landing). */
  backHref: string;
  /** Previous step href; null if this is the first step. */
  prevHref: string | null;
  /** Next step href; null if this is the last step. */
  nextHref: string | null;
  /** Whether the current step has been marked as done. Controls "Дальше" enable. */
  isDone: boolean;
  children: ReactNode;
}

export function StepShell({
  caption,
  title,
  description,
  stepLabel,
  progressPercent,
  backHref,
  prevHref,
  nextHref,
  isDone,
  children,
}: StepShellProps) {
  const safePct = Math.max(0, Math.min(100, progressPercent));

  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-3xl mx-auto px-5 md:px-10 pt-6 pb-16">
        {/* Header strip */}
        <div className="flex items-center justify-between mb-5">
          <Link
            href={backHref}
            className="inline-flex items-center gap-1.5 text-[13px] font-medium text-text-muted hover:text-text transition-colors -ml-2 px-2 py-1.5 rounded-md hover:bg-white"
          >
            <ChevronLeftIcon size={14} />
            К уроку
          </Link>
          <span className="text-[11px] font-semibold text-text-muted tabular-nums">
            {stepLabel}
          </span>
        </div>

        {/* Progress bar */}
        <div className="mb-10 h-[3px] w-full bg-white rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-primary rounded-full"
            animate={{ width: `${safePct}%` }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          />
        </div>

        {/* Title block */}
        <header className="mb-10">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-primary mb-3">
            {caption}
          </p>
          <h1 className="text-[26px] md:text-[32px] font-semibold text-text leading-[1.15] tracking-tight">
            {title}
          </h1>
          {description && (
            <p className="text-text-muted text-[15px] mt-3 max-w-[560px] leading-relaxed">
              {description}
            </p>
          )}
        </header>

        {/* Step content */}
        <div className="mb-12">{children}</div>

        {/* Footer nav */}
        <nav className="border-t border-border pt-5 flex items-center justify-between gap-3">
          {prevHref ? (
            <Link
              href={prevHref}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-[13px] font-medium text-text-muted hover:text-text hover:bg-white transition-colors"
            >
              <ChevronLeftIcon size={14} />
              Назад
            </Link>
          ) : (
            <Link
              href={backHref}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-[13px] font-medium text-text-muted hover:text-text hover:bg-white transition-colors"
            >
              <ChevronLeftIcon size={14} />
              К видео
            </Link>
          )}

          {nextHref ? (
            <Link
              href={isDone ? nextHref : "#"}
              aria-disabled={!isDone}
              onClick={(e) => {
                if (!isDone) e.preventDefault();
              }}
              className={cn(
                "inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-[13px] font-semibold transition-colors",
                isDone
                  ? "bg-primary text-white hover:bg-primary-hover"
                  : "bg-locked text-text-muted cursor-not-allowed"
              )}
            >
              Дальше
              <ChevronRightIcon size={14} />
            </Link>
          ) : (
            <Link
              href={isDone ? backHref : "#"}
              aria-disabled={!isDone}
              onClick={(e) => {
                if (!isDone) e.preventDefault();
              }}
              className={cn(
                "inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-[13px] font-semibold transition-colors",
                isDone
                  ? "bg-accent text-text hover:bg-accent-hover"
                  : "bg-locked text-text-muted cursor-not-allowed"
              )}
            >
              Завершить урок
            </Link>
          )}
        </nav>
      </div>
    </div>
  );
}
