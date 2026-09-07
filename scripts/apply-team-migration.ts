/**
 * team_slug / league_slug 컬럼을 community_posts에 추가하는 마이그레이션
 * 실행: npx tsx scripts/apply-team-migration.ts
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";
import * as fs from "fs";

const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) dotenv.config({ path: envPath });
else dotenv.config();

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function applyMigration() {
  console.log("🔧 team_slug / league_slug 컬럼 마이그레이션 적용 중...\n");

  // Try adding columns via RPC if available, otherwise report instructions
  const { error } = await (admin as any).rpc("exec_sql", {
    sql: `
      alter table public.community_posts
        add column if not exists team_slug   text,
        add column if not exists league_slug text;

      create index if not exists community_posts_team_slug_idx
        on public.community_posts (team_slug)
        where team_slug is not null;

      create index if not exists community_posts_league_slug_idx
        on public.community_posts (league_slug)
        where league_slug is not null;
    `,
  });

  if (error) {
    console.error("❌ RPC 방식 실패:", error.message);
    console.log("\n📋 Supabase Dashboard에서 직접 실행해주세요:");
    console.log("   1. https://supabase.com/dashboard → SQL Editor");
    console.log("   2. 아래 SQL 실행:\n");
    console.log(`alter table public.community_posts
  add column if not exists team_slug   text,
  add column if not exists league_slug text;

create index if not exists community_posts_team_slug_idx
  on public.community_posts (team_slug)
  where team_slug is not null;

create index if not exists community_posts_league_slug_idx
  on public.community_posts (league_slug)
  where league_slug is not null;`);
    process.exit(1);
  }

  console.log("✅ 마이그레이션 완료!\n");
}

applyMigration().catch((e) => {
  console.error("❌ 실패:", e);
  process.exit(1);
});
