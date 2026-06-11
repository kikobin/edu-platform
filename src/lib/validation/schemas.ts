import { z } from "zod";

// ─── XP ───────────────────────────────────────────────────────────────────────

export const AwardXPSchema = z.object({
  sourceId: z.string().min(1).max(200),
  amount:   z.number().int().positive().max(10_000),
});

// ─── Progress ─────────────────────────────────────────────────────────────────

export const LessonProgressSchema = z.object({
  userId:        z.string().min(1).max(100),
  lessonId:      z.string().min(1).max(100),
  videoDone:     z.boolean().optional(),
  reviewDone:    z.boolean().optional(),
  practiceDone:  z.boolean().optional(),
  practiceScore: z.number().int().min(0).max(100).optional(),
});

// ─── Dynamic study steps (interactive lessons) ────────────────────────────────

/** lessonSlug like "lesson-1" / "ai-student-3"; stepKey like "step-1", "step-7", "submission" */
const SAFE_SLUG_RE = /^[a-z0-9][a-z0-9-]{0,79}$/i;
const SAFE_STEP_KEY_RE = /^[a-z0-9][a-z0-9-]{0,79}$/i;

export const MarkDynamicStepSchema = z.object({
  lessonSlug: z.string().regex(SAFE_SLUG_RE),
  stepKey:    z.string().regex(SAFE_STEP_KEY_RE),
});

// ─── Submissions ──────────────────────────────────────────────────────────────

export const CreateSubmissionSchema = z.object({
  lessonId:      z.string().min(1).max(100),
  homeworkId:    z.string().min(1).max(100),
  lessonTitle:   z.string().min(1).max(200),
  homeworkTitle: z.string().min(1).max(200),
  content:       z.string().max(2000).optional().default(""),
  submitType:    z.enum(["confirm", "link", "text", "file"]).default("confirm"),
  fileUrl:       z.string().url().max(500).optional(),
  fileMime:      z.string().max(100).optional(),
  fileSize:      z.number().int().positive().max(50 * 1024 * 1024).optional(),
});

// ─── File upload (R2) ─────────────────────────────────────────────────────────

export const ALLOWED_UPLOAD_MIME = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
  "video/mp4",
  "video/quicktime",
  "video/webm",
  "application/pdf",
] as const;

export const MAX_UPLOAD_BYTES = 50 * 1024 * 1024; // 50 MB

export const UploadUrlSchema = z.object({
  filename:    z.string().min(1).max(200),
  contentType: z.enum(ALLOWED_UPLOAD_MIME),
  size:        z.number().int().positive().max(MAX_UPLOAD_BYTES),
  lessonId:    z.string().min(1).max(100),
  homeworkId:  z.string().min(1).max(100),
});

export const PatchSubmissionSchema = z.object({
  status:         z.enum(["approved", "revision", "pending"]),
  curatorComment: z.string().max(1000).optional(),
  // userId / lessonId / lessonTitle are intentionally NOT accepted from the client.
  // The route fetches the submission from DB and uses its authoritative values.
});

// ─── Groups ───────────────────────────────────────────────────────────────────

export const CreateGroupSchema = z.object({
  name: z.string().min(1).max(80),
  tier: z.enum(["smart", "vip"]),
});

export const RenameGroupSchema = z.object({
  name: z.string().min(1).max(80).optional(),
  tier: z.enum(["smart", "vip"]).optional(),
}).refine((d) => d.name !== undefined || d.tier !== undefined, {
  message: "name or tier is required",
});

export const AddStudentToGroupSchema = z.object({
  studentProfileId: z.string().uuid(),
});

// ─── Admin: create student ────────────────────────────────────────────────────

// username becomes "<username>@edu-platform.internal" — keep ASCII-safe.
const USERNAME_RE = /^[a-z0-9_]{3,30}$/;

export const CreateStudentSchema = z.object({
  username: z.string().regex(USERNAME_RE, "lowercase letters, digits, underscore (3–30 chars)"),
  password: z.string().min(6).max(100),
  name:     z.string().trim().min(1).max(80),
  avatarId: z.string().max(50).optional(),
  groupId:  z.string().uuid().nullable().optional(),
});

// ─── Profile ──────────────────────────────────────────────────────────────────

export const PatchProfileSchema = z.object({
  avatarId: z.string().max(50).optional(),
  titleId:  z.string().max(50).nullable().optional(),
  frameId:  z.string().max(50).nullable().optional(),
});

// ─── Admin XP adjustment ──────────────────────────────────────────────────────

// Cap admin XP adjustments so a malformed UI can't push a student to absurd numbers.
// Negative delta is allowed (subtract XP); zero is rejected.
export const AdminAdjustXPSchema = z.object({
  delta: z.number().int().min(-10_000).max(10_000).refine((v) => v !== 0, {
    message: "delta must be non-zero",
  }),
});

// ─── Path param validators ────────────────────────────────────────────────────

// app_user_id is an opaque short identifier ("student-1", "danial").
// Whitelist lets routes reject control chars / SQL-ish payloads at the edge
// even though PostgREST already URL-encodes filter values.
export const APP_USER_ID_RE = /^[a-zA-Z0-9._-]{1,100}$/;
export function isValidAppUserId(v: string): boolean {
  return APP_USER_ID_RE.test(v);
}

// Postgres UUID — used for DB-generated ids (groups.id, submissions.id, profiles.id).
const UUID_RE = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
export function isValidUuid(v: string): boolean {
  return UUID_RE.test(v);
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const LoginSchema = z.object({
  username: z.string().trim().min(1).max(254),
  password: z.string().min(1).max(200),
});

// ─── Shop ─────────────────────────────────────────────────────────────────────

export const BuyItemSchema = z.object({
  itemId: z.string().min(1).max(100),
});

// ─── Helper ───────────────────────────────────────────────────────────────────

import { NextResponse } from "next/server";
import type { ZodSchema } from "zod";

const MAX_BODY_BYTES = 64 * 1024; // 64 KB — well above any valid API payload

/**
 * Parse and validate request body. Returns parsed data or a 400/413 NextResponse.
 * Rejects requests whose Content-Length header exceeds MAX_BODY_BYTES before reading.
 */
export async function parseBody<T>(
  request: Request,
  schema: ZodSchema<T>
): Promise<T | NextResponse> {
  const contentLength = parseInt(request.headers.get("content-length") ?? "0", 10);
  if (contentLength > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "Request body too large" }, { status: 413 });
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const result = schema.safeParse(raw);
  if (!result.success) {
    return NextResponse.json(
      { error: "Validation error", details: result.error.flatten().fieldErrors },
      { status: 400 }
    );
  }
  return result.data;
}
