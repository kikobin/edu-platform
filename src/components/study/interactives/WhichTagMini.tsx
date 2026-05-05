"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useStepDone } from "../useStepDone";
import { CheckIcon, HelpIcon } from "@/components/brand/Icon";
import type { WhichTagMiniContent } from "@/types/study";

interface Props {
  lessonSlug: string;
  stepKey: string;
  content: WhichTagMiniContent;
}

/**
 * Series of single-choice quick-check questions. Step is marked done once
 * the student answers every question (correctness is shown but doesn't gate).
 */
export function WhichTagMini({ lessonSlug, stepKey, content }: Props) {
  const { isDone, markDone } = useStepDone(lessonSlug, stepKey);
  const [picks, setPicks] = useState<Record<string, number>>({});

  const allAnswered = content.questions.every((q) => picks[q.id] !== undefined);

  const onPick = (qid: string, optionIdx: number) => {
    if (picks[qid] !== undefined) return;
    const next = { ...picks, [qid]: optionIdx };
    setPicks(next);
    if (content.questions.every((q) => next[q.id] !== undefined)) {
      markDone();
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {content.questions.map((q, i) => {
        const picked = picks[q.id];
        const showFeedback = picked !== undefined;
        const correct = picked === q.correctIndex;

        return (
          <div
            key={q.id}
            className="bg-white rounded-xl border border-border p-6 md:p-7"
          >
            <div className="flex items-start gap-3 mb-5">
              <span className="w-6 h-6 rounded-md bg-primary/10 text-primary text-[11px] font-semibold flex items-center justify-center shrink-0">
                {i + 1}
              </span>
              <h3 className="text-[15px] md:text-[16px] font-semibold text-text leading-snug">
                {q.text}
              </h3>
            </div>

            <div className="flex flex-col gap-2">
              {q.options.map((opt, idx) => {
                const isPick = picked === idx;
                const isCorrect = idx === q.correctIndex;
                const reveal = showFeedback;

                return (
                  <button
                    key={idx}
                    onClick={() => onPick(q.id, idx)}
                    disabled={picked !== undefined}
                    className={cn(
                      "text-left px-4 py-3 rounded-lg border transition-colors text-[14px]",
                      !reveal &&
                        "bg-bg border-border hover:border-primary/30 text-text",
                      reveal && isCorrect &&
                        "bg-success/8 border-success/40 text-success",
                      reveal && isPick && !isCorrect &&
                        "bg-error-light border-error/30 text-error",
                      reveal && !isPick && !isCorrect &&
                        "bg-bg border-border text-text-muted opacity-60"
                    )}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>

            <AnimatePresence>
              {showFeedback && q.explanation && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={cn(
                    "mt-4 px-4 py-3 rounded-lg text-[13px] leading-relaxed flex gap-2.5 items-start",
                    correct
                      ? "bg-success/8 text-success/90 border border-success/20"
                      : "bg-amber-50 text-amber-800 border border-amber-200"
                  )}
                >
                  {correct ? <CheckIcon size={14} className="shrink-0 mt-0.5" /> : <HelpIcon size={14} className="shrink-0 mt-0.5" />}
                  <span>{q.explanation}</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}

      {allAnswered && !isDone && (
        <div className="text-center text-[13px] text-text-muted">
          Сохраняем результат…
        </div>
      )}
      {isDone && (
        <div className="inline-flex items-center justify-center gap-1.5 text-center text-[13px] font-semibold text-success">
          <CheckIcon size={14} />
          Шаг засчитан
        </div>
      )}
    </div>
  );
}
