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
  reviewDone:    z.boolean().optional(),
  practiceDone:  z.boolean().optional(),
  practiceScore: z.number().int().min(0).max(100).optional(),
});

// ─── Submissions ──────────────────────────────────────────────────────────────

export const CreateSubmissionSchema = z.object({
  lessonId:      z.string().min(1).max(100),
  homeworkId:    z.string().min(1).max(100),
  lessonTitle:   z.string().min(1).max(200),
  homeworkTitle: z.string().min(1).max(200),
  content:       z.string().max(2000).optional().default(""),
  submitType:    z.enum(["confirm", "link", "text"]).default("confirm"),
});

export const PatchSubmissionSchema = z.object({
  status:         z.enum(["approved", "revision", "pending"]),
  curatorComment: z.string().max(1000).optional(),
  // userId / lessonId / lessonTitle are intentionally NOT accepted from the client.
  // The route fetches the submission from DB and uses its authoritative values.
});

// ─── Profile ──────────────────────────────────────────────────────────────────

export const PatchProfileSchema = z.object({
  avatarId: z.string().max(50).optional(),
  titleId:  z.string().max(50).nullable().optional(),
  frameId:  z.string().max(50).nullable().optional(),
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
