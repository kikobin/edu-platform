"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useStepDone } from "../useStepDone";
import { CheckIcon, CelebrateIcon } from "@/components/brand/Icon";
import type { RoleSwapContent } from "@/types/study";

interface Props {
  lessonSlug: string;
  stepKey: string;
  content: RoleSwapContent;
}

/**
 * Show one question and N "slots". In each slot the student picks a role,
 * and we render that role's sample answer below the slot. Step is done
 * when each slot has a *different* role assigned.
 */
export function RoleSwap({ lessonSlug, stepKey, content }: Props) {
  const { isDone, markDone } = useStepDone(lessonSlug, stepKey);
  const slotCount = content.slots ?? 3;
  const [picks, setPicks] = useState<(string | null)[]>(() =>
    Array.from({ length: slotCount }, () => null)
  );

  const allDifferent = useMemo(() => {
    const filled = picks.filter((p): p is string => Boolean(p));
    return filled.length === slotCount && new Set(filled).size === slotCount;
  }, [picks, slotCount]);

  useEffect(() => {
    if (allDifferent) markDone();
  }, [allDifferent, markDone]);

  const setSlot = (slotIdx: number, roleId: string | null) => {
    setPicks((prev) => {
      const next = [...prev];
      next[slotIdx] = roleId;
      return next;
    });
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="bg-white rounded-xl border border-border p-6 md:p-7">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-text-muted mb-2">
          Один вопрос
        </p>
        <p className="text-[15px] md:text-[16px] font-semibold text-text leading-snug">
          {content.question}
        </p>
      </div>

      {Array.from({ length: slotCount }).map((_, slotIdx) => {
        const pickedId = picks[slotIdx];
        const role = pickedId ? content.roles.find((r) => r.id === pickedId) : null;
        const usedElsewhere = (id: string) =>
          picks.some((p, idx) => idx !== slotIdx && p === id);

        return (
          <div
            key={slotIdx}
            className="bg-white rounded-xl border border-border p-6 md:p-7"
          >
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-text-muted mb-3">
              Слот {slotIdx + 1} — выбери роль
            </p>
            <div className="flex flex-wrap gap-2 mb-4">
              {content.roles.map((r) => {
                const picked = pickedId === r.id;
                const used = usedElsewhere(r.id);
                return (
                  <button
                    key={r.id}
                    disabled={used && !picked}
                    onClick={() => setSlot(slotIdx, picked ? null : r.id)}
                    className={cn(
                      "px-3.5 py-1.5 rounded-md text-[12px] font-semibold border transition-colors",
                      picked && "bg-primary/8 border-primary/40 text-primary",
                      !picked && !used &&
                        "bg-white border-border text-text hover:border-primary/30",
                      !picked && used && "bg-bg border-border text-text-muted opacity-40"
                    )}
                  >
                    {r.label}
                  </button>
                );
              })}
            </div>

            <AnimatePresence mode="wait">
              {role && (
                <motion.div
                  key={role.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="px-4 py-3 rounded-lg bg-primary/6 border border-primary/15 text-[13px] text-text leading-relaxed"
                >
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-primary mb-1">
                    {role.label} отвечает
                  </p>
                  {role.sampleAnswer}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}

      <AnimatePresence>
        {allDifferent && content.successNote && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-success/8 border border-success/30 rounded-xl p-5 text-center text-success font-medium inline-flex items-center justify-center gap-2.5"
          >
            <CelebrateIcon size={18} />
            <span className="text-[14px]">{content.successNote}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {isDone && !allDifferent && (
        <div className="inline-flex items-center justify-center gap-1.5 text-center text-[13px] font-semibold text-success">
          <CheckIcon size={14} />
          Шаг уже засчитан
        </div>
      )}
    </div>
  );
}
