"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useStepDone } from "../useStepDone";
import { CheckIcon, CloseIcon, HelpIcon } from "@/components/brand/Icon";
import type { FindLayerContent } from "@/types/study";

interface Props {
  lessonSlug: string;
  stepKey: string;
  content: FindLayerContent;
}

/**
 * Reads a code or block sequence and asks the student to label each
 * "fragment" with one of N options (e.g. HTML / CSS / JS).
 * Step is marked done after every fragment is labelled (correctness shown).
 */
export function FindLayer({ lessonSlug, stepKey, content }: Props) {
  const display = content.display ?? "code";
  const { isDone, markDone } = useStepDone(lessonSlug, stepKey);
  const [picks, setPicks] = useState<Record<string, string>>({});

  const fragments = useMemo(
    () => content.parts.filter((p): p is Extract<typeof p, { type: "fragment" }> => p.type === "fragment"),
    [content.parts]
  );

  const onPick = (id: string, value: string) => {
    if (picks[id]) return;
    const next = { ...picks, [id]: value };
    setPicks(next);
    if (fragments.every((f) => next[f.id])) markDone();
  };

  if (display === "blocks") {
    return (
      <div className="flex flex-col gap-5">
        {content.parts.map((part, i) => {
          if (part.type === "text") {
            return (
              <p key={i} className="text-sm text-text-muted leading-relaxed px-2">
                {part.content}
              </p>
            );
          }
          const pick = picks[part.id];
          const reveal = pick !== undefined;
          const correct = pick === part.answer;
          return (
            <div
              key={part.id}
              className="bg-white rounded-xl border border-border p-5 md:p-6"
            >
              <pre className="text-[13px] text-text font-mono whitespace-pre-wrap mb-4 bg-bg p-4 rounded-lg border border-border">
                {part.content}
              </pre>
              <div className="flex flex-wrap gap-2">
                {content.options.map((opt) => {
                  const isPick = pick === opt.value;
                  const isAnswer = opt.value === part.answer;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => onPick(part.id, opt.value)}
                      disabled={pick !== undefined}
                      className={cn(
                        "px-3.5 py-1.5 rounded-md text-[12px] font-semibold border transition-colors",
                        !reveal && "bg-white border-border text-text hover:border-primary/30",
                        reveal && isPick && correct && "bg-success/8 border-success/40 text-success",
                        reveal && isPick && !correct && "bg-error-light border-error/40 text-error",
                        reveal && !isPick && isAnswer && "bg-success/8 border-success/30 text-success opacity-90",
                        reveal && !isPick && !isAnswer && "bg-bg border-border text-text-muted opacity-50"
                      )}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
        {isDone && (
          <div className="inline-flex items-center justify-center gap-1.5 text-center text-[13px] font-semibold text-success">
            <CheckIcon size={14} />
            Все слои разобраны, шаг засчитан
          </div>
        )}
      </div>
    );
  }

  // display === "code" — single monospace block, fragments inlined as buttons.
  return (
    <div className="flex flex-col gap-5">
      <div className="bg-dark rounded-xl p-6 md:p-7 overflow-x-auto">
        <pre className="text-[13px] leading-relaxed font-mono whitespace-pre-wrap">
          {content.parts.map((part, i) => {
            if (part.type === "text") {
              return (
                <span key={i} className="text-white/85">
                  {part.content}
                </span>
              );
            }
            const pick = picks[part.id];
            const reveal = pick !== undefined;
            const correct = pick === part.answer;
            return (
              <span
                key={part.id}
                className={cn(
                  "inline-block px-1.5 py-0.5 rounded mx-0.5 my-0.5 align-baseline transition-colors",
                  !reveal && "bg-white/8 text-white",
                  reveal && correct && "bg-success/30 text-white",
                  reveal && !correct && "bg-error/30 text-white"
                )}
              >
                {part.content}
              </span>
            );
          })}
        </pre>
      </div>

      <div className="flex flex-col gap-2.5">
        {fragments.map((frag, i) => {
          const pick = picks[frag.id];
          const reveal = pick !== undefined;
          const correct = pick === frag.answer;
          return (
            <div
              key={frag.id}
              className="bg-white rounded-lg border border-border p-4"
            >
              <div className="flex items-center justify-between gap-3 mb-3">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                  Фрагмент {i + 1}
                </span>
                {reveal && (
                  <span className={cn("inline-flex items-center gap-1 text-[11px] font-semibold", correct ? "text-success" : "text-error")}>
                    {correct ? <CheckIcon size={12} /> : <CloseIcon size={12} />}
                    {correct ? "Верно" : "Неверно"}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {content.options.map((opt) => {
                  const isPick = pick === opt.value;
                  const isAnswer = opt.value === frag.answer;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => onPick(frag.id, opt.value)}
                      disabled={pick !== undefined}
                      className={cn(
                        "px-3 py-1.5 rounded-md text-[12px] font-semibold border transition-colors",
                        !reveal && "bg-white border-border text-text hover:border-primary/30",
                        reveal && isPick && correct && "bg-success/8 border-success/40 text-success",
                        reveal && isPick && !correct && "bg-error-light border-error/40 text-error",
                        reveal && !isPick && isAnswer && "bg-success/8 border-success/30 text-success opacity-90",
                        reveal && !isPick && !isAnswer && "bg-bg border-border text-text-muted opacity-50"
                      )}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
              <AnimatePresence>
                {reveal && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-3 inline-flex items-center gap-1.5 text-[11px] text-text-muted leading-relaxed"
                  >
                    {correct ? <CheckIcon size={12} /> : <HelpIcon size={12} />}
                    Правильный ответ: <strong className="text-text">{content.options.find((o) => o.value === frag.answer)?.label}</strong>
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {isDone && (
        <div className="inline-flex items-center justify-center gap-1.5 text-center text-[13px] font-semibold text-success">
          <CheckIcon size={14} />
          Все слои найдены, шаг засчитан
        </div>
      )}
    </div>
  );
}
