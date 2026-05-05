/**
 * Supabase клиент — опциональный.
 * Если переменные окружения не заданы, всё работает на статичных данных.
 *
 * Чтобы включить:
 * 1. Создай проект на https://supabase.com (бесплатно)
 * 2. Добавь в .env.local:
 *    NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
 *    NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
 *    SUPABASE_SERVICE_KEY=eyJhbGc...  (опционально, для server-side)
 * 3. Выполни SQL из /docs/supabase-schema.sql в Supabase SQL Editor
 * 4. Выполни SQL из /docs/supabase-admin-schema.sql для таблиц админки
 */
import "server-only";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
// Server-side service key (not exposed to browser)
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
const supabaseKey = supabaseServiceKey ?? supabaseAnonKey;

export const supabaseEnabled = Boolean(supabaseUrl && supabaseAnonKey);

export type SupabaseRow = {
  user_id: string;
  name: string;
  avatar_id: string;
  xp: number;
};

export type LessonProgressRow = {
  user_id: string;
  lesson_id: string;
  video_done: boolean;
  review_done: boolean;
  practice_done: boolean;
  practice_score: number;
  updated_at: string;
};

export type NotificationRow = {
  id: string;
  user_id: string;
  type: string;
  message: string;
  lesson_id?: string;
  read: boolean;
  created_at: string;
};

type SubmissionRow = {
  id: string;
  user_id: string;
  user_name: string;
  lesson_id: string;
  homework_id: string;
  lesson_title: string;
  homework_title: string;
  content: string;
  submit_type: string;
  status: string;
  curator_comment?: string;
  submitted_at: string;
  reviewed_at?: string;
  version?: number;
  file_url?: string;
  file_mime?: string;
  file_size?: number;
};

async function supabaseFetch(
  path: string,
  options?: RequestInit
): Promise<Response> {
  return fetch(`${supabaseUrl}/rest/v1${path}`, {
    ...options,
    headers: {
      apikey: supabaseKey!,
      Authorization: `Bearer ${supabaseKey}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
      ...(options?.headers ?? {}),
    },
  });
}

export const supabase = {
  async getLeaderboard(): Promise<SupabaseRow[]> {
    if (!supabaseEnabled) return [];
    try {
      // Read from profiles (kept in sync by awardXP) — filter students only
      const res = await supabaseFetch(
        "/profiles?select=app_user_id,name,avatar_id,xp&role=eq.student&order=xp.desc&limit=50"
      );
      if (!res.ok) return [];
      const rows: Array<{ app_user_id: string; name: string; avatar_id: string; xp: number }> =
        await res.json();
      // Map app_user_id → user_id so LeaderboardClient can match the current user
      return rows.map((r) => ({ user_id: r.app_user_id, name: r.name, avatar_id: r.avatar_id, xp: r.xp }));
    } catch {
      return [];
    }
  },

  async createSubmission(
    data: Omit<SubmissionRow, "id" | "submitted_at" | "reviewed_at">
  ): Promise<void> {
    if (!supabaseEnabled) return;
    const res = await supabaseFetch("/submissions", {
      method: "POST",
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => res.statusText);
      throw new Error(`createSubmission failed: ${res.status} ${text}`);
    }
  },

  async getSubmissions(opts?: {
    status?: string;
    studentIds?: string[];
    page?: number;
    pageSize?: number;
  }): Promise<SubmissionRow[]> {
    if (!supabaseEnabled) return [];
    try {
      const page     = opts?.page ?? 1;
      const pageSize = opts?.pageSize ?? 50;
      const offset   = (page - 1) * pageSize;

      let qs = `select=*&order=submitted_at.desc&limit=${pageSize}&offset=${offset}`;
      if (opts?.status) qs += `&status=eq.${encodeURIComponent(opts.status)}`;
      if (opts?.studentIds?.length) {
        qs += `&user_id=in.(${opts.studentIds.map(encodeURIComponent).join(",")})`;
      }

      const res = await supabaseFetch(`/submissions?${qs}`);
      if (!res.ok) return [];
      return res.json();
    } catch {
      return [];
    }
  },

  async updateSubmission(
    id: string,
    status: string,
    curatorComment: string | undefined,
    expectedVersion?: number
  ): Promise<{ ok: true } | { ok: false; reason: "conflict" }> {
    if (!supabaseEnabled) return { ok: true };
    // Use Prefer: return=representation so PostgREST tells us how many rows it touched.
    // Combined with version=eq.<n> in the URL this is an optimistic lock: if another
    // request already moved the row to v+1 the WHERE clause matches 0 rows and we
    // return a conflict instead of silently double-applying.
    let qs = `id=eq.${id}`;
    if (expectedVersion !== undefined) qs += `&version=eq.${expectedVersion}`;
    const res = await supabaseFetch(`/submissions?${qs}`, {
      method: "PATCH",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({
        status,
        curator_comment: curatorComment,
        reviewed_at: new Date().toISOString(),
        // Bump version on every successful write — when the row had no
        // version yet, this is what initialises it to 1.
        version: (expectedVersion ?? 0) + 1,
      }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => res.statusText);
      throw new Error(`updateSubmission failed: ${res.status} ${text}`);
    }
    if (expectedVersion !== undefined) {
      const rows = await res.json().catch(() => []);
      if (!Array.isArray(rows) || rows.length === 0) return { ok: false, reason: "conflict" };
    }
    return { ok: true };
  },

  /**
   * Upsert a homework submission.
   * If an existing submission exists for user+lesson, update it (increment version,
   * reset to pending). Otherwise insert a new one at version 1.
   * Throws on any DB write failure so callers can return a proper error response.
   */
  async upsertSubmission(
    data: Omit<SubmissionRow, "id" | "submitted_at" | "reviewed_at"> & { version?: number }
  ): Promise<void> {
    if (!supabaseEnabled) return;
    // Look up latest submission for this user+lesson
    const existing = await this.getSubmissionByUserAndLesson(data.user_id, data.lesson_id);
    if (existing) {
      // Update existing: new content, reset to pending, increment version
      const res = await supabaseFetch(`/submissions?id=eq.${existing.id}`, {
        method: "PATCH",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify({
          content:          data.content,
          submit_type:      data.submit_type,
          status:           "pending",
          curator_comment:  null,
          reviewed_at:      null,
          submitted_at:     new Date().toISOString(),
          version:          ((existing as unknown as Record<string, unknown>).version as number ?? 1) + 1,
          file_url:         data.file_url ?? null,
          file_mime:        data.file_mime ?? null,
          file_size:        data.file_size ?? null,
        }),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => res.statusText);
        throw new Error(`upsertSubmission (update) failed: ${res.status} ${text}`);
      }
    } else {
      // First submission
      const res = await supabaseFetch("/submissions", {
        method: "POST",
        body: JSON.stringify({ ...data, version: 1, status: "pending" }),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => res.statusText);
        throw new Error(`upsertSubmission (insert) failed: ${res.status} ${text}`);
      }
    }
  },

  async getAllStudentProgress(): Promise<SupabaseRow[]> {
    if (!supabaseEnabled) return [];
    try {
      const res = await supabaseFetch(
        "/user_progress?select=*&order=xp.desc"
      );
      if (!res.ok) return [];
      return res.json();
    } catch {
      return [];
    }
  },

  async getSubmissionsByUser(userId: string): Promise<SubmissionRow[]> {
    if (!supabaseEnabled) return [];
    try {
      const res = await supabaseFetch(
        `/submissions?user_id=eq.${encodeURIComponent(userId)}&select=*&order=submitted_at.desc`
      );
      if (!res.ok) return [];
      return res.json();
    } catch {
      return [];
    }
  },

  async getSubmissionById(id: string): Promise<SubmissionRow | null> {
    if (!supabaseEnabled) return null;
    try {
      const res = await supabaseFetch(
        `/submissions?id=eq.${encodeURIComponent(id)}&select=*&limit=1`
      );
      if (!res.ok) return null;
      const rows: SubmissionRow[] = await res.json();
      return rows[0] ?? null;
    } catch {
      return null;
    }
  },

  async getSubmissionByUserAndLesson(userId: string, lessonId: string): Promise<SubmissionRow | null> {
    if (!supabaseEnabled) return null;
    try {
      const res = await supabaseFetch(
        `/submissions?user_id=eq.${encodeURIComponent(userId)}&lesson_id=eq.${encodeURIComponent(lessonId)}&select=*&order=submitted_at.desc&limit=1`
      );
      if (!res.ok) return null;
      const rows: SubmissionRow[] = await res.json();
      return rows[0] ?? null;
    } catch {
      return null;
    }
  },

  // ── Lesson Progress ──────────────────────────────────────────────────────────

  async upsertLessonProgress(row: Omit<LessonProgressRow, "updated_at">): Promise<void> {
    if (!supabaseEnabled) return;
    const res = await supabaseFetch("/lesson_progress", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates" },
      body: JSON.stringify({ ...row, updated_at: new Date().toISOString() }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => res.statusText);
      throw new Error(`upsertLessonProgress failed: ${res.status} ${text}`);
    }
  },

  async getLessonProgressByUser(userId: string): Promise<LessonProgressRow[]> {
    if (!supabaseEnabled) return [];
    try {
      const res = await supabaseFetch(
        `/lesson_progress?user_id=eq.${userId}&select=*`
      );
      if (!res.ok) return [];
      return res.json();
    } catch {
      return [];
    }
  },

  // ── Notifications ────────────────────────────────────────────────────────────

  async createNotification(notification: {
    user_id: string;
    type: string;
    message: string;
    lesson_id?: string;
  }): Promise<void> {
    if (!supabaseEnabled) return;
    const res = await supabaseFetch("/notifications", {
      method: "POST",
      body: JSON.stringify(notification),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => res.statusText);
      throw new Error(`createNotification failed: ${res.status} ${text}`);
    }
  },

  async getNotificationsByUser(userId: string): Promise<NotificationRow[]> {
    if (!supabaseEnabled) return [];
    try {
      const res = await supabaseFetch(
        `/notifications?user_id=eq.${encodeURIComponent(userId)}&order=created_at.desc&limit=20`
      );
      if (!res.ok) return [];
      return res.json();
    } catch {
      return [];
    }
  },

  async markNotificationsRead(userId: string, before?: string): Promise<void> {
    if (!supabaseEnabled) return;
    let qs = `/notifications?user_id=eq.${encodeURIComponent(userId)}&read=eq.false`;
    if (before) qs += `&created_at=lte.${encodeURIComponent(before)}`;
    const res = await supabaseFetch(qs, {
      method: "PATCH",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({ read: true }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => res.statusText);
      throw new Error(`markNotificationsRead failed: ${res.status} ${text}`);
    }
  },

  // ── Profiles ─────────────────────────────────────────────────────────────────

  async getStudentProfiles(opts?: {
    studentIds?: string[];
    search?:    string;
    page?:      number;
    pageSize?:  number;
  }): Promise<{
    rows:    Array<{ app_user_id: string; name: string; avatar_id: string; xp: number }>;
    total:   number;
  }> {
    if (!supabaseEnabled) return { rows: [], total: 0 };
    try {
      const page     = Math.max(1, opts?.page ?? 1);
      const pageSize = Math.min(200, Math.max(1, opts?.pageSize ?? 50));
      const offset   = (page - 1) * pageSize;

      let qs = `/profiles?select=app_user_id,name,avatar_id,xp&role=eq.student&order=xp.desc&limit=${pageSize}&offset=${offset}`;
      if (opts?.studentIds?.length) {
        qs += `&app_user_id=in.(${opts.studentIds.map(encodeURIComponent).join(",")})`;
      }
      if (opts?.search?.trim()) {
        // PostgREST ilike with embedded wildcards. Escape % and _ to keep them literal.
        const pat = opts.search.trim().replace(/[%_]/g, "\\$&");
        qs += `&name=ilike.*${encodeURIComponent(pat)}*`;
      }
      const res = await supabaseFetch(qs, {
        headers: { Prefer: "count=exact" },
      });
      if (!res.ok) return { rows: [], total: 0 };
      const rows = await res.json();
      // PostgREST returns total in Content-Range: 0-9/123
      const range = res.headers.get("content-range") ?? "";
      const totalStr = range.split("/")[1] ?? "0";
      const total = totalStr === "*" ? rows.length : parseInt(totalStr, 10) || 0;
      return { rows, total };
    } catch {
      return { rows: [], total: 0 };
    }
  },

  async getStudentProfileById(appUserId: string): Promise<
    { app_user_id: string; name: string; avatar_id: string; xp: number } | null
  > {
    if (!supabaseEnabled) return null;
    try {
      const res = await supabaseFetch(
        `/profiles?select=app_user_id,name,avatar_id,xp&app_user_id=eq.${encodeURIComponent(appUserId)}&limit=1`
      );
      if (!res.ok) return null;
      const rows = await res.json();
      return rows[0] ?? null;
    } catch {
      return null;
    }
  },

  // ── Purchases ────────────────────────────────────────────────────────────────

  async getPurchasesByUser(appUserId: string): Promise<string[]> {
    if (!supabaseEnabled) return [];
    try {
      const res = await supabaseFetch(
        `/purchases?app_user_id=eq.${encodeURIComponent(appUserId)}&select=item_id`
      );
      if (!res.ok) return [];
      const rows: { item_id: string }[] = await res.json();
      return rows.map((r) => r.item_id);
    } catch {
      return [];
    }
  },

  // ── Curator ───────────────────────────────────────────────────────────────────

  async getCuratorStudents(curatorAppUserId: string): Promise<string[]> {
    if (!supabaseEnabled) return [];
    try {
      // Step 1: resolve curator's auth UUID (PostgREST has no subqueries).
      const cp = await supabaseFetch(
        `/profiles?app_user_id=eq.${encodeURIComponent(curatorAppUserId)}&select=id&limit=1`
      );
      if (!cp.ok) return [];
      const curatorRows: { id: string }[] = await cp.json();
      const curatorUuid = curatorRows[0]?.id;
      if (!curatorUuid) return [];

      // Step 2: groups + students embedded in one round-trip (saves the 3rd request).
      const join = await supabaseFetch(
        `/groups?curator_id=eq.${curatorUuid}` +
        `&select=students:profiles!profiles_group_id_fkey(app_user_id)`
      );
      if (!join.ok) return [];
      const groups: { students: { app_user_id: string }[] }[] = await join.json();
      return groups.flatMap((g) => (g.students ?? []).map((s) => s.app_user_id));
    } catch {
      return [];
    }
  },

  // ── Groups ────────────────────────────────────────────────────────────────────

  async getGroupsByCurator(curatorAppUserId: string): Promise<
    { id: string; name: string; tier: "smart" | "vip"; created_at: string; students_count: number }[]
  > {
    if (!supabaseEnabled) return [];
    try {
      const cp = await supabaseFetch(
        `/profiles?app_user_id=eq.${encodeURIComponent(curatorAppUserId)}&select=id&limit=1`
      );
      if (!cp.ok) return [];
      const curatorRows: { id: string }[] = await cp.json();
      const curatorUuid = curatorRows[0]?.id;
      if (!curatorUuid) return [];

      const gr = await supabaseFetch(
        `/groups?curator_id=eq.${curatorUuid}&select=id,name,tier,created_at&order=created_at.asc`
      );
      if (!gr.ok) return [];
      const groups: { id: string; name: string; tier: "smart" | "vip"; created_at: string }[] = await gr.json();
      if (groups.length === 0) return [];

      // Count students per group in a single query
      const counts = await supabaseFetch(
        `/profiles?group_id=in.(${groups.map((g) => g.id).join(",")})&select=group_id`
      );
      const countRows: { group_id: string }[] = counts.ok ? await counts.json() : [];
      const countByGroup = new Map<string, number>();
      for (const row of countRows) {
        countByGroup.set(row.group_id, (countByGroup.get(row.group_id) ?? 0) + 1);
      }

      return groups.map((g) => ({ ...g, students_count: countByGroup.get(g.id) ?? 0 }));
    } catch {
      return [];
    }
  },

  async getGroupById(groupId: string): Promise<
    { id: string; name: string; tier: "smart" | "vip"; curator_id: string; created_at: string } | null
  > {
    if (!supabaseEnabled) return null;
    try {
      const res = await supabaseFetch(
        `/groups?id=eq.${groupId}&select=id,name,tier,curator_id,created_at&limit=1`
      );
      if (!res.ok) return null;
      const rows: { id: string; name: string; tier: "smart" | "vip"; curator_id: string; created_at: string }[] = await res.json();
      return rows[0] ?? null;
    } catch {
      return null;
    }
  },

  async getStudentsInGroup(groupId: string): Promise<
    { id: string; app_user_id: string; name: string; avatar_id: string; xp: number; tier: string }[]
  > {
    if (!supabaseEnabled) return [];
    try {
      const res = await supabaseFetch(
        `/profiles?group_id=eq.${groupId}&select=id,app_user_id,name,avatar_id,xp,tier&order=name.asc`
      );
      if (!res.ok) return [];
      return await res.json();
    } catch {
      return [];
    }
  },

  async getUnassignedStudentsByTier(tier: "smart" | "vip"): Promise<
    { id: string; app_user_id: string; name: string; avatar_id: string }[]
  > {
    if (!supabaseEnabled) return [];
    try {
      const res = await supabaseFetch(
        `/profiles?tier=eq.${tier}&group_id=is.null&role=eq.student&select=id,app_user_id,name,avatar_id&order=name.asc`
      );
      if (!res.ok) return [];
      return await res.json();
    } catch {
      return [];
    }
  },

  async createGroup(curatorUuid: string, name: string, tier: "smart" | "vip"): Promise<string | null> {
    if (!supabaseEnabled) return null;
    try {
      const res = await supabaseFetch(`/groups`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Prefer: "return=representation" },
        body: JSON.stringify({ name, curator_id: curatorUuid, tier }),
      });
      if (!res.ok) return null;
      const rows: { id: string }[] = await res.json();
      return rows[0]?.id ?? null;
    } catch {
      return null;
    }
  },

  async renameGroup(groupId: string, name: string): Promise<boolean> {
    return this.updateGroup(groupId, { name });
  },

  async updateGroup(
    groupId: string,
    patch: { name?: string; tier?: "smart" | "vip" }
  ): Promise<boolean> {
    if (!supabaseEnabled) return false;
    if (patch.name === undefined && patch.tier === undefined) return false;
    try {
      const res = await supabaseFetch(`/groups?id=eq.${groupId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async deleteGroup(groupId: string): Promise<boolean> {
    if (!supabaseEnabled) return false;
    try {
      const res = await supabaseFetch(`/groups?id=eq.${groupId}`, { method: "DELETE" });
      return res.ok;
    } catch {
      return false;
    }
  },

  /** Assigns a student to a group. Returns false if the student's tier doesn't match the group's tier. */
  async addStudentToGroup(studentProfileId: string, groupId: string): Promise<boolean> {
    if (!supabaseEnabled) return false;
    try {
      const res = await supabaseFetch(`/profiles?id=eq.${studentProfileId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ group_id: groupId }),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  /** Removes a student from their current group; tier is preserved per product spec. */
  async removeStudentFromGroup(studentProfileId: string): Promise<boolean> {
    if (!supabaseEnabled) return false;
    try {
      const res = await supabaseFetch(`/profiles?id=eq.${studentProfileId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ group_id: null }),
      });
      return res.ok;
    } catch {
      return false;
    }
  },
};
