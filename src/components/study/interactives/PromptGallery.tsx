"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useStepDone } from "../useStepDone";
import { CheckIcon } from "@/components/brand/Icon";
import type { PromptGalleryContent } from "@/types/study";

interface Props {
  lessonSlug: string;
  stepKey: string;
  content: PromptGalleryContent;
}

/**
 * Gallery of ready-made prompts a student can copy into the target generation
 * tool (Midjourney, Veo, Lyria, …). Step is marked done after the student
 * copies at least `copiesRequired` distinct prompts (default 1) — proof of
 * having engaged with the gallery, while the actual generation is checked
 * separately via the lesson's submit-work step.
 */
export function PromptGallery({ lessonSlug, stepKey, content }: Props) {
  const { isDone, markDone } = useStepDone(lessonSlug, stepKey);
  const required = content.copiesRequired ?? 1;
  const [copied, setCopied] = useState<Set<string>>(new Set());
  const [flashId, setFlashId] = useState<string | null>(null);

  const copy = async (id: string, prompt: string) => {
    try {
      await navigator.clipboard.writeText(prompt);
    } catch {
      // Clipboard API can fail on insecure contexts — still mark "intent to copy"
      // so the student isn't blocked. They'll select+copy manually.
    }
    const next = new Set(copied);
    next.add(id);
    setCopied(next);
    setFlashId(id);
    setTimeout(() => setFlashId((cur) => (cur === id ? null : cur)), 1400);
    if (next.size >= required) markDone();
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-white rounded-xl border border-border p-5 md:p-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-primary mb-2">
          Где использовать
        </p>
        <div className="flex flex-wrap items-center gap-3 text-[13px]">
          <span className="font-semibold text-text">{content.targetTool}</span>
          {content.targetUrl && (
            <a
              href={content.targetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Открыть в новой вкладке →
            </a>
          )}
        </div>
        <p className="text-text-muted text-[12px] mt-2 leading-relaxed">
          Скопируй любой понравившийся промт, открой инструмент и сгенерируй свой результат.
          {required > 1 && ` Чтобы засчитать шаг, скопируй минимум ${required}.`}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {content.items.map((item) => {
          const isCopied = copied.has(item.id);
          const isFlashing = flashId === item.id;
          return (
            <div
              key={item.id}
              className={cn(
                "bg-white rounded-xl border transition-colors p-5 flex flex-col gap-3",
                isCopied ? "border-success/40 bg-success/4" : "border-border",
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-[14px] font-semibold text-text leading-snug">
                  {item.label}
                </h3>
                {(item.tool || item.style) && (
                  <div className="flex flex-wrap gap-1.5 shrink-0">
                    {item.tool && (
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-primary bg-primary/8 px-2 py-0.5 rounded">
                        {item.tool}
                      </span>
                    )}
                    {item.style && (
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-text-muted bg-bg px-2 py-0.5 rounded">
                        {item.style}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {item.previewImageUrl && (
                <div className="rounded-lg overflow-hidden border border-border bg-bg">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.previewImageUrl}
                    alt={`Пример: ${item.label}`}
                    loading="lazy"
                    className="w-full h-auto block"
                  />
                </div>
              )}

              <pre className="text-[12px] leading-relaxed text-text bg-bg rounded-lg p-3 whitespace-pre-wrap font-mono">
                {item.prompt}
              </pre>

              {item.note && (
                <p className="text-[11px] text-text-muted leading-relaxed">{item.note}</p>
              )}

              <button
                type="button"
                onClick={() => copy(item.id, item.prompt)}
                className={cn(
                  "inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-[13px] font-semibold border transition-colors",
                  isCopied
                    ? "bg-success border-success text-white"
                    : "bg-white border-border text-text hover:border-primary/40 hover:text-primary",
                )}
              >
                <AnimatePresence mode="wait" initial={false}>
                  {isFlashing ? (
                    <motion.span
                      key="flash"
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      className="inline-flex items-center gap-1.5"
                    >
                      <CheckIcon size={14} /> Скопировано
                    </motion.span>
                  ) : isCopied ? (
                    <motion.span
                      key="copied"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="inline-flex items-center gap-1.5"
                    >
                      <CheckIcon size={14} /> В буфере
                    </motion.span>
                  ) : (
                    <motion.span
                      key="copy"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      Скопировать
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
            </div>
          );
        })}
      </div>

      {isDone && (
        <div className="inline-flex items-center justify-center gap-1.5 text-center text-[13px] font-semibold text-success">
          <CheckIcon size={14} />
          {content.successNote ?? "Промт скопирован — переходи в инструмент и генерь свой результат"}
        </div>
      )}
    </div>
  );
}
