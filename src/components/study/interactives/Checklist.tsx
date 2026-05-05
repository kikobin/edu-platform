"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useStepDone } from "../useStepDone";
import { CheckIcon, CloseIcon, InfoIcon } from "@/components/brand/Icon";
import type { ChecklistContent } from "@/types/study";

type Answer = "yes" | "no" | undefined;

interface Props {
  lessonSlug: string;
  stepKey: string;
  content: ChecklistContent;
}

export function Checklist({ lessonSlug, stepKey, content }: Props) {
  const { isDone, markDone } = useStepDone(lessonSlug, stepKey);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});

  const setAnswer = (id: string, answer: Answer) => {
    const next = { ...answers, [id]: answer };
    setAnswers(next);
    if (content.items.every((it) => next[it.id] === "yes")) {
      markDone();
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {content.items.map((item, i) => {
        const ans = answers[item.id];
        return (
          <div
            key={item.id}
            className={cn(
              "bg-white rounded-xl border transition-colors p-5 md:p-6",
              ans === "yes" ? "border-success/40 bg-success/4" :
              ans === "no" ? "border-amber-200 bg-amber-50/40" :
              "border-border"
            )}
          >
            <div className="flex items-start gap-3 mb-4">
              <span className="w-6 h-6 rounded-md bg-primary/10 text-primary text-[11px] font-semibold flex items-center justify-center shrink-0">
                {i + 1}
              </span>
              <p className="text-[14px] font-semibold text-text leading-snug flex-1">{item.question}</p>
            </div>

            <div className="flex gap-2.5">
              <button
                onClick={() => setAnswer(item.id, "yes")}
                className={cn(
                  "flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg text-[13px] font-semibold border transition-colors",
                  ans === "yes"
                    ? "bg-success border-success text-white"
                    : "bg-white border-border text-text-muted hover:border-success/40 hover:text-success"
                )}
              >
                <CheckIcon size={14} /> Да
              </button>
              <button
                onClick={() => setAnswer(item.id, "no")}
                className={cn(
                  "flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg text-[13px] font-semibold border transition-colors",
                  ans === "no"
                    ? "bg-amber-500 border-amber-500 text-white"
                    : "bg-white border-border text-text-muted hover:border-amber-400 hover:text-amber-600"
                )}
              >
                <CloseIcon size={14} /> Пока нет
              </button>
            </div>

            <AnimatePresence>
              {ans === "no" && (
                <motion.div
                  initial={{ opacity: 0, y: 6, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: "auto" }}
                  exit={{ opacity: 0, y: -6, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="mt-4 px-4 py-3 rounded-lg bg-amber-50 border border-amber-200 text-[13px] text-amber-800 leading-relaxed flex gap-2.5 items-start">
                    <InfoIcon size={14} className="shrink-0 mt-0.5" />
                    <span>{item.hintIfNo}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}

      {isDone && (
        <div className="inline-flex items-center justify-center gap-1.5 text-center text-[13px] font-semibold text-success">
          <CheckIcon size={14} />
          Все пункты выполнены, шаг засчитан
        </div>
      )}
    </div>
  );
}
