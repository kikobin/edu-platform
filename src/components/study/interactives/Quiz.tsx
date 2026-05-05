"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useStepDone } from "../useStepDone";
import { Button } from "@/components/ui/Button";
import { CheckIcon, HelpIcon, CelebrateIcon } from "@/components/brand/Icon";
import type { QuizContent } from "@/types/study";

interface Props {
  lessonSlug: string;
  stepKey: string;
  content: QuizContent;
}

/**
 * Single-page quiz. Student answers all questions, hits "Проверить",
 * sees per-question feedback. If score ≥ passThreshold → step done.
 * Otherwise can retry.
 */
export function Quiz({ lessonSlug, stepKey, content }: Props) {
  const { isDone, markDone } = useStepDone(lessonSlug, stepKey);

  const [picks, setPicks] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);

  const allAnswered = content.questions.every((q) => picks[q.id] !== undefined);

  const score = useMemo(() => {
    const correct = content.questions.filter((q) => picks[q.id] === q.correctIndex).length;
    return Math.round((correct / content.questions.length) * 100);
  }, [picks, content.questions]);

  const passed = score >= content.passThreshold;

  const onCheck = () => {
    setSubmitted(true);
    if (passed) markDone();
  };

  const onRetry = () => {
    setPicks({});
    setSubmitted(false);
  };

  return (
    <div className="flex flex-col gap-6">
      {content.questions.map((q, i) => {
        const picked = picks[q.id];
        const reveal = submitted;
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

                return (
                  <button
                    key={idx}
                    onClick={() => !submitted && setPicks((p) => ({ ...p, [q.id]: idx }))}
                    disabled={submitted}
                    className={cn(
                      "text-left px-4 py-3 rounded-lg border transition-colors text-[14px]",
                      !reveal && isPick && "bg-primary/8 border-primary/40 text-primary",
                      !reveal && !isPick &&
                        "bg-bg border-border hover:border-primary/30 text-text",
                      reveal && isCorrect && "bg-success/8 border-success/40 text-success",
                      reveal && isPick && !isCorrect && "bg-error-light border-error/30 text-error",
                      reveal && !isPick && !isCorrect && "bg-bg border-border text-text-muted opacity-60"
                    )}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>

            {submitted && q.explanation && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "mt-4 px-4 py-3 rounded-lg text-[13px] leading-relaxed border flex gap-2.5 items-start",
                  correct
                    ? "bg-success/8 text-success/90 border-success/20"
                    : "bg-amber-50 text-amber-800 border-amber-200"
                )}
              >
                {correct ? <CheckIcon size={14} className="shrink-0 mt-0.5" /> : <HelpIcon size={14} className="shrink-0 mt-0.5" />}
                <span>{q.explanation}</span>
              </motion.div>
            )}
          </div>
        );
      })}

      {!submitted ? (
        <Button
          fullWidth
          size="lg"
          variant="primary"
          disabled={!allAnswered}
          onClick={onCheck}
        >
          Проверить
        </Button>
      ) : passed ? (
        <div className="bg-success/8 border border-success/30 rounded-xl p-6 text-center">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-success/15 text-success mb-3">
            <CelebrateIcon size={20} />
          </div>
          <p className="text-success font-semibold text-[16px]">Результат: {score}%</p>
          <p className="text-text-muted text-[13px] mt-1">
            Минимум для зачёта: {content.passThreshold}%. Шаг засчитан.
          </p>
        </div>
      ) : (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-amber-100 text-amber-700 mb-3">
            <HelpIcon size={20} />
          </div>
          <p className="text-amber-700 font-semibold text-[16px]">Результат: {score}%</p>
          <p className="text-text-muted text-[13px] mt-1 mb-4">
            Нужно минимум {content.passThreshold}%. Попробуй ещё раз.
          </p>
          <Button variant="secondary" onClick={onRetry}>
            Пройти заново
          </Button>
        </div>
      )}

      {isDone && !submitted && (
        <div className="inline-flex items-center justify-center gap-1.5 text-center text-[13px] font-semibold text-success">
          <CheckIcon size={14} />
          Шаг уже засчитан
        </div>
      )}
    </div>
  );
}
