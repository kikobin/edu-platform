"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/brand/Icon";
import { cn } from "@/lib/utils";
import { StepStepper, type StepperItem } from "./StepStepper";

interface StepShellProps {
  caption: string;
  title: string;
  description?: string;
  /** "Шаг 7 из 11" — left-side label of the progress strip */
  stepLabel: string;
  /** Current step number (1-based). Drives stepper highlight. */
  currentStepN: number;
  /** All lesson steps with done-state — drives stepper rendering. */
  steps: StepperItem[];
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
  currentStepN,
  steps,
  backHref,
  prevHref,
  nextHref,
  isDone,
  children,
}: StepShellProps) {
  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-[1240px] mx-auto px-5 md:px-10 lg:px-12 pt-6 pb-16">
        <div className="flex items-center justify-between mb-4">
          <Link
            href={backHref}
            className="inline-flex items-center gap-1.5 text-[14px] font-medium text-text-muted hover:text-text transition-colors -ml-2 px-2 py-1.5 rounded-md hover:bg-white"
          >
            <ChevronLeftIcon size={14} />
            К уроку
          </Link>
          <span className="text-[12px] font-semibold text-text-muted tabular-nums">
            {stepLabel}
          </span>
        </div>

        {/* Mobile-only compact stepper, above-the-fold */}
        <div className="lg:hidden mb-8">
          <StepStepper items={steps} currentN={currentStepN} variant="horizontal" />
        </div>

        <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_280px] lg:gap-12">
          <div className="min-w-0">
            <header className="mb-9">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-primary mb-3">
                {caption}
              </p>
              <h1 className="text-[26px] md:text-[32px] font-semibold text-text leading-[1.15] tracking-tight">
                {title}
              </h1>
              {description && (
                <p className="text-text-muted text-[15px] mt-3 max-w-[640px] leading-relaxed">
                  {description}
                </p>
              )}
            </header>

            <div className="mb-12">{children}</div>

            <nav className="border-t border-border pt-5 flex items-center justify-between gap-3">
              {prevHref ? (
                <Link
                  href={prevHref}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-[14px] font-medium text-text-muted hover:text-text hover:bg-white transition-colors"
                >
                  <ChevronLeftIcon size={14} />
                  Назад
                </Link>
              ) : (
                <Link
                  href={backHref}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-[14px] font-medium text-text-muted hover:text-text hover:bg-white transition-colors"
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
                    "inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-[14px] font-semibold transition-colors",
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
                    "inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-[14px] font-semibold transition-colors",
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

          <aside className="hidden lg:block">
            <div className="sticky top-6 bg-white rounded-xl border border-border p-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-text-muted mb-4">
                Шаги урока
              </p>
              <StepStepper items={steps} currentN={currentStepN} variant="vertical" />
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
