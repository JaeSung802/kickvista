/**
 * 커뮤니티 게시판 카운터 초기화
 * view_count, like_count, comment_count → 0
 * 실제 댓글/좋아요 레코드도 함께 삭제
 *
 * 실행: npx tsx scripts/reset-counters.ts
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

async function resetCounters() {
  console.log("🔄 커뮤니티 카운터 초기화 중...\n");

  // 1. 댓글 전체 삭제
  const { error: e1 } = await admin.from("community_comments").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  if (e1) console.error("  ❌ 댓글 삭제 실패:", e1.message);
  else console.log("  🗑  댓글 전체 삭제 완료");

  // 2. 좋아요 전체 삭제
  const { error: e2 } = await admin.from("community_post_likes").delete().neq("post_id", "00000000-0000-0000-0000-000000000000");
  if (e2) console.error("  ❌ 좋아요 삭제 실패:", e2.message);
  else console.log("  🗑  좋아요 전체 삭제 완료");

  // 3. 게시글 카운터 일괄 0으로 초기화
  const { error: e3, count } = await admin
    .from("community_posts")
    .update({ view_count: 0, like_count: 0, comment_count: 0 })
    .neq("id", "00000000-0000-0000-0000-000000000000");
  if (e3) console.error("  ❌ 카운터 초기화 실패:", e3.message);
  else console.log(`  ✅ 게시글 카운터 초기화 완료`);

  console.log("\n✅ 완료! 모든 게시글의 조회수·좋아요·댓글 수가 0으로 초기화됐습니다.\n");
}

resetCounters().catch((e) => {
  console.error("❌ 실패:", e);
  process.exit(1);
});
