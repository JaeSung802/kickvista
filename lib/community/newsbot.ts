/**
 * News-bot posts (written by /api/cron/sync-news) — identification and the
 * source link it appends to the body. Display only: nothing here fetches the
 * source article, and titles/bodies are never rewritten.
 *
 * Identification needs BOTH the bot author and the bot tag. Any user can type
 * "AI뉴스" as a tag, so the tag alone must never mark a user's post as AI
 * generated. The bot author comes from the server-only env
 * NEWS_BOT_DISPLAY_AUTHOR_ID, which is read for display only. It deliberately
 * does NOT fall back to NEWS_BOT_AUTHOR_ID: that variable gates the publishing
 * routes (sync-news / restyle-news), so turning labels on must never require
 * setting it. Without the display variable nothing is labelled (fail-safe).
 */

export const NEWS_BOT_TAG = "AI뉴스";

export function isNewsBotPost(post: { authorId: string | null | undefined; tags: string[] | null | undefined }): boolean {
  const botId = process.env.NEWS_BOT_DISPLAY_AUTHOR_ID?.trim();
  if (!botId || !post.authorId) return false;
  return post.authorId === botId && (post.tags ?? []).includes(NEWS_BOT_TAG);
}

/** The bot ends its body with `[기사 원문 보기](URL)` (see sync-news). The address runs to the
 * last ")" before whitespace, so a malformed value such as "javascript:alert(1)" is taken whole. */
const SOURCE_LINK_RE = /\[기사 원문 보기\]\((\S*)\)/g;

export type NewsSource =
  | { kind: "ok"; url: string }
  | { kind: "invalid" }   // the link text is there but the address is not an http(s) URL
  | { kind: "missing" };  // no source link in the body

/**
 * Splits a bot body into the text to show and its source link. Uses the last
 * `[기사 원문 보기](…)` occurrence and removes only that occurrence from the text.
 */
export function splitNewsSource(content: string): { body: string; source: NewsSource } {
  const matches = [...content.matchAll(SOURCE_LINK_RE)];
  const last = matches.at(-1);
  if (!last || last.index === undefined) return { body: content, source: { kind: "missing" } };
  const body = (content.slice(0, last.index) + content.slice(last.index + last[0].length)).trimEnd();
  let url: URL | null = null;
  try { url = new URL(last[1]); } catch { url = null; }
  const ok = !!url && (url.protocol === "http:" || url.protocol === "https:") && !!url.hostname;
  return { body, source: ok ? { kind: "ok", url: url!.toString() } : { kind: "invalid" } };
}

export const STALE_AFTER_DAYS = 30;

/** True when the post was registered STALE_AFTER_DAYS or more days ago (registration date, not the source's date). */
export function isStaleNewsPost(createdAt: string, now: number = Date.now()): boolean {
  const t = new Date(createdAt).getTime();
  return Number.isFinite(t) && now - t >= STALE_AFTER_DAYS * 86_400_000;
}
