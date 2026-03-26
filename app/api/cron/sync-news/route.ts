/**
 * Cron endpoint: Google News RSS → Claude AI 요약 → 커뮤니티 자동 포스팅
 * Schedule: 매시 정각 (0 * * * *) — vercel.json 참고
 *
 * Flow:
 *  1. rss-parser로 Google News RSS 수집 (손흥민, 토트넘, 프리미어리그)
 *  2. 기사 URL 기준 중복 확인 (community_posts.content에 링크 포함 여부)
 *  3. Claude (claude-haiku-4-5-20251001)로 한국어 축구 팬 스타일 요약 생성
 *  4. community_posts 테이블에 insert (image_url 포함)
 *
 * Env vars:
 *   CRON_SECRET              – cron 인증 시크릿
 *   ANTHROPIC_API_KEY        – Anthropic API 키
 *   NEWS_BOT_AUTHOR_ID       – 뉴스봇 Supabase profiles.id
 *   SUPABASE_SERVICE_ROLE_KEY – RLS 우회용 서비스 키
 */

import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import Parser from "rss-parser";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

// ─── 설정 ────────────────────────────────────────────────────────────────────

interface NewsQuery {
  query:    string;
  tags:     string[];
  category: string;
  maxItems?: number; // 미지정 시 MAX_ITEMS_PER_QUERY 사용
}

const NEWS_QUERIES: NewsQuery[] = [
  // EPL
  { query: "손흥민",           tags: ["손흥민", "토트넘", "EPL"],               category: "match-discussion" },
  { query: "토트넘",           tags: ["토트넘", "EPL", "프리미어리그"],         category: "match-discussion" },
  { query: "프리미어리그 이적", tags: ["이적", "EPL", "프리미어리그"],          category: "transfer-news"   },
  // 월드컵 — 한국 우선
  { query: "대한민국 월드컵",   tags: ["대한민국", "월드컵", "2026", "국대"],   category: "worldcup-2026", maxItems: 3 },
  { query: "손흥민 월드컵",     tags: ["손흥민", "월드컵", "2026"],             category: "worldcup-2026", maxItems: 2 },
  { query: "홍명보",            tags: ["홍명보", "감독", "국가대표"],            category: "worldcup-2026", maxItems: 2 },
  // 월드컵 일반
  { query: "2026 월드컵",      tags: ["월드컵", "2026", "북중미", "FIFA"],     category: "worldcup-2026", maxItems: 2 },
];

// ─── 카테고리 / 태그 감지 ────────────────────────────────────────────────────

// 월드컵 키워드 — 다른 쿼리에서 감지되면 worldcup-2026으로 오버라이드
const WORLDCUP_KEYWORDS = ["월드컵", "world cup", "worldcup", "북중미", "2026 fifa", "월드컵 예선", "월드컵 본선"];

// 한국 관련 키워드 — 감지 시 [KOR] 접두어 추가
const KOREA_KEYWORDS = ["대한민국", "태극전사", "홍명보", "한국 축구", "한국대표", "국가대표팀", "korea national", "korean team", "손흥민 국대"];

function resolveCategory(defaultCategory: string, title: string, description: string): string {
  const haystack = `${title} ${description}`.toLowerCase();
  if (WORLDCUP_KEYWORDS.some((kw) => haystack.includes(kw))) return "worldcup-2026";
  return defaultCategory;
}

function isKoreanRelated(title: string, description: string): boolean {
  const haystack = `${title} ${description}`.toLowerCase();
  return KOREA_KEYWORDS.some((kw) => haystack.includes(kw.toLowerCase()));
}

// ─── D-Day 계산 ──────────────────────────────────────────────────────────────

const WORLDCUP_OPENING = new Date("2026-06-11T00:00:00+09:00"); // KST 기준

function getDDayPrefix(): string {
  const diffMs  = WORLDCUP_OPENING.getTime() - Date.now();
  const days    = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  if (days > 0)   return `[D-${days}]`;
  if (days === 0)  return `[D-Day]`;
  return `[D+${Math.abs(days)}]`;
}

const MAX_ITEMS_PER_QUERY = 3; // 키워드당 3건, 총 최대 9건
const CLAUDE_MODEL        = "claude-haiku-4-5-20251001";
const DESC_MAX_CHARS      = 800;

// ─── Claude AI 요약 ──────────────────────────────────────────────────────────

async function generatePost(
  title: string,
  description: string,
  anthropicKey: string
): Promise<{ post: { title: string; content: string } | null; error: string }> {
  const prompt = `너는 KickVista 축구 커뮤니티의 뉴스 에디터야.
아래 뉴스 기사를 한국어 축구 팬 커뮤니티 게시글로 자연스럽게 작성해줘.

[기사 제목] ${title}
[기사 내용] ${description.substring(0, DESC_MAX_CHARS)}

작성 규칙:
1. 제목: 한국어, 50자 이내, 이모지 1개 포함
2. 본문: 핵심 내용 3~4문단 (총 250~350자), 열정적이고 자연스러운 팬 커뮤니티 어조
3. 출처나 AI 관련 문구 없이 팬이 직접 쓴 글처럼 마무리

JSON만 응답 (다른 텍스트 없이):
{"title":"제목","content":"본문"}`;

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type":    "application/json",
        "x-api-key":       anthropicKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model:      CLAUDE_MODEL,
        max_tokens: 1024,
        messages:   [{ role: "user", content: prompt }],
      }),
    });

    const rawBody = await res.text();
    console.log(`[sync-news] Claude response [${res.status}]:`, rawBody.slice(0, 300));

    if (!res.ok) {
      return { post: null, error: `HTTP ${res.status}: ${rawBody.slice(0, 200)}` };
    }

    const data = JSON.parse(rawBody) as {
      content?: Array<{ type: string; text?: string }>;
    };
    const text = data.content?.find((b) => b.type === "text")?.text ?? "";

    // JSON 블록 추출 — Claude가 코드펜스(```json ... ```)로 감싸는 경우도 처리
    const jsonMatch = text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/) ??
                      text.match(/(\{[\s\S]*\})/);
    if (!jsonMatch) return { post: null, error: "JSON not found in response" };

    let parsed: { title?: string; content?: string };
    try {
      parsed = JSON.parse(jsonMatch[1] ?? jsonMatch[0]) as { title?: string; content?: string };
    } catch {
      // 제어 문자 제거 후 재시도
      const cleaned = (jsonMatch[1] ?? jsonMatch[0]).replace(/[\x00-\x1F\x7F]/g, " ");
      parsed = JSON.parse(cleaned) as { title?: string; content?: string };
    }
    if (!parsed.title || !parsed.content) return { post: null, error: "title/content missing" };

    return { post: { title: parsed.title, content: parsed.content }, error: "" };
  } catch (err) {
    const msg = String(err);
    console.error("[sync-news] Claude error:", msg);
    return { post: null, error: msg };
  }
}

// ─── RSS 이미지 URL 추출 ──────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractImageUrl(item: any): string | null {
  // enclosure 태그 (일부 RSS 피드)
  if (item.enclosure?.url && typeof item.enclosure.url === "string") {
    return item.enclosure.url;
  }
  // <media:content url="..."> 태그 (Google News 등)
  const mediaContent = item["media:content"];
  if (mediaContent) {
    const url = Array.isArray(mediaContent)
      ? mediaContent[0]?.["$"]?.url
      : mediaContent?.["$"]?.url;
    if (url && typeof url === "string") return url;
  }
  // content/description HTML에서 첫 번째 img src 추출
  const html = item.content ?? item["content:encoded"] ?? "";
  const imgMatch = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (imgMatch?.[1]) return imgMatch[1];

  return null;
}

// ─── Cron handler ─────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (!anthropicKey) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY not configured." }, { status: 500 });
  }
  const botAuthorId = process.env.NEWS_BOT_AUTHOR_ID;
  if (!botAuthorId) {
    return NextResponse.json({ error: "NEWS_BOT_AUTHOR_ID not configured." }, { status: 500 });
  }

  const supabase = createAdminClient();
  const parser   = new Parser({
    timeout: 10_000,
    customFields: {
      item: [["media:content", "media:content"]],
    },
  });

  const results = {
    inserted: 0, skipped: 0, errors: 0,
    posts: [] as string[], errorMessages: [] as string[],
  };

  for (const queryConfig of NEWS_QUERIES) {
    try {
      const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(queryConfig.query)}&hl=ko&gl=KR&ceid=KR:ko`;
      const feed   = await parser.parseURL(rssUrl);
      const items  = feed.items.slice(0, queryConfig.maxItems ?? MAX_ITEMS_PER_QUERY);
      console.log(`[sync-news] query "${queryConfig.query}" — ${items.length} items fetched`);

      for (const item of items) {
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

        // 이미지 URL 추출
        const imageUrl = extractImageUrl(item);
        console.log(`[sync-news] image: ${imageUrl ?? "none"} — ${title.slice(0, 30)}`);

        // 카테고리 결정 (월드컵 키워드 감지 시 오버라이드)
        const category = resolveCategory(queryConfig.category, title, description);

        // Claude 요약 생성
        const { post, error: claudeError } = await generatePost(title, description, anthropicKey);

        if (!post) {
          results.errors++;
          results.errorMessages.push(`[Claude] ${title.slice(0, 30)}: ${claudeError}`);
          console.error(`[sync-news] Claude failed: ${claudeError}`);
          continue;
        }

        // 제목 접두어 조립
        const isKorea    = isKoreanRelated(title, description);
        const ddayPrefix = category === "worldcup-2026" ? `${getDDayPrefix()} ` : "";
        const korPrefix  = isKorea ? "[KOR] " : "";
        const finalTitle = `${ddayPrefix}${korPrefix}${post.title}`.slice(0, 120);

        // DB insert
        const { error: dbError } = await supabase.from("community_posts").insert({
          author_id: botAuthorId,
          category,
          title:     finalTitle,
          content:   post.content,
          tags:      [
            ...queryConfig.tags,
            ...(category === "worldcup-2026" ? ["월드컵", "2026"] : []),
            ...(isKorea ? ["대한민국", "태극전사"] : []),
            "AI뉴스", "자동포스팅",
          ],
          image_url: imageUrl,
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
          // Next.js 라우터 캐시 무효화 — 커뮤니티 목록에 즉시 반영
          revalidatePath("/[locale]/community", "page");
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
    `[sync-news] done — inserted:${results.inserted} skipped:${results.skipped} errors:${results.errors}`
  );

  return NextResponse.json({
    success:       true,
    model:         CLAUDE_MODEL,
    inserted:      results.inserted,
    skipped:       results.skipped,
    errors:        results.errors,
    posts:         results.posts,
    errorMessages: results.errorMessages,
    syncedAt:      new Date().toISOString(),
  });
}
