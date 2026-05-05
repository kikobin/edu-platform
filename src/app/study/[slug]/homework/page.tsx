"use client";

import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/Button";
import { useUserStore } from "@/store/userStore";
import { getLessonBySlug } from "@/content/study-lessons";
import {
  CheckIcon,
  ClockIcon,
  PencilIcon,
  ChevronLeftIcon,
} from "@/components/brand/Icon";
import { cn } from "@/lib/utils";
import { ALLOWED_UPLOAD_MIME, MAX_UPLOAD_BYTES } from "@/lib/validation/schemas";

interface ExistingSubmission {
  status: "pending" | "approved" | "revision";
  curatorComment?: string;
  submittedAt?: string;
}

interface UploadedFile {
  fileUrl:  string;
  fileMime: string;
  fileSize: number;
  name:     string;
}

const STATUS_META = {
  pending: {
    label: "Ожидает проверки",
    Icon: ClockIcon,
    pillBg: "bg-amber-50 border-amber-200 text-amber-700",
    bg: "bg-amber-50 border-amber-200 text-amber-800",
  },
  approved: {
    label: "Принято",
    Icon: CheckIcon,
    pillBg: "bg-success/10 border-success/30 text-success",
    bg: "bg-success/8 border-success/20 text-success/90",
  },
  revision: {
    label: "Нужна доработка",
    Icon: PencilIcon,
    pillBg: "bg-error-light border-error/30 text-error",
    bg: "bg-error-light border-error/20 text-error",
  },
} as const;

const ACCEPT = ALLOWED_UPLOAD_MIME.join(",");

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} КБ`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`;
}

export default function HomeworkPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const slug = params?.slug ?? "";
  const lesson = useMemo(() => getLessonBySlug(slug), [slug]);
  const showToast = useUserStore((s) => s.showToast);

  const [url, setUrl] = useState("");
  const [pickedLevel, setPickedLevel] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [existing, setExisting] = useState<ExistingSubmission | null>(null);
  const [loading, setLoading] = useState(true);

  // File upload state
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const refresh = useCallback(async () => {
    if (!slug) return;
    try {
      const res = await fetch(`/api/submissions?lessonId=${encodeURIComponent(slug)}`);
      if (res.ok) {
        const data = await res.json();
        if (data) setExisting({
          status: data.status,
          curatorComment: data.curatorComment,
          submittedAt: data.submittedAt,
        });
      }
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => { refresh(); }, [refresh]);

  if (!lesson) {
    return (
      <AppLayout>
        <div className="px-5 md:px-0 pt-6 pb-8">
          <p className="text-text-muted text-[14px]">Урок не найден.</p>
        </div>
      </AppLayout>
    );
  }

  const homework = lesson.homework;
  if (!homework) {
    return (
      <AppLayout>
        <div className="px-5 md:px-0 pt-6 pb-8">
          <BackLink slug={slug} />
          <h1 className="text-[28px] md:text-[32px] font-semibold text-text leading-tight tracking-tight mt-4">
            Домашка
          </h1>
          <p className="text-text-muted text-[14px] mt-3">
            У этого урока нет отдельной домашки.
          </p>
        </div>
      </AppLayout>
    );
  }

  const hasContent = url.trim().length > 0 || uploadedFile !== null;
  const canSubmit = hasContent && !submitting && !uploading;
  const isSubmitted = existing && existing.status !== "revision";
  const canResubmit = !existing || existing.status === "revision";

  // ── File upload ────────────────────────────────────────────────────────────

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!e.target.files) return;
    e.target.value = "";
    if (!file) return;

    setUploadError(null);

    if (!ALLOWED_UPLOAD_MIME.includes(file.type as typeof ALLOWED_UPLOAD_MIME[number])) {
      setUploadError("Неподдерживаемый формат. Можно: изображение, видео или PDF.");
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      setUploadError(`Файл слишком большой (максимум 50 МБ, у тебя ${formatBytes(file.size)}).`);
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setUploadedFile(null);

    try {
      // 1. Get presigned URL
      const urlRes = await fetch("/api/submissions/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename:    file.name,
          contentType: file.type,
          size:        file.size,
          lessonId:    slug,
          homeworkId:  `${slug}:homework`,
        }),
      });
      if (!urlRes.ok) {
        const body = await urlRes.json().catch(() => ({}));
        throw new Error(body.error ?? "Не удалось подготовить загрузку");
      }
      const { uploadUrl, fileUrl } = await urlRes.json();

      // 2. Upload file with XHR for progress tracking
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", uploadUrl);
        xhr.setRequestHeader("Content-Type", file.type);
        xhr.upload.onprogress = (ev) => {
          if (ev.lengthComputable) {
            setUploadProgress(Math.round((ev.loaded / ev.total) * 100));
          }
        };
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve();
          else reject(new Error(`Ошибка загрузки: ${xhr.status}`));
        };
        xhr.onerror = () => reject(new Error("Сетевая ошибка при загрузке"));
        xhr.send(file);
      });

      setUploadProgress(100);
      setUploadedFile({ fileUrl, fileMime: file.type, fileSize: file.size, name: file.name });
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Ошибка загрузки файла");
      setUploadProgress(0);
    } finally {
      setUploading(false);
    }
  };

  const removeFile = () => {
    setUploadedFile(null);
    setUploadProgress(0);
    setUploadError(null);
  };

  // ── Submit ─────────────────────────────────────────────────────────────────

  const onSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);

    const levelObj = pickedLevel
      ? homework.levels.find((l) => l.key === pickedLevel)
      : null;

    // Determine submitType and content
    const submitType = uploadedFile ? "file" : "link";
    const composedContent = [
      url.trim() || uploadedFile?.name || "",
      levelObj && `\nУровень: ${levelObj.title} (${levelObj.level})`,
    ]
      .filter(Boolean)
      .join("\n")
      .slice(0, 2000);

    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lessonId:      slug,
          homeworkId:    `${slug}:homework`,
          lessonTitle:   lesson.title,
          homeworkTitle: "Домашняя работа",
          content:       composedContent,
          submitType,
          ...(uploadedFile && {
            fileUrl:  uploadedFile.fileUrl,
            fileMime: uploadedFile.fileMime,
            fileSize: uploadedFile.fileSize,
          }),
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Не удалось отправить работу");
      }
      showToast("Работа отправлена", "Куратор проверит и пришлёт ответ.");
      setUrl("");
      setPickedLevel(null);
      setUploadedFile(null);
      setUploadProgress(0);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка отправки");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppLayout>
      <div className="px-5 md:px-0 pt-6 pb-8">
        <BackLink slug={slug} />

        <header className="mb-6 mt-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-primary mb-2">
            Домашка к уроку
          </p>
          <h1 className="text-[26px] md:text-[32px] font-semibold text-text leading-[1.15] tracking-tight">
            {lesson.title}
          </h1>
          <p className="text-text-muted text-[14px] mt-2">
            После одобрения куратором откроется следующий урок.
          </p>
        </header>

        {loading ? (
          <p className="text-[13px] text-text-muted">Загружаем…</p>
        ) : (
          <>
            {existing && (
              <StatusPanel existing={existing} />
            )}

            {canResubmit && (
              <div className="flex flex-col gap-5">
                {homework.levels.length > 0 && (
                  <div className="bg-white rounded-xl border border-border p-6 md:p-7">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-text-muted mb-1">
                      Выбери уровень
                    </p>
                    <p className="text-[12px] text-text-muted mb-4">
                      Можно начать с базового и потом усилить — обновишь сдачу.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                      {homework.levels.map((lvl) => {
                        const picked = pickedLevel === lvl.key;
                        return (
                          <button
                            key={lvl.key}
                            onClick={() => setPickedLevel(picked ? null : lvl.key)}
                            className={cn(
                              "text-left p-4 rounded-lg border transition-colors",
                              picked
                                ? "bg-primary/8 border-primary/40"
                                : "bg-white border-border hover:border-primary/30"
                            )}
                          >
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-primary mb-1">
                              {lvl.level}
                            </p>
                            <p className="text-[13px] font-semibold text-text mb-1">
                              {lvl.title}
                            </p>
                            <p className="text-[11px] text-text-muted leading-relaxed">
                              {lvl.description}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ── File upload block ─────────────────────────────────── */}
                <div className="bg-white rounded-xl border border-border p-6 md:p-7">
                  <p className="text-[14px] font-semibold text-text mb-1">
                    Файл к работе
                  </p>
                  <p className="text-[12px] text-text-muted mb-4">
                    Подойдут изображение, видео или PDF до 50 МБ.
                  </p>

                  {/* Uploaded file preview */}
                  <AnimatePresence>
                    {uploadedFile && (
                      <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        className="flex items-center gap-3 px-4 py-3 rounded-lg bg-success/8 border border-success/25 mb-4"
                      >
                        <span className="text-success text-[18px] leading-none">✓</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-medium text-text truncate">
                            {uploadedFile.name}
                          </p>
                          <p className="text-[11px] text-text-muted">
                            {formatBytes(uploadedFile.fileSize)} · готово к загрузке
                          </p>
                        </div>
                        <button
                          onClick={removeFile}
                          className="text-[12px] text-text-muted hover:text-error transition-colors shrink-0 font-medium"
                        >
                          Удалить
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Upload progress bar */}
                  <AnimatePresence>
                    {uploading && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="mb-4"
                      >
                        <div className="flex justify-between text-[11px] text-text-muted mb-1.5">
                          <span>Загружается…</span>
                          <span>{uploadProgress}%</span>
                        </div>
                        <div className="h-1.5 bg-border rounded-full overflow-hidden">
                          <motion.div
                            className="h-full bg-primary rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${uploadProgress}%` }}
                            transition={{ ease: "linear", duration: 0.2 }}
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Upload error */}
                  <AnimatePresence>
                    {uploadError && (
                      <motion.p
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="text-[12px] text-error mb-3"
                      >
                        {uploadError}
                      </motion.p>
                    )}
                  </AnimatePresence>

                  {/* Hidden file input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={ACCEPT}
                    className="hidden"
                    onChange={handleFileChange}
                    id="hw-file-input"
                  />

                  {!uploadedFile && !uploading && (
                    <label
                      htmlFor="hw-file-input"
                      className={cn(
                        "flex flex-col items-center justify-center gap-2 w-full",
                        "rounded-lg border-2 border-dashed border-border",
                        "py-8 px-4 cursor-pointer",
                        "hover:border-primary/40 hover:bg-primary/3",
                        "transition-colors text-center"
                      )}
                    >
                      <span className="text-[28px] leading-none select-none">📎</span>
                      <span className="text-[13px] font-medium text-text">
                        Нажми, чтобы выбрать файл
                      </span>
                      <span className="text-[11px] text-text-muted">
                        JPG, PNG, MP4, MOV, WEBM, PDF — до 50 МБ
                      </span>
                    </label>
                  )}
                </div>

                {/* ── URL input block ───────────────────────────────────── */}
                <div className="bg-white rounded-xl border border-border p-6 md:p-7">
                  <label htmlFor="hw-url-input" className="block text-[14px] font-semibold text-text mb-2">
                    Или ссылка на работу
                  </label>
                  <p className="text-[12px] text-text-muted mb-3">
                    Codex / Tilda / Netlify / GitHub / Telegram-бот — куда выложил.
                  </p>
                  <input
                    id="hw-url-input"
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder={homework.urlPlaceholder ?? "https://..."}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-border text-[14px] bg-white outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-colors"
                  />
                </div>

                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="px-4 py-3 rounded-lg bg-error-light border border-error/30 text-[13px] font-medium text-error"
                    >
                      {error}
                    </motion.div>
                  )}
                </AnimatePresence>

                <Button
                  fullWidth
                  size="lg"
                  variant="primary"
                  loading={submitting}
                  disabled={!canSubmit}
                  onClick={onSubmit}
                >
                  {existing?.status === "revision" ? "Сдать заново" : "Сдать работу куратору"}
                </Button>
              </div>
            )}

            {isSubmitted && (
              <div className="mt-5 flex items-center justify-between gap-3 rounded-lg border border-border bg-white px-4 py-3">
                <p className="text-[13px] text-text-muted">
                  Можно вернуться к уроку или открыть список модулей.
                </p>
                <button
                  onClick={() => router.push(`/study/${slug}`)}
                  className="text-[13px] font-semibold text-primary hover:underline"
                >
                  К уроку
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}

function BackLink({ slug }: { slug: string }) {
  return (
    <Link
      href={`/study/${slug}`}
      className="inline-flex items-center gap-1.5 text-[13px] font-medium text-text-muted hover:text-text transition-colors -ml-2 px-2 py-1.5 rounded-md hover:bg-white"
    >
      <ChevronLeftIcon size={14} />
      К уроку
    </Link>
  );
}

function StatusPanel({ existing }: { existing: ExistingSubmission }) {
  const meta = STATUS_META[existing.status];
  return (
    <div
      className={cn(
        "mb-5 rounded-xl border p-5 md:p-6",
        meta.bg
      )}
    >
      <div className="flex items-center gap-2.5 mb-1.5">
        <meta.Icon size={16} />
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em]">
          {meta.label}
        </p>
      </div>
      {existing.curatorComment ? (
        <div className="text-[13px] leading-relaxed whitespace-pre-wrap break-words">
          {existing.curatorComment}
        </div>
      ) : (
        <p className="text-[13px] opacity-90">
          {existing.status === "pending"
            ? "Куратор посмотрит работу и пришлёт ответ."
            : existing.status === "approved"
            ? "Работа принята — следующий урок открыт."
            : "Куратор просит доработать. Сдай работу заново ниже."}
        </p>
      )}
    </div>
  );
}
