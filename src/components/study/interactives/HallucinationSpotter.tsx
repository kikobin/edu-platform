"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useStepDone } from "../useStepDone";
import { Button } from "@/components/ui/Button";
import { CheckIcon, CloseIcon, HelpIcon } from "@/components/brand/Icon";
import type { HallucinationSpotterContent } from "@/types/study";

interface Props {
  lessonSlug: string;
  stepKey: string;
  content: HallucinationSpotterContent;
}

/**
 * Show a context prompt + a fake AI answer broken into statements. Student
 * marks each statement as "hallucination" or leaves it. After submitting,
 * we reveal correctness with explanations. Step done after submit.
 */
export function HallucinationSpotter({ lessonSlug, stepKey, content }: Props) {
  const { isDone, markDone } = useStepDone(lessonSlug, stepKey);
  const [marked, setMarked] = useState<Record<string, boolean>>({});
  const [submitted, setSubmitted] = useState(false);

  const toggle = (id: string) => {
    if (submitted) return;
    setMarked((p) => ({ ...p, [id]: !p[id] }));
  };

  const onSubmit = () => {
    setSubmitted(true);
    markDone();
  };

  const correctCount = content.statements.filter((s) => {
    const isHall = s.verdict === "hallucination";
    return marked[s.id] === isHall;
  }).length;

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-dark rounded-xl p-6 md:p-7">
        <p className="text-white/40 text-[10px] font-semibold uppercase tracking-[0.14em] mb-2">
          Промт, отправленный ИИ
        </p>
        <pre className="text-[13px] text-white/90 whitespace-pre-wrap font-sans leading-relaxed">
          {content.contextPrompt}
        </pre>
      </div>

      <div className="bg-white rounded-xl border border-border p-6 md:p-7">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-text-muted mb-4">
          Ответ ИИ — отметь то, что выглядит как выдумка
        </p>
        <div className="flex flex-col gap-2">
          {content.statements.map((st) => {
            const isMarked = marked[st.id] ?? false;
            const isHall = st.verdict === "hallucination";
            const correct = submitted && isMarked === isHall;
            const wrong = submitted && isMarked !== isHall;

            return (
              <div key={st.id}>
                <button
                  onClick={() => toggle(st.id)}
                  disabled={submitted}
                  className={cn(
                    "w-full text-left px-4 py-3 rounded-lg border transition-colors flex items-start gap-3",
                    !submitted && isMarked && "bg-error-light border-error/40",
                    !submitted && !isMarked &&
                      "bg-bg border-border hover:border-error/30",
                    correct && "bg-success/8 border-success/40",
                    wrong && "bg-amber-50 border-amber-300"
                  )}
                >
                  <span
                    className={cn(
                      "w-5 h-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5",
                      isMarked ? "bg-error border-error text-white" : "bg-white border-text-muted/40"
                    )}
                  >
                    {isMarked && <CloseIcon size={12} />}
                  </span>
                  <p
                    className={cn(
                      "text-[14px] leading-relaxed flex-1",
                      submitted && isHall && "font-semibold"
                    )}
                  >
                    {st.text}
                  </p>
                </button>
                {submitted && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={cn(
                      "mt-1.5 mb-1 ml-11 inline-flex items-start gap-1.5 text-[12px] leading-relaxed",
                      isHall ? "text-error" : "text-success"
                    )}
                  >
                    {isHall ? <HelpIcon size={12} className="mt-0.5 shrink-0" /> : <CheckIcon size={12} className="mt-0.5 shrink-0" />}
                    <span>{isHall ? "Выдумка. " : "Правда. "}{st.explanation}</span>
                  </motion.p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {!submitted ? (
        <Button fullWidth size="lg" onClick={onSubmit}>
          Проверить
        </Button>
      ) : (
        <div className="bg-primary/8 border border-primary/30 rounded-xl p-5 text-center">
          <p className="text-primary font-semibold text-[14px]">
            Точность: {correctCount} из {content.statements.length}
          </p>
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
