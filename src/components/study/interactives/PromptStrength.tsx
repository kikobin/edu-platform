"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useStepDone } from "../useStepDone";
import { CheckIcon } from "@/components/brand/Icon";
import type { PromptStrengthContent } from "@/types/study";

type Verdict = "weak" | "medium" | "strong";

const LABELS: Record<Verdict, { label: string; bg: string; border: string; text: string }> = {
  weak:   { label: "Слабый",  bg: "bg-error-light",  border: "border-error/30", text: "text-error" },
  medium: { label: "Средний", bg: "bg-amber-50",     border: "border-amber-200", text: "text-amber-700" },
  strong: { label: "Сильный", bg: "bg-success/8",    border: "border-success/30", text: "text-success" },
};

interface Props {
  lessonSlug: string;
  stepKey: string;
  content: PromptStrengthContent;
}

/**
 * Student rates each prompt as weak / medium / strong. Step is marked done
 * once every prompt has been rated. We show whether the rating matches the
 * intended verdict but do not gate progression on correctness.
 */
export function PromptStrength({ lessonSlug, stepKey, content }: Props) {
  const { isDone, markDone } = useStepDone(lessonSlug, stepKey);
  const [picks, setPicks] = useState<Record<string, Verdict>>({});

  const onPick = (id: string, v: Verdict) => {
    if (picks[id]) return;
    const next = { ...picks, [id]: v };
    setPicks(next);
    if (content.items.every((it) => next[it.id])) markDone();
  };

  return (
    <div className="flex flex-col gap-5">
      {content.items.map((item, i) => {
        const pick = picks[item.id];
        const reveal = pick !== undefined;
        const correct = pick === item.verdict;
        const verdictMeta = LABELS[item.verdict];

        return (
          <div
            key={item.id}
            className="bg-white rounded-xl border border-border p-6 md:p-7"
          >
            <div className="flex items-start gap-3 mb-4">
              <span className="w-6 h-6 rounded-md bg-primary/10 text-primary text-[11px] font-semibold flex items-center justify-center shrink-0">
                {i + 1}
              </span>
              <pre className="flex-1 text-[14px] text-text whitespace-pre-wrap font-sans leading-relaxed">
                {item.text}
              </pre>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {(["weak", "medium", "strong"] as Verdict[]).map((v) => {
                const meta = LABELS[v];
                const isPick = pick === v;
                const isAnswer = item.verdict === v;
                return (
                  <button
                    key={v}
                    onClick={() => onPick(item.id, v)}
                    disabled={pick !== undefined}
                    className={cn(
                      "px-3 py-2.5 rounded-lg text-[13px] font-semibold border transition-colors",
                      !reveal && cn("bg-white border-border hover:border-primary/30", meta.text),
                      reveal && isPick && isAnswer && cn(meta.bg, meta.border, meta.text),
                      reveal && isPick && !isAnswer && "bg-error-light border-error/40 text-error",
                      reveal && !isPick && isAnswer && cn(meta.bg, meta.border, meta.text, "opacity-90"),
                      reveal && !isPick && !isAnswer && "bg-bg border-border text-text-muted opacity-60"
                    )}
                  >
                    {meta.label}
                  </button>
                );
              })}
            </div>

            <AnimatePresence>
              {reveal && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "mt-4 px-4 py-3 rounded-lg text-[13px] leading-relaxed border flex gap-2.5 items-start",
                    correct
                      ? "bg-success/8 text-success/90 border-success/20"
                      : cn(verdictMeta.bg, verdictMeta.border, verdictMeta.text)
                  )}
                >
                  {correct ? <CheckIcon size={14} className="shrink-0 mt-0.5" /> : null}
                  <span>{!correct && `Правильный ответ — ${verdictMeta.label.toLowerCase()}. `}{item.explanation}</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}

      {isDone && (
        <div className="inline-flex items-center justify-center gap-1.5 text-center text-[13px] font-semibold text-success">
          <CheckIcon size={14} />
          Шаг засчитан
        </div>
      )}
    </div>
  );
}
