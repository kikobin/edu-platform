"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import type { Submission, SubmissionStatus } from "@/types";

const STATUS_LABEL: Record<SubmissionStatus, string> = {
  pending:  "Ожидает",
  approved: "Принято",
  revision: "На доработку",
};

const STATUS_STYLE: Record<SubmissionStatus, string> = {
  pending:  "bg-amber-50 text-amber-600 border-amber-200",
  approved: "bg-green-50 text-green-600 border-green-200",
  revision: "bg-red-50 text-red-600 border-red-200",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
}

function SubmissionCard({
  sub,
  onUpdate,
}: {
  sub: Submission;
  onUpdate: (id: string, status: SubmissionStatus, comment?: string) => void;
}) {
  const [comment, setComment] = useState(sub.curatorComment ?? "");
  const [loading, setLoading] = useState(false);
  const [showComment, setShowComment] = useState(false);

  const handle = async (status: SubmissionStatus) => {
    setLoading(true);
    await fetch(`/api/admin/submissions/${sub.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status,
        curatorComment: comment || undefined,
        userId: sub.userId,
        lessonId: sub.lessonId,
        lessonTitle: sub.lessonTitle,
      }),
    });
    onUpdate(sub.id, status, comment || undefined);
    setLoading(false);
    setShowComment(false);
  };

  return (
    <div className={cn(
      "bg-white rounded-2xl border shadow-sm p-5 transition-all",
      sub.status === "approved" ? "border-green-100 opacity-70" : "border-gray-100"
    )}>
      {/* Top row */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-sm font-bold text-gray-900">{sub.userName}</span>
            <span className="text-gray-300">·</span>
            <span className="text-sm text-gray-500 truncate max-w-[200px]">{sub.lessonTitle}</span>
          </div>
          <p className="text-xs text-gray-400">{sub.homeworkTitle}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={cn(
            "text-[11px] font-bold px-2 py-0.5 rounded-lg border",
            STATUS_STYLE[sub.status as SubmissionStatus]
          )}>
            {STATUS_LABEL[sub.status as SubmissionStatus]}
          </span>
          <span className="text-[11px] text-gray-400">{formatDate(sub.submittedAt)}</span>
        </div>
      </div>

      {/* Content */}
      {sub.content && (
        <div className="bg-gray-50 rounded-xl px-4 py-3 mb-3 text-sm text-gray-700 break-all">
          {sub.submitType === "link" ? (
            <a href={sub.content} target="_blank" rel="noopener noreferrer"
              className="text-primary underline underline-offset-2 hover:text-primary/80">
              {sub.content}
            </a>
          ) : (
            sub.content
          )}
        </div>
      )}

      {/* Curator comment */}
      {sub.curatorComment && !showComment && (
        <div className="flex gap-2 bg-blue-50 rounded-xl px-4 py-3 mb-3 text-sm text-blue-700">
          <span>💬</span>
          <span>{sub.curatorComment}</span>
        </div>
      )}

      {/* Comment input */}
      {showComment && (
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Комментарий для ученика (необязательно)..."
          rows={2}
          className="w-full mb-3 px-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-white outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 resize-none transition-all"
        />
      )}

      {/* Actions */}
      {sub.status === "pending" && (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handle("approved")}
            disabled={loading}
            className="flex-1 py-2 text-sm font-semibold rounded-xl bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 transition-all disabled:opacity-50"
          >
            ✓ Принять
          </button>
          <button
            onClick={() => showComment ? handle("revision") : setShowComment(true)}
            disabled={loading}
            className="flex-1 py-2 text-sm font-semibold rounded-xl bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 transition-all disabled:opacity-50"
          >
            {showComment ? "↩ Отправить на доработку" : "↩ На доработку"}
          </button>
          {showComment && (
            <button onClick={() => setShowComment(false)} className="px-3 py-2 text-sm text-gray-400 hover:text-gray-600">
              ✕
            </button>
          )}
        </div>
      )}

      {sub.status !== "pending" && (
        <button
          onClick={() => handle("pending")}
          disabled={loading}
          className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
        >
          Сбросить статус
        </button>
      )}
    </div>
  );
}

export default function AdminHomeworkPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | SubmissionStatus>("all");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    setLoading(true);
    const qs = filter !== "all" ? `?status=${filter}&page=${page}` : `?page=${page}`;
    fetch(`/api/admin/submissions${qs}`)
      .then((r) => r.json())
      .then((data: { submissions: Submission[]; hasMore: boolean } | Submission[]) => {
        // Support both old (array) and new (object) response shape
        if (Array.isArray(data)) {
          setSubmissions(data);
          setHasMore(false);
        } else {
          setSubmissions((prev) => page === 1 ? data.submissions : [...prev, ...data.submissions]);
          setHasMore(data.hasMore);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [filter, page]);

  const handleFilterChange = (f: "all" | SubmissionStatus) => {
    setFilter(f);
    setPage(1);
    setSubmissions([]);
  };

  const handleUpdate = (id: string, status: SubmissionStatus, comment?: string) => {
    setSubmissions((prev) =>
      prev.map((s) => s.id === id ? { ...s, status, curatorComment: comment } : s)
    );
  };

  const counts = {
    all:      submissions.length,
    pending:  submissions.filter((s) => s.status === "pending").length,
    approved: submissions.filter((s) => s.status === "approved").length,
    revision: submissions.filter((s) => s.status === "revision").length,
  };

  const FILTERS: { key: "all" | SubmissionStatus; label: string }[] = [
    { key: "all",      label: `Все (${counts.all}${hasMore ? "+" : ""})` },
    { key: "pending",  label: `Ожидают (${counts.pending})` },
    { key: "approved", label: `Принято (${counts.approved})` },
    { key: "revision", label: `На доработку (${counts.revision})` },
  ];

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-black text-gray-900">Домашние задания</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {counts.pending > 0
            ? `${counts.pending} работ ожидают проверки`
            : "Все работы проверены"}
        </p>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => handleFilterChange(f.key)}
            className={cn(
              "px-3.5 py-1.5 rounded-xl text-sm font-semibold border transition-all",
              filter === f.key
                ? "bg-primary text-white border-primary shadow-sm"
                : "bg-white text-gray-500 border-gray-200 hover:border-primary/30 hover:text-gray-700"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* List */}
      {loading && submissions.length === 0 ? (
        <div className="text-center py-16 text-gray-400 text-sm">Загружаем работы...</div>
      ) : submissions.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">📭</p>
          <p className="text-gray-400 text-sm">
            {filter === "pending" ? "Нет работ на проверке" : "Здесь пусто"}
          </p>
          <p className="text-gray-300 text-xs mt-2">
            Работы появятся когда ученики начнут сдавать домашние задания
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {submissions.map((sub) => (
              <SubmissionCard key={sub.id} sub={sub} onUpdate={handleUpdate} />
            ))}
          </div>
          {hasMore && (
            <div className="mt-5 text-center">
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={loading}
                className="px-6 py-2.5 text-sm font-semibold text-primary bg-primary-light border border-primary/20 rounded-xl hover:bg-primary/10 disabled:opacity-50 transition-all"
              >
                {loading ? "Загружаем..." : "Загрузить ещё"}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
