"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppLayout } from "@/components/layout/AppLayout";
import { SubmissionContent } from "@/components/admin/SubmissionContent";
import { CheckIcon, ClockIcon, PencilIcon, ChevronRightIcon } from "@/components/brand/Icon";
import type { SubmissionStatus } from "@/types";
import { cn } from "@/lib/utils";

interface MySubmission {
  id: string;
  lessonId: string;
  lessonTitle: string;
  homeworkTitle: string;
  content: string;
  submitType: string;
  status: SubmissionStatus;
  curatorComment?: string;
  submittedAt: string;
  reviewedAt?: string;
  fileUrl?: string;
  fileMime?: string;
  fileSize?: number;
}

const STATUS_LABEL: Record<SubmissionStatus, string> = {
  pending:  "Ожидает проверки",
  approved: "Принято",
  revision: "Нужна доработка",
};

const STATUS_STYLE: Record<SubmissionStatus, string> = {
  pending:  "bg-amber-50 text-amber-700 border-amber-200",
  approved: "bg-success/10 text-success border-success/30",
  revision: "bg-error-light text-error border-error/30",
};

const STATUS_ICON: Record<SubmissionStatus, React.ReactNode> = {
  pending:  <ClockIcon size={12} />,
  approved: <CheckIcon size={12} />,
  revision: <PencilIcon size={12} />,
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ru-RU", { day: "numeric", month: "long" });
}

function fmtSize(bytes?: number) {
  if (!bytes) return null;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} КБ`;
  return `${(bytes / 1024 / 1024).toFixed(1)} МБ`;
}

/** lessonId in submissions is the lesson slug — points to study landing. */
function lessonHref(lessonId: string) {
  return `/study/${lessonId}`;
}

export default function MyHomeworkPage() {
  const [items, setItems] = useState<MySubmission[] | null>(null);

  useEffect(() => {
    fetch("/api/submissions/my")
      .then((r) => r.ok ? r.json() : [])
      .then((data: MySubmission[]) => setItems(data))
      .catch(() => setItems([]));
  }, []);

  return (
    <AppLayout>
      <div className="px-5 md:px-0 pt-6 pb-8">
        <header className="mb-8">
          <h1 className="text-[28px] md:text-[32px] font-semibold text-text leading-tight tracking-tight">
            Мои домашки
          </h1>
          <p className="text-[14px] text-text-muted mt-2">
            Все сданные работы и комментарии куратора
          </p>
        </header>

        {items === null && (
          <div className="text-[13px] text-text-muted">Загружаем…</div>
        )}

        {items?.length === 0 && (
          <div className="bg-white rounded-xl border border-border p-8 text-center">
            <p className="font-semibold text-text text-[15px]">Пока ничего не сдано</p>
            <p className="text-[13px] text-text-muted mt-1">
              Сдашь работу — появится здесь
            </p>
          </div>
        )}

        {items && items.length > 0 && (
          <ul className="flex flex-col gap-3">
            {items.map((s) => (
              <li
                key={s.id}
                className="bg-white rounded-xl border border-border p-5 md:p-6"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0">
                    <Link
                      href={lessonHref(s.lessonId)}
                      className="text-[15px] font-semibold text-text hover:text-primary transition-colors"
                    >
                      {s.lessonTitle}
                    </Link>
                    <p className="text-[12px] text-text-muted truncate mt-0.5">
                      {s.homeworkTitle}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className={cn(
                      "inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded border whitespace-nowrap",
                      STATUS_STYLE[s.status]
                    )}>
                      {STATUS_ICON[s.status]}
                      {STATUS_LABEL[s.status]}
                    </span>
                    <span className="text-[11px] text-text-muted">
                      {formatDate(s.submittedAt)}
                    </span>
                  </div>
                </div>

                {s.content && (
                  <div className="mb-3">
                    <SubmissionContent content={s.content} />
                  </div>
                )}

                {s.fileUrl && fmtSize(s.fileSize) && (
                  <p className="text-[11px] text-text-muted mb-2">
                    {fmtSize(s.fileSize)}
                  </p>
                )}

                {s.curatorComment && (
                  <div className={cn(
                    "rounded-lg px-4 py-3 text-[13px] leading-relaxed",
                    s.status === "approved"
                      ? "bg-success/8 text-success/90 border border-success/20"
                      : "bg-error-light text-error border border-error/20"
                  )}>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] mb-1.5 opacity-80">
                      Комментарий куратора
                    </p>
                    <span className="whitespace-pre-wrap break-words">{s.curatorComment}</span>
                  </div>
                )}

                {s.status === "revision" && (
                  <div className="mt-3">
                    <Link
                      href={lessonHref(s.lessonId)}
                      className="inline-flex items-center gap-1 text-[12px] font-semibold text-primary hover:underline"
                    >
                      Доделать и сдать ещё раз
                      <ChevronRightIcon size={12} />
                    </Link>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </AppLayout>
  );
}
