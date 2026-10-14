/**
 * Cron endpoint: Google News RSS → Claude AI 요약 → 커뮤니티 자동 포스팅
 * Schedule: Vercel cron에 등록되어 있지 않음 (vercel.json에서 제거됨).
 *   이 endpoint는 인증된 수동 실행 또는 향후 스케줄 재등록을 위해 유지합니다.
 *   CRON_SECRET 미설정 시 503, Authorization 불일치 시 401로 차단합니다.
 *   월드컵 전용 쿼리·카테고리 분류·제목 접두어는 제거되었습니다.
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
}

const NEWS_QUERIES: NewsQuery[] = [
  // EPL
  { query: "손흥민",           tags: ["손흥민", "토트넘", "EPL"],               category: "match-discussion" },
  { query: "토트넘",           tags: ["토트넘", "EPL", "프리미어리그"],         category: "match-discussion" },
  { query: "프리미어리그 이적", tags: ["이적", "EPL", "프리미어리그"],          category: "transfer-news"   },
];

// ─── 카테고리 / 태그 감지 ────────────────────────────────────────────────────

// 한국 관련 키워드 — 감지 시 [KOR] 접두어 추가
const KOREA_KEYWORDS = ["대한민국", "태극전사", "홍명보", "한국 축구", "한국대표", "국가대표팀", "korea national", "korean team", "손흥민 국대"];

function isKoreanRelated(title: string, description: string): boolean {
  const haystack = `${title} ${description}`.toLowerCase();
  return KOREA_KEYWORDS.some((kw) => haystack.includes(kw.toLowerCase()));
}

// ─── SEO 키워드 접두어 & 슬러그 ───────────────────────────────────────────────

/**
 * 태그·카테고리 기반으로 제목 앞에 붙일 SEO 키워드를 반환합니다.
 * 예: [손흥민], [이적]
 */
const TAG_KEYWORD_PRIORITY: [string, string][] = [
  // [태그 값,  노출 키워드]  — 순서 = 우선순위
  ["손흥민",        "손흥민"],
  ["홍명보",        "홍명보"],
  ["토트넘",        "토트넘"],
  ["이적",          "이적"],
  ["프리미어리그",  "EPL"],
];

function getKeywordPrefix(category: string, tags: string[]): string {
  if (category === "transfer-news") return "[이적] ";
  for (const [tag, label] of TAG_KEYWORD_PRIORITY) {
    if (tags.includes(tag)) return `[${label}] `;
  }
  return "";
}

/**
 * 제목 → SEO 친화적 URL 슬러그 변환
 * - 대괄호 접두어 제거 ([D-XX], [KOR] 등)
 * - 이모지 제거
 * - 한글·영숫자·하이픈만 허용
 *
 * 사용 예: "손흥민-토트넘-2-1-승리"
 *
 * ⚠️  DB에 slug 컬럼 추가 후 아래 insert 부분의 주석을 해제하세요:
 *    ALTER TABLE community_posts ADD COLUMN slug TEXT;
 *    CREATE UNIQUE INDEX ON community_posts (slug);
 */
export function titleToSlug(title: string): string {
  return title
    .replace(/\[[^\]]*\]/g, "")                              // [D-XX], [KOR] 등 제거
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, "") // 이모지 제거
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\uAC00-\uD7A3-]/gu, "")                    // 한글 + 영숫자 + 하이픈만 허용
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

const MAX_ITEMS_PER_QUERY = 3; // 키워드당 3건, 총 최대 9건
const CLAUDE_MODEL        = "claude-haiku-4-5-20251001";
const DESC_MAX_CHARS      = 800;

// ─── Claude AI 요약 ──────────────────────────────────────────────────────────

async function generatePost(
  title: string,
  description: string,
  anthropicKey: string,
  articleUrl: string
): Promise<{ post: { title: string; content: string } | null; error: string }> {
  const prompt = `너는 KickVista 축구 커뮤니티의 열정적인 뉴스 에디터야.
아래 뉴스 기사를 읽고, 축구 팬들이 즐겁게 읽을 수 있는 커뮤니티 게시글로 작성해줘.

[기사 제목] ${title}
[기사 내용] ${description.substring(0, DESC_MAX_CHARS)}

작성 규칙:
1. 제목: 한국어, 50자 이내, 이모지 1개 포함
2. 말투: 딱딱한 설명조가 아닌 정중하고 친근한 '해요체'로 작성해요. (예: "~했네요!", "~라고 하더라고요", "정말 기대되지 않나요?")
3. 본문: 핵심 내용 3~4문단 (총 250~350자). 단순 요약을 넘어 팬으로서의 솔직한 리액션과 기대감을 자연스럽게 섞어줘요.
4. 마무리: 본문 마지막 줄에 딱 한 줄, 아래 형식으로 원문 링크를 넣어줘요:
   [기사 원문 보기](${title.slice(0, 10)}...)
   — 단, URL은 절대 임의로 만들지 말고 반드시 content 필드의 맨 마지막 줄에 마크다운 링크 플레이스홀더로만 남겨줘: [기사 원문 보기](ARTICLE_URL)
5. "이 소식은 AI를 통해" 또는 출처·AI 관련 문구는 절대 포함하지 마세요.

JSON만 응답 (다른 텍스트 없이):
{"title":"제목","content":"본문 ... [기사 원문 보기](ARTICLE_URL)"}`;

  try {
    const controller = new AbortController();
    const timeoutId  = setTimeout(() => controller.abort(), 25_000); // 25초 타임아웃

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
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

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

    // ARTICLE_URL 플레이스홀더를 실제 기사 URL로 교체
    const content = parsed.content.replace("ARTICLE_URL", articleUrl);

    return { post: { title: parsed.title, content }, error: "" };
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
  // Fail closed: without a configured secret the job never runs, so the
  // endpoint can't be triggered anonymously (RSS + Anthropic cost, posting).
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: "Cron is not configured." }, { status: 503 });
  }
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${cronSecret}`) {
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
      const items  = feed.items.slice(0, MAX_ITEMS_PER_QUERY);
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

        // 카테고리: 쿼리에 선언된 기본 카테고리를 그대로 사용
        const category = queryConfig.category;

        // Claude 요약 생성
        const { post, error: claudeError } = await generatePost(title, description, anthropicKey, link);

        if (!post) {
          results.errors++;
          results.errorMessages.push(`[Claude] ${title.slice(0, 30)}: ${claudeError}`);
          console.error(`[sync-news] Claude failed: ${claudeError}`);
          continue;
        }

        // 제목 접두어 조립: [키워드] [KOR] AI제목
        const isKorea    = isKoreanRelated(title, description);
        const kwPrefix   = getKeywordPrefix(category, queryConfig.tags);
        const korPrefix  = isKorea ? "[KOR] " : "";
        const finalTitle = `${kwPrefix}${korPrefix}${post.title}`.slice(0, 120);

        // DB insert
        const { error: dbError } = await supabase.from("community_posts").insert({
          author_id: botAuthorId,
          category,
          title:     finalTitle,
          content:   post.content,
          tags:      [
            ...queryConfig.tags,
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
