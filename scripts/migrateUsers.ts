/**
 * One-time migration: seeds Supabase Auth + profiles table from CREDENTIALS.
 * Run with: npx tsx scripts/migrateUsers.ts
 *
 * Requires in .env.local (loaded automatically by dotenv):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_KEY
 */

import * as dotenv from "dotenv";
import * as path from "path";
import { createClient } from "@supabase/supabase-js";

// Load .env.local from the project root
dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

// ── Inline credentials (mirrors src/data/users.ts) ───────────────────────────

interface UserEntry {
  id: string;
  name: string;
  avatarId: string;
  role: "student" | "curator" | "admin";
}

interface Credential {
  username: string;
  password: string;
  user: UserEntry;
}

const CREDENTIALS: Credential[] = [
  // ── Students ──────────────────────────────────────────────────────────────
  { username: "danial",  password: "danial2024",  user: { id: "student-1", name: "Даниал Есімжан",   avatarId: "avatar_1", role: "student" } },
  { username: "begarys", password: "begarys2024", user: { id: "student-2", name: "Бегарыс Ескендір", avatarId: "avatar_2", role: "student" } },
  { username: "nailia",  password: "nailia2024",  user: { id: "student-3", name: "Найля Бисенова",   avatarId: "avatar_3", role: "student" } },
  { username: "beknur",  password: "beknur2024",  user: { id: "student-4", name: "Бекнур Нурмухан",  avatarId: "avatar_4", role: "student" } },
  { username: "dilnaz",  password: "dilnaz2024",  user: { id: "student-5", name: "Дильназ Баратова", avatarId: "avatar_5", role: "student" } },
  // ── Curator / Admin ───────────────────────────────────────────────────────
  { username: "curator", password: "curator2024", user: { id: "curator-1", name: "Куратор",         avatarId: "avatar_6", role: "curator" } },
  { username: "admin",   password: "admin2024",   user: { id: "admin-1",   name: "Администратор",   avatarId: "avatar_7", role: "admin"   } },
];

// ── Supabase admin client ─────────────────────────────────────────────────────

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey  = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error("❌  Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ── Migration ─────────────────────────────────────────────────────────────────

async function migrate() {
  console.log(`\nMigrating ${CREDENTIALS.length} users...\n`);

  for (const cred of CREDENTIALS) {
    const email = `${cred.username}@edu-platform.internal`;
    const { user } = cred;

    // 1. Create auth user
    const { data: authData, error: authError } =
      await supabase.auth.admin.createUser({
        email,
        password: cred.password,
        email_confirm: true,
        user_metadata: {
          role:      user.role,
          name:      user.name,
          avatarId:  user.avatarId,
          appUserId: user.id,
        },
      });

    if (authError) {
      if (authError.message.toLowerCase().includes("already been registered") ||
          authError.message.toLowerCase().includes("already exists")) {
        console.log(`⚠️  ${email} — already exists, skipping`);
        continue;
      }
      console.error(`❌  ${email} — auth error: ${authError.message}`);
      continue;
    }

    const uuid = authData.user?.id;
    if (!uuid) {
      console.error(`❌  ${email} — no UUID returned from createUser`);
      continue;
    }

    // 2. Insert into profiles
    const { error: profileError } = await supabase
      .from("profiles")
      .insert({
        id:          uuid,
        app_user_id: user.id,
        name:        user.name,
        avatar_id:   user.avatarId,
        role:        user.role,
        xp:          0,
      });

    if (profileError) {
      if (profileError.code === "23505") {
        // unique_violation — profile row already present
        console.log(`⚠️  ${email} (${uuid}) — profile already exists, skipping`);
      } else {
        console.error(`❌  ${email} (${uuid}) — profile error: ${profileError.message}`);
      }
      continue;
    }

    console.log(`✅  ${email} → ${uuid}  [${user.role}]`);
  }

  console.log("\nDone.\n");
}

migrate().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
