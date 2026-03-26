/**
 * Cron endpoint: Google News RSS → Gemini AI 요약 → 커뮤니티 자동 포스팅
 * Schedule: 매일 오전 8시 KST (23:00 UTC) — vercel.json 참고
 *
 * Flow:
 *  1. NEWS_QUERIES 키워드로 Google News RSS 피드 수집
 *  2. 기사 원문 URL 기준 중복 확인 (content에 URL 포함 여부로 체크)
 *  3. Gemini API로 한국어 축구 뉴스 스타일 요약 생성
 *  4. community_posts 테이블에 insert
 *
 * Env vars:
 *   CRON_SECRET              – cron 인증 시크릿
 *   GEMINI_API_KEY           – Google Gemini API 키
 *   NEWS_BOT_AUTHOR_ID       – 뉴스봇 Supabase profiles.id
 *   SUPABASE_SERVICE_ROLE_KEY – RLS 우회용 서비스 키
 */

import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

// ─── 수집 대상 키워드 ─────────────────────────────────────────────────────────

const NEWS_QUERIES: Array<{
  query: string;
  tags: string[];
  leagueSlug: string;
  category: string;
}> = [
  {
    query: "손흥민",
    tags: ["손흥민", "토트넘", "EPL"],
    leagueSlug: "premier-league",
    category: "match-discussion",
  },
  {
    query: "토트넘",
    tags: ["토트넘", "EPL", "프리미어리그"],
    leagueSlug: "premier-league",
    category: "match-discussion",
  },
  {
    query: "프리미어리그 이적",
    tags: ["이적", "EPL", "프리미어리그"],
    leagueSlug: "premier-league",
    category: "transfer-news",
  },
  {
    query: "K리그 하이라이트",
    tags: ["K리그", "한국축구", "하이라이트"],
    leagueSlug: "k-league-1",
    category: "highlights",
  },
];

// ─── RSS 파서 ─────────────────────────────────────────────────────────────────

interface RssItem {
  title: string;
  link: string;
  description: string;
}

function parseRssItems(xml: string): RssItem[] {
  const items: RssItem[] = [];
  const blocks = xml.match(/<item>([\s\S]*?)<\/item>/g) ?? [];

  for (const block of blocks) {
    const extract = (tag: string): string =>
      (block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`))?.[1] ?? "")
        .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/, "$1")
        .replace(/<[^>]+>/g, "")
        .trim();

    const linkMatch =
      block.match(/<link>([^<]+)<\/link>/) ??
      block.match(/<link[^>]+href="([^"]+)"/);

    const title = extract("title");
    const description = extract("description");
    const link = linkMatch?.[1]?.trim() ?? "";

    if (title.length > 5) items.push({ title, link, description });
    if (items.length >= 3) break; // 쿼리당 최대 3건
  }
  return items;
}

// ─── Gemini AI 요약 ───────────────────────────────────────────────────────────

async function generatePost(
  item: RssItem,
  gemini: GoogleGenerativeAI
): Promise<{ title: string; content: string } | null> {
  try {
    const model = gemini.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `너는 KickVista 축구 커뮤니티의 뉴스 에디터야.
아래 뉴스 기사를 한국어 축구 팬 커뮤니티 게시글로 자연스럽게 작성해줘.

[기사 제목] ${item.title}
[기사 내용] ${item.description}
[원문 링크] ${item.link}

작성 규칙:
1. 제목: 한국어, 50자 이내, 이모지 1개 포함
2. 본문: 핵심 내용 3~4문단 (총 250~350자), 열정적이고 자연스러운 팬 커뮤니티 어조
3. 본문 마지막 줄에 반드시 아래 문구를 그대로 추가:

---
*이 소식은 AI를 통해 실시간으로 수집 및 요약되었습니다. 원문 확인: ${item.link}*

JSON만 응답 (다른 텍스트 없이):
{"title":"제목","content":"본문"}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

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
  // 인증
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 환경변수 확인
  const botAuthorId = process.env.NEWS_BOT_AUTHOR_ID ?? "7769c4c0-d1bf-4a8c-a190-cf37d92b16b6";
  const geminiKey = process.env.GEMINI_API_KEY;
  if (!geminiKey) {
    return NextResponse.json({ error: "GEMINI_API_KEY not configured." }, { status: 500 });
  }

  const supabase = createAdminClient();
  const gemini = new GoogleGenerativeAI(geminiKey);
  const results = { inserted: 0, skipped: 0, errors: 0, posts: [] as string[] };

  for (const queryConfig of NEWS_QUERIES) {
    try {
      // RSS 수집
      const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(queryConfig.query)}&hl=ko&gl=KR&ceid=KR:ko`;
      const rssRes = await fetch(rssUrl, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; KickVista-NewsBot/1.0)" },
        signal: AbortSignal.timeout(10_000),
      });

      if (!rssRes.ok) {
        console.warn(`[sync-news] RSS ${rssRes.status} — "${queryConfig.query}"`);
        results.errors++;
        continue;
      }

      const items = parseRssItems(await rssRes.text());

      for (const item of items) {
        // ── URL 기반 중복 확인 ────────────────────────────────────────────────
        // content 안에 원문 링크 URL이 이미 저장돼 있으면 스킵
        if (item.link) {
          const { data: existing } = await supabase
            .from("community_posts")
            .select("id")
            .ilike("content", `%${item.link}%`)
            .limit(1);

          if (existing && existing.length > 0) {
            results.skipped++;
            continue;
          }
        }

        // ── Gemini 요약 생성 ──────────────────────────────────────────────────
        const post = await generatePost(item, gemini);
        if (!post) {
          results.errors++;
          continue;
        }

        // ── Supabase insert ───────────────────────────────────────────────────
        const { error: dbError } = await supabase.from("community_posts").insert({
          author_id: botAuthorId,
          category: queryConfig.category,
          title: post.title,
          content: post.content,
          tags: [...queryConfig.tags, "AI뉴스", "자동포스팅"],
          is_hot: false,
          is_pinned: false,
        });

        if (dbError) {
          console.error("[sync-news] DB error:", dbError.message);
          results.errors++;
        } else {
          results.inserted++;
          results.posts.push(post.title.slice(0, 40));
        }
      }
    } catch (err) {
      console.error(`[sync-news] "${queryConfig.query}" failed:`, err);
      results.errors++;
    }
  }

  console.log(`[sync-news] done — inserted:${results.inserted} skipped:${results.skipped} errors:${results.errors}`);

  return NextResponse.json({
    success: true,
    inserted: results.inserted,
    skipped: results.skipped,
    errors: results.errors,
    posts: results.posts,
    syncedAt: new Date().toISOString(),
  });
}
