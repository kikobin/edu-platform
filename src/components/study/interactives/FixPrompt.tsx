"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useStepDone } from "../useStepDone";
import { CheckIcon, CelebrateIcon } from "@/components/brand/Icon";
import type { FixPromptContent } from "@/types/study";

interface Props {
  lessonSlug: string;
  stepKey: string;
  content: FixPromptContent;
}

/**
 * Show a weak prompt and a row of upgrades (role / format / context / etc).
 * Each upgrade can be toggled — when on, its `addition` text appends to the
 * preview. Step is marked done once all upgrades are enabled at least once.
 */
export function FixPrompt({ lessonSlug, stepKey, content }: Props) {
  const { isDone, markDone } = useStepDone(lessonSlug, stepKey);
  const [enabled, setEnabled] = useState<Record<string, boolean>>({});

  const allOn = content.upgrades.every((u) => enabled[u.id]);

  useEffect(() => {
    if (allOn) markDone();
  }, [allOn, markDone]);

  const composed = useMemo(() => {
    const parts = [content.weakPrompt];
    for (const u of content.upgrades) {
      if (enabled[u.id]) parts.push(u.addition);
    }
    return parts.join("\n\n");
  }, [content.weakPrompt, content.upgrades, enabled]);

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-dark rounded-xl p-6 md:p-7">
        <p className="text-white/40 text-[10px] font-semibold uppercase tracking-[0.14em] mb-3">
          Текущий промт
        </p>
        <pre className="text-[13px] text-white/95 whitespace-pre-wrap font-sans leading-relaxed">
          {composed}
        </pre>
      </div>

      <div className="bg-white rounded-xl border border-border p-6 md:p-7">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-text-muted mb-4">
          Включи апгрейды и посмотри, как меняется промт
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {content.upgrades.map((u) => {
            const on = enabled[u.id] ?? false;
            return (
              <button
                key={u.id}
                onClick={() => setEnabled((p) => ({ ...p, [u.id]: !p[u.id] }))}
                className={cn(
                  "text-left p-4 rounded-lg border transition-colors",
                  on
                    ? "bg-accent/10 border-accent/40"
                    : "bg-white border-border hover:border-accent/30"
                )}
              >
                <div className="flex items-center gap-3 mb-2">
                  <span
                    className={cn(
                      "w-5 h-5 rounded-md border flex items-center justify-center shrink-0",
                      on ? "bg-accent border-accent text-text" : "bg-white border-text-muted/40"
                    )}
                  >
                    {on && <CheckIcon size={12} />}
                  </span>
                  <p className="text-[14px] font-semibold text-text">{u.label}</p>
                </div>
                <p className="text-[12px] text-text-muted leading-relaxed">{u.hint}</p>
              </button>
            );
          })}
        </div>
      </div>

      <AnimatePresence>
        {allOn && content.successNote && (
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

      {isDone && (
        <div className="inline-flex items-center justify-center gap-1.5 text-center text-[13px] font-semibold text-success">
          <CheckIcon size={14} />
          Шаг засчитан
        </div>
      )}
    </div>
  );
}
