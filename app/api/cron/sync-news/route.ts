/**
 * Cron endpoint: Google News RSS → Gemini AI 요약 → 커뮤니티 자동 포스팅
 * Schedule: 매일 오전 8시 KST (23:00 UTC) — vercel.json 참고
 *
 * Flow:
 *  1. rss-parser로 Google News RSS 수집 (손흥민, 토트넘, 프리미어리그)
 *  2. 기사 URL 기준 중복 확인 (community_posts.content에 링크 포함 여부)
 *  3. Gemini 1.5 Flash 8B로 한국어 축구 팬 스타일 요약 생성
 *  4. community_posts 테이블에 insert
 *
 * Env vars:
 *   CRON_SECRET              – cron 인증 시크릿
 *   GEMINI_API_KEY           – Google Gemini API 키
 *   NEWS_BOT_AUTHOR_ID       – 뉴스봇 Supabase profiles.id
 *   SUPABASE_SERVICE_ROLE_KEY – RLS 우회용 서비스 키
 */

import { NextRequest, NextResponse } from "next/server";
import Parser from "rss-parser";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

// ─── 설정 ────────────────────────────────────────────────────────────────────

const NEWS_QUERIES: Array<{ query: string; tags: string[]; category: string }> = [
  { query: "손흥민",          tags: ["손흥민", "토트넘", "EPL"],          category: "match-discussion" },
  { query: "토트넘",          tags: ["토트넘", "EPL", "프리미어리그"],    category: "match-discussion" },
  { query: "프리미어리그 이적", tags: ["이적", "EPL", "프리미어리그"],    category: "transfer-news"   },
];

// 테스트 모드: 첫 번째 쿼리에서 1건만 처리
const MAX_ITEMS_PER_QUERY = 1;
const MAX_QUERIES = 1; // 테스트 중엔 쿼리 1개만 실행

// gemini-1.5-flash는 이 환경 v1beta에서 404 반환 → gemini-2.0-flash 유지
const GEMINI_MODEL = "gemini-2.0-flash";

// 기사 본문 최대 전송 길이 (토큰 절약)
const DESC_MAX_CHARS = 600;

// 기사 처리 후 대기 시간 (TPM/RPM 보호)
const GEMINI_DELAY_MS = 20_000;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// ─── Gemini AI 요약 (Exponential Backoff 재시도) ─────────────────────────────

async function callGeminiWithRetry(
  prompt: string,
  geminiKey: string
): Promise<{ text: string | null; error: string; isQuotaError: boolean }> {
  const delays = [0, 5_000, 10_000]; // 즉시 → 5초 후 → 10초 후

  for (let attempt = 0; attempt < delays.length; attempt++) {
    if (delays[attempt] > 0) {
      console.log(`[sync-news] Gemini retry ${attempt}/${delays.length - 1} — waiting ${delays[attempt] / 1000}s`);
      await sleep(delays[attempt]);
    }

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${geminiKey}`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      }
    );

    // 전체 응답 로깅 (디버깅용)
    const rawBody = await res.text();
    console.log(`[sync-news] Gemini response [${res.status}]:`, rawBody.slice(0, 400));

    if (res.ok) {
      const data = JSON.parse(rawBody) as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      };
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
      return { text, error: "", isQuotaError: false };
    }

    const isQuota = res.status === 429;
    const msg = `HTTP ${res.status}: ${rawBody.slice(0, 300)}`;

    // 429이 아닌 에러(400, 404 등)는 재시도 없이 즉시 반환
    if (!isQuota) {
      return { text: null, error: msg, isQuotaError: false };
    }

    // 마지막 시도에서도 429면 포기
    if (attempt === delays.length - 1) {
      return { text: null, error: msg, isQuotaError: true };
    }
  }

  return { text: null, error: "unreachable", isQuotaError: false };
}

async function generatePost(
  title: string,
  description: string,
  link: string,
  geminiKey: string
): Promise<{ post: { title: string; content: string } | null; error: string; isQuotaError: boolean }> {
  const prompt = `너는 KickVista 축구 커뮤니티의 뉴스 에디터야.
아래 뉴스 기사를 한국어 축구 팬 커뮤니티 게시글로 자연스럽게 작성해줘.

[기사 제목] ${title}
[기사 내용] ${description.substring(0, DESC_MAX_CHARS)}

작성 규칙:
1. 제목: 한국어, 50자 이내, 이모지 1개 포함
2. 본문: 핵심 내용 3~4문단 (총 250~350자), 열정적이고 자연스러운 팬 커뮤니티 어조
3. 본문 마지막에 반드시 이 문구 추가:

---
*이 소식은 AI를 통해 실시간으로 수집 및 요약되었습니다.*
[기사 원문 보기](${link})

JSON만 응답 (다른 텍스트 없이):
{"title":"제목","content":"본문"}`;

  try {
    const { text, error, isQuotaError } = await callGeminiWithRetry(prompt, geminiKey);
    if (!text) return { post: null, error, isQuotaError };

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return { post: null, error: "JSON not found in response", isQuotaError: false };

    const parsed = JSON.parse(jsonMatch[0]) as { title?: string; content?: string };
    if (!parsed.title || !parsed.content) return { post: null, error: "title/content missing", isQuotaError: false };

    return { post: { title: parsed.title, content: parsed.content }, error: "", isQuotaError: false };
  } catch (err) {
    const msg = String(err);
    console.error("[sync-news] generatePost error:", msg);
    return { post: null, error: msg, isQuotaError: false };
  }
}

// ─── Cron handler ─────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const geminiKey = process.env.GEMINI_API_KEY;
  if (!geminiKey) return NextResponse.json({ error: "GEMINI_API_KEY not configured." }, { status: 500 });

  const botAuthorId = process.env.NEWS_BOT_AUTHOR_ID;
  if (!botAuthorId) return NextResponse.json({ error: "NEWS_BOT_AUTHOR_ID not configured." }, { status: 500 });

  const supabase = createAdminClient();
  const parser   = new Parser({ timeout: 10_000 });

  const results = {
    inserted: 0, skipped: 0, errors: 0,
    posts: [] as string[], errorMessages: [] as string[],
  };
  let quotaExceeded = false;

  outer:
  for (const queryConfig of NEWS_QUERIES.slice(0, MAX_QUERIES)) {
    if (quotaExceeded) break;

    try {
      const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(queryConfig.query)}&hl=ko&gl=KR&ceid=KR:ko`;
      const feed = await parser.parseURL(rssUrl);
      const items = feed.items.slice(0, MAX_ITEMS_PER_QUERY);
      console.log(`[sync-news] query "${queryConfig.query}" — ${items.length} items fetched`);

      for (const item of items) {
        if (quotaExceeded) break outer;

        const link        = item.link ?? item.guid ?? "";
        const title       = item.title ?? "";
        const description = item.contentSnippet ?? item.content ?? item.summary ?? "";
        if (!title || !link) continue;

        // 중복 확인
        const { data: existing } = await supabase
          .from("community_posts")
          .select("id")
          .ilike("content", `%${link}%`)
          .limit(1);

        if (existing && existing.length > 0) {
          results.skipped++;
          console.log(`[sync-news] skipped (duplicate): ${title.slice(0, 40)}`);
          continue;
        }

        // Gemini 요약 생성 (호출 후 항상 20초 대기 — TPM/RPM 보호)
        const { post, error: geminiError, isQuotaError } = await generatePost(title, description, link, geminiKey);
        await sleep(GEMINI_DELAY_MS);

        if (isQuotaError) {
          quotaExceeded = true;
          results.errors++;
          results.errorMessages.push(`[Quota] ${geminiError}`);
          console.error("[sync-news] quota exceeded — stopping");
          break outer;
        }

        if (!post) {
          results.errors++;
          results.errorMessages.push(`[Gemini] ${title.slice(0, 30)}: ${geminiError}`);
          continue;
        }

        // DB insert
        const { error: dbError } = await supabase.from("community_posts").insert({
          author_id: botAuthorId,
          category:  queryConfig.category,
          title:     post.title.slice(0, 120),
          content:   post.content,
          tags:      [...queryConfig.tags, "AI뉴스", "자동포스팅"],
          is_hot:    false,
          is_pinned: false,
        });

        if (dbError) {
          console.error("[sync-news] DB error:", dbError.message);
          results.errors++;
          results.errorMessages.push(`[DB] ${dbError.message}`);
        } else {
          results.inserted++;
          results.posts.push(post.title.slice(0, 40));
          console.log(`[sync-news] ✅ inserted: ${post.title.slice(0, 40)}`);
        }
      }
    } catch (err) {
      const msg = String(err);
      console.error(`[sync-news] query "${queryConfig.query}" failed:`, msg);
      results.errors++;
      results.errorMessages.push(`[RSS:${queryConfig.query}] ${msg}`);
    }
  }

  console.log(
    `[sync-news] done — inserted:${results.inserted} skipped:${results.skipped} errors:${results.errors} quotaExceeded:${quotaExceeded}`
  );

  return NextResponse.json({
    success: true,
    model: GEMINI_MODEL,
    inserted:      results.inserted,
    skipped:       results.skipped,
    errors:        results.errors,
    posts:         results.posts,
    errorMessages: results.errorMessages,
    quotaExceeded,
    syncedAt:      new Date().toISOString(),
  });
}
