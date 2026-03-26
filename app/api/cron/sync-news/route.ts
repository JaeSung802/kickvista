/**
 * Cron endpoint: Google News RSS → Gemini AI 요약 → 커뮤니티 자동 포스팅
 * Schedule: 매일 오전 8시 KST (23:00 UTC) — vercel.json 참고
 *
 * Flow:
 *  1. rss-parser로 Google News RSS 수집 (손흥민, 토트넘, 프리미어리그)
 *  2. 기사 URL 기준 중복 확인 (community_posts.content에 링크 포함 여부)
 *  3. Gemini 2.0 Flash로 한국어 축구 팬 스타일 요약 생성
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

// ─── 수집 대상 키워드 ─────────────────────────────────────────────────────────

const NEWS_QUERIES: Array<{
  query: string;
  tags: string[];
  category: string;
}> = [
  {
    query: "손흥민",
    tags: ["손흥민", "토트넘", "EPL"],
    category: "match-discussion",
  },
  {
    query: "토트넘",
    tags: ["토트넘", "EPL", "프리미어리그"],
    category: "match-discussion",
  },
  {
    query: "프리미어리그 이적",
    tags: ["이적", "EPL", "프리미어리그"],
    category: "transfer-news",
  },
];

// ─── Gemini AI 요약 ───────────────────────────────────────────────────────────

async function generatePost(
  title: string,
  description: string,
  link: string,
  geminiKey: string
): Promise<{ title: string; content: string } | null> {
  try {
    const prompt = `너는 KickVista 축구 커뮤니티의 뉴스 에디터야.
아래 뉴스 기사를 한국어 축구 팬 커뮤니티 게시글로 자연스럽게 작성해줘.

[기사 제목] ${title}
[기사 내용] ${description}

작성 규칙:
1. 제목: 한국어, 50자 이내, 이모지 1개 포함
2. 본문: 핵심 내용 3~4문단 (총 250~350자), 열정적이고 자연스러운 팬 커뮤니티 어조
3. 본문 마지막에 반드시 이 문구 추가:

---
*이 소식은 AI를 통해 실시간으로 수집 및 요약되었습니다.*
[기사 원문 보기](${link})

JSON만 응답 (다른 텍스트 없이):
{"title":"제목","content":"본문"}`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      }
    );

    if (!res.ok) {
      const errText = await res.text();
      console.error("[sync-news] Gemini API error:", res.status, errText);
      return null;
    }

    const data = await res.json() as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const parsed = JSON.parse(jsonMatch[0]) as { title?: string; content?: string };
    if (!parsed.title || !parsed.content) return null;
    return { title: parsed.title, content: parsed.content };
  } catch (err) {
    console.error("[sync-news] Gemini error:", err);
    return null;
  }
}

// ─── Cron handler ─────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  // ── 보안: Authorization 헤더 확인 ────────────────────────────────────────────
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ── 환경변수 확인 ─────────────────────────────────────────────────────────────
  const geminiKey = process.env.GEMINI_API_KEY;
  if (!geminiKey) {
    return NextResponse.json({ error: "GEMINI_API_KEY not configured." }, { status: 500 });
  }
  const botAuthorId = process.env.NEWS_BOT_AUTHOR_ID;
  if (!botAuthorId) {
    return NextResponse.json({ error: "NEWS_BOT_AUTHOR_ID not configured." }, { status: 500 });
  }

  const supabase = createAdminClient();
  const parser   = new Parser({ timeout: 10_000 });

  const results = { inserted: 0, skipped: 0, errors: 0, posts: [] as string[] };

  for (const queryConfig of NEWS_QUERIES) {
    try {
      // ── 1. Google News RSS 수집 ────────────────────────────────────────────
      const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(queryConfig.query)}&hl=ko&gl=KR&ceid=KR:ko`;
      const feed = await parser.parseURL(rssUrl);
      const items = feed.items.slice(0, 3); // 쿼리당 최대 3건

      for (const item of items) {
        const link        = item.link ?? item.guid ?? "";
        const title       = item.title ?? "";
        const description = item.contentSnippet ?? item.content ?? item.summary ?? "";

        if (!title || !link) continue;

        // ── 2. URL 기반 중복 확인 ──────────────────────────────────────────────
        const { data: existing } = await supabase
          .from("community_posts")
          .select("id")
          .ilike("content", `%${link}%`)
          .limit(1);

        if (existing && existing.length > 0) {
          results.skipped++;
          continue;
        }

        // ── 3. Gemini로 한국어 요약 생성 ──────────────────────────────────────
        const post = await generatePost(title, description, link, geminiKey);
        if (!post) {
          results.errors++;
          continue;
        }

        // ── 4. Supabase community_posts insert ────────────────────────────────
        const { error: dbError } = await supabase.from("community_posts").insert({
          author_id: botAuthorId,
          category:  queryConfig.category,
          title:     post.title,
          content:   post.content,
          tags:      [...queryConfig.tags, "AI뉴스", "자동포스팅"],
          is_hot:    false,
          is_pinned: false,
        });

        if (dbError) {
          console.error("[sync-news] DB error:", dbError.message);
          results.errors++;
        } else {
          results.inserted++;
          results.posts.push(post.title.slice(0, 40));
          console.log(`[sync-news] ✅ inserted: ${post.title.slice(0, 40)}`);
        }
      }
    } catch (err) {
      console.error(`[sync-news] query "${queryConfig.query}" failed:`, err);
      results.errors++;
    }
  }

  console.log(
    `[sync-news] done — inserted:${results.inserted} skipped:${results.skipped} errors:${results.errors}`
  );

  return NextResponse.json({
    success:   true,
    inserted:  results.inserted,
    skipped:   results.skipped,
    errors:    results.errors,
    posts:     results.posts,
    syncedAt:  new Date().toISOString(),
  });
}
