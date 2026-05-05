"use client";

import Link from "next/link";
import { CheckIcon } from "@/components/brand/Icon";
import { cn } from "@/lib/utils";

export interface StepperItem {
  n: number;
  title: string;
  href: string;
  done: boolean;
}

interface Props {
  items: StepperItem[];
  currentN: number;
  /** "horizontal" — compact dot strip for mobile / above-the-fold.
   *  "vertical"   — full list with titles for the desktop right rail. */
  variant: "horizontal" | "vertical";
}

export function StepStepper({ items, currentN, variant }: Props) {
  if (variant === "horizontal") {
    return (
      <ol className="flex items-center gap-1.5" aria-label="Шаги урока">
        {items.map((s) => {
          const isCurrent = s.n === currentN;
          return (
            <li key={s.n} className="flex-1">
              <Link
                href={s.href}
                aria-current={isCurrent ? "step" : undefined}
                aria-label={`Шаг ${s.n}: ${s.title}`}
                className={cn(
                  "block h-1.5 rounded-full transition-colors",
                  s.done
                    ? "bg-primary"
                    : isCurrent
                    ? "bg-primary/40"
                    : "bg-white hover:bg-primary/20"
                )}
              />
            </li>
          );
        })}
      </ol>
    );
  }

  return (
    <ol className="flex flex-col gap-1" aria-label="Шаги урока">
      {items.map((s) => {
        const isCurrent = s.n === currentN;
        return (
          <li key={s.n}>
            <Link
              href={s.href}
              aria-current={isCurrent ? "step" : undefined}
              className={cn(
                "flex items-start gap-3 px-3 py-2.5 rounded-lg border transition-colors",
                isCurrent
                  ? "bg-primary/8 border-primary/30"
                  : s.done
                  ? "bg-success/5 border-success/20 hover:bg-success/10"
                  : "bg-bg border-border hover:border-primary/30 hover:bg-white"
              )}
            >
              <span
                className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-[12px] font-semibold transition-colors",
                  isCurrent
                    ? "bg-primary text-white"
                    : s.done
                    ? "bg-success text-white"
                    : "bg-white border border-border text-text-muted"
                )}
              >
                {s.done ? <CheckIcon size={14} /> : s.n}
              </span>
              <span
                className={cn(
                  "text-[13px] leading-snug pt-1 min-w-0 break-words",
                  isCurrent
                    ? "text-text font-semibold"
                    : s.done
                    ? "text-text"
                    : "text-text-muted"
                )}
              >
                {s.title}
              </span>
            </Link>
          </li>
        );
      })}
    </ol>
  );
}
