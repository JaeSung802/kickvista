/**
 * Cron endpoint: Google News RSS → AI 요약 → 커뮤니티 자동 포스팅
 * Schedule: 매일 오전 8시 KST (23:00 UTC)
 *
 * Flow:
 *  1. NEWS_QUERIES 목록의 각 키워드로 Google News RSS 피드 수집
 *  2. 기사당 중복 확인 (제목 prefix 기준)
 *  3. Claude API로 한국어 요약 + 게시글 본문 생성
 *  4. community_posts 테이블에 insert (author = 뉴스봇 프로필)
 *
 * Env vars:
 *   CRON_SECRET          – cron 인증 시크릿
 *   ANTHROPIC_API_KEY    – Claude API 키
 *   NEWS_BOT_AUTHOR_ID   – Supabase profiles.id (뉴스봇 계정의 UUID)
 *   SUPABASE_SERVICE_ROLE_KEY – RLS 우회용 서비스 키
 */

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

// ─── 수집 대상 키워드 설정 ─────────────────────────────────────────────────────

const NEWS_QUERIES: Array<{
  query: string;
  tags: string[];
  leagueSlug: string;
  category: string;
}> = [
  {
    query: "손흥민 토트넘",
    tags: ["손흥민", "토트넘", "EPL"],
    leagueSlug: "premier-league",
    category: "transfer-news",
  },
  {
    query: "프리미어리그 이적 뉴스",
    tags: ["이적", "EPL", "프리미어리그"],
    leagueSlug: "premier-league",
    category: "transfer-news",
  },
  {
    query: "챔피언스리그 축구",
    tags: ["UCL", "챔피언스리그"],
    leagueSlug: "champions-league",
    category: "match-discussion",
  },
  {
    query: "라리가 바르셀로나 레알마드리드",
    tags: ["라리가", "바르셀로나", "레알마드리드"],
    leagueSlug: "la-liga",
    category: "match-discussion",
  },
  {
    query: "분데스리가 축구",
    tags: ["분데스리가", "독일축구"],
    leagueSlug: "bundesliga",
    category: "general",
  },
  {
    query: "K리그 축구 뉴스",
    tags: ["K리그", "한국축구"],
    leagueSlug: "k-league-1",
    category: "general",
  },
];

// ─── RSS 파서 ─────────────────────────────────────────────────────────────────

interface RssItem {
  title: string;
  link: string;
  description: string;
  pubDate: string;
}

/** Google News RSS XML을 파싱해 최대 3개의 기사를 반환 */
function parseRssItems(xml: string): RssItem[] {
  const items: RssItem[] = [];
  const itemBlocks = xml.match(/<item>([\s\S]*?)<\/item>/g) ?? [];

  for (const block of itemBlocks) {
    // CDATA 제거, 태그 제거 헬퍼
    const extract = (tag: string): string =>
      (block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`))?.[1] ?? "")
        .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/, "$1")
        .replace(/<[^>]+>/g, "")
        .trim();

    // Google News RSS는 <link> 다음에 GUID 패턴이 있어 별도 처리
    const linkMatch =
      block.match(/<link>([^<]+)<\/link>/) ??
      block.match(/<link[^>]+href="([^"]+)"/);

    const title = extract("title");
    const description = extract("description");
    const pubDate = extract("pubDate");
    const link = linkMatch?.[1]?.trim() ?? "";

    if (title.length > 5) {
      items.push({ title, link, description, pubDate });
    }
    if (items.length >= 3) break; // 쿼리당 최대 3개
  }

  return items;
}

// ─── Claude API 호출 ──────────────────────────────────────────────────────────

async function callClaude(prompt: string): Promise<string | null> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": process.env.ANTHROPIC_API_KEY ?? "",
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001", // 뉴스 요약은 Haiku (빠름·저렴)
      max_tokens: 700,
      messages: [{ role: "user", content: prompt }],
    }),
    signal: AbortSignal.timeout(20_000),
  });

  if (!res.ok) {
    console.error("[sync-news] Claude API", res.status, await res.text().catch(() => ""));
    return null;
  }
  const json = await res.json() as { content?: { text?: string }[] };
  return json.content?.[0]?.text ?? null;
}

/** 기사 정보 → 한국어 커뮤니티 게시글 생성 */
async function generatePost(
  item: RssItem
): Promise<{ title: string; content: string } | null> {
  const prompt = `다음 축구 뉴스 기사를 KickVista 커뮤니티 게시글로 작성해줘.

[기사 제목] ${item.title}
[기사 요약] ${item.description}
[출처 링크] ${item.link}

규칙:
1. 제목: 한국어로 간결하게 (50자 이내, 이모지 1개 포함 가능)
2. 본문: 핵심 내용을 3~4문단(총 250~350자)으로 자연스럽게 요약
3. 본문 맨 끝에 반드시 아래 고정 문구를 그대로 추가할 것:

---
*이 소식은 AI를 통해 실시간으로 수집 및 요약되었습니다. 원문 확인: ${item.link}*

JSON만 응답 (다른 텍스트 없이):
{"title":"제목","content":"본문"}`;

  const text = await callClaude(prompt);
  if (!text) return null;

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    const parsed = JSON.parse(jsonMatch[0]) as { title?: string; content?: string };
    if (!parsed.title || !parsed.content) return null;
    return { title: parsed.title, content: parsed.content };
  } catch {
    console.error("[sync-news] JSON parse failed:", text.slice(0, 100));
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

  // 필수 환경변수 확인
  const botAuthorId = process.env.NEWS_BOT_AUTHOR_ID;
  if (!botAuthorId) {
    return NextResponse.json(
      {
        error: "NEWS_BOT_AUTHOR_ID가 설정되지 않았습니다.",
        guide: "Supabase에서 뉴스봇 프로필을 생성하고 해당 UUID를 NEWS_BOT_AUTHOR_ID 환경변수에 추가하세요.",
      },
      { status: 500 }
    );
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY not configured." }, { status: 500 });
  }

  const supabase = createAdminClient();
  const results = { inserted: 0, skipped: 0, errors: 0, details: [] as string[] };

  for (const queryConfig of NEWS_QUERIES) {
    try {
      // Google News RSS 수집
      const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(queryConfig.query)}&hl=ko&gl=KR&ceid=KR:ko`;
      const rssRes = await fetch(rssUrl, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; KickVista-NewsBot/1.0)" },
        signal: AbortSignal.timeout(10_000),
      });

      if (!rssRes.ok) {
        console.warn(`[sync-news] RSS ${rssRes.status} for "${queryConfig.query}"`);
        results.errors++;
        continue;
      }

      const xml = await rssRes.text();
      const items = parseRssItems(xml);

      if (items.length === 0) {
        results.details.push(`"${queryConfig.query}" → 기사 없음`);
        continue;
      }

      for (const item of items) {
        // ── 중복 확인 (제목 앞 25자 기준) ────────────────────────────────────
        const titlePrefix = item.title.replace(/[^\w\s가-힣]/g, "").slice(0, 25);
        const { data: existing } = await supabase
          .from("community_posts")
          .select("id")
          .ilike("title", `%${titlePrefix}%`)
          .limit(1);

        if (existing && existing.length > 0) {
          results.skipped++;
          continue;
        }

        // ── Claude로 게시글 생성 ──────────────────────────────────────────────
        const post = await generatePost(item);
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
          console.error("[sync-news] DB insert error:", dbError.message);
          results.errors++;
        } else {
          results.inserted++;
          results.details.push(`✅ "${post.title.slice(0, 30)}..."`);
        }
      }
    } catch (err) {
      console.error(`[sync-news] query "${queryConfig.query}" failed:`, err);
      results.errors++;
    }
  }

  return NextResponse.json({
    success: true,
    inserted: results.inserted,
    skipped: results.skipped,
    errors: results.errors,
    details: results.details,
    syncedAt: new Date().toISOString(),
  });
}
