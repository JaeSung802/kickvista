/**
 * 구버전 시드 유저(seed_user_XX 패턴이 아닌) auth 계정 삭제
 * 실행: npx tsx scripts/cleanup-old-seeds.ts
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

async function cleanup() {
  const { data: allUsers } = await admin.auth.admin.listUsers({ perPage: 1000 });

  const oldSeeds = (allUsers?.users ?? []).filter(
    (u) =>
      u.email?.endsWith("@kickvista-seed.local") &&
      !u.email?.match(/^seed_user_\d{2}@kickvista-seed\.local$/)
  );

  console.log(`🗑  구버전 시드 유저 ${oldSeeds.length}명 삭제 중...\n`);

  for (const u of oldSeeds) {
    const { error } = await admin.auth.admin.deleteUser(u.id);
    if (error) console.error(`  ❌ ${u.email} 삭제 실패:`, error.message);
    else console.log(`  ✅ ${u.email} 삭제 완료`);
  }

  console.log("\n✅ 완료! 중복 닉네임 계정이 모두 제거됐습니다.\n");
}

cleanup().catch((e) => { console.error("❌ 실패:", e); process.exit(1); });
