/**
 * 모든 시드 유저를 브론즈로 통일
 * - @kickvista-seed.local 이메일 유저 전체 탐색
 * - 구버전(seed_@..., seed_12@... 등) 유저 게시글 삭제
 * - 전체 시드 유저 total_points 30~50pt로 초기화
 *
 * 실행: npx tsx scripts/fix-bronze.ts
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

function ri(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function fixBronze() {
  // 1. @kickvista-seed.local 이메일 유저 전체 조회
  const { data: allUsers } = await admin.auth.admin.listUsers({ perPage: 1000 });
  const seedUsers = (allUsers?.users ?? []).filter(
    (u) => u.email?.endsWith("@kickvista-seed.local")
  );

  console.log(`🔍 시드 유저 발견: ${seedUsers.length}명\n`);
  seedUsers.forEach((u) => console.log(`  - ${u.email}  (${u.id})`));

  // 2. seed_user_XX 패턴이 아닌 구버전 유저 식별
  const oldUsers = seedUsers.filter(
    (u) => !u.email?.match(/^seed_user_\d{2}@kickvista-seed\.local$/)
  );

  if (oldUsers.length > 0) {
    console.log(`\n🗑  구버전 시드 유저 ${oldUsers.length}명 게시글 삭제 중...`);
    const oldIds = oldUsers.map((u) => u.id);

    const { error } = await admin
      .from("community_posts")
      .delete()
      .in("author_id", oldIds);

    if (error) console.error("  ❌ 삭제 실패:", error.message);
    else console.log(`  ✅ 게시글/댓글 삭제 완료`);
  }

  // 3. 전체 시드 유저 프로필 포인트 브론즈로 초기화
  console.log(`\n🥉 전체 시드 유저 포인트 브론즈로 초기화 중...\n`);

  for (const u of seedUsers) {
    const points = ri(30, 50); // 브론즈 = 300pt 미만
    const { error } = await admin
      .from("profiles")
      .update({ total_points: points })
      .eq("id", u.id);

    if (error) console.error(`  ❌ ${u.email} 실패:`, error.message);
    else console.log(`  ✅ ${u.email?.split("@")[0]} → ${points}pt (브론즈)`);
  }

  console.log("\n✅ 완료! 모든 시드 유저가 브론즈 등급입니다.\n");
}

fixBronze().catch((e) => {
  console.error("❌ 실패:", e);
  process.exit(1);
});
