"use client";

import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { useStepDone } from "../useStepDone";
import { useUserStore } from "@/store/userStore";
import { saveSavedPrompt } from "@/lib/promptStore";
import { Button } from "@/components/ui/Button";
import { CheckIcon } from "@/components/brand/Icon";
import type {
  PromptBuilderContent,
  PromptBuilderField,
} from "@/types/study";

type FieldValue = string | string[] | boolean | null | undefined;

interface Props {
  lessonSlug: string;
  stepKey: string;
  content: PromptBuilderContent;
}

function renderTemplate(template: string, values: Record<string, FieldValue>): string {
  return template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key) => {
    const v = values[key];
    if (v === null || v === undefined) return "___";
    if (typeof v === "boolean") return v ? "да" : "нет";
    if (Array.isArray(v)) return v.length > 0 ? v.join(", ") : "___";
    return v.trim() || "___";
  });
}

function isFieldComplete(field: PromptBuilderField, value: FieldValue): boolean {
  if (field.type === "yes-no") return typeof value === "boolean";
  if (field.type === "text") {
    if (typeof value !== "string") return false;
    const len = value.trim().length;
    return field.minLength ? len >= field.minLength : len > 0;
  }
  if (field.type === "radio-chips") {
    return typeof value === "string" && value.length > 0;
  }
  if (field.type === "multi-chips") {
    if (!Array.isArray(value)) return false;
    return field.minSelections ? value.length >= field.minSelections : value.length > 0;
  }
  return false;
}

/**
 * Form-driven prompt builder. Renders configurable fields, fills them into
 * a template, lets the student preview and save the assembled prompt.
 * The saved prompt is consumed by a later SendPrompt step in the same lesson.
 */
export function PromptBuilder({ lessonSlug, stepKey, content }: Props) {
  const { isDone, markDone } = useStepDone(lessonSlug, stepKey);
  const userId = useUserStore((s) => s.user?.id ?? null);
  const showToast = useUserStore((s) => s.showToast);

  const [values, setValues] = useState<Record<string, FieldValue>>({});

  const allFilled = useMemo(
    () => content.fields.every((f) => isFieldComplete(f, values[f.key])),
    [content.fields, values]
  );

  const assembled = useMemo(() => renderTemplate(content.template, values), [content.template, values]);

  useEffect(() => {
    if (allFilled) saveSavedPrompt(userId, lessonSlug, content.promptKey, assembled);
  }, [allFilled, userId, lessonSlug, content.promptKey, assembled]);

  const onSetField = (key: string, v: FieldValue) => {
    setValues((prev) => ({ ...prev, [key]: v }));
  };

  const onSave = async () => {
    if (!allFilled) return;
    saveSavedPrompt(userId, lessonSlug, content.promptKey, assembled);
    try {
      await navigator.clipboard.writeText(assembled);
      showToast("Промт сохранён", "Скопирован в буфер — вставь в Codex или используй на следующем шаге.");
    } catch {
      showToast("Промт сохранён", "Перейди к следующему шагу — он подгрузится автоматически.");
    }
    markDone();
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-white rounded-xl border border-border p-6 md:p-7">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-text-muted mb-5">
          {content.promptTitle ?? "Заполни поля"}
        </p>
        <div className="flex flex-col gap-6">
          {content.fields.map((field) => (
            <FieldRenderer
              key={field.key}
              field={field}
              value={values[field.key]}
              onChange={(v) => onSetField(field.key, v)}
            />
          ))}
        </div>
      </div>

      <div className="bg-dark rounded-xl p-6 md:p-7">
        <p className="text-white/40 text-[10px] font-semibold uppercase tracking-[0.14em] mb-3">
          {content.savedTitle ?? "Готовый промт"}
        </p>
        <pre className="text-[13px] text-white/90 whitespace-pre-wrap font-sans leading-relaxed">
          {assembled}
        </pre>
      </div>

      <Button
        fullWidth
        size="lg"
        variant="accent"
        disabled={!allFilled}
        onClick={onSave}
      >
        {isDone ? (
          <span className="inline-flex items-center gap-1.5">
            Промт сохранён <CheckIcon size={14} />
          </span>
        ) : (
          "Сохранить и скопировать"
        )}
      </Button>
    </div>
  );
}

// ─── Field renderer ──────────────────────────────────────────────────────────

function FieldRenderer({
  field,
  value,
  onChange,
}: {
  field: PromptBuilderField;
  value: FieldValue;
  onChange: (v: FieldValue) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-bold text-text mb-2">{field.label}</label>

      {field.type === "text" && (
        field.multiline ? (
          <textarea
            value={typeof value === "string" ? value : ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            rows={3}
            className="w-full px-3.5 py-2.5 rounded-lg border border-border text-[14px] bg-white outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-colors"
          />
        ) : (
          <input
            type="text"
            value={typeof value === "string" ? value : ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            className="w-full px-3.5 py-2.5 rounded-lg border border-border text-[14px] bg-white outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-colors"
          />
        )
      )}

      {field.type === "radio-chips" && (
        <div className="flex flex-wrap gap-2">
          {(field.options ?? []).map((opt) => (
            <button
              key={opt}
              onClick={() => onChange(opt)}
              className={cn(
                "px-3.5 py-1.5 rounded-md border text-[12px] font-semibold transition-colors",
                value === opt
                  ? "bg-primary/8 border-primary/40 text-primary"
                  : "bg-white border-border text-text hover:border-primary/30"
              )}
            >
              {opt}
            </button>
          ))}
        </div>
      )}

      {field.type === "multi-chips" && (
        <div className="flex flex-wrap gap-2">
          {(field.options ?? []).map((opt) => {
            const arr = Array.isArray(value) ? value : [];
            const picked = arr.includes(opt);
            return (
              <button
                key={opt}
                onClick={() => {
                  const next = picked ? arr.filter((x) => x !== opt) : [...arr, opt];
                  onChange(next);
                }}
                className={cn(
                  "px-3.5 py-1.5 rounded-md border text-[12px] font-semibold transition-colors",
                  picked
                    ? "bg-accent/20 border-accent/50"
                    : "bg-white border-border text-text hover:border-accent/30"
                )}
                style={picked ? { color: "#516E0A" } : undefined}
              >
                {opt}
              </button>
            );
          })}
        </div>
      )}

      {field.type === "yes-no" && (
        <div className="flex gap-2.5">
          <button
            onClick={() => onChange(true)}
            className={cn(
              "flex-1 px-4 py-2.5 rounded-lg text-[13px] font-semibold border transition-colors",
              value === true
                ? "bg-success border-success text-white"
                : "bg-white border-border text-text-muted hover:border-success/40 hover:text-success"
            )}
          >
            Да
          </button>
          <button
            onClick={() => onChange(false)}
            className={cn(
              "flex-1 px-4 py-2.5 rounded-lg text-[13px] font-semibold border transition-colors",
              value === false
                ? "bg-amber-500 border-amber-500 text-white"
                : "bg-white border-border text-text-muted hover:border-amber-400 hover:text-amber-600"
            )}
          >
            Нет
          </button>
        </div>
      )}
    </div>
  );
}
