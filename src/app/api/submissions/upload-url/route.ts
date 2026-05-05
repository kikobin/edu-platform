import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { requireAuth } from "@/lib/auth/requireAuth";
import { rateLimit } from "@/lib/rateLimit";
import { parseBody, UploadUrlSchema } from "@/lib/validation/schemas";
import { createPresignedUpload } from "@/lib/r2Client";

const SAFE_NAME_RE = /[^a-zA-Z0-9._-]+/g;

function safeBaseName(name: string): string {
  const base = name.replace(/^.*[\\/]/, "");
  const cleaned = base.replace(SAFE_NAME_RE, "_").replace(/^\.+/, "");
  return cleaned.slice(0, 80) || "file";
}

const SAFE_ID_RE = /^[a-zA-Z0-9._-]+$/;

export async function POST(request: Request) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  if (auth.role === "curator" || auth.role === "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!rateLimit(`upload:${auth.authId}`, { limit: 30, windowMs: 60_000 })) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const body = await parseBody(request, UploadUrlSchema);
  if (body instanceof NextResponse) return body;

  if (!SAFE_ID_RE.test(body.lessonId) || !SAFE_ID_RE.test(body.homeworkId)) {
    return NextResponse.json({ error: "Invalid lessonId/homeworkId" }, { status: 400 });
  }

  const key = [
    "submissions",
    auth.appUserId,
    body.lessonId,
    body.homeworkId,
    `${Date.now()}-${safeBaseName(body.filename)}`,
  ].join("/");

  try {
    const presigned = await createPresignedUpload({
      key,
      contentType:   body.contentType,
      contentLength: body.size,
    });
    return NextResponse.json({
      uploadUrl: presigned.uploadUrl,
      fileUrl:   presigned.fileUrl,
    });
  } catch (err) {
    Sentry.captureException(err, { tags: { route: "POST /api/submissions/upload-url" } });
    return NextResponse.json({ error: "Не удалось подготовить загрузку" }, { status: 500 });
  }
}
