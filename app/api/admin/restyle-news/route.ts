/**
 * POST /api/admin/restyle-news
 * 뉴스봇이 작성한 기존 게시글을 새 스타일(해요체 + 팬 리액션 + 원문 링크)로 업데이트
 *
 * Body (optional):
 *   { limit?: number }   — 한 번에 처리할 최대 게시글 수 (기본 20)
 */

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getServerRole } from "@/lib/admin/roles";

export const runtime  = "nodejs";
export const dynamic  = "force-dynamic";
export const maxDuration = 300;

const CLAUDE_MODEL = "claude-haiku-4-5-20251001";

async function rewritePost(
  title: string,
  content: string,
  anthropicKey: string
): Promise<{ title: string; content: string } | null> {
  const prompt = `너는 KickVista 축구 커뮤니티의 열정적인 뉴스 에디터야.
아래는 기존에 작성된 축구 뉴스 게시글이야. 이 내용을 유지하면서 아래 규칙대로 다시 써줘.

[기존 제목] ${title}
[기존 본문] ${content.substring(0, 1000)}

재작성 규칙:
1. 제목: 한국어, 50자 이내, 이모지 1개 포함 (기존 제목 기반으로 자연스럽게)
2. 말투: 딱딱한 설명조를 버리고 정중하고 친근한 해요체로 작성해요. (예: "~했네요!", "~라고 하더라고요", "정말 기대되지 않나요?")
3. 본문: 핵심 내용 3~4문단 (총 250~350자). 단순 요약을 넘어 팬으로서의 솔직한 리액션과 기대감을 자연스럽게 섞어줘요.
4. 기존 본문에 [기사 원문 보기] 링크가 있으면 그대로 마지막 줄에 유지해줘요. 없으면 추가하지 마세요.
5. "이 소식은 AI를 통해" 또는 출처·AI 관련 문구는 절대 포함하지 마세요.

JSON만 응답 (다른 텍스트 없이):
{"title":"제목","content":"본문"}`;

  try {
    const controller = new AbortController();
    const timeoutId  = setTimeout(() => controller.abort(), 25_000);

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type":      "application/json",
        "x-api-key":         anthropicKey,
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

    if (!res.ok) return null;

    const data = await res.json() as {
      content?: Array<{ type: string; text?: string }>;
    };
    const text = data.content?.find((b) => b.type === "text")?.text ?? "";

    const jsonMatch = text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/) ??
                      text.match(/(\{[\s\S]*\})/);
    if (!jsonMatch) return null;

    let parsed: { title?: string; content?: string };
    try {
      parsed = JSON.parse(jsonMatch[1] ?? jsonMatch[0]) as { title?: string; content?: string };
    } catch {
      const cleaned = (jsonMatch[1] ?? jsonMatch[0]).replace(/[\x00-\x1F\x7F]/g, " ");
      parsed = JSON.parse(cleaned) as { title?: string; content?: string };
    }

    if (!parsed.title || !parsed.content) return null;
    return { title: parsed.title, content: parsed.content };
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  // 어드민 권한 확인
  const role = await getServerRole();
  if (role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (!anthropicKey) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY not configured" }, { status: 500 });
  }

  const botAuthorId = process.env.NEWS_BOT_AUTHOR_ID;
  if (!botAuthorId) {
    return NextResponse.json({ error: "NEWS_BOT_AUTHOR_ID not configured" }, { status: 500 });
  }

  const body = await request.json().catch(() => ({})) as { limit?: number };
  const limit = Math.min(body.limit ?? 20, 50); // 최대 50개

  const supabase = createAdminClient();

  // 뉴스봇 게시글 가져오기
  const { data: posts, error: fetchError } = await supabase
    .from("community_posts")
    .select("id, title, content")
    .eq("author_id", botAuthorId)
    .contains("tags", ["AI뉴스"])
    .order("created_at", { ascending: false })
    .limit(limit);

  if (fetchError || !posts) {
    return NextResponse.json({ error: fetchError?.message ?? "fetch failed" }, { status: 500 });
  }

  const results = { updated: 0, failed: 0, ids: [] as string[] };

  for (const post of posts) {
    const rewritten = await rewritePost(post.title, post.content, anthropicKey);

    if (!rewritten) {
      results.failed++;
      continue;
    }

    // D-Day / [KOR] 접두어 유지 (제목 앞부분)
    const prefixMatch = post.title.match(/^(\[D[+-]\d+\]\s*)?(\[KOR\]\s*)?/);
    const prefix = prefixMatch ? prefixMatch[0] : "";
    const finalTitle = (prefix + rewritten.title).slice(0, 120);

    const { error: updateError } = await supabase
      .from("community_posts")
      .update({ title: finalTitle, content: rewritten.content })
      .eq("id", post.id);

    if (updateError) {
      results.failed++;
    } else {
      results.updated++;
      results.ids.push(post.id);
    }
  }

  return NextResponse.json({
    success: true,
    total:   posts.length,
    updated: results.updated,
    failed:  results.failed,
    ids:     results.ids,
  });
}
